# Script DEFINITIVO: Gera e Assina APK corretamente
# Resolve o problema "pacote invalido" garantindo assinatura e alinhamento corretos

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR DE APK DEFINITIVO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar diretorio
if (-not (Test-Path "package.json")) {
    Write-Host "[ERRO] Execute este script na pasta 'client'" -ForegroundColor Red
    exit 1
}

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[ERRO] Java nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Java encontrado" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 1: BUILD DO REACT
# ============================================
Write-Host "[1/5] Fazendo build do React..." -ForegroundColor Yellow
npm run build | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no build do React" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Build concluido" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 2: SINCRONIZAR CAPACITOR
# ============================================
Write-Host "[2/5] Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha na sincronizacao" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Sincronizacao concluida" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 3: GERAR APK
# ============================================
Write-Host "[3/5] Gerando APK..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray

Set-Location android
.\gradlew clean assembleRelease 2>&1 | Out-Null
Set-Location ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao gerar APK" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] APK gerado" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 4: ASSINAR APK (SCRIPT DEFINITIVO)
# ============================================
Write-Host "[4/5] Assinando APK..." -ForegroundColor Yellow
Write-Host ""

$assinarScript = "assinar-apk-definitivo.ps1"
if (-not (Test-Path $assinarScript)) {
    $assinarScript = "assinar-apk.ps1"
}

if (Test-Path $assinarScript) {
    & powershell -ExecutionPolicy Bypass -File $assinarScript
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao assinar APK" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERRO] Script de assinatura nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] Processo concluido!" -ForegroundColor Green
Write-Host ""

# Verificar se APK final foi criado
$apkFiles = Get-ChildItem -Filter "app-release-assinado-*.apk" | Sort-Object LastWriteTime -Descending
if ($apkFiles.Count -gt 0) {
    $latestApk = $apkFiles[0]
    Write-Host "APK final criado: $($latestApk.Name)" -ForegroundColor Cyan
    Write-Host "Tamanho: $([math]::Round($latestApk.Length / 1MB, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Este APK esta pronto para instalacao!" -ForegroundColor Green
}

Write-Host ""
