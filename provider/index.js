const FeedController = require('./lib/feed_controller.js')
const express = require('express')
const bodyparser = require('body-parser')
const app = express()
app.use(bodyparser.json())

// NEED TO HOOK UP REST API TO FEED CONTROLLER.
app.post('/mqtt', function (req, res) {
  console.dir(req.body)
  const mqtt = req.body.mqtt
  if (mqtt) {
  }
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('MQTT Trigger Provider listening on port 3000!')
})

const Cloudant = require('cloudant');
const appEnv = require("cfenv").getAppEnv()
 
const creds = appEnv.getServiceCreds(/cloudant/i)

if (!creds) {
  console.error('Missing cloudant credentials...')
  process.exit(1)
}
 
// Initialize the library with my account. 
const cloudant = Cloudant({account:creds.username, password:creds.password});
 
const feed_controller = new FeedController(cloudant.db.use('topic_listeners'), 'https://openwhisk.ng.bluemix.net/api/v1/')
feed_controller.initialise()
