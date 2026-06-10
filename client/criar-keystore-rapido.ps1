# Script RÁPIDO para criar keystore
# Uso: .\criar-keystore-rapido.ps1 -senha "MinhaSenha123"

param(
    [Parameter(Mandatory=$false)]
    [string]$senha = ""
)

Write-Host ""
Write-Host "CRIAR KEYSTORE RAPIDO" -ForegroundColor Cyan
Write-Host ""

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[ERRO] Java nao encontrado!" -ForegroundColor Red
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
if (-not (Test-Path $keytool)) {
    $keytool = Join-Path $javaHome "bin\keytool"
}

# Caminhos
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"
$alias = "key0"

# Remover antiga
if (Test-Path $keystorePath) {
    Write-Host "Removendo keystore antiga..." -ForegroundColor Yellow
    Remove-Item $keystorePath -Force
}

# Solicitar senha se não fornecida
if ([string]::IsNullOrWhiteSpace($senha)) {
    Write-Host "Digite a senha da keystore:" -ForegroundColor Cyan
    $senhaSecure = Read-Host "Senha" -AsSecureString
    $senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))
}

# Criar diretório
$keystoreDir = Split-Path $keystorePath -Parent
if (-not (Test-Path $keystoreDir)) {
    New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
}

# Criar keystore
Write-Host "Criando keystore..." -ForegroundColor Yellow
& $keytool -genkey -v `
    -keystore $keystorePath `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $senha `
    -keypass $senha `
    -dname "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR" `
    2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro ao criar keystore!" -ForegroundColor Red
    exit 1
}

# Salvar propriedades
$propsContent = "storeFile=release.keystore`nstorePassword=$senha`nkeyAlias=$alias`nkeyPassword=$senha"
$propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "[OK] KEYSTORE CRIADA!" -ForegroundColor Green
Write-Host "   Local: $keystorePath" -ForegroundColor Cyan
Write-Host "   Senha: $senha" -ForegroundColor Yellow
Write-Host ""
Write-Host "[AVISO] Guarde bem a senha!" -ForegroundColor Yellow
Write-Host ""
