# Script RAPIDO para gerar APK corrigido
# Versao simplificada do script completo

Write-Host ""
Write-Host "Gerando APK corrigido..." -ForegroundColor Cyan
Write-Host ""

# Verificar se esta no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "[ERRO] Execute na pasta 'client'" -ForegroundColor Red
    exit 1
}

# Executar script completo
$scriptPath = "gerar-apk-corrigido-automatico.ps1"
if (Test-Path $scriptPath) {
    & powershell -ExecutionPolicy Bypass -File $scriptPath
} else {
    Write-Host "[ERRO] Script principal nao encontrado!" -ForegroundColor Red
    Write-Host "   Execute: .\gerar-apk-corrigido-automatico.ps1" -ForegroundColor Yellow
    exit 1
}
