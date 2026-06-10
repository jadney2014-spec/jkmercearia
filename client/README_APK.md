# 📱 Guia Rápido: Gerar APK

## 🎯 Escolha o Modo

Você tem **2 opções** de APK:

### 🌐 MODO WEB (Recomendado)
- ✅ Atualizações automáticas do servidor
- ✅ Não precisa gerar novo APK para atualizar
- ⚠️ Requer internet

### 📦 MODO BUNDLE (SDK Completo)
- ✅ Funciona completamente OFFLINE
- ✅ Código completo embutido
- ⚠️ Para atualizar, precisa gerar novo APK

## 🚀 Método Mais Rápido (Interativo)

```powershell
# Na pasta client
.\gerar-apk-interativo.ps1
# ou
npm run apk:interactive
```

O script irá perguntar qual modo você quer!

## 📋 Scripts Disponíveis

### Modo Web (Atualizações Automáticas)
```powershell
.\gerar-apk.ps1                    # Não assinado
.\gerar-apk-assinado.ps1           # Assinado
npm run apk:generate
npm run apk:generate:signed
```

### Modo Bundle (SDK Completo Offline)
```powershell
.\gerar-apk-bundle.ps1             # Não assinado
.\gerar-apk-bundle-assinado.ps1    # Assinado
npm run apk:generate:bundle
npm run apk:generate:bundle:signed
```

## 📚 Documentação Completa

Veja `GUIA_MODOS_APK.md` na raiz do projeto para detalhes completos sobre ambos os modos.

## 🔐 Assinar APK (Primeira Vez)

1. Copie `android/keystore.properties.example` para `android/keystore.properties`
2. Preencha com suas informações
3. Crie a keystore:
   ```powershell
   cd android/app
   keytool -genkey -v -keystore release.keystore -alias key0 -keyalg RSA -keysize 2048 -validity 10000
   ```

## 📚 Documentação Completa

Veja `GUIA_COMPLETO_APK_E_ATUALIZACOES.md` na raiz do projeto para detalhes completos.
