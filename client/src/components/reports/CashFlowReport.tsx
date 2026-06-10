import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-toastify';
// Removido DocumentArrowDownIcon não utilizado

interface CashFlowData {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  onDataLoaded: (data: CashFlowData[]) => void;
  onMetadataLoaded?: (metadata: any) => void;
}

const CashFlowReport: React.FC<Props> = ({ onDataLoaded, onMetadataLoaded }) => {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    // Set default date range to current year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    setStartDate(startOfYear.toISOString().split('T')[0]);
    setEndDate(endOfYear.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate, period]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getCashFlow({
        start_date: startDate,
        end_date: endDate,
        period
      });
      // A API já retorna array diretamente
      const cashFlowData = Array.isArray(response.data) ? response.data : [];
      setData(cashFlowData);
      onDataLoaded(cashFlowData);
      
      // Passa metadados para geração de PDF
      if (onMetadataLoaded) {
        onMetadataLoaded({
          startDate,
          endDate,
          period
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar relatório de fluxo de caixa');
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (periodStr: string) => {
    if (period === 'daily') {
      return new Date(periodStr).toLocaleDateString('pt-BR');
    } else if (period === 'weekly') {
      return `Semana ${periodStr}`;
    } else {
      const [year, month] = periodStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data Início
          </label>
          <input
            type="date"
            id="start_date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            id="end_date"
            className="input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Período
          </label>
          <select
            id="period"
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
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
                    Total de Receitas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
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
                    Total de Despesas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  totalBalance >= 0 ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  <span className={`font-bold ${
                    totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    =
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Total
                  </dt>
                  <dd className={`text-lg font-medium ${
                    totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="bg-white dark:bg-gray-900/80 shadow rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Fluxo de Caixa - {period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}
          </h3>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum dado encontrado no período selecionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Receitas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Despesas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatPeriod(item.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-success-600">
                      R$ {item.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-danger-600">
                      R$ {item.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      item.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      R$ {item.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowReport;
