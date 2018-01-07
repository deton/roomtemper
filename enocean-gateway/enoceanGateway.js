const http = require('http');
const url = require('url');
const enocean = require('node-enocean-utils');

const SERVERURL = process.argv[2] || 'http://192.168.179.6/cgi-bin/roomtemper.cgi';
// 'https://XXXX.hipchat.com/v2/room/YYYY/notification?auth_token=ZZZZ'
const HIPCHATURL = process.argv[3];

enocean.teach({
  'id'  : '00 00 04 00 FE EF', // XXX: change this
  'eep' : 'A5-02-05',
  'name': 'STM431J Temperature Sensor'
});
enocean.teach({
  "id"  : "00 00 04 00 E5 9E", // XXX: change this
  "eep" : "D5-00-01",
  "name": "STM250J Door Sensor"
});

var isCloseCurrent = false;

enocean.startMonitor({
  'path': '/dev/ttyUSB0'
}).then(function (gateway) {
  enocean.on('data-known', function (telegram) {
    if (telegram.message.eep == 'D5-00-01') { // STM250J Door Sensor
      var isClose = (telegram.message.value.contact == 1);
      if (isClose != isCloseCurrent) {
        isCloseCurrent = isClose;
        var now = new Date();
        var msg;
        if (isClose) {
          msg = 'window is closed at ' + now.toISOString();
        } else {
          msg = 'window is OPENED at ' + now.toISOString();
        }
        hipchatPost(msg, isClose ? 'yellow' : 'gray');
      }
    } else if (telegram.message.eep == 'A5-02-05') { // STM431J Temperature Sensor
      httpPost({
        date: (Date.now() / 1000).toFixed(),
        temp: telegram.message.value.temperature
      });
    }
  });
}).catch(function (error) {
  console.error(error);
});

function httpPost(data) {
  var body = data.date + ':' + data.temp;
  console.log(body);
  var reqopt = url.parse(SERVERURL);
  reqopt.method = 'POST';
  reqopt.headers = {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(body)
  };
  var req = http.request(reqopt, function (res) {
    res.on('data', function (chunk) {
    });
    res.on('end', function () {
    });
  });
  req.on('error', function (e) {
    console.log('http post error ' + e);
  });
  req.on('timeout', function () {
    console.log('http request timeout');
    req.abort(); // triggers 'error' event. 'Error: socket hang up'
  })
  req.setTimeout(5000);
  req.write(body);
  req.end();
}

function hipchatPost(msg, color) {
  console.log(msg);
  if (!HIPCHATURL) {
    return;
  }
  var body = JSON.stringify({
    message: msg,
    notify: false,
    message_format: 'text',
    color: color
  });
  var reqopt = url.parse(HIPCHATURL);
  reqopt.method = 'POST';
  reqopt.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  };
  var req = http.request(reqopt, function (res) {
    res.on('data', function (chunk) {
    });
    res.on('end', function () {
    });
  });
  req.on('error', function (e) {
    console.log('hipchat post error ' + e);
  });
  req.on('timeout', function () {
    console.log('hipchat request timeout');
    req.abort(); // triggers 'error' event. 'Error: socket hang up'
  })
  req.setTimeout(5000);
  req.write(body);
  req.end();
}
