$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "Checking backend error logs..." -ForegroundColor Yellow
Write-Host ""

$checkLogs = "sudo journalctl -u media-stream-backend -n 50 --no-pager"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $checkLogs
