# Fallback: copia xlsx como zip, extrai XML e executa parser manual (sem npm)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$excel = 'C:\Users\Jadney e Kele\Documents\ITENS RJ MERCEARIA.xlsx'
$extractDir = Join-Path $scriptDir 'xlsx-extract'

if (-not (Test-Path $excel)) {
  Write-Error "Excel não encontrado: $excel"
}

Set-Location $scriptDir

if (-not (Test-Path 'node_modules\xlsx')) {
  if (-not (Test-Path 'package.json')) { npm init -y | Out-Null }
  npm install xlsx
}

node parse-excel.js
if ($LASTEXITCODE -eq 0) { exit 0 }

Write-Host 'Parser xlsx falhou; tentando extração manual via ZIP...'
if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
New-Item -ItemType Directory -Path $extractDir | Out-Null

$zipCopy = Join-Path $extractDir 'workbook.zip'
Copy-Item $excel $zipCopy
Expand-Archive -Path $zipCopy -DestinationPath $extractDir -Force
node parse-excel-manual.js
exit $LASTEXITCODE
