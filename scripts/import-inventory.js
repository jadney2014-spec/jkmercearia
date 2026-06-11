/**
 * Importa inventário para Firestore (products + categories).
 *
 * Uso:
 *   node scripts/import-inventory.js
 *   node scripts/import-inventory.js --update   (atualiza estoque de produtos existentes)
 *
 * Requer credencial Firebase Admin:
 *   - config/serviceAccountKey.json  OU
 *   - variável FIREBASE_SERVICE_ACCOUNT
 */
const path = require('path');
const admin = require('firebase-admin');
const items = require('./inventario-dados');
const { initFirebaseAdmin } = require('../config/firebase-admin-init');

const UPDATE_EXISTING = process.argv.includes('--update');
const PROJECT_ID = 'jkmercearia-2865';

const CATEGORY_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#EF4444',
  '#14B8A6', '#6366F1', '#EC4899', '#84CC16', '#6B7280',
];

function colorForCategory(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[hash];
}

function normalizeUnit(unit) {
  if (!unit) return 'un';
  const u = String(unit).toLowerCase().trim();
  if (/^(un|und|unidade|uni)$/.test(u)) return 'un';
  if (/^(kg|kilo|quilo)$/.test(u)) return 'kg';
  if (/^(lt|l|litro|litros)$/.test(u)) return 'lt';
  if (/^(cx|caixa)$/.test(u)) return 'cx';
  if (/^(pct|pacote|pcto)$/.test(u)) return 'pct';
  return 'un';
}

async function main() {
  const serviceAccount = require('../config/firebase-admin-init').loadServiceAccount();
  if (serviceAccount) {
    initFirebaseAdmin();
  } else {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });

  const [categoriesSnap, productsSnap] = await Promise.all([
    db.collection('categories').get(),
    db.collection('products').get(),
  ]);

  const categoryByName = new Map();
  categoriesSnap.docs.forEach((d) => {
    const name = String(d.data().name || '').trim().toLowerCase();
    if (name) categoryByName.set(name, d.id);
  });

  const productByName = new Map();
  productsSnap.docs.forEach((d) => {
    const name = String(d.data().name || '').trim().toLowerCase();
    if (name) productByName.set(name, d.id);
  });

  const uniqueCategories = [...new Set(items.map((i) => i.category))];
  let categoriesCreated = 0;

  for (const catName of uniqueCategories) {
    const key = catName.trim().toLowerCase();
    if (!categoryByName.has(key)) {
      const ref = await db.collection('categories').add({
        name: catName.trim(),
        type: 'product',
        description: `Categoria: ${catName.trim()}`,
        color: colorForCategory(catName),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      categoryByName.set(key, ref.id);
      categoriesCreated++;
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchCount = 0;

  async function commitBatch() {
    if (batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  for (const item of items) {
    const nameKey = item.name.trim().toLowerCase();
    const categoryId = categoryByName.get(item.category.trim().toLowerCase()) || '';
    const now = admin.firestore.FieldValue.serverTimestamp();
    const stock = Number(item.quantity) || 0;
    const unit = normalizeUnit(item.unit);

    const existingId = productByName.get(nameKey);
    if (existingId) {
      if (UPDATE_EXISTING) {
        const ref = db.collection('products').doc(existingId);
        batch.update(ref, { stock, unit, category_id: categoryId, updated_at: now });
        batchCount++;
        updated++;
      } else {
        skipped++;
      }
    } else {
      const ref = db.collection('products').doc();
      batch.set(ref, {
        name: item.name.trim(),
        price: 0,
        purchase_price: 0,
        stock,
        category_id: categoryId,
        barcode: '',
        unit,
        active: true,
        created_at: now,
        updated_at: now,
      });
      productByName.set(nameKey, ref.id);
      batchCount++;
      created++;
    }

    if (batchCount >= BATCH_SIZE) await commitBatch();
  }

  await commitBatch();

  console.log(`Projeto: ${PROJECT_ID}`);
  console.log(`Total itens no inventário: ${items.length}`);
  console.log(`Categorias criadas: ${categoriesCreated}`);
  console.log(`Produtos criados: ${created}`);
  console.log(`Produtos atualizados: ${updated}`);
  console.log(`Produtos ignorados (já existiam): ${skipped}`);
  if (skipped > 0 && !UPDATE_EXISTING) {
    console.log('\nDica: rode com --update para atualizar o estoque dos produtos existentes.');
  }
}

main().catch((err) => {
  console.error('Erro na importação:', err.message || err);
  process.exit(1);
});
