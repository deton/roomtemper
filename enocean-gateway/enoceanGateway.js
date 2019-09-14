const http = require('http');
const Url = require('url');
const enocean = require('node-enocean-utils');

// influxdb
const SERVERURL = process.argv[2] || 'http://192.168.179.6:8086/write?db=roomdb'; 
// url to publish window status change event
const WINDOWPUBLISHURL = process.argv[3];

enocean.teach({
  'id'  : '00 00 04 00 FE EF', // XXX: change this
  'eep' : 'A5-02-05',
  'name': 'STM431J_01'
});
enocean.teach({
  'id'  : '00 00 04 01 2E FC', // XXX: change this
  'eep' : 'A5-02-05',
  'name': 'STM431J_02'
});
enocean.teach({
  "id"  : "00 00 04 00 E5 9E", // XXX: change this
  "eep" : "D5-00-01",
  "name": "STM250J Door Sensor"
});

enocean.startMonitor({
  'path': '/dev/ttyUSB0'
}).then(function (gateway) {
  enocean.on('data-known', function (telegram) {
    if (telegram.message.eep == 'D5-00-01') { // STM250J Door Sensor
      var isClose = (telegram.message.value.contact == 1);
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
    } else if (telegram.message.eep == 'A5-02-05') { // STM431J Temperature Sensor
      var temp = telegram.message.value.temperature;
      var name = telegram.message.device.name;
      var body = 'temperature,sensor=' + name + ' value=' + temp;
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
