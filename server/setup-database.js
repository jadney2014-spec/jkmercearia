const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Criar diretório do banco se não existir
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'igreja.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Configurando banco de dados...');

// Criar tabelas
db.serialize(() => {
  // Tabela de usuários/administradores
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de membros
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      birth_date DATE,
      member_since DATE,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de categorias
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de transações
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category_id INTEGER,
      member_id INTEGER,
      transaction_date DATE NOT NULL,
      payment_method TEXT,
      reference TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (member_id) REFERENCES members (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Tabela de configurações
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir usuário administrador padrão
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (username, email, password, role) 
    VALUES ('admin', 'admin@igreja.com', ?, 'admin')
  `, [adminPassword]);

  // Inserir configurações padrão
  const defaultSettings = [
    { key: 'church_name', value: 'Minha Igreja', description: 'Nome da igreja' },
    { key: 'church_address', value: '', description: 'Endereço da igreja' },
    { key: 'church_phone', value: '', description: 'Telefone da igreja' },
    { key: 'currency', value: 'BRL', description: 'Moeda utilizada' },
    { key: 'fiscal_year_start', value: '01-01', description: 'Início do ano fiscal (MM-DD)' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description) 
    VALUES (?, ?, ?)
  `);

  defaultSettings.forEach(setting => {
    insertSetting.run(setting.key, setting.value, setting.description);
  });

  insertSetting.finalize();

  console.log('✅ Banco de dados configurado com sucesso!');
  console.log('👤 Usuário padrão: admin / admin123');
  console.log('⚙️ Configurações iniciais definidas');
});

db.close((err) => {
  if (err) {
    console.error('❌ Erro ao fechar o banco de dados:', err.message);
  } else {
    console.log('🔒 Conexão com banco de dados fechada');
  }
});