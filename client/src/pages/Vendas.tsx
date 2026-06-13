import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { productsAPI, salesAPI, parseFirestoreDate, Product, SaleItem, Sale } from '../services/salesAPI';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

interface CartItem extends SaleItem {
  maxStock: number;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'debito', label: 'Cartão Débito' },
  { value: 'credito', label: 'Cartão Crédito' },
];

const Vendas: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scannerMode, setScannerMode] = useState(true);
  const [barcodeInput, setBarcodeValue] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'nova' | 'historico'>('nova');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, salesList] = await Promise.all([
        productsAPI.getAll(),
        salesAPI.getAll(),
      ]);
      setProducts(prods.filter((p) => p.active && p.stock > 0));
      setSales(salesList);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lógica do Scanner
  const handleScannerInput = (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      toast.success(`${product.name} adicionado`, { autoClose: 1000, position: 'bottom-right', hideProgressBar: true });
    } else {
      toast.error(`Produto com código ${code} não encontrado`);
    }
    setBarcodeValue('');
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (tab !== 'nova' || !scannerMode) return;
      
      // Se o usuário não estiver em um campo de texto, foca no scanner
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (!isInput && e.key.length === 1) {
        const input = document.getElementById('scanner-focus-input');
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [tab, scannerMode]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  const getProductPrice = useCallback((product: Product, method: string) => {
    if (method === 'debito') return product.price_debit || product.price;
    if (method === 'credito') return product.price_credit || product.price;
    return product.price;
  }, []);

  // Atualiza preÃ§os no carrinho quando muda forma de pagamento
  useEffect(() => {
    if (cart.length === 0) return;
    setCart(prev => prev.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return item;
      const price = getProductPrice(product, paymentMethod);
      return {
        ...item,
        unit_price: price,
        subtotal: item.quantity * price
      };
    }));
  }, [paymentMethod, products, getProductPrice]);

  const addToCart = (product: Product) => {
    const price = getProductPrice(product, paymentMethod);
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warning('Estoque insuficiente');
        return;
      }
      setCart(
        cart.map((c) =>
          c.product_id === product.id
            ? {
                ...c,
                quantity: c.quantity + 1,
                subtotal: (c.quantity + 1) * c.unit_price,
              }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: price,
          subtotal: price,
          maxStock: product.stock,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.product_id !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.maxStock) {
            toast.warning('Estoque insuficiente');
            return c;
          }
          return { ...c, quantity: newQty, subtotal: newQty * c.unit_price };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho');
      return;
    }

    try {
      setProcessing(true);
      await salesAPI.create({
        items: cart.map(({ product_id, product_name, quantity, unit_price, subtotal }) => ({
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal,
        })),
        total: cartTotal,
        payment_method: paymentMethod,
        notes,
        created_by: user?.uid,
        created_by_name: user?.displayName || user?.email || '',
      });
      toast.success('Venda registrada com sucesso!');
      setCart([]);
      setNotes('');
      setPaymentMethod('dinheiro');
      await loadData();
      setTab('historico');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar venda');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date: Date | string) =>
    parseFirestoreDate(date).toLocaleString('pt-BR');

  const handleDeleteSale = async (sale: Sale) => {
    if (!window.confirm('Excluir esta venda? O estoque dos produtos será restaurado.')) return;

    try {
      setDeletingId(sale.id);
      await salesAPI.delete(sale.id);
      toast.success('Venda excluída');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir venda');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${scannerMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <ShoppingCartIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Vendas (RPV)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vendeu, lançou — registro rápido de ponto de venda
            </p>
          </div>
        </div>

        {/* MODO SCANNER TOGGLE */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className={`text-xs font-black uppercase tracking-tighter ${scannerMode ? 'text-blue-600' : 'text-gray-400'}`}>
            {scannerMode ? 'Modo Scanner Ativo' : 'Scanner Desativado'}
          </span>
          <button
            onClick={() => setScannerMode(!scannerMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              scannerMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                scannerMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* INPUT INVISÍVEL PARA O SCANNER */}
      {scannerMode && tab === 'nova' && (
        <input
          id="scanner-focus-input"
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && barcodeInput) {
              handleScannerInput(barcodeInput);
            }
          }}
          className="fixed opacity-0 pointer-events-none"
          autoFocus
        />
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('nova')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'nova'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Nova Venda
        </button>
        <button
          onClick={() => setTab('historico')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'historico'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico ({sales.length})
        </button>
      </div>

      {tab === 'nova' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {product.name}
                  </div>
                  <div className="text-green-600 font-bold mt-1">
                    {formatCurrency(getProductPrice(product, paymentMethod))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Estoque: {product.stock}
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Nenhum produto disponível
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCartIcon className="h-5 w-5 text-green-600" />
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Carrinho ({cart.length})
                </h2>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Clique nos produtos para adicionar
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 rounded-lg p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.product_name}</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.unit_price)} cada
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white mb-4">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Forma de pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Observações (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleCheckout}
                    disabled={processing || cart.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    {processing ? 'Registrando...' : 'Finalizar Venda'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma venda registrada
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sale.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{sale.payment_method}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        disabled={deletingId === sale.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                        title="Excluir venda"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vendas;
