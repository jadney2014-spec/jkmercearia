# 🚀 Guia de Instalação - Sistema de Contabilidade para Igrejas

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior) - [Download aqui](https://nodejs.org/)
- **npm** (vem com o Node.js)
- **Git** (opcional) - [Download aqui](https://git-scm.com/)

## 🛠️ Instalação

### 1. Clone o repositório (se usando Git)
```bash
git clone <url-do-repositorio>
cd contabilidade
```

### 2. Instale as dependências do servidor
```bash
npm install
```

### 3. Instale as dependências do cliente
```bash
cd client
npm install
cd ..
```

### 4. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
# (opcional - pode usar os valores padrão)
```

### 5. Configure o banco de dados
```bash
npm run setup-db
```

Este comando irá:
- Criar o banco de dados SQLite
- Criar todas as tabelas necessárias
- Inserir categorias padrão
- Criar usuário administrador padrão

## 🚀 Executando o Sistema

### Desenvolvimento (Recomendado)
```bash
npm run dev
```

Este comando irá iniciar:
- Servidor backend na porta 5000
- Cliente frontend na porta 3000

### Produção
```bash
# Primeiro, construa o frontend
npm run build

# Depois, inicie apenas o servidor
npm run server
```

## 🌐 Acessando o Sistema

1. Abra seu navegador
2. Acesse: `http://localhost:3000`
3. Use as credenciais padrão:
   - **Usuário:** admin
   - **Senha:** admin123

## 📱 Funcionalidades Principais

### 💰 Gestão Financeira
- ✅ Cadastro de receitas e despesas
- ✅ Categorização de transações
- ✅ Relatórios mensais e anuais
- ✅ Dashboard com resumo financeiro

### 👥 Gestão de Membros
- ✅ Cadastro completo de membros
- ✅ Histórico de contribuições
- ✅ Relatórios de contribuintes

### 📊 Relatórios
- ✅ Balanço mensal e anual
- ✅ Relatórios por categoria
- ✅ Fluxo de caixa
- ✅ Contribuições por membro

### 🔐 Segurança
- ✅ Sistema de login seguro
- ✅ Senhas criptografadas
- ✅ Sessões JWT

## 🗄️ Estrutura do Banco de Dados

O sistema usa SQLite com as seguintes tabelas:
- `users` - Usuários do sistema
- `members` - Membros da igreja
- `categories` - Categorias de receitas/despesas
- `transactions` - Transações financeiras
- `settings` - Configurações do sistema

## 🔧 Configurações Avançadas

### Alterando a Porta do Servidor
Edite o arquivo `.env`:
```
PORT=5000
```

### Alterando a Chave JWT
Edite o arquivo `.env`:
```
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
```

### Backup do Banco de Dados
O banco de dados fica em: `./database/igreja.db`

Para fazer backup, simplesmente copie este arquivo.

## 🐛 Solução de Problemas

### Erro de Porta em Uso
```bash
# No Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# No Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro de Dependências
```bash
# Limpe o cache e reinstale
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Banco de Dados Corrompido
```bash
# Delete o banco e recrie
rm -rf database/
npm run setup-db
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se as portas 3000 e 5000 estão livres
3. Verifique os logs no terminal para erros específicos
4. Certifique-se de que o Node.js está na versão 16+

## 🎯 Próximos Passos

Após a instalação:

1. **Altere a senha padrão** do administrador
2. **Configure as categorias** conforme sua igreja
3. **Cadastre os membros** da igreja
4. **Comece a registrar** as transações financeiras
5. **Explore os relatórios** para análise dos dados

## 🔄 Atualizações

Para atualizar o sistema:
```bash
git pull origin main
npm install
cd client && npm install && cd ..
npm run build
```

---

**🎉 Parabéns! Seu sistema de contabilidade para igreja está pronto para uso!**
