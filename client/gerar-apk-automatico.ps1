# Script Automático Completo: Gerar e Assinar APK
# Este script faz TUDO automaticamente, incluindo criacao de keystore e assinatura

param(
    [string]$keystorePassword = "",
    [string]$keyAlias = "key0"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR AUTOMATICO DE APK ASSINADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta 'client'" -ForegroundColor Red
    Write-Host "   Exemplo: cd client" -ForegroundColor Yellow
    exit 1
}

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "ERRO: Java nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Java JDK 11 ou superior" -ForegroundColor Yellow
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"

if (-not (Test-Path $keytool) -or -not (Test-Path $jarsigner)) {
    Write-Host "ERRO: Ferramentas Java nao encontradas!" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Java encontrado" -ForegroundColor Green
Write-Host ""

# Verificar projeto Android
if (-not (Test-Path "android")) {
    Write-Host "ERRO: Pasta 'android' nao encontrada!" -ForegroundColor Red
    Write-Host "   Execute: npx cap add android" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Projeto Android encontrado" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 1: BUILD DO REACT
# ============================================
Write-Host "PASSO 1: Fazendo build do React..." -ForegroundColor Yellow
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao fazer build do React" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK: Build do React concluido!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 2: SINCRONIZAR COM CAPACITOR
# ============================================
Write-Host "PASSO 2: Sincronizando com Capacitor..." -ForegroundColor Yellow
Write-Host ""

npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao sincronizar com Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK: Sincronizacao concluida!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 3: GERAR APK
# ============================================
Write-Host "PASSO 3: Gerando APK com Gradle..." -ForegroundColor Yellow
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
    Write-Host "ERRO ao gerar APK" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "OK: APK gerado com sucesso!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 4: VERIFICAR/CRIAR KEYSTORE
# ============================================
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

# Se nao foi passada senha, gerar uma automaticamente ou usar padrao
if ([string]::IsNullOrWhiteSpace($keystorePassword)) {
    if (Test-Path $keystorePath) {
        # Keystore existe, precisamos da senha
        Write-Host "Keystore existente encontrada" -ForegroundColor Yellow
        Write-Host "   Digite a senha da keystore:" -ForegroundColor Cyan
        $senhaSecure = Read-Host "Senha" -AsSecureString
        $keystorePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))
    } else {
        # Criar senha automatica (baseada em timestamp)
        $timestamp = Get-Date -Format "yyyyMMdd"
        $keystorePassword = "Resgate$timestamp"
        Write-Host "Criando keystore com senha automatica..." -ForegroundColor Yellow
        Write-Host "   Senha gerada: Resgate$timestamp" -ForegroundColor Cyan
        Write-Host "   IMPORTANTE: ANOTE ESTA SENHA! Voce precisara dela para atualizar o app." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Criar keystore se nao existir
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
        -dname "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR" `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO ao criar keystore!" -ForegroundColor Red
        exit 1
    }
    
    # Salvar propriedades
    $propsContent = "storeFile=release.keystore`nstorePassword=$keystorePassword`nkeyAlias=$keyAlias`nkeyPassword=$keystorePassword"
    $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
    
    Write-Host "OK: Keystore criada com sucesso!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "OK: Keystore existente encontrada" -ForegroundColor Green
    
    # Ler alias se existir
    if (Test-Path $keystorePropsPath) {
        $props = @{}
        Get-Content $keystorePropsPath | ForEach-Object {
            if ($_ -match '^(\w+)=(.*)$') {
                $props[$matches[1]] = $matches[2]
            }
        }
        if ($props['keyAlias']) {
            $keyAlias = $props['keyAlias']
        }
    }
    
    Write-Host ""
}

# ============================================
# PASSO 5: ASSINAR APK
# ============================================
Write-Host "PASSO 4: Assinando APK..." -ForegroundColor Yellow
Write-Host ""

$apkPathUnsigned = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$apkPathSigned = "android\app\build\outputs\apk\release\app-release-signed.apk"

# Verificar qual APK existe
$apkPath = $null
if (Test-Path $apkPathUnsigned) {
    $apkPath = $apkPathUnsigned
} elseif (Test-Path "android\app\build\outputs\apk\release\app-release.apk") {
    # APK ja pode estar assinado pelo Gradle
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
    Write-Host "AVISO: APK pode ja estar assinado pelo Gradle" -ForegroundColor Yellow
    Write-Host "   Verificando..." -ForegroundColor Gray
} else {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    Write-Host "   Caminhos verificados:" -ForegroundColor Yellow
    Write-Host "   - $apkPathUnsigned" -ForegroundColor Gray
    Write-Host "   - android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Gray
    exit 1
}

# Copiar APK para assinar
Copy-Item $apkPath $apkPathSigned -Force

Write-Host "   Aplicando assinatura digital..." -ForegroundColor Gray

# Assinar APK
& $jarsigner -verbose `
    -sigalg SHA256withRSA `
    -digestalg SHA256 `
    -keystore $keystorePath `
    -storepass $keystorePassword `
    $apkPathSigned `
    $keyAlias `
    2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao assinar APK!" -ForegroundColor Red
    Write-Host "   Verifique se a senha esta correta" -ForegroundColor Yellow
    exit 1
}

Write-Host "   Verificando assinatura..." -ForegroundColor Gray
$verify = & $jarsigner -verify -verbose -certs $apkPathSigned 2>&1

if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
    Write-Host "OK: Assinatura verificada!" -ForegroundColor Green
} else {
    Write-Host "AVISO: Assinatura aplicada, mas verificacao falhou" -ForegroundColor Yellow
    Write-Host "   Continuando mesmo assim..." -ForegroundColor Gray
}

Write-Host ""

# ============================================
# PASSO 6: COPIAR APK FINAL
# ============================================
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-assinado-$timestamp.apk"

Copy-Item $apkPathSigned $finalApkPath -Force

$fileSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)

Write-Host "========================================" -ForegroundColor Green
Write-Host "  OK: APK ASSINADO GERADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
Write-Host "Tamanho: $fileSize MB" -ForegroundColor Yellow
Write-Host ""

$showPassword = $false
if (-not (Test-Path $keystorePropsPath)) {
    $showPassword = $true
} else {
    $props = @{}
    Get-Content $keystorePropsPath | ForEach-Object {
        if ($_ -match '^(\w+)=(.*)$') {
            $props[$matches[1]] = $matches[2]
        }
    }
    if ($props['storePassword'] -match "^Resgate\d+$") {
        $showPassword = $true
    }
}

if ($showPassword) {
    Write-Host "INFORMACOES DA KEYSTORE:" -ForegroundColor Yellow
    Write-Host "   Senha: $keystorePassword" -ForegroundColor Cyan
    Write-Host "   Alias: $keyAlias" -ForegroundColor Cyan
    Write-Host "   IMPORTANTE: ANOTE ESTAS INFORMACOES!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Para instalar no celular:" -ForegroundColor Cyan
Write-Host "   1. Transfira o arquivo para o celular" -ForegroundColor White
Write-Host "   2. No celular, abra o arquivo .apk" -ForegroundColor White
Write-Host "   3. Permita instalacao de fontes desconhecidas (se solicitado)" -ForegroundColor White
Write-Host "   4. Instale o aplicativo" -ForegroundColor White
Write-Host ""

# Abrir pasta no explorador
Write-Host "Abrindo pasta do APK..." -ForegroundColor Gray
Start-Sleep -Seconds 1
Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"

Write-Host ""
Write-Host "Processo concluido automaticamente!" -ForegroundColor Green
Write-Host ""
