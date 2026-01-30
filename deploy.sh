#!/bin/bash

# Deployment script for SDI Streaming Dashboard
# Remote Server: 115.112.70.85

REMOTE_USER="seithigal-youtube"
REMOTE_HOST="115.112.70.85"
REMOTE_PATH="/home/seithigal-youtube/dashboard"

echo "========================================="
echo "SDI Dashboard Remote Deployment"
echo "========================================="

# Step 1: Build production bundle
echo "Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Create deployment package
echo "Creating deployment package..."
cd dist
tar -czf ../dashboard.tar.gz *
cd ..

echo "✅ Package created!"

# Step 3: Transfer to remote server
echo "Transferring to remote server..."
echo "You will be prompted for password: Tech@123"

scp dashboard.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

if [ $? -ne 0 ]; then
    echo "❌ Transfer failed!"
    echo "Make sure SSH is enabled on the remote server"
    exit 1
fi

echo "✅ Transfer complete!"

# Step 4: Extract and setup on remote
echo "Setting up on remote server..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /home/seithigal-youtube/dashboard
tar -xzf dashboard.tar.gz
rm dashboard.tar.gz

# Install serve if not present
if ! command -v serve &> /dev/null; then
    npm install -g serve
fi

# Kill any existing serve process
pkill -f "serve.*5173" || true

# Start serve in background
nohup serve -s . -l 5173 > server.log 2>&1 &

echo "✅ Dashboard is now running on http://115.112.70.85:5173"
ENDSSH

# Cleanup
rm dashboard.tar.gz

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo "Dashboard URL: http://115.112.70.85:5173"
echo ""
