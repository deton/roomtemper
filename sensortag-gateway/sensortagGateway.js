var http = require('http');
var url = require('url');
var SensorTag = require('sensortag');

// influxdb
const SERVERURL = process.argv[2] || 'http://192.168.179.6:8086/write?db=roomdb'; 
const INTERVAL = 10 * 60000; // 10 [min]
const INTERVAL_NIGHT = 60 * 60000; // 60 [min]
var timer = null;

console.log('push side button of sensortag to connect');
discover();

function discover() {
  SensorTag.discover(onDiscover);
}

function onDiscover(sensorTag) {
  console.log('discovered: ' + sensorTag);

  sensorTag.on('disconnect', function() {
    console.log('disconnected! ' + sensorTag);
    clearTimeout(timer);
    timer = null;
    discover();
  });

  console.log('connectAndSetUp');
  sensorTag.connectAndSetUp(function (error) {
    if (error) {
      console.error('connectAndSetup(' + sensorTag + ') error ' + error);
      return;
    }
    timer = setTimeout(function () {
      onTimeout(sensorTag);
    }, INTERVAL);
  });
}

function onTimeout(sensorTag) {
  if (timer === null) {
    return;
  }
  readAndPost(sensorTag);
  var interval = isWorktime() ? INTERVAL : INTERVAL_NIGHT;
  timer = setTimeout(function () {
    onTimeout(sensorTag);
  }, interval);
}

function isWorktime() {
  var now = new Date();
  var hour = now.getHours();
  var weekday = now.getDay();
  // monday(1) to friday(5)
  return weekday >= 1 && weekday < 6 && hour >= 8 && hour < 21
}

function readAndPost(sensorTag) {
  var postdata = {temp: '', humidity: ''};
  readHumitidy(function (error, temperature, humidity) {
    if (error) {
      console.error('readHumidity(' + sensorTag + ') error ' + error);
      return;
    } else {
      if (humidity < 0 || humidity > 100) {
        console.warn('low battery?');
        return;
      }
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
  var body = 'temperature,sensor=CC2541DK_01 value=' + data.temp
      + '\nhumidity,sensor=CC2541DK_01 value=' + data.humidity;
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
