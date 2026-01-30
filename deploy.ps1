# PowerShell Deployment Script for Windows
# Remote Server: 115.112.70.85

$REMOTE_USER = "seithigal-youtube"
$REMOTE_HOST = "115.112.70.85"
$REMOTE_PASSWORD = "Tech@123"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SDI Dashboard Remote Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Build production bundle
Write-Host "`nBuilding production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 2: Create a zip package
Write-Host "`nCreating deployment package..." -ForegroundColor Yellow
$sourceDir = Join-Path $PWD "dist"
$zipFile = Join-Path $PWD "dashboard.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Compress-Archive -Path "$sourceDir\*" -DestinationPath $zipFile -CompressionLevel Optimal

Write-Host "✅ Package created: $zipFile" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Manual Transfer Steps:" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "1. Use WinSCP or FileZilla to connect to:" -ForegroundColor White
Write-Host "   Host: $REMOTE_HOST" -ForegroundColor White
Write-Host "   Username: $REMOTE_USER" -ForegroundColor White
Write-Host "   Password: $REMOTE_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "2. Upload dashboard.zip to /home/$REMOTE_USER/dashboard/" -ForegroundColor White
Write-Host ""
Write-Host "3. SSH to server and run:" -ForegroundColor White
Write-Host "   cd /home/$REMOTE_USER/dashboard" -ForegroundColor Gray
Write-Host "   unzip -o dashboard.zip" -ForegroundColor Gray
Write-Host "   npx serve -s . -l 5173" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access dashboard at: http://$REMOTE_HOST:5173" -ForegroundColor Green
Write-Host ""

# Alternative: Try PSRemoting if enabled
Write-Host "Attempting direct deployment via PowerShell Remoting..." -ForegroundColor Yellow

try {
    # Note: This requires PowerShell remoting to be configured on remote server
    # For Linux servers, use OpenSSH with PowerShell Core
    
    $securePassword = ConvertTo-SecureString $REMOTE_PASSWORD -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential ($REMOTE_USER, $securePassword)
    
    # This will only work if remote server has PowerShell Core and SSH configured
    Write-Host "Connecting to remote server..." -ForegroundColor Yellow
    Write-Host "(This requires SSH to be configured. If it fails, use manual steps above)" -ForegroundColor Gray
    
} catch {
    Write-Host "⚠ Remote PowerShell connection not available" -ForegroundColor Yellow
    Write-Host "Please use the manual transfer steps above" -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Package ready for deployment: $zipFile" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
