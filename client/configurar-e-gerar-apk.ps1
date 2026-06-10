# Script completo para configurar e gerar APK pelo PowerShell
# Este script configura o Android SDK e gera o APK automaticamente

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO E GERACAO DE APK - SDK COMPLETO" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta client" -ForegroundColor Red
    exit 1
}

# Passo 1: Encontrar Android SDK
Write-Host "Passo 1: Procurando Android SDK..." -ForegroundColor Yellow

$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:ANDROID_HOME",
    "C:\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $sdkPaths) {
    if ($path -and (Test-Path $path)) {
        $sdkPath = $path
        Write-Host "SDK encontrado em: $sdkPath" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "ERRO: Android SDK nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Android SDK:" -ForegroundColor Yellow
    Write-Host "1. Instale Android Studio" -ForegroundColor Yellow
    Write-Host "2. Ou baixe o SDK standalone" -ForegroundColor Yellow
    Write-Host "3. Configure a variavel ANDROID_HOME" -ForegroundColor Yellow
    exit 1
}

# Passo 2: Configurar local.properties
Write-Host ""
Write-Host "Passo 2: Configurando local.properties..." -ForegroundColor Yellow

$localPropsPath = "android\local.properties"
$sdkDir = $sdkPath -replace '\\', '/'

# Criar arquivo local.properties
$content = "sdk.dir=$sdkDir`n"
Set-Content -Path $localPropsPath -Value $content -Force

Write-Host "Arquivo configurado: $localPropsPath" -ForegroundColor Green
Write-Host "SDK Path: $sdkDir" -ForegroundColor Gray

# Passo 3: Verificar Java
Write-Host ""
Write-Host "Passo 3: Verificando Java..." -ForegroundColor Yellow

$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    # Tentar encontrar Java
    $javaPaths = @(
        "C:\Program Files\Java\jdk-*",
        "C:\Program Files (x86)\Java\jdk-*",
        "$env:ProgramFiles\Java\jdk-*"
    )
    
    foreach ($pattern in $javaPaths) {
        $found = Get-ChildItem -Path (Split-Path $pattern -Parent) -Filter (Split-Path $pattern -Leaf) -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $javaHome = $found.FullName
            break
        }
    }
}

if ($javaHome -and (Test-Path "$javaHome\bin\java.exe")) {
    Write-Host "Java encontrado em: $javaHome" -ForegroundColor Green
    $env:JAVA_HOME = $javaHome
    $env:PATH = "$javaHome\bin;$env:PATH"
} else {
    Write-Host "AVISO: Java nao encontrado. O Gradle pode usar o Java embutido." -ForegroundColor Yellow
}

# Passo 4: Executar script de geracao
Write-Host ""
Write-Host "Passo 4: Gerando APK..." -ForegroundColor Yellow
Write-Host ""

# Executar o script de geracao bundle
.\gerar-apk-bundle.ps1

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  PROCESSO CONCLUIDO!" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
