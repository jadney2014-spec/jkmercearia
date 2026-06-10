# Script AUTOMÁTICO para criar keystore com senha
# Remove keystore antiga e cria uma nova automaticamente

param(
    [switch]$senhaAutomatica,
    [string]$senhaPersonalizada = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAR KEYSTORE AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASSO 1: Verificar Java e Keytool
# ============================================
Write-Host "[1/5] Verificando Java..." -ForegroundColor Yellow

$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[ERRO] Java nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Java JDK primeiro." -ForegroundColor Yellow
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"

if (-not (Test-Path $keytool)) {
    # Tentar caminho alternativo
    $keytool = Join-Path $javaHome "bin\keytool"
    if (-not (Test-Path $keytool)) {
        Write-Host "[ERRO] keytool nao encontrado!" -ForegroundColor Red
        Write-Host "   Java instalado em: $javaHome" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "[OK] Java encontrado: $($javaCmd.Source)" -ForegroundColor Green
Write-Host "[OK] Keytool encontrado: $keytool" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 2: Remover keystore antiga
# ============================================
Write-Host "[2/5] Verificando keystore existente..." -ForegroundColor Yellow

$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"
$keystorePropsPathAlt = "android\app\keystore.properties"

# Criar diretório se não existir
$keystoreDir = Split-Path $keystorePath -Parent
if (-not (Test-Path $keystoreDir)) {
    New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
    Write-Host "[OK] Diretorio criado: $keystoreDir" -ForegroundColor Green
}

# Remover keystore antiga
if (Test-Path $keystorePath) {
    Write-Host "[AVISO] Keystore antiga encontrada!" -ForegroundColor Yellow
    Write-Host "   Removendo keystore antiga..." -ForegroundColor Gray
    Remove-Item $keystorePath -Force
    Write-Host "[OK] Keystore antiga removida!" -ForegroundColor Green
} else {
    Write-Host "[OK] Nenhuma keystore antiga encontrada" -ForegroundColor Green
}

# Remover arquivos de propriedades antigos
foreach ($propsPath in @($keystorePropsPath, $keystorePropsPathAlt)) {
    if (Test-Path $propsPath) {
        Write-Host "   Removendo $propsPath..." -ForegroundColor Gray
        Remove-Item $propsPath -Force
    }
}

Write-Host ""

# ============================================
# PASSO 3: Definir senha
# ============================================
Write-Host "[3/5] Configurando senha da keystore..." -ForegroundColor Yellow

$senha = ""
$alias = "key0"

if ($senhaPersonalizada -ne "") {
    # Usar senha personalizada fornecida
    $senha = $senhaPersonalizada
    Write-Host "[OK] Usando senha personalizada fornecida" -ForegroundColor Green
} elseif ($senhaAutomatica) {
    # Gerar senha automática baseada em timestamp
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $senha = "Resgate$timestamp"
    Write-Host "[OK] Senha automatica gerada" -ForegroundColor Green
    Write-Host "   Senha: $senha" -ForegroundColor Cyan
    Write-Host "   [AVISO] GUARDE ESTA SENHA! Voce precisara dela para assinar APKs." -ForegroundColor Yellow
} else {
    # Solicitar senha do usuário
    Write-Host ""
    Write-Host "IMPORTANTE: Guarde bem esta senha!" -ForegroundColor Yellow
    Write-Host "Você precisará dela para assinar APKs no futuro." -ForegroundColor Yellow
    Write-Host ""
    
    $senhaValida = $false
    $tentativas = 0
    $maxTentativas = 3
    
    while (-not $senhaValida -and $tentativas -lt $maxTentativas) {
        Write-Host "Digite a senha que você quer usar:" -ForegroundColor Cyan
        $senhaSecure1 = Read-Host "Senha" -AsSecureString
        $senha1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure1))
        
        if ([string]::IsNullOrWhiteSpace($senha1)) {
            Write-Host "[ERRO] Senha nao pode estar vazia!" -ForegroundColor Red
            $tentativas++
            continue
        }
        
        Write-Host ""
        Write-Host "Confirme a senha:" -ForegroundColor Cyan
        $senhaSecure2 = Read-Host "Confirme" -AsSecureString
        $senha2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure2))
        
        if ($senha1 -ne $senha2) {
            Write-Host ""
            Write-Host "[ERRO] As senhas nao coincidem!" -ForegroundColor Red
            $tentativas++
            if ($tentativas -lt $maxTentativas) {
                Write-Host "   Tente novamente... ($tentativas/$maxTentativas)" -ForegroundColor Yellow
                Write-Host ""
            }
        } else {
            $senha = $senha1
            $senhaValida = $true
            Write-Host "[OK] Senha confirmada!" -ForegroundColor Green
        }
    }
    
    if (-not $senhaValida) {
        Write-Host ""
        Write-Host "[ERRO] Muitas tentativas falharam!" -ForegroundColor Red
        Write-Host "   Execute o script novamente." -ForegroundColor Yellow
        exit 1
    }
    
    # Perguntar alias
    Write-Host ""
    Write-Host "Digite o alias da chave (ou Enter para usar 'key0'):" -ForegroundColor Cyan
    $aliasInput = Read-Host "Alias"
    if (-not [string]::IsNullOrWhiteSpace($aliasInput)) {
        $alias = $aliasInput
    }
}

Write-Host ""

# ============================================
# PASSO 4: Criar keystore
# ============================================
Write-Host "[4/5] Criando keystore..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns segundos..." -ForegroundColor Gray
Write-Host ""

# Informações do certificado
$dname = "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR"

# Criar keystore
try {
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias $alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $senha `
        -keypass $senha `
        -dname $dname `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "keytool retornou codigo de erro: $LASTEXITCODE"
    }
    
    Write-Host "[OK] Keystore criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro ao criar keystore!" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# PASSO 5: Salvar propriedades
# ============================================
Write-Host "[5/5] Salvando configurações..." -ForegroundColor Yellow

# Criar arquivo de propriedades
$propsContent = @"
storeFile=release.keystore
storePassword=$senha
keyAlias=$alias
keyPassword=$senha
"@

# Salvar em ambos os locais possíveis
$propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline -ErrorAction SilentlyContinue
$propsContent | Out-File $keystorePropsPathAlt -Encoding UTF8 -NoNewline -ErrorAction SilentlyContinue

Write-Host "[OK] Configuracoes salvas!" -ForegroundColor Green
Write-Host ""

# ============================================
# RESUMO FINAL
# ============================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] KEYSTORE CRIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Localizacao: $keystorePath" -ForegroundColor Cyan
Write-Host "Alias: $alias" -ForegroundColor Yellow
Write-Host ""

if (-not $senhaAutomatica) {
    Write-Host "SUA SENHA:" -ForegroundColor Yellow
    Write-Host "   $senha" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "[IMPORTANTE]:" -ForegroundColor Yellow
Write-Host "   - Guarde bem a senha da keystore!" -ForegroundColor White
Write-Host "   - Voce precisara dela para assinar APKs" -ForegroundColor White
Write-Host "   - Use a mesma keystore para todas as versoes do app" -ForegroundColor White
Write-Host "   - Nao perca a keystore - sem ela voce nao podera atualizar na Play Store" -ForegroundColor White
Write-Host ""

if ($senhaAutomatica) {
    Write-Host "[DICA] Para usar senha personalizada, execute:" -ForegroundColor Cyan
    Write-Host "   .\criar-keystore-automatico.ps1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Proximos passos:" -ForegroundColor Green
Write-Host "   - Gerar APK: .\gerar-apk-automatico.ps1" -ForegroundColor Cyan
Write-Host "   - Assinar APK: .\assinar-apk.ps1" -ForegroundColor Cyan
Write-Host ""
