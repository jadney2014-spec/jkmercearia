// Function para buscar membros
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, query, orderBy } = require('firebase/firestore');

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
  console.log('👥 Members function chamada:', event.httpMethod);
  
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
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/');
    const memberId = pathParts[pathParts.length - 1];
    
    // Verificar se é uma operação específica de um membro
    const isSpecificMember = memberId && memberId !== 'members' && !isNaN(memberId);
    
    console.log('🔍 Operação:', httpMethod, 'ID:', memberId, 'É específico:', isSpecificMember);

    if (httpMethod === 'GET') {
      if (isSpecificMember) {
        // GET /members/{id} - Buscar membro específico
        console.log('🔍 Buscando membro específico:', memberId);
        
        const memberRef = doc(db, 'members', memberId);
        const memberSnap = await getDoc(memberRef);
        
        if (!memberSnap.exists()) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Membro não encontrado' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: memberSnap.id,
            ...memberSnap.data()
          })
        };
      } else {
        // GET /members - Listar todos os membros
        console.log('📊 Buscando membros do Firestore...');
        
        const membersRef = collection(db, 'members');
        const q = query(membersRef, orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        
        const members = [];
        snapshot.forEach((doc) => {
          members.push({
            id: doc.id,
            ...doc.data()
          });
        });

        console.log(`✅ ${members.length} membros encontrados`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            members,
            total: members.length
          })
        };
      }
    }

    if (httpMethod === 'POST') {
      // POST /members - Criar novo membro
      if (isSpecificMember) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Use POST /members para criar um novo membro' })
        };
      }
      
      console.log('💾 Criando novo membro no Firestore...');
      
      const bodyData = JSON.parse(body || '{}');
      const { 
        name, 
        email, 
        phone, 
        address, 
        birth_date, 
        member_since, 
        status, 
        notes 
      } = bodyData;

      // Validação básica
      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Campo obrigatório: name' 
          })
        };
      }

      // Preparar dados para o Firestore
      const memberData = {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        birth_date: birth_date || null,
        member_since: member_since || null,
        status: status || 'active',
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Salvar no Firestore
      const membersRef = collection(db, 'members');
      const docRef = await addDoc(membersRef, memberData);

      console.log('✅ Membro salvo no Firestore com ID:', docRef.id);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Membro criado com sucesso',
          member: {
            id: docRef.id,
            ...memberData
          }
        })
      };
    }

    if (httpMethod === 'PUT') {
      // PUT /members/{id} - Atualizar membro
      if (!isSpecificMember) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do membro é obrigatório para atualização' })
        };
      }
      
      console.log('🔄 Atualizando membro no Firestore:', memberId);
      
      const bodyData = JSON.parse(body || '{}');
      
      // Verificar se o membro existe
      const memberRef = doc(db, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (!memberSnap.exists()) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Membro não encontrado' })
        };
      }
      
      // Preparar dados para atualização
      const updateData = {
        ...bodyData,
        updated_at: new Date()
      };
      
      // Atualizar no Firestore
      await updateDoc(memberRef, updateData);
      
      console.log('✅ Membro atualizado no Firestore');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Membro atualizado com sucesso',
          member: {
            id: memberId,
            ...memberSnap.data(),
            ...updateData
          }
        })
      };
    }

    if (httpMethod === 'DELETE') {
      // DELETE /members/{id} - Deletar membro
      if (!isSpecificMember) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do membro é obrigatório para exclusão' })
        };
      }
      
      console.log('🗑️ Deletando membro do Firestore:', memberId);
      
      // Verificar se o membro existe
      const memberRef = doc(db, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (!memberSnap.exists()) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Membro não encontrado' })
        };
      }
      
      // Deletar do Firestore
      await deleteDoc(memberRef);
      
      console.log('✅ Membro deletado do Firestore');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Membro deletado com sucesso',
          member: {
            id: memberId,
            ...memberSnap.data()
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
    console.error('❌ Erro na function members:', error);
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
