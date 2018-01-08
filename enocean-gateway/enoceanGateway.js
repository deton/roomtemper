const http = require('http');
const Url = require('url');
const enocean = require('node-enocean-utils');

const SERVERURL = process.argv[2] || 'http://192.168.179.6/cgi-bin/roomtemper.cgi';
// url to publish window status change event
const WINDOWPUBLISHURL = process.argv[3];

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
        var status;
        if (isClose) {
          status = 'close';
        } else {
          status = 'open';
        }
        var body = Date.now() + ':' + 'win3' + ':' + status;
        console.log(body);
        if (WINDOWPUBLISHURL) {
          httpPost(WINDOWPUBLISHURL, body);
        }
      }
    } else if (telegram.message.eep == 'A5-02-05') { // STM431J Temperature Sensor

      var date = (Date.now() / 1000).toFixed();
      var temp = telegram.message.value.temperature;
      var body = 'STM431J_01:' + date + ':' + temp;
      console.log(body);
      httpPost(SERVERURL, body);
    }
  });
}).catch(function (error) {
  console.error(error);
});

function httpPost(url, body) {
  var reqopt = Url.parse(url);
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
