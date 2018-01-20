#!/bin/sh
# Receive publish message of room window status change event,
# send webhook notify to all subscribers.
STATUSFILE=/tmp/roomwindow.status
WEBHOOKFILE=/tmp/roomwindow.webhook

echo "Content-Type: text/plain"
echo

if [ ! -f "$WEBHOOKFILE" ]; then
	touch "$WEBHOOKFILE"
fi

# read post body data: (1515212470000:win3:close)
IFS=: read -r timestamp id status
# current window status file:
#   {
#   "win3":{"timestamp":1515212470000,"status":"close"}
#   }
current=$(fgrep "\"$id\":{" $STATUSFILE | sed 's/^.*"status":"\([^"]*\).*$/\1/')
# update status file
sed -i "/^\"$id\"/s/{.*$/{\"timestamp\":$timestamp,\"status\":\"$status\"}/" $STATUSFILE

# write to InfluxDB
value=0
if [ "$status" = "open" ]; then
	value=1
fi
curl -s 'http://localhost:8086/write?db=roomdb' --data-binary "window,sensor=$id value=$value ${timestamp}000000"

#echo "$timestamp:$current -> $status" >>/tmp/roomwindow.log
if [ "$status" = "$current" ]; then
	echo "status($status) not changed. not notify to subscribers"
	exit 0
fi

# close stdout
exec >&-

JSON="{\"$id\":{\"timestamp\":$timestamp,\"status\":\"$status\"}}"
# notify to all subscribers
while IFS= read -r line; do
	curl -s -H 'Content-Type:application/json' -d "$JSON" "$line" >/dev/null
done < "$WEBHOOKFILE"
