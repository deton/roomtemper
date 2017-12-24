#!/bin/sh
# */5 *  *   *   1-5     /home/deton/bin/rrdgraph.sh >/dev/null
st=$(date -d '-1 day' '+%s')
ed=$(date -d now '+%s')
rrdtool graph /var/www/html/temper/temper.png --start $st --end $ed DEF:temper=/var/www/temphumid.rrd:temper:AVERAGE LINE1:temper#FF0000
rrdtool graph /var/www/html/temper/humidity.png --start $st --end $ed DEF:humidity=/var/www/temphumid.rrd:humidity:AVERAGE LINE1:humidity#0000FF

st=$(date -d '-1 week' '+%s')
rrdtool graph /var/www/html/temper/temperw.png --start $st --end $ed DEF:temper=/var/www/temphumid.rrd:temper:AVERAGE LINE1:temper#FF0000
rrdtool graph /var/www/html/temper/humidityw.png --start $st --end $ed DEF:humidity=/var/www/temphumid.rrd:humidity:AVERAGE LINE1:humidity#0000FF

tail -1 /tmp/roomtemper.log | awk -F: '{printf("%s %.1f %.1f\n", strftime("%FT%T", $1), $2, $3);}' > /var/www/html/temper/latest.txt
tail -1 /tmp/roomtemper.log | awk -F: '{printf("{\"time\":%d,\"timestr\":\"%s\",\"celsius\":\"%.1f\",\"humidity\":\"%.1f\"}\n", $1, strftime("%FT%T", $1), $2, $3);}' > /var/www/html/temper/latest.json
