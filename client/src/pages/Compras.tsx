import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { salesAPI, Product } from '../services/salesAPI';
import { generateShoppingListPdf } from '../utils/shoppingListPdf';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const STORAGE_KEY = 'jk_compras_checked';

const Compras: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const lowStock = await salesAPI.getLowStockProducts();
      setProducts(lowStock.sort((a, b) => a.stock - b.stock));

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setChecked(JSON.parse(saved));
      } catch {
        setChecked({});
      }
    } catch {
      toast.error('Erro ao carregar lista de compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleChecked = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearChecks = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleExportPdf = () => {
    if (products.length === 0) {
      toast.info('Não há produtos com estoque baixo para exportar');
      return;
    }
    generateShoppingListPdf(products);
    toast.success('PDF gerado com sucesso');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fazer Compras</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Produtos com estoque ≤ 5 unidades — marque conforme for comprando
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Atualizar
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <ShoppingCartIcon className="h-5 w-5" />
          <span className="font-medium">{products.length} produto(s) precisam de reposição</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          Estoque em dia — nenhum item abaixo do limite
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">✓</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={checked[product.id] ? 'opacity-50 line-through' : ''}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!checked[product.id]}
                      onChange={() => toggleChecked(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {product.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        product.stock === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {product.stock} {product.unit || 'un'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.values(checked).some(Boolean) && (
        <button
          onClick={clearChecks}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Limpar marcações
        </button>
      )}
    </div>
  );
};

export default Compras;
