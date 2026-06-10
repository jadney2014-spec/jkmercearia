import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { productsAPI, Product } from '../services/salesAPI';
import { categoriesAPI } from '../services/api';
import { parseExcelFile } from '../utils/excelParser';
import { importProductsFromExcel, ImportProgress } from '../services/productImportService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
}

const emptyForm = {
  name: '',
  purchase_price: '',
  price: '',
  stock: '',
  category_id: '',
  barcode: '',
  unit: 'un',
  active: true,
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, catsRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getCategories(),
      ]);
      setProducts(prods);
      const cats = catsRes?.data?.categories || [];
      setCategories(cats.map((c: { id: string; name: string }) => ({ id: String(c.id), name: c.name })));
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      (p.barcode && p.barcode.includes(search)) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchTerm))
  );

  const highlightedProduct =
    searchTerm.length >= 2
      ? filtered.find((p) => p.name.toLowerCase() === searchTerm) ||
        (filtered.length === 1 ? filtered[0] : null)
      : null;

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      purchase_price: String(product.purchase_price || ''),
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id || '',
      barcode: product.barcode || '',
      unit: product.unit || 'un',
      active: product.active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Informe o nome do produto');
      return;
    }

    const payload = {
      name: form.name.trim(),
      purchase_price: parseFloat(form.purchase_price) || 0,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock, 10) || 0,
      category_id: form.category_id || '',
      barcode: form.barcode.trim(),
      unit: form.unit || 'un',
      active: form.active,
    };

    try {
      setSaving(true);
      if (editing) {
        await productsAPI.update(editing.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await productsAPI.create(payload);
        toast.success('Produto cadastrado!');
      }
      setShowForm(false);
      await loadData();
    } catch {
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    try {
      await productsAPI.delete(product.id);
      toast.success('Produto excluído');
      await loadData();
    } catch {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!window.confirm(
      `Importar produtos de "${file.name}"?\n\nProdutos já cadastrados com o mesmo nome serão ignorados.`
    )) return;

    try {
      setImporting(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelFile(buffer);

      if (parsed.products.length === 0) {
        toast.warning('Nenhum produto encontrado na planilha');
        return;
      }

      const result = await importProductsFromExcel(parsed.products, setImportProgress);
      toast.success(
        `Importação concluída: ${result.productsCreated} produto(s) novo(s), ` +
        `${result.categoriesCreated} categoria(s) criada(s), ` +
        `${result.productsSkipped} ignorado(s) (já existiam)`
      );
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao importar planilha';
      toast.error(message);
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const marginPercent = (purchase: number, sale: number) => {
    if (!purchase || !sale) return null;
    return (((sale - purchase) / purchase) * 100).toFixed(1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produtos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cadastro, busca e preços de compra e venda
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            {importing ? 'Importando...' : 'Importar Planilha'}
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Novo Produto
          </button>
        </div>
      </div>

      {importing && importProgress && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{importProgress.message}</p>
          {importProgress.total > 0 && (
            <div className="mt-2 h-2 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar produto pelo nome, categoria ou código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {highlightedProduct && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300 mb-1">
                Produto encontrado
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{highlightedProduct.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Categoria: {highlightedProduct.category_name || 'Sem categoria'}
              </p>
            </div>
            <button
              onClick={() => openEdit(highlightedProduct)}
              className="shrink-0 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Editar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Valor pago (custo)</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(highlightedProduct.purchase_price)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Valor de venda</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(highlightedProduct.price)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Estoque</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {highlightedProduct.stock} {highlightedProduct.unit}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Margem</p>
              <p className="text-lg font-bold text-blue-600">
                {marginPercent(highlightedProduct.purchase_price, highlightedProduct.price)
                  ? `${marginPercent(highlightedProduct.purchase_price, highlightedProduct.price)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        {filtered.length} produto(s) {search ? 'encontrado(s)' : 'cadastrado(s)'}
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Venda</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estoque</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  {search ? (
                    <p className="text-gray-500">Nenhum produto encontrado para esta busca</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-500">Nenhum produto cadastrado ainda</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Importar ITENS RJ MERCEARIA.xlsx
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                    {product.barcode && (
                      <div className="text-xs text-gray-500">{product.barcode}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {product.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-orange-600 dark:text-orange-400">
                    {formatCurrency(product.purchase_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock <= 5
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchase_price}
                    onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                    placeholder="Quanto você pagou"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor de venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Seu preço de venda"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              {form.purchase_price && form.price && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Margem estimada:{' '}
                  {marginPercent(parseFloat(form.purchase_price), parseFloat(form.price))}%
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cód. Barras</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="un">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="lt">Litro</option>
                    <option value="cx">Caixa</option>
                    <option value="pct">Pacote</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
