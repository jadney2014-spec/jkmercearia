# Script para gerar APK do aplicativo Android (MODO WEB)
# Este APK carrega do servidor remoto - atualizações automáticas!

Write-Host "🚀 Iniciando geração do APK (MODO WEB)..." -ForegroundColor Green
Write-Host "🌐 Este APK carrega do servidor - atualizações automáticas!" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na pasta 'client'" -ForegroundColor Red
    exit 1
}

# Passo 1: Build do React
Write-Host "`n📦 Passo 1: Fazendo build do React..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer build do React" -ForegroundColor Red
    exit 1
}

# Passo 2: Sincronizar com Capacitor
Write-Host "`n🔄 Passo 2: Sincronizando com Capacitor..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar com Capacitor" -ForegroundColor Red
    exit 1
}

# Passo 3: Gerar APK usando Gradle
Write-Host "`n🔨 Passo 3: Gerando APK com Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar APK" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Localizar o APK gerado
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"

if (Test-Path $apkPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $newApkPath = "app-release-$timestamp.apk"
    Copy-Item $apkPath $newApkPath
    
    Write-Host "`n✅ APK (MODO WEB) gerado com sucesso!" -ForegroundColor Green
    Write-Host "📱 Localização: $newApkPath" -ForegroundColor Cyan
    Write-Host "`n✨ Características deste APK:" -ForegroundColor Yellow
    Write-Host "   ✅ Atualizações automáticas do servidor" -ForegroundColor Green
    Write-Host "   ✅ Sempre carrega a versão mais recente" -ForegroundColor Green
    Write-Host "   ⚠️  Requer conexão com internet" -ForegroundColor Yellow
    Write-Host "`n⚠️  NOTA: Este APK não está assinado." -ForegroundColor Yellow
    Write-Host "   Para instalar em dispositivos, você precisa:" -ForegroundColor Yellow
    Write-Host "   1. Assinar o APK com uma keystore" -ForegroundColor Yellow
    Write-Host "   2. Ou habilitar Instalar de fontes desconhecidas no dispositivo" -ForegroundColor Yellow
} else {
    Write-Host "❌ APK não encontrado em: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Processo concluído!" -ForegroundColor Green
