# Script para atualizar versao e gerar novo APK assinado
# Resolve problemas de "versao desatualizada"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ATUALIZAR VERSAO E GERAR APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ler versao atual
$buildGradlePath = "android\app\build.gradle"
$buildGradle = Get-Content $buildGradlePath -Raw

if ($buildGradle -match 'versionCode\s+(\d+)') {
    $versionCodeAtual = [int]$matches[1]
    Write-Host "Version Code atual: $versionCodeAtual" -ForegroundColor Yellow
} else {
    Write-Host "ERRO: Version Code nao encontrado" -ForegroundColor Red
    exit 1
}

if ($buildGradle -match 'versionName\s+"([^"]+)"') {
    $versionNameAtual = $matches[1]
    Write-Host "Version Name atual: $versionNameAtual" -ForegroundColor Yellow
} else {
    Write-Host "ERRO: Version Name nao encontrado" -ForegroundColor Red
    exit 1
}

# Incrementar versao
$novoVersionCode = $versionCodeAtual + 1
$versaoParts = $versionNameAtual.Split('.')
if ($versaoParts.Length -ge 3) {
    $patch = [int]$versaoParts[2] + 1
    $novaVersionName = "$($versaoParts[0]).$($versaoParts[1]).$patch"
} else {
    $novaVersionName = "1.0.$novoVersionCode"
}

Write-Host ""
Write-Host "Nova versao:" -ForegroundColor Cyan
Write-Host "  Version Code: $novoVersionCode" -ForegroundColor Green
Write-Host "  Version Name: $novaVersionName" -ForegroundColor Green
Write-Host ""

# Atualizar build.gradle
$buildGradle = $buildGradle -replace "versionCode\s+\d+", "versionCode $novoVersionCode"
$buildGradle = $buildGradle -replace 'versionName\s+"[^"]+"', "versionName `"$novaVersionName`""

$buildGradle | Set-Content $buildGradlePath -NoNewline

Write-Host "Versao atualizada no build.gradle!" -ForegroundColor Green
Write-Host ""

# Fazer build do React
Write-Host "Passo 1: Fazendo build do React..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao fazer build do React" -ForegroundColor Red
    exit 1
}

Write-Host "Build do React concluido!" -ForegroundColor Green
Write-Host ""

# Sincronizar Capacitor
Write-Host "Passo 2: Sincronizando com Capacitor..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao sincronizar com Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "Sincronizacao concluida!" -ForegroundColor Green
Write-Host ""

# Gerar APK
Write-Host "Passo 3: Gerando APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar APK" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "APK gerado!" -ForegroundColor Green
Write-Host ""

# Assinar APK
Write-Host "Passo 4: Assinando APK..." -ForegroundColor Yellow
Write-Host "Digite a senha da keystore:" -ForegroundColor Cyan

$senhaSecure = Read-Host "Senha" -AsSecureString
$senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))

$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

# Ler alias se existir
$alias = "key0"
if (Test-Path $keystorePropsPath) {
    $props = @{}
    Get-Content $keystorePropsPath | ForEach-Object {
        if ($_ -match '^(\w+)=(.*)$') {
            $props[$matches[1]] = $matches[2]
        }
    }
    if ($props['keyAlias']) {
        $alias = $props['keyAlias']
    }
}

$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$signedApkPath = "android\app\build\outputs\apk\release\app-release-signed.apk"

Copy-Item $apkPath $signedApkPath -Force

$javaCmd = Get-Command java | Select-Object -ExpandProperty Source
$javaHome = Split-Path (Split-Path $javaCmd)
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"

& $jarsigner -verbose `
    -sigalg SHA256withRSA `
    -digestalg SHA256 `
    -keystore $keystorePath `
    -storepass $senha `
    $signedApkPath `
    $alias `
    2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao assinar APK" -ForegroundColor Red
    exit 1
}

# Copiar APK final
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-v$novaVersionName-$timestamp.apk"
Copy-Item $signedApkPath $finalApkPath -Force

$fileSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK ATUALIZADO E ASSINADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Versao: $novaVersionName (Code: $novoVersionCode)" -ForegroundColor Cyan
Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
Write-Host "Tamanho: $fileSize MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora voce pode instalar esta versao atualizada!" -ForegroundColor Green
Write-Host ""
