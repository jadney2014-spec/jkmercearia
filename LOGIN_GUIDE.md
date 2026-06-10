# Configuração de Ambiente para Desenvolvimento

## Para desenvolvimento local:
Crie um arquivo `.env` na pasta `client/` com:

```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
```

## Para produção (Netlify/Vercel):
Configure as variáveis de ambiente nas plataformas:

### Netlify:
- Site Settings → Environment Variables
- Adicione: `REACT_APP_API_URL` = `https://seu-backend-url.com/api`

### Vercel:
- Project Settings → Environment Variables  
- Adicione: `REACT_APP_API_URL` = `https://seu-backend-url.com/api`

## Credenciais de Login:

### Usuário Administrador:
- **Username**: `admin`
- **Senha**: `admin123`

### Outros usuários disponíveis:
- **Username**: `tesoureiro` | **Senha**: `password123`
- **Username**: `secretario` | **Senha**: `password123`

## Como testar:

1. **Desenvolvimento local:**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend  
   cd client && npm start
   ```

2. **Acesse**: `http://localhost:3000/tesouraria/login`

3. **Use as credenciais**: `admin` / `admin123`
