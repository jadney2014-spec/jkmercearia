# 🔐 Configuração do Usuário Admin no Firebase

## ⚠️ IMPORTANTE: Criar Usuário Admin

Para resolver o problema da tela em branco após o login, você precisa criar um usuário admin no Firebase Console:

### 📋 Passo a Passo:

1. **Acesse o Firebase Console**:
   ```
   https://console.firebase.google.com/
   ```

2. **Selecione seu projeto**:
   - Clique no projeto `igreja-contabilidade`

3. **Vá para Authentication**:
   - Menu lateral → **Authentication**
   - Clique em **"Começar"** se ainda não configurou

4. **Configurar Sign-in Method**:
   - Aba **"Sign-in method"**
   - Clique em **"Email/Password"**
   - Ative **"Email/Password"**
   - Clique **"Salvar"**

5. **Criar Usuário Admin**:
   - Aba **"Users"**
   - Clique **"Adicionar usuário"**
   - **Email**: `admin@igreja.com`
   - **Senha**: `admin123`
   - Clique **"Adicionar usuário"**

6. **Configurar Claims (Opcional)**:
   - Clique nos três pontos ao lado do usuário
   - **"Editar"**
   - Adicione campo personalizado:
     - **Campo**: `role`
     - **Valor**: `admin`

### 🔧 Configuração Adicional:

#### Domínios Autorizados:
1. **Authentication** → **Settings** → **Authorized domains**
2. Adicione seu domínio de produção:
   - `igreja-contabilidade.web.app`
   - `igreja-contabilidade.firebaseapp.com`
   - Seu domínio personalizado (se tiver)

#### Regras de Segurança Firestore:
As regras já estão configuradas em `firestore.rules` para permitir acesso baseado em autenticação.

### 🧪 Testar Login:

1. **Acesse**: `https://igreja-contabilidade.web.app/tesouraria/login`
2. **Use as credenciais**:
   - Email: `admin@igreja.com`
   - Senha: `admin123`
3. **Deve funcionar** e redirecionar para o dashboard

### 🚨 Se ainda não funcionar:

1. **Verifique o console do navegador** (F12)
2. **Procure por erros** relacionados ao Firebase
3. **Verifique se as variáveis de ambiente** estão corretas no arquivo `.env`
4. **Confirme se o projeto Firebase** está configurado corretamente

### 📱 URLs de Teste:

- **Login**: `https://igreja-contabilidade.web.app/tesouraria/login`
- **Dashboard**: `https://igreja-contabilidade.web.app/tesouraria/dashboard`
- **Site Público**: `https://igreja-contabilidade.web.app`

### 🔍 Debug:

Se ainda houver problemas, verifique:

1. **Console do navegador** para erros
2. **Network tab** para requisições falhando
3. **Firebase Console** → **Authentication** → **Users** para ver se o usuário foi criado
4. **Firebase Console** → **Functions** para ver se as functions estão deployadas

### ✅ Checklist:

- [ ] Usuário `admin@igreja.com` criado no Firebase
- [ ] Email/Password ativado no Authentication
- [ ] Domínios autorizados configurados
- [ ] Variáveis de ambiente corretas
- [ ] Functions deployadas
- [ ] Hosting deployado
- [ ] Teste de login funcionando
