# 🔐 Como Assinar APK - Instruções

## 🚀 Método Automatizado (Recomendado)

### Opção 1: Executar e digitar senha quando solicitado

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
.\assinar-apk-auto.ps1
```

O script irá:
1. ✅ Verificar se o APK existe
2. ✅ Perguntar a senha (você escolhe)
3. ✅ Criar keystore automaticamente (se necessário)
4. ✅ Assinar o APK automaticamente
5. ✅ Gerar APK assinado pronto para instalação

### Opção 2: Passar senha como parâmetro

```powershell
cd "C:\Users\Jadney Ranes\contabilidade\client"
.\assinar-apk-auto.ps1 -Senha "sua_senha_aqui"
```

---

## 📝 O que acontece

1. **Primeira vez:**
   - Script pergunta a senha
   - Você escolhe e confirma
   - Keystore é criada automaticamente
   - APK é assinado

2. **Próximas vezes:**
   - Script usa a keystore existente
   - Se tiver `keystore.properties`, usa automaticamente
   - Se não, pergunta a senha uma vez
   - APK é assinado

---

## ⚠️ Importante

- **GUARDE BEM A SENHA!** Você precisará dela para atualizar o app
- **Use a mesma keystore** para todas as versões do app
- **Não perca a keystore** - sem ela você não poderá atualizar na Play Store

---

## 📱 Após Assinar

O APK assinado estará em:
```
app-release-assinado-YYYYMMDD-HHMMSS.apk
```

Agora você pode:
1. Copiar para o dispositivo
2. Instalar normalmente
3. Não precisa mais habilitar "fontes desconhecidas" (mas pode precisar na primeira vez)

---

## 🔄 Atualizar o App

Para gerar uma nova versão assinada:

```powershell
# 1. Gerar novo APK
.\gerar-apk-bundle.ps1

# 2. Assinar (usa a mesma keystore)
.\assinar-apk-auto.ps1
```

A senha será solicitada apenas se não estiver salva em `keystore.properties`.
