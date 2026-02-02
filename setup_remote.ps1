$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"
$REMOTE_DIR = "/home/seithigal-youtube/media_stream"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remote Server - Initial Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if directory exists
Write-Host "Checking if repository exists..." -ForegroundColor Yellow
$checkCmd = "ls -la /home/seithigal-youtube/ | grep media_stream || echo 'Not found'"
$result = & $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $checkCmd

if ($result -match "Not found" -or $result -match "ls: cannot access") {
    Write-Host "Repository not found. Cloning from GitHub..." -ForegroundColor Yellow
    
    # Clone repository (public repo, no auth needed for HTTPS)
    $cloneCmd = "cd /home/seithigal-youtube && git clone https://github.com/vannan-mani/media_streamer.git media_stream"
    & $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $cloneCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Clone failed! Check if repository is private." -ForegroundColor Red
        Write-Host "If private, you'll need to set up authentication." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Repository cloned!" -ForegroundColor Green
}
else {
    Write-Host "Repository exists. Pulling latest changes..." -ForegroundColor Yellow
    $pullCmd = "cd $REMOTE_DIR && git pull origin main"
    & $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $pullCmd
    Write-Host "Code updated!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Making deploy script executable..." -ForegroundColor Yellow
$chmodCmd = "chmod +x $REMOTE_DIR/deploy.sh"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $chmodCmd

Write-Host ""
Write-Host "Running deployment script..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  - Install Node.js dependencies" -ForegroundColor Cyan
Write-Host "  - Build frontend" -ForegroundColor Cyan
Write-Host "  - Install Python dependencies" -ForegroundColor Cyan
Write-Host "  - Setup systemd services" -ForegroundColor Cyan
Write-Host "  - Start the application" -ForegroundColor Cyan
Write-Host ""

$deployCmd = "cd $REMOTE_DIR && ./deploy.sh"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $deployCmd

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
