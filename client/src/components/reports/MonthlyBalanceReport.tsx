import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface MonthlyBalance {
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
  period: { year: number; month: number };
}

interface Props {
  onDataLoaded: (data: MonthlyBalance) => void;
}

const MonthlyBalanceReport: React.FC<Props> = ({ onDataLoaded }) => {
  const [data, setData] = useState<MonthlyBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadReport();
  }, [year, month]);

  const loadReport = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais do Firestore
      const response = await reportsAPI.getMonthlyBalance(year, month);
      const reportData = response.data;
      
      // Transformar dados para o formato esperado
      const formattedData: MonthlyBalance = {
        income: {
          total: reportData.income?.total || 0,
          count: reportData.income?.count || 0
        },
        expense: {
          total: reportData.expense?.total || 0,
          count: reportData.expense?.count || 0
        },
        balance: reportData.balance || 0,
        period: { year, month }
      };
      
      setData(formattedData);
      onDataLoaded(formattedData);
      console.log('✅ Relatório mensal carregado:', formattedData);
    } catch (error) {
      console.error('❌ Erro ao carregar relatório mensal:', error);
      
      // Em caso de erro, usar dados vazios
      const emptyData: MonthlyBalance = {
        income: { total: 0, count: 0 },
        expense: { total: 0, count: 0 },
        balance: 0,
        period: { year, month }
      };
      setData(emptyData);
      onDataLoaded(emptyData);
      
      toast.error('Erro ao carregar relatório mensal. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível para o período selecionado</p>
      </div>
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ano
          </label>
          <select
            id="year"
            className="input"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const yearOption = new Date().getFullYear() - i;
              return (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mês
          </label>
          <select
            id="month"
            className="input"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(year, i).toLocaleDateString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-900/80 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <span className="text-success-600 font-bold">+</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receitas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {(data.income?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {data.income?.count || 0} transações
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                  <span className="text-danger-600 font-bold">-</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Despesas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {(data.expense?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {data.expense?.count || 0} transações
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  (data.balance || 0) >= 0 ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  <span className={`font-bold ${
                    (data.balance || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    =
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo
                  </dt>
                  <dd className={`text-lg font-medium ${
                    (data.balance || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    R$ {(data.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {capitalizedMonth} {year}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white dark:bg-gray-900/80 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Resumo Visual
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Gráfico em desenvolvimento</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBalanceReport;
