# Script para gerar APK com SDK COMPLETO (Bundle Local)
# Este APK contem todo o codigo web embutido e funciona OFFLINE

Write-Host "Iniciando geracao do APK com SDK COMPLETO (Bundle Local)..." -ForegroundColor Green
Write-Host "Este APK funcionara OFFLINE com todo o codigo embutido" -ForegroundColor Cyan

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta client" -ForegroundColor Red
    exit 1
}

# Backup da configuracao atual
Write-Host ""
Write-Host "Fazendo backup da configuracao atual..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.json") {
    Copy-Item "capacitor.config.json" "capacitor.config.json.backup" -Force
}

# Usar configuracao de bundle
Write-Host ""
Write-Host "Configurando para modo BUNDLE (SDK completo)..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.bundle.json") {
    Copy-Item "capacitor.config.bundle.json" "capacitor.config.json" -Force
    Write-Host "Configuracao de bundle aplicada" -ForegroundColor Green
} else {
    Write-Host "ERRO: Arquivo capacitor.config.bundle.json nao encontrado!" -ForegroundColor Red
    exit 1
}

# Passo 1: Build do React
Write-Host ""
Write-Host "Passo 1: Fazendo build do React..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao fazer build do React" -ForegroundColor Red
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

# Passo 2: Sincronizar com Capacitor
Write-Host ""
Write-Host "Passo 2: Sincronizando com Capacitor (modo bundle)..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao sincronizar com Capacitor" -ForegroundColor Red
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

# Passo 3: Gerar APK usando Gradle
Write-Host ""
Write-Host "Passo 3: Gerando APK com Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar APK" -ForegroundColor Red
    Set-Location ..
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

Set-Location ..

# Localizar o APK gerado
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"

if (Test-Path $apkPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $newApkPath = "app-release-BUNDLE-$timestamp.apk"
    Copy-Item $apkPath $newApkPath
    
    Write-Host ""
    Write-Host "APK com SDK COMPLETO gerado com sucesso!" -ForegroundColor Green
    Write-Host "Localizacao: $newApkPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Caracteristicas deste APK:" -ForegroundColor Yellow
    Write-Host "   - Funciona OFFLINE (codigo completo embutido)" -ForegroundColor Green
    Write-Host "   - Nao depende do servidor web" -ForegroundColor Green
    Write-Host "   - SDK completo incluido" -ForegroundColor Green
    Write-Host "   - Para atualizar, precisa gerar novo APK" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NOTA: Este APK nao esta assinado." -ForegroundColor Yellow
    Write-Host "Para instalar em dispositivos, voce precisa:" -ForegroundColor Yellow
    Write-Host "   1. Assinar o APK com uma keystore" -ForegroundColor Yellow
    Write-Host "   2. Ou habilitar Instalar de fontes desconhecidas no dispositivo" -ForegroundColor Yellow
} else {
    Write-Host "ERRO: APK nao encontrado em: $apkPath" -ForegroundColor Red
}

# Restaurar configuracao original
Write-Host ""
Write-Host "Restaurando configuracao original..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.json.backup") {
    Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    Remove-Item "capacitor.config.json.backup" -Force
    Write-Host "Configuracao restaurada" -ForegroundColor Green
}

Write-Host ""
Write-Host "Processo concluido!" -ForegroundColor Green
