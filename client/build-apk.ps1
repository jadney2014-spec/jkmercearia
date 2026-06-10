# Script de Geracao Automatica de APK - Resgate Contabilidade
# Baseado no Louve App com funcionalidades de contabilidade

$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "Iniciando geracao do APK - Resgate Contabilidade" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Funcao para verificar erros
function Test-Command {
    param($Command, $ErrorMessage)
    try {
        $result = Get-Command $Command -ErrorAction Stop
        Write-Host "OK: $Command encontrado: $($result.Version)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "ERRO: $ErrorMessage" -ForegroundColor Red
        return $false
    }
}

# Funcao para executar comando com tratamento de erro
function Invoke-CommandSafe {
    param($Command, $ErrorMessage)
    Write-Host "Executando: $Command" -ForegroundColor Yellow
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Erro no comando"
        }
        Write-Host "OK: Comando executado com sucesso" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO: $ErrorMessage" -ForegroundColor Red
        Write-Host "Erro: $_" -ForegroundColor Red
        exit 1
    }
}

# 1. Verificar pre-requisitos
Write-Host "Verificando pre-requisitos..." -ForegroundColor Blue

if (-not (Test-Command "node" "Node.js nao encontrado. Instale Node.js 18+")) {
    exit 1
}

if (-not (Test-Command "npm" "npm nao encontrado")) {
    exit 1
}

if (-not (Test-Command "java" "Java nao encontrado. Instale Java 17+")) {
    exit 1
}

# Verificar ANDROID_HOME
if (-not $env:ANDROID_HOME) {
    Write-Host "AVISO: ANDROID_HOME nao configurado. Configure Android Studio." -ForegroundColor Yellow
} else {
    Write-Host "OK: ANDROID_HOME configurado: $env:ANDROID_HOME" -ForegroundColor Green
}

# 2. Limpar builds anteriores
Write-Host "Limpando builds anteriores..." -ForegroundColor Blue
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\app\release" -ErrorAction SilentlyContinue
Write-Host "OK: Builds anteriores limpos" -ForegroundColor Green

# 3. Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Blue
Invoke-CommandSafe "npm install" "Falha ao instalar dependencias do frontend"

# 4. Build do React App
Write-Host "Build do React App..." -ForegroundColor Blue
Invoke-CommandSafe "npm run build" "Falha no build do React App"

# 5. Sincronizar com Capacitor
Write-Host "Sincronizando com Capacitor..." -ForegroundColor Blue
Invoke-CommandSafe "npx cap sync android" "Falha na sincronizacao com Capacitor"

# 6. Gerar Keystore (se nao existir)
if (-not (Test-Path "android.keystore")) {
    Write-Host "Gerando Keystore..." -ForegroundColor Blue
    
    $keystoreCommand = 'keytool -genkey -v -keystore android.keystore -alias resgate-contabilidade -keyalg RSA -keysize 2048 -validity 10000 -storepass resgate123 -keypass resgate123 -dname "CN=Resgate Contabilidade, OU=TI, O=Comunidade Resgate, L=City, ST=State, C=BR"'
    
    Invoke-CommandSafe $keystoreCommand "Falha ao gerar keystore"
    
    # Atualizar capacitor.config.json com as senhas
    $config = Get-Content "capacitor.config.json" | ConvertFrom-Json
    $config.android.buildOptions.keystorePassword = "resgate123"
    $config.android.buildOptions.keystoreAliasPassword = "resgate123"
    $config | ConvertTo-Json -Depth 10 | Set-Content "capacitor.config.json"
    
    Write-Host "OK: Keystore gerada e configurada" -ForegroundColor Green
} else {
    Write-Host "OK: Keystore ja existe" -ForegroundColor Green
}

# 7. Build do APK
Write-Host "Build do APK..." -ForegroundColor Blue
Set-Location "android"

# APK Debug
Write-Host "Gerando APK Debug..." -ForegroundColor Yellow
Invoke-CommandSafe ".\gradlew assembleDebug" "Falha no build do APK Debug"

# APK Release
Write-Host "Gerando APK Release (assinado)..." -ForegroundColor Yellow
Invoke-CommandSafe ".\gradlew assembleRelease" "Falha no build do APK Release"

# 8. Copiar APKs para pasta de distribuicao
Write-Host "Organizando arquivos..." -ForegroundColor Blue
Set-Location ".."
New-Item -ItemType Directory -Force -Path "dist\apk" | Out-Null

Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "dist\apk\ResgateContabilidade-Debug.apk" -Force
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "dist\apk\ResgateContabilidade-Release.apk" -Force

# 9. Gerar informações do APK
Write-Host "Gerando informacoes do APK..." -ForegroundColor Blue
$infoLines = @(
    "Informacoes do APK - Resgate Contabilidade",
    "========================================",
    "Data de Geracao: $(Get-Date -Format \"dd/MM/yyyy HH:mm:ss\")",
    "Versao: 1.0.0",
    "Package: com.comunidaderesgate.contabilidade",
    "",
    "Arquivos Gerados:",
    "- ResgateContabilidade-Debug.apk (para testes)",
    "- ResgateContabilidade-Release.apk (para producao)",
    "",
    "Instrucoes de Instalacao:",
    "1. Transfira o APK para o celular",
    "2. Ative Instalar apps de fontes desconhecidas",
    "3. Abra o APK e siga as instrucoes",
    "",
    "Recursos do App:",
    "- Gestao financeira completa",
    "- Controle de membros",
    "- Relatorios detalhados",
    "- Camera para documentos",
    "- Notificacoes push",
    "- Modo offline",
    "- Backup automatico",
    "",
    "Baseado em: Louve App (Sistema de Escalas)",
    "Adaptado para: Contabilidade da Igreja"
)

$infoContent = $infoLines -join "`r`n"

$infoContent | Out-File -FilePath "dist\apk\INFO.txt" -Encoding UTF8

# 10. Resumo final
Write-Host ""
Write-Host "Geracao do APK concluida com sucesso!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "APK Debug: dist\apk\ResgateContabilidade-Debug.apk" -ForegroundColor Green
Write-Host "APK Release: dist\apk\ResgateContabilidade-Release.apk" -ForegroundColor Green
Write-Host "Informacoes: dist\apk\INFO.txt" -ForegroundColor Green

# 11. Perguntar se quer instalar no dispositivo
Write-Host ""
$install = Read-Host "Deseja instalar o APK Debug no dispositivo conectado? (s/n)"
if ($install -eq "s" -or $install -eq "S") {
    if (Get-Command adb -ErrorAction SilentlyContinue) {
        Write-Host "Instalando APK Debug no dispositivo..." -ForegroundColor Blue
        adb install "dist\apk\ResgateContabilidade-Debug.apk"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: APK instalado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "ERRO: Falha na instalacao do APK" -ForegroundColor Red
        }
    } else {
        Write-Host "AVISO: ADB nao encontrado. Conecte o dispositivo e instale o Android SDK." -ForegroundColor Yellow
    }
}

# 12. Perguntar se quer abrir Android Studio
Write-Host ""
$openStudio = Read-Host "Deseja abrir o projeto no Android Studio? (s/n)"
if ($openStudio -eq "s" -or $openStudio -eq "S") {
    Write-Host "Abrindo Android Studio..." -ForegroundColor Blue
    npx cap open android
}

Write-Host ""
Write-Host "Processo concluido! Seu app Resgate Contabilidade esta pronto!" -ForegroundColor Cyan
Write-Host "Verifique a pasta dist\apk para os arquivos gerados" -ForegroundColor Cyan
Write-Host "Use o APK Release para distribuicao" -ForegroundColor Cyan
Write-Host "Use o APK Debug para desenvolvimento" -ForegroundColor Cyan

# Manter janela aberta por 5 segundos para visualização
Start-Sleep -Seconds 5
