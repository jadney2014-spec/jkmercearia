import { db } from '../firebase/config';
import {
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import type { Devotional, DevotionalId } from '../types/Devotional';

const COLLECTION = 'devotionals';

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  return undefined;
};

const mapDoc = (id: string, data: any): Devotional => {
  return {
    id,
    date: String(data?.date || id),
    title: String(data?.title || ''),
    verseRef: String(data?.verseRef || ''),
    verseText: data?.verseText ? String(data.verseText) : undefined,
    body: String(data?.body || ''),
    imageUrl: data?.imageUrl ? String(data.imageUrl) : undefined,
    createdAt: toDate(data?.createdAt),
    createdBy: data?.createdBy ? String(data.createdBy) : undefined,
    updatedAt: toDate(data?.updatedAt),
    updatedBy: data?.updatedBy ? String(data.updatedBy) : undefined,
  };
};

export const devotionalsAPI = {
  getById: async (id: DevotionalId): Promise<Devotional | null> => {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return mapDoc(snap.id, snap.data());
  },

  getByDate: async (date: string): Promise<Devotional | null> => {
    return devotionalsAPI.getById(date);
  },

  listRecent: async (count: number = 30): Promise<Devotional[]> => {
    const ref = collection(db, COLLECTION);
    const q = query(ref, orderBy('date', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDoc(d.id, d.data()));
  },

  upsert: async (
    devotional: {
      date: string;
      title: string;
      verseRef: string;
      verseText?: string;
      body: string;
      imageUrl?: string;
    },
    meta?: { userId?: string }
  ): Promise<void> => {
    const id = devotional.date;
    const ref = doc(db, COLLECTION, id);
    const now = Timestamp.now();

    const existing = await getDoc(ref);

    if (!existing.exists()) {
      await setDoc(ref, {
        ...devotional,
        date: id,
        createdAt: now,
        createdBy: meta?.userId || null,
        updatedAt: now,
        updatedBy: meta?.userId || null,
      });
      return;
    }

    await updateDoc(ref, {
      ...devotional,
      date: id,
      updatedAt: now,
      updatedBy: meta?.userId || null,
    } as any);
  },

  remove: async (id: DevotionalId): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
