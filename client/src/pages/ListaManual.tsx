import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusCircleIcon,
  TrashIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { productsAPI, Product } from '../services/salesAPI';
import { shoppingAPI } from '../services/shoppingAPI';
import { generateShoppingListPdf } from '../utils/shoppingListPdf';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

interface PlannedProduct extends Product {
  plannedId: string;
  checked: boolean;
}

const ListaManual: React.FC = () => {
  const [plannedProducts, setPlannedProducts] = useState<PlannedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plannedItems, all] = await Promise.all([
        shoppingAPI.getPlannedProducts(),
        productsAPI.getAll()
      ]);
      
      setAllProducts(all);
      
      const filtered: PlannedProduct[] = plannedItems.map(item => {
        const product = all.find(p => p.id === item.productId);
        if (!product) return null;
        return {
          ...product,
          plannedId: item.id,
          checked: item.checked
        };
      }).filter((p): p is PlannedProduct => p !== null);

      setPlannedProducts(filtered.sort((a, b) => {
        // Ordenar primeiro por não-marcados, depois alfabeticamente
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.name.localeCompare(b.name);
      }));
    } catch {
      toast.error('Erro ao carregar lista manual');
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
        toast.success(`Novo produto "${searchQuery}" cadastrado e incluído`);
      }

      setSearchQuery('');
      await loadData();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await shoppingAPI.removeFromPlanned(productId);
      setPlannedProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Item removido da lista');
    } catch {
      toast.error('Erro ao remover item');
    }
  };

  const handleToggleCheck = async (plannedId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await shoppingAPI.toggleCheck(plannedId, newStatus);
      
      setPlannedProducts(prev => {
        const updated = prev.map(p => 
          p.plannedId === plannedId ? { ...p, checked: newStatus } : p
        );
        return updated.sort((a, b) => {
          if (a.checked !== b.checked) return a.checked ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
      });
    } catch {
      toast.error('Erro ao marcar item');
    }
  };

  const handleClearAll = async () => {
    if (plannedProducts.length === 0) return;
    if (!window.confirm('Deseja limpar todos os itens da lista de feira?')) return;
    
    try {
      setLoading(true);
      await shoppingAPI.clearAllPlanned();
      setPlannedProducts([]);
      toast.success('Lista limpa com sucesso');
    } catch {
      toast.error('Erro ao limpar lista');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (plannedProducts.length === 0) {
      toast.info('A lista está vazia');
      return;
    }
    generateShoppingListPdf(plannedProducts);
    toast.success('PDF gerado com sucesso');
  };

  if (loading) return <LoadingSpinner />;

  const suggestions = searchQuery.trim() 
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !plannedProducts.find(item => item.id === p.id)
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Lista de Feira</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monte sua lista de compras manualmente para o fornecedor ou mercado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {plannedProducts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold transition-all shadow-sm border border-red-200 dark:border-red-800"
            >
              <TrashIcon className="h-4 w-4" />
              Limpar Lista
            </button>
          )}
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Gerar PDF da Lista
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <form onSubmit={handleAddToList} className="relative">
          <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">
            O QUE PRECISO COMPRAR?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: Arroz, Feijão, Sabão..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-gray-900 dark:text-white font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !searchQuery.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-black hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              {isAdding ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircleIcon className="h-6 w-6" />}
              ADICIONAR
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={async () => {
                    await shoppingAPI.addToPlanned(p.id);
                    setSearchQuery('');
                    loadData();
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between group border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <TagIcon className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                    Estoque atual: {p.stock}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plannedProducts.map((p) => (
          <div 
            key={p.plannedId}
            onClick={() => handleToggleCheck(p.plannedId, p.checked)}
            className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all group cursor-pointer ${
              p.checked 
                ? 'border-green-100 dark:border-green-900/30 opacity-60' 
                : 'border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${
                p.checked 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {p.checked ? <CheckCircleIconSolid className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
              </div>
              <div>
                <p className={`font-bold leading-tight transition-all ${
                  p.checked 
                    ? 'text-gray-400 dark:text-gray-500 line-through' 
                    : 'text-gray-900 dark:text-white'
                }`}>{p.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estoque: {p.stock} {p.unit || 'un'}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(p.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Remover da lista"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {plannedProducts.length === 0 && (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
          <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest">Sua lista está vazia</p>
          <p className="text-xs text-gray-400 mt-1">Comece a adicionar produtos acima</p>
        </div>
      )}
    </div>
  );
};

export default ListaManual;