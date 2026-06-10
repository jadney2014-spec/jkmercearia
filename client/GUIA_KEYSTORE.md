# 🔐 Guia de Criação de Keystore

Este guia explica como criar uma nova keystore para assinar seus APKs Android.

## 📋 O que é uma Keystore?

A keystore é um arquivo que contém as chaves criptográficas usadas para assinar seu aplicativo Android. É essencial para:
- Publicar apps na Google Play Store
- Atualizar versões do seu app
- Manter a segurança e autenticidade do app

⚠️ **IMPORTANTE**: Guarde bem a senha da keystore! Sem ela, você não poderá atualizar seu app na Play Store.

---

## 🚀 Scripts Disponíveis

### 1. Script Automático Completo (Recomendado)
**Arquivo**: `criar-keystore-automatico.ps1`

Este é o script mais completo e recomendado. Ele:
- ✅ Verifica Java automaticamente
- ✅ Remove keystore antiga
- ✅ Permite escolher senha manual ou automática
- ✅ Valida senha (confirmação)
- ✅ Salva configurações automaticamente

#### Uso:

**Opção 1: Senha Manual (Recomendado)**
```powershell
cd client
.\criar-keystore-automatico.ps1
```
O script pedirá para você digitar e confirmar a senha.

**Opção 2: Senha Automática**
```powershell
cd client
.\criar-keystore-automatico.ps1 -senhaAutomatica
```
Gera uma senha automática baseada em timestamp (ex: `Resgate20241201143022`)

**Opção 3: Senha Personalizada**
```powershell
cd client
.\criar-keystore-automatico.ps1 -senhaPersonalizada "MinhaSenha123"
```

---

### 2. Script Rápido
**Arquivo**: `criar-keystore-rapido.ps1`

Script mais simples para uso rápido.

#### Uso:

**Com senha como parâmetro:**
```powershell
cd client
.\criar-keystore-rapido.ps1 -senha "MinhaSenha123"
```

**Solicitar senha interativamente:**
```powershell
cd client
.\criar-keystore-rapido.ps1
```

---

### 3. Script Original
**Arquivo**: `criar-keystore-nova.ps1`

Script original que sempre solicita senha manualmente.

#### Uso:
```powershell
cd client
.\criar-keystore-nova.ps1
```

---

## 📝 Passo a Passo

### 1. Navegar para a pasta client
```powershell
cd client
```

### 2. Executar o script
Escolha um dos scripts acima e execute.

### 3. Guardar a senha
⚠️ **CRÍTICO**: Anote a senha em um local seguro!

### 4. Verificar criação
O script criará:
- `android/app/release.keystore` - Arquivo da keystore
- `android/keystore.properties` - Arquivo com as configurações

---

## 🔍 Verificar Keystore Criada

Para verificar se a keystore foi criada corretamente:

```powershell
# Verificar se o arquivo existe
Test-Path android\app\release.keystore

# Listar informações da keystore (vai pedir a senha)
$javaHome = Split-Path (Split-Path (Get-Command java).Source)
$keytool = Join-Path $javaHome "bin\keytool.exe"
& $keytool -list -v -keystore android\app\release.keystore
```

---

## ⚠️ Problemas Comuns

### Erro: "Java não encontrado"
**Solução**: Instale o Java JDK e adicione ao PATH.

### Erro: "keytool não encontrado"
**Solução**: Verifique se o Java está instalado corretamente. O keytool vem com o JDK.

### Erro: "Senha incorreta" ao assinar APK
**Solução**: 
1. Verifique se está usando a senha correta
2. Se esqueceu a senha, você precisará criar uma nova keystore
3. ⚠️ **ATENÇÃO**: Nova keystore = novo app (não pode atualizar app antigo na Play Store)

### Keystore antiga não está funcionando
**Solução**: Use um dos scripts para criar uma nova keystore. Eles removem automaticamente a antiga.

---

## 📌 Dicas Importantes

1. **Backup da Keystore**: Faça backup do arquivo `release.keystore` e guarde em local seguro
2. **Senha Segura**: Use uma senha forte e guarde em um gerenciador de senhas
3. **Mesma Keystore**: Use sempre a mesma keystore para todas as versões do mesmo app
4. **Não Compartilhe**: Nunca compartilhe a keystore ou senha publicamente

---

## 🎯 Próximos Passos

Após criar a keystore:

1. **Gerar APK**:
   ```powershell
   .\gerar-apk-automatico.ps1
   ```

2. **Assinar APK** (se necessário):
   ```powershell
   .\assinar-apk.ps1
   ```

---

## 📚 Referências

- [Android Developer - App Signing](https://developer.android.com/studio/publish/app-signing)
- [Keytool Documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)
