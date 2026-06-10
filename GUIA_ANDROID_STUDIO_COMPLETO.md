# 📱 Guia Completo: Gerar APK com Android Studio

## 🎯 Objetivo

Gerar o arquivo `.apk` do aplicativo usando o Android Studio.

---

## 📋 Pré-requisitos

1. **Java 17** instalado (já temos o script)
2. **Android Studio** instalado
3. **Projeto Android** configurado (já está criado)

---

## 🚀 Passo a Passo Completo

### **PASSO 1: Instalar Java 17** (Se ainda não instalou)

1. **Abra PowerShell como Administrador**
2. **Navegue até a pasta do projeto**:
   ```powershell
   cd "C:\Users\Jadney Ranes\contabilidade"
   ```
3. **Execute o script**:
   ```powershell
   .\INSTALAR_JAVA17_DIRETO.ps1
   ```
4. **Aguarde a instalação** (5-10 minutos)
5. **Feche e reabra o terminal**

---

### **PASSO 2: Instalar Android Studio**

#### 2.1 Download

1. **Acesse**: https://developer.android.com/studio
2. **Clique em "Download Android Studio"**
3. **Aceite os termos** e baixe o instalador

#### 2.2 Instalação

1. **Execute o instalador** (`android-studio-*.exe`)
2. **Siga o assistente de instalação**:
   - Next > Next > Install
   - Aguarde a instalação
   - Clique em "Finish"

#### 2.3 Primeira Configuração

1. **Abra o Android Studio**
2. **Na primeira tela**, selecione:
   - "Standard" (configuração padrão)
   - Clique em "Next"
3. **Aguarde o download dos componentes**:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (opcional)
   - Isso pode levar 10-20 minutos
4. **Clique em "Finish"** quando concluir

---

### **PASSO 3: Configurar Projeto no Android Studio**

#### 3.1 Abrir Projeto

1. **Abra o Android Studio**
2. **Clique em "Open"** (ou File > Open)
3. **Navegue até a pasta**:
   ```
   C:\Users\Jadney Ranes\contabilidade\client\android
   ```
4. **Selecione a pasta `android`** e clique em "OK"
5. **Aguarde o Gradle sincronizar** (primeira vez pode demorar 5-10 minutos)

#### 3.2 Verificar Configurações

1. **Verifique se o Java 17 está configurado**:
   - File > Settings (ou Ctrl+Alt+S)
   - Build, Execution, Deployment > Build Tools > Gradle
   - Verifique "Gradle JDK" está como "17" ou "jbr-17"
   - Se não estiver, selecione Java 17

2. **Verifique o Android SDK**:
   - File > Settings > Appearance & Behavior > System Settings > Android SDK
   - Verifique se está instalado:
     - Android SDK Platform 33
     - Android SDK Build-Tools 33.0.0
   - Se não estiver, marque e clique em "Apply"

---

### **PASSO 4: Fazer Build do React (Web)**

Antes de gerar o APK, você precisa fazer o build do React:

1. **Abra um terminal** (no Android Studio: View > Tool Windows > Terminal)
2. **Navegue até a pasta client**:
   ```bash
   cd ..
   ```
   (ou `cd C:\Users\Jadney Ranes\contabilidade\client`)
3. **Execute o build**:
   ```bash
   npm run build
   ```
4. **Aguarde o build concluir** (alguns minutos)

---

### **PASSO 5: Sincronizar com Capacitor**

Após o build do React, sincronize com o Capacitor:

1. **No terminal do Android Studio** (ou PowerShell):
   ```bash
   cd C:\Users\Jadney Ranes\contabilidade\client
   npx cap sync
   ```
2. **Aguarde a sincronização** (alguns segundos)

---

### **PASSO 6: Gerar APK**

#### 6.1 Via Android Studio (Interface Gráfica)

1. **No Android Studio**, certifique-se de que o projeto está aberto
2. **Menu superior**: Build > Build Bundle(s) / APK(s) > Build APK(s)
3. **Aguarde o build** (primeira vez pode levar 5-10 minutos)
4. **Quando concluir**, aparecerá uma notificação:
   - Clique em "locate" para abrir a pasta
   - Ou vá manualmente para:
     ```
     android\app\build\outputs\apk\debug\app-debug.apk
     ```

#### 6.2 Via Terminal (Linha de Comando)

1. **No terminal do Android Studio** (ou PowerShell):
   ```bash
   cd C:\Users\Jadney Ranes\contabilidade\client\android
   .\gradlew.bat assembleDebug
   ```
2. **Aguarde o build** (primeira vez pode levar 5-10 minutos)
3. **APK gerado em**:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

### **PASSO 7: Localizar o APK**

O APK será gerado em:

```
C:\Users\Jadney Ranes\contabilidade\client\android\app\build\outputs\apk\debug\app-debug.apk
```

**Tamanho aproximado:** 20-50 MB

---

### **PASSO 8: Instalar APK no Celular**

#### Opção 1: Transferir Arquivo

1. **Copiar APK** para o celular:
   - Via USB (conectar celular e copiar)
   - Via email (enviar para si mesmo)
   - Via WhatsApp (enviar para si mesmo)
   - Via Google Drive/Dropbox

2. **No celular Android**:
   - Abrir gerenciador de arquivos
   - Localizar o arquivo `app-debug.apk`
   - Tocar no arquivo
   - Se solicitado, permitir "Instalar apps de fontes desconhecidas"
   - Tocar em "Instalar"
   - Aguardar instalação
   - Tocar em "Abrir" ou encontrar o app na lista

#### Opção 2: Via USB (ADB)

1. **Habilitar modo desenvolvedor** no celular:
   - Configurações > Sobre o telefone
   - Toque 7 vezes em "Número da versão"

2. **Habilitar depuração USB**:
   - Configurações > Opções do desenvolvedor
   - Ativar "Depuração USB"

3. **Conectar celular via USB** ao computador

4. **Instalar via ADB**:
   ```bash
   adb install android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 🔄 Atualizar App (Após Mudanças)

Sempre que fizer mudanças no código:

1. **Fazer build do React**:
   ```bash
   cd client
   npm run build
   ```

2. **Sincronizar com Capacitor**:
   ```bash
   npx cap sync
   ```

3. **Rebuild APK no Android Studio**:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Ou via terminal: `.\gradlew.bat assembleDebug`

---

## 🐛 Problemas Comuns e Soluções

### Erro: "SDK location not found"
**Solução:**
1. File > Settings > Appearance & Behavior > System Settings > Android SDK
2. Copie o caminho do "Android SDK Location"
3. Edite `android/local.properties`:
   ```
   sdk.dir=CAMINHO_COPIADO
   ```
4. Sincronize: File > Sync Project with Gradle Files

### Erro: "Gradle sync failed"
**Solução:**
1. File > Invalidate Caches / Restart
2. Selecione "Invalidate and Restart"
3. Aguarde o Android Studio reiniciar

### Erro: "Java version mismatch"
**Solução:**
1. File > Settings > Build, Execution, Deployment > Build Tools > Gradle
2. Altere "Gradle JDK" para Java 17
3. Apply > OK

### Erro: "Build failed"
**Solução:**
1. Build > Clean Project
2. Build > Rebuild Project
3. Se persistir, verifique os logs em: View > Tool Windows > Build

### APK muito grande
**Solução:**
- Isso é normal para o primeiro build
- Para reduzir, use: Build > Build Bundle(s) / APK(s) > Build APK(s) (Release)
- Ou configure ProGuard para minificar

---

## 📋 Checklist Completo

### Antes de Começar:
- [ ] Java 17 instalado
- [ ] Android Studio instalado
- [ ] Android SDK configurado
- [ ] Projeto Android criado (já está)

### No Android Studio:
- [ ] Projeto aberto corretamente
- [ ] Gradle sincronizado
- [ ] Java 17 configurado no Gradle
- [ ] Android SDK configurado

### Build:
- [ ] Build do React realizado (`npm run build`)
- [ ] Capacitor sincronizado (`npx cap sync`)
- [ ] APK gerado com sucesso

### Instalação:
- [ ] APK localizado
- [ ] APK transferido para celular
- [ ] App instalado no celular
- [ ] App testado

---

## 🎯 Resumo Rápido

1. **Instalar Java 17** → `.\INSTALAR_JAVA17_DIRETO.ps1`
2. **Instalar Android Studio** → https://developer.android.com/studio
3. **Abrir projeto** → `client\android` no Android Studio
4. **Build React** → `npm run build`
5. **Sincronizar** → `npx cap sync`
6. **Gerar APK** → Build > Build APK(s)
7. **Instalar no celular** → Transferir arquivo ou ADB

---

## ⏱️ Tempo Estimado

- **Instalar Java 17**: 5-10 minutos
- **Instalar Android Studio**: 15-30 minutos
- **Primeira configuração**: 10-20 minutos
- **Primeiro build**: 10-15 minutos
- **Total**: ~1 hora (primeira vez)

**Builds subsequentes**: 2-5 minutos

---

## 💡 Dicas

1. **Primeira vez**: Deixe o Android Studio baixar todos os componentes
2. **Gradle**: A primeira sincronização pode demorar, seja paciente
3. **Build**: O primeiro build sempre demora mais
4. **Atualizações**: Sempre faça `npm run build` e `npx cap sync` antes de gerar APK

---

**Status:** ✅ Guia completo criado - Siga os passos acima!
