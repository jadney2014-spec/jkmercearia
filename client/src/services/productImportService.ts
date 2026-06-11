import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ParsedExcelProduct } from '../utils/excelParser';

const CATEGORY_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#EF4444',
  '#14B8A6', '#6366F1', '#EC4899', '#84CC16', '#6B7280',
];

function colorForCategory(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[hash];
}

function normalizeUnit(unit?: string): string {
  if (!unit) return 'un';
  const u = unit.toLowerCase().trim();
  if (/^(un|und|unidade|uni)$/.test(u)) return 'un';
  if (/^(kg|kilo|quilo)$/.test(u)) return 'kg';
  if (/^(lt|l|litro|litros)$/.test(u)) return 'lt';
  if (/^(cx|caixa)$/.test(u)) return 'cx';
  if (/^(pct|pacote|pcto)$/.test(u)) return 'pct';
  return 'un';
}

export interface ImportProgress {
  phase: 'categories' | 'products' | 'done';
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  categoriesCreated: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  totalParsed: number;
}

export interface ImportOptions {
  updateExisting?: boolean;
}

export async function importProductsFromExcel(
  parsedProducts: ParsedExcelProduct[],
  onProgress?: (p: ImportProgress) => void,
  options?: ImportOptions
): Promise<ImportResult> {
  const updateExisting = options?.updateExisting ?? false;
  const categoriesRef = collection(db, 'categories');
  const productsRef = collection(db, 'products');

  const [categoriesSnap, productsSnap] = await Promise.all([
    getDocs(categoriesRef),
    getDocs(productsRef),
  ]);

  const categoryByName = new Map<string, string>();
  categoriesSnap.docs.forEach((d) => {
    const name = String(d.data().name || '').trim().toLowerCase();
    if (name) categoryByName.set(name, d.id);
  });

  const existingProducts = new Map<string, string>();
  productsSnap.docs.forEach((d) => {
    const name = String(d.data().name || '').trim().toLowerCase();
    if (name) existingProducts.set(name, d.id);
  });

  const uniqueCategoryNames = Array.from(new Set(parsedProducts.map((p) => p.category).filter(Boolean)));
  let categoriesCreated = 0;

  onProgress?.({
    phase: 'categories',
    current: 0,
    total: uniqueCategoryNames.length,
    message: 'Criando categorias...',
  });

  for (let i = 0; i < uniqueCategoryNames.length; i++) {
    const catName = uniqueCategoryNames[i];
    const key = catName.trim().toLowerCase();
    if (!categoryByName.has(key)) {
      const docRef = await addDoc(categoriesRef, {
        name: catName.trim(),
        type: 'product',
        description: `Categoria: ${catName.trim()}`,
        color: colorForCategory(catName),
        created_at: new Date(),
        updated_at: new Date(),
      });
      categoryByName.set(key, docRef.id);
      categoriesCreated++;
    }
    onProgress?.({
      phase: 'categories',
      current: i + 1,
      total: uniqueCategoryNames.length,
      message: `Categorias: ${i + 1}/${uniqueCategoryNames.length}`,
    });
  }

  let productsCreated = 0;
  let productsUpdated = 0;
  let productsSkipped = 0;

  const toProcess = parsedProducts.filter((p) => {
    const key = p.name.trim().toLowerCase();
    if (existingProducts.has(key)) {
      if (!updateExisting) productsSkipped++;
      return updateExisting;
    }
    return true;
  });

  const BATCH_SIZE = 400;
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const chunk = toProcess.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const now = Timestamp.now();

    for (const item of chunk) {
      const categoryId = categoryByName.get(item.category.trim().toLowerCase()) || '';
      const key = item.name.trim().toLowerCase();
      const existingId = existingProducts.get(key);

      if (existingId) {
        batch.update(doc(productsRef, existingId), {
          stock: Number(item.quantity) || 0,
          category_id: categoryId,
          unit: normalizeUnit(item.unit),
          updated_at: now,
        });
        productsUpdated++;
      } else {
        const newRef = doc(productsRef);
        batch.set(newRef, {
          name: item.name.trim(),
          price: Number(item.price) || 0,
          purchase_price: 0,
          stock: Number(item.quantity) || 0,
          category_id: categoryId,
          barcode: '',
          unit: normalizeUnit(item.unit),
          active: true,
          created_at: now,
          updated_at: now,
        });
        existingProducts.set(key, newRef.id);
        productsCreated++;
      }
    }

    await batch.commit();
    onProgress?.({
      phase: 'products',
      current: Math.min(i + BATCH_SIZE, toProcess.length),
      total: parsedProducts.length,
      message: `Produtos: ${Math.min(i + BATCH_SIZE, toProcess.length)}/${parsedProducts.length}`,
    });
  }

  onProgress?.({
    phase: 'done',
    current: productsCreated + productsUpdated,
    total: parsedProducts.length,
    message: 'Importação concluída!',
  });

  return {
    categoriesCreated,
    productsCreated,
    productsUpdated,
    productsSkipped,
    totalParsed: parsedProducts.length,
  };
}
