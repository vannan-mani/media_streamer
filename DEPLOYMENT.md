# Remote Deployment Guide

## Remote Server Details
- **IP**: 115.112.70.85
- **Username**: seithigal-youtube
- **Password**: Tech@123

## Deployment Steps

### 1. Build the Production Bundle
```powershell
npm run build
```

### 2. Connect to Remote Server
```powershell
# Using SSH (if available)
ssh seithigal-youtube@115.112.70.85

# Or using PuTTY/Remote Desktop
```

### 3. Prerequisites on Remote Server
Ensure the remote server has:
- Node.js (v18 or higher)
- npm
- Git (optional, for cloning)

### 4. Transfer Files to Remote Server

**Option A: Using SCP (if SSH is available)**
```powershell
scp -r dist seithigal-youtube@115.112.70.85:/home/seithigal-youtube/dashboard/
```

**Option B: Using SFTP/FileZilla**
1. Open FileZilla
2. Host: 115.112.70.85
3. Username: seithigal-youtube
4. Password: Tech@123
5. Port: 22
6. Transfer the `dist/` folder

**Option C: Clone from Git**
```bash
# On remote server
git clone https://github.com/vannan-mani/media_streamer.git
cd media_streamer
npm install
npm run build
```

### 5. Serve on Remote Server

**Option A: Using Node.js HTTP Server**
```bash
npm install -g serve
serve -s dist -l 5173
```

**Option B: Using Nginx**
```bash
# Install nginx
sudo apt-get update
sudo apt-get install nginx

# Copy files
sudo cp -r dist/* /var/www/html/dashboard/

# Configure nginx
sudo nano /etc/nginx/sites-available/dashboard
```

Nginx config:
```nginx
server {
    listen 80;
    server_name 115.112.70.85;
    
    root /var/www/html/dashboard;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 6. Access Dashboard
Open browser and navigate to:
```
http://115.112.70.85
```

Or with specific port (if using serve):
```
http://115.112.70.85:5173
```

## Firewall Configuration
Ensure port 5173 (or 80) is open:
```bash
# Ubuntu/Debian
sudo ufw allow 5173
sudo ufw allow 80

# Or for specific port range
sudo ufw allow 5173/tcp
```

## Development Mode on Remote Server
If you want to run in dev mode on the remote server:
```bash
cd media_streamer
npm install
npm run dev -- --host 0.0.0.0
```

Then access via:
```
http://115.112.70.85:5173
```
