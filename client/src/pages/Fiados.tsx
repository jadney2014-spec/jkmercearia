import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { fiadosAPI, Fiado } from '../services/fiadosAPI';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const Fiados: React.FC = () => {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    items: '',
    total: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fiadosAPI.getAll();
      setFiados(list);
    } catch {
      toast.error('Erro ao carregar fiados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeFiados = fiados.filter((f) => f.status === 'open');
  const archivedFiados = fiados.filter((f) => f.status === 'paid');
  const visibleFiados = tab === 'ativos' ? activeFiados : archivedFiados;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date?: Date) =>
    date ? date.toLocaleString('pt-BR') : '—';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.items.trim()) {
      toast.error('Informe o nome do cliente e os produtos');
      return;
    }

    try {
      await fiadosAPI.create({
        customer_name: form.customer_name,
        items: form.items,
        total: Number(form.total.replace(',', '.')) || 0,
        notes: form.notes,
      });
      toast.success('Fiado registrado');
      setForm({ customer_name: '', items: '', total: '', notes: '' });
      setShowForm(false);
      await loadData();
    } catch {
      toast.error('Erro ao registrar fiado');
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!window.confirm('Confirmar quitação deste fiado?')) return;
    try {
      await fiadosAPI.markAsPaid(id);
      toast.success('Fiado quitado e arquivado');
      await loadData();
    } catch {
      toast.error('Erro ao quitar fiado');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await fiadosAPI.reopen(id);
      toast.success('Fiado reaberto');
      await loadData();
    } catch {
      toast.error('Erro ao reabrir fiado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este registro de fiado?')) return;
    try {
      await fiadosAPI.delete(id);
      toast.success('Registro excluído');
      await loadData();
    } catch {
      toast.error('Erro ao excluir fiado');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Fiados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Anote vendas fiadas e arquive quando forem quitadas
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <PlusIcon className="h-5 w-5" />
          Novo fiado
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/40"
        >
          <input
            type="text"
            placeholder="Nome do cliente"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <input
            type="text"
            placeholder="Valor total (opcional)"
            value={form.total}
            onChange={(e) => setForm({ ...form, total: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <textarea
            placeholder="Produtos (ex: 2x Arroz, 1x Feijão...)"
            value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
            rows={3}
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <textarea
            placeholder="Observações (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Salvar fiado
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('ativos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'ativos' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
          }`}
        >
          Ativos ({activeFiados.length})
        </button>
        <button
          onClick={() => setTab('arquivados')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'arquivados' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
          }`}
        >
          Arquivados ({archivedFiados.length})
        </button>
      </div>

      {visibleFiados.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          {tab === 'ativos' ? 'Nenhum fiado em aberto' : 'Nenhum fiado arquivado'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleFiados.map((fiado) => (
            <div
              key={fiado.id}
              className={`rounded-xl border p-4 ${
                fiado.status === 'paid'
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{fiado.customer_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {fiado.status === 'paid' ? 'Quitado em' : 'Criado em'} {formatDate(fiado.status === 'paid' ? fiado.paid_at : fiado.created_at)}
                  </p>
                </div>
                {fiado.status === 'paid' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    <CheckCircleIcon className="h-4 w-4" />
                    Quitado
                  </span>
                )}
              </div>

              <div className="mt-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {fiado.items}
              </div>

              {fiado.notes && (
                <p className="mt-2 text-xs text-gray-500 italic">{fiado.notes}</p>
              )}

              {fiado.total > 0 && (
                <p className="mt-3 font-bold text-green-600">{formatCurrency(fiado.total)}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {fiado.status === 'open' ? (
                  <button
                    onClick={() => handleMarkPaid(fiado.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                    Marcar quitado
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(fiado.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    Reabrir
                  </button>
                )}
                <button
                  onClick={() => handleDelete(fiado.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <TrashIcon className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Fiados;
