const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação em todas as rotas (exceto rotas de teste)
router.use((req, res, next) => {
  if (req.path.startsWith('/test/')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// Listar transações
router.get('/', (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    type = 'all', 
    category_id, 
    member_id, 
    start_date, 
    end_date,
    search = ''
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (type !== 'all') {
    whereClause += ' AND t.type = ?';
    params.push(type);
  }
  
  if (category_id) {
    whereClause += ' AND t.category_id = ?';
    params.push(category_id);
  }
  
  if (member_id) {
    whereClause += ' AND t.member_id = ?';
    params.push(member_id);
  }
  
  if (start_date) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(end_date);
  }
  
  // Contar total de transações
  db.get(
    `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao contar transações' });
      }
      
      // Buscar transações com paginação
      db.all(
        `SELECT 
           t.*,
           c.name as category_name,
           c.color as category_color,
           m.name as member_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN members m ON t.member_id = m.id
         ${whereClause}
         ORDER BY t.transaction_date DESC, t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, transactions) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar transações' });
          }
          
          res.json({
            transactions,
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

// Obter transação por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT 
       t.*,
       c.name as category_name,
       c.color as category_color,
       m.name as member_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN members m ON t.member_id = m.id
     WHERE t.id = ?`,
    [id],
    (err, transaction) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar transação' });
      }
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      
      res.json(transaction);
    }
  );
});

// Criar nova transação
router.post('/', validateTransaction, (req, res) => {
  const {
    description,
    amount,
    type,
    category_id,
    member_id,
    transaction_date,
    payment_method,
    reference,
    notes
  } = req.body;
  
  db.run(
    `INSERT INTO transactions 
     (description, amount, type, category_id, member_id, transaction_date, 
      payment_method, reference, notes, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      description, 
      amount, 
      type, 
      category_id || null, 
      member_id || null, 
      transaction_date,
      payment_method || null, 
      reference || null, 
      notes || null,
      req.user.id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar transação' });
      }
      
      res.status(201).json({ 
        message: 'Transação criada com sucesso',
        id: this.lastID
      });
    }
  );
});

// Atualizar transação
router.put('/:id', validateTransaction, (req, res) => {
  const { id } = req.params;
  const {
    description,
    amount,
    type,
    category_id,
    member_id,
    transaction_date,
    payment_method,
    reference,
    notes
  } = req.body;
  
  db.run(
    `UPDATE transactions SET 
     description = ?, amount = ?, type = ?, category_id = ?, member_id = ?, 
     transaction_date = ?, payment_method = ?, reference = ?, notes = ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      description, 
      amount, 
      type, 
      category_id || null, 
      member_id || null, 
      transaction_date,
      payment_method || null, 
      reference || null, 
      notes || null,
      id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar transação' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      
      res.json({ message: 'Transação atualizada com sucesso' });
    }
  );
});

// Deletar transação
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM transactions WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar transação' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      
      res.json({ message: 'Transação deletada com sucesso' });
    }
  );
});

// Rota de teste temporária (sem autenticação)
router.get('/test/summary', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (start_date) {
    whereClause += ' AND transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND transaction_date <= ?';
    params.push(end_date);
  }
  
  db.all(
    `SELECT 
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM transactions 
     ${whereClause}
     GROUP BY type`,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar resumo' });
      }
      
      const summary = {
        income: { total: 0, count: 0 },
        expense: { total: 0, count: 0 },
        balance: 0
      };
      
      results.forEach(result => {
        summary[result.type] = {
          total: parseFloat(result.total),
          count: result.count
        };
      });

      summary.balance = summary.income.total - summary.expense.total;
      
      res.json({ data: summary });
    }
  );
});

// Obter resumo financeiro para o dashboard
router.get('/summary/overview', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (start_date) {
    whereClause += ' AND transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND transaction_date <= ?';
    params.push(end_date);
  }
  
  db.all(
    `SELECT 
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM transactions 
     ${whereClause}
     GROUP BY type`,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar resumo' });
      }
      
      const summary = {
        income: { total: 0, count: 0 },
        expense: { total: 0, count: 0 },
        balance: 0
      };
      
      results.forEach(result => {
        summary[result.type] = {
          total: parseFloat(result.total),
          count: result.count
        };
      });

      summary.balance = summary.income.total - summary.expense.total;
      
      res.json({ data: summary });
    }
  );
});

// Obter resumo financeiro
router.get('/summary', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (start_date) {
    whereClause += ' AND transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND transaction_date <= ?';
    params.push(end_date);
  }
  
  db.all(
    `SELECT 
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM transactions 
     ${whereClause}
     GROUP BY type`,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar resumo' });
      }
      
      const summary = {
        income: { total: 0, count: 0 },
        expense: { total: 0, count: 0 },
        balance: 0
      };
      
      results.forEach(result => {
        summary[result.type] = {
          total: parseFloat(result.total),
          count: result.count
        };
      });

      summary.balance = summary.income.total - summary.expense.total;
      
      res.json(summary);
    }
  );
});

// Obter transações por categoria
router.get('/summary/by-category', (req, res) => {
  const { type, start_date, end_date } = req.query;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (type) {
    whereClause += ' AND t.type = ?';
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
       c.color,
       COALESCE(SUM(t.amount), 0) as total,
       COUNT(t.id) as count
     FROM categories c
     LEFT JOIN transactions t ON c.id = t.category_id ${whereClause}
     GROUP BY c.id, c.name, c.color
     ORDER BY total DESC`,
    params,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar resumo por categoria' });
      }
      
      res.json(results);
    }
  );
});

// Obter fluxo de caixa mensal
router.get('/summary/cash-flow', (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  db.all(
    `SELECT 
       strftime('%m', transaction_date) as month,
       type,
       SUM(amount) as total
     FROM transactions 
     WHERE strftime('%Y', transaction_date) = ?
     GROUP BY strftime('%m', transaction_date), type
     ORDER BY month`,
    [year],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar fluxo de caixa' });
      }
      
      // Organizar dados por mês
      const monthlyData = {};
      
      for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        monthlyData[month] = {
          month: month,
          income: 0,
          expense: 0,
          balance: 0
        };
      }
      
      results.forEach(result => {
        const currentMonth = result.month;
        monthlyData[currentMonth][result.type] = parseFloat(result.total);
        monthlyData[currentMonth].balance = monthlyData[currentMonth].income - monthlyData[currentMonth].expense;
      });
      
      res.json(Object.values(monthlyData));
    }
  );
});

module.exports = router;