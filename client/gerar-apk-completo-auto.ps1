# Script SUPER AUTOMATICO - Faz TUDO sem interacao
# Gera APK, cria keystore se necessario, assina automaticamente

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR AUTOMATICO COMPLETO DE APK   " -ForegroundColor Cyan
Write-Host "  (Modo Automatico - Sem Interacao)    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar diretorio
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute na pasta 'client'" -ForegroundColor Red
    exit 1
}

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "ERRO: Java nao encontrado!" -ForegroundColor Red
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"

# ============================================
# FUNCAO: Criar Keystore Automatica
# ============================================
function Create-Keystore {
    param(
        [string]$keystorePath,
        [string]$password,
        [string]$alias
    )
    
    Write-Host "Criando keystore automatica..." -ForegroundColor Yellow
    
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias $alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $password `
        -keypass $password `
        -dname "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR" `
        2>&1 | Out-Null
    
    return $LASTEXITCODE -eq 0
}

# ============================================
# FUNCAO: Assinar APK
# ============================================
function Sign-APK {
    param(
        [string]$apkPath,
        [string]$keystorePath,
        [string]$password,
        [string]$alias
    )
    
    $signedPath = $apkPath -replace "\.apk$", "-signed.apk"
    Copy-Item $apkPath $signedPath -Force
    
    & $jarsigner -verbose `
        -sigalg SHA256withRSA `
        -digestalg SHA256 `
        -keystore $keystorePath `
        -storepass $password `
        $signedPath `
        $alias `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        return $signedPath
    }
    return $null
}

# ============================================
# PROCESSO AUTOMATICO
# ============================================

Write-Host "Passo 1/5: Build do React..." -ForegroundColor Yellow
npm run build | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no build" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Build concluido" -ForegroundColor Green

Write-Host ""
Write-Host "Passo 2/5: Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO na sincronizacao" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Sincronizacao concluida" -ForegroundColor Green

Write-Host ""
Write-Host "Passo 3/5: Gerando APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean assembleRelease 2>&1 | Out-Null
Set-Location ..
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar APK" -ForegroundColor Red
    exit 1
}
Write-Host "OK: APK gerado" -ForegroundColor Green

Write-Host ""
Write-Host "Passo 4/5: Preparando assinatura..." -ForegroundColor Yellow

# Verificar/Criar keystore
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"
$keyAlias = "key0"

# Gerar senha automatica baseada em data
$datePassword = "Resgate$(Get-Date -Format 'yyyyMMdd')"
$keystorePassword = $datePassword

if (-not (Test-Path $keystorePath)) {
    Write-Host "   Criando keystore automatica..." -ForegroundColor Gray
    if (Create-Keystore -keystorePath $keystorePath -password $keystorePassword -alias $keyAlias) {
        Write-Host "OK: Keystore criada" -ForegroundColor Green
        
        # Salvar propriedades
        $propsContent = "storeFile=release.keystore`nstorePassword=$keystorePassword`nkeyAlias=$keyAlias`nkeyPassword=$keystorePassword"
        $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
    } else {
        Write-Host "ERRO ao criar keystore" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: Keystore existente encontrada" -ForegroundColor Green
    
    # Tentar ler senha do arquivo de propriedades
    if (Test-Path $keystorePropsPath) {
        $props = @{}
        Get-Content $keystorePropsPath | ForEach-Object {
            if ($_ -match '^(\w+)=(.*)$') {
                $props[$matches[1]] = $matches[2]
            }
        }
        if ($props['storePassword']) {
            $keystorePassword = $props['storePassword']
        }
        if ($props['keyAlias']) {
            $keyAlias = $props['keyAlias']
        }
    } else {
        # Usar senha padrao
        Write-Host "   Usando senha padrao..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Passo 5/5: Assinando APK..." -ForegroundColor Yellow

# Localizar APK
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
if (-not (Test-Path $apkPath)) {
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
}

if (-not (Test-Path $apkPath)) {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    exit 1
}

$signedApk = Sign-APK -apkPath $apkPath -keystorePath $keystorePath -password $keystorePassword -alias $keyAlias

if ($signedApk) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $finalPath = "app-release-assinado-$timestamp.apk"
    Copy-Item $signedApk $finalPath -Force
    
    $size = [math]::Round((Get-Item $finalPath).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  OK: APK PRONTO PARA INSTALACAO!      " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Arquivo: $finalPath" -ForegroundColor Cyan
    Write-Host "Tamanho: $size MB" -ForegroundColor Yellow
    Write-Host ""
    
    # Mostrar senha se foi gerada automaticamente
    if ($keystorePassword -eq $datePassword) {
        Write-Host "Senha da keystore: $keystorePassword" -ForegroundColor Cyan
        Write-Host "   (Anote para futuras atualizacoes)" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Abrir pasta
    Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalPath)"
    
    Write-Host "Processo concluido automaticamente!" -ForegroundColor Green
} else {
    Write-Host "ERRO ao assinar APK" -ForegroundColor Red
    exit 1
}

Write-Host ""
