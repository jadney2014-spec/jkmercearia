import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  CalendarIcon,
  CheckIcon,
  BanknotesIcon,
  HomeIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { savingsAPI, SavingsGoal, SavingsCompletion } from '../services/savingsAPI';
import { formatDateOnlyPtBr, parseDateOnly } from '../utils/dateOnly';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const colorThemes = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    progress: 'bg-emerald-600 dark:bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    glow: 'shadow-emerald-100 dark:shadow-emerald-950/20',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    progress: 'bg-amber-600 dark:bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    glow: 'shadow-amber-100 dark:shadow-amber-950/20',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    progress: 'bg-indigo-600 dark:bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    glow: 'shadow-indigo-100 dark:shadow-indigo-950/20',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    progress: 'bg-rose-600 dark:bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    glow: 'shadow-rose-100 dark:shadow-rose-950/20',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    progress: 'bg-blue-600 dark:bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    glow: 'shadow-blue-100 dark:shadow-blue-950/20',
  },
};

const initialForm = {
  title: '',
  description: '',
  amountPerInterval: '',
  intervalDays: '1',
  startDate: '',
  hasTarget: false,
  targetValue: '',
  color: 'emerald' as keyof typeof colorThemes,
  icon: 'piggy' as 'piggy' | 'home' | 'chart' | 'wallet',
};

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await savingsAPI.getAll();
      setGoals(data);
      // Atualizar o selecionado caso ele exista na lista atualizada
      if (selectedGoal) {
        const updated = data.find((g) => g.id === selectedGoal.id);
        setSelectedGoal(updated || null);
      }
    } catch (error) {
      toast.error('Erro ao carregar metas de poupança');
    } finally {
      setLoading(false);
    }
  }, [selectedGoal]);

  useEffect(() => {
    loadData();
  }, []);

  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      startDate: getTodayStr(),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (goal: SavingsGoal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(goal);
    setForm({
      title: goal.title,
      description: goal.description || '',
      amountPerInterval: String(goal.amountPerInterval),
      intervalDays: String(goal.intervalDays),
      startDate: goal.startDate,
      hasTarget: !!goal.targetValue,
      targetValue: goal.targetValue ? String(goal.targetValue) : '',
      color: goal.color,
      icon: goal.icon,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Informe o título do plano');
      return;
    }
    const amount = Number(form.amountPerInterval.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor de aporte válido e maior que zero');
      return;
    }
    const days = Number(form.intervalDays);
    if (isNaN(days) || days <= 0) {
      toast.error('Frequência inválida');
      return;
    }
    if (!form.startDate) {
      toast.error('Informe a data de início');
      return;
    }

    let target: number | null = null;
    if (form.hasTarget) {
      target = Number(form.targetValue.replace(',', '.'));
      if (isNaN(target) || target <= 0) {
        toast.error('Informe um valor final válido para a meta');
        return;
      }
    }

    try {
      setSaving(true);
      if (editing) {
        // Preserva completions
        await savingsAPI.update(editing.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          amountPerInterval: amount,
          intervalDays: days,
          startDate: form.startDate,
          targetValue: target,
          color: form.color,
          icon: form.icon,
        });
        toast.success('Plano atualizado com sucesso!');
      } else {
        await savingsAPI.create({
          title: form.title.trim(),
          description: form.description.trim(),
          amountPerInterval: amount,
          intervalDays: days,
          startDate: form.startDate,
          targetValue: target,
          status: 'active',
          color: form.color,
          icon: form.icon,
          totalSaved: 0,
          completions: {},
        });
        toast.success('Novo plano de investimento criado!');
      }
      setShowModal(false);
      await loadData();
    } catch (error) {
      toast.error('Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir este plano e todo o seu histórico de depósitos?')) return;
    try {
      await savingsAPI.delete(id);
      toast.success('Plano excluído');
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
      }
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir plano');
    }
  };

  // Toggle de um slot de economia
  const handleToggleSlot = async (goal: SavingsGoal, slotKey: string, dateStr: string, slotValue: number) => {
    const completions = { ...goal.completions };
    const isCompleted = !!completions[slotKey]?.completed;
    
    let newTotal = goal.totalSaved;
    if (isCompleted) {
      delete completions[slotKey];
      newTotal = Math.max(0, newTotal - slotValue);
    } else {
      completions[slotKey] = {
        completed: true,
        value: slotValue,
        completedAt: new Date().toISOString(),
      };
      newTotal += slotValue;
    }

    // Se atingiu o valor final (caso exista), atualiza o status
    let newStatus = goal.status;
    if (goal.targetValue && newTotal >= goal.targetValue) {
      newStatus = 'completed';
    } else if (goal.status === 'completed' && (!goal.targetValue || newTotal < goal.targetValue)) {
      newStatus = 'active';
    }

    try {
      // Otimização de UI rápida local
      const updatedGoal = { ...goal, completions, totalSaved: newTotal, status: newStatus };
      setGoals(goals.map((g) => (g.id === goal.id ? updatedGoal : g)));
      if (selectedGoal?.id === goal.id) {
        setSelectedGoal(updatedGoal);
      }

      await savingsAPI.update(goal.id, {
        completions,
        totalSaved: newTotal,
        status: newStatus,
      });

      if (!isCompleted) {
        toast.success(`R$ ${slotValue.toFixed(2)} marcados como salvos para o dia ${formatDateOnlyPtBr(dateStr)}!`, {
          autoClose: 1500,
        });
      }
    } catch (error) {
      toast.error('Erro ao atualizar depósito');
      loadData(); // Reverte
    }
  };

  // Helper de cálculo de datas de slot
  const getSlotDateStr = (startDateStr: string, index: number, intervalDays: number): string => {
    try {
      const dt = parseDateOnly(startDateStr);
      if (isNaN(dt.getTime())) return startDateStr;
      dt.setDate(dt.getDate() + index * intervalDays);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return startDateStr;
    }
  };

  // Renderizador de Ícone correspondente
  const renderGoalIcon = (iconName: string, className = "h-6 w-6") => {
    switch (iconName) {
      case 'home':
        return <HomeIcon className={className} />;
      case 'chart':
        return <ChartBarIcon className={className} />;
      case 'wallet':
        return <ClipboardDocumentCheckIcon className={className} />;
      case 'piggy':
      default:
        return <BanknotesIcon className={className} />;
    }
  };

  // Computações estatísticas gerais
  const totalSavings = goals.reduce((sum, g) => sum + g.totalSaved, 0);
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading && goals.length === 0) return <LoadingSpinner />;

  // Geração de slots para o detalhe
  const detailSlots: { key: string; dateStr: string; label: string; value: number; completed: boolean }[] = [];
  if (selectedGoal) {
    const isFixedTarget = !!selectedGoal.targetValue;
    
    if (isFixedTarget && selectedGoal.targetValue) {
      const numSlots = Math.ceil(selectedGoal.targetValue / selectedGoal.amountPerInterval);
      for (let i = 0; i < numSlots; i++) {
        const dStr = getSlotDateStr(selectedGoal.startDate, i, selectedGoal.intervalDays);
        detailSlots.push({
          key: `slot_${i}`,
          dateStr: dStr,
          label: `Aporte ${i + 1}`,
          value: selectedGoal.amountPerInterval,
          completed: !!selectedGoal.completions[`slot_${i}`]?.completed,
        });
      }
    } else {
      // Meta aberta: Gerar slots dinamicamente de startDate até hoje + 7 dias futuros
      const startDt = parseDateOnly(selectedGoal.startDate);
      const endDt = new Date();
      endDt.setDate(endDt.getDate() + 7); // Mostrar 7 dias futuros para adiantar tarefas
      
      const diffTime = Math.abs(endDt.getTime() - startDt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Limitar a no mínimo 15 e no máximo 100 slots por vez
      const numSlots = Math.max(15, Math.min(100, Math.ceil(diffDays / selectedGoal.intervalDays)));
      
      for (let i = 0; i < numSlots; i++) {
        const dStr = getSlotDateStr(selectedGoal.startDate, i, selectedGoal.intervalDays);
        detailSlots.push({
          key: dStr, // chave por data para metas abertas
          dateStr: dStr,
          label: selectedGoal.intervalDays === 1 ? `Dia ${i + 1}` : `Intervalo ${i + 1}`,
          value: selectedGoal.amountPerInterval,
          completed: !!selectedGoal.completions[dStr]?.completed,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="h-7 w-7 text-amber-500 animate-pulse" />
            Faixas de Poupança & Investimentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Acompanhe seus planos de aportes diários, periódicos ou metas de despesas como o aluguel.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-md active:scale-95 shrink-0"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Novo Plano
        </button>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 shadow-md text-white">
          <p className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">
            Total Poupado Acumulado
          </p>
          <p className="text-2xl font-black mt-1 select-all">
            {formatCurrency(totalSavings)}
          </p>
          <p className="text-xs text-indigo-200 mt-1">
            Somatório de todos os seus cofres ativos
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <BanknotesIcon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Desafios Ativos
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {activeGoalsCount} plano(s)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Em andamento e recebendo aportes
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <CheckIcon className="h-6 w-6 text-green-500 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Metas Concluídas
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">
              {completedGoalsCount} concluída(s)
            </p>
            <p className="text-xs text-green-500 dark:text-green-400 mt-0.5">
              Parabéns! Foco nos objetivos
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-16 text-center">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300">Nenhum plano configurado</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Crie seu primeiro plano como "Meta Aluguel" ou "Cofre de R$ 50 diários" clicando no botão acima.
            </p>
          </div>
        ) : (
          goals.map((item) => {
            const theme = colorThemes[item.color] || colorThemes.emerald;
            const hasTarget = !!item.targetValue;
            const completionPercent = hasTarget && item.targetValue
              ? Math.min(100, Math.round((item.totalSaved / item.targetValue) * 100))
              : 0;

            const isSelected = selectedGoal?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedGoal(item)}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 ${
                  isSelected
                    ? `border-blue-500 ring-2 ring-blue-500/20`
                    : `border-gray-200 dark:border-gray-800`
                }`}
              >
                <div>
                  {/* Badge & Ações */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${theme.badge}`}>
                      {item.status === 'completed' ? 'Concluída' : 'Em andamento'}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => handleOpenEdit(item, e)}
                        className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-md transition-colors"
                        title="Editar"
                      >
                        <PencilSquareIcon className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Título & Descrição */}
                  <div className="mt-3 flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${theme.iconBg} ${theme.text}`}>
                      {renderGoalIcon(item.icon, "h-5 w-5")}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={item.description}>
                        {item.description || 'Sem descrição cadastrada'}
                      </p>
                    </div>
                  </div>

                  {/* Informações de Frequência */}
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100 dark:border-gray-800/80">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor do Aporte</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.amountPerInterval)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frequência</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-300">
                        {item.intervalDays === 1 ? 'Diário' : `A cada ${item.intervalDays} dias`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção de Progresso */}
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-gray-500">Acumulado</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {formatCurrency(item.totalSaved)}
                      {hasTarget && (
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                          {' '}
                          / {formatCurrency(item.targetValue || 0)}
                        </span>
                      )}
                    </span>
                  </div>

                  {hasTarget ? (
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <ArrowPathIcon className="h-3 w-3 animate-spin text-emerald-500" />
                      Meta contínua sem limite final
                    </div>
                  )}

                  {hasTarget && (
                    <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      <span>Progresso</span>
                      <span className={theme.text}>{completionPercent}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Painel Detalhado / Grid de Checkbox */}
      {selectedGoal && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6 animate-fade-in">
          {/* Header do Detalhe */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${colorThemes[selectedGoal.color].iconBg} ${colorThemes[selectedGoal.color].text}`}>
                  {renderGoalIcon(selectedGoal.icon, "h-5 w-5")}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tarefa & Calendário: {selectedGoal.title}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Data de início do plano: {formatDateOnlyPtBr(selectedGoal.startDate)}. 
                Marque abaixo para registrar os aportes realizados.
              </p>
            </div>
            <button
              onClick={() => setSelectedGoal(null)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-xs transition-all active:scale-95 shrink-0"
            >
              Fechar Detalhes
            </button>
          </div>

          {/* Grid de Tarefas/Slots */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
              <CalendarIcon className="h-4.5 w-4.5 text-blue-500" />
              Checklist de Depósitos
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {detailSlots.map((slot, idx) => {
                const theme = colorThemes[selectedGoal.color];
                return (
                  <div
                    key={slot.key}
                    onClick={() => handleToggleSlot(selectedGoal, slot.key, slot.dateStr, slot.value)}
                    className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                      slot.completed
                        ? `${theme.bg} ${theme.border} text-gray-900 dark:text-white`
                        : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {slot.label}
                      </span>
                      {slot.completed ? (
                        <CheckIcon className={`h-4.5 w-4.5 stroke-[3.5] ${theme.text}`} />
                      ) : (
                        <div className="h-4.5 w-4.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold opacity-80">
                        {formatDateOnlyPtBr(slot.dateStr)}
                      </p>
                      <p className={`text-sm font-extrabold ${slot.completed ? theme.text : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(slot.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!selectedGoal.targetValue && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 italic">
                * Para metas contínuas, os slots futuros são exibidos automaticamente com base no calendário.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Plano de Poupança' : 'Novo Plano de Poupança / Investimento'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome do Plano */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Título do Plano *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reserva Diária, Meta Aluguel, Troco das Vendas"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Descrição / Objetivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Guardar R$ 70 p/ fechar R$ 2.100 do aluguel"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor do Aporte */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Valor do Aporte (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="50,00"
                    value={form.amountPerInterval}
                    onChange={(e) => setForm({ ...form, amountPerInterval: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                {/* Frequência (Dias) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Frequência (Dias) *
                  </label>
                  <select
                    value={form.intervalDays}
                    onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="1">Diário (1 dia)</option>
                    <option value="3">A cada 3 dias</option>
                    <option value="7">Semanal (7 dias)</option>
                    <option value="15">Quinzenal (15 dias)</option>
                    <option value="30">Mensal (30 dias)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Data de Início */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    required
                  />
                </div>

                {/* Meta Final (Checkbox de Sim/Não) */}
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.hasTarget}
                      onChange={(e) => setForm({ ...form, hasTarget: e.target.checked, targetValue: e.target.checked ? form.targetValue : '' })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Definir Meta Final
                    </span>
                  </label>
                </div>
              </div>

              {/* Valor Alvo da Meta (Condicional) */}
              {form.hasTarget && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Valor Alvo Total (R$) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2100,00"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Isso calculará o checklist com o número correto de aportes necessários.
                  </p>
                </div>
              )}

              {/* Customização Visual */}
              <div className="grid grid-cols-2 gap-4">
                {/* Cor do Tema */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Cor do Tema
                  </label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="amber">Ouro Amber</option>
                    <option value="indigo">Roxo Indigo</option>
                    <option value="rose">Rosa Rose</option>
                    <option value="blue">Azul Marinho</option>
                  </select>
                </div>

                {/* Ícone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Estilo / Ícone
                  </label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    <option value="piggy">Cofre de Dinheiro</option>
                    <option value="home">Chave / Aluguel</option>
                    <option value="chart">Gráfico / Investimento</option>
                    <option value="wallet">Carteira / Tarefa</option>
                  </select>
                </div>
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
