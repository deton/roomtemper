// Description
//   A hubot script that returns room temperature and humidity
//
// Commands:
//   air - return room temperature and humidity
//
// Author:
//   KIHARA Hideto <deton@m1.interq.or.jp>

const child_process = require('child_process');

module.exports = function (robot) {
  robot.hear(/^air/i, function (msg) {
    child_process.exec('tail -1 /tmp/roomtemper.log', function (error, stdout, stderr) {
      if (error) {
        robot.logger.warning('Failed to get room temperature:' + error);
        return;
      }
      var ar = stdout.replace(/\n/, '').split(':');
      var time = new Date(parseInt(ar[0] + '000', 10));
      var now = new Date();
      if (now - time > 1800000) { // 30 min
        robot.logger.warning('too old data:' + time);
        return;
      }
      msg.send('Temperature: ' + ar[1] + '℃, Humidity: ' + ar[2] + '% [SensorTag at S307]');
    });
  });
};
