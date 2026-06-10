# Script para instalar Java 11 automaticamente
# Execute como Administrador: .\INSTALAR_JAVA11.ps1

Write-Host "🚀 Instalando Java 11..." -ForegroundColor Green

# Verificar se já está instalado
$java11 = Get-Command java -ErrorAction SilentlyContinue
if ($java11) {
    $version = java -version 2>&1 | Select-String "version"
    if ($version -match "11|17|21") {
        Write-Host "✅ Java 11+ já está instalado!" -ForegroundColor Green
        java -version
        exit 0
    }
}

# Método 1: Tentar usar Chocolatey
Write-Host "`n📦 Tentando instalar via Chocolatey..." -ForegroundColor Yellow

if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "✅ Chocolatey encontrado!" -ForegroundColor Green
    choco install openjdk11 -y
    refreshenv
} else {
    Write-Host "⚠️ Chocolatey não encontrado. Instalando Chocolatey primeiro..." -ForegroundColor Yellow
    
    # Instalar Chocolatey
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Atualizar PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Instalar Java 11
    choco install openjdk11 -y
    refreshenv
}

# Verificar instalação
Write-Host "`n🔍 Verificando instalação..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$javaPath = Get-Command java -ErrorAction SilentlyContinue
if ($javaPath) {
    Write-Host "`n✅ Java instalado com sucesso!" -ForegroundColor Green
    java -version
    
    # Configurar JAVA_HOME
    $javaHome = (Get-Command java).Source | Split-Path | Split-Path
    Write-Host "`n📝 Configurando JAVA_HOME: $javaHome" -ForegroundColor Yellow
    
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "Machine")
    $env:JAVA_HOME = $javaHome
    
    Write-Host "✅ JAVA_HOME configurado!" -ForegroundColor Green
    Write-Host "`n🎉 Instalação concluída! Reinicie o terminal e tente gerar o APK novamente." -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro na instalação. Tentando método alternativo..." -ForegroundColor Red
    
    # Método alternativo: Download direto
    Write-Host "`n📥 Baixando Java 11 diretamente..." -ForegroundColor Yellow
    
    $downloadUrl = "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.23%2B9/OpenJDK11U-jdk_x64_windows_hotspot_11.0.23_9.msi"
    $installerPath = "$env:TEMP\OpenJDK11.msi"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ Download concluído. Instalando..." -ForegroundColor Green
        
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait
        
        Write-Host "✅ Instalação concluída!" -ForegroundColor Green
        Write-Host "`n⚠️ Por favor, reinicie o terminal e execute novamente." -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Erro ao baixar/instalar: $_" -ForegroundColor Red
        Write-Host "`n💡 Instale manualmente:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://adoptium.net/" -ForegroundColor Cyan
        Write-Host "   2. Baixe JDK 11 (LTS)" -ForegroundColor Cyan
        Write-Host "   3. Execute o instalador" -ForegroundColor Cyan
    }
}
