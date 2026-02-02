# Deployment Guide for Remote Machine (115.112.70.85)

## Prerequisites

Machine: **115.112.70.85**  
Username: **seithigal-youtube**  
Password: **Tech@123**

## Installation Steps

### 1. Connect to Remote Machine

```bash
# Via Remote Desktop
mstsc /v:115.112.70.85
```

### 2. Install Git (if not installed)

Download from: https://git-scm.com/download/win

### 3. Install Node.js (if not installed)

Download from: https://nodejs.org/  
**Recommended:** LTS version

### 4. Install Python (if not installed)

Download from: https://www.python.org/downloads/  
**Recommended:** Python 3.10 or higher

- ✅ Add Python to PATH during installation

### 5. Install GStreamer

**Critical:** GStreamer is required for DeckLink integration.

1. Download GStreamer from: https://gstreamer.freedesktop.org/download/
   - Download **runtime** installer (MinGW 64-bit)
   - Download **development** installer (MinGW 64-bit)

2. Install both packages
3. Add to PATH:
   ```
   C:\gstreamer\1.0\msvc_x86_64\bin
   ```

4. Verify installation:
   ```powershell
   gst-inspect-1.0 --version
   ```

### 6. Install Blackmagic Desktop Video

1. Download from: https://www.blackmagicdesign.com/support
2. Install Blackmagic Desktop Video software
3. Reboot if required
4. Verify DeckLink card is detected in Device Manager

### 7. Clone Project

```powershell
cd C:\Users\seithigal-youtube\Documents
git clone <REPOSITORY_URL>
cd media_stream
```

### 8. Install Backend Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

**Note:** PyGObject installation on Windows may require additional steps:
```powershell
pip install PyGObject
```

If PyGObject installation fails, download precompiled wheels from:
https://www.lfd.uci.edu/~gohlke/pythonlibs/#pygobject

### 9. Install Frontend Dependencies

```powershell
cd ..  # Back to project root
npm install
```

### 10. Configure Network Access

Update `vite.config.ts` to listen on all interfaces

### 11. Update Firewall Rules

Allow incoming connections on ports:
- **5173** (Frontend - Vite)
- **8000** (Backend - FastAPI)

## Running the Application

### Using restart_server.ps1 (Recommended)

```powershell
.\restart_server.ps1
```

## Accessing the Application

### From Your Local Browser:
```
http://115.112.70.85:5173
```

## Verifying GStreamer Integration

### Check if GStreamer is detected:
```
http://115.112.70.85:8000/decklink/devices
```

## YouTube Streaming Setup

### Get YouTube RTMPS URL:
1. Go to YouTube Studio → Go Live
2. Copy the **Stream URL** and **Stream Key**
3. Format: `rtmps://a.rtmp.youtube.com:443/live2/<STREAM_KEY>`
