// Versão ultra-simplificada para testar se as functions funcionam
exports.handler = async (event, context) => {
  console.log('🔍 Login ultra-simple chamada:', event.httpMethod);
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { username, password } = body;

    // Verificação ultra-simples (sem bcryptjs)
    if (username === 'admin' && password === 'password123') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login realizado com sucesso',
          token: 'simple-token-123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@igreja.com',
            role: 'admin'
          }
        })
      };
    } else {
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
