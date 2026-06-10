import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { ministeriosAPI } from '../services/scalesAPI';
import { membersAPI } from '../services/api';
import type { Ministerio, MinisterioFormData } from '../types/Scale';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { toast } from 'react-toastify';

const Ministries: React.FC = () => {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMinisterio, setEditingMinisterio] = useState<Ministerio | null>(null);
  const [formData, setFormData] = useState<MinisterioFormData>({
    nome: '',
    descricao: '',
    funcoes: [],
    membros_habilitados: [],
    frequencia: 'semanal',
    dia_semana: 0,
    ativo: true,
  });
  const [newFuncao, setNewFuncao] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ministeriosData, membersData] = await Promise.all([
        ministeriosAPI.getMinisterios(),
        membersAPI.getMembers(),
      ]);
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
    
    // Validação básica
    if (!formData.nome || formData.nome.trim() === '') {
      toast.error('Nome do ministério é obrigatório');
      return;
    }

    try {
      console.log('ðŸ“ Iniciando salvamento do ministério...');
      console.log('ðŸ“ Dados do formulário:', formData);
      
      if (editingMinisterio) {
        console.log('ðŸ”„ Atualizando ministério:', editingMinisterio.id);
        await ministeriosAPI.updateMinisterio(editingMinisterio.id, formData);
        console.log('âœ… Ministério atualizado com sucesso');
        // Toast já é exibido pela API
      } else {
        console.log('âž• Criando novo ministério...');
        const result = await ministeriosAPI.createMinisterio(formData);
        console.log('ðŸ“ Resultado da criação:', result);
        
        if (!result) {
          console.error('âŒ Resultado null - criação falhou');
          // Se retornou null, houve erro (já foi exibido toast pela API)
          return;
        }
        console.log('âœ… Ministério criado com sucesso:', result.id);
        // Toast já é exibido pela API
      }
      
      setShowForm(false);
      setEditingMinisterio(null);
      resetForm();
      
      // Aguardar um pouco antes de recarregar para garantir que o Firestore atualizou
      setTimeout(() => {
        console.log('ðŸ”„ Recarregando lista de ministérios...');
        loadData();
      }, 500);
    } catch (error: any) {
      console.error('âŒ Erro ao salvar ministério:', error);
      console.error('âŒ Tipo do erro:', typeof error);
      console.error('âŒ Mensagem do erro:', error?.message);
      console.error('âŒ Stack do erro:', error?.stack);
      
      // Toast já foi exibido pela API, mas garantir que aparece
      const errorMessage = error?.message || 'Erro ao salvar ministério. Verifique o console para mais detalhes.';
      if (!errorMessage.includes('obrigatório')) {
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = (ministerio: Ministerio) => {
    setEditingMinisterio(ministerio);
    setFormData({
      nome: ministerio.nome,
      descricao: ministerio.descricao,
      funcoes: [...ministerio.funcoes],
      membros_habilitados: [...ministerio.membros_habilitados],
      frequencia: ministerio.frequencia,
      dia_semana: ministerio.dia_semana,
      dia_mes: ministerio.dia_mes,
      ativo: ministerio.ativo,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este ministério?')) {
      return;
    }
    try {
      await ministeriosAPI.deleteMinisterio(id);
      toast.success('Ministério deletado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar ministério:', error);
      toast.error('Erro ao deletar ministério');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      funcoes: [],
      membros_habilitados: [],
      frequencia: 'semanal',
      dia_semana: 0,
      ativo: true,
    });
    setNewFuncao('');
  };

  const addFuncao = () => {
    if (newFuncao.trim() && !formData.funcoes.includes(newFuncao.trim())) {
      setFormData((prev) => ({
        ...prev,
        funcoes: [...prev.funcoes, newFuncao.trim()],
      }));
      setNewFuncao('');
    }
  };

  const removeFuncao = (funcao: string) => {
    setFormData((prev) => ({
      ...prev,
      funcoes: prev.funcoes.filter((f) => f !== funcao),
    }));
  };

  const toggleMember = (memberId: string) => {
    setFormData((prev) => {
      const isSelected = prev.membros_habilitados.includes(memberId);
      return {
        ...prev,
        membros_habilitados: isSelected
          ? prev.membros_habilitados.filter((id) => id !== memberId)
          : [...prev.membros_habilitados, memberId],
      };
    });
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Nome não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando ministérios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Ministérios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os ministérios da igreja e configure escalas
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingMinisterio(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Novo Ministério
        </Button>
      </div>

      {ministerios.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MusicalNoteIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum ministério encontrado
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Comece criando um novo ministério.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {ministerios.map((ministerio) => (
            <div
              key={ministerio.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MusicalNoteIcon className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ministerio.nome}
                    </h3>
                    {!ministerio.ativo && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-300">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {ministerio.descricao}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ministerio)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Editar"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ministerio.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Deletar"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Funções
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {ministerio.funcoes.map((funcao) => (
                      <span
                        key={funcao}
                        className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded dark:bg-primary-900 dark:text-primary-200"
                      >
                        {funcao}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Membros
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {ministerio.membros_habilitados.length} membro(s)
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Frequência
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {ministerio.frequencia}
                      {ministerio.dia_semana !== undefined && (
                        <span className="ml-1">
                          - {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][ministerio.dia_semana]}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingMinisterio(null);
          resetForm();
        }}
        title={editingMinisterio ? 'Editar Ministério' : 'Novo Ministério'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Ministério *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              className="input w-full"
              placeholder="Ex: Louvor, Som, Recepção"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="Descreva o ministério..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Funções
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFuncao}
                onChange={(e) => setNewFuncao(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFuncao())}
                className="input flex-1"
                placeholder="Ex: Vocal, Instrumentista, Técnico"
              />
              <Button type="button" onClick={addFuncao}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.funcoes.map((funcao) => (
                <span
                  key={funcao}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary-100 text-primary-800 rounded dark:bg-primary-900 dark:text-primary-200"
                >
                  {funcao}
                  <button
                    type="button"
                    onClick={() => removeFuncao(funcao)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequência
            </label>
            <select
              value={formData.frequencia}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frequencia: e.target.value as 'semanal' | 'quinzenal' | 'mensal',
                }))
              }
              className="input w-full"
            >
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          {formData.frequencia === 'semanal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dia da Semana
              </label>
              <select
                value={formData.dia_semana}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dia_semana: parseInt(e.target.value) }))
                }
                className="input w-full"
              >
                <option value={0}>Domingo</option>
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Membros Habilitados
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum membro cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.membros_habilitados.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ministério ativo
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingMinisterio ? 'Atualizar' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingMinisterio(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Ministries;
