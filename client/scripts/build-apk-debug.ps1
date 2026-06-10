param(
  [ValidateSet('apk','aab')]
  [string]$Output = 'apk',
  [ValidateSet('debug','release')]
  [string]$Variant = 'debug',
  [switch]$SkipBuild,
  [switch]$SkipCapSync
)

$ErrorActionPreference = 'Stop'

$clientRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $clientRoot 'android'

$artifactPath = $null
if ($Output -eq 'apk') {
  if ($Variant -ne 'debug') {
    throw "Para APK, use -Variant debug (o release normalmente requer keystore/assinatura)."
  }
  $artifactPath = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'
} else {
  if ($Variant -ne 'release') {
    throw "Para AAB, use -Variant release."
  }
  $artifactPath = Join-Path $androidDir 'app\build\outputs\bundle\release\app-release.aab'
}

Write-Host "Client root: $clientRoot"

Push-Location $clientRoot
try {
  if (-not $SkipBuild) {
    Write-Host 'Running: npm run build'
    npm run build
  } else {
    Write-Host 'Skipping: npm run build'
  }

  if (-not $SkipCapSync) {
    Write-Host 'Running: npx cap sync android'
    npx cap sync android
  } else {
    Write-Host 'Skipping: npx cap sync android'
  }
} finally {
  Pop-Location
}

Push-Location $androidDir
try {
  $gradle = Join-Path $androidDir 'gradlew.bat'
  if (-not (Test-Path $gradle)) {
    throw "Gradle wrapper não encontrado em: $gradle"
  }

  if ($Output -eq 'apk') {
    Write-Host 'Running: gradlew assembleDebug'
    & $gradle assembleDebug
  } else {
    Write-Host 'Running: gradlew bundleRelease'
    & $gradle bundleRelease
  }
} finally {
  Pop-Location
}

if (Test-Path $artifactPath) {
  Write-Host "Artefato gerado em: $artifactPath"
} else {
  throw "Artefato não encontrado em: $artifactPath"
}
