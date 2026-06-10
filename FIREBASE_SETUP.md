# Configuração do Firebase para Deploy

## Passos para Configurar Firebase:

### 1. Criar Projeto no Firebase Console
1. Acesse: https://console.firebase.google.com/
2. Clique em "Criar um projeto"
3. Nome do projeto: `igreja-contabilidade` (ou seu nome preferido)
4. Ative Google Analytics (opcional)

### 2. Configurar Firebase Hosting
1. No console, vá em "Hosting"
2. Clique em "Começar"
3. Instale Firebase CLI: `npm install -g firebase-tools`
4. Faça login: `firebase login`
5. Inicialize: `firebase init hosting`

### 3. Configurar Firebase Functions
1. No console, vá em "Functions"
2. Clique em "Começar"
3. Inicialize: `firebase init functions`

### 4. Configurar Firebase Authentication
1. No console, vá em "Authentication"
2. Clique em "Começar"
3. Vá em "Sign-in method"
4. Ative "Email/Password"

### 5. Configurar Firestore Database
1. No console, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha modo de produção
4. Escolha localização (us-east1 para melhor performance)

### 6. Obter Configurações
1. No console, vá em "Configurações do projeto" (ícone de engrenagem)
2. Vá em "Seus aplicativos"
3. Clique em "Adicionar aplicativo" > "Web"
4. Copie as configurações para o arquivo `.env`

### 7. Variáveis de Ambiente (.env)
```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=sua-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Configuration
REACT_APP_API_URL=https://us-central1-seu-projeto.cloudfunctions.net
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=production
```

### 8. Deploy
```bash
# Build do frontend
cd client && npm run build

# Deploy das Functions
cd .. && firebase deploy --only functions

# Deploy do Hosting
firebase deploy --only hosting

# Deploy completo
firebase deploy
```

### 9. URLs de Produção
- **Frontend**: https://seu-projeto.web.app
- **Functions**: https://us-central1-seu-projeto.cloudfunctions.net
- **Firestore**: Console do Firebase

### 10. Credenciais de Login
- **Email**: admin@igreja.com
- **Senha**: admin123

## Vantagens do Firebase:
✅ **Gratuito**: Plano gratuito generoso
✅ **Escalável**: Cresce com seu projeto
✅ **CDN Global**: Performance mundial
✅ **Backup Automático**: Firestore com backup
✅ **Segurança**: Regras de segurança robustas
✅ **PWA Ready**: Suporte nativo para PWA
✅ **Analytics**: Google Analytics integrado
✅ **Performance**: Monitoramento automático
