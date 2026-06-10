import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { transactionsAPI, membersAPI } from '../services/api';
import { useAuth } from '../firebase/AuthContext';
import { User } from 'firebase/auth';

interface DashboardStats {
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
}

interface MemberStatsData {
  total: number;
  active: number;
  inactive: number;
}

interface DashboardData {
  stats: DashboardStats | null;
  memberStats: MemberStatsData | null;
  lastFetch: number | null;
}

const CACHE_KEY = 'dashboard_cache';
const CACHE_DURATION = 30000; // 30 segundos em milissegundos (reduzido para melhor performance)

// Hook para gerenciar dados do dashboard com cache inteligente
export const useDashboardData = (forceRefresh = false) => {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    memberStats: null,
    lastFetch: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, authReady } = useAuth();
  const location = useLocation();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const lastUserRef = useRef<User | null>(null);
  const lastRouteRef = useRef<string>(location.pathname);

  // Função para carregar dados do cache
  const loadFromCache = useCallback((): DashboardData | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: DashboardData = JSON.parse(cached);
        const now = Date.now();
        // Se o cache ainda é válido e não forçou refresh
        if (parsed.lastFetch && (now - parsed.lastFetch) < CACHE_DURATION && !forceRefresh) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cache:', e);
    }
    return null;
  }, [forceRefresh]);

  // Função para salvar dados no cache
  const saveToCache = useCallback((stats: DashboardStats | null, memberStats: MemberStatsData | null) => {
    try {
      const cacheData: DashboardData = {
        stats,
        memberStats,
        lastFetch: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Erro ao salvar cache:', e);
    }
  }, []);

  // Função para carregar dados
  const loadData = useCallback(async (useCache = true) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo controller para esta requisição
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);

      // Não rodar nada até o Auth concluir o bootstrap (primeiro onAuthStateChanged)
      // Isso evita race condition: queries/estado vazio serem avaliados com user===null antes do restore.
      if (!authReady) {
        return;
      }

      // Nunca rodar queries reais sem usuário
      if (!user) {
        setData({ stats: null, memberStats: null, lastFetch: null });
        return;
      }

      // Tentar carregar do cache primeiro (apenas se não forçar refresh)
      if (useCache && !forceRefresh) {
        const cached = loadFromCache();
        if (cached && cached.stats && cached.memberStats) {
          // Mostrar dados do cache imediatamente (sem delay)
          setData(cached);
          setLoading(false);
          
          // Carregar dados frescos em background (sem bloquear UI)
          // Usar requestIdleCallback se disponível para não bloquear a UI
          const refreshData = () => {
            if (isMountedRef.current && !signal.aborted) {
              loadData(false); // Recarregar sem mostrar loading
            }
          };
          
          if ('requestIdleCallback' in window) {
            requestIdleCallback(refreshData, { timeout: 1000 });
          } else {
            setTimeout(refreshData, 100); // Fallback mais rápido
          }
          return;
        }
      }

      // Usar APIs reais do Firestore
      const [financialSummary, memberStatsData] = await Promise.all([
        transactionsAPI.getSummary(),
        membersAPI.getMemberStats(),
      ]);

      if (signal.aborted || !isMountedRef.current) return;

      // Transformar dados
      const financialData = financialSummary.data;
      const stats: DashboardStats = {
        income: {
          total: financialData.totalIncome,
          count: financialData.transactionCount,
        },
        expense: {
          total: financialData.totalExpense,
          count: financialData.transactionCount,
        },
        balance: financialData.balance,
      };

      const newData: DashboardData = {
        stats,
        memberStats: memberStatsData.data,
        lastFetch: Date.now(),
      };

      if (!signal.aborted && isMountedRef.current) {
        setData(newData);
        saveToCache(stats, memberStatsData.data);
      }
    } catch (err: any) {
      // Ignorar erros de abort
      if (err.name === 'AbortError' || signal.aborted) {
        return;
      }

      console.error('Erro ao carregar dashboard:', err);

      // Em caso de erro, tentar usar cache
      const cached = loadFromCache();
      if (cached && cached.stats && cached.memberStats) {
        setData(cached);
      } else {
        setData({ stats: null, memberStats: null, lastFetch: null });
        setError('Erro ao carregar dados.');
      }
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [authReady, user, forceRefresh, loadFromCache, saveToCache]);

  // Resetar estado quando rota ou usuário muda e forçar recarregamento
  useEffect(() => {
    const routeChanged = lastRouteRef.current !== location.pathname;
    const userChanged = lastUserRef.current !== user;

    if (routeChanged) {
      lastRouteRef.current = location.pathname;
      hasLoadedRef.current = false;
      // Limpar cache da rota anterior
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch (e) {
        // Ignorar erro
      }
      console.log('ðŸ”„ Rota mudou, limpando cache e resetando:', location.pathname);
    }

    if (userChanged && user !== null) {
      lastUserRef.current = user;
      hasLoadedRef.current = false;
      // Limpar cache quando usuário muda
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch (e) {
        // Ignorar erro
      }
      console.log('ðŸ‘¤ Usuário mudou, limpando cache e resetando');
    }
  }, [location.pathname, user]);

  // Carregar dados quando auth termina de carregar
  useEffect(() => {
    isMountedRef.current = true;
    
    // Aguardar o bootstrap do Auth antes de tentar carregar dados
    if (!authReady || authLoading) {
      setLoading(true);
      return;
    }

    // Carregar dados quando auth termina ou quando precisa recarregar
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Carregar imediatamente (sem delay desnecessário)
      loadData(true);
    }
  }, [authReady, authLoading, loadData]);

  // Recarregar quando não há dados mas deveria ter (com retry)
  useEffect(() => {
    if (authReady && !authLoading && user !== null && !data.stats && hasLoadedRef.current) {
      // Se já tentamos carregar mas não temos dados, tentar novamente
      console.log('ðŸ”„ Recarregando - sem dados disponíveis após carregamento');
      hasLoadedRef.current = false;
      // Limpar cache e tentar novamente
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch (e) {
        // Ignorar erro
      }
      setTimeout(() => loadData(false), 200); // Forçar sem cache
    }
  }, [authReady, user, authLoading, data.stats, loadData]);

  // Atualizar dados quando a janela/tab ganha foco novamente
  useEffect(() => {
    if (authLoading) return;

    const handleFocus = () => {
      if (isMountedRef.current && !authLoading) {
        const cached = loadFromCache();
        const now = Date.now();
        // Se o cache tem mais de 15 segundos, atualizar (mais agressivo)
        if (!cached || !cached.lastFetch || (now - cached.lastFetch) > 15000) {
          loadData(false); // Atualizar em background
        }
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [authLoading, loadFromCache, loadData]);

  // Reset hasLoaded quando o componente desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      hasLoadedRef.current = false;
      // Limpar cache ao desmontar se forçado
      if (forceRefresh) {
        try {
          sessionStorage.removeItem(CACHE_KEY);
        } catch (e) {
          console.warn('Erro ao limpar cache:', e);
        }
      }
    };
  }, [forceRefresh]);

  // Função para forçar refresh (sempre ignora cache)
  const refresh = useCallback(() => {
    hasLoadedRef.current = false; // Resetar para forçar recarregamento
    loadData(false); // Sem cache
  }, [loadData]);

  // Limpar cache
  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
  }, []);

  return {
    stats: data.stats,
    memberStats: data.memberStats,
    loading,
    error,
    refresh,
    clearCache,
  };
};

