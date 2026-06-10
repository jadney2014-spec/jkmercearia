# Script para criar uma NOVA keystore com sua senha
# Remove qualquer keystore antiga e cria uma nova

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAR NOVA KEYSTORE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "ERRO: Java nao encontrado!" -ForegroundColor Red
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"

if (-not (Test-Path $keytool)) {
    Write-Host "ERRO: keytool nao encontrado!" -ForegroundColor Red
    exit 1
}

# Remover keystore antiga se existir
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

if (Test-Path $keystorePath) {
    Write-Host "Removendo keystore antiga..." -ForegroundColor Yellow
    Remove-Item $keystorePath -Force
    Write-Host "Keystore antiga removida!" -ForegroundColor Green
}

if (Test-Path $keystorePropsPath) {
    Write-Host "Removendo arquivo de propriedades antigo..." -ForegroundColor Yellow
    Remove-Item $keystorePropsPath -Force
    Write-Host "Arquivo removido!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAR NOVA KEYSTORE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Voce vai escolher uma senha agora." -ForegroundColor White
Write-Host "IMPORTANTE: Guarde bem esta senha!" -ForegroundColor Yellow
Write-Host "Voce precisara dela para assinar APKs no futuro." -ForegroundColor Yellow
Write-Host ""

# Perguntar senha
Write-Host "Digite a senha que voce quer usar:" -ForegroundColor Cyan
$senhaSecure1 = Read-Host "Senha" -AsSecureString
$senha1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure1))

Write-Host ""
Write-Host "Confirme a senha:" -ForegroundColor Cyan
$senhaSecure2 = Read-Host "Confirme" -AsSecureString
$senha2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure2))

if ($senha1 -ne $senha2) {
    Write-Host ""
    Write-Host "ERRO: As senhas nao coincidem!" -ForegroundColor Red
    Write-Host "Execute o script novamente e digite a mesma senha duas vezes." -ForegroundColor Yellow
    exit 1
}

$senha = $senha1

Write-Host ""
Write-Host "Digite o alias da chave (ou Enter para usar 'key0'):" -ForegroundColor Cyan
$aliasInput = Read-Host "Alias"
if ([string]::IsNullOrWhiteSpace($aliasInput)) {
    $alias = "key0"
} else {
    $alias = $aliasInput
}

Write-Host ""
Write-Host "Criando keystore..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns segundos..." -ForegroundColor Gray

# Criar keystore
& $keytool -genkey -v `
    -keystore $keystorePath `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $senha `
    -keypass $senha `
    -dname "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao criar keystore!" -ForegroundColor Red
    exit 1
}

# Salvar propriedades
@"
storeFile=release.keystore
storePassword=$senha
keyAlias=$alias
keyPassword=$senha
"@ | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  KEYSTORE CRIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Keystore criada em: $keystorePath" -ForegroundColor Cyan
Write-Host "Alias: $alias" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Guarde bem a senha que voce escolheu!" -ForegroundColor White
Write-Host "- Voce precisara dela para assinar APKs" -ForegroundColor White
Write-Host "- Use a mesma keystore para todas as versoes do app" -ForegroundColor White
Write-Host ""
Write-Host "Agora voce pode assinar o APK executando:" -ForegroundColor Green
Write-Host "  .\assinar-apk.ps1" -ForegroundColor Cyan
Write-Host ""
