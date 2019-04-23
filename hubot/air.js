// Description
//   A hubot script that returns room temperature, CO2 and window open/close status
//
// Commands:
//   air - return room temperature, CO2 and window open/close status
//
// Author:
//   KIHARA Hideto <deton@m1.interq.or.jp>

module.exports = function (robot) {
  robot.hear(/^air/i, function (msg) {
    var q = encodeURIComponent("SELECT LAST(value) FROM temperature WHERE sensor='STM431J_01'; SELECT LAST(value) FROM window WHERE sensor='win7'; SELECT LAST(value) FROM co2 WHERE sensor='MHZ14A_01'");
    var req = robot.http('http://localhost:8086/query?epoch=ms&db=roomdb&q=' + q).get();
    req(function (err, res, body) {
      if (err) {
        robot.logger.warning('Failed to get room temperature:' + error);
        return;
      }
      //console.log(body);
      var json = JSON.parse(body);
      // {"results":[
      //   {"series":[{"name":"temperature","columns":["time","last"],"values":[[1515210895000,10.7]]}]},
      //   {"series":[{"name":"window","columns":["time","last"],"values":[[1515399747622,0]]}]},
      //   {"series":[{"name":"co2","columns":["time","last"],"values":[[1515399747622,929]]}]}]}
      var tempdata = json.results[0].series[0].values[0];
      var windata = json.results[1].series[0].values[0];
      var co2data = json.results[2].series[0].values[0];
   
      if (isOld(tempdata[0])) {
        robot.logger.warning('too old data:' + time);
        return;
      }
      var m = 'Temperature: ' + tempdata[1] + '℃ [STM431J at S307]';
      if (!isOld(co2data[0])) {
        m += ', CO2: ' + co2data[1] + 'ppm';
      }
      if (!isOld(windata[0])) {
        if (windata[1] == 1) {
          m += ' (window is OPEN)';
        } else {
          m += ' (window is close)';
        }
      }
      msg.send(m);
    });
  });

  function isOld(ms) {
    var time = new Date(ms);
    var now = new Date();
    if (now - time > 2400000) { // 40 min
      return true;
    }
    return false;
  }
};
