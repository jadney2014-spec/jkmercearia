const fs = require('fs');
const zlib = require('zlib');
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

function readUInt16LE(buf, off) {
  return buf[off] | (buf[off + 1] << 8);
}

function readUInt32LE(buf, off) {
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}

function parseZipEntries(buffer) {
  const entries = new Map();
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b && buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP EOCD não encontrado');

  const cdOffset = readUInt32LE(buffer, eocd + 16);
  let pos = cdOffset;
  while (pos < eocd) {
    if (buffer[pos] !== 0x50 || buffer[pos + 1] !== 0x4b || buffer[pos + 2] !== 0x01 || buffer[pos + 3] !== 0x02) break;
    const compMethod = readUInt16LE(buffer, pos + 10);
    const compSize = readUInt32LE(buffer, pos + 20);
    const fileSize = readUInt32LE(buffer, pos + 24);
    const nameLen = readUInt16LE(buffer, pos + 28);
    const extraLen = readUInt16LE(buffer, pos + 30);
    const commentLen = readUInt16LE(buffer, pos + 32);
    const localHeaderOffset = readUInt32LE(buffer, pos + 42);
    const name = buffer.slice(pos + 46, pos + 46 + nameLen).toString('utf8');
    pos += 46 + nameLen + extraLen + commentLen;

    const lh = localHeaderOffset;
    const lhNameLen = readUInt16LE(buffer, lh + 26);
    const lhExtraLen = readUInt16LE(buffer, lh + 28);
    const dataStart = lh + 30 + lhNameLen + lhExtraLen;
    let data = buffer.slice(dataStart, dataStart + compSize);
    if (compMethod === 8) data = zlib.inflateRawSync(data);
    else if (compMethod !== 0) throw new Error(`Método ZIP não suportado: ${compMethod} (${name})`);
    entries.set(name.replace(/\\/g, '/'), data);
  }
  return entries;
}

function decodeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseSharedStrings(xml) {
  const strings = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    const parts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1]));
    strings.push(parts.join(''));
  }
  return strings;
}

function colLettersToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colLettersToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
}

function parseSheetRows(xml, sharedStrings) {
  const rowsMap = new Map();
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowIndex = parseInt(rowMatch[1], 10) - 1;
    const rowBody = rowMatch[2];
    const cellRe = /<c[^>]*r="([A-Z]+\d+)"([^>]*)>(?:[\s\S]*?<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g;
    let cellMatch;
    const cells = [];
    while ((cellMatch = cellRe.exec(rowBody))) {
      const ref = parseCellRef(cellMatch[1]);
      if (!ref) continue;
      const attrs = cellMatch[2] || '';
      const rawVal = cellMatch[3] != null ? decodeXml(cellMatch[3]) : '';
      let value = rawVal;
      if (/t="s"/.test(attrs) && rawVal !== '') value = sharedStrings[parseInt(rawVal, 10)] ?? '';
      else if (/t="b"/.test(attrs)) value = rawVal === '1';
      else if (rawVal !== '' && !Number.isNaN(Number(rawVal))) value = Number(rawVal);
      cells.push({ col: ref.col, value });
    }
    cells.sort((a, b) => a.col - b.col);
    const maxCol = cells.reduce((m, c) => Math.max(m, c.col), -1);
    const row = new Array(maxCol + 1).fill('');
    for (const c of cells) row[c.col] = c.value;
    rowsMap.set(rowIndex, row);
  }
  if (!rowsMap.size) return [];
  const maxRow = Math.max(...rowsMap.keys());
  const rows = [];
  for (let i = 0; i <= maxRow; i++) rows.push(rowsMap.get(i) || []);
  return rows;
}

function rowCells(row) {
  const cells = [];
  for (let c = 0; c < row.length; c++) {
    const v = row[c];
    if (v !== '' && v != null && String(v).trim() !== '') cells.push({ col: c, value: v });
  }
  return cells;
}

function looksLikeCategory(cells, row) {
  if (cells.length === 1) {
    const t = String(cells[0].value).trim();
    if (t.length >= 2 && !/^\d+([.,]\d+)?$/.test(t)) return true;
  }
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
    const hits = texts.filter((t) => /produto|item|descri|nome|categoria|departamento|unidade|preço|preco|qtd|quantidade/.test(t));
    if (hits.length >= 2) return { index: i, headers: row.map((x) => String(x ?? '').trim()) };
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

if (!fs.existsSync(INPUT)) {
  console.error('Arquivo Excel não encontrado:', INPUT);
  process.exit(1);
}

const zipEntries = parseZipEntries(fs.readFileSync(INPUT));
const workbookXml = zipEntries.get('xl/workbook.xml')?.toString('utf8');
const relsXml = zipEntries.get('xl/_rels/workbook.xml.rels')?.toString('utf8');
if (!workbookXml || !relsXml) throw new Error('workbook.xml ou rels não encontrado no xlsx');

const relMap = new Map();
for (const m of relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap.set(m[1], m[2].replace(/^\.\//, 'xl/'));
}

const sheetNames = [];
const sheetTargets = [];
for (const m of workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
  sheetNames.push(m[1]);
  sheetTargets.push(relMap.get(m[2]));
}

const sharedXml = zipEntries.get('xl/sharedStrings.xml');
const sharedStrings = sharedXml ? parseSharedStrings(sharedXml.toString('utf8')) : [];

const sheetsMeta = [];
const products = [];
const categoriesSet = new Set();

sheetNames.forEach((sheetName, idx) => {
  const target = sheetTargets[idx];
  const sheetBuf = zipEntries.get(target);
  if (!sheetBuf) return;
  const rows = parseSheetRows(sheetBuf.toString('utf8'), sharedStrings);
  const headerInfo = detectHeader(rows);
  const structure = {
    sheetName,
    rowCount: rows.length,
    detectedHeaderRowIndex: headerInfo ? headerInfo.index : null,
    headers: headerInfo ? headerInfo.headers : null,
    columnCount: rows.reduce((m, r) => Math.max(m, r.length), 0),
    parseMode: headerInfo ? 'tabular' : 'section',
  };

  let currentCategory = sheetName.trim();
  categoriesSet.add(currentCategory);

  if (headerInfo) {
    const headers = headerInfo.headers;
    const iName = colIndex(headers, [/produto|item|descri|nome/]);
    const iCat = colIndex(headers, [/categoria|departamento|grupo|familia|família|secao|seção/]);
    const iQty = colIndex(headers, [/qtd|quantidade|estoque|qtde/]);
    const iPrice = colIndex(headers, [/preço|preco|valor|vr|custo|venda/]);
    const iUnit = colIndex(headers, [/unidade|und|um/]);

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
      let rawName = row[nameCol] || cells[0].value;
      const name = cleanName(rawName);
      if (!name) continue;
      const cat = iCat >= 0 && row[iCat] ? String(row[iCat]).trim() : currentCategory;
      if (cat) categoriesSet.add(cat);
      const product = { sheet: sheetName, category: cat || sheetName, name, rawName: String(rawName).trim(), rowIndex: r + 1 };
      if (iUnit >= 0 && row[iUnit] !== '') product.unit = row[iUnit];
      if (iQty >= 0 && row[iQty] !== '') product.quantity = row[iQty];
      if (iPrice >= 0 && row[iPrice] !== '') product.price = row[iPrice];
      products.push(product);
    }
  } else {
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
      if (!name || /^(total|subtotal|categoria|departamento)\b/i.test(name)) continue;
      const product = { sheet: sheetName, category: currentCategory, name, rawName: String(rawName).trim(), rowIndex: r + 1 };
      if (cells.length > 1) product.extra = cells.slice(1).map((c) => c.value);
      products.push(product);
    }
  }

  sheetsMeta.push(structure);
});

const uniqueCategories = [...categoriesSet].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

const output = {
  sourceFile: INPUT,
  parsedAt: new Date().toISOString(),
  parser: 'standalone-zip',
  sheetNames,
  sheets: sheetsMeta,
  totalProducts: products.length,
  uniqueCategories,
  products,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
fs.writeFileSync(
  SUMMARY,
  [
    'SHEET_NAMES=' + JSON.stringify(sheetNames),
    'TOTAL_PRODUCTS=' + products.length,
    'UNIQUE_CATEGORIES=' + JSON.stringify(uniqueCategories),
    'COLUMN_STRUCTURE=' + JSON.stringify(sheetsMeta, null, 2),
    'PRODUCTS_LENGTH=' + products.length,
  ].join('\n\n'),
  'utf8'
);

console.log('OK', products.length, 'produtos', sheetNames.length, 'aba(s)');
