# 📱 Como Gerar APK para Instalação no Celular

## 🎯 Objetivo

Gerar um arquivo `.apk` (Android) ou `.aab` (Android App Bundle) para instalar o aplicativo diretamente no celular Android.

---

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 16 ou superior)
2. **Java JDK** instalado (versão 11 ou superior)
3. **Android Studio** (opcional, mas recomendado)
4. Conta no **Firebase Console** (já configurada)

---

## 🚀 Método 1: Usando Bubblewrap (TWA) - RECOMENDADO

### Passo 1: Instalar Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

### Passo 2: Inicializar Projeto TWA

```bash
cd client
bubblewrap init --manifest https://comunidaderesgate-82655.web.app/manifest.json
```

Isso vai:
- Criar pasta `android/`
- Gerar `twa-manifest.json`
- Configurar projeto Android

### Passo 3: Configurar Digital Asset Links

1. Acesse: https://comunidaderesgate-82655.web.app/.well-known/assetlinks.json
2. Ou crie o arquivo em `client/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.comunidaderesgate.app",
    "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_AQUI"]
  }
}]
```

### Passo 4: Build do APK

```bash
# Build APK para debug (teste)
bubblewrap build --mode debug

# Build AAB para produção (Google Play)
bubblewrap build --mode production
```

### Passo 5: Localizar APK Gerado

O APK será gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Ou AAB em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🚀 Método 2: Usando Capacitor (Alternativa)

### Passo 1: Instalar Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

### Passo 2: Inicializar Capacitor

```bash
npx cap init "Comunidade Cristã Resgate" "com.comunidaderesgate.app"
```

### Passo 3: Adicionar Plataforma Android

```bash
npx cap add android
```

### Passo 4: Sincronizar

```bash
npx cap sync
```

### Passo 5: Abrir no Android Studio

```bash
npx cap open android
```

### Passo 6: Build no Android Studio

1. Abra o projeto no Android Studio
2. Vá em: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Aguarde o build
4. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Instalar APK no Celular

### Opção 1: Via USB (ADB)

1. **Habilitar modo desenvolvedor** no celular:
   - Configurações > Sobre o telefone
   - Toque 7 vezes em "Número da versão"

2. **Habilitar depuração USB**:
   - Configurações > Opções do desenvolvedor
   - Ativar "Depuração USB"

3. **Conectar celular via USB** ao computador

4. **Instalar via ADB**:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Opção 2: Transferir Arquivo

1. **Copiar APK** para o celular (via USB, email, etc.)

2. **No celular**:
   - Abrir gerenciador de arquivos
   - Localizar o arquivo `.apk`
   - Tocar no arquivo
   - Permitir instalação de fontes desconhecidas (se solicitado)
   - Instalar

### Opção 3: Upload para Servidor

1. **Fazer upload** do APK para um servidor web
2. **Acessar** o link no celular
3. **Baixar e instalar**

---

## 🔧 Configurações Importantes

### 1. Assinatura do APK (Produção)

Para publicar na Play Store, você precisa assinar o APK:

```bash
# Gerar keystore
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Configurar no android/app/build.gradle
```

### 2. Permissões no AndroidManifest.xml

Verificar se as permissões necessárias estão configuradas:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 3. Configurar VAPID Key para Notificações

1. Acesse Firebase Console > Project Settings > Cloud Messaging
2. Copie a **Web Push certificate** (VAPID key)
3. Atualize em `client/src/utils/fcm.ts`:

```typescript
const VAPID_KEY = 'SUA_VAPID_KEY_AQUI';
```

---

## ✅ Checklist Antes de Gerar APK

- [ ] Build de produção realizado (`npm run build`)
- [ ] Manifest.json configurado corretamente
- [ ] Service Worker funcionando
- [ ] Ícones PWA gerados
- [ ] VAPID key configurada (para notificações)
- [ ] Digital Asset Links configurado
- [ ] Testado localmente

---

## 🐛 Problemas Comuns

### Erro: "SDK location not found"
**Solução:** Configurar `ANDROID_HOME` no sistema:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Erro: "Gradle build failed"
**Solução:** 
- Verificar versão do Java (deve ser 11+)
- Limpar build: `cd android && ./gradlew clean`

### APK não instala no celular
**Solução:**
- Verificar se "Fontes desconhecidas" está habilitado
- Verificar se o APK não está corrompido
- Tentar gerar novamente

---

## 📚 Recursos Úteis

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio/build)

---

## 🎯 Próximos Passos Após Gerar APK

1. **Testar** em dispositivos reais
2. **Configurar notificações push**
3. **Publicar na Google Play Store** (opcional)
4. **Coletar feedback** dos usuários

---

**Status:** ✅ Guia criado - Pronto para gerar APK!
