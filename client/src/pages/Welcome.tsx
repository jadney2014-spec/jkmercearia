import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBagIcon,
  CubeIcon,
  ChartBarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../firebase/AuthContext';
import { salesAPI } from '../services/salesAPI';
import { appPath } from '../constants/app';

export default function Welcome() {
  const { user } = useAuth();
  const location = useLocation();
  const name = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const [todayStats, setTodayStats] = useState({ count: 0, revenue: 0, itemsSold: 0 });
  const [lowStock, setLowStock] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const [stats, lowProducts] = await Promise.all([
        salesAPI.getTodayStats(),
        salesAPI.getLowStockProducts(),
      ]);
      setTodayStats(stats);
      setLowStock(lowProducts.length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, location.pathname]);

  useEffect(() => {
    const onFocus = () => loadStats();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadStats]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const quickLinks = [
    {
      title: 'Nova Venda',
      description: 'Registrar venda no balcão — vendeu, lançou',
      href: appPath('vendas'),
      icon: ShoppingBagIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Produtos',
      description: 'Cadastrar e gerenciar estoque',
      href: appPath('products'),
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Dashboard',
      description: 'Visão geral das vendas do dia',
      href: appPath('dashboard'),
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Olá, {name}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Bem-vindo ao Sistema de Vendas da JK Mercearia
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Vendas Hoje</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{todayStats.count}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Faturamento Hoje</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {formatCurrency(todayStats.revenue)}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 border border-orange-100 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Itens Vendidos</p>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">{todayStats.itemsSold}</p>
        </div>
      </div>

      {lowStock > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Atenção: {lowStock} produto(s) com estoque baixo (≤ 5 unidades)
          </p>
          <Link
            to={appPath('compras')}
            className="text-sm font-medium text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
          >
            Ver lista de compras
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              to={link.href}
              className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 hover:shadow-md transition-all"
            >
              <div className={`${link.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{link.description}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 mt-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
