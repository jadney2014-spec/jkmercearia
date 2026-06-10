import React, { useCallback, useEffect, useState } from 'react';
import { ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { salesAPI, Sale } from '../services/salesAPI';
import { toast } from 'react-toastify';
import { exportToCsv } from '../utils/export';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getAll({ start_date: startDate, end_date: endDate });
      setSales(data);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItems = sales.reduce(
    (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  const byPayment = sales.reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] || 0) + s.total;
    return acc;
  }, {} as Record<string, number>);

  const byProduct = sales.reduce((acc, s) => {
    s.items.forEach((item) => {
      acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(byProduct)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const handleExport = () => {
    const rows = sales.map((s) => ({
      Data: new Date(s.created_at).toLocaleString('pt-BR'),
      Itens: s.items.map((i) => `${i.quantity}x ${i.product_name}`).join('; '),
      Pagamento: s.payment_method,
      Total: s.total.toFixed(2),
      Vendedor: s.created_by_name || '',
    }));
    exportToCsv(`vendas_${startDate}_${endDate}`, rows);
    toast.success('Relatório exportado!');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios de Vendas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Análise de vendas por período</p>
        </div>
        <button
          onClick={handleExport}
          disabled={sales.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Até</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Filtrar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 font-medium">Total de Vendas</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">{sales.length}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 font-medium">Faturamento</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 font-medium">Itens Vendidos</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{totalItems}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Por Forma de Pagamento
          </h3>
          {Object.keys(byPayment).length === 0 ? (
            <p className="text-gray-500 text-sm">Sem dados no período</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byPayment).map(([method, total]) => (
                <div key={method} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{method}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Produtos Mais Vendidos
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">Sem dados no período</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300">
                    {i + 1}. {name}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{qty} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
