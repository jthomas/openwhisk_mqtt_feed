function main (msg) {
  console.dir(msg);
  if (msg.lifecycleEvent === 'CREATE') {
    create(msg);
  } else if (msg.lifecycleEvent === 'DELETE') {
    remove(msg)
  }

 // return whisk.async();
}

function create (msg) {
  var user_pass = msg.authKey.split(':');
  var body = {
    trigger: msg.triggerName.slice(1),
    url: msg.url,
    topic: msg.topic,
    username: user_pass[0],
    password: user_pass[1]
  }
  console.dir(body)
}

function remove (msg) {
}
