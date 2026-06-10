
const db = require('./database');
const { hashPassword } = require('./middleware/auth');

const seedDatabase = async () => {
  console.log('Iniciando o povoamento do banco de dados...');

  try {
    // Limpar tabelas
    await new Promise((resolve, reject) => db.run('DELETE FROM transactions', [], (err) => (err ? reject(err) : resolve())));
    await new Promise((resolve, reject) => db.run('DELETE FROM users', [], (err) => (err ? reject(err) : resolve())));
    await new Promise((resolve, reject) => db.run('DELETE FROM categories', [], (err) => (err ? reject(err) : resolve())));
    await new Promise((resolve, reject) => db.run('DELETE FROM members', [], (err) => (err ? reject(err) : resolve())));
    console.log('Tabelas limpas com sucesso.');

    // Inserir usuários
    const users = [
      { username: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
      { username: 'tesoureiro', email: 'tesoureiro@example.com', password: 'password123', role: 'treasurer' },
      { username: 'secretario', email: 'secretario@example.com', password: 'password123', role: 'secretary' },
      { username: 'usuario1', email: 'usuario1@example.com', password: 'password123', role: 'member' },
      { username: 'usuario2', email: 'usuario2@example.com', password: 'password123', role: 'member' },
      { username: 'usuario3', email: 'usuario3@example.com', password: 'password123', role: 'member' },
      { username: 'usuario4', email: 'usuario4@example.com', password: 'password123', role: 'member' },
      { username: 'usuario5', email: 'usuario5@example.com', password: 'password123', role: 'member' },
      { username: 'usuario6', email: 'usuario6@example.com', password: 'password123', role: 'member' },
      { username: 'usuario7', email: 'usuario7@example.com', password: 'password123', role: 'member' },
      { username: 'usuario8', email: 'usuario8@example.com', password: 'password123', role: 'member' },
      { username: 'usuario9', email: 'usuario9@example.com', password: 'password123', role: 'member' },
      { username: 'usuario10', email: 'usuario10@example.com', password: 'password123', role: 'member' },
    ];

    for (const user of users) {
      const hashedPassword = await hashPassword(user.password);
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [user.username, user.email, hashedPassword, user.role],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    console.log('Usuários inseridos com sucesso.');

    // Inserir categorias
    const categories = [
      { name: 'Dízimos', type: 'income', description: 'Dízimos entregues pelos membros' },
      { name: 'Ofertas', type: 'income', description: 'Ofertas gerais' },
      { name: 'Aluguel', type: 'expense', description: 'Pagamento do aluguel do prédio' },
      { name: 'Contas', type: 'expense', description: 'Água, luz, internet, etc.' },
      { name: 'Doações', type: 'income', description: 'Doações diversas' },
      { name: 'Salários', type: 'expense', description: 'Pagamento de funcionários' },
      { name: 'Eventos', type: 'income', description: 'Arrecadação de eventos' },
      { name: 'Manutenção', type: 'expense', description: 'Manutenção do templo' },
    ];

    for (const category of categories) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO categories (name, type, description) VALUES (?, ?, ?)',
          [category.name, category.type, category.description],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    console.log('Categorias inseridas com sucesso.');

    // Inserir membros
    const members = [
      { name: 'João da Silva', email: 'joao@example.com', phone: '11999999999', address: 'Rua A, 123', birth_date: '1990-01-15', member_since: '2020-03-10' },
      { name: 'Maria Oliveira', email: 'maria@example.com', phone: '11888888888', address: 'Rua B, 456', birth_date: '1985-05-20', member_since: '2019-11-22' },
      { name: 'Pedro Souza', email: 'pedro@example.com', phone: '11777777777', address: 'Rua C, 789', birth_date: '1992-07-01', member_since: '2021-01-05' },
      { name: 'Ana Costa', email: 'ana@example.com', phone: '11666666666', address: 'Rua D, 101', birth_date: '1988-02-28', member_since: '2018-06-18' },
      { name: 'Carlos Pereira', email: 'carlos@example.com', phone: '11555555555', address: 'Rua E, 202', birth_date: '1975-11-11', member_since: '2015-09-01' },
    ];

    for (const member of members) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO members (name, email, phone, address, birth_date, member_since) VALUES (?, ?, ?, ?, ?, ?)',
          [member.name, member.email, member.phone, member.address, member.birth_date, member.member_since],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    console.log('Membros inseridos com sucesso.');

    // Inserir transações
    const transactions = [
      { description: 'Dízimo do João', amount: 500, type: 'income', category_id: 1, member_id: 1, transaction_date: '2023-10-01' },
      { description: 'Oferta da Maria', amount: 100, type: 'income', category_id: 2, member_id: 2, transaction_date: '2023-10-05' },
      { description: 'Pagamento do aluguel', amount: 1200, type: 'expense', category_id: 3, transaction_date: '2023-10-10' },
      { description: 'Conta de luz', amount: 250, type: 'expense', category_id: 4, transaction_date: '2023-10-15' },
      { description: 'Doação de Evento', amount: 300, type: 'income', category_id: 5, member_id: 3, transaction_date: '2023-10-20' },
      { description: 'Salário Pastor', amount: 2000, type: 'expense', category_id: 6, transaction_date: '2023-10-25' },
      { description: 'Oferta de Gratidão', amount: 150, type: 'income', category_id: 2, member_id: 4, transaction_date: '2023-11-01' },
      { description: 'Manutenção Elétrica', amount: 400, type: 'expense', category_id: 8, transaction_date: '2023-11-05' },
      { description: 'Dízimo do Pedro', amount: 700, type: 'income', category_id: 1, member_id: 3, transaction_date: '2023-11-10' },
      { description: 'Venda de Livros', amount: 200, type: 'income', category_id: 7, transaction_date: '2023-11-15' },
    ];

    for (const transaction of transactions) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO transactions (description, amount, type, category_id, member_id, transaction_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [transaction.description, transaction.amount, transaction.type, transaction.category_id, transaction.member_id, transaction.transaction_date, 1],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    console.log('Transações inseridas com sucesso.');

    console.log('Banco de dados povoado com sucesso!');
  } catch (error) {
    console.error('Erro ao povoar o banco de dados:', error);
  } finally {
    db.close();
  }
};

// Chamar a função para popular o banco de dados
seedDatabase();
