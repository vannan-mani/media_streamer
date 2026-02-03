# Incremental Testing Guide - SOA v2.0

## Pre-Deployment Checklist

1. **Backup current state**
   ```bash
   sudo systemctl stop media-stream-backend.service
   cp backend/data/intent.json backend/data/intent.json.backup 2>/dev/null || true
   ```

2. **Deploy**
   ```bash
   cd ~/media_stream
   chmod +x deploy-soa.sh
   ./deploy-soa.sh
   ```

---

## Test 1: Sentinel-Input (Hardware Monitoring)

### Objective
Verify that `sentinel-input` detects hardware and starts UDP multicast automatically.

### Steps

1. **Check service status**
   ```bash
   sudo systemctl status sentinel-input --no-pager
   ```
   **Expected**: Active (running)

2. **View live logs**
   ```bash
   journalctl -u sentinel-input -f
   ```
   **Expected Output**:
   ```
   [sentinel-input] INFO: Sentinel Input Service starting...
   [sentinel-input] INFO: Discovered 1 devices
   [sentinel-input] DEBUG: Starting UDP pipeline for input_0 (1080p60)
   [udp-pipeline] INFO: Starting UDP multicast: 239.0.0.1:5000/5001
   [udp-pipeline] INFO: Pipeline started with PID 12345
   ```

3. **Check device registry**
   ```bash
   cat backend/data/device_registry.json | jq .
   ```
   **Expected**: JSON with detected devices and UDP ports

4. **Verify UDP multicast** (on a second terminal)
   ```bash
   # Test video stream
   gst-launch-1.0 udpsrc multicast-group=239.0.0.1 port=5000 caps="application/x-rtp" ! fakesink silent=false -v
   ```
   **Expected**: See RTP packets flowing

5. **Stop Test**
   ```bash
   # Disconnect signal from DeckLink physically or via software
   # Watch logs - should see:
   # [sentinel-input] INFO: Stopping UDP pipeline for input_0 (signal lost)
   ```

**✅ Test 1 PASSED**: UDP pipeline auto-starts on signal, and RTP packets are flowing.

---

## Test 2: Sentinel-API (REST Gateway)

### Objective
Verify API serves frontend and manages JSON state correctly.

### Steps

1. **Check service status**
   ```bash
   sudo systemctl status sentinel-api --no-pager
   ```
   **Expected**: Active (running)

2. **View logs**
   ```bash
   journalctl -u sentinel-api -f
   ```
   **Expected**:
   ```
   [sentinel-api] INFO: Serving frontend from /dist
   INFO: Uvicorn running on http://0.0.0.0:8000
   ```

3. **Test API endpoints**
   ```bash
   # Get state
   curl http://localhost:8000/api/sentinel/state | jq .
   
   # Expected: JSON with intent, settings, hardware, system_status
   ```

4. **Test configuration update**
   ```bash
   curl -X POST http://localhost:8000/api/sentinel/configure \
     -H "Content-Type: application/json" \
     -d '{
       "selected_device_id": 0,
       "selected_input_id": "input_0",
       "selected_destination_id": "youtube:main",
       "selected_preset_id": "hd_med"
     }'
   
   # Check intent.json was updated
   cat backend/data/intent.json | jq .
   ```

5. **Test UI access**
   ```bash
   # Open browser to http://<server-ip>:8000
   # Verify UI loads correctly
   ```

**✓ Test 2 PASS Criteria**: API serves UI, reads/writes JSON state correctly

---

## Test 3: Sentinel-Uplink (RTMP Encoding)

### Objective
Verify `sentinel-uplink` reads intent and encodes UDP → RTMP.

### Steps

1. **Ensure Test 1 passed** (UDP multicast must be running)

2. **Check service status**
   ```bash
   sudo systemctl status sentinel-uplink --no-pager
   ```
   **Expected**: Active (running)

3. **View logs**
   ```bash
   journalctl -u sentinel-uplink -f
   ```
   **Expected (initially)**:
   ```
   [sentinel-uplink] INFO: Sentinel Uplink Service starting...
   # Should be idle, waiting for intent
   ```

4. **Trigger GO LIVE via API**
   ```bash
   curl -X POST http://localhost:8000/api/sentinel/intent \
     -H "Content-Type: application/json" \
     -d '{"intent": "AUTO_STREAM"}'
   ```

5. **Watch uplink logs**
   **Expected**:
   ```
   [sentinel-uplink] INFO: Starting stream: input_0 → youtube:main (HD Medium)
   [rtmp-pipeline] INFO: Starting RTMP stream to a.rtmp.youtube.com
   [rtmp-pipeline] INFO: RTMP pipeline started with PID 23456
   ```

6. **Verify YouTube streaming**
   - Check YouTube Live Dashboard
   - Stream should appear and start broadcasting

7. **Stop streaming**
   ```bash
   curl -X POST http://localhost:8000/api/sentinel/intent \
     -H "Content-Type: application/json" \
     -d '{"intent": "DISABLED"}'
   ```
   **Expected**:
   ```
   [sentinel-uplink] INFO: Stopping stream: input_0:youtube:main
   [rtmp-pipeline] INFO: Stopped RTMP pipeline PID 23456
   ```

**✓ Test 3 PASS Criteria**: RTMP encoding starts on GO LIVE, stops on DISABLED

---

## Test 4: Service Isolation (Crash Recovery)

### Objective
Verify that one service crashing doesn't affect others.

### Steps

1. **Kill uplink service**
   ```bash
   sudo systemctl stop sentinel-uplink
   ```

2. **Verify input still running**
   ```bash
   sudo systemctl status sentinel-input
   # Should still be Active (running)
   
   # UDP should still be multicasting
   gst-launch-1.0 udpsrc multicast-group=239.0.0.1 port=5000 ! fakesink -v
   ```

3. **Restart uplink**
   ```bash
   sudo systemctl start sentinel-uplink
   # Should recover automatically
   ```

**✓ Test 4 PASS Criteria**: Services are fully isolated, crashes don't cascade

---

## Test 5: End-to-End UI Flow

1. Open UI in browser: `http://<server-ip>:8000`
2. Select input (should see signal status)
3. Select YouTube destination
4. Select HD Medium preset
5. Click GO LIVE
6. **Watch all 3 service logs simultaneously**:
   ```bash
   # Terminal 1
   journalctl -u sentinel-input -f
   
   # Terminal 2
   journalctl -u sentinel-uplink -f
   
   # Terminal 3
   journalctl -u sentinel-api -f
   ```
7. Verify stream appears on YouTube
8. Click STOP
9. Verify stream stops but UDP continues

**✓ Test 5 PASS Criteria**: Full workflow works end-to-end

---

## Debugging Commands

```bash
# View all services at once
sudo systemctl status sentinel-* --no-pager

# Follow all logs (requires multitail)
multitail -l "journalctl -u sentinel-input -f" \
          -l "journalctl -u sentinel-uplink -f" \
          -l "journalctl -u sentinel-api -f"

# Check device registry
watch -n 1 'cat backend/data/device_registry.json | jq .'

# Check intent
watch -n 1 'cat backend/data/intent.json | jq .'

# Kill all GStreamer pipelines (emergency)
pkill -9 gst-launch-1.0

# Restart everything
sudo systemctl restart sentinel-input sentinel-uplink sentinel-api
```
