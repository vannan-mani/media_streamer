# 🚀 One-Click Deployment

## Quick Start

Just run ONE command to deploy everything automatically:

```powershell
npm run deploy
```

This will:
1. ✅ Build the production bundle
2. ✅ Create deployment ZIP
3. ✅ Upload to 115.112.70.85
4. ✅ Extract files on remote server
5. ✅ Start the server
6. ✅ Show you the URL

---

## Two Deployment Methods

### Method 1: Node.js (Recommended ⭐)
Works on all platforms, no SSH client needed.

```powershell
npm run deploy
```

**What it does:**
- Uses Node.js `ssh2` library
- Cross-platform (Windows/Mac/Linux)
- No external dependencies
- Shows progress and logs

### Method 2: PowerShell + OpenSSH
Uses native SSH/SCP commands (requires OpenSSH).

```powershell
npm run deploy:ps
```

**Requirements:**
- OpenSSH Client must be installed
- Go to: Settings → Apps → Optional Features → Add → OpenSSH Client

---

## After Deployment

### Access Dashboard
```
http://115.112.70.85:5173
```

### View Server Logs
```bash
ssh seithigal-youtube@115.112.70.85
cat /home/seithigal-youtube/dashboard/server.log
```

### Stop Server
```bash
ssh seithigal-youtube@115.112.70.85
pkill -f 'serve.*5173'
```

### Restart Server
```bash
ssh seithigal-youtube@115.112.70.85
cd /home/seithigal-youtube/dashboard
npx serve -s . -l 5173
```

---

## Troubleshooting

### Port 5173 Not Accessible
```bash
# SSH to server
ssh seithigal-youtube@115.112.70.85

# Open firewall
sudo ufw allow 5173/tcp
sudo ufw reload

# Check if server is running
ps aux | grep serve
```

### Deployment Fails
1. **Check internet connection**
2. **Verify server credentials:**
   - Host: 115.112.70.85
   - User: seithigal-youtube
   - Password: Tech@123
3. **Try manual deployment:**
   ```powershell
   npm run build
   # Then use FileZilla to upload dist/ folder
   ```

### Server Won't Start
```bash
# SSH to server
ssh seithigal-youtube@115.112.70.85

# Check server log
cat /home/seithigal-youtube/dashboard/server.log

# Install serve if missing
npm install -g serve

# Start manually
cd /home/seithigal-youtube/dashboard
serve -s . -l 5173
```

---

## Development Workflow

### Local Development
```powershell
npm run dev
# Access: http://localhost:5173
```

### Build Only
```powershell
npm run build
```

### Restart Local Server (Utility)
```powershell
.\restart_server.ps1
```

### Deploy to Remote
```powershell
npm run deploy
```

---

## Server Details

- **IP**: 115.112.70.85
- **Username**: seithigal-youtube
- **Password**: Tech@123
- **Deploy Path**: /home/seithigal-youtube/dashboard
- **Port**: 5173
- **URL**: http://115.112.70.85:5173

---

## Files

- `deploy.js` - Node.js automated deployment (⭐ recommended)
- `deploy-auto.ps1` - PowerShell automated deployment
- `deploy.ps1` - Manual deployment helper
- `DEPLOYMENT.md` - Full deployment documentation
- `QUICK_DEPLOY.md` - Quick reference guide
