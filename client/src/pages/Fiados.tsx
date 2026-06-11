import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { fiadosAPI, Fiado } from '../services/fiadosAPI';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const NOTE_STYLES = [
  {
    bg: 'bg-yellow-200 dark:bg-yellow-300/90',
    border: 'border-yellow-300 dark:border-yellow-400',
    text: 'text-yellow-950',
    tape: 'bg-yellow-400/70',
  },
  {
    bg: 'bg-pink-200 dark:bg-pink-300/90',
    border: 'border-pink-300 dark:border-pink-400',
    text: 'text-pink-950',
    tape: 'bg-pink-400/70',
  },
  {
    bg: 'bg-sky-200 dark:bg-sky-300/90',
    border: 'border-sky-300 dark:border-sky-400',
    text: 'text-sky-950',
    tape: 'bg-sky-400/70',
  },
  {
    bg: 'bg-lime-200 dark:bg-lime-300/90',
    border: 'border-lime-300 dark:border-lime-400',
    text: 'text-lime-950',
    tape: 'bg-lime-400/70',
  },
  {
    bg: 'bg-orange-200 dark:bg-orange-300/90',
    border: 'border-orange-300 dark:border-orange-400',
    text: 'text-orange-950',
    tape: 'bg-orange-400/70',
  },
];

const getNoteStyle = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % NOTE_STYLES.length;
  return NOTE_STYLES[hash];
};

const Fiados: React.FC = () => {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    items: [] as string[],
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

  const addFormItem = () => {
    const item = newItem.trim();
    if (!item) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, item] }));
    setNewItem('');
  };

  const removeFormItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    try {
      await fiadosAPI.create({
        customer_name: form.customer_name,
        items: form.items,
        total: Number(form.total.replace(',', '.')) || 0,
        notes: form.notes,
      });
      toast.success('Nota de fiado criada');
      setForm({ customer_name: '', items: [], total: '', notes: '' });
      setNewItem('');
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
    if (!window.confirm('Excluir esta nota de fiado?')) return;
    try {
      await fiadosAPI.delete(id);
      toast.success('Nota excluída');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fiados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Anotações estilo post-it — cada item fica salvo na nota do cliente
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <PlusIcon className="h-5 w-5" />
          Nova nota
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="relative max-w-md mx-auto sm:mx-0 p-5 pt-8 rounded-sm border border-yellow-300 bg-yellow-200 shadow-lg rotate-[-1deg]"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-yellow-400/70 rounded-sm" />
          <h3 className="font-bold text-yellow-950 mb-3">Nova nota de fiado</h3>
          <input
            type="text"
            placeholder="Nome do cliente"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="w-full mb-3 px-3 py-2 border border-yellow-400/60 rounded bg-yellow-50 text-yellow-950 placeholder:text-yellow-700/60"
          />

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Adicionar item (ex: 2x Arroz)"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFormItem();
                }
              }}
              className="flex-1 px-3 py-2 border border-yellow-400/60 rounded bg-yellow-50 text-yellow-950 placeholder:text-yellow-700/60"
            />
            <button
              type="button"
              onClick={addFormItem}
              className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              +
            </button>
          </div>

          {form.items.length > 0 && (
            <ul className="mb-3 space-y-1">
              {form.items.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center justify-between gap-2 px-2 py-1 bg-yellow-100/80 rounded text-sm text-yellow-950"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeFormItem(index)}
                    className="text-yellow-800 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            type="text"
            placeholder="Valor total (opcional)"
            value={form.total}
            onChange={(e) => setForm({ ...form, total: e.target.value })}
            className="w-full mb-3 px-3 py-2 border border-yellow-400/60 rounded bg-yellow-50 text-yellow-950 placeholder:text-yellow-700/60"
          />
          <textarea
            placeholder="Observações (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full mb-3 px-3 py-2 border border-yellow-400/60 rounded bg-yellow-50 text-yellow-950 placeholder:text-yellow-700/60"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Fixar nota
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-yellow-500 rounded-lg text-yellow-950"
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
          {tab === 'ativos' ? 'Nenhuma nota em aberto' : 'Nenhuma nota arquivada'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-2">
          {visibleFiados.map((fiado, index) => {
            const style = getNoteStyle(fiado.id);
            const rotation = index % 2 === 0 ? 'rotate-[-1.5deg]' : 'rotate-[1.5deg]';

            return (
              <div
                key={fiado.id}
                className={`relative p-5 pt-8 rounded-sm border shadow-lg ${rotation} ${style.bg} ${style.border} ${style.text} ${
                  fiado.status === 'paid' ? 'opacity-80' : ''
                }`}
              >
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 rounded-sm ${style.tape}`} />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{fiado.customer_name}</h3>
                    <p className="text-xs opacity-70 mt-1">
                      {fiado.status === 'paid' ? 'Quitado em' : 'Desde'}{' '}
                      {formatDate(fiado.status === 'paid' ? fiado.paid_at : fiado.created_at)}
                    </p>
                  </div>
                  {fiado.status === 'paid' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-600 text-white shrink-0">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Quitado
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5 mb-3">
                  {fiado.items.map((item, itemIndex) => (
                    <li
                      key={`${fiado.id}-${itemIndex}`}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {fiado.notes && (
                  <p className="text-xs italic opacity-75 border-t border-current/20 pt-2 mb-3">
                    {fiado.notes}
                  </p>
                )}

                {fiado.total > 0 && (
                  <p className="font-bold text-base mb-3">{formatCurrency(fiado.total)}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-current/15">
                  {fiado.status === 'open' ? (
                    <button
                      onClick={() => handleMarkPaid(fiado.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <ArchiveBoxIcon className="h-3.5 w-3.5" />
                      Quitado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopen(fiado.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-current/30 rounded-lg"
                    >
                      <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                      Reabrir
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(fiado.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100/50 rounded-lg"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Fiados;
