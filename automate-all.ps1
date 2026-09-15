# Automatiza tudo: chave Firebase + GitHub secret + npm + build + push + deploy
# Uso:
#   .\automate-all.ps1
#   .\automate-all.ps1 -ServiceAccountPath "C:\Downloads\jkmercearia-2865-firebase-adminsdk.json"

param(
    [string]$ServiceAccountPath = ""
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Client = Join-Path $Root "client"
$ConfigDir = Join-Path $Root "config"
$LocalKeyPath = Join-Path $ConfigDir "serviceAccountKey.json"
$RemoteUrl = "https://github.com/jadney2014-spec/jkmercearia.git"
$FirebaseProject = "jkmercearia-2865"
$GhSecretName = "FIREBASE_SERVICE_ACCOUNT_JKMERCEARIA_2865"

function Write-Step([string]$Message) {
    Write-Host "`n$Message" -ForegroundColor Yellow
}

function Test-ServiceAccountJson([string]$Path) {
    if (-not (Test-Path $Path)) { return $false }
    try {
        $json = Get-Content $Path -Raw | ConvertFrom-Json
        return ($json.project_id -and $json.private_key -and $json.client_email)
    } catch {
        return $false
    }
}

function Find-ServiceAccount {
    param([string]$ExplicitPath)

    if ($ExplicitPath -and (Test-ServiceAccountJson $ExplicitPath)) {
        return (Resolve-Path $ExplicitPath).Path
    }

    $defaults = @(
        $LocalKeyPath,
        (Join-Path $Root "serviceAccountKey.json")
    )

    foreach ($p in $defaults) {
        if (Test-ServiceAccountJson $p) { return (Resolve-Path $p).Path }
    }

    $searchRoots = @(
        [Environment]::GetFolderPath("UserProfile") + "\Downloads",
        [Environment]::GetFolderPath("UserProfile") + "\Desktop",
        $Root
    )

    foreach ($dir in $searchRoots) {
        if (-not (Test-Path $dir)) { continue }
        $found = Get-ChildItem $dir -Filter "*.json" -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match 'firebase-adminsdk|jkmercearia|serviceAccount' } |
            Where-Object { Test-ServiceAccountJson $_.FullName } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($found) { return $found.FullName }
    }

    return $null
}

Write-Host "`n=== JK Mercearia — Automação completa ===" -ForegroundColor Cyan
Write-Host "Projeto: $Root" -ForegroundColor Gray

# --- 0. Chave de serviço Firebase ---
Write-Step "[0/5] Configurando chave de serviço Firebase..."

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir | Out-Null
}

$keySource = Find-ServiceAccount -ExplicitPath $ServiceAccountPath

if (-not $keySource) {
    Write-Host "Chave de serviço não encontrada." -ForegroundColor Red
    Write-Host @"

Coloque o arquivo JSON baixado do Firebase em um destes locais:
  1. $LocalKeyPath
  2. Downloads ou Desktop (nome com firebase-adminsdk ou jkmercearia)

Ou execute:
  .\automate-all.ps1 -ServiceAccountPath "C:\caminho\para\chave.json"

Gere a chave em:
  https://console.firebase.google.com/project/$FirebaseProject/settings/serviceaccounts/adminsdk

"@ -ForegroundColor Yellow
    exit 1
}

if ($keySource -ne $LocalKeyPath) {
    Copy-Item -Force $keySource $LocalKeyPath
    Write-Host "Chave copiada para: $LocalKeyPath" -ForegroundColor Green
} else {
    Write-Host "Chave local OK: $LocalKeyPath" -ForegroundColor Green
}

$env:GOOGLE_APPLICATION_CREDENTIALS = $LocalKeyPath
$env:FIREBASE_SERVICE_ACCOUNT = Get-Content $LocalKeyPath -Raw

# GitHub secret (deploy automático no push)
$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
    $auth = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Configurando secret no GitHub ($GhSecretName)..." -ForegroundColor Gray
        gh secret set $GhSecretName --repo jadney2014-spec/jkmercearia < $LocalKeyPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Secret GitHub configurado." -ForegroundColor Green
        } else {
            Write-Host "AVISO: não foi possível definir o secret no GitHub." -ForegroundColor Yellow
        }
    } else {
        Write-Host "AVISO: gh não autenticado. Rode: gh auth login" -ForegroundColor Yellow
    }
} else {
    Write-Host "AVISO: GitHub CLI (gh) não instalado — secret não configurado." -ForegroundColor Yellow
}

# --- 1. Dependências ---
Write-Step "[1/5] Instalando dependências..."
Set-Location $Root
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $Client
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- 2. Build ---
Write-Step "[2/5] Build do frontend..."
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path "build\index.html")) {
    Write-Host "ERRO: Build falhou." -ForegroundColor Red
    exit 1
}
Write-Host "Build OK." -ForegroundColor Green
Set-Location $Root

# --- 3. Git ---
Write-Step "[3/5] Git commit + push..."
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

$remotes = git remote 2>$null
if ($remotes -notcontains "origin") {
    git remote add origin $RemoteUrl
} else {
    git remote set-url origin $RemoteUrl
}

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m @"
Automatiza setup, CI e deploy Firebase Hosting.

- Scripts automate-all e setup
- Workflows GitHub Actions para jkmercearia-2865
- Configuração segura da service account (gitignored)
"@
}

git push -u origin main
if ($LASTEXITCODE -ne 0) {
    git pull origin main --rebase 2>$null
    git push -u origin main
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: push falhou. Verifique credenciais Git." -ForegroundColor Yellow
}

# --- 4. Firebase deploy ---
Write-Step "[4/5] Deploy Firebase Hosting..."
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
    Write-Host "Instalando Firebase CLI..." -ForegroundColor Gray
    npm install -g firebase-tools
}

firebase deploy --only hosting --project $FirebaseProject
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no deploy. Tente: firebase login" -ForegroundColor Red
    exit 1
}

Write-Step "[5/5] Concluído!"
Write-Host "  GitHub:  https://github.com/jadney2014-spec/jkmercearia" -ForegroundColor Cyan
Write-Host "  Site:    https://jkmercearia-2865.web.app" -ForegroundColor Cyan
Write-Host "  CI/CD:   push na main dispara deploy automático (se secret OK)" -ForegroundColor Cyan
