# Script simples para assinar APK
Write-Host "=== ASSINAR APK ===" -ForegroundColor Cyan
Write-Host ""

# Encontrar APK
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    Write-Host "Gere o APK primeiro: .\gerar-apk-bundle.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "APK encontrado: $apkPath" -ForegroundColor Green
Write-Host ""

# Verificar keystore
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

if (-not (Test-Path $keystorePath)) {
    Write-Host "Criando keystore..." -ForegroundColor Yellow
    Write-Host ""
    
    $senha = Read-Host "Digite uma senha para a keystore (guarde bem!)"
    $alias = Read-Host "Digite o alias (ex: key0)"
    
    $keytool = "$env:JAVA_HOME\bin\keytool.exe"
    if (-not (Test-Path $keytool)) {
        $javaCmd = Get-Command java | Select-Object -ExpandProperty Source
        $keytool = Join-Path (Split-Path (Split-Path $javaCmd)) "bin\keytool.exe"
    }
    
    & $keytool -genkey -v -keystore $keystorePath -alias $alias -keyalg RSA -keysize 2048 -validity 10000 -storepass $senha -keypass $senha -dname "CN=App, OU=Dev, O=Org, L=City, ST=State, C=BR"
    
    # Criar arquivo de propriedades
    @"
storeFile=release.keystore
storePassword=$senha
keyAlias=$alias
keyPassword=$senha
"@ | Out-File $keystorePropsPath -Encoding UTF8
    
    Write-Host "Keystore criada!" -ForegroundColor Green
    Write-Host ""
}

# Ler propriedades
$props = @{}
if (Test-Path $keystorePropsPath) {
    Get-Content $keystorePropsPath | ForEach-Object {
        if ($_ -match '^(\w+)=(.*)$') {
            $props[$matches[1]] = $matches[2]
        }
    }
} else {
    Write-Host "Digite as informacoes da keystore:" -ForegroundColor Yellow
    $props['storePassword'] = Read-Host "Senha da keystore"
    $props['keyAlias'] = Read-Host "Alias da chave"
    $props['keyPassword'] = Read-Host "Senha da chave"
}

# Assinar com jarsigner
Write-Host "Assinando APK..." -ForegroundColor Yellow

$jarsigner = "$env:JAVA_HOME\bin\jarsigner.exe"
if (-not (Test-Path $jarsigner)) {
    $javaCmd = Get-Command java | Select-Object -ExpandProperty Source
    $jarsigner = Join-Path (Split-Path (Split-Path $javaCmd)) "bin\jarsigner.exe"
}

$signedApk = "android\app\build\outputs\apk\release\app-release-signed.apk"
Copy-Item $apkPath $signedApk

& $jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA256 -keystore $keystorePath -storepass $props['storePassword'] $signedApk $props['keyAlias']

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Verificando assinatura..." -ForegroundColor Yellow
    & $jarsigner -verify -verbose -certs $signedApk
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $finalApk = "app-release-assinado-$timestamp.apk"
    Copy-Item $signedApk $finalApk
    
    Write-Host ""
    Write-Host "=== SUCESSO ===" -ForegroundColor Green
    Write-Host "APK assinado: $finalApk" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Agora voce pode instalar no dispositivo!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERRO ao assinar APK" -ForegroundColor Red
}
