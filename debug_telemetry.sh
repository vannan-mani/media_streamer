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

# Step 2: Check GStreamer stderr output (does identity log?)
echo "[2/5] Checking for GStreamer debug output in uplink logs..."
journalctl -u sentinel-uplink -n 20 --no-pager | grep -E "video_stats|chain|fps" || echo "❌ No identity/fps output found in logs"
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
