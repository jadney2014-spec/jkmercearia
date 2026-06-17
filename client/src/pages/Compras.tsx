import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  PlusCircleIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { salesAPI, productsAPI, Product } from '../services/salesAPI';
import { shoppingAPI } from '../services/shoppingAPI';
import { generateShoppingListPdf } from '../utils/shoppingListPdf';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ComprasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [lowStock, plannedItems, all] = await Promise.all([
        salesAPI.getLowStockProducts(),
        shoppingAPI.getPlannedProducts(),
        productsAPI.getAll()
      ]);

      const plannedIds = plannedItems.map(i => i.productId);
      
      setAllProducts(all);
      const plannedProducts = all.filter(p => plannedIds.includes(p.id) && !lowStock.find(ls => ls.id === p.id));
      const unified = [...lowStock, ...plannedProducts];
      
      setProducts(unified.sort((a, b) => a.stock - b.stock));
      
      const initialQtys: Record<string, string> = {};
      unified.forEach(p => {
        initialQtys[p.id] = '1';
      });
      setQuantities(initialQtys);
    } catch {
      toast.error('Erro ao carregar lista de compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsAdding(true);
      const existing = allProducts.find(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase());

      if (existing) {
        await shoppingAPI.addToPlanned(existing.id);
        toast.info(`${existing.name} adicionado à lista`);
      } else {
        const newProduct = {
          name: searchQuery.trim(),
          price: 0,
          purchase_price: 0,
          stock: 0,
          active: true,
          unit: 'un'
        };
        const { id } = await productsAPI.create(newProduct as any);
        await shoppingAPI.addToPlanned(id);
        toast.success(`Novo produto "${searchQuery}" criado e adicionado à lista`);
      }

      setSearchQuery('');
      await loadData();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateStock = async (product: Product) => {
    const qtyToAdd = Number(quantities[product.id]);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [product.id]: true }));
      const newStock = product.stock + qtyToAdd;
      await productsAPI.update(product.id, { stock: newStock });
      await shoppingAPI.removeFromPlanned(product.id);
      
      toast.success(`${product.name}: +${qtyToAdd} adicionados ao estoque`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setQuantities(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } catch {
      toast.error(`Erro ao atualizar estoque de ${product.name}`);
    } finally {
      setUpdating(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleExportPdf = () => {
    if (products.length === 0) {
      toast.info('Não há produtos para exportar');
      return;
    }
    generateShoppingListPdf(products);
    toast.success('PDF gerado com sucesso');
  };

  if (loading) return <LoadingSpinner />;

  const suggestions = searchQuery.trim() 
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !products.find(item => item.id === p.id)
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Itens a Comprar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lista automática de estoque baixo + seus itens planejados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Atualizar
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <form onSubmit={handleAddToList} className="relative">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
            Adicionar Produto à Lista (Manual)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Busque um produto ou digite o nome de um novo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isAdding ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircleIcon className="h-5 w-5" />}
              Incluir
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={async () => {
                    await shoppingAPI.addToPlanned(p.id);
                    setSearchQuery('');
                    loadData();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Estoque: {p.stock} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <ShoppingCartIcon className="h-5 w-5" />
          <span className="font-medium">{products.length} item(ns) na lista de compras</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50">
          Nenhum item pendente de compra.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estoque Atual</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Entrada de Compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {product.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-black rounded-full ${
                        product.stock === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {product.stock} {product.unit || 'un'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden h-9 bg-gray-50 dark:bg-gray-800">
                        <button 
                          onClick={() => setQuantities(prev => ({ ...prev, [product.id]: Math.max(1, Number(prev[product.id] || 1) - 1).toString() }))}
                          className="px-3 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantities[product.id] || ''}
                          onChange={(e) => setQuantities(prev => ({ ...prev, [product.id]: e.target.value }))}
                          className="w-12 h-full text-center text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black outline-none border-x-2 border-gray-300 dark:border-gray-600"
                        />
                        <button 
                          onClick={() => setQuantities(prev => ({ ...prev, [product.id]: (Number(prev[product.id] || 0) + 1).toString() }))}
                          className="px-3 h-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateStock(product)}
                        disabled={updating[product.id]}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 shadow-md active:scale-95"
                      >
                        {updating[product.id] ? (
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                        Confirmar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
