import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { transactionsAPI, categoriesAPI, membersAPI } from '../services/api';
import { mockDashboardData, simulateApiDelay } from '../services/mockData';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import useDebounce from '../hooks/useDebounce';

interface Transaction {
  id: number | string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: number | string;
  member_id?: number | string;
  transaction_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  category_name?: string;
  member_name?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number | string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface Member {
  id: number | string;
  name: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category_id: '',
    member_id: '',
    start_date: '',
    end_date: ''
  });

  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebounce(filters.search, 300);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const lastRouteRef = useRef<string>(location.pathname);
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    // Aguardar autenticação terminar antes de carregar
    if (authLoading) {
      return;
    }

    try {
      setLoading(true);
      
      // Verificar se deve usar dados mock
      const useMockData = !user;
      
      if (useMockData) {
        // Simular delay de API
        await simulateApiDelay(600);
        
        // Usar dados mock
        setTransactions(mockDashboardData.transactions);
        setCategories(mockDashboardData.categories);
        setMembers(mockDashboardData.members);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
        console.log('Dados mock de transações carregados:', mockDashboardData.transactions);
      } else {
        // Tentar usar APIs reais - otimizar carregamento
        // Carregar transações primeiro (mais importante), depois o resto em paralelo
        const transactionsResponse = await transactionsAPI.getTransactions({
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        });
        
        // Carregar categorias e membros em paralelo (menos crítico)
        const [categoriesResponse, membersResponse] = await Promise.all([
          categoriesAPI.getCategories(),
          membersAPI.getMembers()
        ]);
        
        // Usar dados reais do Firestore
        setTransactions(transactionsResponse.data.transactions);
        setPagination({
          page: 1,
          limit: 10,
          total: transactionsResponse.data.total,
          pages: Math.ceil(transactionsResponse.data.total / 10)
        });
        setCategories(categoriesResponse.data.categories);
        setMembers(membersResponse.data.members);
        
        console.log('âœ… Dados carregados do Firestore:');
        console.log('- Transações:', transactionsResponse.data.transactions.length);
        console.log('- Categorias:', categoriesResponse.data.categories.length);
        console.log('- Membros:', membersResponse.data.members.length);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      
      // Em caso de erro, usar dados mock como fallback
      setTransactions(mockDashboardData.transactions);
      setCategories(mockDashboardData.categories);
      setMembers(mockDashboardData.members);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
      // toast.info('Usando dados de demonstração'); // Removido - notificações desabilitadas
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, user, authLoading]);

  // Resetar e limpar cache quando a rota mudar
  useEffect(() => {
    if (lastRouteRef.current !== location.pathname) {
      hasLoadedRef.current = false;
      lastRouteRef.current = location.pathname;
      // Limpar cache ao mudar de rota
      try {
        sessionStorage.removeItem('transactions_cache');
      } catch (e) {
        // Ignorar erro
      }
      console.log('ðŸ”„ Rota mudou em Transactions, limpando cache e resetando');
    }
  }, [location.pathname]);

  // Carregar dados quando monta ou quando auth/user/rota muda
  useEffect(() => {
    // Só carregar dados quando auth terminar
    if (authLoading) {
      return;
    }

    // Forçar recarregamento se ainda não carregou ou se a rota mudou
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Carregar imediatamente (sem delay desnecessário)
      loadData();
    }
  }, [loadData, authLoading, location.pathname]);

  // Efeito separado para busca com debounce
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch }));
    }
  }, [debouncedSearch, filters.search]);

  const handleCreateTransaction = useCallback(async (transactionData: any) => {
    try {
      console.log('ðŸš€ Criando transação com dados:', transactionData);
      await transactionsAPI.createTransaction(transactionData);
      toast.success('Transação criada com sucesso!');
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error('âŒ Erro ao criar transação:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar transação');
    }
  }, [loadData]);

  const handleUpdateTransaction = useCallback(async (id: string, transactionData: any) => {
    try {
      await transactionsAPI.updateTransaction(id, transactionData);
      toast.success('Transação atualizada com sucesso!');
      setEditingTransaction(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar transação');
    }
  }, [loadData]);

  const handleDeleteTransaction = async (id: string | number) => {
    if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
      try {
        await transactionsAPI.deleteTransaction(String(id));
        toast.success('Transação deletada com sucesso!');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Erro ao deletar transação');
      }
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category_id: '',
      member_id: '',
      start_date: '',
      end_date: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie receitas e despesas da igreja
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  id="search"
                  className="input pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Descrição ou referência..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                id="type"
                className="input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                id="category_id"
                className="input dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member */}
            <div>
              <label htmlFor="member_id" className="block text-sm font-medium text-gray-700 mb-1">
                Membro
              </label>
              <select
                id="member_id"
                className="input"
                value={filters.member_id}
                onChange={(e) => handleFilterChange('member_id', e.target.value)}
              >
                <option value="">Todos</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                id="start_date"
                className="input"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                id="end_date"
                className="input"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button type="submit" className="btn btn-primary min-h-[44px] w-full sm:w-auto">
              Buscar
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Limpar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        pagination={pagination}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onPageChange={handlePageChange}
      />

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          members={members}
          onSave={editingTransaction ? 
            (data) => handleUpdateTransaction(String(editingTransaction.id), data) : 
            handleCreateTransaction
          }
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Transactions;
