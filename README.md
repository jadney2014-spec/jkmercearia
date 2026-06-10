# Sistema de Contabilidade para Igreja

## 📋 Visão Geral
Sistema web completo para controle financeiro de igrejas, permitindo acesso via internet a qualquer momento.

## 🎯 Funcionalidades Principais

### 💰 Gestão Financeira
- **Receitas**: Dízimos, ofertas, eventos, doações
- **Despesas**: Aluguel, salários, manutenção, eventos
- **Relatórios**: Balanços mensais, anuais, fluxo de caixa
- **Categorização**: Organização por categorias e subcategorias

### 👥 Gestão de Membros
- **Cadastro**: Dados pessoais e de contato
- **Contribuições**: Histórico de dízimos e ofertas
- **Relatórios**: Lista de contribuintes e valores

### 📊 Dashboard e Relatórios
- **Visão Geral**: Resumo financeiro atual
- **Gráficos**: Visualizações de receitas vs despesas
- **Exportação**: Relatórios em PDF e Excel
- **Filtros**: Por período, categoria, membro

### 🔐 Segurança e Acesso
- **Login**: Sistema de autenticação seguro
- **Permissões**: Diferentes níveis de acesso
- **Backup**: Salvamento automático dos dados

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React.js com TypeScript
- **Backend**: Node.js com Express
- **Banco de Dados**: SQLite (fácil de configurar)
- **Estilização**: Tailwind CSS
- **Autenticação**: JWT

## 🚀 Como Executar
1. Instalar dependências: `npm install`
2. Configurar banco de dados: `npm run setup-db`
3. Iniciar servidor: `npm run dev`
4. Acessar: `http://localhost:3000`

## 📱 Responsivo
Interface adaptada para desktop, tablet e mobile.

## 🔒 Segurança
- Senhas criptografadas
- Sessões seguras
- Validação de dados
- Backup automático

## 📁 Estrutura Atual
- `client/`: código ativo da aplicação (React + TypeScript).
- `contabilidade/`: snapshot legado mantido apenas como referência. Consulte `docs/STRUCTURE.md` para o plano de consolidação e evite modificar essa pasta.

## 📝 Observabilidade e Logs
- Logs de console são suprimidos automaticamente em produção para evitar vazamentos.
- Defina `REACT_APP_ENABLE_LOGS=true` no `.env` para reativar logs locais quando necessário.
- Utilize o helper `logger` (`client/src/utils/logger.ts`) para mensagens estruturadas.

## 💾 Armazenamento Local
- Toda leitura/escrita em `localStorage` deve usar `client/src/utils/storage.ts`, garantindo fallback seguro em ambientes sem `window`.