# Script de deploiement automatique SoloPrice Pro
param (
    [switch]$UpdateOnly = $false
)

Write-Host "Demarrage..." -ForegroundColor Cyan

if ($UpdateOnly) {
    Write-Host "Mise a jour du code (Push GitHub)..." -ForegroundColor Yellow
    git add .
    git commit -m "update: Rebranding DomTomConnect collaboration"
    git push origin main
    Write-Host "Code mis a jour sur GitHub ! Vercel va redeployer automatiquement." -ForegroundColor Green
    exit
}

# --- Initial Setup Logic (Previous Script) ---
# 1. GitHub
Write-Host "1. Creation du depot GitHub..." -ForegroundColor Yellow
try {
    gh --version | Out-Null
    if ($?) {
        gh repo create soloprice-pro --public --source . --remote origin --push
        Write-Host "Depot GitHub cree et pousse !" -ForegroundColor Green
    }
    else {
        Write-Host "GitHub CLI (gh) n'est pas installe." -ForegroundColor Red
        Write-Host "Créez le depot manuellement sur github.com et lancez :"
        Write-Host '   git remote add origin <URL>'
        Write-Host '   git push -u origin main'
    }
}
catch {
    Write-Host "Erreur lors de la creation GitHub (Depot existe peut-etre deja ?)" -ForegroundColor Red
}

# 2. Vercel
Write-Host "2. Deploiement sur Vercel..." -ForegroundColor Yellow
try {
    vercel --version | Out-Null
    if ($?) {
        vercel --prod
        Write-Host "Deploiement Vercel termine !" -ForegroundColor Green
    }
    else {
        Write-Host "Vercel CLI n'est pas installe." -ForegroundColor Red
        Write-Host "Installez-le ou utilisez vercel.com"
    }
}
catch {
    Write-Host "Erreur lors du deploiement Vercel" -ForegroundColor Red
}

Write-Host "Termine !" -ForegroundColor Cyan
