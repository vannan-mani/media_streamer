#!/bin/bash
# RTMP Pipeline Diagnostic
# Verifies why streaming to YouTube is failing

echo "=========================================="
echo "  RTMP PIPELINE DIAGNOSTICS"
echo "=========================================="
echo ""

# Step 1: Check intent
echo "[1/6] Checking intent.json..."
cat backend/data/intent.json | jq '.intent'
echo ""

# Step 2: Check uplink service
echo "[2/6] Checking sentinel-uplink service..."
systemctl status sentinel-uplink --no-pager | grep -E "(Active|PID)"
echo ""

# Step 3: Check for running GStreamer processes
echo "[3/6] Looking for GStreamer RTMP processes..."
ps aux | grep "gst-launch.*rtmpsink" | grep -v grep
if [ $? -ne 0 ]; then
    echo "❌ No GStreamer RTMP pipeline found!"
else
    echo "✅ GStreamer pipeline is running"
fi
echo ""

# Step 4: Check recent uplink logs for errors
echo "[4/6] Recent uplink errors (last 10 lines)..."
journalctl -u sentinel-uplink -n 10 --no-pager | grep -i "error\|failed"
echo ""

# Step 5: Check if UDP source is still alive
echo "[5/6] Checking UDP multicast source..."
timeout 2 sudo tcpdump -i lo udp port 5000 -c 3 -n 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ UDP packets detected"
else
    echo "❌ No UDP packets!"
fi
echo ""

# Step 6: Check stream config for RTMP URL
echo "[6/6] Checking stream_config.json for RTMP destination..."
cat backend/stream_config.json | jq '.destinations.youtube.streams[0]'
echo ""

echo "=========================================="
echo "  DIAGNOSIS COMPLETE"
echo "=========================================="
echo ""
echo "If GStreamer is NOT running:"
echo "  1. Check journalctl -u sentinel-uplink -n 50"
echo "  2. Look for pipeline syntax errors"
echo ""
echo "If GStreamer IS running but YouTube shows offline:"
echo "  1. Verify RTMP key in stream_config.json"
echo "  2. Check YouTube Studio stream health"
echo "  3. Wait 10-30 seconds for YouTube to recognize stream"
