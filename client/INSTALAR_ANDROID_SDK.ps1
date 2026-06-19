# Script Automatizado - Instalação do Android Command Line Tools
# Este script baixa e configura o Android SDK necessário para gerar APKs

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALAÇÃO AUTOMATICA ANDROID SDK   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$sdkVersion = "11076708"  # Command Line Tools versão mais recente (2024)
$downloadUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$installDir = "$env:LOCALAPPDATA\Android\Sdk"
$tempDir = "$env:TEMP\android-sdk-install"

Write-Host "Diretório de instalação: $installDir" -ForegroundColor Yellow
Write-Host ""

# Criar diretórios
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Baixar Command Line Tools
Write-Host "Passo 1/4: Baixando Android Command Line Tools..." -ForegroundColor Yellow
$zipPath = Join-Path $tempDir "commandlinetools-win.zip"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "OK: Download concluído" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Falha no download" -ForegroundColor Red
    Write-Host "URL: $downloadUrl" -ForegroundColor Gray
    exit 1
}

# Extrair arquivos
Write-Host ""
Write-Host "Passo 2/4: Extraindo arquivos..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
    Write-Host "OK: Extração concluída" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Falha na extração" -ForegroundColor Red
    exit 1
}

# Organizar estrutura de diretórios
Write-Host ""
Write-Host "Passo 3/4: Organizando estrutura..." -ForegroundColor Yellow
$cmdlineToolsDir = Join-Path $installDir "cmdline-tools"
$latestDir = Join-Path $cmdlineToolsDir "latest"

# Remover versão anterior se existir
if (Test-Path $latestDir) {
    Remove-Item $latestDir -Recurse -Force
}

# Criar estrutura correta
New-Item -ItemType Directory -Force -Path $latestDir | Out-Null

# Mover arquivos
$extractedDir = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "cmdline-tools*" } | Select-Object -First 1
if ($extractedDir) {
    Get-ChildItem -Path $extractedDir.FullName | Move-Item -Destination $latestDir -Force
    Write-Host "OK: Estrutura organizada" -ForegroundColor Green
} else {
    Write-Host "ERRO: Diretório extraído não encontrado" -ForegroundColor Red
    exit 1
}

# Instalar pacotes necessários
Write-Host ""
Write-Host "Passo 4/4: Instalando pacotes Android SDK..." -ForegroundColor Yellow

$cmdlineToolsBin = Join-Path $latestDir "bin"
$sdkManager = Join-Path $cmdlineToolsBin "sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "ERRO: sdkmanager.bat não encontrado" -ForegroundColor Red
    exit 1
}

# Aceitar licenças automaticamente
Write-Host "   Aceitando licenças..." -ForegroundColor Gray
& $sdkManager --licenses --sdk_root=$installDir | Out-Null

# Instalar pacotes essenciais
Write-Host "   Instalando platform-tools..." -ForegroundColor Gray
& $sdkManager "platform-tools" --sdk_root=$installDir | Out-Null

Write-Host "   Instalando build-tools;33.0.0..." -ForegroundColor Gray
& $sdkManager "build-tools;33.0.0" --sdk_root=$installDir | Out-Null

Write-Host "   Instalando platform;android-33..." -ForegroundColor Gray
& $sdkManager "platform;android-33" --sdk_root=$installDir | Out-Null

Write-Host "   Instalando platform;android-34..." -ForegroundColor Gray
& $sdkManager "platform;android-34" --sdk_root=$installDir | Out-Null

Write-Host "OK: Pacotes instalados" -ForegroundColor Green

# Limpar arquivos temporários
Write-Host ""
Write-Host "Limpando arquivos temporários..." -ForegroundColor Gray
Remove-Item $tempDir -Recurse -Force

# Configurar variáveis de ambiente
Write-Host ""
Write-Host "Configurando variáveis de ambiente..." -ForegroundColor Yellow

# ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $installDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $installDir, "Process")

# Adicionar ao PATH
$pathValue = [Environment]::GetEnvironmentVariable("Path", "User")
$platformTools = Join-Path $installDir "platform-tools"
$cmdlineBin = Join-Path $latestDir "bin"

if ($pathValue -notlike "*$platformTools*") {
    [Environment]::SetEnvironmentVariable("Path", "$pathValue;$platformTools;$cmdlineBin", "User")
}

Write-Host "OK: Variáveis configuradas" -ForegroundColor Green

# Criar local.properties
Write-Host ""
Write-Host "Configurando local.properties..." -ForegroundColor Yellow
$localPropsPath = "android\local.properties"
"sdk.dir=$installDir" | Out-File $localPropsPath -Encoding UTF8
Write-Host "OK: local.properties criado" -ForegroundColor Green

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALAÇÃO CONCLUÍDA COM SUCESSO!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Android SDK instalado em: $installDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Variáveis de ambiente configuradas:" -ForegroundColor Yellow
Write-Host "  ANDROID_HOME = $installDir" -ForegroundColor Gray
Write-Host "  Path atualizado com platform-tools e cmdline-tools" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  REINICIE O TERMINAL para usar as variáveis de ambiente" -ForegroundColor Yellow
Write-Host ""
Write-Host "Após reiniciar, execute:" -ForegroundColor Cyan
Write-Host "  npm run apk" -ForegroundColor White
Write-Host ""
