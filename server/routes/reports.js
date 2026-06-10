const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Relatório de balanço mensal
router.get('/monthly-balance', (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
  }
  
  db.all(
    `SELECT 
       type,
       SUM(amount) as total,
       COUNT(*) as count
     FROM transactions 
     WHERE strftime('%Y', transaction_date) = ? 
       AND strftime('%m', transaction_date) = ?
     GROUP BY type`,
    [year, month],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      const balance = {
        income: { total: 0, count: 0 },
        expense: { total: 0, count: 0 },
        balance: 0,
        period: { year, month }
      };
      
      results.forEach(result => {
        balance[result.type] = {
          total: parseFloat(result.total),
          count: result.count
        };
      });
      
      balance.balance = balance.income.total - balance.expense.total;
      
      res.json(balance);
    }
  );
});

// Relatório de balanço anual
router.get('/yearly-balance', (req, res) => {
  const { year } = req.query;
  
  if (!year) {
    return res.status(400).json({ error: 'Ano é obrigatório' });
  }
  
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
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      // Organizar dados por mês
      const monthlyData = {};
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        monthlyData[month] = {
          month: month,
          monthName: monthNames[i - 1],
          income: 0,
          expense: 0,
          balance: 0
        };
      }
      
      results.forEach(result => {
        const month = result.month;
        monthlyData[month][result.type] = parseFloat(result.total);
        monthlyData[month].balance = monthlyData[month].income - monthlyData[month].expense;
      });
      
      const yearlyTotal = {
        income: 0,
        expense: 0,
        balance: 0
      };
      
      Object.values(monthlyData).forEach(month => {
        yearlyTotal.income += month.income;
        yearlyTotal.expense += month.expense;
        yearlyTotal.balance += month.balance;
      });
      
      res.json({
        year: parseInt(year),
        monthlyData: Object.values(monthlyData),
        yearlyTotal
      });
    }
  );
});

// Relatório de contribuições por membro
router.get('/member-contributions', (req, res) => {
  const { start_date, end_date, member_id } = req.query;
  
  let whereClause = 'WHERE t.type = "income"';
  let params = [];
  
  if (start_date) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(end_date);
  }
  
  if (member_id) {
    whereClause += ' AND t.member_id = ?';
    params.push(member_id);
  }
  
  db.all(
    `SELECT 
       m.id,
       m.name,
       m.email,
       COUNT(t.id) as contribution_count,
       COALESCE(SUM(t.amount), 0) as total_contributed,
       COALESCE(AVG(t.amount), 0) as average_contribution,
       MIN(t.transaction_date) as first_contribution,
       MAX(t.transaction_date) as last_contribution
     FROM members m
     LEFT JOIN transactions t ON m.id = t.member_id
     ${whereClause}
     GROUP BY m.id, m.name, m.email
     HAVING contribution_count > 0
     ORDER BY total_contributed DESC`,
    params,
    (err, contributions) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      res.json(contributions);
    }
  );
});

// Relatório de receitas por categoria
router.get('/income-by-category', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE c.type = "income"';
  let params = [];
  
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
       COUNT(t.id) as transaction_count,
       COALESCE(SUM(t.amount), 0) as total_amount,
       COALESCE(AVG(t.amount), 0) as average_amount
     FROM categories c
     LEFT JOIN transactions t ON c.id = t.category_id
     ${whereClause}
     GROUP BY c.id, c.name, c.color
     ORDER BY total_amount DESC`,
    params,
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      res.json(categories);
    }
  );
});

// Relatório de despesas por categoria
router.get('/expense-by-category', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let whereClause = 'WHERE c.type = "expense"';
  let params = [];
  
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
       COUNT(t.id) as transaction_count,
       COALESCE(SUM(t.amount), 0) as total_amount,
       COALESCE(AVG(t.amount), 0) as average_amount
     FROM categories c
     LEFT JOIN transactions t ON c.id = t.category_id
     ${whereClause}
     GROUP BY c.id, c.name, c.color
     ORDER BY total_amount DESC`,
    params,
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      res.json(categories);
    }
  );
});

// Relatório de fluxo de caixa
router.get('/cash-flow', (req, res) => {
  const { start_date, end_date, period = 'monthly' } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
  }
  
  let groupByClause = '';
  let orderByClause = '';
  
  switch (period) {
    case 'daily':
      groupByClause = 'strftime("%Y-%m-%d", transaction_date)';
      orderByClause = 'strftime("%Y-%m-%d", transaction_date)';
      break;
    case 'weekly':
      groupByClause = 'strftime("%Y-W%W", transaction_date)';
      orderByClause = 'strftime("%Y-W%W", transaction_date)';
      break;
    case 'monthly':
    default:
      groupByClause = 'strftime("%Y-%m", transaction_date)';
      orderByClause = 'strftime("%Y-%m", transaction_date)';
      break;
  }
  
  db.all(
    `SELECT 
       ${groupByClause} as period,
       type,
       SUM(amount) as total
     FROM transactions 
     WHERE transaction_date >= ? AND transaction_date <= ?
     GROUP BY ${groupByClause}, type
     ORDER BY ${orderByClause}`,
    [start_date, end_date],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      // Organizar dados por período
      const periodData = {};
      
      results.forEach(result => {
        if (!periodData[result.period]) {
          periodData[result.period] = {
            period: result.period,
            income: 0,
            expense: 0,
            balance: 0
          };
        }
        
        periodData[result.period][result.type] = parseFloat(result.total);
        periodData[result.period].balance = 
          periodData[result.period].income - periodData[result.period].expense;
      });
      
      res.json(Object.values(periodData));
    }
  );
});

// Relatório de top contribuintes
router.get('/top-contributors', (req, res) => {
  const { start_date, end_date, limit = 10 } = req.query;
  
  let whereClause = 'WHERE t.type = "income"';
  let params = [];
  
  if (start_date) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(end_date);
  }
  
  params.push(parseInt(limit));
  
  db.all(
    `SELECT 
       m.id,
       m.name,
       m.email,
       COUNT(t.id) as contribution_count,
       COALESCE(SUM(t.amount), 0) as total_contributed,
       COALESCE(AVG(t.amount), 0) as average_contribution,
       MIN(t.transaction_date) as first_contribution,
       MAX(t.transaction_date) as last_contribution
     FROM members m
     INNER JOIN transactions t ON m.id = t.member_id
     ${whereClause}
     GROUP BY m.id, m.name, m.email
     ORDER BY total_contributed DESC
     LIMIT ?`,
    params,
    (err, contributors) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
      
      res.json(contributors);
    }
  );
});

module.exports = router;