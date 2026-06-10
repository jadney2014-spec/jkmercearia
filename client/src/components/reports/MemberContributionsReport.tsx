import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-toastify';
// Removido DocumentArrowDownIcon não utilizado

interface MemberContribution {
  id: string;
  name: string;
  email: string;
  contribution_count: number;
  total_contributed: number;
  average_contribution: number;
  first_contribution: string;
  last_contribution: string;
}

interface Props {
  onDataLoaded: (data: MemberContribution[]) => void;
  onMetadataLoaded?: (metadata: any) => void;
}

const MemberContributionsReport: React.FC<Props> = ({ onDataLoaded, onMetadataLoaded }) => {
  const [data, setData] = useState<MemberContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  }, [startDate, endDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getMemberContributions({
        start_date: startDate,
        end_date: endDate
      });
      const contributionsData = Array.isArray(response.data) ? response.data : [];
      setData(contributionsData);
      onDataLoaded(contributionsData);
      
      // Passa metadados para geração de PDF
      if (onMetadataLoaded) {
        onMetadataLoaded({
          startDate,
          endDate
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar relatório de contribuições');
      console.error('Erro ao carregar relatório:', error);
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
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white dark:bg-gray-900/80 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Contribuintes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {data.length}
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
                  <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                    <span className="text-success-600 font-bold">$</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Arrecadado
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      R$ {data.reduce((sum, member) => sum + member.total_contributed, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">≈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Média por Membro
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      R$ {data.length > 0 ? (data.reduce((sum, member) => sum + member.total_contributed, 0) / data.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
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
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">Σ</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Contribuições
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {data.reduce((sum, member) => sum + member.contribution_count, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-900/80 shadow rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Contribuições por Membro
          </h3>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma contribuição encontrada no período selecionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contribuições
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Contribuído
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Média por Contribuição
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Primeira Contribuição
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Última Contribuição
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
                {data.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {member.contribution_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-success-600">
                      R$ {member.total_contributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      R$ {member.average_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {new Date(member.first_contribution).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {new Date(member.last_contribution).toLocaleDateString('pt-BR')}
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

export default MemberContributionsReport;
