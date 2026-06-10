const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    // Verificar se o usuário ainda existe no banco
    db.get(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [user.id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao verificar usuário' });
        }
        
        if (!row) {
          return res.status(403).json({ error: 'Usuário não encontrado' });
        }
        
        req.user = row;
        next();
      }
    );
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }
    
    next();
  };
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

module.exports = {
  authenticateToken,
  requireRole,
  hashPassword
};
