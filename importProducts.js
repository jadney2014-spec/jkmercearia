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
ITENS MERCEARIA
PRODUTOQUANTIDADEVALOR
AMACIANTE MINUANO 5
BAYGON9
VEJA MULTIUSO YPE5
LIMPA ALUMÍNIO 1L2
DESINFETANTE POLITRIZ2
PAPEL TOALHA 2
DESINFETANTE PROEZA 2L1
PAPEL ALUMÍNINIO WYDA PEQ. 4M17
PAPEL ALUMÍNINIO PRATSY 4M9
PAPEL FILME ORLEPLAST 15M1
PAPEL MANTEIGA 4M4
PAPAL MANTEIGA 7,5M3
CUP NUDLES14
LEITE EM PÓ ITAMBÉ1
SABÃO EM PÓ MINUANO 800G2
SABÃO EM PÓ ASSIM 800G3
SABÃO EM PÓ TIXAN 400G5
DETERGENTE OESTE 9
DETERGENTE YPE14
DETERGENTE MINUANO3
ABSORVENTE DELICACY PACOTÃO NOTURNO3
ABSORVENTE SYM PEQ.7
ABSORVENTE CASA DE MÃE SIMPLES3
ABSORVENTE CASA DE MÃE NOTURNO6
ABSORVENTE SEMPRE LIVRE NOTURNO5
PEPEL HIGIÊNICO FOLHA SIMPLES12
SUCO FRESH CAIXA FECHADA4
SUCO TANG CAIXA COMPLETA2
LEITE CONDENSADO CEMIL5
LEITE CONDENSADO PIRACANJUBA 3
PALITO DE DENTE4
VINAGRE MAÇA2
VINAGRE ÁLCOOL 1
GUARDANAPO DE STOJO4
GUARDANAPO PEQUENO 3
FARINHA1
BISCOITO SHOW GOL6
BISCOITO BOM DE BOLA8
BISCOITO BELMA WAFER11
BISCOITO ESCURETO WAFER6
MIOJO NISSIN 50
CREME PENTEAR SEDA2
CREME PELE SKALA2
ACETONA5
SHAMPOO PALMOLIVE6
ALGODÃO2
COTONETE 1
ÁGUA OXIGENADA14
AMÔNIA3
KIT SEDA1
DESODORANTE ABOVE3
DESODORANTE NÍVEA4
DESODORANTE ROLON HERBISSIMO 2
SABÃO BARRA PACOTE YPÊ2
SABÃO COCO MINUANO PACOTE1
SABÃO OESTE BARRA PEQ. PACOTE6
QBOA 1LITRO ORIGINAL8
PACOTE BOMBRIL ASSOLAN 2
BUCHA LOUÇA PACOTE UND.45
TEMPERO PRONTO5
LEITE DE COCO4
MOLHO DE PIMENTA1
SARDINHA10
MILHA LATA5
ATUM RALADO2
FARINHA DE TRIGO4
MASSA BOLO 6
GOIABADA3
BATATA PALHA2
MILHO DE PIPOCA 6
SAL 29
FLOCÃO GUARÁ14
POLVILHO DOCE 3
CAFÉ EXPORTE EXTRA FORTE2
AÇUCAR 2K3
MACARRÃO ESPAGUETE CIRSTAL 5
ARROZ 5K PAMPARRA1
KETCHUP3
AZEITONA CAROÇO3
AZEITONA S/ CAROÇO3
SACO LIXO15
SUCO FRISCO CAIXA11
BISCOITO ÁGUA E SAL - FORTALEZA2
BISCOITO ÁGUA E SAL - ADORALLE2
BISCOITO MAISENA3
LAMPADAS9
PALITO DE CHURRASCO GRANDE3
TEMPEROS CRAVO DA ÍNDIA6
TEMPEROS CANELA EM CASCA7
TEMPEROS CANELA EM PÓ2
TEMPEROS BICARBONATO4
TEMPERO FOLHA DE LOURO2
TEMPERO COLORAL (VERMELHO)7
TEMPEROS AÇAFRÃO6
TEMPERO DO EDU6
TEMPERO CHIMICHURRI2
TEMPERO COMINHO 33
BORRACHA DE PANELA5
MENTOS 9
CAIXA BOMBOM  GAROTO2
BARRA SUFLEIR GRANDE2
BIS EXTRA7
KIT KAT5
BHOCOLATE BARRA GRANDE3
FINE SORVETINHO2
BIS GRANDE 3
CAIXAS FINI (PEQUENO CX 2,00)2
FINE PEQUENO 2,007
FINI GIGANTE7
BISCOITO NEGRESCO7
CAIXA SUCO TEEN1
HALLS CAIXA2
MARGARINA DELÍCIA 400g3
MARGARINA CLAYBON 400g1
MARGARINA CLAYBON 250g2
MARGARINA DELÍCIA 250g1
MARGARINA QUALLY 250g1
ÁGUA DE COCO 200ML3
ÁGUA DE COCO 1L1
TODDYNHO ORIGINAL8
PIRAKIDS4
SUCO NUTRI NÉCTAR 1L3
SUCO NUTRI NÉCTAR 200ML 4
SUCO NUTRI NÉCTAR 200ML CAIXA1
REFRIGERANTE 200ML6
BALY 473ML GRANDE2
RED BULL 2
MONSTER 473ML MELANCIA6
GUARANÁ ANTÁRTICA LATA 263ML3
COCA COLA LATA 310ML8
COCA COLA LATA 220ML2
COCA COLA ZERO 310ML6
FANTA UVA 310ML3
ENERGÉTICO FUEL 2L11
ENERGÉTICO BALY 2L4
POWER ADE5
COCA COLA 2 LITROS16
FANTA LARANJA 2 LITROS6
COCA COLA ZERO 2 LITROS3
SPRITE 2 LITROS2
COCA COLA RETORNÁVEL 2 LITROS7
FANTA LARANJA RETORNÁVEL 2 LITROS13
KUAT 1,5 LITROS9
GUARANÁ ANTÁRTICA 2 LITROS3
PEPSI 2 LITROS5
SUKITA 2 LITROS3
COCA COLA RETORNÁVEL ZERO 2 LITROS5


ITENS DE CERVEJARIA
IMPÉRIO VERDE 350ML (CAIXA)1
IMPÉRIO BRANCA 350ML (CAIXA)2
KAISER (CAIXA)2
ITAIPAVA (CAIXA)3
AMSTEL (CAIXA)12
BRAHMA (CAIXA)7
ANTÁRTICA (CAIXA)7
IMPÉRIO VERDE 269ML (CAIXA)3
CORONA PACK 6UN4
HEINEKEN PACK 6UN5
BUDWEISER OACK 6UN1
51 ICE PACK 6UN9
PROFISSA BRAHMA/ANTÁRTICA (CAIXA)1
PROFISSA BRAHMA/ANTÁRTICA (UNIDADE)6
SPATEN (UNIDADE)4
AMSTEL 350ML (UNIDADE)8
BRAHMA ZERO (UNIDADE)3
CIGARROS
GIFT (VITÓRIA) - PACOTE3
GIFT ORIGINAL - PACOTE1
MALBORO (7,75) - PACOTE4
MALBORO SABORES - UNIDADE4
MALBORO (9,00)  - UNIDADE5
FUMO MARATÁ - UNIDADE12
FUMO TREVO - UNIDADE9
TABACO POTE
ROTHMANS INTERNACIONAL (LONGO) - UNIDADE9
ROTHMANS BLUE (PACOTE)1
LUCKY STRIKE (UNIDADE)4
ELMA CHIPS
BATATA RUFFLES 115G (UNIDADE)1
CHEEETOS 90G (UNIDADE)4
BATATA RUFFLES 68G (UNIDADE)12
DORITOS 37G (UNIDADE)12
BATATA 32G (UNIDADE)11
CHEETOS 34G (UNIDADE)17
FANDANGOS 37G (UNIDADE)13
BEBIDAS QUENTE
KRISKIF CAIXA (6 UNIDADES)2
KRISKIF (UNIDADE)1
GIN TOP (UNIDADE)7
VINHO PÉRGOLA (UNIDADE)5
VINHO CANTINA 1,5L (UNIDADE)5
GENGIBRE (UNIDADE)4
VELHO BARREIRO (UNIDADE)2
51 LITRO (UNIDADE)6
CANINHA SERTANEJA PET 500ML (UNIDADE)19
ALAMBIQUE NOVA DOSE (UNIDADE)4
51 ANTIGA (UNIDADE)12
PINGAS AVULSAS (UNIDADE)12
CORTEZANO (UNIDADE)2
ITENS ARMARINHO
VELAS NÚMERO 7 (UNIDADE)8
VELAS NÚMERO 2 (UNIDADE)4
ESCOVA DE ROUPA (UNIDADE)4
LIXA DE PÉ (UNIDADE)8
LIXA DE UNHA (UNIDADE)55
PALITO DE UNHAS100
BARBEADOR PROBAK (UNIDADE)34
BARBEADOR BARATO (UNIDADE)20
VARAL DE ROUPA (UNIDADE)3
PENTE DE CABELO (UNIDADE)23
PENTE DE CABELO FINO (UNIDADE)4
LINHA DE COSTURA (UNIDADE)31
AGULHA COSTURA (UNIDADE)27
ESCOVA DE DENTE INFANTIL (UNIDADE)10
ESCOVA DE DENTE ADULTO (UNIDADE)5
ESCOVA DE DENTE KIT (UNIDADE)4
LIGUINHA DE CABELO (UNIDADE)6
CREME DENTAL COLGATE 90G (UNIDADE)10
CREME DENTAL COLGATE 50G (UNIDADE)5
SABONETE PROTEX (UNIDADE)11
SABONETE ALBANY (UNIDADE)9
SABONETE 1,00 (UNIDADE)8
SABONETE FRANCIS (UNIDADE)4
CORTADOR DE UNHA (UNIDADE)3
XUXINHA (PACOTE)5
TOUCA CABELO (UNIDADE)10
UNHA POSTIÇA (UNIDADE)31
PAPEL TREVO (UNIDADE)6
BANDAID CURATIVO (UNIDADE)18
REMÉDIOS
DORFLEX CARTELA COM 201
DORFLEX CAIXA C/ 361
PARACETAMOL CAIXA C/ 201
IBUPROFENO CAIXA C/201
TORSILAX CAIXA C/301
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