import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-toastify';
// Removido DocumentArrowDownIcon não utilizado

interface MonthlyData {
  month: string;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

interface YearlyBalance {
  year: number;
  monthlyData: MonthlyData[];
  yearlyTotal: {
    income: number;
    expense: number;
    balance: number;
  };
}

interface Props {
  onDataLoaded: (data: MonthlyData[]) => void;
  onFullDataLoaded?: (data: YearlyBalance) => void;
}

const YearlyBalanceReport: React.FC<Props> = ({ onDataLoaded, onFullDataLoaded }) => {
  const [data, setData] = useState<YearlyBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReport();
  }, [year]);

  const loadReport = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais do Firestore
      const response = await reportsAPI.getYearlyBalance(year);
      const reportData = response.data;
      
      if (reportData && reportData.monthlyData) {
        setData(reportData);
        // Passa o array mensal para compatibilidade (pode ser usado por outros componentes)
        onDataLoaded(reportData.monthlyData);
        // Passa o objeto completo para geração de PDF (chamado depois para sobrescrever)
        if (onFullDataLoaded) {
          onFullDataLoaded(reportData);
        }
        console.log('✅ Relatório anual carregado:', reportData);
      } else {
        // Dados vazios se não houver dados
        const emptyData: YearlyBalance = {
          year,
          monthlyData: [],
          yearlyTotal: { income: 0, expense: 0, balance: 0 }
        };
        setData(emptyData);
        onDataLoaded([]);
        if (onFullDataLoaded) {
          onFullDataLoaded(emptyData);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar relatório anual:', error);
      toast.error('Erro ao carregar relatório anual. Tente novamente.');
      
      // Dados vazios em caso de erro
      const emptyData: YearlyBalance = {
        year,
        monthlyData: [],
        yearlyTotal: { income: 0, expense: 0, balance: 0 }
      };
      setData(emptyData);
      onDataLoaded([]);
      if (onFullDataLoaded) {
        onFullDataLoaded(emptyData);
      }
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
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível para o ano selecionado</p>
      </div>
    );
  }

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
      </div>

      {/* Yearly Summary */}
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
                    Receitas Anuais
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {data.yearlyTotal.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    Despesas Anuais
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {data.yearlyTotal.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  data.yearlyTotal.balance >= 0 ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  <span className={`font-bold ${
                    data.yearlyTotal.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    =
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Anual
                  </dt>
                  <dd className={`text-lg font-medium ${
                    data.yearlyTotal.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    R$ {data.yearlyTotal.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white dark:bg-gray-900/80 shadow rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Resumo Mensal - {year}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mês
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
              {data.monthlyData.map((month, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {month.monthName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-success-600">
                    R$ {month.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-danger-600">
                    R$ {month.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    month.balance >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    R$ {month.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearlyBalanceReport;
