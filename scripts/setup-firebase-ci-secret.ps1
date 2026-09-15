# Gera a chave de serviço do Firebase para deploy automático no GitHub Actions.
# Conta: dualtechtechenology@gmail.com | Projeto: jkmercearia-2865

$ErrorActionPreference = "Stop"
$ProjectId = "jkmercearia-2865"
$SecretName = "FIREBASE_SERVICE_ACCOUNT_JKMERCEARIA_2865"
$KeyFile = Join-Path $env:TEMP "jkmercearia-firebase-sa.json"

Write-Host "`n=== Configurar secret do GitHub para Firebase CI ===" -ForegroundColor Cyan
Write-Host "Projeto Firebase: $ProjectId" -ForegroundColor Gray
Write-Host "Secret no GitHub:  $SecretName" -ForegroundColor Gray

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Write-Host "Instale o GitHub CLI: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
    Write-Host "Instale o Firebase CLI: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

Write-Host "`nVerificando login Firebase..." -ForegroundColor Yellow
firebase login:list

Write-Host "`nCriando chave de serviço (pode levar alguns segundos)..." -ForegroundColor Yellow
firebase projects:addfirebase $ProjectId 2>$null | Out-Null

# Usa gcloud se disponível; caso contrário orienta o passo manual
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if ($gcloud) {
    gcloud iam service-accounts keys create $KeyFile `
        --iam-account "firebase-adminsdk@$(firebase projects:list --filter projectId:$ProjectId --format='value(projectId)' 2>$null)@$ProjectId.iam.gserviceaccount.com" `
        2>$null
}

if (-not (Test-Path $KeyFile)) {
    Write-Host "`nChave automática indisponível. Siga no Console Firebase:" -ForegroundColor Yellow
    Write-Host "  1. https://console.firebase.google.com/project/$ProjectId/settings/serviceaccounts/adminsdk" -ForegroundColor Cyan
    Write-Host "  2. Gerar nova chave privada (JSON)" -ForegroundColor Cyan
    Write-Host "  3. No GitHub: Settings > Secrets > Actions > New repository secret" -ForegroundColor Cyan
    Write-Host "     Nome: $SecretName" -ForegroundColor Cyan
    Write-Host "     Valor: conteúdo completo do arquivo JSON" -ForegroundColor Cyan
    Write-Host "`nOu, com gh autenticado e o JSON em mãos:" -ForegroundColor Gray
    Write-Host "  gh secret set $SecretName < caminho-do-arquivo.json" -ForegroundColor Gray
    exit 0
}

Write-Host "`nEnviando secret para o repositório GitHub..." -ForegroundColor Yellow
gh secret set $SecretName --repo jadney2014-spec/jkmercearia < $KeyFile

Remove-Item -Force $KeyFile -ErrorAction SilentlyContinue
Write-Host "`nSecret configurado. Deploy automático ativo ao dar push na branch main." -ForegroundColor Green
