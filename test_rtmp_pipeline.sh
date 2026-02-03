#!/bin/bash
# Manual GStreamer Pipeline Test
# Test the exact pipeline that uplink is trying to run

echo "Testing RTMP pipeline manually..."
echo ""

# Read configuration
MULTICAST_IP="239.0.0.1"
VIDEO_PORT=5000
AUDIO_PORT=5001
BITRATE=6000
FPS=60
WIDTH=1920
HEIGHT=1080

# Get RTMP URL from config
RTMP_KEY=$(cat backend/stream_config.json | jq -r '.destinations.youtube.streams[0].key')
RTMP_URL="rtmp://a.rtmp.youtube.com/live2/${RTMP_KEY}"

echo "Configuration:"
echo "  Multicast: ${MULTICAST_IP}:${VIDEO_PORT},${AUDIO_PORT}"
echo "  Output: ${WIDTH}x${HEIGHT} @ ${FPS}fps, ${BITRATE}kbps"
echo "  RTMP: a.rtmp.youtube.com/live2/****"
echo ""

# Build the exact pipeline from pipeline.py
PIPELINE="rtpbin name=rtp latency=0 \
udpsrc multicast-group=${MULTICAST_IP} port=${VIDEO_PORT} multicast-iface=\"lo\" caps=\"application/x-rtp\" \
! rtp.recv_rtp_sink_0 \
rtp. ! rtpvrawdepay ! videoconvert \
! videoscale ! video/x-raw,width=${WIDTH},height=${HEIGHT} \
! identity name=video_stats silent=false \
! tee name=t \
t. ! queue max-size-buffers=3 leaky=downstream ! x264enc bitrate=${BITRATE} speed-preset=veryfast tune=zerolatency key-int-max=$((FPS*2)) \
   ! video/x-h264,profile=high ! h264parse ! queue name=v_enc \
t. ! queue max-size-buffers=3 leaky=downstream ! fpsdisplaysink name=fps_monitor text-overlay=false signal-fps-measurements=true sync=false \
udpsrc multicast-group=${MULTICAST_IP} port=${AUDIO_PORT} multicast-iface=\"lo\" caps=\"application/x-rtp\" \
! rtp.recv_rtp_sink_1 \
rtp. ! rtpL16depay ! audioconvert ! audioresample \
! identity name=audio_stats silent=false \
! queue max-size-buffers=3 leaky=downstream \
! avenc_aac bitrate=128000 \
! aacparse ! queue name=a_enc \
flvmux name=mux streamable=true \
v_enc. ! mux. \
a_enc. ! mux. \
mux. ! rtmpsink location=\"${RTMP_URL} live=1\""

echo "Running pipeline..."
echo "Press Ctrl+C to stop"
echo ""
echo "==================================="

gst-launch-1.0 ${PIPELINE}
