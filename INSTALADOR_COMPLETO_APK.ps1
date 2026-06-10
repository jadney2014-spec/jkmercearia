$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

function Test-IsAdmin {
  return ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-JavaMajorVersion {
  try {
    $out = & java -version 2>&1 | Out-String
    if ($out -match 'version\s+"(\d+)(?:\.(\d+))?') {
      $major = [int]$matches[1]
      if ($major -eq 1 -and $matches[2]) { return [int]$matches[2] }
      return $major
    }
  } catch {
    return $null
  }
  return $null
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

$javaInstaller = Join-Path $root 'INSTALAR_JAVA17_DIRETO.ps1'
$androidInstaller = Join-Path $root 'INSTALAR_ANDROID_SDK.ps1'
$apkScript = Join-Path (Join-Path $root 'client') 'gerar-apk-completo-auto.ps1'

Ensure-File -Path $javaInstaller -Label 'Instalador Java 17'
Ensure-File -Path $androidInstaller -Label 'Instalador Android SDK'
Ensure-File -Path $apkScript -Label 'Gerador de APK (client\\gerar-apk-completo-auto.ps1)'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALADOR COMPLETO (JDK + SDK + APK)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$javaMajor = Get-JavaMajorVersion
if (-not $javaMajor -or $javaMajor -lt 17) {
  Write-Host "Java 17+ nao encontrado. Vou iniciar o instalador do JDK." -ForegroundColor Yellow

  if (-not (Test-IsAdmin)) {
    Write-Host "Abrindo instalador do Java 17 como Administrador..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$javaInstaller`""
    Write-Host "Quando o Java terminar de instalar, feche e reabra o terminal e execute este script novamente." -ForegroundColor Cyan
    exit 0
  }

  & powershell -ExecutionPolicy Bypass -File $javaInstaller
  Write-Host "Java instalado/configurado. Se necessario, feche e reabra o terminal." -ForegroundColor Green
} else {
  Write-Host "OK - Java detectado: $javaMajor" -ForegroundColor Green
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
  Write-Host "ANDROID_HOME nao configurado. Vou iniciar o instalador do Android SDK." -ForegroundColor Yellow

  if (-not (Test-IsAdmin)) {
    Write-Host "Abrindo instalador do Android SDK como Administrador..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$androidInstaller`""
    Write-Host "Quando o Android SDK terminar de instalar, feche e reabra o terminal e execute este script novamente." -ForegroundColor Cyan
    exit 0
  }

  & powershell -ExecutionPolicy Bypass -File $androidInstaller
  Write-Host "Android SDK instalado/configurado. Se necessario, feche e reabra o terminal." -ForegroundColor Green
} else {
  Write-Host "OK - ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
}

Write-Host "" 
Write-Host "Iniciando geracao automatica do APK..." -ForegroundColor Cyan
Write-Host "(Este passo roda dentro da pasta client)" -ForegroundColor Gray

& powershell -ExecutionPolicy Bypass -File $apkScript
