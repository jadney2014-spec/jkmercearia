# 🔧 Configuração das Variáveis de Ambiente Firebase

## 🚨 PROBLEMA IDENTIFICADO

As variáveis de ambiente do Firebase estão com valores de exemplo em vez das configurações reais do seu projeto. Isso impede o Firebase de funcionar corretamente.

## 📋 Como Obter as Configurações Corretas

### 1. Acesse o Firebase Console
```
https://console.firebase.google.com/
```

### 2. Selecione seu projeto
- Clique no projeto `igreja-contabilidade` (ou o nome que você escolheu)

### 3. Obter Configurações
1. Clique no **ícone de engrenagem** (Configurações do projeto)
2. Vá em **"Seus aplicativos"**
3. Se não houver app web, clique **"Adicionar aplicativo"** → **"Web"**
4. **Nome do app**: `igreja-contabilidade-web`
5. **Copie as configurações** que aparecem

### 4. Configurações que você precisa copiar:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "igreja-contabilidade.firebaseapp.com",
  projectId: "igreja-contabilidade",
  storageBucket: "igreja-contabilidade.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 🔧 Como Configurar

### Opção 1: Arquivo .env (Recomendado)
Edite o arquivo `client/.env` e substitua os valores:

```env
# Firebase Configuration - SUBSTITUA PELOS VALORES REAIS
REACT_APP_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=igreja-contabilidade.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=igreja-contabilidade
REACT_APP_FIREBASE_STORAGE_BUCKET=igreja-contabilidade.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration
REACT_APP_API_URL=https://us-central1-igreja-contabilidade.cloudfunctions.net
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=production
```

### Opção 2: Configuração Direta (Temporária)
Se preferir, posso atualizar o arquivo `client/src/firebase/config.ts` com suas configurações reais.

## 🧪 Como Testar

### 1. Após configurar as variáveis:
```bash
cd client
npm run build
cd ..
firebase deploy --only hosting
```

### 2. Verificar no console do navegador:
- Pressione F12
- Aba Console
- Deve aparecer: `🔥 Firebase Config: ✅ Configurado`

### 3. Testar login:
- Acesse: `https://igreja-contabilidade.web.app/tesouraria/login`
- Use: `admin@igreja.com` / `admin123`

## 🚨 Se Ainda Não Funcionar

### 1. Verificar se o usuário existe:
- Firebase Console → **Authentication** → **Users**
- Deve existir: `admin@igreja.com`

### 2. Verificar domínios autorizados:
- Firebase Console → **Authentication** → **Settings** → **Authorized domains**
- Deve ter: `igreja-contabilidade.web.app`

### 3. Verificar console do navegador:
- Procure por erros relacionados ao Firebase
- Verifique se as configurações estão sendo carregadas

## 📱 URLs Importantes

- **Firebase Console**: https://console.firebase.google.com/
- **Seu projeto**: https://igreja-contabilidade.web.app
- **Login**: https://igreja-contabilidade.web.app/tesouraria/login

## ✅ Checklist

- [ ] Configurações copiadas do Firebase Console
- [ ] Arquivo .env atualizado com valores reais
- [ ] Build feito (`npm run build`)
- [ ] Deploy feito (`firebase deploy --only hosting`)
- [ ] Usuário admin criado no Firebase
- [ ] Domínios autorizados configurados
- [ ] Login funcionando
- [ ] Redirecionamento para dashboard funcionando
