#!/bin/bash
# Debug UDP multicast flow between input and uplink services

echo "============================================"
echo "  UDP MULTICAST DIAGNOSTICS"
echo "============================================"
echo ""

# Step 1: Check device registry for UDP config
echo "[1/5] Device Registry UDP Configuration:"
cat backend/data/device_registry.json | jq '.devices | to_entries[] | .value.inputs[] | {id: .id, signal: .signal_detected, udp: .udp}'
echo ""

# Step 2: Check if input service pipeline is running
echo "[2/5] Input Service GStreamer Processes:"
ps aux | grep "decklinkvideosrc" | grep -v grep || echo "❌ No DeckLink input pipeline running!"
echo ""

# Step 3: Check if uplink service pipeline is running
echo "[3/5] Uplink Service GStreamer Processes:"
ps aux | grep "rtmpsink" | grep -v grep || echo "❌ No RTMP output pipeline found!"
ps aux | grep "x264enc" | grep -v grep || echo "  (No x264enc process either)"
echo ""

# Step 4: Check for any UDP traffic on multicast ports
echo "[4/5] Listening for UDP multicast (5 seconds)..."
echo "  Checking ports 5000-5010 for any traffic..."
timeout 5 tcpdump -i lo -c 10 'udp port 5000 or udp port 5001 or udp port 5002' 2>/dev/null || echo "  (Need sudo for tcpdump or no traffic)"
echo ""

# Step 5: Check input service logs
echo "[5/5] Recent Input Service Logs:"
journalctl -u sentinel-input -n 20 --no-pager | tail -15
echo ""

echo "============================================"
echo "  DIAGNOSTICS COMPLETE"
echo "============================================"
