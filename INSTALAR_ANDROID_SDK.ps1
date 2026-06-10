# Script para instalar Android SDK Command Line Tools
# Execute como Administrador: PowerShell (Admin) > .\INSTALAR_ANDROID_SDK.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalador Android SDK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permissoes
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Execute como Administrador!" -ForegroundColor Red
    pause
    exit 1
}

# Definir local de instalacao
$sdkPath = "C:\Android\Sdk"
$sdkManagerPath = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "[1/4] Criando diretorio do SDK..." -ForegroundColor Yellow
if (-not (Test-Path $sdkPath)) {
    New-Item -ItemType Directory -Path $sdkPath -Force | Out-Null
    Write-Host "OK - Diretorio criado: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "OK - Diretorio ja existe: $sdkPath" -ForegroundColor Green
}

# Download Command Line Tools
Write-Host ""
Write-Host "[2/4] Baixando Android SDK Command Line Tools..." -ForegroundColor Yellow
$toolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$toolsZip = "$env:TEMP\android-commandlinetools.zip"
$toolsExtract = "$env:TEMP\android-tools"

try {
    Write-Host "   Baixando de: $toolsUrl" -ForegroundColor Gray
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $toolsUrl -OutFile $toolsZip -UseBasicParsing -ErrorAction Stop
    
    if (Test-Path $toolsZip) {
        $fileSize = (Get-Item $toolsZip).Length / 1MB
        $fileSizeRounded = [math]::Round($fileSize, 2)
        Write-Host "OK - Download concluido! ($fileSizeRounded MB)" -ForegroundColor Green
    } else {
        throw "Arquivo nao foi baixado"
    }
} catch {
    Write-Host "ERRO ao baixar: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativa: Baixe manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://developer.android.com/studio#command-tools" -ForegroundColor Cyan
    Write-Host "   2. Baixe: Command line tools only (Windows)" -ForegroundColor Cyan
    Write-Host "   3. Extraia para: $sdkPath\cmdline-tools\latest" -ForegroundColor Cyan
    pause
    exit 1
}

# Extrair
Write-Host ""
Write-Host "[3/4] Extraindo arquivos..." -ForegroundColor Yellow
try {
    if (Test-Path $toolsExtract) {
        Remove-Item $toolsExtract -Recurse -Force -ErrorAction SilentlyContinue
    }
    Expand-Archive -Path $toolsZip -DestinationPath $toolsExtract -Force
    
    # Mover para local correto
    $cmdlineToolsPath = "$sdkPath\cmdline-tools"
    if (Test-Path $cmdlineToolsPath) {
        Remove-Item $cmdlineToolsPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path "$cmdlineToolsPath\latest" -Force | Out-Null
    
    $extractedFolder = Get-ChildItem $toolsExtract -Directory | Select-Object -First 1
    if ($extractedFolder) {
        Get-ChildItem $extractedFolder.FullName | Move-Item -Destination "$cmdlineToolsPath\latest" -Force
        Write-Host "OK - Arquivos extraidos!" -ForegroundColor Green
    } else {
        throw "Estrutura de pastas inesperada"
    }
} catch {
    Write-Host "ERRO ao extrair: $_" -ForegroundColor Red
    pause
    exit 1
}

# Instalar pacotes necessarios
Write-Host ""
Write-Host "[4/4] Instalando pacotes do Android SDK..." -ForegroundColor Yellow
Write-Host "   Isso pode levar varios minutos..." -ForegroundColor Gray

try {
    # Configurar variaveis
    $env:ANDROID_HOME = $sdkPath
    $env:PATH = "$sdkPath\cmdline-tools\latest\bin;$sdkPath\platform-tools;$env:PATH"
    
    # Aceitar licencas
    $yes = "y" * 100
    $yes | & "$sdkManagerPath" --licenses 2>&1 | Out-Null
    
    # Instalar pacotes
    & "$sdkManagerPath" "platform-tools" "platforms;android-33" "build-tools;33.0.0" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "OK - Pacotes instalados!" -ForegroundColor Green
} catch {
    Write-Host "Aviso - Erro ao instalar pacotes automaticamente" -ForegroundColor Yellow
    Write-Host "   Instale manualmente:" -ForegroundColor Yellow
    Write-Host "   $sdkManagerPath platform-tools platforms;android-33 build-tools;33.0.0" -ForegroundColor Cyan
}

# Configurar variaveis de ambiente
Write-Host ""
Write-Host "Configurando variaveis de ambiente..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "Machine")
[System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkPath, "Machine")
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Criar local.properties
Write-Host ""
Write-Host "Criando local.properties..." -ForegroundColor Yellow
$localPropsPath = "client\android\local.properties"
$localPropsContent = "sdk.dir=$sdkPath`n"
Set-Content -Path $localPropsPath -Value $localPropsContent -NoNewline
Write-Host "OK - local.properties criado!" -ForegroundColor Green

# Limpar arquivos temporarios
if (Test-Path $toolsZip) {
    Remove-Item $toolsZip -Force -ErrorAction SilentlyContinue
}
if (Test-Path $toolsExtract) {
    Remove-Item $toolsExtract -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Instalacao Concluida!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ANDROID_HOME: $sdkPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Feche e reabra o terminal" -ForegroundColor Cyan
Write-Host "2. Execute: cd client\android" -ForegroundColor Cyan
Write-Host "3. Execute: .\gradlew.bat assembleDebug" -ForegroundColor Cyan
Write-Host ""

pause
