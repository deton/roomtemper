#!/bin/sh
echo "Content-Type: text/plain"
echo

IFS=: read -r tag timestamp temp humid
if [ -z "$humid" ]; then
	rrddata="$timestamp:$temp"
else
	rrddata="$timestamp:$temp:$humid"
fi
#rrdtool update /var/www/temphumid.rrd "$rrddata"
echo "$tag:$rrddata" >> /tmp/roomtemper.log

curl -s 'http://localhost:8086/write?db=roomdb' --data-binary "temperature,sensor=$tag value=$temp ${timestamp}000000000"
if [ ! -z "$humid" ]; then
	curl -s 'http://localhost:8086/write?db=roomdb' --data-binary "humidity,sensor=$tag value=$humid ${timestamp}000000000"
fi
