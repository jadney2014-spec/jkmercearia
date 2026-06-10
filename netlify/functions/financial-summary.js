// Function para resumo financeiro
exports.handler = async (event, context) => {
  console.log('📊 Financial summary function chamada:', event.httpMethod);
  
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Dados simulados do resumo financeiro
    const summary = {
      totalIncome: 1500.00,
      totalExpenses: 380.00,
      balance: 1120.00,
      monthlyIncome: 1500.00,
      monthlyExpenses: 380.00,
      monthlyBalance: 1120.00,
      totalMembers: 3,
      activeMembers: 3,
      recentTransactions: [
        {
          id: 1,
          description: 'Dízimo - João Silva',
          amount: 500.00,
          type: 'income',
          date: '2024-01-15'
        },
        {
          id: 2,
          description: 'Oferta - Maria Santos',
          amount: 200.00,
          type: 'income',
          date: '2024-01-15'
        },
        {
          id: 3,
          description: 'Conta de luz',
          amount: 150.00,
          type: 'expense',
          date: '2024-01-14'
        }
      ],
      incomeByCategory: [
        { category: 'Dízimos', amount: 500.00, percentage: 33.33 },
        { category: 'Ofertas', amount: 200.00, percentage: 13.33 }
      ],
      expenseByCategory: [
        { category: 'Utilidades', amount: 150.00, percentage: 39.47 },
        { category: 'Manutenção', amount: 80.00, percentage: 21.05 }
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('❌ Erro na function financial summary:', error);
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
