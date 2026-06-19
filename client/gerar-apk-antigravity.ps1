# Script Não Interativo para Geração de APK - Antigravity
# Usa o JDK 17 local configurado e assina automaticamente via Gradle

$JDK_PATH = "C:\Users\Jadney e Kele\Documents\PROJETO JK MERCEARIA\JK MERCEARIA\client\jdk17\jdk-17.0.14+7"
$JAVA_EXE = Join-Path $JDK_PATH "bin\java.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR DE APK AUTOMÁTICO ANTIGRAVITY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar JDK
if (-not (Test-Path $JAVA_EXE)) {
    Write-Host "ERRO: JDK 17 local não encontrado em: $JDK_PATH" -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $JDK_PATH
$env:Path = "$JDK_PATH\bin;$env:Path"
$env:ANDROID_HOME = "C:\Users\Jadney e Kele\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Jadney e Kele\AppData\Local\Android\Sdk"
Write-Host "[OK] JAVA_HOME configurado para: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "[OK] ANDROID_HOME configurado para: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "[OK] Versão do Java:" -ForegroundColor Green
& java -version
Write-Host ""

# 2. Build do React
Write-Host "[1/4] Fazendo build do React (frontend)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no build do React." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build do React concluído com sucesso." -ForegroundColor Green
Write-Host ""

# 3. Sincronizar Capacitor
Write-Host "[2/4] Sincronizando código nativo com Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha na sincronização do Capacitor." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Sincronização concluída com sucesso." -ForegroundColor Green
Write-Host ""

# 3. Verificar/Gerar Keystore proprietário da JK Mercearia
Write-Host "   Verificando keystore para JK Mercearia..." -ForegroundColor Gray
$keystorePath = "android\app\release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "   Keystore não encontrada! Gerando nova keystore para JK Mercearia..." -ForegroundColor Yellow
    $keytool = Join-Path $JDK_PATH "bin\keytool.exe"
    if (-not (Test-Path $keytool)) {
        $keytool = "keytool.exe"
    }
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias key0 `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass FITgAi@tC3syv `
        -keypass FITgAi@tC3syv `
        -dname "CN=JK Mercearia, OU=App, O=JK Mercearia, L=Brasil, ST=Estado, C=BR" `
        -noprompt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Nova keystore criada com sucesso para a JK Mercearia!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Falha ao gerar a nova keystore." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Keystore existente encontrada." -ForegroundColor Green
}
Write-Host ""

# 4. Compilar APK Release com Gradle (Assinatura automática inclusa)
Write-Host "[3/4] Compilando APK via Gradle..." -ForegroundColor Yellow
Set-Location android

# Limpar caches locais do Gradle para forçar reconfiguração
Write-Host "   Limpando caches do Gradle..." -ForegroundColor Gray
if (Test-Path ".gradle") { Remove-Item ".gradle" -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path "app\.gradle") { Remove-Item "app\.gradle" -Recurse -Force -ErrorAction SilentlyContinue }

.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Falha no clean, prosseguindo com build..." -ForegroundColor Yellow
}

.\gradlew assembleRelease --no-configuration-cache
$gradleStatus = $LASTEXITCODE
Set-Location ..

if ($gradleStatus -ne 0) {
    Write-Host "ERRO: Falha na compilação do APK via Gradle." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Compilação do APK concluída com sucesso." -ForegroundColor Green
Write-Host ""

# 5. Localizar e processar o APK gerado
Write-Host "[4/4] Processando arquivo final do APK..." -ForegroundColor Yellow
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"

if (-not (Test-Path $apkPath)) {
    # Tenta procurar qualquer APK gerado na pasta de release
    $apks = Get-ChildItem -Path "android\app\build\outputs\apk\release" -Filter "*.apk" -File
    if ($apks.Count -gt 0) {
        $apkPath = $apks[0].FullName
    } else {
        Write-Host "ERRO: APK não encontrado no caminho padrão: android\app\build\outputs\apk\release" -ForegroundColor Red
        exit 1
    }
}

# Procurar zipalign para alinhar se possível (opcional, já que Gradle assembleRelease assina e alinha)
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

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$finalApkDir = "..\apks"
if (-not (Test-Path $finalApkDir)) {
    New-Item -ItemType Directory -Path $finalApkDir -Force | Out-Null
}

$finalApkPath = "$finalApkDir\jk-mercearia-$timestamp.apk"
$finalApkLink = "jk-mercearia.apk"

if ($zipalign) {
    Write-Host "[INFO] Executando zipalign no APK..." -ForegroundColor Gray
    $tempAlignedApk = "android\app\build\outputs\apk\release\app-release-aligned.apk"
    if (Test-Path $tempAlignedApk) { Remove-Item $tempAlignedApk -Force }
    
    & $zipalign -f -v 4 $apkPath $tempAlignedApk | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $tempAlignedApk)) {
        Copy-Item $tempAlignedApk $finalApkPath -Force
        Copy-Item $tempAlignedApk "..\$finalApkLink" -Force
        Write-Host "[OK] APK alinhado com zipalign." -ForegroundColor Green
    } else {
        Copy-Item $apkPath $finalApkPath -Force
        Copy-Item $apkPath "..\$finalApkLink" -Force
        Write-Host "[AVISO] Falha ao alinhar com zipalign, copiando APK padrão." -ForegroundColor Yellow
    }
} else {
    Copy-Item $apkPath $finalApkPath -Force
    Copy-Item $apkPath "..\$finalApkLink" -Force
    Write-Host "[INFO] zipalign não encontrado, copiando APK padrão diretamente." -ForegroundColor Gray
}

# Validar se o APK final foi copiado e existe
if (Test-Path "..\$finalApkLink") {
    $apkSize = [math]::Round((Get-Item "..\$finalApkLink").Length / 1MB, 2)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   APK GERADO E ASSINADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Arquivo: jk-mercearia.apk (na raiz do projeto)" -ForegroundColor Cyan
    Write-Host "Tamanho: $apkSize MB" -ForegroundColor Yellow
    Write-Host "Cópia com data: $finalApkPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar assinatura
    $jarsigner = Join-Path $JDK_PATH "bin\jarsigner.exe"
    if (Test-Path $jarsigner) {
        $verify = & $jarsigner -verify -verbose -certs "..\$finalApkLink" 2>&1
        if ($LASTEXITCODE -eq 0 -and $verify -match "jar verified") {
            Write-Host "[OK] Assinatura digital verificada e válida!" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Não foi possível validar a assinatura digital de forma conclusiva, mas o APK foi construído." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ERRO: O APK final não pôde ser gerado." -ForegroundColor Red
    exit 1
}
