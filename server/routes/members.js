const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateMember } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação em todas as rotas (exceto rotas de teste)
router.use((req, res, next) => {
  if (req.path.startsWith('/test/')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// Listar todos os membros
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  // Contar total de membros
  db.get(
    `SELECT COUNT(*) as total FROM members ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao contar membros' });
      }
      
      // Buscar membros com paginação
      db.all(
        `SELECT * FROM members ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, members) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar membros' });
          }
          
          res.json({
            members,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: countResult.total,
              pages: Math.ceil(countResult.total / limit)
            }
          });
        }
      );
    }
  );
});

// Obter membro por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT * FROM members WHERE id = ?',
    [id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar membro' });
      }
      
      if (!member) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }
      
      res.json(member);
    }
  );
});

// Criar novo membro
router.post('/', validateMember, (req, res) => {
  const { name, email, phone, address, birth_date, member_since, status, notes } = req.body;
  
  db.run(
    `INSERT INTO members (name, email, phone, address, birth_date, member_since, status, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, birth_date, member_since, status || 'active', notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar membro' });
      }
      
      res.status(201).json({ 
        message: 'Membro criado com sucesso',
        id: this.lastID
      });
    }
  );
});

// Atualizar membro
router.put('/:id', validateMember, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, birth_date, member_since, status, notes } = req.body;
  
  db.run(
    `UPDATE members SET 
     name = ?, email = ?, phone = ?, address = ?, birth_date = ?, 
     member_since = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, email, phone, address, birth_date, member_since, status, notes, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar membro' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }
      
      res.json({ message: 'Membro atualizado com sucesso' });
    }
  );
});

// Deletar membro
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar se o membro tem transações associadas
  db.get(
    'SELECT COUNT(*) as count FROM transactions WHERE member_id = ?',
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar transações' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar membro com transações associadas' 
        });
      }
      
      // Deletar membro
      db.run(
        'DELETE FROM members WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao deletar membro' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Membro não encontrado' });
          }
          
          res.json({ message: 'Membro deletado com sucesso' });
        }
      );
    }
  );
});

// Rota de teste temporária (sem autenticação)
router.get('/test/stats', (req, res) => {
  db.all(
    `SELECT 
       status,
       COUNT(*) as count
     FROM members 
     GROUP BY status`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }
      
      const overview = {
        total: 0,
        active: 0,
        inactive: 0
      };
      
      stats.forEach(stat => {
        overview.total += stat.count;
        overview[stat.status] = stat.count;
      });
      
      res.json({ data: overview });
    }
  );
});

// Obter estatísticas dos membros
router.get('/stats/overview', (req, res) => {
  db.all(
    `SELECT 
       status,
       COUNT(*) as count
     FROM members 
     GROUP BY status`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }
      
      const overview = {
        total: 0,
        active: 0,
        inactive: 0
      };
      
      stats.forEach(stat => {
        overview.total += stat.count;
        overview[stat.status] = stat.count;
      });
      
      res.json({ data: overview });
    }
  );
});

// Obter histórico de contribuições de um membro
router.get('/:id/contributions', (req, res) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE t.member_id = ? AND t.type = "income"';
  let params = [id];
  
  if (start_date) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(end_date);
  }
  
  db.all(
    `SELECT 
       t.*,
       c.name as category_name,
       c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ${whereClause}
     ORDER BY t.transaction_date DESC`,
    params,
    (err, contributions) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar contribuições' });
      }
      
      res.json(contributions);
    }
  );
});

module.exports = router;