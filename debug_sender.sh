#!/bin/bash
# Debug Sender - Simulates the Sentinel Pipeline without DeckLink hardware
# Uses videotestsrc to prove network routing is working

MULTICAST_IP="239.0.0.1"
VIDEO_PORT=5000
AUDIO_PORT=5001

echo "=================================================="
echo "  Sentinel Network Diagnostic Sender"
echo "=================================================="
echo "Simulating stream to $MULTICAST_IP:$VIDEO_PORT (lo)"
echo ""

# Pipeline matching production exactly, but with test sources
# We use multicast-iface="lo" just like production
gst-launch-1.0 -v \
    videotestsrc is-live=true pattern=ball ! \
    video/x-raw,format=UYVY,width=1920,height=1080,framerate=50/1 ! \
    identity silent=false name=video_debug ! \
    rtpvrawpay mtu=9000 ! \
    udpsink host=$MULTICAST_IP port=$VIDEO_PORT multicast-iface="lo" auto-multicast=true async=false \
    \
    audiotestsrc is-live=true wave=sine freq=440 ! \
    audio/x-raw,format=S16BE,channels=2,rate=48000 ! \
    rtpL16pay mtu=1400 ! \
    udpsink host=$MULTICAST_IP port=$AUDIO_PORT multicast-iface="lo" auto-multicast=true async=false
