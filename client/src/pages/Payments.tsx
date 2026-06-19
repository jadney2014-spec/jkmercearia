import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { paymentsAPI, Payment } from '../services/paymentsAPI';
import { formatDateOnlyPtBr, parseDateOnly } from '../utils/dateOnly';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const initialForm = {
  description: '',
  value: '',
  due_date: '',
  status: 'pending' as 'pending' | 'paid',
  payment_date: '',
  notes: '',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentsAPI.getAll();
      setPayments(data);
    } catch (error) {
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isOverdue = (dueDate: string) => {
    const dt = parseDateOnly(dueDate);
    if (Number.isNaN(dt.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt.getTime() < today.getTime();
  };

  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      due_date: getTodayStr(),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setEditing(payment);
    setForm({
      description: payment.description,
      value: String(payment.value),
      due_date: payment.due_date,
      status: payment.status,
      payment_date: payment.payment_date || '',
      notes: payment.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Informe a descrição do pagamento');
      return;
    }
    const val = Number(form.value.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido e maior que zero');
      return;
    }
    if (!form.due_date) {
      toast.error('Informe a data de vencimento');
      return;
    }

    const payload = {
      description: form.description.trim(),
      value: val,
      due_date: form.due_date,
      status: form.status,
      payment_date: form.status === 'paid' ? (form.payment_date || getTodayStr()) : undefined,
      notes: form.notes.trim(),
    };

    try {
      setSaving(true);
      if (editing) {
        await paymentsAPI.update(editing.id, payload);
        toast.success('Pagamento atualizado com sucesso!');
      } else {
        await paymentsAPI.create(payload);
        toast.success('Pagamento lançado com sucesso!');
      }
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error('Erro detalhado ao salvar pagamento:', error);
      toast.error('Erro ao salvar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pagamento?')) return;
    try {
      await paymentsAPI.delete(id);
      toast.success('Pagamento excluído com sucesso');
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir pagamento');
    }
  };

  const handleQuickPay = async (payment: Payment) => {
    try {
      const todayStr = getTodayStr();
      await paymentsAPI.update(payment.id, {
        status: 'paid',
        payment_date: todayStr,
      });
      toast.success(`Pagamento "${payment.description}" marcado como PAGO!`);
      await loadData();
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  // Computações estatísticas
  const stats = payments.reduce(
    (acc, p) => {
      const isPaid = p.status === 'paid';
      const overdue = !isPaid && isOverdue(p.due_date);

      if (isPaid) {
        acc.paidSum += p.value;
        acc.paidCount += 1;
      } else if (overdue) {
        acc.overdueSum += p.value;
        acc.overdueCount += 1;
      } else {
        acc.pendingSum += p.value;
        acc.pendingCount += 1;
      }
      return acc;
    },
    { paidSum: 0, paidCount: 0, pendingSum: 0, pendingCount: 0, overdueSum: 0, overdueCount: 0 }
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtros
  const filtered = payments.filter((p) => {
    // Busca textual
    const matchesSearch =
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    // Filtro de aba
    const isPaid = p.status === 'paid';
    const overdue = !isPaid && isOverdue(p.due_date);

    if (activeTab === 'paid') return isPaid;
    if (activeTab === 'pending') return !isPaid && !overdue;
    if (activeTab === 'overdue') return overdue;
    return true; // 'all'
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCardIcon className="h-7 w-7 text-primary-600 dark:text-primary-500" />
            Controle de Pagamentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Acompanhamento de boletos, contas a pagar e vencimentos.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95 shrink-0"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Novo Pagamento
        </button>
      </div>

      {/* Cards Estatísticos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              A Vencer (Pendentes)
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {formatCurrency(stats.pendingSum)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.pendingCount} boleto(s) pendente(s)
            </p>
          </div>
        </div>

        {/* Card Atrasados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vencidos (Atrasados)
            </p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
              {formatCurrency(stats.overdueSum)}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              {stats.overdueCount} boleto(s) atrasado(s)
            </p>
          </div>
        </div>

        {/* Card Pagos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Pago
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">
              {formatCurrency(stats.paidSum)}
            </p>
            <p className="text-xs text-green-500 dark:text-green-400 mt-0.5">
              {stats.paidCount} boleto(s) pago(s)
            </p>
          </div>
        </div>
      </div>

      {/* Busca e Abas */}
      <div className="space-y-4">
        {/* Barra de Busca */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, produto, descrição ou observações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-yellow-600 text-yellow-600 dark:border-yellow-500 dark:text-yellow-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pendentes ({stats.pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`pb-2.5 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overdue'
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Atrasados ({stats.overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`pb-2.5 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'paid'
                ? 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pagos ({stats.paidCount})
          </button>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição / Notas</th>
              <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vencimento</th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagamento</th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                  {search ? 'Nenhum pagamento encontrado para esta busca.' : 'Nenhum pagamento cadastrado.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isPaid = item.status === 'paid';
                const overdue = !isPaid && isOverdue(item.due_date);

                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Descrição */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{item.description}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.notes}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    {/* Valor */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-black text-gray-900 dark:text-white">
                        {formatCurrency(item.value)}
                      </span>
                    </td>
                    {/* Vencimento */}
                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatDateOnlyPtBr(item.due_date)}
                    </td>
                    {/* Data de Pagamento */}
                    <td className="px-5 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {isPaid ? formatDateOnlyPtBr(item.payment_date) : '—'}
                    </td>
                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Pago
                        </span>
                      ) : overdue ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Atrasado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Pendente
                        </span>
                      )}
                    </td>
                    {/* Ações */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isPaid && (
                          <button
                            onClick={() => handleQuickPay(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                            title="Marcar como Pago hoje"
                          >
                            <CheckIcon className="h-4.5 w-4.5 stroke-[2.5]" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Lançamento' : 'Novo Lançamento de Pagamento'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Fornecedor / Descrição *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Coca-Cola, Conta de Luz, Aluguel"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                {/* Vencimento */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Situação
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="pending">Pendente (A pagar)</option>
                  <option value="paid">Pago</option>
                </select>
              </div>

              {/* Data Pagamento (condicional) */}
              {form.status === 'paid' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              )}

              {/* Notas / Código de barras */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Observações / Código de Barras
                </label>
                <textarea
                  placeholder="Digite observações ou cole a linha digitável do boleto..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-md active:scale-95"
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
}
