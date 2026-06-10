// Function para buscar categorias
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } = require('firebase/firestore');

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
  console.log('🏷️ Categories function chamada:', event.httpMethod);
  
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
    if (event.httpMethod === 'GET') {
      console.log('📊 Buscando categorias do Firestore...');
      
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      
      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ ${categories.length} categorias encontradas`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          categories,
          total: categories.length
        })
      };
    }

    if (event.httpMethod === 'POST') {
      console.log('💾 Criando nova categoria no Firestore...');
      
      const body = JSON.parse(event.body || '{}');
      const { 
        name, 
        type, 
        description, 
        color 
      } = body;

      // Validação básica
      if (!name || !type) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Campos obrigatórios: name, type' 
          })
        };
      }

      // Preparar dados para o Firestore
      const categoryData = {
        name,
        type,
        description: description || null,
        color: color || '#3B82F6',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Salvar no Firestore
      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, categoryData);

      console.log('✅ Categoria salva no Firestore com ID:', docRef.id);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Categoria criada com sucesso',
          category: {
            id: docRef.id,
            ...categoryData
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
    console.error('❌ Erro na function categories:', error);
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