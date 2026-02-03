#!/bin/bash
# Service-Oriented Architecture Deployment Script
# Includes: git pull, frontend build, service deployment

set -e  # Exit on error

echo "=================================================="
echo "  Sentinel SOA Deployment v2.0"
echo "=================================================="

# Step 1: Pull latest code
echo ""
echo "[1/6] Pulling latest code from repository..."
git pull origin main
echo " ✓ Code updated"

# Step 2: Build frontend
echo ""
echo "[2/6] Building frontend..."
npm run build
echo " ✓ Frontend built"

# Step 3: Stop old monolithic service if running
echo ""
echo "[3/6] Stopping old monolithic service..."
sudo systemctl stop media-stream-backend.service 2>/dev/null || true
sudo systemctl disable media-stream-backend.service 2>/dev/null || true
echo " ✓ Old service stopped"

# Step 4: Install new service files
echo ""
echo "[4/6] Installing systemd service files..."
sudo cp backend/services/sentinel-input.service /etc/systemd/system/
sudo cp backend/services/sentinel-uplink.service /etc/systemd/system/
sudo cp backend/services/sentinel-api.service /etc/systemd/system/
sudo systemctl daemon-reload
echo " ✓ Services installed"

# Step 5: Enable and start services
echo ""
echo "[5/6] Starting services..."

echo "  → sentinel-input (Hardware Monitoring)"
sudo systemctl enable sentinel-input.service
sudo systemctl restart sentinel-input.service
sleep 2
echo "  ✓ Input service running"

echo "  → sentinel-uplink (RTMP Encoding)"
sudo systemctl enable sentinel-uplink.service
sudo systemctl restart sentinel-uplink.service
sleep 1
echo "  ✓ Uplink service running"

echo "  → sentinel-api (REST Gateway)"
sudo systemctl enable sentinel-api.service
sudo systemctl restart sentinel-api.service
sleep 1
echo "  ✓ API service running"

# Step 6: Verify deployment
echo ""
echo "[6/6] Verifying services..."
echo ""

for service in sentinel-input sentinel-uplink sentinel-api; do
    if systemctl is-active --quiet $service; then
        echo " ✓ $service is running"
    else
        echo " ✗ $service FAILED - check logs: journalctl -u $service -n 50"
    fi
done

echo ""
echo "=================================================="
echo "  Deployment Complete!"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "  1. View device registry: cat backend/data/device_registry.json"
echo "  2. Monitor logs:"
echo "     journalctl -u sentinel-input -f    # Hardware monitoring"
echo "     journalctl -u sentinel-uplink -f   # RTMP encoding"
echo "     journalctl -u sentinel-api -f      # REST API"
echo "  3. Access UI: http://localhost:8000"
echo ""

