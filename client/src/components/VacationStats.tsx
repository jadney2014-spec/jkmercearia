import React, { useState, useMemo, useCallback, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePastorVacationData } from '../hooks/usePastorVacationData';
import { VacationEvent } from '../services/pastorVacationAPI';
import moment from 'moment';

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface MonthlyVacationData {
  month: string;
  monthName: string;
  count: number;
}

interface PastorVacationData {
  name: string;
  count: number;
  days: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

interface VacationStatsProps {
  vacations?: VacationEvent[];
  loading?: boolean;
}

const VacationStats: React.FC<VacationStatsProps> = ({ 
  vacations: propVacations, 
  loading: propLoading 
}) => {
  // Usar dados passados como props ou carregar do hook (fallback)
  const hookData = usePastorVacationData();
  const vacations = propVacations ?? hookData.vacations;
  const loading = propLoading ?? hookData.loading;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Gerar lista de anos disponíveis
  const availableYears = useMemo(() => {
    if (!vacations || vacations.length === 0) {
      return [new Date().getFullYear()];
    }
    const years = new Set<number>();
    vacations.forEach(vacation => {
      years.add(moment(vacation.start).year());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [vacations]);

  // Dados mensais de férias
  const monthlyData = useMemo<MonthlyVacationData[]>(() => {
    const filtered = vacations.filter(v => moment(v.start).year() === selectedYear);
    const monthly: { [key: number]: number } = {};
    
    filtered.forEach(vacation => {
      const month = moment(vacation.start).month();
      monthly[month] = (monthly[month] || 0) + 1;
    });

    return MONTH_NAMES_SHORT.map((name, index) => ({
      month: name,
      monthName: name,
      count: monthly[index] || 0,
    }));
  }, [vacations, selectedYear]);

  // Dados por pastor
  const pastorData = useMemo<PastorVacationData[]>(() => {
    const filtered = vacations.filter(v => moment(v.start).year() === selectedYear);
    const pastorMap: { [key: string]: { count: number; days: number } } = {};

    filtered.forEach(vacation => {
      const name = vacation.pastorName || 'Sem nome';
      const days = moment(vacation.end).diff(moment(vacation.start), 'days') + 1;
      
      if (!pastorMap[name]) {
        pastorMap[name] = { count: 0, days: 0 };
      }
      pastorMap[name].count += 1;
      pastorMap[name].days += days;
    });

    return Object.entries(pastorMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        days: data.days,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 pastores
  }, [vacations, selectedYear]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const filtered = vacations.filter(v => moment(v.start).year() === selectedYear);
    const totalVacations = filtered.length;
    const totalDays = filtered.reduce((sum, v) => {
      return sum + moment(v.end).diff(moment(v.start), 'days') + 1;
    }, 0);
    const avgDays = totalVacations > 0 ? Math.round(totalDays / totalVacations) : 0;
    const uniquePastors = new Set(filtered.map(v => v.pastorName || v.pastorId)).size;

    return {
      totalVacations,
      totalDays,
      avgDays,
      uniquePastors,
    };
  }, [vacations, selectedYear]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value, 10));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vacations || vacations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhuma férias registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de ano */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Estatísticas de Férias
        </h3>
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total de Férias</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalVacations}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total de Dias</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalDays}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Média de Dias</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.avgDays}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Pastores</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.uniquePastors}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras - Férias por mês */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Férias por Mês
          </h4>
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
                />
                <Tooltip
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
                  dataKey="count" 
                  name="Quantidade de Férias" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de pizza - Férias por pastor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Férias por Pastor
          </h4>
          {pastorData.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pastorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {pastorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value} férias`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum dado disponível para o ano selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Tabela de pastores */}
      {pastorData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Detalhes por Pastor
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pastor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total de Dias
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pastorData.map((pastor, index) => (
                  <tr key={pastor.name}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        {pastor.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pastor.count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pastor.days} dias
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoizar componente para evitar re-renderizações desnecessárias
export default memo(VacationStats);

