# Script de deploy otimizado para Windows PowerShell
# Este script limpa o build antigo e faz deploy com configurações otimizadas

Write-Host "🚀 Iniciando deploy otimizado..." -ForegroundColor Green

# Navegar para o diretório do cliente
Set-Location client

Write-Host "📦 Limpando build anterior..." -ForegroundColor Yellow
# Remover build anterior
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

Write-Host "🔨 Fazendo novo build..." -ForegroundColor Yellow
# Fazer novo build
npm run build

# Verificar se o build foi criado
if (-not (Test-Path "build")) {
    Write-Host "❌ Erro: Build não foi criado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build criado com sucesso!" -ForegroundColor Green

# Voltar para o diretório raiz
Set-Location ..

Write-Host "🔥 Fazendo deploy para Firebase..." -ForegroundColor Yellow
# Deploy apenas do hosting
firebase deploy --only hosting

Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host "💡 Dica: Se ainda houver problemas de cache, peça aos usuários para:" -ForegroundColor Cyan
Write-Host "   1. Pressionar Ctrl+Shift+R (hard refresh)" -ForegroundColor Cyan
Write-Host "   2. Ou abrir DevTools > Network > Disable cache" -ForegroundColor Cyan
Write-Host "   3. Ou usar modo incógnito" -ForegroundColor Cyan
