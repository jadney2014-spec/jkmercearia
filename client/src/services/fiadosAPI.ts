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

export interface FiadoItem {
  text: string;
  date: Date | string;
  price?: number;
}

export interface Fiado {
  id: string;
  customer_name: string;
  items: FiadoItem[];
  total: number;
  notes?: string;
  status: 'open' | 'paid';
  created_at: Date | string;
  paid_at?: Date | string;
}

function normalizeItems(value: unknown): FiadoItem[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          text: String((item as any).text || ''),
          date: (item as any).date ? parseFirestoreDate((item as any).date) : new Date(),
          price: Number((item as any).price) || 0,
        };
      }
      return {
        text: String(item).trim(),
        date: new Date(),
        price: 0,
      };
    }).filter(i => i.text);
  }
  return [];
}

export const fiadosAPI = {
  getAll: async (): Promise<Fiado[]> => {
    try {
      const ref = collection(db, 'fiados');
      const q = query(ref, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((d) => {
        const data = d.data();
        // Garante que as datas sejam processadas ANTES da normalização de texto
        // para evitar que o fixUtf8MojibakeDeep estrague os objetos Date
        const createdAt = data.created_at ? parseFirestoreDate(data.created_at) : new Date();
        const paidAt = data.paid_at ? parseFirestoreDate(data.paid_at) : undefined;
        const items = normalizeItems(data.items);

        return {
          id: d.id,
          customer_name: data.customer_name || '',
          items,
          total: Number(data.total) || 0,
          notes: data.notes || '',
          status: data.status === 'paid' ? 'paid' : 'open',
          created_at: createdAt,
          paid_at: paidAt,
        } as Fiado;
      });

      // Normaliza apenas os textos, preservando as datas
      return normalize(list);
    } catch (error) {
      console.error('Erro ao buscar fiados:', error);
      return [];
    }
  },

  create: async (data: {
    customer_name: string;
    items: FiadoItem[];
    total?: number;
    notes?: string;
  }) => {
    const ref = collection(db, 'fiados');
    const docRef = await addDoc(ref, {
      customer_name: data.customer_name.trim(),
      items: data.items.map((item) => ({
        text: item.text.trim(),
        date: Timestamp.fromDate(new Date(String(item.date).includes('T') ? item.date : `${item.date}T12:00:00`)),
        price: Number(item.price) || 0,
      })),
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
    const payload: any = { updated_at: Timestamp.now() };

    if (data.customer_name !== undefined) payload.customer_name = data.customer_name.trim();
    if (data.items !== undefined) {
      payload.items = data.items.map((item) => ({
        text: item.text.trim(),
        date: Timestamp.fromDate(new Date(String(item.date).includes('T') ? item.date : `${item.date}T12:00:00`)),
        price: Number(item.price) || 0,
      }));
    }
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