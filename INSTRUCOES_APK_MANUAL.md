# 📱 Instruções para Gerar APK Manualmente

## ⚠️ Situação Atual

O Capacitor está sendo configurado, mas devido a limitações do ambiente, você precisará completar alguns passos manualmente.

---

## 🎯 Opção Mais Simples: Usar PWA Builder (Recomendado)

### Passo 1: Acessar PWA Builder

1. Acesse: https://www.pwabuilder.com/
2. Cole a URL: `https://comunidaderesgate-82655.web.app`
3. Clique em "Start"

### Passo 2: Gerar Pacotes

1. Após análise, clique em "Build My PWA"
2. Selecione "Android"
3. Clique em "Generate Package"
4. Baixe o arquivo `.apk` gerado

### Passo 3: Instalar no Celular

1. Transferir o `.apk` para o celular
2. Abrir o arquivo no celular
3. Permitir instalação de fontes desconhecidas
4. Instalar

---

## 🔧 Opção 2: Usar Android Studio (Mais Completo)

### Pré-requisitos:

1. **Instalar Android Studio**:
   - Download: https://developer.android.com/studio
   - Instalar com Android SDK

2. **Instalar Java JDK 11+**:
   - Download: https://adoptium.net/
   - Instalar JDK 11 ou superior

### Passos:

1. **Abrir terminal na pasta `client`**:
   ```bash
   cd client
   ```

2. **Instalar Capacitor** (se ainda não instalou):
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android --legacy-peer-deps
   ```

3. **Inicializar Capacitor**:
   ```bash
   npx cap init "Comunidade Cristã Resgate" "com.comunidaderesgate.app" --web-dir=build
   ```

4. **Adicionar plataforma Android**:
   ```bash
   npx cap add android
   ```

5. **Sincronizar**:
   ```bash
   npx cap sync
   ```

6. **Abrir no Android Studio**:
   ```bash
   npx cap open android
   ```

7. **Build APK no Android Studio**:
   - Menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Aguarde o build
   - APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Opção 3: Usar Bubblewrap (TWA)

### Passos:

1. **Instalar Bubblewrap**:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Inicializar projeto**:
   ```bash
   cd client
   bubblewrap init --manifest https://comunidaderesgate-82655.web.app/manifest.json
   ```
   - Quando perguntar sobre JDK, escolha "Y" (Yes)

3. **Build APK**:
   ```bash
   bubblewrap build --mode debug
   ```

4. **APK gerado em**:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## ✅ Recomendação

**Use o PWA Builder** (Opção 1) - É a forma mais rápida e simples:
- Não requer instalação de ferramentas
- Gera APK diretamente no navegador
- Funciona imediatamente

---

## 📋 Checklist

- [ ] Escolher método (PWA Builder recomendado)
- [ ] Gerar APK
- [ ] Transferir APK para celular
- [ ] Instalar no celular
- [ ] Testar aplicativo

---

**Status:** ⚠️ Aguardando escolha do método - PWA Builder é o mais rápido!
