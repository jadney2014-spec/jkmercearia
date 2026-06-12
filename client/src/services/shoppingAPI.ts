import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const shoppingAPI = {
  // Retorna os IDs dos produtos marcados manualmente para compra
  getPlannedProductIds: async (): Promise<string[]> => {
    try {
      const ref = collection(db, 'planned_purchases');
      const snapshot = await getDocs(ref);
      return snapshot.docs.map(d => d.data().productId);
    } catch (error) {
      console.error('Erro ao buscar lista de compras planejada:', error);
      return [];
    }
  },

  // Adiciona um produto à lista de compras planejada
  addToPlanned: async (productId: string) => {
    try {
      const ref = collection(db, 'planned_purchases');
      // Evita duplicatas na lista planejada
      const q = query(ref, where('productId', '==', productId));
      const existing = await getDocs(q);
      
      if (existing.empty) {
        await addDoc(ref, { 
          productId,
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
  }
};