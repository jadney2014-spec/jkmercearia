const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar todas as categorias
router.get('/', (req, res) => {
  const { type } = req.query;
  
  let whereClause = '';
  let params = [];
  
  if (type) {
    whereClause = 'WHERE type = ?';
    params.push(type);
  }
  
  db.all(
    `SELECT 
       c.id,
       c.name,
       c.type,
       c.description,
       c.color,
       c.default_amount,
       c.created_at,
       c.updated_at,
       COUNT(t.id) as transaction_count,
       COALESCE(SUM(t.amount), 0) as total_amount
     FROM categories c
     LEFT JOIN transactions t ON c.id = t.category_id
     ${whereClause}
     GROUP BY c.id, c.name, c.type, c.description, c.color, c.default_amount, c.created_at, c.updated_at
     ORDER BY c.type, c.name`,
    params,
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar categorias' });
      }
      
      res.json(categories);
    }
  );
});

// Obter categoria por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT *, default_amount FROM categories WHERE id = ?', /* Adicionado default_amount */
    [id],
    (err, category) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar categoria' });
      }
      
      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json(category);
    }
  );
});

// Criar nova categoria
router.post('/', validateCategory, (req, res) => {
  const { name, type, description, color, default_amount } = req.body; /* Adicionado default_amount */
  
  // Verificar se já existe categoria com o mesmo nome e tipo
  db.get(
    'SELECT id FROM categories WHERE name = ? AND type = ?',
    [name, type],
    (err, existingCategory) => {
      if (err) {
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
      }
      
      // Inserir nova categoria
      db.run(
        'INSERT INTO categories (name, type, description, color, default_amount) VALUES (?, ?, ?, ?, ?)', /* Adicionado default_amount */
        [name, type, description || null, color || '#3B82F6', default_amount || 0], /* Adicionado default_amount */
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar categoria' });
          }
          
          res.status(201).json({ 
            message: 'Categoria criada com sucesso',
            id: this.lastID
          });
        }
      );
    }
  );
});

// Atualizar categoria
router.put('/:id', validateCategory, (req, res) => {
  const { id } = req.params;
  const { name, type, description, color, default_amount } = req.body; /* Adicionado default_amount */
  
  // Verificar se já existe outra categoria com o mesmo nome e tipo
  db.get(
    'SELECT id FROM categories WHERE name = ? AND type = ? AND id != ?',
    [name, type, id],
    (err, existingCategory) => {
      if (err) {
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome e tipo' });
      }
      
      // Atualizar categoria
      db.run(
        'UPDATE categories SET name = ?, type = ?, description = ?, color = ?, default_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', /* Adicionado default_amount */
        [name, type, description || null, color || '#3B82F6', default_amount || 0, id], /* Adicionado default_amount */
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar categoria' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
          }
          
          res.json({ message: 'Categoria atualizada com sucesso' });
        }
      );
    }
  );
});

// Deletar categoria
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar se a categoria tem transações associadas
  db.get(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar transações' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar categoria com transações associadas' 
        });
      }
      
      // Deletar categoria
      db.run(
        'DELETE FROM categories WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao deletar categoria' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
          }
          
          res.json({ message: 'Categoria deletada com sucesso' });
        }
      );
    }
  );
});

// Obter estatísticas das categorias
router.get('/stats/overview', (req, res) => {
  const { type, start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (type) {
    whereClause += ' AND c.type = ?';
    params.push(type);
  }
  
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
       c.id,
       c.name,
       c.type,
       c.color,
       c.default_amount, /* Adicionado */
       COUNT(t.id) as transaction_count,
       COALESCE(SUM(t.amount), 0) as total_amount,
       COALESCE(AVG(t.amount), 0) as average_amount
     FROM categories c
     LEFT JOIN transactions t ON c.id = t.category_id ${whereClause}
     GROUP BY c.id, c.name, c.type, c.color
     ORDER BY total_amount DESC`,
    params,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }
      
      res.json(stats);
    }
  );
});

module.exports = router;
