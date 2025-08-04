# Habicore POS Deployment Script (PowerShell)
Write-Host "🚀 Starting Habicore POS deployment preparation..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📝 Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm run install:all

# Build projects to verify everything works
Write-Host "🔨 Building projects..." -ForegroundColor Yellow
npm run build

# Check if everything built successfully
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Push your code to GitHub:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Ready for deployment'" -ForegroundColor Gray
    Write-Host "   git remote add origin https://github.com/yourusername/habicore-pos.git" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Go to Render.com and deploy:" -ForegroundColor White
    Write-Host "   - Create PostgreSQL database" -ForegroundColor Gray
    Write-Host "   - Deploy backend web service" -ForegroundColor Gray
    Write-Host "   - Deploy frontend static site" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Or use the render.yaml for one-click deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
