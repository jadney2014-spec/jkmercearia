# 📱 Como Gerar APK pelo PowerShell

## 🚀 Método Rápido

### Passo 1: Abrir PowerShell na pasta client

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
```

### Passo 2: Executar o script

**Para APK com SDK Completo (Bundle):**
```powershell
.\gerar-apk-bundle.ps1
```

**Para APK Modo Web (Atualizações automáticas):**
```powershell
.\gerar-apk.ps1
```

**Para escolher interativamente:**
```powershell
.\gerar-apk-interativo.ps1
```

---

## 📋 Passo a Passo Manual

Se o script não funcionar, execute manualmente:

### 1. Build do React
```powershell
npm run build
```

### 2. Sincronizar Capacitor
```powershell
npx cap sync android
```

### 3. Gerar APK
```powershell
cd android
.\gradlew assembleRelease
cd ..
```

### 4. Localizar o APK
O APK estará em:
```
android\app\build\outputs\apk\release\app-release-unsigned.apk
```

---

## 🔧 Solução de Problemas

### Erro: "SDK location not found"

Verifique o arquivo `android\local.properties`:
```
sdk.dir=C:/Users/Jadney Ranes/AppData/Local/Android/Sdk
```

### Erro: "Could not download dependencies"

1. Verifique sua conexão com internet
2. Tente novamente (pode ser temporário)
3. Ou use Android Studio para gerar o APK

### Erro: "Gradle não encontrado"

O Gradle está incluído no projeto. Se não funcionar:
```powershell
cd android
.\gradlew --version
```

---

## ✅ Verificação

Após gerar o APK, verifique:
```powershell
Test-Path "android\app\build\outputs\apk\release\app-release-unsigned.apk"
```

Se retornar `True`, o APK foi gerado com sucesso!

---

## 📱 Instalar no Dispositivo

```powershell
# Via ADB (se dispositivo conectado)
adb install android\app\build\outputs\apk\release\app-release-unsigned.apk

# Ou copie o arquivo .apk para o dispositivo e instale manualmente
```
