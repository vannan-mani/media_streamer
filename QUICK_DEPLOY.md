# Quick Remote Deployment Steps

The dashboard is now **built and packaged** at:
`C:\Users\vanna\Documents\dev\pallavi\ashley\media_stream\dashboard.zip`

## ✅ What's Fixed
- Layout overflow issues resolved
- Visual sharpness improved (better borders, shadows, contrast)
- Context drawer height fixed (no overflow)
- Control stack scrolls properly
- All components fit within viewport

## 🚀 Deploy to Remote Server

### Server Details
- **IP**: 115.112.70.85
- **Username**: seithigal-youtube
- **Password**: Tech@123

### Option 1: Using FileZilla (Recommended for Windows)

1. **Download FileZilla**: https://filezilla-project.org/download.php?type=client

2. **Connect**:
   - Host: `sftp://115.112.70.85`
   - Username: `seithigal-youtube`
   - Password: `Tech@123`
   - Port: `22`
   - Click "Quickconnect"

3. **Upload**:
   - Navigate to `/home/seithigal-youtube/dashboard/` on remote side
   - Upload `dashboard.zip` from local machine

4. **SSH to Server** (use PuTTY or Windows Terminal):
   ```bash
   ssh seithigal-youtube@115.112.70.85
   ```
   Password: `Tech@123`

5. **Extract and Run**:
   ```bash
   cd /home/seithigal-youtube/dashboard
   unzip -o dashboard.zip
   npx serve -s . -l 5173
   ```

6. **Access Dashboard**:
   Open browser: `http://115.112.70.85:5173`

### Option 2: Using SCP (If you have SSH client)

```powershell
# From your local machine
scp dashboard.zip seithigal-youtube@115.112.70.85:/home/seithigal-youtube/dashboard/

# Then SSH to server
ssh seithigal-youtube@115.112.70.85

# Extract and run
cd /home/seithigal-youtube/dashboard
unzip -o dashboard.zip
npx serve -s . -l 5173
```

---

## 🔥 Firewall Note
If you can't access the dashboard after deployment, make sure port 5173 is open:

```bash
# On remote server
sudo ufw allow 5173/tcp
sudo ufw reload
```

---

## 🎯 Testing on Remote Server

Once deployed, test these interactions:
1. **Status Strip**: Hover/click to see health sparklines
2. **Control Stack**: Click cards to expand
3. **Context Drawer**: Should open by default
4. **ESC Key**: Closes all expansions
5. **Network Alerts**: Will appear in demo mode

---

## Alternative: Run Dev Mode on Remote Server

If you want continuous development on the remote server:

1. **Clone repo** (one-time):
   ```bash
   ssh se ithigal-youtube@115.112.70.85
   cd ~
   git clone https://github.com/vannan-mani/media_streamer.git
   cd media_streamer
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

3. **Access**: `http://115.112.70.85:5173`

---

## 📁 Files Created
- `dashboard.zip` - Production build (ready to deploy)
- `deploy.ps1` - PowerShell deployment script
- `deploy.sh` - Bash deployment script (for Linux/Mac)
- `DEPLOYMENT.md` - Full deployment documentation
