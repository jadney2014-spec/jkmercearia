#!/bin/bash

# 🚀 Script de Geração Automática de APK - Resgate Contabilidade
# Baseado no Louve App com funcionalidades de contabilidade

echo "🚀 Iniciando geração do APK - Resgate Contabilidade"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro: $1${NC}"
        exit 1
    fi
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para warning
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Função para info
info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# 1. Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+${NC}"
    exit 1
fi
success "Node.js encontrado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado${NC}"
    exit 1
fi
success "npm encontrado: $(npm --version)"

# Verificar Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java não encontrado. Instale Java 17+${NC}"
    exit 1
fi
success "Java encontrado: $(java -version 2>&1 | head -n 1)"

# Verificar Android Studio
if [ ! -d "$ANDROID_HOME" ]; then
    warning "ANDROID_HOME não configurado. Configure Android Studio."
fi

# 2. Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf client/build
rm -rf client/android/app/build
rm -rf client/android/app/release
success "Builds anteriores limpos"

# 3. Instalar dependências
echo "📦 Instalando dependências..."
cd client
npm install
check_error "Falha ao instalar dependências do frontend"

# 4. Build do React App
echo "🔨 Build do React App..."
npm run build
check_error "Falha no build do React App"
success "React App build concluído"

# 5. Sincronizar com Capacitor
echo "🔄 Sincronizando com Capacitor..."
npx cap sync android
check_error "Falha na sincronização com Capacitor"
success "Capacitor sincronizado"

# 6. Gerar Keystore (se não existir)
if [ ! -f "android.keystore" ]; then
    echo "🔐 Gerando Keystore..."
    keytool -genkey -v -keystore android.keystore -alias resgate-contabilidade -keyalg RSA -keysize 2048 -validity 10000 -storepass resgate123 -keypass resgate123 -dname "CN=Resgate Contabilidade, OU=TI, O=Comunidade Resgate, L=City, ST=State, C=BR"
    check_error "Falha ao gerar keystore"
    success "Keystore gerada"
    
    # Atualizar capacitor.config.json com as senhas
    sed -i 's/"keystorePassword": ""/"keystorePassword": "resgate123"/' capacitor.config.json
    sed -i 's/"keystoreAliasPassword": ""/"keystoreAliasPassword": "resgate123"/' capacitor.config.json
else
    success "Keystore já existe"
fi

# 7. Abrir Android Studio (opcional)
echo "📱 Build do APK..."
cd android

# 8. Build do APK Debug
echo "🔧 Gerando APK Debug..."
./gradlew assembleDebug
check_error "Falha no build do APK Debug"
success "APK Debug gerado"

# 9. Build do APK Release (assinado)
echo "🔐 Gerando APK Release (assinado)..."
./gradlew assembleRelease
check_error "Falha no build do APK Release"
success "APK Release gerado"

# 10. Copiar APKs para pasta de distribuição
echo "📂 Organizando arquivos..."
mkdir -p ../dist/apk
cp app/build/outputs/apk/debug/app-debug.apk ../dist/apk/ResgateContabilidade-Debug.apk
cp app/build/outputs/apk/release/app-release.apk ../dist/apk/ResgateContabilidade-Release.apk

# 11. Gerar informações do APK
echo "📊 Gerando informações do APK..."
cd ..
echo "📱 Informações do APK - Resgate Contabilidade" > dist/apk/INFO.txt
echo "========================================" >> dist/apk/INFO.txt
echo "Data de Geração: $(date)" >> dist/apk/INFO.txt
echo "Versão: 1.0.0" >> dist/apk/INFO.txt
echo "Package: com.comunidaderesgate.contabilidade" >> dist/apk/INFO.txt
echo "" >> dist/apk/INFO.txt
echo "Arquivos Gerados:" >> dist/apk/INFO.txt
echo "- ResgateContabilidade-Debug.apk (para testes)" >> dist/apk/INFO.txt
echo "- ResgateContabilidade-Release.apk (para produção)" >> dist/apk/INFO.txt
echo "" >> dist/apk/INFO.txt
echo "Instruções de Instalação:" >> dist/apk/INFO.txt
echo "1. Transfira o APK para o celular" >> dist/apk/INFO.txt
echo "2. Ative 'Instalar apps de fontes desconhecidas'" >> dist/apk/INFO.txt
echo "3. Abra o APK e siga as instruções" >> dist/apk/INFO.txt

# 12. Resumo final
echo ""
echo "🎉 Geração do APK concluída com sucesso!"
echo "=================================="
success "APK Debug: dist/apk/ResgateContabilidade-Debug.apk"
success "APK Release: dist/apk/ResgateContabilidade-Release.apk"
success "Informações: dist/apk/INFO.txt"

# 13. Perguntar se quer instalar no dispositivo
echo ""
read -p "📱 Deseja instalar o APK Debug no dispositivo conectado? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    if command -v adb &> /dev/null; then
        info "Instalando APK Debug no dispositivo..."
        adb install dist/apk/ResgateContabilidade-Debug.apk
        check_error "Falha na instalação do APK"
        success "APK instalado com sucesso!"
    else
        warning "ADB não encontrado. Conecte o dispositivo e instale o Android SDK."
    fi
fi

# 14. Perguntar se quer abrir Android Studio
echo ""
read -p "🔧 Deseja abrir o projeto no Android Studio? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    info "Abrindo Android Studio..."
    npx cap open android
fi

echo ""
echo "🚀 Processo concluído! Seu app Resgate Contabilidade está pronto!"
echo "📁 Verifique a pasta dist/apk para os arquivos gerados"
echo "📱 Use o APK Release para distribuição"
echo "🔧 Use o APK Debug para desenvolvimento"
