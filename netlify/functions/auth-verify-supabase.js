const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase-config');

exports.handler = async (event, context) => {
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

    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token é obrigatório' })
      };
    }

    // Verificar token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-2024'
    );

    // Buscar dados atualizados do usuário no Supabase
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role')
      .eq('id', decoded.id)
      .single();

    if (fetchError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Token válido',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      })
    };

  } catch (error) {
    console.error('Erro na verificação:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expirado' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};
