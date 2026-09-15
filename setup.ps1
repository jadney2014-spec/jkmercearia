# Instala dependências (raiz + client) e valida o build
# Repositório: https://github.com/jadney2014-spec/jkmercearia

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Client = Join-Path $Root "client"

Write-Host "`n=== JK Mercearia — Setup ===" -ForegroundColor Cyan
Write-Host "Pasta do projeto: $Root" -ForegroundColor Gray

if (-not (Test-Path (Join-Path $Root "package.json"))) {
    Write-Host "ERRO: package.json não encontrado nesta pasta." -ForegroundColor Red
    Write-Host "Execute este script a partir da pasta do projeto JK MERCEARIA." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[1/3] npm install (raiz)..." -ForegroundColor Yellow
Set-Location $Root
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[2/3] npm install (client)..." -ForegroundColor Yellow
Set-Location $Client
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/3] npm run build (client)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path "build\index.html")) {
    Write-Host "ERRO: Build falhou — client/build/index.html não encontrado." -ForegroundColor Red
    exit 1
}

Set-Location $Root
Write-Host "`nSetup concluído com sucesso!" -ForegroundColor Green
Write-Host "  Desenvolvimento: npm start" -ForegroundColor Cyan
Write-Host "  Deploy completo: npm run release" -ForegroundColor Cyan
Write-Host "  GitHub:          https://github.com/jadney2014-spec/jkmercearia" -ForegroundColor Cyan
