const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT = 'C:\\Users\\Jadney e Kele\\Documents\\ITENS RJ MERCEARIA.xlsx';
const OUTPUT = path.join(__dirname, 'parsed-products.json');
const SUMMARY = path.join(__dirname, 'parse-summary.txt');

function cleanName(name) {
  if (name == null) return '';
  let s = String(name).trim();
  s = s.replace(/^\s*\(UNIDADE\)\s*/gi, '');
  s = s.replace(/\s*\(UNIDADE\)\s*$/gi, '');
  return s.trim();
}

function rowCells(row) {
  const cells = [];
  for (let c = 0; c < row.length; c++) {
    const v = row[c];
    if (v !== '' && v != null && String(v).trim() !== '') {
      cells.push({ col: c, value: v });
    }
  }
  return cells;
}

function looksLikeCategory(cells, row) {
  if (cells.length === 1) {
    const t = String(cells[0].value).trim();
    if (t.length >= 2 && !/^\d+([.,]\d+)?$/.test(t)) return true;
  }

  const joined = row.map((x) => String(x ?? '').trim()).join(' ');
  if (/^CATEGORIA\b/i.test(joined) || /^DEPARTAMENTO\b/i.test(joined)) return false;

  const first = String(row[0] ?? '').trim();
  const restEmpty = row.slice(1).every((x) => x === '' || x == null || String(x).trim() === '');
  if (first && restEmpty && first.length > 1 && !/^\d+([.,]\d+)?$/.test(first)) {
    if (/^(UNIDADE|QTD|QUANTIDADE|PREÇO|PRECO|CÓDIGO|CODIGO|ITEM)\b/i.test(first)) return false;
    return true;
  }

  return false;
}

function detectHeader(rows) {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    const texts = row.map((x) => String(x ?? '').trim().toLowerCase());
    const hits = texts.filter((t) =>
      /produto|item|descri|nome|categoria|departamento|unidade|preço|preco|cod|ean|barra|qtd|quantidade/.test(t)
    );
    if (hits.length >= 2) {
      return { index: i, headers: row.map((x) => String(x ?? '').trim()) };
    }
  }
  return null;
}

function colIndex(headers, patterns) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

function parsePrice(value) {
  if (value === '' || value == null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : value;
}

function parseQuantity(value) {
  if (value === '' || value == null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

if (!fs.existsSync(INPUT)) {
  console.error('Arquivo Excel não encontrado:', INPUT);
  process.exit(1);
}

const wb = XLSX.readFile(INPUT);
const sheetNames = wb.SheetNames;
const sheetsMeta = [];
const products = [];
const categoriesSet = new Set();

for (const sheetName of sheetNames) {
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerInfo = detectHeader(rows);
  const structure = {
    sheetName,
    rowCount: rows.length,
    detectedHeaderRowIndex: headerInfo ? headerInfo.index : null,
    headers: headerInfo ? headerInfo.headers : null,
    columnCount: rows.reduce((m, r) => Math.max(m, r.length), 0),
    parseMode: null,
  };

  let currentCategory = sheetName.trim();

  if (headerInfo) {
    structure.parseMode = 'tabular';
    const headers = headerInfo.headers;
    const iName = colIndex(headers, [/produto|item|descri|nome/]);
    const iCat = colIndex(headers, [/categoria|departamento|grupo|familia|família|secao|seção/]);
    const iUnit = colIndex(headers, [/unidade|und|um/]);
    const iQty = colIndex(headers, [/qtd|quantidade|estoque|qtde/]);
    const iPrice = colIndex(headers, [/preço|preco|valor|vr|custo|venda/]);
    const iCode = colIndex(headers, [/cod|código|codigo|ean|barra|sku/]);

    for (let r = headerInfo.index + 1; r < rows.length; r++) {
      const row = rows[r];
      const cells = rowCells(row);
      if (!cells.length) continue;

      if (looksLikeCategory(cells, row)) {
        currentCategory = String(cells[0].value).trim();
        categoriesSet.add(currentCategory);
        continue;
      }

      const nameCol = iName >= 0 ? iName : 0;
      let rawName = row[nameCol];
      if (rawName === '' || rawName == null) {
        rawName = cells[0].value;
      }

      const name = cleanName(rawName);
      if (!name) continue;

      const cat = iCat >= 0 && row[iCat] ? String(row[iCat]).trim() : currentCategory;
      if (cat) categoriesSet.add(cat);

      const product = {
        sheet: sheetName,
        category: cat || sheetName,
        name,
        rawName: String(rawName).trim(),
        rowIndex: r + 1,
      };

      const unit = iUnit >= 0 ? String(row[iUnit] ?? '').trim() : '';
      if (unit) product.unit = unit;

      const qty = iQty >= 0 ? parseQuantity(row[iQty]) : undefined;
      if (qty !== undefined) product.quantity = qty;

      const price = iPrice >= 0 ? parsePrice(row[iPrice]) : undefined;
      if (price !== undefined) product.price = price;

      const code = iCode >= 0 ? String(row[iCode] ?? '').trim() : '';
      if (code) product.code = code;

      products.push(product);
    }
  } else {
    structure.parseMode = 'section';
    categoriesSet.add(currentCategory);

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = rowCells(row);
      if (!cells.length) continue;

      if (looksLikeCategory(cells, row)) {
        currentCategory = String(cells[0].value).trim();
        categoriesSet.add(currentCategory);
        continue;
      }

      const rawName = cells[0].value;
      const name = cleanName(rawName);
      if (!name) continue;
      if (/^(total|subtotal|categoria|departamento)\b/i.test(name)) continue;

      const product = {
        sheet: sheetName,
        category: currentCategory,
        name,
        rawName: String(rawName).trim(),
        rowIndex: r + 1,
      };

      if (cells.length > 1) {
        const extras = cells.slice(1).map((c) => c.value);
        product.extra = extras;

        const maybeQty = parseQuantity(extras[0]);
        if (maybeQty !== undefined) product.quantity = maybeQty;

        const maybePrice = parsePrice(extras.find((v) => /[\d]/.test(String(v))) ?? '');
        if (maybePrice !== undefined && typeof maybePrice === 'number') {
          product.price = maybePrice;
        }
      }

      products.push(product);
    }
  }

  sheetsMeta.push(structure);
}

const uniqueCategories = [...categoriesSet].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

const output = {
  sourceFile: INPUT,
  parsedAt: new Date().toISOString(),
  sheetNames,
  sheets: sheetsMeta,
  totalProducts: products.length,
  uniqueCategories,
  products,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');

const sample = products.slice(0, 20).map((p) => ({
  category: p.category,
  name: p.name,
  sheet: p.sheet,
  quantity: p.quantity,
  price: p.price,
}));

const summaryLines = [
  'SHEET_NAMES=' + JSON.stringify(sheetNames),
  'TOTAL_PRODUCTS=' + products.length,
  'UNIQUE_CATEGORIES=' + JSON.stringify(uniqueCategories),
  'COLUMN_STRUCTURE=' + JSON.stringify(sheetsMeta, null, 2),
  'SAMPLE_FIRST_20=' + JSON.stringify(sample, null, 2),
];

fs.writeFileSync(SUMMARY, summaryLines.join('\n\n'), 'utf8');

console.log('Parsed', products.length, 'products from', sheetNames.length, 'sheet(s)');
console.log('Output:', OUTPUT);
