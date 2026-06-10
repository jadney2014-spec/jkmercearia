# 🚀 Deploy Git → Firebase: Passo a Passo Completo

## 📋 Pré-requisitos
- Conta Google (para Firebase)
- Git instalado
- Node.js instalado
- Projeto no GitHub/GitLab

---

## 🔥 PASSO 1: Criar Projeto no Firebase Console

### 1.1 Acessar Firebase Console
```
https://console.firebase.google.com/
```

### 1.2 Criar Novo Projeto
1. Clique em **"Criar um projeto"**
2. **Nome do projeto**: `igreja-contabilidade` (ou seu nome)
3. **Google Analytics**: Ativar (recomendado)
4. **Região**: Escolha mais próxima (us-east1 para Brasil)

### 1.3 Configurar Serviços
1. **Authentication** → "Começar" → "Email/Password" → Ativar
2. **Firestore Database** → "Criar banco" → Modo produção → Localização
3. **Hosting** → "Começar"
4. **Functions** → "Começar"

---

## 🛠️ PASSO 2: Instalar Firebase CLI

### 2.1 Instalar Globalmente
```bash
npm install -g firebase-tools
```

### 2.2 Verificar Instalação
```bash
firebase --version
```

### 2.3 Fazer Login
```bash
firebase login
```
- Abrirá o navegador para autenticação
- Autorize o Firebase CLI

---

## 📥 PASSO 3: Clonar Repositório

### 3.1 Clonar do Git
```bash
# Substitua pela URL do seu repositório
git clone https://github.com/seu-usuario/igreja-contabilidade.git
cd igreja-contabilidade
```

### 3.2 Verificar Estrutura
```bash
# Deve ter estas pastas:
ls
# client/ functions/ firebase.json firestore.rules
```

---

## ⚙️ PASSO 4: Configurar Firebase no Projeto

### 4.1 Inicializar Firebase
```bash
firebase init
```

### 4.2 Selecionar Serviços
```
? Which Firebase features do you want to set up?
  ◉ Hosting: Configure files for Firebase Hosting
  ◉ Functions: Configure a Cloud Functions directory
  ◉ Firestore: Configure security rules and indexes files
```

### 4.3 Configurações
```
? Please select an option: Use an existing project
? Select a default Firebase project: igreja-contabilidade
? What do you want to use as your public directory? client/build
? Configure as a single-page app? Yes
? Set up automatic builds and deploys with GitHub? No
? File client/build/index.html already exists. Overwrite? No
? What language would you like to use to write Cloud Functions? TypeScript
? Do you want to use ESLint to catch probable bugs? Yes
? File functions/package.json already exists. Overwrite? No
? Do you want to install dependencies now? Yes
```

---

## 🔧 PASSO 5: Configurar Variáveis de Ambiente

### 5.1 Obter Configurações do Firebase
1. Firebase Console → **Configurações do projeto** (ícone engrenagem)
2. **Seus aplicativos** → **Adicionar aplicativo** → **Web**
3. **Nome do app**: `igreja-contabilidade-web`
4. **Copiar configurações**

### 5.2 Criar Arquivo .env
```bash
cd client
```

Criar arquivo `.env`:
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

### 5.3 Configurar Firebase Functions
```bash
cd functions
```

Editar `functions/src/index.ts` com suas configurações específicas.

---

## 🏗️ PASSO 6: Build e Deploy

### 6.1 Instalar Dependências
```bash
# Na raiz do projeto
npm install
cd client && npm install
cd ../functions && npm install
cd ..
```

### 6.2 Build do Frontend
```bash
cd client
npm run build
cd ..
```

### 6.3 Deploy das Functions
```bash
firebase deploy --only functions
```

### 6.4 Deploy do Hosting
```bash
firebase deploy --only hosting
```

### 6.5 Deploy Completo
```bash
firebase deploy
```

---

## 🌐 PASSO 7: Configurar Domínio Personalizado (Opcional)

### 7.1 Firebase Console
1. **Hosting** → **Adicionar domínio personalizado**
2. Digite seu domínio: `contabilidade.igreja.com`
3. Siga as instruções de DNS

### 7.2 Configurar DNS
```
Tipo: A
Nome: @
Valor: 151.101.1.195

Tipo: CNAME
Nome: www
Valor: igreja-contabilidade.web.app
```

---

## 🔐 PASSO 8: Configurar Authentication

### 8.1 Firebase Console
1. **Authentication** → **Sign-in method**
2. **Email/Password** → Ativar
3. **Domínios autorizados** → Adicionar seu domínio

### 8.2 Criar Usuário Admin
1. **Authentication** → **Users**
2. **Adicionar usuário**
3. **Email**: admin@igreja.com
4. **Senha**: admin123

---

## 📊 PASSO 9: Configurar Firestore

### 9.1 Criar Coleções
```javascript
// Coleções necessárias:
- users (usuários)
- members (membros)
- transactions (transações)
- categories (categorias)
- reports (relatórios)
- cellGroups (células)
```

### 9.2 Configurar Regras
As regras já estão em `firestore.rules` - serão aplicadas automaticamente.

---

## ✅ PASSO 10: Testar Deploy

### 10.1 URLs de Produção
- **Frontend**: https://igreja-contabilidade.web.app
- **Functions**: https://us-central1-igreja-contabilidade.cloudfunctions.net
- **Admin**: https://igreja-contabilidade.web.app/tesouraria/login

### 10.2 Credenciais de Teste
- **Email**: admin@igreja.com
- **Senha**: admin123

---

## 🔄 PASSO 11: Deploy Automático (Opcional)

### 11.1 GitHub Actions
Criar `.github/workflows/firebase-deploy.yml`:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm install
    - run: cd client && npm install && npm run build
    - uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: igreja-contabilidade
```

---

## 🎯 Resumo dos Comandos

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Clonar projeto
git clone https://github.com/seu-usuario/igreja-contabilidade.git
cd igreja-contabilidade

# 4. Inicializar Firebase
firebase init

# 5. Instalar dependências
npm install
cd client && npm install
cd ../functions && npm install
cd ..

# 6. Build e Deploy
cd client && npm run build && cd ..
firebase deploy
```

## 🚨 Troubleshooting

### Erro de Build
```bash
# Limpar cache
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de Functions
```bash
# Reinstalar dependências
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..
firebase deploy --only functions
```

### Erro de Permissão
```bash
# Verificar login
firebase login --reauth
```

---

## 🎉 Pronto!

Seu sistema estará disponível em:
- **Site**: https://igreja-contabilidade.web.app
- **Admin**: https://igreja-contabilidade.web.app/tesouraria/login

**Credenciais**: admin@igreja.com / admin123
