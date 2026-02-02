# Remote Deployment Workflow

## Overview

Develop locally → Deploy to 115.112.70.85 → Test via browser

## Deployment Scripts

### Option 1: deploy_remote.ps1 (Recommended)
Uses PuTTY's pscp/plink for file transfer and remote execution.

**Prerequisites:**
- Install PuTTY from https://www.putty.org/

**Usage:**
```powershell
# Deploy only (copy files + install dependencies)
.\deploy_remote.ps1

# Deploy and start server
.\deploy_remote.ps1 -Start

# Deploy and restart server
.\deploy_remote.ps1 -Restart

# Stop remote server
.\deploy_remote.ps1 -Stop
```

### Option 2: quick_deploy.ps1 (Alternative)
Uses PowerShell remoting (requires WinRM enabled on remote).

**Usage:**
```powershell
.\quick_deploy.ps1 -Start
```

## Workflow

### 1. Make Changes Locally
Edit code on your local machine as usual.

### 2. Deploy to Remote
```powershell
.\deploy_remote.ps1 -Restart
```

This will:
- Copy all files to 115.112.70.85
- Install npm/pip dependencies
- Restart the application

### 3. Test from Browser
Open your local browser to:
```
http://115.112.70.85:5173
```

## Direct Remote Scripts

These scripts run ON the remote machine (115.112.70.85):

### remote_start.ps1
Starts both frontend and backend servers.

### stop_server.ps1
Stops all running processes.

## Manual Deployment (Alternative)

If scripts fail, you can deploy manually:

### 1. Copy Files
Use Windows File Sharing or WinSCP:
```
\\115.112.70.85\c$\Users\seithigal-youtube\Documents\media_stream
```

### 2. Remote Desktop
```powershell
mstsc /v:115.112.70.85
```

### 3. Run Commands
```powershell
cd C:\Users\seithigal-youtube\Documents\media_stream
.\remote_start.ps1
```

## Testing Checklist

After deployment:
- [ ] Frontend loads: http://115.112.70.85:5173
- [ ] Backend responds: http://115.112.70.85:8000/health
- [ ] DeckLink devices detected: http://115.112.70.85:8000/decklink/devices
- [ ] System stats update: Check graphs in dashboard
- [ ] Stream controls work: Start/Stop buttons

## Troubleshooting

### Connection Failed
- Verify machine is on network
- Ping 115.112.70.85
- Check firewall allows ports 5173, 8000

### Deployment Fails
- Ensure PuTTY is installed
- Try Remote Desktop method instead
- Check disk space on remote machine

### Application Won't Start
- Remote Desktop to machine
- Check logs in PowerShell windows
- Verify ports not already in use:
  ```powershell
  netstat -ano | findstr :5173
  netstat -ano | findstr :8000
  ```

## Quick Reference

```powershell
# Most common workflow:
.\deploy_remote.ps1 -Restart

# Then test at:
http://115.112.70.85:5173
```
