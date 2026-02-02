#!/bin/bash
# test_stream.sh - Verify DeckLink to YouTube Streaming via CLI

if [ -z "$1" ]; then
    echo "Usage: ./test_stream.sh <youtube_rtmps_url_with_key>"
    echo "Example: ./test_stream.sh rtmps://a.rtmps.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
    exit 1
fi

YOUTUBE_URL=$1
DEVICE_NUM=0
BITRATE=4000
FPS=60

echo "=================================================="
echo "GStreamer YouTube Streaming Test"
echo "Target: $YOUTUBE_URL"
echo "Hardware: DeckLink SDI 4K (Device $DEVICE_NUM)"
echo "=================================================="

gst-launch-1.0 -v \
    decklinkvideosrc device-number=$DEVICE_NUM mode=auto connection=auto ! \
    queue max-size-buffers=5 ! \
    videoconvert ! \
    x264enc bitrate=$BITRATE key-int-max=$(($FPS * 2)) tune=zerolatency speed-preset=ultrafast ! \
    h264parse ! \
    flvmux name=mux streamable=true ! \
    rtmpsink location="$YOUTUBE_URL" sync=false \
    decklinkaudiosrc device-number=$DEVICE_NUM ! \
    queue ! \
    audioconvert ! \
    voaacenc bitrate=128000 ! \
    mux.
