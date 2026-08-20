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

export interface SavingsCompletion {
  completed: boolean;
  value: number;
  completedAt?: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  description?: string;
  amountPerInterval: number;
  intervalDays: number;
  startDate: string; // YYYY-MM-DD
  targetValue?: number | null;
  status: 'active' | 'paused' | 'completed';
  color: 'amber' | 'emerald' | 'indigo' | 'rose' | 'blue';
  icon: 'piggy' | 'home' | 'chart' | 'wallet';
  totalSaved: number;
  completions: {
    [dateOrIndexKey: string]: SavingsCompletion;
  };
  created_at: any;
  updated_at: any;
}

export const savingsAPI = {
  getAll: async (): Promise<SavingsGoal[]> => {
    try {
      const ref = collection(db, 'savings_goals');
      const q = query(ref, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      return normalize(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            description: data.description || '',
            amountPerInterval: Number(data.amountPerInterval) || 0,
            intervalDays: Number(data.intervalDays) || 1,
            startDate: data.startDate || '',
            targetValue: data.targetValue !== undefined ? Number(data.targetValue) : null,
            status: data.status || 'active',
            color: data.color || 'emerald',
            icon: data.icon || 'piggy',
            totalSaved: Number(data.totalSaved) || 0,
            completions: data.completions || {},
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        })
      );
    } catch (error) {
      console.error('Erro ao buscar metas de poupança:', error);
      return [];
    }
  },

  create: async (data: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => {
    const ref = collection(db, 'savings_goals');
    const docRef = await addDoc(ref, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },

  update: async (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>>) => {
    const ref = doc(db, 'savings_goals', id);
    await updateDoc(ref, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  delete: async (id: string) => {
    const ref = doc(db, 'savings_goals', id);
    await deleteDoc(ref);
  },
};
