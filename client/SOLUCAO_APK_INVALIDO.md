# 🔧 Solução: APK Inválido - Não Instala

## ❌ Problema
Ao tentar instalar o APK no celular, aparece a mensagem:
> "O pacote parece ser inválido"

## ✅ Solução: Assinar o APK

O Android requer que APKs sejam **assinados** para instalação. O APK gerado está sem assinatura.

### Método 1: Usar o Script Automático (Recomendado)

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
.\assinar-apk.ps1
```

O script irá:
1. Criar uma keystore (se não existir)
2. Assinar o APK
3. Gerar um APK assinado pronto para instalação

### Método 2: Gerar APK Já Assinado

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
.\gerar-apk-bundle-assinado.ps1
```

### Método 3: Assinar Manualmente com jarsigner

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client\android\app"

# 1. Criar keystore (primeira vez)
keytool -genkey -v -keystore release.keystore -alias key0 -keyalg RSA -keysize 2048 -validity 10000

# 2. Assinar APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA256 -keystore release.keystore -storepass SUA_SENHA ..\..\android\app\build\outputs\apk\release\app-release-unsigned.apk key0

# 3. Verificar assinatura
jarsigner -verify -verbose -certs ..\..\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

---

## 📱 Instalar no Dispositivo

Após assinar o APK:

1. **Copie o APK assinado** para o dispositivo
2. **Habilite "Instalar de fontes desconhecidas"**:
   - Configurações > Segurança > Fontes desconhecidas (ou similar)
3. **Toque no arquivo .apk** para instalar

---

## 🔐 Criar Keystore (Primeira Vez)

Se for a primeira vez, você precisará criar uma keystore:

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client\android\app"

keytool -genkey -v -keystore release.keystore -alias key0 -keyalg RSA -keysize 2048 -validity 10000
```

Você precisará fornecer:
- **Senha da keystore** (GUARDE BEM ESTA SENHA!)
- **Nome completo**
- **Nome da organização**
- **Cidade, estado, país**
- **Confirmação**

---

## ⚠️ Importante

- **GUARDE A SENHA DA KEYSTORE!** Você precisará dela para atualizar o app
- **Use a mesma keystore** para todas as versões do app
- **Não perca a keystore** - sem ela você não poderá atualizar o app na Play Store

---

## 🚀 Solução Rápida Agora

Execute este comando:

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
.\assinar-apk.ps1
```

Siga as instruções na tela para criar a keystore e assinar o APK.
