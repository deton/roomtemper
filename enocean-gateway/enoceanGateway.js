const http = require('http');
const url = require('url');
const enocean = require('node-enocean-utils');

const SERVERURL = process.argv[2] || 'http://192.168.179.6/cgi-bin/roomtemper.cgi';

enocean.teach({
  'id'  : '00 00 04 00 FE EF',
  'eep' : 'A5-02-05',
  'name': 'STM 431J Temperature Sensor'
});

enocean.startMonitor({
  'path': '/dev/ttyUSB0'
}).then(function (gateway) {
  enocean.on('data-known', function (telegram) {
    httpPost({
      date: (Date.now() / 1000).toFixed(),
      temp: telegram.message.value.temperature
    });
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
