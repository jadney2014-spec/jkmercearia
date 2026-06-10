import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { toast } from 'react-toastify';

interface MemberData {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  nascimento: string;
}

const addMembro = httpsCallable(functions, 'addMembro');

export const membrosService = {
  createMember: async (data: MemberData) => {
    try {
      console.log('âž• Criando novo membro:', data);
      const result = await addMembro(data);
      console.log('âœ… Membro criado com sucesso:', result);
      toast.success('Membro criado com sucesso!');
      return result.data;
    } catch (error) {
      console.error('âŒ Erro ao criar membro:', error);
      toast.error('Erro ao criar membro: ' + (error as Error).message);
      throw error;
    }
  },
};
