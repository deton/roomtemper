#!/bin/sh
# WebSub Hub for room window status change webhook
WEBHOOKFILE=/tmp/roomwindow.webhook
if [ ! -f "$WEBHOOKFILE" ]; then
	touch "$WEBHOOKFILE"
fi

IFS= read -r postbody
MODE=$(echo "$postbody" | sed 's/^.*hub.mode=\([^&]*\).*$/\1/')
CALLBACK=$(echo "$postbody" | sed 's/^.*hub.callback=\([^&]*\).*$/\1/')
CALLBACK=$(echo "$CALLBACK" | sed 's@+@ @g;s@%@\\x@g' | xargs -0 printf "%b")
#TOPIC=$(echo "$postbody" | sed 's/^.*hub.topic=\([^&]*\).*$/\1/')

case "$MODE" in
	subscribe)
		echo "HTTP/1.1 202 Accepted"
		echo "Content-Type: text/plain"
		echo
		if fgrep -q "$CALLBACK" "$WEBHOOKFILE"; then
			echo "already subscribed: hub.callback($CALLBACK)"
		else
			echo "$CALLBACK" >> "$WEBHOOKFILE"
		fi
		;;
	unsubscribe)
		if ! fgrep -q "$CALLBACK" "$WEBHOOKFILE"; then
			echo "HTTP/1.1 404 Subscription Not Found"
			echo "Content-Type: text/plain"
			echo
			echo "not subscribed: hub.callback($CALLBACK)"
			exit 2
		fi
		echo "HTTP/1.1 202 Accepted"
		echo "Content-Type: text/plain"
		echo
		# TODO: lock
		mv "$WEBHOOKFILE" "$WEBHOOKFILE.tmp"
		fgrep -v "$CALLBACK" "$WEBHOOKFILE.tmp" > "$WEBHOOKFILE"
		rm -f "$WEBHOOKFILE.tmp"
		;;
	*)
		echo "HTTP/1.1 400 Bad Request"
		echo "Content-Type: text/plain"
		echo
		echo "hub.mode($MODE) is not subscribe or unsubscribe"
		exit 1
		;;
esac

