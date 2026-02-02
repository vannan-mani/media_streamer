$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "Fixing port conflicts and installing serve..." -ForegroundColor Yellow
Write-Host ""

$fixIssues = @'
echo "=== Killing process on port 8000 ==="
echo Tech@123 | sudo -S fuser -k 8000/tcp || echo "No process on 8000"

echo ""
echo "=== Installing serve globally ==="
echo Tech@123 | sudo -S npm install -g serve

echo ""
echo "=== Restarting services ==="
echo Tech@123 | sudo -S systemctl restart media-stream-backend
echo Tech@123 | sudo -S systemctl restart media-stream-frontend

sleep 3

echo ""
echo "=== Checking status ==="
echo Tech@123 | sudo -S systemctl status media-stream-backend --no-pager | head -15
echo ""
echo Tech@123 | sudo -S systemctl status media-stream-frontend --no-pager | head -15

echo ""
echo "=== Checking ports ==="
echo Tech@123 | sudo -S netstat -tulpn | grep -E '5173|8000'
'@

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $fixIssues
