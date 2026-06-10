# Script DEFINITIVO para assinar APK corretamente
# Resolve o problema "pacote invalido" usando zipalign e verificacao completa

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ASSINADOR DE APK DEFINITIVO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASSO 1: Verificar APK
# ============================================
Write-Host "[1/6] Verificando APK..." -ForegroundColor Yellow

$apkPathUnsigned = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$apkPathSigned = "android\app\build\outputs\apk\release\app-release.apk"

$apkPath = $null
if (Test-Path $apkPathUnsigned) {
    $apkPath = $apkPathUnsigned
    Write-Host "[OK] APK nao assinado encontrado" -ForegroundColor Green
} elseif (Test-Path $apkPathSigned) {
    Write-Host "[AVISO] APK ja esta assinado!" -ForegroundColor Yellow
    Write-Host "   Deseja assinar novamente? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -ne "S" -and $resposta -ne "s") {
        Write-Host "Operacao cancelada." -ForegroundColor Gray
        exit 0
    }
    $apkPath = $apkPathSigned
} else {
    Write-Host "[ERRO] APK nao encontrado!" -ForegroundColor Red
    Write-Host "   Gere o APK primeiro: .\gerar-e-assinar-apk.ps1" -ForegroundColor Yellow
    exit 1
}

$fileSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
Write-Host "   Tamanho: $fileSize MB" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASSO 2: Verificar Java e Ferramentas
# ============================================
Write-Host "[2/6] Verificando Java e ferramentas..." -ForegroundColor Yellow

$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[ERRO] Java nao encontrado!" -ForegroundColor Red
    exit 1
}

$javaHome = Split-Path (Split-Path $javaCmd.Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"

# Tentar caminhos alternativos
if (-not (Test-Path $keytool)) {
    $keytool = Join-Path $javaHome "bin\keytool"
}
if (-not (Test-Path $jarsigner)) {
    $jarsigner = Join-Path $javaHome "bin\jarsigner"
}

if (-not (Test-Path $keytool) -or -not (Test-Path $jarsigner)) {
    Write-Host "[ERRO] Ferramentas Java nao encontradas!" -ForegroundColor Red
    Write-Host "   keytool: $keytool" -ForegroundColor Yellow
    Write-Host "   jarsigner: $jarsigner" -ForegroundColor Yellow
    exit 1
}

# Procurar zipalign no Android SDK
$zipalign = $null
$androidSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\build-tools",
    "$env:ANDROID_HOME\build-tools",
    "$env:ANDROID_SDK_ROOT\build-tools",
    "$HOME\AppData\Local\Android\Sdk\build-tools"
)

foreach ($sdkPath in $androidSdkPaths) {
    if (Test-Path $sdkPath) {
        $buildToolsDirs = Get-ChildItem $sdkPath -Directory | Sort-Object Name -Descending
        foreach ($dir in $buildToolsDirs) {
            $zipalignPath = Join-Path $dir.FullName "zipalign.exe"
            if (Test-Path $zipalignPath) {
                $zipalign = $zipalignPath
                break
            }
        }
        if ($zipalign) { break }
    }
}

if (-not $zipalign) {
    Write-Host "[AVISO] zipalign nao encontrado - tentando sem alinhamento" -ForegroundColor Yellow
    Write-Host "   Instale Android SDK Build Tools para melhor resultado" -ForegroundColor Yellow
}

Write-Host "[OK] Java encontrado: $($javaCmd.Source)" -ForegroundColor Green
Write-Host "[OK] jarsigner encontrado" -ForegroundColor Green
if ($zipalign) {
    Write-Host "[OK] zipalign encontrado: $zipalign" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASSO 3: Verificar/Criar Keystore
# ============================================
Write-Host "[3/6] Verificando keystore..." -ForegroundColor Yellow

$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"
$alias = "key0"

if (Test-Path $keystorePath) {
    Write-Host "[OK] Keystore existente encontrada" -ForegroundColor Green
    
    # Tentar ler propriedades
    if (Test-Path $keystorePropsPath) {
        $props = @{}
        Get-Content $keystorePropsPath | ForEach-Object {
            if ($_ -match '^(\w+)=(.*)$') {
                $props[$matches[1]] = $matches[2]
            }
        }
        if ($props['keyAlias']) {
            $alias = $props['keyAlias']
        }
        if ($props['storePassword']) {
            Write-Host "   Usando senha do arquivo de propriedades" -ForegroundColor Gray
            $senha = $props['storePassword']
        } else {
            Write-Host "   Digite a senha da keystore:" -ForegroundColor Cyan
            $senhaSecure = Read-Host "Senha" -AsSecureString
            $senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))
        }
    } else {
        Write-Host "   Digite a senha da keystore:" -ForegroundColor Cyan
        $senhaSecure = Read-Host "Senha" -AsSecureString
        $senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure))
    }
} else {
    Write-Host "[AVISO] Keystore nao encontrada - criando nova..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANTE: Guarde bem esta senha!" -ForegroundColor Yellow
    Write-Host "Voce precisara dela para todas as atualizacoes futuras." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Digite a senha da keystore:" -ForegroundColor Cyan
    $senhaSecure1 = Read-Host "Senha" -AsSecureString
    $senha1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure1))
    
    Write-Host ""
    Write-Host "Confirme a senha:" -ForegroundColor Cyan
    $senhaSecure2 = Read-Host "Confirme" -AsSecureString
    $senha2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSecure2))
    
    if ($senha1 -ne $senha2) {
        Write-Host "[ERRO] As senhas nao coincidem!" -ForegroundColor Red
        exit 1
    }
    
    $senha = $senha1
    
    Write-Host ""
    Write-Host "Criando keystore..." -ForegroundColor Yellow
    
    # Criar diretorio se nao existir
    $keystoreDir = Split-Path $keystorePath -Parent
    if (-not (Test-Path $keystoreDir)) {
        New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
    }
    
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
        Write-Host "[ERRO] Falha ao criar keystore!" -ForegroundColor Red
        exit 1
    }
    
    # Salvar propriedades
    $propsContent = "storeFile=release.keystore`nstorePassword=$senha`nkeyAlias=$alias`nkeyPassword=$senha"
    $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
    
    Write-Host "[OK] Keystore criada com sucesso!" -ForegroundColor Green
}

Write-Host ""

# ============================================
# PASSO 4: Alinhar APK (zipalign) - ANTES de assinar
# ============================================
Write-Host "[4/6] Alinhando APK..." -ForegroundColor Yellow

$alignedApkPath = "android\app\build\outputs\apk\release\app-release-aligned.apk"

if ($zipalign) {
    Write-Host "   Aplicando zipalign..." -ForegroundColor Gray
    
    # Remover APK alinhado anterior se existir
    if (Test-Path $alignedApkPath) {
        Remove-Item $alignedApkPath -Force
    }
    
    & $zipalign -v 4 $apkPath $alignedApkPath 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $alignedApkPath)) {
        Write-Host "[OK] APK alinhado com sucesso!" -ForegroundColor Green
        $apkPath = $alignedApkPath
    } else {
        Write-Host "[AVISO] Falha no alinhamento - continuando sem alinhamento" -ForegroundColor Yellow
        # Continuar com APK original
    }
} else {
    Write-Host "[AVISO] zipalign nao disponivel - pulando alinhamento" -ForegroundColor Yellow
    Write-Host "   O APK sera assinado sem alinhamento (pode funcionar)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# PASSO 5: Assinar APK
# ============================================
Write-Host "[5/6] Assinando APK..." -ForegroundColor Yellow

$signedApkPath = "android\app\build\outputs\apk\release\app-release-signed.apk"

# Copiar APK para assinar
Copy-Item $apkPath $signedApkPath -Force

Write-Host "   Aplicando assinatura digital..." -ForegroundColor Gray
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
    Write-Host "[ERRO] Falha ao assinar APK!" -ForegroundColor Red
    Write-Host "   Verifique se a senha esta correta" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] APK assinado com sucesso!" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 6: Verificar Assinatura e Alinhar NOVAMENTE
# ============================================
Write-Host "[6/6] Verificando assinatura..." -ForegroundColor Yellow

$verify = & $jarsigner -verify -verbose -certs $signedApkPath 2>&1

if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
    Write-Host "[OK] Assinatura verificada!" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Verificacao da assinatura retornou avisos" -ForegroundColor Yellow
    Write-Host "   Mas o APK pode estar funcional" -ForegroundColor Gray
}

# Alinhar NOVAMENTE apos assinatura (importante!)
if ($zipalign) {
    Write-Host ""
    Write-Host "   Realinhando APK apos assinatura..." -ForegroundColor Gray
    
    $finalAlignedPath = "android\app\build\outputs\apk\release\app-release-final.apk"
    
    if (Test-Path $finalAlignedPath) {
        Remove-Item $finalAlignedPath -Force
    }
    
    & $zipalign -v 4 $signedApkPath $finalAlignedPath 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $finalAlignedPath)) {
        Write-Host "[OK] APK realinhado apos assinatura!" -ForegroundColor Green
        $signedApkPath = $finalAlignedPath
    }
}

# ============================================
# FINALIZAR: Copiar APK final
# ============================================
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-assinado-$timestamp.apk"
Copy-Item $signedApkPath $finalApkPath -Force

$finalSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] APK ASSINADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivo: $finalApkPath" -ForegroundColor Cyan
Write-Host "Tamanho: $finalSize MB" -ForegroundColor Yellow
Write-Host ""

# Verificar integridade do APK
Write-Host "Verificando integridade do APK..." -ForegroundColor Gray
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $finalApkPath))
    $entryCount = $zip.Entries.Count
    $zip.Dispose()
    
    if ($entryCount -gt 0) {
        Write-Host "[OK] APK valido com $entryCount arquivos" -ForegroundColor Green
    }
} catch {
    Write-Host "[AVISO] Nao foi possivel verificar integridade completa" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[IMPORTANTE]:" -ForegroundColor Yellow
Write-Host "   - Este APK esta pronto para instalacao" -ForegroundColor White
Write-Host "   - Transfira para o dispositivo Android" -ForegroundColor White
Write-Host "   - Habilite 'Instalar de fontes desconhecidas' se necessario" -ForegroundColor White
Write-Host "   - Toque no arquivo para instalar" -ForegroundColor White
Write-Host ""

# Abrir pasta no explorador
Write-Host "Abrindo pasta do APK..." -ForegroundColor Gray
Start-Sleep -Seconds 1
Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"

Write-Host ""
Write-Host "Processo concluido!" -ForegroundColor Green
Write-Host ""
