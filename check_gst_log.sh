#!/bin/bash
# Check if GStreamer log file exists and has content

echo "======================================"
echo "  GStreamer Log File Diagnostics"
echo "======================================"
echo ""

# Find most recent gst output log (check both old and new naming)
LOG_FILE=$(ls -t /tmp/gst_output_*.log /tmp/gst_stderr_*.log 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
    echo "❌ No GStreamer log files found in /tmp/"
    exit 1
fi

echo "📁 Log file: $LOG_FILE"
echo ""

echo "📊 File size:"
ls -lh "$LOG_FILE"
echo ""

echo "📝 Line count:"
wc -l "$LOG_FILE"
echo ""

echo "🔍 First 20 lines:"
head -20 "$LOG_FILE"
echo ""

echo "🔍 Lines containing 'video_stats' (progressreport):"
grep "video_stats" "$LOG_FILE" | head -5 || echo "❌ No video_stats lines found"
echo ""

echo "🔍 Lines containing 'fps':"
grep "fps" "$LOG_FILE" | head -5 || echo "❌ No fps lines found"
echo ""
