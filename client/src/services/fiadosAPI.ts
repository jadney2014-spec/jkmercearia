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
import { parseFirestoreDate } from './salesAPI';

const normalize = <T,>(value: T): T => fixUtf8MojibakeDeep(value);

function normalizeItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export interface Fiado {
  id: string;
  customer_name: string;
  items: string[];
  total: number;
  notes?: string;
  status: 'open' | 'paid';
  created_at: Date;
  paid_at?: Date;
}

export const fiadosAPI = {
  getAll: async (): Promise<Fiado[]> => {
    try {
      const ref = collection(db, 'fiados');
      const q = query(ref, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      return normalize(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            customer_name: data.customer_name || '',
            items: normalizeItems(data.items),
            total: Number(data.total) || 0,
            notes: data.notes || '',
            status: data.status === 'paid' ? 'paid' : 'open',
            created_at: parseFirestoreDate(data.created_at),
            paid_at: data.paid_at ? parseFirestoreDate(data.paid_at) : undefined,
          } as Fiado;
        })
      );
    } catch (error) {
      console.error('Erro ao buscar fiados:', error);
      return [];
    }
  },

  create: async (data: {
    customer_name: string;
    items: string[];
    total?: number;
    notes?: string;
  }) => {
    const ref = collection(db, 'fiados');
    const docRef = await addDoc(ref, {
      customer_name: data.customer_name.trim(),
      items: data.items.map((item) => item.trim()).filter(Boolean),
      total: Number(data.total) || 0,
      notes: data.notes?.trim() || '',
      status: 'open',
      created_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },

  update: async (
    id: string,
    data: Partial<Pick<Fiado, 'customer_name' | 'items' | 'total' | 'notes'>>
  ) => {
    const ref = doc(db, 'fiados', id);
    const payload: Record<string, unknown> = { updated_at: Timestamp.now() };

    if (data.customer_name !== undefined) payload.customer_name = data.customer_name.trim();
    if (data.items !== undefined) payload.items = data.items.map((item) => item.trim()).filter(Boolean);
    if (data.total !== undefined) payload.total = Number(data.total) || 0;
    if (data.notes !== undefined) payload.notes = data.notes.trim();

    await updateDoc(ref, payload);
  },

  markAsPaid: async (id: string) => {
    const ref = doc(db, 'fiados', id);
    await updateDoc(ref, {
      status: 'paid',
      paid_at: Timestamp.now(),
    });
  },

  reopen: async (id: string) => {
    const ref = doc(db, 'fiados', id);
    await updateDoc(ref, {
      status: 'open',
      paid_at: null,
    });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'fiados', id));
  },
};
