// Versão simplificada da function de login para debug
exports.handler = async (event, context) => {
  console.log('🔍 Login function chamada:', event.httpMethod, event.body);
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Lidar com preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS request - retornando CORS headers');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      console.log('❌ Método não permitido:', event.httpMethod);
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    console.log('📝 Body recebido:', body);

    const { username, password } = body;

    if (!username || !password) {
      console.log('❌ Username ou password faltando');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username e password são obrigatórios' })
      };
    }

    // Verificação simples para debug
    if (username === 'admin' && password === 'password123') {
      console.log('✅ Login válido para admin');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login realizado com sucesso',
          token: 'debug-token-123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@igreja.com',
            role: 'admin'
          }
        })
      };
    } else {
      console.log('❌ Credenciais inválidas:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciais inválidas' })
      };
    }

  } catch (error) {
    console.error('❌ Erro na function:', error);
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
