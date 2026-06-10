# Script automatizado para assinar APK
# Uso: .\assinar-apk-auto.ps1 -Senha "sua_senha_aqui"
# Ou execute sem parâmetros e digite a senha quando solicitado

param(
    [Parameter(Mandatory=$false)]
    [string]$Senha = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Alias = "key0"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ASSINADOR AUTOMATICO DE APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se APK existe
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    Write-Host "Local esperado: $apkPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Gere o APK primeiro executando:" -ForegroundColor Yellow
    Write-Host "  .\gerar-apk-bundle.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "APK encontrado!" -ForegroundColor Green
Write-Host ""

# Encontrar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "ERRO: Java nao encontrado!" -ForegroundColor Red
    Write-Host "Instale Java JDK e configure JAVA_HOME" -ForegroundColor Yellow
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"

if (-not (Test-Path $keytool) -or -not (Test-Path $jarsigner)) {
    Write-Host "ERRO: Ferramentas Java nao encontradas!" -ForegroundColor Red
    exit 1
}

Write-Host "Ferramentas Java encontradas" -ForegroundColor Green
Write-Host ""

# Verificar/Criar keystore
$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

# Sempre perguntar senha se não foi fornecida como parâmetro
if ([string]::IsNullOrWhiteSpace($Senha)) {
    Write-Host ""
    if (Test-Path $keystorePath) {
        Write-Host "Keystore existente encontrada" -ForegroundColor Green
        Write-Host "Digite a senha da keystore:" -ForegroundColor Yellow
    } else {
        Write-Host "Voce precisa escolher uma senha para a keystore." -ForegroundColor Cyan
        Write-Host "IMPORTANTE: Guarde bem esta senha! Voce precisara dela para atualizar o app." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Digite a senha da keystore:" -ForegroundColor Yellow
    }
    
    $senhaSecure = Read-Host "Senha" -AsSecureString
    $senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))
    
    if (-not (Test-Path $keystorePath)) {
        $confirmSenha = Read-Host "Confirme a senha" -AsSecureString
        $confirmSenhaPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmSenha))
        
        if ($senha -ne $confirmSenhaPlain) {
            Write-Host ""
            Write-Host "ERRO: As senhas nao coincidem!" -ForegroundColor Red
            exit 1
        }
    }
} else {
    $senha = $Senha
}

if (Test-Path $keystorePath) {
    Write-Host "Keystore existente encontrada" -ForegroundColor Green
    
    # Verificar se precisa do alias
    if ([string]::IsNullOrWhiteSpace($Alias) -or $Alias -eq "key0") {
        if (Test-Path $keystorePropsPath) {
            $props = @{}
            Get-Content $keystorePropsPath | ForEach-Object {
                if ($_ -match '^(\w+)=(.*)$') {
                    $props[$matches[1]] = $matches[2]
                }
            }
            $alias = $props['keyAlias']
        } else {
            Write-Host ""
            $aliasInput = Read-Host "Alias da chave (Enter para usar 'key0')"
            if (-not [string]::IsNullOrWhiteSpace($aliasInput)) {
                $alias = $aliasInput
            }
        }
    } else {
        $alias = $Alias
    }
} else {
    Write-Host "Criando nova keystore..." -ForegroundColor Yellow
    
    # Verificar alias se não foi fornecido
    if ([string]::IsNullOrWhiteSpace($Alias) -or $Alias -eq "key0") {
        Write-Host ""
        $aliasInput = Read-Host "Alias da chave (Enter para usar 'key0')"
        if (-not [string]::IsNullOrWhiteSpace($aliasInput)) {
            $alias = $aliasInput
        }
    } else {
        $alias = $Alias
    }
    
    Write-Host ""
    Write-Host "Criando keystore..." -ForegroundColor Yellow
    
    # Criar keystore
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
    
    Write-Host "Keystore criada com sucesso!" -ForegroundColor Green
    Write-Host ""
}

# Assinar APK
Write-Host "Assinando APK..." -ForegroundColor Yellow
Write-Host ""

$signedApkPath = "android\app\build\outputs\apk\release\app-release-signed.apk"

# Copiar APK original
Copy-Item $apkPath $signedApkPath -Force

# Assinar com jarsigner
Write-Host "Aplicando assinatura digital..." -ForegroundColor Cyan
& $jarsigner -verbose `
    -sigalg SHA256withRSA `
    -digestalg SHA256 `
    -keystore $keystorePath `
    -storepass $senha `
    $signedApkPath `
    $alias `
    2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO ao assinar APK!" -ForegroundColor Red
    Write-Host "Verifique se a senha esta correta" -ForegroundColor Yellow
    exit 1
}

# Verificar assinatura
Write-Host "Verificando assinatura..." -ForegroundColor Cyan
$verify = & $jarsigner -verify -verbose -certs $signedApkPath 2>&1

if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
    Write-Host "Assinatura verificada!" -ForegroundColor Green
} else {
    Write-Host "AVISO: Verificacao da assinatura falhou" -ForegroundColor Yellow
}

# Copiar APK final com timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-assinado-$timestamp.apk"
Copy-Item $signedApkPath $finalApkPath -Force

$fileSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK ASSINADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
Write-Host "Tamanho: $fileSize MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora voce pode instalar no dispositivo Android!" -ForegroundColor Green
Write-Host ""
Write-Host "Para instalar:" -ForegroundColor White
Write-Host "1. Copie o arquivo para o dispositivo" -ForegroundColor Gray
Write-Host "2. Habilite 'Instalar de fontes desconhecidas' nas configuracoes" -ForegroundColor Gray
Write-Host "3. Toque no arquivo .apk para instalar" -ForegroundColor Gray
Write-Host ""
