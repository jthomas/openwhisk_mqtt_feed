const express = require('express')
const Cloudant = require('cloudant');
const FeedController = require('./lib/feed_controller.js')

// setup express for handling HTTP requests
const app = express()
const bodyparser = require('body-parser')
app.use(bodyparser.json())

// extract cloudant credentials from environment
const appEnv = require("cfenv").getAppEnv()
const creds = appEnv.getServiceCreds(/cloudant/i)

if (!creds) {
  console.error('Missing cloudant credentials...')
  process.exit(1)
}
 
const cloudant = Cloudant({account:creds.username, password:creds.password})
const feed_controller = new FeedController(cloudant.db.use('topic_listeners'), 'https://openwhisk.ng.bluemix.net/api/v1/')

feed_controller.initialise().then(() => {

  app.post('/mqtt', function (req, res) {
    // todo: need to validate incoming parameters
    // trigger (namespace/name), url, topic, username, password
    feed_controller.add_trigger(req.body).then(() => res.send())
      .catch(err => res.status(500).json({ error: 'failed to add MQTT topic trigger'}))
  })

  app.delete('/mqtt/:namespace/:trigger', (req, res) => {
    console.log(req.params)
    feed_controller.remove_trigger(req.params.namespace, req.params.trigger).then(() => res.send())
      .catch(err => res.status(500).json({ error: 'failed to remove MQTT topic trigger'}))
  })

  app.listen(3000, function () {
    console.log('MQTT Trigger Provider listening on port 3000!')
  })
})
