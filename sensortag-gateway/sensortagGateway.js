var http = require('http');
var url = require('url');
var SensorTag = require('sensortag');

const SERVERURL = process.argv[2] || 'http://192.168.179.6/cgi-bin/roomtemper.cgi';

console.log('push side button of sensortag to connect');
discover();

function discover() {
  SensorTag.discover(onDiscover);
}

function onDiscover(sensorTag) {
  console.log('discovered: ' + sensorTag);

  sensorTag.on('disconnect', function() {
    console.log('disconnected! ' + sensorTag);
    clearInterval(timer);
    discover();
  });

  var timer;
  console.log('connectAndSetUp');
  sensorTag.connectAndSetUp(function (error) {
    if (error) {
      console.error('connectAndSetup(' + sensorTag + ') error ' + error);
      return;
    }
    timer = setInterval(function () {
      readAndPost(sensorTag);
    }, 60000);
  });
}

function readAndPost(sensorTag) {
  var postdata = {temp: '', humidity: ''};
  postdata.date = (Date.now() / 1000).toFixed();
  readHumitidy(function (error, temperature, humidity) {
    if (error) {
      console.error('readHumidity(' + sensorTag + ') error ' + error);
    } else {
      postdata.temp = temperature.toFixed(1);
      postdata.humidity = humidity.toFixed(1);
    }
    httpPost(postdata);
  });

  function readIrTemperature(cb) {
    sensorTag.enableIrTemperature(function (error) {
      if (error) {
        cb(error);
        return;
      }
      setTimeout(function () {
        sensorTag.readIrTemperature(function (error, objectTemperature, ambientTemperature) {
          sensorTag.disableIrTemperature(function () {
            if (error) {
              cb(error);
              return;
            }
            cb(null, objectTemperature, ambientTemperature);
          });
        });
      }, 2000);
    });
  }

  function readHumitidy(cb) {
    sensorTag.enableHumidity(function (error) {
      if (error) {
        cb(error);
        return;
      }
      setTimeout(function () {
        sensorTag.readHumidity(function(error, temperature, humidity) {
          sensorTag.disableHumidity(function () {
            if (error) {
              cb(error);
              return;
            }
            cb(null, temperature, humidity);
          });
        });
      }, 2000);
    });
  }
}

function httpPost(data) {
  var body = data.date + ':' + data.temp + ':' + data.humidity;
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
