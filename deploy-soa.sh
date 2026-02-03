#!/bin/bash
# Service-Oriented Architecture Deployment Script

echo "=== Sentinel SOA Deployment ==="

# Stop old monolithic service if running
echo "Stopping old service..."
sudo systemctl stop media-stream-backend.service 2>/dev/null || true
sudo systemctl disable media-stream-backend.service 2>/dev/null || true

# Install new service files
echo "Installing service files..."
sudo cp backend/services/sentinel-input.service /etc/systemd/system/
sudo cp backend/services/sentinel-uplink.service /etc/systemd/system/
sudo cp backend/services/sentinel-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable all services
echo "Enabling services..."
sudo systemctl enable sentinel-input.service
sudo systemctl enable sentinel-uplink.service
sudo systemctl enable sentinel-api.service

# Start services in order
echo "Starting services..."
sudo systemctl start sentinel-input.service
sleep 2
sudo systemctl start sentinel-uplink.service
sleep 1
sudo systemctl start sentinel-api.service

# Check status
echo ""
echo "=== Service Status ==="
sudo systemctl status sentinel-input.service --no-pager -l
echo ""
sudo systemctl status sentinel-uplink.service --no-pager -l
echo ""
sudo systemctl status sentinel-api.service --no-pager -l

echo ""
echo "=== Deployment Complete ==="
echo "View logs with:"
echo "  journalctl -u sentinel-input -f"
echo "  journalctl -u sentinel-uplink -f"
echo "  journalctl -u sentinel-api -f"
