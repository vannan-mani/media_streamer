# Deployment Guide for Ubuntu Remote Machine (115.112.70.85)

## System Information

- **Machine:** 115.112.70.85
- **OS:** Ubuntu Linux
- **Username:** seithigal-youtube
- **Password:** Tech@123
- **Project Directory:** `/home/seithigal-youtube/media_stream`

## Prerequisites on Remote Ubuntu Machine

### 1. Node.js & npm

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2. Python 3 & pip

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv
python3 --version
pip3 --version
```

### 3. GStreamer (for DeckLink integration)

```bash
sudo apt-get install -y \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    python3-gst-1.0 \
    gir1.2-gstreamer-1.0
```

**Verify GStreamer:**
```bash
gst-inspect-1.0 --version
```

### 4. DeckLink Software

```bash
# Download from Blackmagic Design website
wget https://sw.blackmagicdesign.com/DeckLink/v12.5/Blackmagic_Desktop_Video_Linux_12.5.tar
tar -xvf Blackmagic_Desktop_Video_Linux_12.5.tar
cd Blackmagic_Desktop_Video_Linux_12.5

# Install
sudo dpkg -i desktopvideo_*.deb
sudo apt-get install -f  # Fix dependencies if needed

# Verify
lsmod | grep blackmagic
```

### 5. PyGObject

```bash
sudo apt-get install -y python3-gi python3-gi-cairo gir1.2-gtk-3.0
```

## Deployment from Windows

### Option 1: Automated Deployment Script

```powershell
# Deploy and start server
.\deploy_ubuntu.ps1 -Start

# Deploy only (no start)
.\deploy_ubuntu.ps1
```

**This will:**
1. Package your code
2. Transfer to Ubuntu via SCP
3. Install dependencies
4. Start the application

### Option 2: Manual Deployment

**Using PuTTY/WinSCP:**

1. **Transfer files using WinSCP:**
   - Open WinSCP
   - Connect to 115.112.70.85
   - Upload project to `/home/seithigal-youtube/media_stream`

2. **SSH into machine using PuTTY:**
   ```
   Host: 115.112.70.85
   Username: seithigal-youtube
   Password: Tech@123
   ```

3. **Install dependencies:**
   ```bash
   cd /home/seithigal-youtube/media_stream
   npm install
   cd backend
   pip3 install -r requirements.txt
   ```

4. **Start application:**
   ```bash
   cd /home/seithigal-youtube/media_stream
   chmod +x start_server.sh
   ./start_server.sh
   ```

## Accessing the Application

From your local Windows browser:
```
Frontend: http://115.112.70.85:5173
Backend:  http://115.112.70.85:8000
```

## Managing the Application

### Start
```bash
cd /home/seithigal-youtube/media_stream
./start_server.sh
```

### Stop
```bash
cd /home/seithigal-youtube/media_stream
./stop_server.sh
```

### View Logs
```bash
# Backend logs
tail -f /home/seithigal-youtube/media_stream/backend.log

# Frontend logs
tail -f /home/seithigal-youtube/media_stream/frontend.log
```

## Testing GStreamer Integration

### Check DeckLink Devices
```
http://115.112.70.85:8000/decklink/devices
```

### Test GStreamer Pipeline
```bash
# List DeckLink devices
gst-device-monitor-1.0

# Test video source
gst-launch-1.0 decklinkvideosrc device-number=0 ! autovideosink
```

## Firewall Configuration

Allow ports on Ubuntu:
```bash
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend
sudo ufw status
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :5173
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Permission Denied
```bash
chmod +x start_server.sh
chmod +x stop_server.sh
```

### GStreamer Plugin Not Found
```bash
# Check installed plugins
gst-inspect-1.0 decklinkvideosrc
gst-inspect-1.0 x264enc

# Rebuild plugin cache
gst-inspect-1.0 --print-all
```

### Python Module Not Found
```bash
cd /home/seithigal-youtube/media_stream/backend
pip3 install -r requirements.txt --user
```

## Development Workflow

1. **Make changes locally** on Windows
2. **Deploy to Ubuntu:**
   ```powershell
   .\deploy_ubuntu.ps1 -Start
   ```
3. **Test from browser:**
   ```
   http://115.112.70.85:5173
   ```

## Quick Reference

```bash
# SSH into machine
ssh seithigal-youtube@115.112.70.85

# Start application
./start_server.sh

# Stop application
./stop_server.sh

# View backend logs
tail -f backend.log

# View frontend logs
tail -f frontend.log

# Check running processes
ps aux | grep python
ps aux | grep node
```
