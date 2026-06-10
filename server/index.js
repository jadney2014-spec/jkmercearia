const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET não configurado! Configure a variável de ambiente.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// Configurar Express para confiar em cabeçalhos de proxy
app.set('trust proxy', 1);

// Middleware de segurança
app.use(helmet());

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por IP
  message: 'Muitas tentativas de acesso. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por IP
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para criação de dados
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 criações por IP
  message: 'Muitas tentativas de criação. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kaleidoscopic-arithmetic-e795e1.netlify.app',
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    // Verificar se a origem está permitida
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API com rate limits específicos
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/members', createLimiter);
app.use('/api/transactions', createLimiter);
app.use('/api/categories', createLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
