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
echo -e "${YELLOW}Step 7: Installing systemd services...${NC}"
if [ -f "systemd/media-stream-backend.service" ]; then
    sudo cp systemd/media-stream-backend.service /etc/systemd/system/
    echo -e "${GREEN}✓ Backend service file installed${NC}"
fi

if [ -f "systemd/media-stream-frontend.service" ]; then
    sudo cp systemd/media-stream-frontend.service /etc/systemd/system/
    echo -e "${GREEN}✓ Frontend service file installed${NC}"
fi

sudo systemctl daemon-reload
echo -e "${GREEN}✓ Systemd reloaded${NC}"
echo ""

# Step 8: Enable services (start on boot)
echo -e "${YELLOW}Step 8: Enabling services...${NC}"
sudo systemctl enable media-stream-backend 2>/dev/null || true
sudo systemctl enable media-stream-frontend 2>/dev/null || true
echo -e "${GREEN}✓ Services enabled${NC}"
echo ""

# Step 9: Restart services
echo -e "${YELLOW}Step 9: Restarting services...${NC}"
sudo systemctl restart media-stream-backend
sudo systemctl restart media-stream-frontend
sleep 2
echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

# Step 10: Check service status
echo -e "${YELLOW}Step 10: Checking service status...${NC}"
echo ""
echo "Backend Status:"
sudo systemctl status media-stream-backend --no-pager | head -10
echo ""
echo "Frontend Status:"
sudo systemctl status media-stream-frontend --no-pager | head -10
echo ""

# Final status check
BACKEND_STATUS=$(sudo systemctl is-active media-stream-backend)
FRONTEND_STATUS=$(sudo systemctl is-active media-stream-frontend)

echo "========================================="
if [ "$BACKEND_STATUS" = "active" ] && [ "$FRONTEND_STATUS" = "active" ]; then
    echo -e "${GREEN}✓ Deployment Successful!${NC}"
    echo "========================================="
    echo ""
    echo "Application is running:"
    echo "  Frontend: http://115.112.70.85:5173"
    echo "  Backend:  http://115.112.70.85:8000"
    echo ""
    echo "View logs:"
    echo "  Backend:  sudo journalctl -u media-stream-backend -f"
    echo "  Frontend: sudo journalctl -u media-stream-frontend -f"
else
    echo -e "${RED}⚠ Warning: Some services may not be running${NC}"
    echo "Backend: $BACKEND_STATUS"
    echo "Frontend: $FRONTEND_STATUS"
    echo ""
    echo "Check logs for errors:"
    echo "  sudo journalctl -u media-stream-backend -n 50"
    echo "  sudo journalctl -u media-stream-frontend -n 50"
fi
echo ""
