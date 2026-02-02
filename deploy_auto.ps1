# Git-based deployment workflow
# Local script: Commit, push, and trigger remote deployment

$PLINK = "C:\Program Files\PuTTY\plink.exe"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_USER = "seithigal-youtube"
$REMOTE_PASS = "Tech@123"
$REMOTE_DIR = "/home/seithigal-youtube/media_stream"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Media Stream - Git Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git Status
Write-Host "Step 1: Checking Git status..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 2: Stage all changes
Write-Host "Step 2: Staging changes..." -ForegroundColor Yellow
git add .
Write-Host "Changes staged!" -ForegroundColor Green
Write-Host ""

# Step 3: Commit
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Deploy: Nested card UI updates"
}

Write-Host "Step 3: Committing..." -ForegroundColor Yellow
git commit -m $commitMessage
Write-Host "Committed!" -ForegroundColor Green
Write-Host ""

# Step 4: Push to GitHub
Write-Host "Step 4: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Pushed to GitHub!" -ForegroundColor Green
Write-Host ""

# Step 5: Trigger remote deployment
Write-Host "Step 5: Deploying on remote server..." -ForegroundColor Yellow
Write-Host "This will:"
Write-Host "  - Pull latest code from Git"
Write-Host "  - Install dependencies"
Write-Host "  - Build frontend"
Write-Host "  - Setup systemd services"
Write-Host "  - Restart application"
Write-Host ""

$deployCmd = "cd $REMOTE_DIR && chmod +x deploy.sh && ./deploy.sh"
& $PLINK -pw $REMOTE_PASS -batch "$REMOTE_USER@$REMOTE_HOST" $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Remote deployment encountered issues." -ForegroundColor Red
    Write-Host "Check the output above for details." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application is live at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$REMOTE_HOST`:5173" -ForegroundColor White
Write-Host "  Backend:  http://$REMOTE_HOST`:8000" -ForegroundColor White
Write-Host ""
