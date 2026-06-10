// Página de relatórios e estatísticas de escalas
import React, { useState, useEffect } from 'react';
import { escalasAPI } from '../services/scalesAPI';
import { ministeriosAPI } from '../services/scalesAPI';
import type { Escala, Ministerio } from '../types/Scale';
import {
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ScaleReports: React.FC = () => {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [escalasData, ministeriosData] = await Promise.all([
        escalasAPI.getEscalas({
          data_inicio: new Date(dateRange.start),
          data_fim: new Date(dateRange.end),
        }),
        ministeriosAPI.getMinisterios(),
      ]);
      setEscalas(escalasData);
      setMinisterios(ministeriosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas gerais
  const totalEscalas = escalas.length;
  const escalasConfirmadas = escalas.filter(e => e.status === 'confirmada').length;
  const escalasCanceladas = escalas.filter(e => e.status === 'cancelada').length;
  const escalasConcluidas = escalas.filter(e => e.status === 'concluida').length;
  const totalMembrosEscalados = escalas.reduce(
    (acc, escala) => acc + escala.membros.length,
    0
  );
  const totalConfirmacoes = escalas.reduce(
    (acc, escala) =>
      acc + escala.membros.filter(m => m.status === 'confirmado').length,
    0
  );

  // Estatísticas por ministério
  const statsByMinisterio = ministerios.map(ministerio => {
    const escalasMinisterio = escalas.filter(
      e => e.ministerio_id === ministerio.id
    );
    const membrosEscalados = escalasMinisterio.reduce(
      (acc, escala) => acc + escala.membros.length,
      0
    );
    const confirmacoes = escalasMinisterio.reduce(
      (acc, escala) =>
        acc + escala.membros.filter(m => m.status === 'confirmado').length,
      0
    );

    return {
      ministerio: ministerio.nome,
      totalEscalas: escalasMinisterio.length,
      membrosEscalados,
      confirmacoes,
      taxaConfirmacao:
        membrosEscalados > 0 ? (confirmacoes / membrosEscalados) * 100 : 0,
    };
  });

  // Membros mais escalados
  const membrosCount: Record<string, { nome: string; count: number }> = {};
  escalas.forEach(escala => {
    escala.membros.forEach(membro => {
      if (!membrosCount[membro.membro_id]) {
        membrosCount[membro.membro_id] = {
          nome: membro.membro_nome,
          count: 0,
        };
      }
      membrosCount[membro.membro_id].count++;
    });
  });

  const topMembros = Object.values(membrosCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Relatórios de Escalas
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estatísticas e análises das escalas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900/80 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900/80 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Escalas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalEscalas}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {escalasConfirmadas}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Membros Escalados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalMembrosEscalados}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Confirmação</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {totalMembrosEscalados > 0
                  ? Math.round((totalConfirmacoes / totalMembrosEscalados) * 100)
                  : 0}
                %
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Estatísticas por Ministério */}
      <div className="bg-white dark:bg-gray-900/80 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Por Ministério
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ministério
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Escalas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Membros Escalados
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Confirmações
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Taxa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {statsByMinisterio.map((stat, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {stat.ministerio}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                    {stat.totalEscalas}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                    {stat.membrosEscalados}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {stat.confirmacoes}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                    {Math.round(stat.taxaConfirmacao)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Membros */}
      {topMembros.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Membros Mais Escalados
          </h2>
          <div className="space-y-2">
            {topMembros.map((membro, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {membro.nome}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {membro.count} {membro.count === 1 ? 'escala' : 'escalas'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaleReports;
