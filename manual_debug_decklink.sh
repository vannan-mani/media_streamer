#!/bin/bash
# Manual Debug script to check DeckLink Hardware
# Usage: ./manual_debug_decklink.sh

echo "stopping services..."
sudo systemctl stop sentinel-input sentinel-uplink sentinel-api

echo "1. Checking Device Visibility (sentinel-probe)..."
./backend/cpp/sentinel-probe
echo ""
echo "------------------------------------------------"

echo "2. Testing Video Capture (SDI Mode)..."
echo "Running GStreamer pipeline manually. Press Ctrl+C to stop."
echo "LOOK FOR: 'Signal detected' vs 'No signal' errors."

gst-launch-1.0 -v \
    decklinkvideosrc device-number=0 connection=sdi mode=auto \
    ! video/x-raw,format=UYVY \
    ! identity silent=false \
    ! fakesink

echo ""
echo "------------------------------------------------"
echo "If the above worked (scrolled text), the hardware is fine."
echo "If it sat silent or errored, check cables/drivers."
