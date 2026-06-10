import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { escalasAPI, ministeriosAPI, rotacoesAPI } from '../services/scalesAPI';
import { membersAPI } from '../services/api';
import type { Escala, EscalaFormData, Ministerio } from '../types/Scale';
import { CHURCH_ROLES } from '../types/ChurchRole';
import Modal from '../components/Modal';
import Button from '../components/Button';
import ScaleWhatsApp from '../components/ScaleWhatsApp';
import ScaleSubstitution from '../components/ScaleSubstitution';
import { toast } from 'react-toastify';

const normalize = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const MIDIA_RES_GATE_NOME = 'midia resgate';

const MIDIA_ATRIBUICOES = [
  'Projeção',
  'Transmissão',
  'Fotografia',
  'Vídeos/Instagram',
  'Iluminação',
  'Banners',
  'Vídeos das células',
];

const Scales: React.FC = () => {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('');
  const [formData, setFormData] = useState<EscalaFormData>({
    ministerio_id: '',
    data: '',
    hora: '',
    membros: [],
    observacoes: '',
  });

  const selectedMinisterioNome = (ministerios.find(m => m.id === formData.ministerio_id)?.nome || '');
  const isMidiaResgate = normalize(selectedMinisterioNome) === MIDIA_RES_GATE_NOME;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [escalasData, ministeriosData, membersData] = await Promise.all([
        escalasAPI.getEscalas(),
        ministeriosAPI.getMinisterios(),
        membersAPI.getMembers(),
      ]);
      setEscalas(escalasData);
      setMinisterios(ministeriosData);
      setMembers(membersData.data?.members || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ministerio = ministerios.find(m => m.id === formData.ministerio_id);
      if (!ministerio) {
        toast.error('Ministério não encontrado');
        return;
      }

      if (normalize(ministerio.nome) === MIDIA_RES_GATE_NOME) {
        const invalidIndex = (formData.membros || []).findIndex((m: any) => !String(m?.atribuicao || '').trim());
        if (invalidIndex !== -1) {
          toast.error(`Selecione a atribuição do membro ${invalidIndex + 1} (Mídia Resgate).`);
          return;
        }
      }

      if (editingEscala) {
        await escalasAPI.updateEscala(editingEscala.id, formData);
        toast.success('Escala atualizada com sucesso!');
      } else {
        await escalasAPI.createEscala(formData, ministerio.nome);
        toast.success('Escala criada com sucesso!');
      }
      setShowForm(false);
      setEditingEscala(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      toast.error('Erro ao salvar escala');
    }
  };

  const handleEdit = (escala: Escala) => {
    setEditingEscala(escala);
    setFormData({
      ministerio_id: escala.ministerio_id,
      data: (() => {
        // Corrigir problema de timezone ao editar
        const date = new Date(escala.data);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })(),
      hora: String((escala as any).hora || ''),
      membros: escala.membros.map(m => ({
        membro_id: m.membro_id,
        funcao: m.funcao,
        atribuicao: (m as any).atribuicao || '',
        status: m.status,
        observacoes: m.observacoes,
      })),
      observacoes: escala.observacoes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta escala?')) {
      return;
    }
    try {
      await escalasAPI.deleteEscala(id);
      toast.success('Escala deletada com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar escala:', error);
      toast.error('Erro ao deletar escala');
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedMinisterio) {
      toast.error('Selecione um ministério');
      return;
    }

    const ministerio = ministerios.find(m => m.id === selectedMinisterio);
    if (!ministerio) {
      toast.error('Ministério não encontrado');
      return;
    }

    try {
      // Calcular próxima data baseada na frequência
      const hoje = new Date();
      const proximaData = new Date(hoje);

      if (ministerio.frequencia === 'semanal' && ministerio.dia_semana !== undefined) {
        let diasParaProximo = (ministerio.dia_semana - hoje.getDay() + 7) % 7;
        if (diasParaProximo === 0) diasParaProximo = 7; // Próxima semana
        proximaData.setDate(hoje.getDate() + diasParaProximo);
      } else if (ministerio.frequencia === 'quinzenal') {
        proximaData.setDate(hoje.getDate() + 14);
      } else if (ministerio.frequencia === 'mensal' && ministerio.dia_mes) {
        proximaData.setDate(ministerio.dia_mes);
        if (proximaData < hoje) {
          proximaData.setMonth(proximaData.getMonth() + 1);
        }
      }

      const escalaData = await rotacoesAPI.gerarProximaEscala(
        selectedMinisterio,
        proximaData,
        ministerio.funcoes
      );

      if (escalaData) {
        await escalasAPI.createEscala(escalaData, ministerio.nome);
        toast.success('Escala gerada automaticamente!');
        setShowAutoGenerate(false);
        setSelectedMinisterio('');
        loadData();
      }
    } catch (error) {
      console.error('Erro ao gerar escala:', error);
      toast.error('Erro ao gerar escala automaticamente');
    }
  };

  const resetForm = () => {
    setFormData({
      ministerio_id: '',
      data: '',
      hora: '',
      membros: [],
      observacoes: '',
    });
  };

  const addMemberToEscala = () => {
    const newMember = {
      membro_id: '',
      funcao: '',
      atribuicao: '',
      status: 'pendente' as const,
    };
    setFormData((prev) => ({
      ...prev,
      membros: [...prev.membros, newMember],
    }));
  };

  const updateMemberField = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedMembers = [...prev.membros];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };
      return {
        ...prev,
        membros: updatedMembers,
      };
    });
  };

  const removeMemberFromEscala = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      membros: prev.membros.filter((_: any, i: number) => i !== index),
    }));
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Nome não encontrado';
  };

  const getMinisterioName = (ministerioId: string) => {
    const ministerio = ministerios.find(m => m.id === ministerioId);
    return ministerio?.nome || 'Ministério não encontrado';
  };

  const formatDate = (date: Date | string) => {
    // Corrigir problema de timezone - criar data local sem conversão UTC
    let d: Date;
    if (typeof date === 'string') {
      // Se for string no formato ISO ou YYYY-MM-DD, criar data local
      const dateStr = date.split('T')[0]; // Remove hora se houver
      const [year, month, day] = dateStr.split('-').map(Number);
      d = new Date(year, month - 1, day); // month é 0-indexed
    } else {
      d = new Date(date);
      // Criar nova data local para evitar problemas de timezone
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'concluida':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'cancelada':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando escalas...</p>
        </div>
      </div>
    );
  }

  // Filtrar escalas futuras e passadas (corrigido para timezone)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  
  const escalasFuturas = escalas.filter(e => {
    const escalaDate = new Date(e.data);
    const escalaLocal = new Date(escalaDate.getFullYear(), escalaDate.getMonth(), escalaDate.getDate());
    return escalaLocal >= hojeLocal;
  });
  
  const escalasPassadas = escalas.filter(e => {
    const escalaDate = new Date(e.data);
    const escalaLocal = new Date(escalaDate.getFullYear(), escalaDate.getMonth(), escalaDate.getDate());
    return escalaLocal < hojeLocal;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Escalas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as escalas dos ministérios
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setEditingEscala(null);
              setShowForm(true);
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nova Escala
          </Button>
          <Button
            onClick={() => setShowAutoGenerate(true)}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-5 w-5" />
            Gerar Automático
          </Button>
        </div>
      </div>

      {/* Escalas Futuras */}
      {escalasFuturas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximas Escalas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalasFuturas.map((escala) => (
              <div
                key={escala.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {escala.ministerio_nome}
                      </h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(escala.data)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          escala.status
                        )}`}
                      >
                        {getStatusIcon(escala.status)}
                        {escala.status.charAt(0).toUpperCase() + escala.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ScaleWhatsApp escala={escala} className="!px-2 !py-1 text-xs" />
                    <button
                      onClick={() => handleEdit(escala)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      aria-label="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(escala.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Deletar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Membros Escalados
                  </p>
                  <div className="space-y-2">
                    {escala.membros.map((membro, index) => {
                      const isSubstituido = membro.status === 'substituido';
                      const isSubstituto = escala.membros.some(m => 
                        m.substituido_por === membro.membro_id
                      );
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                            isSubstituido 
                              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                              : isSubstituto
                              ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                isSubstituido 
                                  ? 'text-orange-700 dark:text-orange-300 line-through'
                                  : isSubstituto
                                  ? 'text-purple-700 dark:text-purple-300'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {membro.membro_nome}
                              </span>
                              {isSubstituido && (
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  (Substituído)
                                </span>
                              )}
                              {isSubstituto && (
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                  (Substituto)
                                </span>
                              )}
                            </div>
                            {membro.observacoes && membro.observacoes.includes('Substituição') && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {membro.observacoes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              isSubstituido
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : isSubstituto
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                            }`}>
                              {membro.funcao}
                            </span>
                            {membro.status === 'confirmado' && (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            )}
                            {membro.status === 'pendente' && (
                              <ClockIcon className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalas Passadas */}
      {escalasPassadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Escalas Passadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalasPassadas.slice(0, 6).map((escala) => (
              <div
                key={escala.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {escala.ministerio_nome}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(escala.data)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {escalas.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Nenhuma escala encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando uma nova escala ou gerando automaticamente.
          </p>
        </div>
      )}

      {/* Modal de Formulário */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingEscala(null);
          resetForm();
        }}
        title={editingEscala ? 'Editar Escala' : 'Nova Escala'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4 pb-28">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ministério *
            </label>
            <select
              required
              value={formData.ministerio_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, ministerio_id: e.target.value }))}
              className="input w-full"
            >
              <option value="">Selecione um ministério</option>
              {ministerios
                .filter(m => m.ativo)
                .map((ministerio) => (
                  <option key={ministerio.id} value={ministerio.id}>
                    {ministerio.nome}
                  </option>
                ))}
            </select>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
              className="input w-full"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Horário
            </label>
            <input
              type="time"
              value={String((formData as any).hora || '')}
              onChange={(e) => setFormData((prev) => ({ ...prev, hora: e.target.value }))}
              className="input w-full"
              step={60}
            />
            </div>

            <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Membros Escalados *
              </label>
              <Button type="button" onClick={addMemberToEscala} variant="secondary" size="sm">
                Adicionar Membro
              </Button>
            </div>
            <div className="space-y-3">
              {formData.membros.map((membro, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                  {/* Seleção de Função (primeiro) */}
                  <select
                    required
                    value={membro.funcao}
                    onChange={(e) =>
                      updateMemberField(index, 'funcao', e.target.value)
                    }
                    className="input w-full sm:flex-1 sm:min-w-[180px]"
                    title="Selecione a função da igreja"
                  >
                    <option value="">Selecione a função</option>
                    {CHURCH_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Seleção de Membro (segundo) */}
                  <select
                    required
                    value={membro.membro_id}
                    onChange={(e) =>
                      updateMemberField(index, 'membro_id', e.target.value)
                    }
                    className="input w-full sm:flex-1"
                    title="Selecione o membro"
                  >
                    <option value="">Selecione o membro</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>

                  {/* Atribuição (somente Mídia Resgate) */}
                  {!isMidiaResgate ? null : (
                    <select
                      required
                      value={(membro as any).atribuicao || ''}
                      onChange={(e) => updateMemberField(index, 'atribuicao', e.target.value)}
                      className="input w-full sm:flex-1 sm:min-w-[180px]"
                      title="Selecione a atribuição (Mídia Resgate)"
                    >
                      <option value="">Atribuição</option>
                      {MIDIA_ATRIBUICOES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Botão Remover */}
                  <button
                    type="button"
                    onClick={() => removeMemberFromEscala(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Remover membro"
                    aria-label="Remover membro"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="Observações sobre a escala..."
            />
          </div>
          </div>

          <div
            className="sticky bottom-20 md:bottom-0 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-3 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
          >
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingEscala ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingEscala(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Geração Automática */}
      <Modal
        isOpen={showAutoGenerate}
        onClose={() => {
          setShowAutoGenerate(false);
          setSelectedMinisterio('');
        }}
        title="Gerar Escala Automaticamente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ministério *
            </label>
            <select
              required
              value={selectedMinisterio}
              onChange={(e) => setSelectedMinisterio(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione um ministério</option>
              {ministerios
                .filter(m => m.ativo)
                .map((ministerio) => (
                  <option key={ministerio.id} value={ministerio.id}>
                    {ministerio.nome}
                  </option>
                ))}
            </select>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Uma nova escala será gerada automaticamente baseada na rotação configurada do
            ministério selecionado.
          </p>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleAutoGenerate} className="flex-1">
              Gerar Escala
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAutoGenerate(false);
                setSelectedMinisterio('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Scales;
