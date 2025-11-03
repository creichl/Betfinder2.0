# ============================================
# Git Push Script für BetFinder 2.0
# ============================================
# Einfach dieses Script in PowerShell ausführen!
# ============================================

Write-Host "🚀 Starting Git Push Process..." -ForegroundColor Cyan
Write-Host ""

# Wechsle ins Projektverzeichnis
Set-Location "C:\work\betfinder2.0"

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Zeige Status
Write-Host "📊 Git Status:" -ForegroundColor Yellow
git status
Write-Host ""

# Frage nach GitHub Username
$githubUsername = Read-Host "Enter your GitHub username"
Write-Host ""

# Prüfe ob Remote existiert
$remoteExists = git remote -v 2>&1
if ($remoteExists -match "origin") {
    Write-Host "✅ Git remote already exists" -ForegroundColor Green
} else {
    Write-Host "📌 Adding Git remote..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$githubUsername/betfinder2.0.git"
    Write-Host "✅ Remote added" -ForegroundColor Green
}
Write-Host ""

# Füge alle Änderungen hinzu
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host "✅ Changes added" -ForegroundColor Green
Write-Host ""

# Zeige was committed wird
Write-Host "📋 Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Erstelle Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Add production deployment configuration

- Add deployment scripts and nginx config
- Update database.js to use environment variables
- Configure API URL for production
- Add PM2 ecosystem config
- Add comprehensive deployment guide"

Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Push zu GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: When asked for password, use your Personal Access Token!" -ForegroundColor Red
Write-Host "   (NOT your regular GitHub password)" -ForegroundColor Red
Write-Host ""

git push -u origin main

Write-Host ""
Write-Host "✅ Push complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your repository URL:" -ForegroundColor Cyan
Write-Host "   https://github.com/$githubUsername/betfinder2.0.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Verify on GitHub: https://github.com/$githubUsername/betfinder2.0" -ForegroundColor White
Write-Host "2. Connect to your IONOS server: ssh root@YOUR-SERVER-IP" -ForegroundColor White
Write-Host "3. Continue with deployment" -ForegroundColor White
Write-Host ""

# Pause am Ende
Read-Host "Press Enter to close"
