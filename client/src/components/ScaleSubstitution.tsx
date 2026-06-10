// Componente para solicitar substituição de escala - Estilo LouveApp
import React, { useState } from 'react';
import { UserGroupIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { membersAPI } from '../services/api';
import { escalasAPI } from '../services/scalesAPI';
import type { Escala, MembroEscala } from '../types/Scale';
import Modal from './Modal';
import Button from './Button';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface ScaleSubstitutionProps {
  escala: Escala;
  membroEscalado: MembroEscala;
  onSubstitutionRequested?: () => void;
}

const ScaleSubstitution: React.FC<ScaleSubstitutionProps> = ({
  escala,
  membroEscalado,
  onSubstitutionRequested,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [reason, setReason] = useState('');

  const loadMembers = async () => {
    try {
      const response = await membersAPI.getMembers();
      // Filtrar membros que não estão na escala atual e que têm a mesma função
      const availableMembers = (response.data?.members || []).filter(
        (m: any) =>
          m.id !== membroEscalado.membro_id &&
          !escala.membros.some(me => me.membro_id === m.id)
      );
      setMembers(availableMembers);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros');
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    await loadMembers();
  };

  const handleRequestSubstitution = async () => {
    if (!selectedMemberId) {
      toast.error('Selecione um membro para substituição');
      return;
    }

    try {
      setLoading(true);
      
      // Atualizar a escala com a substituição
      // Remover membro_nome pois a API busca automaticamente
      const updatedMembros = escala.membros
        .filter(m => m.membro_id !== membroEscalado.membro_id)
        .map(m => ({
          membro_id: m.membro_id,
          funcao: m.funcao,
          status: m.status,
          observacoes: m.observacoes,
          substituido_por: m.substituido_por,
        }));

      // Marcar o membro original como substituído
      updatedMembros.push({
        membro_id: membroEscalado.membro_id,
        funcao: membroEscalado.funcao,
        status: 'substituido' as const,
        substituido_por: selectedMemberId,
        observacoes: reason ? `[Substituição: ${reason}]` : undefined,
      });

      // Adicionar o novo membro à escala
      updatedMembros.push({
        membro_id: selectedMemberId,
        funcao: membroEscalado.funcao,
        status: 'pendente' as const,
        observacoes: `Substituição de ${membroEscalado.membro_nome}`,
        substituido_por: undefined,
      });

      await escalasAPI.updateEscala(escala.id, {
        membros: updatedMembros,
      });

      // Criar notificações para os envolvidos
      try {
        const { notificationsAPI } = await import('../services/notificationsAPI');
        const selectedMember = members.find(m => m.id === selectedMemberId);
        
        // Notificar o membro substituto
        if (selectedMember) {
          await notificationsAPI.createNotification(
            selectedMemberId,
            'substituicao_recebida',
            {
              escalaId: escala.id,
              ministerioNome: escala.ministerio_nome,
              membroOriginalNome: membroEscalado.membro_nome,
              data: new Date(escala.data).toLocaleDateString('pt-BR'),
              funcao: membroEscalado.funcao,
            }
          );
        }

        // Notificar líderes do ministério sobre a substituição
        // Buscar membros do ministério que são líderes
        const ministerioRef = doc(db, 'ministerios', escala.ministerio_id);
        const ministerioSnap = await getDoc(ministerioRef);
        
        if (ministerioSnap.exists()) {
          const ministerioData = ministerioSnap.data();
          // Notificar membros habilitados do ministério (podem ser líderes)
          const membrosMinisterio = ministerioData.membros_habilitados || [];
          
          // Notificar sobre a substituição (apenas para referência)
          for (const membroId of membrosMinisterio.slice(0, 3)) { // Limitar a 3 notificações
            if (membroId !== membroEscalado.membro_id && membroId !== selectedMemberId) {
              await notificationsAPI.createNotification(
                membroId,
                'substituicao_solicitada',
                {
                  escalaId: escala.id,
                  ministerioNome: escala.ministerio_nome,
                  membroNome: membroEscalado.membro_nome,
                  substitutoNome: selectedMember?.name || 'Membro',
                  motivo: reason || 'Não informado',
                  data: new Date(escala.data).toLocaleDateString('pt-BR'),
                }
              );
            }
          }
        }
      } catch (error) {
        console.warn('Erro ao criar notificações de substituição:', error);
        // Não falhar a substituição se notificações falharem
      }

      toast.success('Substituição solicitada com sucesso!');
      setShowModal(false);
      setSelectedMemberId('');
      setReason('');
      
      if (onSubstitutionRequested) {
        onSubstitutionRequested();
      }
    } catch (error) {
      console.error('Erro ao solicitar substituição:', error);
      toast.error('Erro ao solicitar substituição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
      >
        <ArrowPathIcon className="h-4 w-4" />
        <span>Solicitar Substituição</span>
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedMemberId('');
          setReason('');
        }}
        title="Solicitar Substituição de Escala"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Você está escalado para:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white">
                {escala.ministerio_nome}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(escala.data).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Função: {membroEscalado.funcao}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecionar membro para substituição
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione um membro...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo da substituição (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Problema de saúde, compromisso familiar..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleRequestSubstitution}
              disabled={loading || !selectedMemberId}
              className="flex-1"
            >
              {loading ? 'Processando...' : 'Confirmar Substituição'}
            </Button>
            <Button
              onClick={() => {
                setShowModal(false);
                setSelectedMemberId('');
                setReason('');
              }}
              variant="secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ScaleSubstitution;
