# Script de déploiement automatique SoloPrice Pro
param (
    [switch]$UpdateOnly = $false
)

Write-Host "🚀 Démarrage..." -ForegroundColor Cyan

if ($UpdateOnly) {
    Write-Host "📦 Mise à jour du code (Push GitHub)..." -ForegroundColor Yellow
    git add .
    git commit -m "update: Rebranding DomTomConnect collaboration"
    git push origin main
    Write-Host "✅ Code mis à jour sur GitHub ! Vercel va redéployer automatiquement." -ForegroundColor Green
    exit
}

# --- Initial Setup Logic (Previous Script) ---
# 1. GitHub
Write-Host "1. Création du dépôt GitHub..." -ForegroundColor Yellow
try {
    gh --version | Out-Null
    if ($?) {
        gh repo create soloprice-pro --public --source . --remote origin --push
        Write-Host "✅ Dépôt GitHub créé et poussé !" -ForegroundColor Green
    }
    else {
        Write-Host "❌ GitHub CLI (gh) n'est pas installé." -ForegroundColor Red
        Write-Host "👉 Créez le dépôt manuellement sur github.com et lancez :"
        Write-Host "   git remote add origin <URL>"
        Write-Host "   git push -u origin main"
    }
}
catch {
    Write-Host "⚠️ Erreur lors de la création GitHub (Dépôt existe peut-être déjà ?)" -ForegroundColor Red
}

# 2. Vercel
Write-Host "`n2. Déploiement sur Vercel..." -ForegroundColor Yellow
try {
    vercel --version | Out-Null
    if ($?) {
        vercel --prod
        Write-Host "✅ Déploiement Vercel terminé !" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Vercel CLI n'est pas installé." -ForegroundColor Red
        Write-Host "👉 Installez-le ou utilisez vercel.com"
    }
}
catch {
    Write-Host "⚠️ Erreur lors du déploiement Vercel" -ForegroundColor Red
}

Write-Host "`n✨ Terminé !" -ForegroundColor Cyan
