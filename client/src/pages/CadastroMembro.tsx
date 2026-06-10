import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MemberForm from '../components/MemberForm';
import { membersAPI } from '../services/api';
import { toast } from 'react-toastify';

const CadastroMembro: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (data: any) => {
    // Validar dados antes de enviar
    if (!data || typeof data !== 'object') {
      console.error('âŒ Dados inválidos para criar membro:', data);
      toast.error('Dados inválidos para criar membro');
      return;
    }

    setIsSaving(true);
    try {
      console.log('âœ… Criando membro com dados:', data);
      await membersAPI.createMember(data);
      toast.success('Membro criado com sucesso!');
      navigate('/tesouraria/members'); // Redirect to members list after successful registration
    } catch (error: any) {
      console.error('âŒ Erro ao criar membro:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao criar membro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    navigate('/tesouraria/members'); // Redirect to members list if the user cancels
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleClose}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors touch-manipulation flex-shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Novo Membro</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados do novo membro
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          <MemberForm
            onSave={handleSave}
            onClose={handleClose}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default CadastroMembro;
