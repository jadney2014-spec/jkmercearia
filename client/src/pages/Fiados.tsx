import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusCircleIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  PencilSquareIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { fiadosAPI, Fiado, FiadoItem } from '../services/fiadosAPI';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const GENDER_STYLES = {
  M: {
    bg: 'bg-sky-200 dark:bg-sky-300/90',
    border: 'border-sky-300 dark:border-sky-400',
    text: 'text-sky-950',
    label: 'text-sky-800',
    inputBg: 'bg-sky-50',
    inputBorder: 'border-sky-400/40',
    tape: 'bg-sky-400/70',
    accent: 'bg-sky-400/20',
    accentBorder: 'border-sky-400/30',
    accentText: 'text-sky-900',
    button: 'bg-sky-600 hover:bg-sky-700',
    icon: 'text-sky-700',
    hover: 'hover:bg-sky-100/50',
    divider: 'divide-sky-400/10',
    totalBg: 'bg-sky-400/40',
    totalBorder: 'border-sky-500/20',
  },
  F: {
    bg: 'bg-pink-200 dark:bg-pink-300/90',
    border: 'border-pink-300 dark:border-pink-400',
    text: 'text-pink-950',
    label: 'text-pink-800',
    inputBg: 'bg-pink-50',
    inputBorder: 'border-pink-400/40',
    tape: 'bg-pink-400/70',
    accent: 'bg-pink-400/20',
    accentBorder: 'border-pink-400/30',
    accentText: 'text-pink-900',
    button: 'bg-pink-600 hover:bg-pink-700',
    icon: 'text-pink-700',
    hover: 'hover:bg-pink-100/50',
    divider: 'divide-pink-400/10',
    totalBg: 'bg-pink-400/40',
    totalBorder: 'border-pink-500/20',
  },
  O: {
    bg: 'bg-yellow-200 dark:bg-yellow-300/90',
    border: 'border-yellow-300 dark:border-yellow-400',
    text: 'text-yellow-950',
    label: 'text-yellow-800',
    inputBg: 'bg-yellow-50',
    inputBorder: 'border-yellow-400/40',
    tape: 'bg-yellow-400/70',
    accent: 'bg-yellow-400/20',
    accentBorder: 'border-yellow-400/30',
    accentText: 'text-yellow-900',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    icon: 'text-yellow-700',
    hover: 'hover:bg-yellow-100/50',
    divider: 'divide-yellow-400/10',
    totalBg: 'bg-yellow-400/40',
    totalBorder: 'border-yellow-500/20',
  },
};

const getNoteStyle = (gender?: string) => {
  return GENDER_STYLES[gender as 'M' | 'F' | 'O'] || GENDER_STYLES.O;
};

const Fiados: React.FC = () => {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [showForm, setShowForm] = useState(false);
  const [editingFiado, setEditingFiado] = useState<Fiado | null>(null);
  const [newItem, setNewItem] = useState({ 
    text: '', 
    date: new Date().toISOString().split('T')[0],
    price: '' 
  });
  const [form, setForm] = useState({
    customer_name: '',
    gender: 'O' as 'M' | 'F' | 'O',
    items: [] as FiadoItem[],
    total: '0',
    notes: '',
  });

  const currentFormStyle = getNoteStyle(form.gender);

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

  useEffect(() => {
    if (editingFiado) {
      setForm({
        customer_name: editingFiado.customer_name,
        gender: editingFiado.gender || 'O',
        items: editingFiado.items.map(i => ({
          text: i.text,
          date: i.date instanceof Date ? i.date.toISOString() : String(i.date),
          price: i.price || 0
        })),
        total: editingFiado.total.toFixed(2),
        notes: editingFiado.notes || '',
      });
      setShowForm(true);
    }
  }, [editingFiado]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
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
      const data = {
        customer_name: form.customer_name,
        gender: form.gender,
        items: form.items,
        total: Number(form.total.replace(',', '.')) || 0,
        notes: form.notes,
      };

      if (editingFiado) {
        await fiadosAPI.update(editingFiado.id, data);
        toast.success('Nota atualizada');
      } else {
        await fiadosAPI.create(data);
        toast.success('Nota de fiado criada');
      }

      setForm({ customer_name: '', gender: 'O', items: [], total: '0', notes: '' });
      setNewItem({ text: '', date: new Date().toISOString().split('T')[0], price: '' });
      setShowForm(false);
      setEditingFiado(null);
      await loadData();
    } catch {
      toast.error(editingFiado ? 'Erro ao atualizar nota' : 'Erro ao registrar fiado');
    }
  };

  const startEdit = (fiado: Fiado) => {
    setEditingFiado(fiado);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingFiado(null);
    setForm({ customer_name: '', gender: 'O', items: [], total: '0', notes: '' });
    setNewItem({ text: '', date: new Date().toISOString().split('T')[0], price: '' });
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

  const activeFiados = fiados.filter((f) => f.status === 'open');
  const archivedFiados = fiados.filter((f) => f.status === 'paid');
  const visibleFiados = tab === 'ativos' ? activeFiados : archivedFiados;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date?: Date | string) => {
    if (!date) return '—';
    try {
      const dObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dObj.getTime())) return '—';

      const d = dObj.getDate().toString().padStart(2, '0');
      const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
      const y = dObj.getFullYear();
      const h = dObj.getHours().toString().padStart(2, '0');
      const min = dObj.getMinutes().toString().padStart(2, '0');

      return `${d}/${m}/${y} ${h}:${min}`;
    } catch {
      return '—';
    }
  };

  const addFormItem = () => {
    const text = newItem.text.trim();
    if (!text) return;
    
    const price = Number(newItem.price.replace(',', '.')) || 0;
    const currentTotal = Number(form.total.replace(',', '.')) || 0;
    
    // Se a data escolhida for hoje, incluímos o horário atual
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = newItem.date === todayStr;
    
    const itemDate = isToday ? now.toISOString() : `${newItem.date}T12:00:00`;
    
    setForm((prev) => ({ 
      ...prev, 
      items: [...prev.items, { text, date: itemDate, price }],
      total: (currentTotal + price).toFixed(2)
    }));
    
    setNewItem({ text: '', date: todayStr, price: '' });
  };

  const removeFormItem = (index: number) => {
    const itemToRemove = form.items[index];
    const priceToRemove = itemToRemove.price || 0;
    const currentTotal = Number(form.total.replace(',', '.')) || 0;
    
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      total: Math.max(0, currentTotal - priceToRemove).toFixed(2)
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fiados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controle de notas com soma automática de valores
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingFiado(null);
            setForm({ customer_name: '', gender: 'O', items: [], total: '0', notes: '' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Nova nota
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateOrUpdate}
          className={`relative max-w-md mx-auto sm:mx-0 p-6 pt-10 rounded-sm border-2 shadow-2xl rotate-[-0.5deg] z-50 transition-all ${currentFormStyle.bg} ${currentFormStyle.border}`}
        >
          <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-7 rounded-sm border-b-2 border-black/10 ${currentFormStyle.tape}`} />
          <h3 className={`font-black mb-4 text-xl uppercase tracking-tighter ${currentFormStyle.text}`}>
            {editingFiado ? '📝 Editando nota' : '📌 Nova nota'}
          </h3>
          
          <label className={`text-[10px] font-black uppercase ml-1 ${currentFormStyle.label}`}>Cliente</label>
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              placeholder="Nome do cliente"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className={`flex-1 px-3 py-2 border-2 rounded outline-none font-bold text-lg ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder} focus:border-current`}
            />
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
              className={`px-2 py-2 border-2 rounded font-bold outline-none ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder} focus:border-current`}
            >
              <option value="O">👤 Outro</option>
              <option value="M">👨 Homem</option>
              <option value="F">👩 Mulher</option>
            </select>
          </div>

          <div className={`p-4 rounded-lg border-2 mb-5 ${currentFormStyle.accent} ${currentFormStyle.accentBorder}`}>
            <p className={`text-[11px] font-black uppercase mb-3 flex items-center gap-1 ${currentFormStyle.accentText}`}>
              🚀 Lançamento Rápido
            </p>
            <input
              type="text"
              placeholder="O que o cliente levou?"
              value={newItem.text}
              onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
              className={`w-full mb-3 px-3 py-2 border-2 rounded outline-none font-medium ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder}`}
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CurrencyDollarIcon className={`absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 ${currentFormStyle.icon}`} />
                <input
                  type="text"
                  placeholder="0,00"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className={`w-full pl-8 pr-3 py-2 border-2 rounded font-black text-lg outline-none ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder}`}
                />
              </div>
              <input
                type="date"
                value={newItem.date}
                onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                className={`w-32 px-2 py-2 border-2 rounded text-xs font-bold outline-none ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder}`}
              />
              <button
                type="button"
                onClick={addFormItem}
                className={`px-4 py-2 text-white rounded-lg font-black shadow-lg active:scale-95 transition-transform ${currentFormStyle.button}`}
              >
                +
              </button>
            </div>
          </div>

          {form.items.length > 0 && (
            <div className={`mb-5 rounded-lg border-2 max-h-48 overflow-y-auto shadow-inner ${currentFormStyle.inputBg} ${currentFormStyle.accentBorder}`}>
              <ul className={`divide-y-2 ${currentFormStyle.divider}`}>
                {form.items.map((item, index) => (
                  <li
                    key={`${item.text}-${index}`}
                    className={`flex items-center justify-between gap-2 px-4 py-2 transition-colors ${currentFormStyle.hover}`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold leading-tight ${currentFormStyle.text}`}>{item.text}</span>
                      <span className={`text-[10px] font-bold ${currentFormStyle.label}`}>📅 {formatDate(item.date)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`font-black text-sm ${currentFormStyle.accentText}`}>{formatCurrency(item.price || 0)}</span>
                       <button
                        type="button"
                        onClick={() => removeFormItem(index)}
                        className="text-red-600 hover:scale-125 transition-transform p-1"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className={`p-3 rounded-lg border-2 shadow-md ${currentFormStyle.totalBg} ${currentFormStyle.totalBorder}`}>
               <label className={`text-[10px] font-black uppercase block mb-1 ${currentFormStyle.text}`}>TOTAL DEVIDO</label>
               <div className="flex items-center gap-1">
                 <span className={`font-black text-xl ${currentFormStyle.text}`}>R$</span>
                 <input
                   type="text"
                   value={form.total}
                   onChange={(e) => setForm({ ...form, total: e.target.value })}
                   className={`w-full bg-transparent outline-none font-black text-2xl tracking-tighter ${currentFormStyle.text}`}
                 />
               </div>
             </div>
             <div className="flex flex-col">
                <label className={`text-[10px] font-black uppercase ml-1 block mb-1 ${currentFormStyle.text}`}>Observação</label>
                <textarea
                  placeholder="..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border-2 rounded text-xs font-medium outline-none focus:border-current ${currentFormStyle.inputBg} ${currentFormStyle.text} ${currentFormStyle.inputBorder}`}
                />
             </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 px-4 py-4 bg-green-700 text-white rounded-xl hover:bg-green-800 font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">
              {editingFiado ? '✅ Salvar Tudo' : '📌 Fixar Nota'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className={`px-6 py-4 border-2 rounded-xl hover:bg-black/5 font-black uppercase text-xs ${currentFormStyle.text} ${currentFormStyle.border}`}
            >
              Sair
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-4 border-b-2 border-gray-200 dark:border-gray-700 mb-8">
        <button
          onClick={() => setTab('ativos')}
          className={`pb-3 px-2 text-sm font-black transition-all relative ${
            tab === 'ativos' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          NOTAS EM ABERTO ({activeFiados.length})
          {tab === 'ativos' && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab('arquivados')}
          className={`pb-3 px-2 text-sm font-black transition-all relative ${
            tab === 'arquivados' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          HISTÓRICO QUITADO ({archivedFiados.length})
          {tab === 'arquivados' && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-full" />}
        </button>
      </div>

      {visibleFiados.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
          <p className="text-xl font-black uppercase opacity-20 italic">Nada pendente por aqui!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 p-2">
          {visibleFiados.map((fiado, index) => {
            const style = getNoteStyle(fiado.gender);
            const rotation = index % 2 === 0 ? 'rotate-[-1.5deg]' : 'rotate-[1.5deg]';

            return (
              <div
                key={fiado.id}
                className={`relative p-8 pt-12 rounded-sm border-2 shadow-2xl ${rotation} ${style.bg} ${style.border} ${style.text} ${
                  fiado.status === 'paid' ? 'opacity-80' : ''
                } transition-all hover:rotate-0 hover:scale-[1.05] hover:z-30 cursor-default`}
              >
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 opacity-90 shadow-sm ${style.tape}`} />

                <div className="flex items-start justify-between gap-2 mb-6">
                  <div>
                    <h3 className="font-black text-2xl leading-none uppercase tracking-tighter mb-2">{fiado.customer_name}</h3>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black opacity-60 uppercase flex items-center gap-1">
                          📌 Criada em: {formatDate(fiado.created_at)}
                       </p>
                       {fiado.status === 'paid' && (
                         <p className="text-[10px] text-green-700 font-black uppercase flex items-center gap-1 bg-green-100/40 px-2 py-0.5 rounded-full w-fit border border-green-700/20">
                            ✅ Paga em: {formatDate(fiado.paid_at)}
                         </p>
                       )}
                    </div>
                  </div>
                  {fiado.status === 'paid' && (
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-black rounded border-2 border-green-700 bg-white text-green-700 shadow-sm rotate-12">
                      PAGO!
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-8 bg-black/5 p-4 rounded-xl border-2 border-black/5 shadow-inner min-h-[80px]">
                   <p className="text-[9px] uppercase font-black opacity-30 mb-2 border-b-2 border-current/10 pb-1 tracking-widest">Resumo da Conta:</p>
                  {fiado.items.map((item, itemIndex) => (
                    <div
                      key={`${fiado.id}-${itemIndex}`}
                      className="flex items-center justify-between gap-2 border-l-4 border-current/20 pl-3 py-1 bg-white/10 rounded-r-md"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-sm leading-tight">{item.text}</span>
                        <span className="text-[9px] font-bold opacity-50 uppercase">
                           📅 {formatDate(item.date)}
                        </span>
                      </div>
                      {item.price && item.price > 0 ? (
                        <span className="font-black text-xs opacity-90">{formatCurrency(item.price)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {fiado.notes && (
                  <div className="mb-6 text-xs italic font-bold opacity-60 border-t-2 border-current/10 pt-3 px-2 leading-relaxed">
                    "{fiado.notes}"
                  </div>
                )}

                <div className="flex flex-col mb-8 bg-white/40 p-4 rounded-xl border-2 border-white/60 shadow-lg">
                  <span className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-1">Valor Total Devido</span>
                  <p className="font-black text-3xl tracking-tighter">{formatCurrency(fiado.total)}</p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t-2 border-current/10">
                  {fiado.status === 'open' && (
                    <button
                      onClick={() => startEdit(fiado)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] bg-white/60 hover:bg-white rounded-lg border-2 border-current/10 transition-all font-black shrink-0"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      EDITAR
                    </button>
                  )}
                  {fiado.status === 'open' ? (
                    <button
                      onClick={() => handleMarkPaid(fiado.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] bg-green-700 text-white rounded-lg hover:bg-green-800 font-black shadow-xl transition-all flex-1 justify-center active:scale-95"
                    >
                      <ArchiveBoxIcon className="h-4 w-4" />
                      QUITAR CONTA
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopen(fiado.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] border-2 border-current/40 rounded-lg font-black transition-all hover:bg-white/40 flex-1 justify-center"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      REABRIR
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(fiado.id)}
                    className="inline-flex items-center justify-center p-2 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-all border-2 border-red-600/20 hover:border-red-600 shrink-0 shadow-sm"
                    title="Excluir nota"
                  >
                    <TrashIcon className="h-5 w-5" />
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