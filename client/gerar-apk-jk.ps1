# Script Automático Customizado para JK Mercearia
# Usa JDK 17 baixado localmente

param(
    [string]$keystorePassword = "Resgate2025",
    [string]$keyAlias = "key0"
)

$JDK_PATH = "C:\Users\Jadney e Kele\Documents\PROJETO JK MERCEARIA\JK MERCEARIA\client\jdk17\jdk-17.0.14+7"
$JAVA_EXE = Join-Path $JDK_PATH "bin\java.exe"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR JK MERCEARIA - JDK 17" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se JDK existe
if (-not (Test-Path $JAVA_EXE)) {
    Write-Host "ERRO: JDK 17 nao encontrado em $JDK_PATH" -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $JDK_PATH
$env:Path = "$JDK_PATH\bin;$env:Path"

$keytool = Join-Path $JDK_PATH "bin\keytool.exe"
$jarsigner = Join-Path $JDK_PATH "bin\jarsigner.exe"

Write-Host "OK: Usando JDK 17 de $JDK_PATH" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 1: BUILD DO REACT
# ============================================
Write-Host "PASSO 1: Fazendo build do React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# ============================================
# PASSO 2: SINCRONIZAR COM CAPACITOR
# ============================================
Write-Host "PASSO 2: Sincronizando com Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

# ============================================
# PASSO 3: GERAR APK
# ============================================
Write-Host "PASSO 3: Gerando APK com Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { 
    Set-Location ..
    exit 1 
}
Set-Location ..

# ============================================
# PASSO 4: VERIFICAR/CRIAR KEYSTORE
# ============================================
$keystorePath = "android\app\release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "Criando keystore..." -ForegroundColor Yellow
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias $keyAlias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $keystorePassword `
        -keypass $keystorePassword `
        -dname "CN=JK Mercearia, OU=App, O=JK, L=Brasil, ST=Estado, C=BR" `
        -noprompt
}

# ============================================
# PASSO 5: ASSINAR APK
# ============================================
Write-Host "PASSO 4: Assinando APK..." -ForegroundColor Yellow
$apkPathUnsigned = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$apkPathRelease = "android\app\build\outputs\apk\release\app-release.apk"
$apkToSign = $null

if (Test-Path $apkPathUnsigned) { $apkToSign = $apkPathUnsigned }
elseif (Test-Path $apkPathRelease) { $apkToSign = $apkPathRelease }

if (-not $apkToSign) {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    exit 1
}

$apkPathSigned = "android\app\build\outputs\apk\release\app-JK-Mercearia-signed.apk"
Copy-Item $apkToSign $apkPathSigned -Force

& $jarsigner -verbose `
    -sigalg SHA256withRSA `
    -digestalg SHA256 `
    -keystore $keystorePath `
    -storepass $keystorePassword `
    $apkPathSigned `
    $keyAlias

# ============================================
# PASSO 6: COPIAR APK FINAL
# ============================================
$finalApkPath = "app-JK-Mercearia.apk"
Copy-Item $apkPathSigned $finalApkPath -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  OK: APK GERADO: $finalApkPath" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
