import test from 'ava'
import EventEmitter from 'events'
import MQTTSubscriptionMgr from '../lib/mqtt_subscription_mgr.js'

class StubClient extends EventEmitter {
  constructor () {
    super()
    this.topics = []
  }
  subscribe (topic) {
    this.topics.push(topic)
  }
  unsubscribe (topic) {
  }
  end () {
  }
}

test.beforeEach(t => {
  t.context.mqtt = {
    connect: (url) => {
      t.context.connects = (t.context.connects || 0) + 1
      t.context.connect_url = url
      t.context.client = new StubClient()
      return t.context.client
    },
    end: () => {
    }
  }
})

test('should create connection for first topic subscriber', t => {
  const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
  const url = 'mqtt://sample.host.name:1883'
  const topic = 'testing'
  mqtt_subscription_mgr.subscribe(url, topic)
  t.is(t.context.connect_url, url)
  t.deepEqual(t.context.client.topics, ['testing'])
  const conns = mqtt_subscription_mgr.connections.get(url)
  t.is(conns.topics.size, 1)
  t.true(conns.topics.has(topic))
  t.is(conns.topics.get(topic), 1)
})

test('should create connections for multiple different hosts', t => {
  const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
  const url_1 = 'mqtt://sample.host.name:1883'
  const url_2 = 'mqtt://sample.host.name:1884'
  const topic = 'testing'
  mqtt_subscription_mgr.subscribe(url_1, topic)
  mqtt_subscription_mgr.subscribe(url_2, topic)
  t.deepEqual(t.context.client.topics, ['testing'])
  let conns = mqtt_subscription_mgr.connections.get(url_1)
  t.is(conns.topics.size, 1)
  t.true(conns.topics.has(topic))
  t.is(conns.topics.get(topic), 1)
  conns = mqtt_subscription_mgr.connections.get(url_2)
  t.is(conns.topics.size, 1)
  t.true(conns.topics.has(topic))
  t.is(conns.topics.get(topic), 1)
  t.is(t.context.connects, 2)
})

test('should create single connection for multiple subscribers to same host', t => {
  const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
  const url = 'mqtt://sample.host.name:1883'
  const topic = 'testing'
  mqtt_subscription_mgr.subscribe(url, topic)
  mqtt_subscription_mgr.subscribe(url, topic)
  mqtt_subscription_mgr.subscribe(url, topic)
  mqtt_subscription_mgr.subscribe(url, topic)
  t.is(t.context.connect_url, url)
  t.deepEqual(t.context.client.topics, ['testing'])
  const conns = mqtt_subscription_mgr.connections.get(url)
  t.is(conns.topics.size, 1)
  t.true(conns.topics.has(topic))
  t.is(conns.topics.get(topic), 4)
  t.is(t.context.connects, 1)
})

test('should fire messages for single connection', t => {
  return new Promise((resolve, reject) => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
    const url = 'mqtt://sample.host.name:1883'
    const topic = 'testing'
    const payload = 'hello_world'
    mqtt_subscription_mgr.subscribe(url, topic)
    mqtt_subscription_mgr.on('message', (url, topic, payload) => {
      t.is(url, url)
      t.is(topic, topic)
      t.is(payload, payload)
      resolve()
    })
    t.context.client.emit('message', topic, payload)
  }).catch(e => console.log(e))
})

test('should fire messages for multiple connection', t => {
  return new Promise((resolve, reject) => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
    const url_1 = 'mqtt://sample.host.name:1883'
    const topic_1 = 'testing'
    const payload_1 = 'hello_world'

    const url_2 = 'mqtt://another.host.name:1883'
    const topic_2 = 'another_topic'
    const payload_2 = 'another_hello_world'
    mqtt_subscription_mgr.subscribe(url_1, topic_1)
    mqtt_subscription_mgr.subscribe(url_2, topic_2)
    mqtt_subscription_mgr.on('message', (url, topic, payload) => {
      if (url === url_1) {
        t.is(topic_1, topic)
        t.is(payload_1, payload)
      } else if (url === url_2) {
        t.is(topic_2, topic)
        t.is(payload_2, payload)
        resolve()
      }
    })
    mqtt_subscription_mgr.connections.get(url_1).client.emit('message', topic_1, payload_1)
    mqtt_subscription_mgr.connections.get(url_2).client.emit('message', topic_2, payload_2)
  }).catch(e => console.log(e))
})

test('should unsubscribe with no listeners', t => {
  return new Promise((resolve, reject) => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
    const url = 'mqtt://sample.host.name:1883'
    const topic = 'testing'
    const payload = 'hello_world'
    mqtt_subscription_mgr.subscribe(url, topic)
    t.is(mqtt_subscription_mgr.connections.size, 1)
    mqtt_subscription_mgr.unsubscribe(url, topic)
    t.is(mqtt_subscription_mgr.connections.size, 0)
    resolve()
  })
})

test('should not unsubscribe with one listener', t => {
  return new Promise((resolve, reject) => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
    const url = 'mqtt://sample.host.name:1883'
    const topic = 'testing'
    const payload = 'hello_world'
    mqtt_subscription_mgr.subscribe(url, topic)
    mqtt_subscription_mgr.subscribe(url, topic)
    t.is(mqtt_subscription_mgr.connections.size, 1)
    mqtt_subscription_mgr.unsubscribe(url, topic)
    t.is(mqtt_subscription_mgr.connections.size, 1)
    resolve()
  })
})

test('should unsubscribe with certain listeners', t => {
  return new Promise((resolve, reject) => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)
    const url = 'mqtt://sample.host.name:1883'
    const url_2 = 'mqtt://another.host.name:1883'
    const topic = 'testing'
    const payload = 'hello_world'
    mqtt_subscription_mgr.subscribe(url, topic)
    mqtt_subscription_mgr.subscribe(url_2, topic)
    t.is(mqtt_subscription_mgr.connections.size, 2)
    mqtt_subscription_mgr.unsubscribe(url, topic)
    t.is(mqtt_subscription_mgr.connections.size, 1)
    resolve()
  })
})

test('should return client connection status for live topics', t => {
    const mqtt_subscription_mgr = new MQTTSubscriptionMgr(t.context.mqtt)

    mqtt_subscription_mgr.connections.set('connected_broker', {client: {connected: true}})
    mqtt_subscription_mgr.connections.set('disconnected_broker', {client: {connected: false}})
    t.is(false, mqtt_subscription_mgr.is_connected('sample'))
    t.is(true, mqtt_subscription_mgr.is_connected('connected_broker'))
    t.is(false, mqtt_subscription_mgr.is_connected('disconnected_broker'))
})
