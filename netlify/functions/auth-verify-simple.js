// Versão ultra-simples para testar verificação de token
exports.handler = async (event, context) => {
  console.log('🔍 Auth-verify-simple chamada:', event.httpMethod);
  
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
    const { token } = body;

    console.log('🔑 Token recebido:', token);

    // Verificação ultra-simples (sem JWT)
    if (token === 'simple-token-123') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Token válido (simples)',
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
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

  } catch (error) {
    console.error('❌ Erro na function auth-verify-simple:', error);
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
