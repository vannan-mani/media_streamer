#!/bin/bash
# Telemetry Debug Script
# Checks each stage of the telemetry pipeline

echo "============================================"
echo "  TELEMETRY PIPELINE DIAGNOSTICS"
echo "============================================"
echo ""

# Step 1: Check if stream_stats.json exists
echo "[1/5] Checking for stream_stats.json..."
if [ -f backend/data/stream_stats.json ]; then
    echo "✅ File exists!"
    cat backend/data/stream_stats.json
    echo ""
else
    echo "❌ File does NOT exist! Stats are not being written."
fi
echo ""

# Step 2: Check GStreamer log file content
echo "[2/5] Checking for GStreamer stats in temp log..."
LOG_FILE=$(ls -t /tmp/gst_stderr_*.log 2>/dev/null | head -1)
if [ -z "$LOG_FILE" ]; then
    echo "❌ No log file found!"
else
    echo "📁 Checking $LOG_FILE"
    if grep -q "video_stats" "$LOG_FILE"; then
        echo "✅ Stats found in log file:"
        grep "video_stats" "$LOG_FILE" | tail -3
    else
        echo "❌ No 'video_stats' found in log file. File content (last 5 lines):"
        tail -5 "$LOG_FILE"
    fi
fi
echo ""

# Step 3: Check if API returns telemetry
echo "[3/5] Fetching /api/stream/telemetry..."
curl -s http://localhost:8000/api/stream/telemetry | jq .
echo ""

# Step 4: Check intent
echo "[4/5] Current intent..."
cat backend/data/intent.json | jq '.intent'
echo ""

# Step 5: Check for Python import errors in uplink
echo "[5/5] Checking for Python errors in uplink service..."
journalctl -u sentinel-uplink -n 30 --no-pager | grep -i "error\|import\|module" || echo "✅ No obvious Python errors"
echo ""

echo "============================================"
echo "  DIAGNOSTICS COMPLETE"
echo "============================================"
