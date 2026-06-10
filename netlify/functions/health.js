exports.handler = async (event, context) => {
  console.log('🏥 Health check chamado:', event.httpMethod);
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    console.log('✅ Health check funcionando');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        message: 'Netlify Functions funcionando',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path
      })
    };

  } catch (error) {
    console.error('❌ Erro no health check:', error);
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
