import test from 'ava'
import TriggerStore from '../lib/trigger_store.js'

test.beforeEach(t => {
  t.context.db = {
    insert: (details, id, cb) => {
      t.context.details = details
      t.context.id = id 
      t.context.cb = cb
    },

    get: (id, cb) => {
      t.context.id = id
      cb(null, {_id: id, _rev: 'xxx'})
    },

    destroy: (id, rev, cb) => {
      t.context.id = id
      t.context.rev = rev
      t.context.cb = cb
      cb(null)
    },

    view: (design, view, params, cb) => {
      t.context.params = params
      const body = {rows: [{key: 'a', value: 'a'}, {key: 'b', value: 'b'}, {key: 'c', value: 'c'}]}
      if (!cb) params(null, body)
      else cb(null, body)
    }
  }
})

test('should add trigger to store', t => {
  const store = new TriggerStore(t.context.db)

  const trigger = {trigger: 'blah', url: 'blah', auth:{}}
  const result = store.add(trigger).then(() => {
     t.is(t.context.details, trigger)
     t.is(t.context.id, trigger.trigger)
  })
  t.context.cb()
  return result
})

test('should handle trigger add failure', t => {
  const store = new TriggerStore(t.context.db)

  const trigger = {trigger: 'blah', url: 'blah', auth:{}}
  const result = store.add(trigger)
  t.throws(result)
  t.context.cb(true)
})

test('should remove trigger from store', t => {
  const store = new TriggerStore(t.context.db)

  const trigger = 'blah'
  const result = store.remove(trigger).then(() => {
    t.is(t.context.id, trigger)
    t.is(t.context.rev, 'xxx')
  }).catch(e => console.log(e))
  return result
})

test('should retrieve triggers for url and topic', t => {
  const store = new TriggerStore(t.context.db)
  const url = 'sample'
  const topic = 'sample'

  return store.triggers(url, topic).then((triggers) => {
    t.deepEqual(triggers, ['a', 'b', 'c'])
    t.deepEqual(t.context.params, {startkey: `${url}#${topic}`, endkey: `${url}#${topic}`})
  }).catch(e => console.log(e))
})

test('should retrieve all subscribers', t => {
  const store = new TriggerStore(t.context.db)

  return store.subscribers().then(subscribers => {
    t.deepEqual(subscribers, [{trigger: 'a', topic: 'a'}, {trigger: 'b', topic: 'b'}, {trigger: 'c', topic: 'c'}])
  }).catch(e => console.log(e))
})
