#!/bin/bash
# Automated deployment script for Ubuntu server
# This script handles: git pull, dependencies, build, systemd setup, and service restart

set -e  # Exit on any error

echo "========================================="
echo "Media Stream - Automated Deployment"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/seithigal-youtube/media_stream"
LOGS_DIR="$PROJECT_DIR/logs"

# Step 1: Navigate to project directory
echo -e "${YELLOW}Step 1: Navigating to project directory...${NC}"
cd "$PROJECT_DIR" || exit 1
echo -e "${GREEN}✓ Current directory: $(pwd)${NC}"
echo ""

# Step 2: Pull latest changes from Git
echo -e "${YELLOW}Step 2: Pulling latest changes from Git...${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Git pull complete${NC}"
echo ""

# Step 3: Install Node.js dependencies
echo -e "${YELLOW}Step 3: Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Node dependencies installed${NC}"
echo ""

# Step 4: Build frontend
echo -e "${YELLOW}Step 4: Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 5: Install Python dependencies
echo -e "${YELLOW}Step 5: Installing Python dependencies...${NC}"
cd backend
pip3 install -r requirements.txt --break-system-packages --quiet
cd ..
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

# Step 6: Create logs directory
echo -e "${YELLOW}Step 6: Setting up logs directory...${NC}"
mkdir -p "$LOGS_DIR"
echo -e "${GREEN}✓ Logs directory ready${NC}"
echo ""

# Step 7: Install/Update systemd services
echo -e "${YELLOW}Step 7: Installing systemd service...${NC}"
if [ -f "systemd/media-stream-backend.service" ]; then
    sudo cp systemd/media-stream-backend.service /etc/systemd/system/
    echo -e "${GREEN}✓ Backend service file installed${NC}"
fi

# Disable frontend service if it exists (not needed - backend serves everything)
sudo systemctl stop media-stream-frontend 2>/dev/null || true
sudo systemctl disable media-stream-frontend 2>/dev/null || true

sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd reloaded${NC}"
echo ""

# Step 8: Enable services (start on boot)
echo -e "${YELLOW}Step 8: Enabling backend service...${NC}"
sudo systemctl enable media-stream-backend 2>/dev/null || true
echo -e "${GREEN}✓ Backend service enabled${NC}"
echo ""

# Step 9: Restart services
echo -e "${YELLOW}Step 9: Restarting backend service...${NC}"
# Kill any process on port 8000
sudo fuser -k 8000/tcp 2>/dev/null || true
sleep 1
sudo systemctl restart media-stream-backend
sleep 2
echo -e "${GREEN}✓ Backend service restarted${NC}"
echo ""

# Step 10: Check service status
echo -e "${YELLOW}Step 10: Checking service status...${NC}"
echo ""
echo "Backend Status:"
sudo systemctl status media-stream-backend --no-pager | head -10
echo ""

# Final status check
BACKEND_STATUS=$(sudo systemctl is-active media-stream-backend)

echo "========================================="
if [ "$BACKEND_STATUS" = "active" ]; then
    echo -e "${GREEN}✓ Deployment Successful!${NC}"
    echo "========================================="
    echo ""
    echo "Application is running at:"
    echo "  http://115.112.70.85:8000"
    echo ""
    echo "(Backend serves both UI and API on port 8000)"
    echo ""
    echo "View logs:"
    echo "  sudo journalctl -u media-stream-backend -f"
else
    echo -e "${RED}⚠ Warning: Backend service not running${NC}"
    echo "Status: $BACKEND_STATUS"
    echo ""
    echo "Check logs for errors:"
    echo "  sudo journalctl -u media-stream-backend -n 50"
fi
echo ""
