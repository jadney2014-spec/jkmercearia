# Script Unificado: Gerar APK e Direcionar para Assinatura
# Este script gera o APK e automaticamente abre o PowerShell para assinatura

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR E ASSINADOR DE APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script na pasta 'client'" -ForegroundColor Red
    Write-Host "   Exemplo: cd client" -ForegroundColor Yellow
    exit 1
}

# Verificar se Java está instalado
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "❌ ERRO: Java não encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Java JDK 11 ou superior" -ForegroundColor Yellow
    Write-Host "   Execute: .\INSTALAR_JAVA11.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Java encontrado" -ForegroundColor Green
Write-Host ""

# Verificar se Android SDK está configurado
if (-not (Test-Path "android")) {
    Write-Host "❌ ERRO: Pasta 'android' não encontrada!" -ForegroundColor Red
    Write-Host "   Execute primeiro: npx cap add android" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Projeto Android encontrado" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 1: BUILD DO REACT
# ============================================
Write-Host "📦 PASSO 1: Fazendo build do React..." -ForegroundColor Yellow
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO ao fazer build do React" -ForegroundColor Red
    Write-Host "   Verifique os erros acima" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Build do React concluído!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 2: SINCRONIZAR COM CAPACITOR
# ============================================
Write-Host "🔄 PASSO 2: Sincronizando com Capacitor..." -ForegroundColor Yellow
Write-Host ""

npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO ao sincronizar com Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Sincronização concluída!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 3: GERAR APK
# ============================================
Write-Host "🔨 PASSO 3: Gerando APK com Gradle..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray
Write-Host ""

Set-Location android

# Limpar builds anteriores
Write-Host "   Limpando builds anteriores..." -ForegroundColor Gray
.\gradlew clean 2>&1 | Out-Null

# Gerar APK
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO ao gerar APK" -ForegroundColor Red
    Write-Host "   Verifique os erros acima" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "✅ APK gerado com sucesso!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 4: VERIFICAR APK GERADO
# ============================================
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$apkPathSigned = "android\app\build\outputs\apk\release\app-release.apk"

# Verificar se APK foi gerado (pode estar assinado ou não)
$apkFound = $false
$apkIsSigned = $false

if (Test-Path $apkPathSigned) {
    $apkPath = $apkPathSigned
    $apkFound = $true
    $apkIsSigned = $true
    Write-Host "✅ APK assinado encontrado!" -ForegroundColor Green
} elseif (Test-Path $apkPath) {
    $apkFound = $true
    $apkIsSigned = $false
    Write-Host "✅ APK não assinado encontrado!" -ForegroundColor Yellow
} else {
    Write-Host "❌ ERRO: APK não encontrado!" -ForegroundColor Red
    Write-Host "   Caminho esperado: $apkPath" -ForegroundColor Yellow
    exit 1
}

$fileSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
Write-Host "   Tamanho: $fileSize MB" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASSO 5: DIRECIONAR PARA ASSINATURA
# ============================================
if (-not $apkIsSigned) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  APK GERADO - PRÓXIMO PASSO: ASSINAR" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O APK foi gerado, mas NÃO está assinado." -ForegroundColor Yellow
    Write-Host "Para instalar no celular, você precisa assiná-lo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Abrindo script de assinatura..." -ForegroundColor Cyan
    Write-Host ""
    
    # Aguardar 2 segundos
    Start-Sleep -Seconds 2
    
    # Abrir script de assinatura em nova janela do PowerShell
    # Tentar usar script definitivo primeiro
    $scriptPath = Join-Path $PSScriptRoot "assinar-apk-definitivo.ps1"
    if (-not (Test-Path $scriptPath)) {
        $scriptPath = Join-Path $PSScriptRoot "assinar-apk.ps1"
    }
    
    if (Test-Path $scriptPath) {
        Write-Host "Executando script de assinatura..." -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Executar script de assinatura
        & powershell -ExecutionPolicy Bypass -File $scriptPath
        
        # Verificar se assinatura foi bem-sucedida
        $signedApkPath = "android\app\build\outputs\apk\release\app-release-signed.apk"
        if (Test-Path $signedApkPath) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✅ APK ASSINADO COM SUCESSO!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            # Copiar APK assinado para a raiz com timestamp
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $finalApkPath = "app-release-assinado-$timestamp.apk"
            Copy-Item $signedApkPath $finalApkPath -Force
            
            $finalSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)
            
            Write-Host "📱 APK PRONTO PARA INSTALAÇÃO!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
            Write-Host "Tamanho: $finalSize MB" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📲 Para instalar no celular:" -ForegroundColor Cyan
            Write-Host "   1. Transfira o arquivo para o celular" -ForegroundColor White
            Write-Host "   2. No celular, abra o arquivo .apk" -ForegroundColor White
            Write-Host "   3. Permita instalação de fontes desconhecidas (se solicitado)" -ForegroundColor White
            Write-Host "   4. Instale o aplicativo" -ForegroundColor White
            Write-Host ""
            
            # Abrir pasta no explorador
            Write-Host "Abrindo pasta do APK..." -ForegroundColor Gray
            Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"
        }
    } else {
        Write-Host "❌ Script de assinatura não encontrado: $scriptPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Para assinar manualmente, execute:" -ForegroundColor Yellow
        Write-Host "   .\assinar-apk.ps1" -ForegroundColor Cyan
    }
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ APK JÁ ESTÁ ASSINADO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Copiar APK assinado para a raiz com timestamp
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $finalApkPath = "app-release-assinado-$timestamp.apk"
    Copy-Item $apkPath $finalApkPath -Force
    
    $finalSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)
    
    Write-Host "📱 APK PRONTO PARA INSTALAÇÃO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
    Write-Host "Tamanho: $finalSize MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📲 Para instalar no celular:" -ForegroundColor Cyan
    Write-Host "   1. Transfira o arquivo para o celular" -ForegroundColor White
    Write-Host "   2. No celular, abra o arquivo .apk" -ForegroundColor White
    Write-Host "   3. Permita instalação de fontes desconhecidas (se solicitado)" -ForegroundColor White
    Write-Host "   4. Instale o aplicativo" -ForegroundColor White
    Write-Host ""
    
    # Abrir pasta no explorador
    Write-Host "Abrindo pasta do APK..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"
}

Write-Host ""
Write-Host "✨ Processo concluído!" -ForegroundColor Green
Write-Host ""
