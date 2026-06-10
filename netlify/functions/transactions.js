// Function para buscar transações
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDW73K6vb7RMdyfsJ6JVzzm1r3sULs4ceY",
  authDomain: "comunidaderesgate-82655.firebaseapp.com",
  projectId: "comunidaderesgate-82655",
  storageBucket: "comunidaderesgate-82655.firebasestorage.app",
  messagingSenderId: "587928941365",
  appId: "1:587928941365:web:b788b8c9acf0a20992d27c",
  measurementId: "G-485FKRFYHE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

exports.handler = async (event, context) => {
  console.log('💰 Transactions function chamada:', event.httpMethod);
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Lidar com preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Lidar com diferentes métodos HTTP
    if (event.httpMethod === 'GET') {
      console.log('📊 Buscando transações do Firestore...');
      
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      
      const transactions = [];
      snapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${transactions.length} transações encontradas`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          transactions,
          total: transactions.length
        })
      };
    }

    // Lidar com criação de transações (POST)
    if (event.httpMethod === 'POST') {
      console.log('💾 Criando nova transação no Firestore...');
      
      const body = JSON.parse(event.body || '{}');
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
      } = body;

      // Validação básica
      if (!description || !amount || !type || !transaction_date) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Campos obrigatórios: description, amount, type, transaction_date' 
          })
        };
      }

      // Preparar dados para o Firestore
      const transactionData = {
        description,
        amount: parseFloat(amount),
        type,
        category_id: category_id || null,
        member_id: member_id || null,
        transaction_date,
        payment_method: payment_method || null,
        reference: reference || null,
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Salvar no Firestore
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, transactionData);

      console.log('✅ Transação salva no Firestore com ID:', docRef.id);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Transação criada com sucesso',
          transaction: {
            id: docRef.id,
            ...transactionData
          }
        })
      };
    }

    // Método não suportado
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('❌ Erro na function transactions:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  }
};
