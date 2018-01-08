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

# post body data: (1515212470000:win3:close)
IFS=: read -r timestamp id status
# current window status file:
#   {
#   "win3":{"timestamp":1515212470000,"status":"close"}
#   }
sed -i "/^\"$id\"/s/{.*$/{\"timestamp\":$timestamp,\"status\":\"$status\"}/" $STATUSFILE

# close stdout
exec >&-

JSON="{\"$id\":{\"timestamp\":$timestamp,\"status\":\"$status\"}}"
# notify to all subscribers
while IFS= read -r line; do
	curl -s -H 'Content-Type:application/json' -d "$JSON" "$line" >/dev/null
done < "$WEBHOOKFILE"
