# 📱 Passo a Passo: Android Studio (Resumo Rápido)

## 🎯 Resumo em 7 Passos

### **1️⃣ Instalar Java 17**
```powershell
# PowerShell como Administrador
cd "C:\Users\Jadney Ranes\contabilidade"
.\INSTALAR_JAVA17_DIRETO.ps1
```

### **2️⃣ Instalar Android Studio**
- Download: https://developer.android.com/studio
- Execute o instalador
- Siga o assistente (Standard installation)
- Aguarde download dos componentes

### **3️⃣ Abrir Projeto**
- Android Studio > Open
- Selecione: `C:\Users\Jadney Ranes\contabilidade\client\android`
- Aguarde Gradle sincronizar

### **4️⃣ Build do React**
```bash
cd C:\Users\Jadney Ranes\contabilidade\client
npm run build
```

### **5️⃣ Sincronizar Capacitor**
```bash
npx cap sync
```

### **6️⃣ Gerar APK**
- **No Android Studio**: Build > Build Bundle(s) / APK(s) > Build APK(s)
- **Ou terminal**: `cd android && .\gradlew.bat assembleDebug`

### **7️⃣ Instalar no Celular**
- Localizar: `android\app\build\outputs\apk\debug\app-debug.apk`
- Transferir para celular
- Instalar

---

## 📍 Localização do APK

```
C:\Users\Jadney Ranes\contabilidade\client\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## ⚡ Comandos Rápidos

```bash
# Build React
cd client
npm run build

# Sincronizar
npx cap sync

# Gerar APK
cd android
.\gradlew.bat assembleDebug
```

---

**Veja o guia completo em:** `GUIA_ANDROID_STUDIO_COMPLETO.md`
