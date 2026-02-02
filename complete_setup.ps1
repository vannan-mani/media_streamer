$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remote Server - Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Combined command with sudo password
$setupScript = @'
echo "Installing Git..."
echo Tech@123 | sudo -S apt-get update -qq
echo Tech@123 | sudo -S apt-get install -y git

echo "Setting up repository..."
cd /home/seithigal-youtube
if [ -d media_stream ]; then
    mv media_stream media_stream_backup_$(date +%Y%m%d_%H%M%S)
fi

git clone https://github.com/vannan-mani/media_streamer.git media_stream
cd media_stream

echo "Configuring Git..."
git config user.name "seithigal-youtube"
git config user.email "deploy@seithigal.com"

chmod +x deploy.sh

echo ""
echo "========================================="
echo "Media Stream - Automated Deployment"
echo "========================================="
echo ""

# Run deployment
./deploy.sh
'@

Write-Host "Executing complete setup on remote server..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  1. Install Git" -ForegroundColor Cyan
Write-Host "  2. Clone repository from GitHub" -ForegroundColor Cyan
Write-Host "  3. Run automated deployment" -ForegroundColor Cyan
Write-Host "  4. Setup systemd services" -ForegroundColor Cyan
Write-Host "  5. Start the application" -ForegroundColor Cyan
Write-Host ""

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $setupScript

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application should be running at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$REMOTE_HOST`:5173" -ForegroundColor White
Write-Host "  Backend:  http://$REMOTE_HOST`:8000" -ForegroundColor White
Write-Host ""
