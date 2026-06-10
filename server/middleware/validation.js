const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\(\)\-\+]+$/;
  return phoneRegex.test(phone);
};

const validateTransaction = (req, res, next) => {
  const { description, amount, type, transaction_date } = req.body;
  const errors = [];

  if (!description || description.trim().length < 3) {
    errors.push('Descrição deve ter pelo menos 3 caracteres');
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('Valor deve ser um número positivo');
  }

  if (!type || !['income', 'expense'].includes(type)) {
    errors.push('Tipo deve ser "income" ou "expense"');
  }

  if (!transaction_date) {
    errors.push('Data da transação é obrigatória');
  } else {
    const date = new Date(transaction_date);
    if (isNaN(date.getTime())) {
      errors.push('Data inválida');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateMember = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (email && !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (phone && !validatePhone(phone)) {
    errors.push('Telefone inválido');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateUser = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push('Username deve ter pelo menos 3 caracteres');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (!password || password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateCategory = (req, res, next) => {
  const { name, type } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Nome da categoria deve ter pelo menos 2 caracteres');
  }

  if (!type || !['income', 'expense'].includes(type)) {
    errors.push('Tipo deve ser "income" ou "expense"');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePhone,
  validateTransaction,
  validateMember,
  validateUser,
  validateCategory
};
