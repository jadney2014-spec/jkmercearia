import React, { useCallback, useEffect, useState } from 'react';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CubeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { salesAPI, parseFirestoreDate, Sale, Product } from '../services/salesAPI';
import { toast } from 'react-toastify';
import AnimatedCard from '../components/AnimatedCard';
import PageTransition from '../components/PageTransition';
import QuickActions from '../components/QuickActions';
import SkeletonCard from '../components/SkeletonCard';
import PullToRefresh from '../components/PullToRefresh';
import { Link } from 'react-router-dom';
import { appPath } from '../constants/app';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ count: 0, revenue: 0, itemsSold: 0, sales: [] as Sale[] });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, low] = await Promise.all([
        salesAPI.getTodayStats(),
        salesAPI.getLowStockProducts(),
      ]);
      setTodayStats(stats);
      setLowStock(low);

      const allSales = await salesAPI.getAll();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTotal = allSales
        .filter((s) => parseFirestoreDate(s.created_at) >= monthStart)
        .reduce((sum, s) => sum + s.total, 0);
      setMonthRevenue(monthTotal);
    } catch {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatTime = (date: Date | string) =>
    parseFirestoreDate(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-md text-slate-600 dark:text-gray-400">
              Visão geral das vendas
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <SkeletonCard key={index} delay={index} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PullToRefresh onRefresh={loadData}>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
              <p className="mt-1 text-sm sm:text-md text-slate-600 dark:text-gray-400">
                Visão geral das vendas da JK Mercearia
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatedCard delay={0}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Faturamento Hoje</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(todayStats.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={1}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.count}</p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={2}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CubeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Itens Vendidos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.itemsSold}</p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={3}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Faturamento Mês</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(monthRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>

          {lowStock.length > 0 && (
            <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Estoque Baixo</h3>
                </div>
                <Link
                  to={appPath('compras')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors border border-yellow-300 dark:border-yellow-700"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  Gerar Relatório de Compra
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStock.slice(0, 8).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full"
                  >
                    {p.name} ({p.stock})
                  </span>
                ))}
                {lowStock.length > 8 && (
                  <Link to={appPath('products')} className="text-xs text-yellow-700 underline">
                    +{lowStock.length - 8} mais
                  </Link>
                )}
              </div>
            </div>
          )}

          <AnimatedCard delay={5}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vendas de Hoje</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {todayStats.sales.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Nenhuma venda registrada hoje.{' '}
                  <Link to={appPath('vendas')} className="text-green-600 hover:underline">
                    Registrar venda
                  </Link>
                </div>
              ) : (
                todayStats.sales.map((sale) => (
                  <div key={sale.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sale.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(sale.created_at)} · {sale.payment_method}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(sale.total)}</p>
                  </div>
                ))
              )}
            </div>
          </AnimatedCard>

          <QuickActions />
        </div>
      </PullToRefresh>
    </PageTransition>
  );
};

export default Dashboard;
