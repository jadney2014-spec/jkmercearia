import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../firebase/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

// Define a estrutura dos dados mensais
interface MonthlyData {
  month: string;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

// Gera uma lista de anos recentes para o filtro
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const FinancialSummary: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyTotal, setYearlyTotal] = useState({ income: 0, expense: 0, balance: 0 });
  const availableYears = useMemo(() => generateYears(), []);
  const { user, loading: authLoading } = useAuth();

  const loadYearlyData = useCallback(async (year: number) => {
    // Aguardar autenticação terminar
    if (authLoading) {
      return;
    }

    setLoading(true);
    try {
      // Usar API de relatório anual que já funciona
      const response = await reportsAPI.getYearlyBalance(year);
      const reportData = response.data;

      if (reportData && reportData.monthlyData) {
        // Converter para formato do gráfico com nomes abreviados
        const formattedData = reportData.monthlyData.map((month: MonthlyData) => ({
          ...month,
          month: MONTH_NAMES_SHORT[parseInt(month.month) - 1] || month.month,
        }));

        setMonthlyData(formattedData);
        setYearlyTotal(reportData.yearlyTotal || { income: 0, expense: 0, balance: 0 });
      } else {
        // Se não houver dados, criar estrutura vazia
        const emptyData = MONTH_NAMES_SHORT.map((name, index) => ({
          month: name,
          monthName: name,
          income: 0,
          expense: 0,
          balance: 0,
        }));
        setMonthlyData(emptyData);
        setYearlyTotal({ income: 0, expense: 0, balance: 0 });
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      // Em caso de erro, criar estrutura vazia
      const emptyData = MONTH_NAMES_SHORT.map((name) => ({
        month: name,
        monthName: name,
        income: 0,
        expense: 0,
        balance: 0,
      }));
      setMonthlyData(emptyData);
      setYearlyTotal({ income: 0, expense: 0, balance: 0 });
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    loadYearlyData(selectedYear);
  }, [selectedYear, loadYearlyData]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value, 10));
  }, []);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        avgIncome: 0,
        avgExpense: 0,
        avgBalance: 0,
        bestMonth: null,
        worstMonth: null,
        growthRate: 0,
      };
    }

    const monthsWithData = monthlyData.filter(m => m.income > 0 || m.expense > 0);
    const avgIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / 12;
    const avgExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / 12;
    const avgBalance = monthlyData.reduce((sum, m) => sum + m.balance, 0) / 12;

    const bestMonth = monthlyData.reduce((best, current) => 
      current.balance > best.balance ? current : best
    , monthlyData[0]);

    const worstMonth = monthlyData.reduce((worst, current) => 
      current.balance < worst.balance ? current : worst
    , monthlyData[0]);

    // Calcular crescimento (comparar últimos 6 meses com primeiros 6 meses)
    const firstHalf = monthlyData.slice(0, 6).reduce((sum, m) => sum + m.balance, 0);
    const secondHalf = monthlyData.slice(6, 12).reduce((sum, m) => sum + m.balance, 0);
    const growthRate = firstHalf !== 0 ? ((secondHalf - firstHalf) / Math.abs(firstHalf)) * 100 : 0;

    return {
      avgIncome,
      avgExpense,
      avgBalance,
      bestMonth,
      worstMonth,
      growthRate,
    };
  }, [monthlyData]);

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (monthlyData.length === 0 || (yearlyTotal.income === 0 && yearlyTotal.expense === 0)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Nenhum dado financeiro disponível para {selectedYear}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Registre transações para visualizar o resumo financeiro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de ano e estatísticas rápidas */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="block w-32 pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Cards de resumo rápido */}
        <div className="flex gap-2 text-xs">
          <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
            <span className="font-medium">Média Receitas:</span> {formatCurrency(stats.avgIncome)}
          </div>
          <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
            <span className="font-medium">Média Despesas:</span> {formatCurrency(stats.avgExpense)}
          </div>
        </div>
      </div>

      {/* Gráfico de barras - Receitas vs Despesas */}
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              fontSize={11}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => {
                if (value >= 1000) return `R$${(value as number / 1000).toFixed(0)}k`;
                return `R$${value}`;
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Bar 
              dataKey="income" 
              name="Receitas" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="expense" 
              name="Despesas" 
              fill="#EF4444" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de linha - Saldo mensal */}
      <div style={{ width: '100%', height: 180 }} className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Evolução do Saldo Mensal
        </h4>
        <ResponsiveContainer>
          <LineChart
            data={monthlyData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              fontSize={11}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => {
                if (value >= 1000) return `R$${(value as number / 1000).toFixed(0)}k`;
                return `R$${value}`;
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Saldo"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas e insights */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">Melhor Mês:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.bestMonth?.month || 'N/A'}
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {stats.bestMonth ? formatCurrency(stats.bestMonth.balance) : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-gray-600 dark:text-gray-400">Mês Desafiador:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.worstMonth?.month || 'N/A'}
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              {stats.worstMonth ? formatCurrency(stats.worstMonth.balance) : ''}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Saldo Médio:</span>
            <span className={`font-semibold ${stats.avgBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(stats.avgBalance)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Crescimento:</span>
            {stats.growthRate > 0 ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                <ArrowUpIcon className="h-4 w-4" />
                {stats.growthRate.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                <ArrowDownIcon className="h-4 w-4" />
                {Math.abs(stats.growthRate).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FinancialSummary);
