$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remote Server - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$setupScript = @'
echo "Installing Git..."
echo Tech@123 | sudo -S apt-get update
echo Tech@123 | sudo -S apt-get install -y git

echo ""
echo "Setting up repository..."
cd /home/seithigal-youtube

# Backup old directory if exists
if [ -d media_stream ]; then
    mv media_stream media_stream_backup_$(date +%Y%m%d_%H%M%S)
fi

# Clone from main branch explicitly
git clone -b main https://github.com/vannan-mani/media_streamer.git media_stream
cd media_stream

# Verify we're on main branch
echo "Current branch:"
git branch

# Configure Git
git config user.name "seithigal-youtube"
git config user.email "deploy@seithigal.com"

# Make deploy script executable and run it
chmod +x deploy.sh
echo ""
echo "Running deployment..."
./deploy.sh
'@

Write-Host "Executing setup on remote server..." -ForegroundColor Yellow
Write-Host ""

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $setupScript

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$REMOTE_HOST`:5173" -ForegroundColor White
Write-Host "  Backend:  http://$REMOTE_HOST`:8000" -ForegroundColor White
Write-Host ""
