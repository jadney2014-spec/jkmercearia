# Script para instalar Java 11 automaticamente (Download direto)
# Execute como Administrador: PowerShell (Admin) > .\INSTALAR_JAVA11_DIRETO.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalador Automatico Java 11" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se ja esta instalado
Write-Host "[1/5] Verificando Java instalado..." -ForegroundColor Yellow
$javaCheck = Get-Command java -ErrorAction SilentlyContinue
if ($javaCheck) {
    $version = java -version 2>&1 | Select-String "version"
    if ($version -match "11|17|21") {
        Write-Host "OK - Java 11+ ja esta instalado!" -ForegroundColor Green
        java -version
        exit 0
    } else {
        Write-Host "Aviso - Java encontrado mas versao antiga. Instalando Java 11..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Info - Java nao encontrado. Instalando Java 11..." -ForegroundColor Yellow
}

# Verificar permissoes de administrador
Write-Host ""
Write-Host "[2/5] Verificando permissoes..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Como executar:" -ForegroundColor Yellow
    Write-Host "1. Clique com botao direito no PowerShell" -ForegroundColor Cyan
    Write-Host "2. Selecione 'Executar como administrador'" -ForegroundColor Cyan
    Write-Host "3. Execute: .\INSTALAR_JAVA11_DIRETO.ps1" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}
Write-Host "OK - Permissoes OK!" -ForegroundColor Green

# Download do Java 11
Write-Host ""
Write-Host "[3/5] Baixando Java 11..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.23%2B9/OpenJDK11U-jdk_x64_windows_hotspot_11.0.23_9.msi"
$installerPath = "$env:TEMP\OpenJDK11.msi"

try {
    Write-Host "   URL: $downloadUrl" -ForegroundColor Gray
    Write-Host "   Destino: $installerPath" -ForegroundColor Gray
    
    # Baixar arquivo
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    
    if (Test-Path $installerPath) {
        $fileSize = (Get-Item $installerPath).Length / 1MB
        $fileSizeRounded = [math]::Round($fileSize, 2)
        Write-Host "OK - Download concluido! ($fileSizeRounded MB)" -ForegroundColor Green
    } else {
        throw "Arquivo nao foi baixado"
    }
} catch {
    Write-Host "ERRO ao baixar: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativa: Baixe manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://adoptium.net/temurin/releases/?version=11" -ForegroundColor Cyan
    Write-Host "   2. Baixe: Windows x64 JDK (.msi)" -ForegroundColor Cyan
    Write-Host "   3. Execute o instalador" -ForegroundColor Cyan
    pause
    exit 1
}

# Instalar Java 11
Write-Host ""
Write-Host "[4/5] Instalando Java 11..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray

try {
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "OK - Instalacao concluida!" -ForegroundColor Green
    } else {
        Write-Host "Aviso - Instalacao concluida com codigo: $($process.ExitCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERRO na instalacao: $_" -ForegroundColor Red
    pause
    exit 1
}

# Configurar JAVA_HOME
Write-Host ""
Write-Host "[5/5] Configurando JAVA_HOME..." -ForegroundColor Yellow

# Procurar instalacao do Java
$possiblePaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-11*",
    "C:\Program Files\Java\jdk-11*",
    "C:\Program Files (x86)\Java\jdk-11*"
)

$javaHome = $null
foreach ($path in $possiblePaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($found) {
        $javaHome = $found.FullName
        break
    }
}

if (-not $javaHome) {
    # Tentar encontrar via registro
    $regPath = "HKLM:\SOFTWARE\JavaSoft\JDK"
    if (Test-Path $regPath) {
        $javaVersion = Get-ChildItem $regPath | Sort-Object Name -Descending | Select-Object -First 1
        if ($javaVersion) {
            $javaHome = (Get-ItemProperty "$regPath\$($javaVersion.PSChildName)").JavaHome
        }
    }
}

if ($javaHome -and (Test-Path $javaHome)) {
    Write-Host "   Java encontrado em: $javaHome" -ForegroundColor Gray
    
    # Configurar JAVA_HOME no sistema
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "Machine")
    $env:JAVA_HOME = $javaHome
    
    # Adicionar ao PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $javaBin = "$javaHome\bin"
    if ($currentPath -notlike "*$javaBin*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$javaBin", "Machine")
        $env:Path = "$env:Path;$javaBin"
    }
    
    Write-Host "OK - JAVA_HOME configurado: $javaHome" -ForegroundColor Green
} else {
    Write-Host "Aviso - JAVA_HOME nao configurado automaticamente" -ForegroundColor Yellow
    Write-Host "   Configure manualmente apos reiniciar o terminal" -ForegroundColor Yellow
}

# Limpar arquivo temporario
if (Test-Path $installerPath) {
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
}

# Verificar instalacao
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificando Instalacao" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Atualizar PATH na sessao atual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Start-Sleep -Seconds 2

$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($javaCmd) {
    Write-Host "OK - Java instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    java -version
    Write-Host ""
    Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Instalacao Concluida!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "1. Feche e reabra o terminal" -ForegroundColor Cyan
    Write-Host "2. Execute: cd client\android" -ForegroundColor Cyan
    Write-Host "3. Execute: .\gradlew.bat assembleDebug" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Aviso - Java instalado mas nao encontrado no PATH" -ForegroundColor Yellow
    Write-Host "   Reinicie o terminal e tente novamente" -ForegroundColor Yellow
    Write-Host ""
}

pause
