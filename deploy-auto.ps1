# Automated Remote Deployment Script
# This script will: Build → Zip → Upload → Extract → Run on Remote Server

$ErrorActionPreference = "Stop"

# Configuration
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASSWORD = "Tech@123"
$REMOTE_PATH = "/home/seithigal-youtube/dashboard"
$LOCAL_ZIP = "dashboard.zip"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 SDI Dashboard Auto-Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "📦 Step 1/5: Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Create ZIP
Write-Host "🗜️  Step 2/5: Creating deployment package..." -ForegroundColor Yellow
$sourceDir = Join-Path $PWD "dist"
$zipFile = Join-Path $PWD $LOCAL_ZIP

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Compress-Archive -Path "$sourceDir\*" -DestinationPath $zipFile -CompressionLevel Optimal
Write-Host "✅ Package created: $zipFile" -ForegroundColor Green
Write-Host ""

# Step 3: Check for SSH
Write-Host "🔍 Step 3/5: Checking SSH availability..." -ForegroundColor Yellow

$sshAvailable = $false
try {
    $null = Get-Command ssh -ErrorAction Stop
    $null = Get-Command scp -ErrorAction Stop
    $sshAvailable = $true
    Write-Host "✅ SSH/SCP found!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  SSH/SCP not found. Trying alternative method..." -ForegroundColor Yellow
}
Write-Host ""

if ($sshAvailable) {
    # Step 4: Upload via SCP
    Write-Host "📤 Step 4/5: Uploading to remote server..." -ForegroundColor Yellow
    Write-Host "   (You may be prompted for password: Tech@123)" -ForegroundColor Gray
    
    # Create remote directory if it doesn't exist
    $createDirCmd = "mkdir -p $REMOTE_PATH"
    echo "yes" | ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "$createDirCmd" 2>$null
    
    # Upload file
    echo "yes" | scp -o StrictHostKeyChecking=no "$zipFile" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Upload failed!" -ForegroundColor Red
        Write-Host "💡 Try installing OpenSSH: Settings → Apps → Optional Features → OpenSSH Client" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host ""

    # Step 5: Extract and Run on Remote
    Write-Host "🎯 Step 5/5: Setting up on remote server..." -ForegroundColor Yellow
    
    $remoteCommands = @"
cd $REMOTE_PATH
unzip -o dashboard.zip
rm -f dashboard.zip
pkill -f 'serve.*5173' || true
nohup npx serve -s . -l 5173 > server.log 2>&1 &
sleep 2
echo '✅ Dashboard is running!'
"@

    echo "yes" | ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "$remoteCommands"
    
    Write-Host "✅ Remote setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dashboard URL: " -NoNewline
    Write-Host "http://$REMOTE_HOST:5173" -ForegroundColor Green
    Write-Host ""
    Write-Host "To view server logs, SSH to server and run:" -ForegroundColor Gray
    Write-Host "   ssh ${REMOTE_USER}@${REMOTE_HOST}" -ForegroundColor Gray
    Write-Host "   cat $REMOTE_PATH/server.log" -ForegroundColor Gray
    Write-Host ""
    
}
else {
    # SSH not available - provide manual instructions
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host "⚠️  SSH NOT AVAILABLE" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install OpenSSH Client:" -ForegroundColor White
    Write-Host "1. Open Settings → Apps → Optional Features" -ForegroundColor White
    Write-Host "2. Click 'Add a feature'" -ForegroundColor White
    Write-Host "3. Search for 'OpenSSH Client'" -ForegroundColor White
    Write-Host "4. Install and restart PowerShell" -ForegroundColor White
    Write-Host ""
    Write-Host "OR use Node.js deployment script:" -ForegroundColor White
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   node deploy.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Package ready at: $zipFile" -ForegroundColor Cyan
}

# Cleanup
if (Test-Path $zipFile) {
    # Keep the zip file for manual deployment if needed
    # Remove-Item $zipFile -Force
}
