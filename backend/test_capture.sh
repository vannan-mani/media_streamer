#!/bin/bash
# test_capture.sh - Verify DeckLink Capture via CLI
# This script captures video/audio and provides console statistics without streaming.

echo "=================================================="
echo "GStreamer DeckLink Capture Test (Local Only)"
echo "=================================================="

# Configuration
DEVICE_NUM=0
WIDTH=1920
HEIGHT=1080
FPS=60

echo "Capturing from DeckLink Device $DEVICE_NUM..."
echo "Press Ctrl+C to stop."

gst-launch-1.0 -v \
    decklinkvideosrc device-number=$DEVICE_NUM mode=auto connection=auto ! \
    queue max-size-buffers=5 ! \
    videoconvert ! \
    fpsdisplaysink text-overlay=true video-sink=fakesink sync=true \
    decklinkaudiosrc device-number=$DEVICE_NUM ! \
    queue ! \
    audioconvert ! \
    level ! \
    fakesink
