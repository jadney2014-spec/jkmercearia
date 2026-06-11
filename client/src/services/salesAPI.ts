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
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { fixUtf8MojibakeDeep } from '../utils/textEncoding';

const normalize = <T,>(value: T): T => fixUtf8MojibakeDeep(value);

export function parseFirestoreDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000);
  }
  return new Date();
}

function isSameLocalDay(left: Date | string, right: Date): boolean {
  const date = parseFirestoreDate(left);
  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  );
}

export interface Product {
  id: string;
  name: string;
  price: number;
  purchase_price: number;
  stock: number;
  category_id?: string;
  category_name?: string;
  barcode?: string;
  unit?: string;
  active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: Date | string;
}

export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    try {
      const ref = collection(db, 'products');
      const q = query(ref, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const categoriesRef = collection(db, 'categories');
      const categoriesSnap = await getDocs(categoriesRef);
      const categories = categoriesSnap.docs.reduce((acc, d) => {
        acc[d.id] = d.data().name;
        return acc;
      }, {} as Record<string, string>);

      return normalize(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            price: Number(data.price) || 0,
            purchase_price: Number(data.purchase_price) || 0,
            stock: Number(data.stock) || 0,
            category_id: data.category_id || '',
            category_name: data.category_id ? categories[data.category_id] || '' : '',
            barcode: data.barcode || '',
            unit: data.unit || 'un',
            active: data.active !== false,
            created_at: parseFirestoreDate(data.created_at),
            updated_at: parseFirestoreDate(data.updated_at),
          };
        })
      );
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  },

  create: async (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>) => {
    const ref = collection(db, 'products');
    const docRef = await addDoc(ref, {
      ...data,
      active: data.active !== false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },

  update: async (id: string, data: Partial<Product>) => {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, { ...data, updated_at: Timestamp.now() });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  },
};

export const salesAPI = {
  getAll: async (params?: { start_date?: string; end_date?: string }): Promise<Sale[]> => {
    try {
      const ref = collection(db, 'sales');
      const q = query(ref, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      let sales = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          items: data.items || [],
          total: Number(data.total) || 0,
          payment_method: data.payment_method || 'dinheiro',
          notes: data.notes || '',
          created_by: data.created_by || '',
          created_by_name: data.created_by_name || '',
          created_at: parseFirestoreDate(data.created_at),
        } as Sale;
      });

      if (params?.start_date) {
        const start = new Date(params.start_date);
        sales = sales.filter((s) => parseFirestoreDate(s.created_at) >= start);
      }
      if (params?.end_date) {
        const end = new Date(params.end_date);
        end.setHours(23, 59, 59, 999);
        sales = sales.filter((s) => parseFirestoreDate(s.created_at) <= end);
      }

      return normalize(sales);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return [];
    }
  },

  create: async (sale: {
    items: SaleItem[];
    total: number;
    payment_method: string;
    notes?: string;
    created_by?: string;
    created_by_name?: string;
  }) => {
    const batch = writeBatch(db);

    for (const item of sale.items) {
      const productRef = doc(db, 'products', item.product_id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Produto "${item.product_name}" não encontrado`);
      }
      const currentStock = Number(productSnap.data().stock) || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para "${item.product_name}" (disponível: ${currentStock})`);
      }
      batch.update(productRef, {
        stock: currentStock - item.quantity,
        updated_at: Timestamp.now(),
      });
    }

    const salesRef = doc(collection(db, 'sales'));
    batch.set(salesRef, {
      items: sale.items,
      total: sale.total,
      payment_method: sale.payment_method,
      notes: sale.notes || '',
      created_by: sale.created_by || '',
      created_by_name: sale.created_by_name || '',
      created_at: Timestamp.now(),
    });

    await batch.commit();
    return { id: salesRef.id };
  },

  delete: async (id: string) => {
    const saleRef = doc(db, 'sales', id);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('Venda não encontrada');
    }

    const sale = saleSnap.data();
    const batch = writeBatch(db);

    for (const item of sale.items || []) {
      const productRef = doc(db, 'products', item.product_id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const currentStock = Number(productSnap.data().stock) || 0;
        batch.update(productRef, {
          stock: currentStock + Number(item.quantity || 0),
          updated_at: Timestamp.now(),
        });
      }
    }

    batch.delete(saleRef);
    await batch.commit();
  },

  getTodayStats: async () => {
    const today = new Date();
    const sales = await salesAPI.getAll();
    const todaySales = sales.filter((s) => isSameLocalDay(s.created_at, today));
    const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalItems = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
      0
    );
    return {
      count: todaySales.length,
      revenue: totalRevenue,
      itemsSold: totalItems,
      sales: todaySales,
    };
  },

  getLowStockProducts: async (threshold = 5) => {
    const products = await productsAPI.getAll();
    return products.filter((p) => p.active && p.stock <= threshold);
  },
};
