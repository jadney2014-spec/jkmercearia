// Dados mock para o dashboard funcionar sem backend
export const mockDashboardData = {
  financialSummary: {
    income: { total: 0, count: 0 },
    expense: { total: 0, count: 0 },
    balance: 0
  },
  monthlyBalance: {
    income: { total: 0, count: 0 },
    expense: { total: 0, count: 0 },
    balance: 0,
    period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
  },
  memberStats: {
    total: 0,
    active: 0,
    inactive: 0
  },
  recentTransactions: [
    {
      id: 1,
      description: 'Dízimo - João Silva',
      amount: 150.00,
      type: 'income' as const,
      transaction_date: new Date().toISOString(),
      category_name: 'Dízimos',
      member_name: 'João Silva'
    },
    {
      id: 2,
      description: 'Oferta Especial',
      amount: 75.50,
      type: 'income' as const,
      transaction_date: new Date(Date.now() - 86400000).toISOString(),
      category_name: 'Ofertas',
      member_name: 'Maria Santos'
    },
    {
      id: 3,
      description: 'Conta de Luz',
      amount: 320.00,
      type: 'expense' as const,
      transaction_date: new Date(Date.now() - 172800000).toISOString(),
      category_name: 'Utilidades',
      member_name: ''
    },
    {
      id: 4,
      description: 'Dízimo - Pedro Oliveira',
      amount: 200.00,
      type: 'income' as const,
      transaction_date: new Date(Date.now() - 259200000).toISOString(),
      category_name: 'Dízimos',
      member_name: 'Pedro Oliveira'
    },
    {
      id: 5,
      description: 'Manutenção do Prédio',
      amount: 450.00,
      type: 'expense' as const,
      transaction_date: new Date(Date.now() - 345600000).toISOString(),
      category_name: 'Manutenção',
      member_name: ''
    }
  ],
  cashFlowData: [
    { month: "1", income: 0, expense: 0, balance: 0 },
    { month: "2", income: 0, expense: 0, balance: 0 },
    { month: "3", income: 0, expense: 0, balance: 0 },
    { month: "4", income: 0, expense: 0, balance: 0 },
    { month: "5", income: 0, expense: 0, balance: 0 },
    { month: "6", income: 0, expense: 0, balance: 0 },
    { month: "7", income: 0, expense: 0, balance: 0 },
    { month: "8", income: 0, expense: 0, balance: 0 },
    { month: "9", income: 0, expense: 0, balance: 0 },
    { month: "10", income: 0, expense: 0, balance: 0 },
    { month: "11", income: 0, expense: 0, balance: 0 },
    { month: "12", income: 0, expense: 0, balance: 0 }
  ],
  users: [
    {
      id: 1,
      username: "admin",
      email: "admin@igreja.com",
      role: "admin",
      created_at: "2024-01-01T00:00:00Z"
    }
  ],
  members: [],
  transactions: [],
  categories: [
    {
      id: 1,
      name: "Dízimos",
      type: "income" as const,
      description: "Contribuições regulares dos membros",
      color: "#10B981",
      transaction_count: 0,
      total_amount: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 2,
      name: "Ofertas",
      type: "income" as const, 
      description: "Ofertas especiais e voluntárias",
      color: "#3B82F6",
      transaction_count: 0,
      total_amount: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 3,
      name: "Utilidades",
      type: "expense" as const,
      description: "Contas de água, luz, telefone",
      color: "#EF4444",
      transaction_count: 0,
      total_amount: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 4,
      name: "Manutenção",
      type: "expense" as const,
      description: "Reparos e manutenção do templo",
      color: "#F59E0B",
      transaction_count: 0,
      total_amount: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    }
  ]
};

// Função para simular delay de API
export const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Função para simular erro ocasional
export const shouldSimulateError = () => Math.random() < 0.1; // 10% chance de erro
