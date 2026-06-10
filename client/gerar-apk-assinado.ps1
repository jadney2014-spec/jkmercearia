# Script para gerar APK ASSINADO do aplicativo Android
# IMPORTANTE: Você precisa ter uma keystore configurada

Write-Host "🚀 Iniciando geração do APK ASSINADO..." -ForegroundColor Green

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
    
    # Atualizar capacitor.config.json
    $config = Get-Content "capacitor.config.json" | ConvertFrom-Json
    $config.android.buildOptions.keystorePath = "release.keystore"
    $config.android.buildOptions.keystoreAlias = $keystoreAlias
    $config | ConvertTo-Json -Depth 10 | Set-Content "capacitor.config.json"
    
    Write-Host "✅ Keystore criada!" -ForegroundColor Green
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

# Passo 3: Gerar APK assinado
Write-Host "`n🔨 Passo 3: Gerando APK ASSINADO..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar APK" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Localizar o APK gerado
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $newApkPath = "app-release-assinado-$timestamp.apk"
    Copy-Item $apkPath $newApkPath
    
    Write-Host "`n✅ APK ASSINADO gerado com sucesso!" -ForegroundColor Green
    Write-Host "📱 Localização: $newApkPath" -ForegroundColor Cyan
    Write-Host "`n✨ Este APK está pronto para distribuição!" -ForegroundColor Green
} else {
    Write-Host "❌ APK não encontrado em: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Processo concluído!" -ForegroundColor Green
