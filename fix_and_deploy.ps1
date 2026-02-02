$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "Fixing git conflict and deploying..." -ForegroundColor Yellow

$fixAndDeploy = @'
cd /home/seithigal-youtube/media_stream
git reset --hard HEAD
git pull origin main
./deploy.sh
'@

& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $fixAndDeploy
