$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Git and Setting Up Repository" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Git
Write-Host "Step 1: Installing Git..." -ForegroundColor Yellow
$installGit = "sudo apt-get update && sudo apt-get install -y git"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $installGit
Write-Host "Git installed!" -ForegroundColor Green
Write-Host ""

# Step 2: Backup old directory and clone fresh
Write-Host "Step 2: Setting up repository..." -ForegroundColor Yellow
$setupRepo = @"
cd /home/seithigal-youtube && \
if [ -d media_stream ]; then mv media_stream media_stream_old_backup; fi && \
git clone https://github.com/vannan-mani/media_streamer.git media_stream && \
echo 'Repository cloned successfully!'
"@
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $setupRepo
Write-Host "Repository ready!" -ForegroundColor Green
Write-Host ""

# Step 3: Configure Git (for future pulls)
Write-Host "Step 3: Configuring Git..." -ForegroundColor Yellow
$configGit = "cd /home/seithigal-youtube/media_stream && git config user.name 'seithigal-youtube' && git config user.email 'deploy@seithigal.com'"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $configGit
Write-Host "Git configured!" -ForegroundColor Green
Write-Host ""

# Step 4: Run deployment
Write-Host "Step 4: Running deployment script..." -ForegroundColor Yellow
$runDeploy = "cd /home/seithigal-youtube/media_stream && chmod +x deploy.sh && ./deploy.sh"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $runDeploy

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
