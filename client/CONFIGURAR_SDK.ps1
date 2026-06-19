# Script para configurar variáveis de ambiente do Android SDK
# Execute APÓS baixar e extrair o Android Command Line Tools manualmente

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAÇÃO ANDROID SDK MANUAL     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$installDir = "$env:LOCALAPPDATA\Android\Sdk"

# Verificar se o SDK foi extraído
if (-not (Test-Path $installDir)) {
    Write-Host "ERRO: Android SDK não encontrado em: $installDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Baixe o Android Command Line Tools de: https://developer.android.com/studio#command-line-tools-only" -ForegroundColor White
    Write-Host "2. Extraia o arquivo zip" -ForegroundColor White
    Write-Host "3. Crie a pasta: $installDir" -ForegroundColor White
    Write-Host "4. Dentro dela, crie: cmdline-tools\latest" -ForegroundColor White
    Write-Host "5. Mova o conteúdo extraído para cmdline-tools\latest" -ForegroundColor White
    Write-Host "6. Execute este script novamente" -ForegroundColor White
    exit 1
}

Write-Host "Android SDK encontrado em: $installDir" -ForegroundColor Green
Write-Host ""

# Configurar variáveis de ambiente
Write-Host "Configurando variáveis de ambiente..." -ForegroundColor Yellow

# ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $installDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $installDir, "Process")

# Adicionar ao PATH
$pathValue = [Environment]::GetEnvironmentVariable("Path", "User")
$platformTools = Join-Path $installDir "platform-tools"
$cmdlineBin = Join-Path $installDir "cmdline-tools\latest\bin"

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

# Instalar pacotes necessários
Write-Host ""
Write-Host "Instalando pacotes Android SDK..." -ForegroundColor Yellow

$sdkManager = Join-Path $installDir "cmdline-tools\latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "AVISO: sdkmanager não encontrado, pulando instalação de pacotes" -ForegroundColor Yellow
} else {
    # Aceitar licenças
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
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURAÇÃO CONCLUÍDA!            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
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
