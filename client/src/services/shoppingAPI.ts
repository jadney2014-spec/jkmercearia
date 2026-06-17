import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const shoppingAPI = {
  // Retorna os produtos marcados para compra com estado de checkbox
  getPlannedProducts: async (): Promise<{productId: string, checked: boolean, id: string}[]> => {
    try {
      const ref = collection(db, 'planned_purchases');
      const snapshot = await getDocs(ref);
      return snapshot.docs.map(d => ({
        id: d.id,
        productId: d.data().productId,
        checked: !!d.data().checked
      }));
    } catch (error) {
      console.error('Erro ao buscar lista de compras planejada:', error);
      return [];
    }
  },

  // Alterna o estado do checkbox
  toggleCheck: async (id: string, checked: boolean) => {
    try {
      const ref = doc(db, 'planned_purchases', id);
      await updateDoc(ref, { checked });
    } catch (error) {
      console.error('Erro ao atualizar checkbox:', error);
    }
  },

  // Adiciona um produto à lista de compras planejada
  addToPlanned: async (productId: string) => {
    try {
      const ref = collection(db, 'planned_purchases');
      const q = query(ref, where('productId', '==', productId));
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(ref, { 
          productId,
          checked: false,
          added_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar à lista planejada:', error);
      throw error;
    }
  },

  // Remove um produto da lista planejada (ex: após a compra)
  removeFromPlanned: async (productId: string) => {
    try {
      const ref = collection(db, 'planned_purchases');
      const q = query(ref, where('productId', '==', productId));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'planned_purchases', d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao remover da lista planejada:', error);
    }
  },

  // Remove todos os produtos da lista planejada
  clearAllPlanned: async () => {
    try {
      const ref = collection(db, 'planned_purchases');
      const snapshot = await getDocs(ref);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'planned_purchases', d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao limpar lista planejada:', error);
      throw error;
    }
  }
};