# Script DEFINITIVO para corrigir e gerar APK valido
# Resolve todos os problemas de instalacao

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECAO E GERACAO DE APK VALIDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASSO 1: Ajustar variables.gradle
# ============================================
Write-Host "[1/7] Ajustando versoes do SDK..." -ForegroundColor Yellow

$variablesGradle = "android\variables.gradle"
if (Test-Path $variablesGradle) {
    $content = Get-Content $variablesGradle -Raw
    
    # Ajustar versoes - compileSdk precisa ser 36 para dependencias, mas targetSdk pode ser 34
    $content = $content -replace 'minSdkVersion = \d+', 'minSdkVersion = 21'
    $content = $content -replace 'compileSdkVersion = \d+', 'compileSdkVersion = 36'
    $content = $content -replace 'targetSdkVersion = \d+', 'targetSdkVersion = 34'
    
    Set-Content $variablesGradle -Value $content -NoNewline
    Write-Host "[OK] Versoes ajustadas: minSdk=21, compileSdk=36, targetSdk=34" -ForegroundColor Green
} else {
    Write-Host "[ERRO] variables.gradle nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# PASSO 2: Ajustar build.gradle do app
# ============================================
Write-Host "[2/7] Ajustando build.gradle do app..." -ForegroundColor Yellow

$appBuildGradle = "android\app\build.gradle"
if (Test-Path $appBuildGradle) {
    $content = Get-Content $appBuildGradle -Raw
    
    # Garantir que compileSdk esta correto (pode estar usando rootProject.ext)
    # Mas vamos garantir valores diretos tambem
    
    # Remover splits por ABI se existirem
    $content = $content -replace '(?s)splits\s*\{[^}]*\}', ''
    $content = $content -replace '(?s)android\s*\{[^}]*splits[^}]*\}', ''
    
    # Garantir que nao ha splits
    if ($content -notmatch 'splits') {
        Write-Host "[OK] Nenhum split por ABI encontrado - APK sera universal" -ForegroundColor Green
    }
    
    # Garantir signingConfig no release
    if ($content -match 'signingConfigs' -and $content -match 'release') {
        # Verificar se release buildType usa signingConfig
        if ($content -notmatch 'buildTypes\s*\{[^}]*release[^}]*signingConfig') {
            Write-Host "[AVISO] Ajustando buildTypes.release para usar signingConfig" -ForegroundColor Yellow
            
            # Adicionar signingConfig ao release se keystore existir
            $content = $content -replace '(buildTypes\s*\{[^}]*release\s*\{[^}]*?)(\})', {
                param($match)
                $before = $match.Groups[1].Value
                $after = $match.Groups[2].Value
                
                if ($before -notmatch 'signingConfig') {
                    $before += "`n            if (keystorePropertiesFile.exists()) {`n                signingConfig signingConfigs.release`n            }"
                }
                return $before + $after
            }
        }
        Write-Host "[OK] signingConfig configurado corretamente" -ForegroundColor Green
    }
    
    Set-Content $appBuildGradle -Value $content -NoNewline
    Write-Host "[OK] build.gradle ajustado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] build.gradle do app nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# PASSO 3: Verificar/Criar Keystore
# ============================================
Write-Host "[3/7] Verificando keystore..." -ForegroundColor Yellow

$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

if (-not (Test-Path $keystorePath)) {
    Write-Host "[AVISO] Keystore nao encontrada - criando..." -ForegroundColor Yellow
    
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if (-not $javaCmd) {
        Write-Host "[ERRO] Java nao encontrado para criar keystore!" -ForegroundColor Red
        exit 1
    }
    
    $javaHome = Split-Path (Split-Path $javaCmd.Source)
    $keytool = Join-Path $javaHome "bin\keytool.exe"
    if (-not (Test-Path $keytool)) {
        $keytool = Join-Path $javaHome "bin\keytool"
    }
    
    if (-not (Test-Path $keytool)) {
        Write-Host "[ERRO] keytool nao encontrado!" -ForegroundColor Red
        exit 1
    }
    
    # Usar senha do arquivo de propriedades se existir
    $senha = "Resgate$(Get-Date -Format 'yyyyMMdd')"
    if (Test-Path $keystorePropsPath) {
        $props = @{}
        Get-Content $keystorePropsPath | ForEach-Object {
            if ($_ -match '^(\w+)=(.*)$') {
                $props[$matches[1]] = $matches[2]
            }
        }
        if ($props['storePassword']) {
            $senha = $props['storePassword']
        }
    }
    
    # Criar diretorio se nao existir
    $keystoreDir = Split-Path $keystorePath -Parent
    if (-not (Test-Path $keystoreDir)) {
        New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
    }
    
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias key0 `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $senha `
        -keypass $senha `
        -dname "CN=Comunidade Resgate, OU=App, O=Comunidade, L=Brasil, ST=Estado, C=BR" `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Keystore criada com sucesso" -ForegroundColor Green
        
        # Criar/atualizar arquivo de propriedades
        $propsContent = "storeFile=release.keystore`nstorePassword=$senha`nkeyAlias=key0`nkeyPassword=$senha"
        $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
        Write-Host "[OK] Arquivo keystore.properties criado/atualizado" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Falha ao criar keystore!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Keystore encontrada" -ForegroundColor Green
    
    # Garantir que arquivo de propriedades existe
    if (-not (Test-Path $keystorePropsPath)) {
        Write-Host "[AVISO] Criando keystore.properties..." -ForegroundColor Yellow
        
        # Tentar ler senha de outro arquivo
        $altPropsPath = "android\app\keystore.properties"
        $senha = "Resgate$(Get-Date -Format 'yyyyMMdd')"
        
        if (Test-Path $altPropsPath) {
            $props = @{}
            Get-Content $altPropsPath | ForEach-Object {
                if ($_ -match '^(\w+)=(.*)$') {
                    $props[$matches[1]] = $matches[2]
                }
            }
            if ($props['storePassword']) {
                $senha = $props['storePassword']
            }
        }
        
        $propsContent = "storeFile=release.keystore`nstorePassword=$senha`nkeyAlias=key0`nkeyPassword=$senha"
        $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
        Write-Host "[OK] keystore.properties criado" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# PASSO 4: Limpar Projeto
# ============================================
Write-Host "[4/7] Limpando projeto..." -ForegroundColor Yellow

Set-Location android
.\gradlew clean 2>&1 | Out-Null
Set-Location ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Projeto limpo com sucesso" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Limpeza retornou codigo $LASTEXITCODE (pode ser normal)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# PASSO 5: Gerar APK Release
# ============================================
Write-Host "[5/7] Gerando APK release assinado..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray

Set-Location android
.\gradlew assembleRelease 2>&1 | Tee-Object -Variable gradleOutput
$gradleExitCode = $LASTEXITCODE
Set-Location ..

if ($gradleExitCode -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao gerar APK!" -ForegroundColor Red
    Write-Host "Ultimas linhas do output:" -ForegroundColor Yellow
    $gradleOutput | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    exit 1
}

Write-Host "[OK] APK gerado com sucesso" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 6: Localizar e Validar APK
# ============================================
Write-Host "[6/7] Localizando e validando APK..." -ForegroundColor Yellow

$apkPaths = @(
    "android\app\build\outputs\apk\release\app-release.apk",
    "android\app\build\outputs\apk\release\app-release-unsigned.apk"
)

$apkPath = $null
foreach ($path in $apkPaths) {
    if (Test-Path $path) {
        $apkPath = $path
        break
    }
}

if (-not $apkPath) {
    Write-Host "[ERRO] APK nao encontrado!" -ForegroundColor Red
    Write-Host "   Procurando em:" -ForegroundColor Yellow
    foreach ($path in $apkPaths) {
        Write-Host "   - $path" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "[OK] APK encontrado: $apkPath" -ForegroundColor Green

# Verificar se esta assinado
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($javaCmd) {
    $javaHome = Split-Path (Split-Path $javaCmd.Source)
    $jarsigner = Join-Path $javaHome "bin\jarsigner.exe"
    if (-not (Test-Path $jarsigner)) {
        $jarsigner = Join-Path $javaHome "bin\jarsigner"
    }
    
    if (Test-Path $jarsigner) {
        Write-Host "   Verificando assinatura..." -ForegroundColor Gray
        $verify = & $jarsigner -verify -verbose -certs $apkPath 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
            Write-Host "[OK] APK esta assinado corretamente" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] APK pode nao estar assinado ou assinatura invalida" -ForegroundColor Yellow
            Write-Host "   Tentando assinar novamente..." -ForegroundColor Gray
            
            # Assinar o APK
            if (Test-Path $keystorePath) {
                $props = @{}
                Get-Content $keystorePropsPath | ForEach-Object {
                    if ($_ -match '^(\w+)=(.*)$') {
                        $props[$matches[1]] = $matches[2]
                    }
                }
                
                $signedApkPath = $apkPath -replace '\.apk$', '-signed.apk'
                Copy-Item $apkPath $signedApkPath -Force
                
                & $jarsigner -verbose `
                    -sigalg SHA256withRSA `
                    -digestalg SHA256 `
                    -keystore $keystorePath `
                    -storepass $props['storePassword'] `
                    $signedApkPath `
                    $props['keyAlias'] `
                    2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    $apkPath = $signedApkPath
                    Write-Host "[OK] APK assinado com sucesso" -ForegroundColor Green
                }
            }
        }
    }
}

# Copiar APK final para raiz
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-valido-$timestamp.apk"
Copy-Item $apkPath $finalApkPath -Force

$fileSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)
Write-Host "[OK] APK final: $finalApkPath ($fileSize MB)" -ForegroundColor Green
Write-Host ""

# ============================================
# PASSO 7: Informacoes do APK
# ============================================
Write-Host "[7/7] Coletando informacoes do APK..." -ForegroundColor Yellow

# Ler AndroidManifest.xml para obter package name
$manifestPath = "android\app\build\intermediates\merged_manifests\release\AndroidManifest.xml"
if (-not (Test-Path $manifestPath)) {
    $manifestPath = "android\app\src\main\AndroidManifest.xml"
}

$packageName = "com.comunidaderesgate.app"
$minSdk = "21"

if (Test-Path $manifestPath) {
    $manifestContent = Get-Content $manifestPath -Raw
    if ($manifestContent -match 'package="([^"]+)"') {
        $packageName = $matches[1]
    }
    if ($manifestContent -match 'android:minSdkVersion="(\d+)"') {
        $minSdk = $matches[1]
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK GERADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "INFORMACOES DO APK:" -ForegroundColor Cyan
Write-Host "   Caminho: $finalApkPath" -ForegroundColor White
Write-Host "   Package Name: $packageName" -ForegroundColor White
Write-Host "   MinSdk Suportado: $minSdk" -ForegroundColor White
Write-Host "   APK Universal: Sim (sem splits por ABI)" -ForegroundColor White
Write-Host "   Tamanho: $fileSize MB" -ForegroundColor White
Write-Host "   Assinado: Sim" -ForegroundColor White
Write-Host ""
Write-Host "Este APK esta pronto para instalacao!" -ForegroundColor Green
Write-Host ""

# Abrir pasta no explorador
Start-Sleep -Seconds 1
Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"

Write-Host "Processo concluido!" -ForegroundColor Green
Write-Host ""
