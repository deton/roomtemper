#!/bin/sh
echo "Content-Type: text/plain"
echo

read temp
rrdtool update /var/www/temphumid.rrd "$temp"
echo "$temp" >> /tmp/roomtemper.log
