#!/bin/bash
# Uplink Diagnostic Script
# Verifies the complete RTMP encoding pipeline

echo "=========================================="
echo "  SENTINEL UPLINK DIAGNOSTICS"
echo "=========================================="
echo ""

# Step 1: Check Intent File
echo "[1/5] Checking intent.json..."
if [ -f /home/seithigal-youtube/media_stream/backend/data/intent.json ]; then
    cat /home/seithigal-youtube/media_stream/backend/data/intent.json | jq .
else
    echo "❌ intent.json NOT FOUND"
fi
echo ""

# Step 2: Check Device Registry
echo "[2/5] Checking device_registry.json..."
if [ -f /home/seithigal-youtube/media_stream/backend/data/device_registry.json ]; then
    cat /home/seithigal-youtube/media_stream/backend/data/device_registry.json | jq '.devices | to_entries | .[0].value.inputs[0]'
else
    echo "❌ device_registry.json NOT FOUND"
fi
echo ""

# Step 3: Check Uplink Service Status
echo "[3/5] Checking sentinel-uplink service..."
systemctl status sentinel-uplink --no-pager | grep -E "(Active|Main PID|since)"
echo ""

# Step 4: Check Recent Uplink Logs
echo "[4/5] Recent uplink logs (last 20 lines)..."
journalctl -u sentinel-uplink -n 20 --no-pager
echo ""

# Step 5: Verify UDP Multicast is Active
echo "[5/5] Verifying UDP source is streaming..."
timeout 2 sudo tcpdump -i lo udp port 5000 -c 5 -n 2>/dev/null || echo "⚠️  No packets on port 5000"
echo ""

echo "=========================================="
echo "  DIAGNOSIS COMPLETE"
echo "=========================================="
