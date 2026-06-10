# 📱 Gerar APK com Capacitor - Instruções

## ✅ Status Atual

O Capacitor foi instalado e configurado! Agora você precisa:

### Opção 1: Usar Android Studio (Recomendado)

1. **Instalar Android Studio** (se ainda não tiver):
   - Download: https://developer.android.com/studio
   - Instalar e configurar

2. **Abrir projeto no Android Studio**:
   ```bash
   cd client
   npx cap open android
   ```

3. **Build APK no Android Studio**:
   - Menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Aguarde o build
   - APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

### Opção 2: Build via Linha de Comando (Requer Android SDK)

1. **Configurar variáveis de ambiente**:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
   $env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
   ```

2. **Build APK**:
   ```bash
   cd client/android
   .\gradlew assembleDebug
   ```

3. **APK gerado em**:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 📱 Instalar APK no Celular

### Método 1: Transferir Arquivo

1. **Copiar APK** para o celular (via USB, email, WhatsApp, etc.)

2. **No celular Android**:
   - Abrir gerenciador de arquivos
   - Localizar o arquivo `app-debug.apk`
   - Tocar no arquivo
   - Permitir instalação de fontes desconhecidas (se solicitado)
   - Tocar em "Instalar"

### Método 2: Via USB (ADB)

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

---

## 🔧 Configurações Importantes

### Permissões no AndroidManifest.xml

O Capacitor já configura as permissões básicas. Verifique se estão presentes:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Atualizar App

Sempre que fizer mudanças no código:

1. **Fazer build**:
   ```bash
   cd client
   npm run build
   ```

2. **Sincronizar com Capacitor**:
   ```bash
   npx cap sync
   ```

3. **Rebuild APK** no Android Studio ou via Gradle

---

## ✅ Checklist

- [x] Capacitor instalado
- [x] Projeto Android criado
- [ ] Android Studio instalado (para build visual)
- [ ] APK gerado
- [ ] APK instalado no celular
- [ ] App testado

---

## 🎯 Próximos Passos

1. **Abrir no Android Studio**: `npx cap open android`
2. **Build APK**: Build > Build Bundle(s) / APK(s) > Build APK(s)
3. **Instalar no celular**: Transferir arquivo ou usar ADB
4. **Testar**: Verificar se todas as funcionalidades funcionam

---

**Status:** ✅ Capacitor configurado - Pronto para build no Android Studio!
