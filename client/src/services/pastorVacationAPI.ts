// Serviço de API para Férias de Pastores com Firebase Firestore
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { toast } from 'react-toastify';

// Definindo a interface para um evento de férias
export interface VacationEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  pastorId: string;
  pastorName: string; // Adicionado para exibir o nome do pastor no calendário
}

// API para Férias de Pastores
export const pastorVacationAPI = {
  getVacations: async (): Promise<VacationEvent[]> => {
    try {
      console.log('ðŸ”¥ Buscando férias de pastores no Firestore...');
      const vacationsRef = collection(db, 'pastor_vacations');
      const q = query(vacationsRef, orderBy('start', 'asc'));
      const querySnapshot = await getDocs(q);

      const vacations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end.toDate(),
          pastorId: data.pastorId,
          pastorName: data.pastorName || '', // Adicionado para exibir o nome do pastor no calendário
        };
      });

      console.log('âœ… Férias de pastores carregadas:', vacations.length);
      return vacations;
    } catch (error) {
      console.error('âŒ Erro ao buscar férias de pastores:', error);
      toast.error('Erro ao buscar férias de pastores');
      return [];
    }
  },

  createVacation: async (vacationData: Omit<VacationEvent, 'id'>): Promise<VacationEvent | null> => {
    try {
      console.log('ðŸ’¾ Salvando novas férias no Firestore:', vacationData);
      const vacationsRef = collection(db, 'pastor_vacations');
      const docRef = await addDoc(vacationsRef, {
        title: vacationData.title,
        start: vacationData.start,
        end: vacationData.end,
        pastorId: vacationData.pastorId,
        pastorName: vacationData.pastorName, // Salvar o nome do pastor
      });
      console.log('âœ… Férias salvas com ID:', docRef.id);
      return { id: docRef.id, ...vacationData };
    } catch (error) {
      console.error('âŒ Erro ao criar férias:', error);
      toast.error('Erro ao salvar as férias');
      return null;
    }
  },

  updateVacation: async (id: string, vacationData: Partial<Omit<VacationEvent, 'id'>>): Promise<void> => {
    try {
      console.log('ðŸ”„ Atualizando férias no Firestore:', id);
      const vacationRef = doc(db, 'pastor_vacations', id);
      await updateDoc(vacationRef, vacationData);
      console.log('âœ… Férias atualizadas com sucesso');
      toast.success('Férias atualizadas com sucesso');
    } catch (error) {
      console.error('âŒ Erro ao atualizar férias:', error);
      toast.error('Erro ao atualizar as férias');
    }
  },

  deleteVacation: async (id: string): Promise<void> => {
    try {
      console.log('ðŸ—‘ï¸ Deletando férias do Firestore:', id);
      const vacationRef = doc(db, 'pastor_vacations', id);
      await deleteDoc(vacationRef);
      console.log('âœ… Férias deletadas com sucesso');
      toast.success('Férias deletadas com sucesso');
    } catch (error) {
      console.error('âŒ Erro ao deletar férias:', error);
      toast.error('Erro ao deletar as férias');
    }
  },
};
