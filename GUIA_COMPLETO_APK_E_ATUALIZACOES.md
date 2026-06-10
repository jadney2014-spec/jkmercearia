# 📱 Guia Completo: Gerar APK e Atualizações Automáticas

## 🎯 Visão Geral

Este guia explica como gerar o APK do aplicativo Android e como o sistema de atualizações automáticas funciona. O aplicativo está configurado para **carregar diretamente do servidor remoto**, o que significa que **todas as atualizações do site são automaticamente refletidas no app** sem precisar gerar um novo APK!

---

## ✨ Como Funcionam as Atualizações Automáticas

### 🔄 Sistema de Atualizações

O aplicativo está configurado no `capacitor.config.json` para carregar o conteúdo diretamente do servidor Firebase:

```json
{
  "server": {
    "url": "https://comunidaderesgate-82655.web.app",
    "cleartext": false
  }
}
```

**Isso significa:**
- ✅ Qualquer atualização feita no site é **automaticamente** refletida no app
- ✅ Não é necessário gerar um novo APK para atualizar o conteúdo
- ✅ O app sempre carrega a versão mais recente do servidor
- ✅ Funciona como um navegador, mas com experiência de app nativo

### 📲 Quando Gerar um Novo APK

Você só precisa gerar um novo APK quando:
- 🔧 Mudanças na configuração nativa do Android (permissões, ícones, splash screen)
- 🔧 Mudanças no `capacitor.config.json` relacionadas ao Android
- 🔧 Adição de novos plugins nativos do Capacitor
- 🔧 Mudanças na estrutura do projeto Android

**Para atualizações de conteúdo, funcionalidades ou design do site, NÃO é necessário gerar novo APK!**

---

## 🚀 Como Gerar o APK

### Pré-requisitos

1. **Java JDK 11 ou superior** instalado
2. **Android SDK** instalado (via Android Studio ou standalone)
3. **Variável de ambiente JAVA_HOME** configurada
4. **Variável de ambiente ANDROID_HOME** configurada (opcional, mas recomendado)

### Método 1: Script Automatizado (Recomendado) ⭐

#### APK Não Assinado (Para testes)

```powershell
cd client
.\gerar-apk.ps1
```

Este script:
1. Faz o build do React
2. Sincroniza com Capacitor
3. Gera o APK usando Gradle
4. Copia o APK para a raiz com timestamp

**Localização do APK:** `client/app-release-YYYYMMDD-HHMMSS.apk`

#### APK Assinado (Para distribuição)

```powershell
cd client
.\gerar-apk-assinado.ps1
```

Este script:
1. Cria keystore se não existir (na primeira vez)
2. Faz o build do React
3. Sincroniza com Capacitor
4. Gera APK assinado
5. Copia o APK para a raiz com timestamp

**Localização do APK:** `client/app-release-assinado-YYYYMMDD-HHMMSS.apk`

### Método 2: Usando NPM Scripts

```powershell
cd client

# Build e sincronizar
npm run apk:build

# Gerar APK (não assinado)
npm run apk:generate

# Gerar APK assinado
npm run apk:generate:signed
```

### Método 3: Manual (Passo a Passo)

```powershell
cd client

# 1. Build do React
npm run build

# 2. Sincronizar com Capacitor
npx cap sync android

# 3. Gerar APK
cd android
.\gradlew assembleRelease

# 4. O APK estará em:
# android\app\build\outputs\apk\release\app-release-unsigned.apk
```

---

## 🔐 Assinando o APK (Para Distribuição)

### Criar Keystore (Primeira Vez)

```powershell
cd client\android\app

# Criar keystore
keytool -genkey -v -keystore release.keystore -alias key0 -keyalg RSA -keysize 2048 -validity 10000

# Você precisará fornecer:
# - Senha da keystore (GUARDE BEM ESTA SENHA!)
# - Nome completo
# - Nome da organização
# - Cidade, estado, país
```

### Configurar Keystore no Projeto

Edite `client/android/app/build.gradle` e adicione:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword 'SUA_SENHA_AQUI'
            keyAlias 'key0'
            keyPassword 'SUA_SENHA_AQUI'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

**⚠️ IMPORTANTE:** Não commite a senha no Git! Use variáveis de ambiente ou arquivo local.

---

## 📦 Instalando o APK no Dispositivo

### Via USB (ADB)

```powershell
# Conectar dispositivo via USB
# Habilitar "Depuração USB" nas opções de desenvolvedor

# Instalar APK
adb install app-release-YYYYMMDD-HHMMSS.apk
```

### Via Transferência de Arquivo

1. Copie o arquivo `.apk` para o dispositivo Android
2. No dispositivo, abra o arquivo
3. Se necessário, habilite "Instalar de fontes desconhecidas"
4. Toque em "Instalar"

---

## 🔧 Configuração do Ambiente

### Verificar Java

```powershell
java -version
# Deve mostrar Java 11 ou superior

echo $env:JAVA_HOME
# Deve mostrar o caminho do JDK
```

### Verificar Android SDK

```powershell
# Verificar se Android SDK está instalado
if (Test-Path "$env:ANDROID_HOME") {
    Write-Host "Android SDK encontrado em: $env:ANDROID_HOME"
} else {
    Write-Host "ANDROID_HOME não configurado"
}
```

### Configurar Variáveis de Ambiente (Windows)

1. Abra "Variáveis de Ambiente" no Windows
2. Adicione/edite:
   - `JAVA_HOME`: `C:\Program Files\Java\jdk-11` (ajuste conforme sua instalação)
   - `ANDROID_HOME`: `C:\Users\SeuUsuario\AppData\Local\Android\Sdk` (ajuste conforme sua instalação)
3. Adicione ao PATH:
   - `%JAVA_HOME%\bin`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`

---

## 🐛 Solução de Problemas

### Erro: "Gradle não encontrado"

```powershell
# Verificar se Gradle está instalado
cd client\android
.\gradlew --version
```

### Erro: "SDK não encontrado"

1. Abra Android Studio
2. Vá em Tools > SDK Manager
3. Instale Android SDK Platform-Tools
4. Configure ANDROID_HOME

### Erro: "Java não encontrado"

1. Instale Java JDK 11 ou superior
2. Configure JAVA_HOME
3. Adicione ao PATH

### Erro: "Build falhou"

```powershell
# Limpar build anterior
cd client\android
.\gradlew clean

# Tentar novamente
.\gradlew assembleRelease
```

### APK muito grande

- O APK pode ser grande porque inclui o runtime do Capacitor
- Para reduzir tamanho, considere usar ProGuard (minifyEnabled = true)
- Mas cuidado: pode quebrar funcionalidades se não configurado corretamente

---

## 📱 Testando Atualizações Automáticas

### Como Testar

1. **Gerar e instalar o APK** no dispositivo
2. **Fazer uma mudança no site** (ex: alterar texto em uma página)
3. **Fazer deploy do site** para Firebase
4. **Abrir o app** no dispositivo
5. **Verificar se a mudança aparece** (pode precisar fechar e reabrir o app)

### Verificar se Está Carregando do Servidor

1. Abra o app
2. Abra o DevTools (se disponível) ou use Chrome DevTools remoto
3. Verifique a URL sendo carregada - deve ser `https://comunidaderesgate-82655.web.app`

---

## 🔄 Fluxo de Trabalho Recomendado

### Desenvolvimento Diário

1. **Fazer mudanças no código** do site
2. **Testar localmente** (`npm start`)
3. **Fazer deploy** para Firebase (`npm run build` + deploy)
4. **Usuários recebem atualização automaticamente** ao abrir o app

### Quando Gerar Novo APK

1. **Mudanças nativas** (permissões, plugins, configuração)
2. **Nova versão do app** (atualizar versionCode e versionName)
3. **Distribuição inicial** ou atualização na Play Store

---

## 📊 Versionamento do App

### Atualizar Versão

Edite `client/android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2  // Incrementar a cada release
    versionName "1.0.1"  // Versão legível
}
```

### Versionamento Semântico

- **Major** (1.0.0 → 2.0.0): Mudanças incompatíveis
- **Minor** (1.0.0 → 1.1.0): Novas funcionalidades compatíveis
- **Patch** (1.0.0 → 1.0.1): Correções de bugs

---

## 🎨 Personalização do App

### Ícone do App

1. Coloque ícones em `client/android/app/src/main/res/mipmap-*/`
2. Tamanhos necessários:
   - `mipmap-mdpi`: 48x48
   - `mipmap-hdpi`: 72x72
   - `mipmap-xhdpi`: 96x96
   - `mipmap-xxhdpi`: 144x144
   - `mipmap-xxxhdpi`: 192x192

### Splash Screen

Configure em `capacitor.config.json`:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ffffff",
      "showSpinner": true,
      "spinnerColor": "#000000"
    }
  }
}
```

### Nome do App

Edite `client/android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Comunidade Cristã Resgate</string>
</resources>
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Gradle Build](https://developer.android.com/studio/build)
- [APK Signing](https://developer.android.com/studio/publish/app-signing)

### Comandos Úteis

```powershell
# Abrir projeto no Android Studio
cd client
npx cap open android

# Sincronizar apenas (sem build)
npx cap sync android

# Verificar configuração do Capacitor
npx cap doctor

# Listar plugins instalados
npx cap ls
```

---

## ✅ Checklist Antes de Gerar APK

- [ ] Build do React funciona (`npm run build`)
- [ ] Site está funcionando corretamente
- [ ] Deploy do site foi feito com sucesso
- [ ] Java está instalado e configurado
- [ ] Android SDK está instalado
- [ ] Variáveis de ambiente estão configuradas
- [ ] Capacitor está sincronizado (`npx cap sync android`)
- [ ] Versão do app foi atualizada (se necessário)
- [ ] Ícones e splash screen estão configurados

---

## 🎉 Conclusão

Com este sistema configurado:

1. ✅ **Atualizações são automáticas** - mudanças no site aparecem no app automaticamente
2. ✅ **APK só precisa ser gerado** para mudanças nativas
3. ✅ **Scripts automatizados** facilitam a geração do APK
4. ✅ **Processo simplificado** para desenvolvimento contínuo

**Lembre-se:** O app carrega diretamente do servidor, então a maioria das atualizações não requerem um novo APK!

---

**Última atualização:** Janeiro 2025
**Versão do guia:** 1.0.0
