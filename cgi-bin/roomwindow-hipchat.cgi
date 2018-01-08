#!/bin/sh
# Receive webhook message and send to HipChat
#URL='https://hipchat.example.com/v2/room/YYYY/notification?auth_token=ZZZZ'
URL='http://localhost:3000/v2/room/YYYY/notification?auth_token=ZZZZ'

echo "Content-Type: text/plain"
echo

IFS= read -r json

ID=$(echo "$json" | sed 's/^{"\([^"]*\)".*$/\1/')
STATUS=$(echo "$json" | sed 's/^.*"status":"\([^"]*\)".*$/\1/')

COLOR="gray"
case "$STATUS" in
	open)
		COLOR="yellow"
		MSG="window $ID is OPENED"
		;;
	close)
		MSG="window $ID is closed"
		;;
	*)
		echo "status($STATUS) is not open or close." >&2
		exit 1
		;;
esac

BODY="{\"message\":\"$MSG\",\"color\":\"$COLOR\",\"notify\":false,\"message_format\":\"text\"}"

curl -s -d "$BODY" -H 'Content-Type:application/json' "$URL"
