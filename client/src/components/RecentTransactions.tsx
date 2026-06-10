import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { transactionsAPI } from '../services/api';
import { mockDashboardData, simulateApiDelay } from '../services/mockData';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';

interface Transaction {
  id: string | number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
  category_name?: string;
  member_name?: string;
}

// Componente memoizado para linha da tabela
const TransactionRow = memo<{ transaction: Transaction }>(({ transaction }) => {
  const formattedDate = useMemo(
    () => new Date(transaction.transaction_date).toLocaleDateString('pt-BR'),
    [transaction.transaction_date]
  );

  const formattedAmount = useMemo(
    () => transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    [transaction.amount]
  );

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            transaction.type === 'income' ? 'bg-success-500' : 'bg-danger-500'
          }`}></div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {transaction.description}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {transaction.category_name || '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {transaction.member_name || '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <span className={`${
          transaction.type === 'income' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}R$ {formattedAmount}
        </span>
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';

const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadRecentTransactions = useCallback(async () => {
    try {
      // Verificar se deve usar dados mock
      const useMockData = !user;
      
      if (useMockData) {
        // Simular delay de API (reduzido)
        await simulateApiDelay(200);
        
        // Usar dados mock
        setTransactions(mockDashboardData.recentTransactions);
        console.log('Dados mock de transações carregados:', mockDashboardData.recentTransactions);
      } else {
        // Usar API real do Firestore
        console.log('ðŸ”¥ Carregando transações recentes do Firestore...');
        const response = await transactionsAPI.getRecentTransactions(5);
        setTransactions(response.data);
        console.log('âœ… Transações recentes carregadas do Firestore:', response.data.length);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      
      // Em caso de erro, usar dados mock como fallback
      setTransactions(mockDashboardData.recentTransactions);
      console.log('Usando dados mock como fallback');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecentTransactions();
  }, [loadRecentTransactions]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Membro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(RecentTransactions);
