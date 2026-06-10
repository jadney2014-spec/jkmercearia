const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Middleware para todas as rotas deste arquivo: requer autenticação e papel de 'admin'
router.use(authenticateToken, requireRole(['admin']));

// Rota para listar todos os usuários
router.get('/', (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar usuários', details: err.message });
    }
    res.json(rows);
  });
});

// Rota para criar um novo usuário
router.post('/', (req, res) => {
  const { username, email, password, role = 'admin' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Nome de usuário, email e senha são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
  db.run(sql, [username, email, hashedPassword, role], function(err) {
    if (err) {
      // Trata erro de unicidade
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Nome de usuário ou email já cadastrado.' });
      }
      return res.status(500).json({ error: 'Erro ao criar usuário', details: err.message });
    }
    
    // Retorna o usuário recém-criado (sem a senha)
    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuário recém-criado' });
      }
      res.status(201).json(row);
    });
  });
});

// Rota para deletar um usuário
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.id; // ID do usuário autenticado

  if (parseInt(id) === requestingUserId) {
    return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário.' });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar usuário', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json({ message: 'Usuário deletado com sucesso.' });
  });
});

module.exports = router;
