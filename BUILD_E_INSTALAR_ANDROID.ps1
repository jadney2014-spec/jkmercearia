$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

function Ensure-Command {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][string]$Hint
  )
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    Write-Host "ERRO: comando '$Name' nao encontrado." -ForegroundColor Red
    Write-Host $Hint -ForegroundColor Yellow
    exit 1
  }
}

function Ensure-File {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Label
  )
  if (-not (Test-Path $Path)) {
    Write-Host "ERRO: $Label nao encontrado em: $Path" -ForegroundColor Red
    exit 1
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientDir = Join-Path $root 'client'

Ensure-File -Path (Join-Path $clientDir 'package.json') -Label 'package.json do client'

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  BUILD + INSTALL ANDROID (tudo automatico)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 1) Garantir JDK 17 e Android SDK
$installer = Join-Path $root 'INSTALADOR_COMPLETO_APK.ps1'
Ensure-File -Path $installer -Label 'INSTALADOR_COMPLETO_APK.ps1'

Write-Host "[1/6] Validando JDK/Android SDK..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File $installer

# 1.5) Atualizar icone e splash nativo (launcher + drawable/splash)
$iconSplashScript = Join-Path $clientDir 'ATUALIZAR_ICONE_E_SPLASH_ANDROID.ps1'
if (Test-Path $iconSplashScript) {
  Write-Host "" 
  Write-Host "[1.5/6] Atualizando icone do app e splash nativo do Android..." -ForegroundColor Yellow
  & powershell -ExecutionPolicy Bypass -File $iconSplashScript
} else {
  Write-Host "" 
  Write-Host "AVISO: Script de icone/splash nao encontrado: $iconSplashScript" -ForegroundColor Yellow
}

# 2) Pre-reqs de build
Write-Host "" 
Write-Host "[2/6] Verificando Node/npm..." -ForegroundColor Yellow
Ensure-Command -Name 'node' -Hint 'Instale Node.js 18+ e reabra o terminal.'
Ensure-Command -Name 'npm' -Hint 'Reinstale npm/Node.js.'

# 3) Dependencias + build web
Write-Host "" 
Write-Host "[3/6] Instalando dependencias e gerando build web..." -ForegroundColor Yellow
Push-Location $clientDir
npm install
npm run build

# 4) Sync Capacitor
Write-Host "" 
Write-Host "[4/6] Sincronizando Capacitor (android)..." -ForegroundColor Yellow
npx cap sync android

# 5) Gerar APK debug (mais rapido) e localizar arquivo
Write-Host "" 
Write-Host "[5/6] Gerando APK Debug..." -ForegroundColor Yellow
Push-Location (Join-Path $clientDir 'android')
$gradlew = Join-Path (Get-Location) 'gradlew.bat'
Ensure-File -Path $gradlew -Label 'gradlew.bat'
& $gradlew clean assembleDebug
Pop-Location

$debugApk = Join-Path $clientDir 'android\app\build\outputs\apk\debug\app-debug.apk'
Ensure-File -Path $debugApk -Label 'APK Debug'

# 6) Mostrar caminho do APK gerado (sem ADB)
Write-Host "" 
Write-Host "[6/6] APK gerado (sem instalar via ADB)" -ForegroundColor Yellow

Write-Host "" 
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  OK - APK gerado com a ultima versao" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "APK: $debugApk" -ForegroundColor Cyan
Write-Host "" 

Start-Process explorer.exe -ArgumentList "/select,$debugApk"

Pop-Location
