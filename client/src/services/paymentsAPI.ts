import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { fixUtf8MojibakeDeep } from '../utils/textEncoding';

const normalize = <T,>(value: T): T => fixUtf8MojibakeDeep(value);

export interface Payment {
  id: string;
  description: string;
  value: number;
  due_date: string; // YYYY-MM-DD
  status: 'pending' | 'paid';
  payment_date?: string | null; // YYYY-MM-DD
  notes?: string;
  created_at: any;
  updated_at: any;
}

export const paymentsAPI = {
  getAll: async (): Promise<Payment[]> => {
    try {
      const ref = collection(db, 'payments');
      const q = query(ref, orderBy('due_date', 'asc'));
      const snapshot = await getDocs(q);

      return normalize(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            description: data.description || '',
            value: Number(data.value) || 0,
            due_date: data.due_date || '',
            status: data.status || 'pending',
            payment_date: data.payment_date || undefined,
            notes: data.notes || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        })
      );
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }
  },

  create: async (data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    const ref = collection(db, 'payments');
    const docRef = await addDoc(ref, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },

  update: async (id: string, data: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>) => {
    const ref = doc(db, 'payments', id);
    await updateDoc(ref, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  delete: async (id: string) => {
    const ref = doc(db, 'payments', id);
    await deleteDoc(ref);
  },
};
