# Envia alterações manualmente para o GitHub (sem build nem deploy)
# Repositório: https://github.com/84159331/jkmercearia

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$RemoteUrl = "https://github.com/84159331/jkmercearia.git"
$Branch = "main"

Write-Host "`n=== JK Mercearia — Push manual para GitHub ===" -ForegroundColor Cyan
Write-Host "Pasta: $Root" -ForegroundColor Gray

Set-Location $Root

if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta do projeto JK MERCEARIA." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "Git não inicializado. Executando setup-git.ps1..." -ForegroundColor Yellow
    & (Join-Path $Root "setup-git.ps1")
}

$remotes = @(git remote 2>$null)
if ($remotes -notcontains "origin") {
    git remote add origin $RemoteUrl
} else {
    git remote set-url origin $RemoteUrl
}

git branch -M $Branch

Write-Host "`nStatus atual:" -ForegroundColor Yellow
git status -sb

$changes = git status --porcelain
if (-not $changes) {
    Write-Host "`nNenhuma alteração para enviar." -ForegroundColor Gray

    $ahead = git rev-list --count "origin/$Branch..$Branch" 2>$null
    if ($ahead -and [int]$ahead -gt 0) {
        Write-Host "Há $ahead commit(s) local(is) ainda não enviado(s). Enviando..." -ForegroundColor Yellow
        git push -u origin $Branch
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nPush concluído!" -ForegroundColor Green
            Write-Host "  https://github.com/84159331/jkmercearia" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Repositório já está sincronizado com o GitHub." -ForegroundColor Green
    }
    exit 0
}

if (-not $Message) {
    Write-Host "`nDescreva o que mudou (mensagem do commit):" -ForegroundColor Yellow
    $Message = Read-Host "Mensagem"
}

if (-not $Message.Trim()) {
    Write-Host "ERRO: Mensagem do commit é obrigatória." -ForegroundColor Red
    exit 1
}

Write-Host "`nAdicionando arquivos..." -ForegroundColor Yellow
git add -A

Write-Host "Criando commit..." -ForegroundColor Yellow
git commit -m $Message

Write-Host "Enviando para GitHub ($Branch)..." -ForegroundColor Yellow
git push -u origin $Branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPush falhou. Tentando sincronizar com o remoto..." -ForegroundColor Yellow
    git pull origin $Branch --rebase
    if ($LASTEXITCODE -eq 0) {
        git push -u origin $Branch
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERRO: Não foi possível enviar para o GitHub." -ForegroundColor Red
    Write-Host "Verifique o login:" -ForegroundColor Yellow
    Write-Host "  1. gh auth login" -ForegroundColor White
    Write-Host "  2. ou use um Personal Access Token quando o Git pedir senha" -ForegroundColor White
    Write-Host "     (GitHub > Settings > Developer settings > Personal access tokens)" -ForegroundColor Gray
    exit 1
}

Write-Host "`nPush concluído com sucesso!" -ForegroundColor Green
Write-Host "  https://github.com/84159331/jkmercearia" -ForegroundColor Cyan
