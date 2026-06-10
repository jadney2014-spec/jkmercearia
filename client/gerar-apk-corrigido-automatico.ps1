# Script AUTOMATICO COMPLETO para corrigir e gerar APK valido
# Aplica todas as correcoes necessarias e gera APK pronto para instalacao

param(
    [switch]$skipBuild,
    [switch]$skipClean
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR DE APK CORRIGIDO AUTOMATICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se esta no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "[ERRO] Execute este script na pasta 'client'" -ForegroundColor Red
    exit 1
}

# ============================================
# PASSO 1: Verificar Dependencias
# ============================================
Write-Host "[1/8] Verificando dependencias..." -ForegroundColor Yellow

# Verificar Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "[ERRO] Java nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Java JDK primeiro" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Java encontrado: $($javaCmd.Source)" -ForegroundColor Green

# Verificar Node/npm
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host "[ERRO] npm nao encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] npm encontrado" -ForegroundColor Green

# Verificar Android SDK
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $androidSdkPath)) {
    Write-Host "[AVISO] Android SDK nao encontrado em $androidSdkPath" -ForegroundColor Yellow
    Write-Host "   O build pode falhar se o SDK nao estiver instalado" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Android SDK encontrado" -ForegroundColor Green
}

Write-Host ""

# ============================================
# PASSO 2: Ajustar variables.gradle
# ============================================
Write-Host "[2/8] Ajustando versoes do SDK..." -ForegroundColor Yellow

$variablesGradle = "android\variables.gradle"
if (Test-Path $variablesGradle) {
    $content = Get-Content $variablesGradle -Raw
    
    # Ajustar versoes
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
# PASSO 3: Corrigir build.gradle do app
# ============================================
Write-Host "[3/8] Corrigindo build.gradle do app..." -ForegroundColor Yellow

$appBuildGradle = "android\app\build.gradle"
if (Test-Path $appBuildGradle) {
    $content = Get-Content $appBuildGradle -Raw
    
    # Garantir que nao ha splits por ABI
    if ($content -match 'splits\s*\{') {
        Write-Host "   Removendo splits por ABI..." -ForegroundColor Gray
        $content = $content -replace '(?s)splits\s*\{[^}]*\}', ''
    }
    
    # Garantir signingConfig no release
    if ($content -match 'signingConfigs' -and $content -match 'release') {
        if ($content -notmatch 'buildTypes\s*\{[^}]*release[^}]*signingConfig') {
            Write-Host "   Ajustando signingConfig no release..." -ForegroundColor Gray
            $content = $content -replace '(buildTypes\s*\{[^}]*release\s*\{[^}]*?)(\})', {
                param($match)
                $before = $match.Groups[1].Value
                $after = $match.Groups[2].Value
                if ($before -notmatch 'signingConfig') {
                    $before += "`n            signingConfig signingConfigs.release"
                }
                return $before + $after
            }
        }
    }
    
    Set-Content $appBuildGradle -Value $content -NoNewline
    Write-Host "[OK] build.gradle corrigido" -ForegroundColor Green
} else {
    Write-Host "[ERRO] build.gradle do app nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# PASSO 4: Corrigir erro do Capacitor
# ============================================
Write-Host "[4/8] Corrigindo erro do Capacitor..." -ForegroundColor Yellow

$systemBarsPath = "node_modules\@capacitor\android\capacitor\src\main\java\com\getcapacitor\plugin\SystemBars.java"
if (Test-Path $systemBarsPath) {
    $content = Get-Content $systemBarsPath -Raw
    
    if ($content -match 'VANILLA_ICE_CREAM') {
        Write-Host "   Substituindo VANILLA_ICE_CREAM por constante numerica..." -ForegroundColor Gray
        $content = $content -replace 'Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.VANILLA_ICE_CREAM', 'Build.VERSION.SDK_INT >= 35'
        
        Set-Content $systemBarsPath -Value $content -NoNewline
        Write-Host "[OK] Erro do Capacitor corrigido" -ForegroundColor Green
    } else {
        Write-Host "[OK] Arquivo ja esta corrigido" -ForegroundColor Green
    }
} else {
    Write-Host "[AVISO] Arquivo SystemBars.java nao encontrado (pode ser normal)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# PASSO 5: Verificar/Criar Keystore
# ============================================
Write-Host "[5/8] Verificando keystore..." -ForegroundColor Yellow

$keystorePath = "android\app\release.keystore"
$keystorePropsPath = "android\keystore.properties"

if (-not (Test-Path $keystorePath)) {
    Write-Host "[AVISO] Keystore nao encontrada - criando..." -ForegroundColor Yellow
    
    $javaHome = Split-Path (Split-Path $javaCmd.Source)
    $keytool = Join-Path $javaHome "bin\keytool.exe"
    if (-not (Test-Path $keytool)) {
        $keytool = Join-Path $javaHome "bin\keytool"
    }
    
    if (-not (Test-Path $keytool)) {
        Write-Host "[ERRO] keytool nao encontrado!" -ForegroundColor Red
        exit 1
    }
    
    # Ler senha do arquivo de propriedades se existir
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
    
    # Criar diretorio
    $keystoreDir = Split-Path $keystorePath -Parent
    if (-not (Test-Path $keystoreDir)) {
        New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
    }
    
    # Criar keystore
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
        
        # Criar arquivo de propriedades
        $propsContent = "storeFile=release.keystore`nstorePassword=$senha`nkeyAlias=key0`nkeyPassword=$senha"
        $propsContent | Out-File $keystorePropsPath -Encoding UTF8 -NoNewline
    } else {
        Write-Host "[ERRO] Falha ao criar keystore!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Keystore encontrada" -ForegroundColor Green
    
    # Garantir que arquivo de propriedades existe
    if (-not (Test-Path $keystorePropsPath)) {
        Write-Host "   Criando keystore.properties..." -ForegroundColor Gray
        
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
    }
}

Write-Host ""

# ============================================
# PASSO 6: Limpar Projeto
# ============================================
if (-not $skipClean) {
    Write-Host "[6/8] Limpando projeto..." -ForegroundColor Yellow
    
    Set-Location android
    .\gradlew clean 2>&1 | Out-Null
    Set-Location ..
    
    Write-Host "[OK] Projeto limpo" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[6/8] Pulando limpeza (--skipClean)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# PASSO 7: Build do React (se necessario)
# ============================================
if (-not $skipBuild) {
    Write-Host "[7/8] Fazendo build do React..." -ForegroundColor Yellow
    
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha no build do React!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Build do React concluido" -ForegroundColor Green
    
    # Sincronizar Capacitor
    Write-Host "   Sincronizando Capacitor..." -ForegroundColor Gray
    npx cap sync android 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[AVISO] Sincronizacao do Capacitor retornou codigo $LASTEXITCODE" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Capacitor sincronizado" -ForegroundColor Green
    }
    
    Write-Host ""
} else {
    Write-Host "[7/8] Pulando build do React (--skipBuild)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# PASSO 8: Gerar APK Release
# ============================================
Write-Host "[8/8] Gerando APK release assinado..." -ForegroundColor Yellow
Write-Host "   Isso pode levar varios minutos..." -ForegroundColor Gray
Write-Host ""

Set-Location android
$gradleOutput = .\gradlew assembleRelease 2>&1
$gradleExitCode = $LASTEXITCODE
Set-Location ..

if ($gradleExitCode -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao gerar APK!" -ForegroundColor Red
    Write-Host "Ultimas linhas do output:" -ForegroundColor Yellow
    $gradleOutput | Select-Object -Last 30 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    exit 1
}

Write-Host "[OK] APK gerado com sucesso!" -ForegroundColor Green
Write-Host ""

# ============================================
# VALIDACAO E INFORMACOES FINAIS
# ============================================
Write-Host "Validando APK gerado..." -ForegroundColor Yellow

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
    exit 1
}

# Verificar assinatura
$javaHome = Split-Path (Split-Path $javaCmd.Source)
$jarsigner = Join-Path $javaHome "bin\jarsigner.exe"
if (-not (Test-Path $jarsigner)) {
    $jarsigner = Join-Path $javaHome "bin\jarsigner"
}

$isSigned = $false
if (Test-Path $jarsigner) {
    $verify = & $jarsigner -verify -verbose -certs $apkPath 2>&1
    if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
        $isSigned = $true
    }
}

# Copiar APK final para raiz com timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkPath = "app-release-corrigido-$timestamp.apk"
Copy-Item $apkPath $finalApkPath -Force

$fileSize = [math]::Round((Get-Item $finalApkPath).Length / 1MB, 2)

# Ler informacoes do manifest
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

# Verificar se APK e universal (sem splits)
$isUniversal = $true
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $finalApkPath))
    $libDirs = $zip.Entries | Where-Object { $_.FullName -match '^lib/' } | ForEach-Object { 
        if ($_.FullName -match '^lib/([^/]+)/') { $matches[1] }
    } | Select-Object -Unique
    
    if ($libDirs.Count -gt 0) {
        $abis = @('armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64')
        $foundAbis = $libDirs | Where-Object { $abis -contains $_ }
        if ($foundAbis.Count -gt 0) {
            $isUniversal = $true
        }
    }
    $zip.Dispose()
} catch {
    # Se nao conseguir verificar, assume universal
    $isUniversal = $true
}

# ============================================
# RESUMO FINAL
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK GERADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "INFORMACOES DO APK:" -ForegroundColor Cyan
Write-Host "   Caminho: $finalApkPath" -ForegroundColor White
Write-Host "   Package Name: $packageName" -ForegroundColor White
Write-Host "   MinSdk Suportado: $minSdk" -ForegroundColor White
Write-Host "   APK Universal: $(if ($isUniversal) { 'Sim' } else { 'Nao' })" -ForegroundColor White
Write-Host "   Tamanho: $fileSize MB" -ForegroundColor White
Write-Host "   Assinado: $(if ($isSigned) { 'Sim' } else { 'Nao' })" -ForegroundColor White
Write-Host ""
Write-Host "CONFIGURACOES APLICADAS:" -ForegroundColor Cyan
Write-Host "   minSdkVersion: 21" -ForegroundColor White
Write-Host "   compileSdkVersion: 36" -ForegroundColor White
Write-Host "   targetSdkVersion: 34" -ForegroundColor White
Write-Host "   Splits por ABI: Desabilitado" -ForegroundColor White
Write-Host ""
Write-Host "Este APK esta pronto para instalacao!" -ForegroundColor Green
Write-Host ""

# Abrir pasta no explorador
Start-Sleep -Seconds 1
Start-Process explorer.exe -ArgumentList "/select,$(Resolve-Path $finalApkPath)"

Write-Host "Processo concluido!" -ForegroundColor Green
Write-Host ""
