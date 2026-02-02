$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Single Server Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$fixSetup = @'
cd /home/seithigal-youtube/media_stream

echo "=== Stopping and disabling frontend service (not needed) ==="
echo Tech@123 | sudo -S systemctl stop media-stream-frontend
echo Tech@123 | sudo -S systemctl disable media-stream-frontend

echo ""
echo "=== Killing process on port 8000 ==="
echo Tech@123 | sudo -S fuser -k 8000/tcp || echo "No process to kill"

echo ""
echo "=== Verifying dist folder exists ==="
ls -la dist/ | head -10

echo ""
echo "=== Starting backend (which serves everything) ==="
echo Tech@123 | sudo -S systemctl restart media-stream-backend
sleep 3

echo ""
echo "=== Checking backend status ==="
echo Tech@123 | sudo -S systemctl status media-stream-backend --no-pager | head -15

echo ""
echo "=== Verifying port 8000 is listening ==="
echo Tech@123 | sudo -S netstat -tulpn | grep 8000
'@

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $fixSetup

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Yellow
Write-Host "  http://$REMOTE_HOST`:8000" -ForegroundColor White
Write-Host ""
Write-Host "(Port 5173 frontend server disabled - not needed)" -ForegroundColor Gray
Write-Host ""
