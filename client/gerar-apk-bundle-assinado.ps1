# Script para gerar APK ASSINADO com SDK COMPLETO (Bundle Local)
# Este APK contém todo o código web embutido e funciona OFFLINE

Write-Host "🚀 Iniciando geração do APK ASSINADO com SDK COMPLETO..." -ForegroundColor Green
Write-Host "📦 Este APK funcionará OFFLINE com todo o código embutido" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na pasta 'client'" -ForegroundColor Red
    exit 1
}

# Verificar se existe keystore
$keystorePath = "android\app\release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "`n⚠️  Keystore não encontrada!" -ForegroundColor Yellow
    Write-Host "   Criando nova keystore..." -ForegroundColor Yellow
    Write-Host "`n   Você precisará fornecer:" -ForegroundColor Yellow
    Write-Host "   - Nome completo" -ForegroundColor Yellow
    Write-Host "   - Nome da organização" -ForegroundColor Yellow
    Write-Host "   - Senha (guarde bem esta senha!)" -ForegroundColor Yellow
    Write-Host "   - Alias (ex: key0)" -ForegroundColor Yellow
    
    $keystoreAlias = Read-Host "Digite o alias da keystore"
    $keystorePassword = Read-Host "Digite a senha da keystore" -AsSecureString
    $keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))
    
    # Criar keystore
    $keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
    if (-not (Test-Path $keytoolPath)) {
        Write-Host "❌ Java não encontrado. Configure JAVA_HOME" -ForegroundColor Red
        exit 1
    }
    
    & $keytoolPath -genkey -v -keystore $keystorePath -alias $keystoreAlias -keyalg RSA -keysize 2048 -validity 10000 -storepass $keystorePasswordPlain -keypass $keystorePasswordPlain
    
    Write-Host "✅ Keystore criada!" -ForegroundColor Green
}

# Backup da configuração atual
Write-Host "`n💾 Fazendo backup da configuração atual..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.json") {
    Copy-Item "capacitor.config.json" "capacitor.config.json.backup" -Force
}

# Usar configuração de bundle
Write-Host "`n🔄 Configurando para modo BUNDLE (SDK completo)..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.bundle.json") {
    Copy-Item "capacitor.config.bundle.json" "capacitor.config.json" -Force
    Write-Host "✅ Configuração de bundle aplicada" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo capacitor.config.bundle.json não encontrado!" -ForegroundColor Red
    exit 1
}

# Passo 1: Build do React
Write-Host "`n📦 Passo 1: Fazendo build do React..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer build do React" -ForegroundColor Red
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

# Passo 2: Sincronizar com Capacitor
Write-Host "`n🔄 Passo 2: Sincronizando com Capacitor (modo bundle)..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar com Capacitor" -ForegroundColor Red
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

# Passo 3: Gerar APK assinado
Write-Host "`n🔨 Passo 3: Gerando APK ASSINADO..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar APK" -ForegroundColor Red
    Set-Location ..
    # Restaurar backup
    if (Test-Path "capacitor.config.json.backup") {
        Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    }
    exit 1
}

Set-Location ..

# Localizar o APK gerado
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $newApkPath = "app-release-BUNDLE-assinado-$timestamp.apk"
    Copy-Item $apkPath $newApkPath
    
    Write-Host "`n✅ APK ASSINADO com SDK COMPLETO gerado com sucesso!" -ForegroundColor Green
    Write-Host "📱 Localização: $newApkPath" -ForegroundColor Cyan
    Write-Host "`n✨ Características deste APK:" -ForegroundColor Yellow
    Write-Host "   ✅ Funciona OFFLINE (código completo embutido)" -ForegroundColor Green
    Write-Host "   ✅ Não depende do servidor web" -ForegroundColor Green
    Write-Host "   ✅ SDK completo incluído" -ForegroundColor Green
    Write-Host "   ✅ Assinado e pronto para distribuição" -ForegroundColor Green
    Write-Host "   ⚠️  Para atualizar, precisa gerar novo APK" -ForegroundColor Yellow
} else {
    Write-Host "❌ APK não encontrado em: $apkPath" -ForegroundColor Red
}

# Restaurar configuração original
Write-Host "`n🔄 Restaurando configuração original..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.json.backup") {
    Copy-Item "capacitor.config.json.backup" "capacitor.config.json" -Force
    Remove-Item "capacitor.config.json.backup" -Force
    Write-Host "✅ Configuração restaurada" -ForegroundColor Green
}

Write-Host "`n✨ Processo concluído!" -ForegroundColor Green
