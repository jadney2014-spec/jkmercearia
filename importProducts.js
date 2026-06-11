const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const serviceAccount = require('./jkmercearia-2865-firebase-adminsdk-fbsvc-6fdebbee71.json');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const productsAPI = {
  getAll: async () => {
    const snapshot = await db.collection('products').orderBy('name', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: async (data) => {
    const docRef = await db.collection('products').add({
      ...data,
      active: data.active !== false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },
  update: async (id, data) => {
    await db.collection('products').doc(id).update({ ...data, updated_at: Timestamp.now() });
  },
};

const categoriesAPI = {
  getCategories: async () => {
    const snapshot = await db.collection('categories').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  createCategory: async (data) => {
    const docRef = await db.collection('categories').add({
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { id: docRef.id };
  },
};

async function importProducts() {
  const rawProductList = `
SALGADINHOS
PELISKÃO (UNIDADE) 11
MICÃO 120G (UNIDADE) 11
SELEÇÃO 50G (UNIDADE) 7
PIPOCA DOCE P (UNIDADE) 5
PELINHA KARI KARI (UNIDADE )14
AMENDUPÃ (UNIDADE) 9
PILHA
PILHA RAYOVAC "AA" (UNIDADE) 28
PILHA SEGMA "AA" (UNIDADE) 16
PAPELARIA
LÁPIS FABER CASTEL(UNIDADE) 8
LÁPIS BIC (UNIDADE) 9
CANETAS (UNIDADE) 11
DUREX (UNIDADE) 4
FITA ISOLANTE (UNIDADE) 3
APONTADOR (UNIDADE) 5
CASA
VASSOURA CONDOR (UNIDADE) 8
CARVÃO CHURRASCO (UNIDADE) 7
BEBIDAS
ÁGUA MINERAL FARDO C/12 3
`;

  const parsedProducts = [];
  let currentCategoryName = 'Diversos'; // Default category

  rawProductList.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Check if it's a category header (all uppercase, no numbers)
    if (trimmedLine === trimmedLine.toUpperCase() && !/\d/.test(trimmedLine)) {
      currentCategoryName = trimmedLine;
      return;
    }

    // Try to parse as a product with optional unit in parentheses
    // This regex is more tolerant to spaces around the unit in parentheses
    const productWithParenthesesUnitMatch = trimmedLine.match(/(.+?)(?:\s*\((.*?)\)\s*)?\s*(\d+)$/);

    // Handle cases like "ÁGUA MINERAL FARDO C/12 3" where unit is part of name and not in parentheses
    const complexUnitMatch = trimmedLine.match(/(.*?)\s+(FARDO C\/\d+)\s+(\d+)$/i);

    if (complexUnitMatch) {
      const name = complexUnitMatch[1].trim();
      const unit = complexUnitMatch[2].trim().toLowerCase();
      const stock = parseInt(complexUnitMatch[3], 10);

      parsedProducts.push({
        name: name,
        stock: stock,
        categoryName: currentCategoryName,
        unit: unit
      });
    } else if (productWithParenthesesUnitMatch) {
      const name = productWithParenthesesUnitMatch[1].trim();
      let unit = productWithParenthesesUnitMatch[2] ? productWithParenthesesUnitMatch[2].trim().toLowerCase() : 'un'; // Default to 'un'
      const stock = parseInt(productWithParenthesesUnitMatch[3], 10);

      // Standardize 'unidade' to 'un'
      if (unit === 'unidade') {
        unit = 'un';
      }

      parsedProducts.push({
        name: name,
        stock: stock,
        categoryName: currentCategoryName,
        unit: unit
      });
    } else {
      console.warn(`Could not parse line: "${trimmedLine}"`);
    }
  });

  console.log('Parsed Products:', parsedProducts);

  const existingCategories = await categoriesAPI.getCategories();
  const existingProducts = await productsAPI.getAll();

  const categoryMap = existingCategories.reduce((acc, cat) => {
    acc[cat.name.toUpperCase()] = cat.id;
    return acc;
  }, {});

  for (const productInput of parsedProducts) {
    let categoryId = categoryMap[productInput.categoryName.toUpperCase()];

    // Create category if it doesn't exist
    if (!categoryId) {
      console.log(`Creating new category: ${productInput.categoryName}`);
      const newCategory = await categoriesAPI.createCategory({
        name: productInput.categoryName,
        type: 'product', // Assuming 'product' type for these categories
        color: '#6B7280', // Default color
        description: `Categoria para ${productInput.categoryName.toLowerCase()}`,
      });
      categoryId = newCategory.id;
      categoryMap[productInput.categoryName.toUpperCase()] = categoryId; // Add to map for future products
    }

    const existingProduct = existingProducts.find(p => p.name.toUpperCase() === productInput.name.toUpperCase());

    const productData = {
      name: productInput.name,
      price: 0, // Default
      purchase_price: 0, // Default
      stock: productInput.stock,
      category_id: categoryId,
      barcode: '', // Default
      unit: productInput.unit,
      active: true, // Default
    };

    if (existingProduct) {
      console.log(`Updating product: ${productInput.name} (ID: ${existingProduct.id})`);
      // Add to existing stock
      await productsAPI.update(existingProduct.id, {
        stock: existingProduct.stock + productInput.stock,
        category_id: categoryId, // Update category in case it changed
        unit: productInput.unit, // Update unit in case it changed
      });
    } else {
      console.log(`Creating new product: ${productInput.name}`);
      await productsAPI.create(productData);
    }
  }
  console.log('Product import process completed.');
}

importProducts().catch(console.error);