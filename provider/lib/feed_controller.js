const mqtt = require('mqtt')
const openwhisk = require('openwhisk')
const MQTTSubscriptionMgr = require('./mqtt_subscription_mgr.js')
const TriggerStore = require('./trigger_store.js')

class FeedController {
  constructor (db, ow_endpoint) {
    this.mqtt_subscription_mgr = new MQTTSubscriptionMgr(mqtt)
    this.trigger_store = new TriggerStore(db)
    this.ow_endpoint = ow_endpoint
  }

  initialise () {
    const mgr = this.mqtt_subscription_mgr
    mgr.on('message', (url, topic, message) => this.on_message(url, topic, message))
    return this.trigger_store.subscribers().then(subscribers => {
       subscribers.forEach(s => mgr.subscribe.apply(mgr, s.topic.split('#')))
    }).catch(err => console.error('Error initialising subscribers from store.' , err))
  }

  on_message (url, topic, message) {
    console.log(`Message received (${url}) #${topic}: ${message}`)
    this.trigger_store.triggers(url, topic).then(triggers => {
      triggers.forEach(trigger => this.fire_trigger(trigger))
    }).catch(err => console.error('Unable to forward message to triggers.', err))
  }

  fire_trigger (trigger) {
    console.log(`Firing trigger: ${trigger.trigger}`)
    const [namespace, name] = trigger.trigger.split('/')
    var ow = openwhisk({api: this.ow_endpoint, api_key: `${trigger.username}:${trigger.password}`, namespace: namespace});
    ow.triggers.invoke({triggerName: name})
      .then(() => console.log(`Fired trigger: ${trigger.trigger}`))
      .catch(err => console.error(`Failed to fire trigger ${trigger.trigger}`, err))
  }

  add_trigger (trigger) {
    const mgr = this.mqtt_subscription_mgr
    return this.trigger_store.add(trigger).then(() => mgr.subscribe(trigger.url, trigger.topic))
      .catch(err => console.error('Error adding trigger subscription.' , err))
  }

  remove_trigger (trigger) {
    const mgr = this.mqtt_subscription_mgr
    return this.trigger_store.remove(trigger).then(() => mgr.unsubscribe(trigger.url, trigger.topic))
      .catch(err => console.error('Error removing trigger subscription.' , err))
  }
}

module.exports = FeedController
