var request = require('request');

function main (msg) {
  console.dir(msg);
  if (msg.lifecycleEvent === 'CREATE') {
    create(msg);
  } else if (msg.lifecycleEvent === 'DELETE') {
    remove(msg)
  }

  return whisk.async();
}

function create (msg) {
  if (!msg.hasOwnProperty('url') || !msg.hasOwnProperty('topic')) {
    return whisk.error('Missing mandatory feed properties, must include url and topic.');
  }

  var user_pass = msg.authKey.split(':');
  var body = {
    trigger: msg.triggerName,
    url: msg.url,
    topic: msg.topic,
    username: user_pass[0],
    password: user_pass[1]
  }
  console.dir(body)
  request({
    method: "POST",
    uri: msg.provider_endpoint,
    json: body
  }, handle_response);
}

function remove (msg) {
  request({
    method: "DELETE",
    uri: msg.provider_endpoint + msg.triggerName
  }, handle_response);
}

function handle_response (err, res, body) {
  if (!err && res.statusCode === 200) {
    console.log('mqtt feed: http request success.');
    return whisk.done();
  } 

  if(res) {
    console.log('mqtt feed: Error invoking provider:', res.statusCode, body);
    whisk.error(body.error);
  } else {
    console.log('mqtt feed: Error invoking provider:', err);
    whisk.error();
  }
} 
