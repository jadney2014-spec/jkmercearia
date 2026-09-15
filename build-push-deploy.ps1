# Build + GitHub push + Firebase Hosting (somente hosting)
# Repositorio: https://github.com/jadney2014-spec/jkmercearia
# Firebase: jkmercearia-2865

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Client = Join-Path $Root "client"
$RemoteUrl = "https://github.com/jadney2014-spec/jkmercearia.git"

Write-Host "`n=== JK Mercearia: Build + GitHub + Firebase Hosting ===" -ForegroundColor Cyan

# --- 1. Dependencias + Build ---
Write-Host "`n[1/4] Instalando dependencias e build do frontend..." -ForegroundColor Yellow

if (-not (Test-Path (Join-Path $Root "node_modules"))) {
    Write-Host "Instalando dependencias da raiz..." -ForegroundColor Gray
    Set-Location $Root
    npm install
}

Set-Location $Client

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias do client..." -ForegroundColor Gray
    npm install
}

if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

npm run build

if (-not (Test-Path "build\index.html")) {
    Write-Host "ERRO: Build falhou - client/build/index.html nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "Build OK: client/build" -ForegroundColor Green
Set-Location $Root

# --- 2. Git ---
Write-Host "`n[2/4] Git (commit + push)..." -ForegroundColor Yellow
Set-Location $Root

if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Gray
    git init
    git branch -M main
}

$remotes = git remote 2>$null
if ($remotes -notcontains "origin") {
    git remote add origin $RemoteUrl
    Write-Host "Remote origin adicionado: $RemoteUrl" -ForegroundColor Gray
} else {
    $currentUrl = git remote get-url origin 2>$null
    if ($currentUrl -ne $RemoteUrl) {
        git remote set-url origin $RemoteUrl
        Write-Host "Remote origin atualizado: $RemoteUrl" -ForegroundColor Gray
    }
}

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "Atualiza JK Mercearia: importacao de produtos, precos, controle de pagamentos e deploy hosting."
    Write-Host "Commit criado." -ForegroundColor Green
} else {
    Write-Host "Nenhuma alteracao para commitar." -ForegroundColor Gray
}

Write-Host "Enviando para GitHub..." -ForegroundColor Gray
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tentando push com --force-with-lease (branch divergente)..." -ForegroundColor Yellow
    git pull origin main --rebase 2>$null
    git push -u origin main
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Push falhou. Verifique login Git (gh auth login ou credenciais)." -ForegroundColor Red
    Write-Host "Continuando com deploy do Firebase mesmo assim..." -ForegroundColor Yellow
}

# --- 3. Firebase Hosting ---
Write-Host "`n[3/4] Deploy Firebase (somente hosting)..." -ForegroundColor Yellow

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "Firebase CLI nao encontrada. Instale com: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

firebase deploy --only hosting --project jkmercearia-2865

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no deploy. Tente: firebase login" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] Concluido!" -ForegroundColor Green
Write-Host "  GitHub:  https://github.com/jadney2014-spec/jkmercearia" -ForegroundColor Cyan
Write-Host "  Site:    https://jkmercearia-2865.web.app" -ForegroundColor Cyan
Write-Host "  Alt:     https://jkmercearia-2865.firebaseapp.com" -ForegroundColor Cyan
