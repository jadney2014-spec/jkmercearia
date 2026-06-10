# 📧 Configuração de Email - Firebase Functions

## Visão Geral

O formulário de contato agora está integrado com Firebase Functions para enviar emails automaticamente. A implementação inclui:

- ✅ Envio de email para a igreja (cresgate012@gmail.com)
- ✅ Email de confirmação para o usuário
- ✅ Salvamento no Firestore para histórico
- ✅ Fallback para mailto se o email não estiver configurado

## 📋 Pré-requisitos

1. Firebase Functions configurado
2. Conta de email (Gmail recomendado)
3. Senha de app do Gmail (se usar autenticação de 2 fatores)

## 🔧 Configuração

### 1. Configurar Senha de App do Gmail

Se você usa Gmail com autenticação de 2 fatores:

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Email" e "Outro (nome personalizado)"
3. Digite "Firebase Functions" e clique em "Gerar"
4. Copie a senha gerada (16 caracteres)

### 2. Configurar Variáveis de Ambiente

No Firebase Console:

1. Vá em **Functions** > **Configurações**
2. Clique em **Variáveis de ambiente**
3. Adicione as seguintes variáveis:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=cresgate012@gmail.com
SMTP_PASS=sua-senha-de-app-aqui
```

**OU** configure via Firebase CLI:

```bash
firebase functions:config:set \
  smtp.host="smtp.gmail.com" \
  smtp.port="587" \
  smtp.secure="false" \
  smtp.user="cresgate012@gmail.com" \
  smtp.pass="sua-senha-de-app-aqui"
```

### 3. Instalar Dependências

```bash
cd functions
npm install
```

### 4. Fazer Deploy da Function

```bash
# Compilar TypeScript
npm run build

# Fazer deploy
firebase deploy --only functions:sendContactEmail
```

## 🧪 Testar

1. Acesse o formulário de contato no site
2. Preencha e envie uma mensagem
3. Verifique se o email chegou em cresgate012@gmail.com
4. Verifique se o usuário recebeu email de confirmação

## 🔄 Fallback

Se o email não estiver configurado, a função:
1. Salva a mensagem no Firestore
2. Retorna sucesso para o usuário
3. Você pode acessar as mensagens no Firestore depois

## 📊 Visualizar Mensagens no Firestore

1. Acesse Firebase Console > Firestore Database
2. Procure pela coleção `contact_messages`
3. Veja todas as mensagens recebidas

## 🔒 Segurança

- ✅ Validação de campos no servidor
- ✅ Validação de formato de email
- ✅ CORS configurado
- ✅ Rate limiting (via Firebase)
- ✅ Senha de app (não senha principal)

## 🐛 Troubleshooting

### Erro: "Invalid login"
- Verifique se a senha de app está correta
- Certifique-se de usar senha de app, não senha normal

### Erro: "Connection timeout"
- Verifique se as portas não estão bloqueadas
- Tente usar porta 465 com SMTP_SECURE=true

### Email não chega
- Verifique a pasta de spam
- Verifique os logs do Firebase Functions
- Verifique se o Firestore está salvando (fallback)

## 📝 Estrutura do Email

**Para a igreja:**
- Assunto: "Contato do Site - [Nome]"
- Inclui: Nome, Email, Mensagem, Data

**Para o usuário:**
- Assunto: "Recebemos sua mensagem - Comunidade Cristã Resgate"
- Confirmação de recebimento

## 🚀 Próximos Passos

- [ ] Configurar filtros de spam
- [ ] Adicionar templates de email mais elaborados
- [ ] Integrar com sistema de tickets
- [ ] Adicionar notificações push para novos contatos

