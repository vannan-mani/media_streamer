$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$diagnostics = @'
echo "=== Backend Error Logs ==="
cat /home/seithigal-youtube/media_stream/logs/backend-error.log 2>/dev/null || echo "No error log file yet"

echo ""
echo "=== Testing Backend Manually ==="
cd /home/seithigal-youtube/media_stream/backend
timeout 5 python3 main.py 2>&1 || true

echo ""
echo "=== Checking Listening Ports ==="
sudo netstat -tulpn | grep -E '5173|8000'

echo ""
echo "=== Firewall Status ==="
sudo ufw status

echo ""
echo "=== Check if serve is installed ==="
which serve || echo "serve not found"
npx serve --version 2>&1 | head -1
'@

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $diagnostics
