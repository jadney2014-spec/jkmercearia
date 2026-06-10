# Configura o Git local para push manual no GitHub
# Repositório: https://github.com/84159331/jkmercearia

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$RemoteUrl = "https://github.com/84159331/jkmercearia.git"
$Branch = "main"

Write-Host "`n=== JK Mercearia — Configuração Git ===" -ForegroundColor Cyan
Write-Host "Pasta: $Root" -ForegroundColor Gray

Set-Location $Root

if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta do projeto JK MERCEARIA." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    git init
}

git branch -M $Branch

$remotes = @(git remote 2>$null)
if ($remotes -notcontains "origin") {
    git remote add origin $RemoteUrl
    Write-Host "Remote origin adicionado." -ForegroundColor Green
} else {
    git remote set-url origin $RemoteUrl
    Write-Host "Remote origin confirmado." -ForegroundColor Green
}

git config --local user.name "Jadney"
git config --local user.email "jadney2014@gmail.com"
git config --local init.defaultBranch $Branch

Write-Host "`nConfiguração atual:" -ForegroundColor Yellow
git remote -v
git branch -vv
git config --local --list | Select-String "user\.|remote\.|branch\."

Write-Host "`nGit pronto para push manual." -ForegroundColor Green
Write-Host "  Repositório: https://github.com/84159331/jkmercearia" -ForegroundColor Cyan
Write-Host "  Branch:      $Branch" -ForegroundColor Cyan
Write-Host "`nPara enviar alterações:" -ForegroundColor Gray
Write-Host "  .\git-push-manual.ps1" -ForegroundColor White
Write-Host "  ou dê duplo clique em 'JK Mercearia - Git Push.cmd' na Área de Trabalho." -ForegroundColor White
