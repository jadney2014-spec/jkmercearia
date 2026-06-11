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
M4U - CHIPES E RECARGAS
CHIP VIVO S/ RECARGA 4
CHIP VIVO C/ RECARGA6
CHIP TIM C/ RECARGA6
CHIP TIM S/ RECARGA4
CHIP CLARO C/ RECARGA6
CHIP CLARO S/ RECARGA4
CHIP CLARO (ROZANA)1
CHIPS VENDIDOS
CHIP VIVO S/ RECARGA 1 - TROCA
CHIP VIVO C/ RECARGA0
CHIP TIM C/ RECARGA1
CHIP TIM S/ RECARGA4
CHIP CLARO C/ RECARGA3
CHIP CLARO S/ RECARGA1
`;

  const parsedProducts = [];
  let currentCategoryName = 'Diversos'; // Default category

  rawProductList.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Check if it's a product line first
    // Regex for products with optional unit in parentheses: (product name) (optional unit) (stock)
    const productWithParenthesesUnitMatch = trimmedLine.match(/(.+?)(?:\s*\((.*?)\)\s*)?\s*(\d+)$/);
    // Regex for complex units like "FARDO C/12": (product name) (complex unit) (stock)
    const complexUnitMatch = trimmedLine.match(/(.*?)\s+(FARDO C\/\d+)\s+(\d+)$/i);
    // Regex for products with " - TROCA" at the end: (product name) (stock) - TROCA
    const productWithTrocaMatch = trimmedLine.match(/(.+?)\s+(\d+)\s*-\s*TROCA$/i);


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
    } else if (productWithTrocaMatch) {
      const name = productWithTrocaMatch[1].trim() + ' - TROCA'; // Include " - TROCA" in the name
      const stock = parseInt(productWithTrocaMatch[2], 10);

      parsedProducts.push({
        name: name,
        stock: stock,
        categoryName: currentCategoryName,
        unit: 'un' // Default unit
      });
    } else if (productWithParenthesesUnitMatch) {
      let name = productWithParenthesesUnitMatch[1].trim();
      let unit = productWithParenthesesUnitMatch[2] ? productWithParenthesesUnitMatch[2].trim().toLowerCase() : 'un'; // Default to 'un'
      const stock = parseInt(productWithParenthesesUnitMatch[3], 10);

      // Special handling for "ROZANA" - assume it's part of the name if it was captured as a unit
      if (unit === 'rozana') {
        name = `${name} (${productWithParenthesesUnitMatch[2].trim()})`;
        unit = 'un'; // Reset unit to default
      }
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
    } else if (trimmedLine) { // If it's not a product line, treat it as a category
      currentCategoryName = trimmedLine;
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