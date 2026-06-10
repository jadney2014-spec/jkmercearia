import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { membersAPI } from '../services/api';
import { mockDashboardData, simulateApiDelay } from '../services/mockData';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';

interface MemberStatsData {
  total: number;
  active: number;
  inactive: number;
}

const MemberStats: React.FC = () => {
  const [stats, setStats] = useState<MemberStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadMemberStats = useCallback(async () => {
    try {
      // Verificar se deve usar dados mock
      const useMockData = !user;
      
      if (useMockData) {
        // Simular delay de API
        await simulateApiDelay(400);
        
        // Usar dados mock
        setStats(mockDashboardData.memberStats);
        console.log('Dados mock de estatísticas carregados:', mockDashboardData.memberStats);
      } else {
        // Usar dados reais do Firestore
        const response = await membersAPI.getMemberStats();
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      
      // Em caso de erro, usar dados mock como fallback
      setStats(mockDashboardData.memberStats);
      // toast.info('Usando dados de demonstração'); // Removido - notificações desabilitadas
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMemberStats();
  }, [loadMemberStats]);

  // Calcular percentuais (hooks devem vir antes de qualquer return)
  const activePercentage = useMemo(
    () => stats && stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
    [stats?.total, stats?.active]
  );
  
  const inactivePercentage = useMemo(
    () => stats && stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0,
    [stats?.total, stats?.inactive]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total de membros */}
      <div className="text-center">
        <motion.div 
          className="text-3xl font-bold text-gray-900"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {stats.total}
        </motion.div>
        <div className="text-sm text-gray-500">
          Total de Membros
        </div>
      </div>

      {/* Gráfico de status */}
      <div className="space-y-3">
        {/* Membros Ativos */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ativos</span>
            <span className="font-medium text-gray-900">
              {stats.active} ({activePercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-success-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${activePercentage}%` }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>

        {/* Membros Inativos */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Inativos</span>
            <span className="font-medium text-gray-900">
              {stats.inactive} ({inactivePercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gray-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${inactivePercentage}%` }}
              transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-success-600">
              {stats.active}
            </div>
            <div className="text-xs text-gray-500">Ativos</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-400">
              {stats.inactive}
            </div>
            <div className="text-xs text-gray-500">Inativos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MemberStats);
