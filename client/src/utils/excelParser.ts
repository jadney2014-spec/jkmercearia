export interface ParsedExcelProduct {
  sheet: string;
  category: string;
  name: string;
  rawName: string;
  rowIndex: number;
  quantity?: number | string;
  price?: number | string;
  unit?: string;
}

export interface ParsedExcelResult {
  sheetNames: string[];
  totalProducts: number;
  uniqueCategories: string[];
  products: ParsedExcelProduct[];
}

export function cleanProductName(name: unknown): string {
  if (name == null) return '';
  let s = String(name).trim();
  s = s.replace(/^\s*\(UNIDADE\)\s*/gi, '');
  s = s.replace(/\s*\(UNIDADE\)\s*$/gi, '');
  return s.trim();
}

function readUInt16LE(buf: Uint8Array, off: number): number {
  return buf[off] | (buf[off + 1] << 8);
}

function readUInt32LE(buf: Uint8Array, off: number): number {
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}

type InflateStream = {
  writable: WritableStream<Uint8Array>;
  readable: ReadableStream<Uint8Array>;
};

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const Decomp = (globalThis as { DecompressionStream?: new (format: string) => InflateStream }).DecompressionStream;
  if (!Decomp) {
    throw new Error('DecompressionStream não é suportado neste navegador.');
  }
  const ds = new Decomp('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  const pump = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  })();
  await writer.write(data);
  await writer.close();
  await pump;
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

async function parseZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const buf = new Uint8Array(buffer);
  const entries = new Map<string, Uint8Array>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Arquivo Excel inválido (ZIP não encontrado)');

  const cdOffset = readUInt32LE(buf, eocd + 16);
  let pos = cdOffset;
  while (pos < eocd) {
    if (buf[pos] !== 0x50 || buf[pos + 1] !== 0x4b || buf[pos + 2] !== 0x01 || buf[pos + 3] !== 0x02) break;
    const compMethod = readUInt16LE(buf, pos + 10);
    const compSize = readUInt32LE(buf, pos + 20);
    const nameLen = readUInt16LE(buf, pos + 28);
    const extraLen = readUInt16LE(buf, pos + 30);
    const commentLen = readUInt16LE(buf, pos + 32);
    const localHeaderOffset = readUInt32LE(buf, pos + 42);
    const name = new TextDecoder().decode(buf.slice(pos + 46, pos + 46 + nameLen));
    pos += 46 + nameLen + extraLen + commentLen;

    const lh = localHeaderOffset;
    const lhNameLen = readUInt16LE(buf, lh + 26);
    const lhExtraLen = readUInt16LE(buf, lh + 28);
    const dataStart = lh + 30 + lhNameLen + lhExtraLen;
    let data = buf.slice(dataStart, dataStart + compSize);
    if (compMethod === 8) data = await inflateRaw(data);
    else if (compMethod !== 0) throw new Error(`Formato ZIP não suportado: ${name}`);
    entries.set(name.replace(/\\/g, '/'), data);
  }
  return entries;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const parts = Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((x) => decodeXml(x[1]));
    strings.push(parts.join(''));
  }
  return strings;
}

function colLettersToIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref: string): { col: number; row: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colLettersToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
}

function parseSheetRows(xml: string, sharedStrings: string[]): string[][] {
  const rowsMap = new Map<number, string[]>();
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowIndex = parseInt(rowMatch[1], 10) - 1;
    const rowBody = rowMatch[2];
    const cellRe = /<c[^>]*r="([A-Z]+\d+)"([^>]*)>(?:[\s\S]*?<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g;
    let cellMatch: RegExpExecArray | null;
    const cells: { col: number; value: string | number | boolean }[] = [];
    while ((cellMatch = cellRe.exec(rowBody))) {
      const ref = parseCellRef(cellMatch[1]);
      if (!ref) continue;
      const attrs = cellMatch[2] || '';
      const rawVal = cellMatch[3] != null ? decodeXml(cellMatch[3]) : '';
      let value: string | number | boolean = rawVal;
      if (/t="s"/.test(attrs) && rawVal !== '') value = sharedStrings[parseInt(rawVal, 10)] ?? '';
      else if (/t="b"/.test(attrs)) value = rawVal === '1';
      else if (rawVal !== '' && !Number.isNaN(Number(rawVal))) value = Number(rawVal);
      cells.push({ col: ref.col, value });
    }
    cells.sort((a, b) => a.col - b.col);
    const maxCol = cells.reduce((m, c) => Math.max(m, c.col), -1);
    const row = new Array(maxCol + 1).fill('');
    for (const c of cells) row[c.col] = String(c.value);
    rowsMap.set(rowIndex, row);
  }
  if (!rowsMap.size) return [];
  const maxRow = Math.max(...Array.from(rowsMap.keys()));
  const rows: string[][] = [];
  for (let i = 0; i <= maxRow; i++) rows.push(rowsMap.get(i) || []);
  return rows;
}

function rowCells(row: string[]) {
  const cells: { col: number; value: string }[] = [];
  for (let c = 0; c < row.length; c++) {
    const v = row[c];
    if (v !== '' && v != null && String(v).trim() !== '') cells.push({ col: c, value: String(v) });
  }
  return cells;
}

function looksLikeCategory(cells: { col: number; value: string }[], row: string[]): boolean {
  if (cells.length === 1) {
    const t = cells[0].value.trim();
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

function detectHeader(rows: string[][]) {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    const texts = row.map((x) => String(x ?? '').trim().toLowerCase());
    const hits = texts.filter((t) =>
      /produto|item|descri|nome|categoria|departamento|unidade|preço|preco|qtd|quantidade/.test(t)
    );
    if (hits.length >= 2) return { index: i, headers: row.map((x) => String(x ?? '').trim()) };
  }
  return null;
}

function colIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

function parseNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export async function parseExcelFile(file: ArrayBuffer): Promise<ParsedExcelResult> {
  const zipEntries = await parseZipEntries(file);
  const workbookXml = zipEntries.get('xl/workbook.xml');
  const relsXml = zipEntries.get('xl/_rels/workbook.xml.rels');
  if (!workbookXml || !relsXml) throw new Error('Planilha Excel inválida');

  const workbookText = new TextDecoder().decode(workbookXml);
  const relsText = new TextDecoder().decode(relsXml);

  const relMap = new Map<string, string>();
  Array.from(relsText.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)).forEach((m) => {
    relMap.set(m[1], m[2].replace(/^\.\//, 'xl/'));
  });

  const sheetNames: string[] = [];
  const sheetTargets: string[] = [];
  Array.from(workbookText.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)).forEach((m) => {
    sheetNames.push(m[1]);
    sheetTargets.push(relMap.get(m[2]) || '');
  });

  const sharedXml = zipEntries.get('xl/sharedStrings.xml');
  const sharedStrings = sharedXml ? parseSharedStrings(new TextDecoder().decode(sharedXml)) : [];

  const products: ParsedExcelProduct[] = [];
  const categoriesSet = new Set<string>();

  sheetNames.forEach((sheetName, idx) => {
    const target = sheetTargets[idx];
    const sheetBuf = zipEntries.get(target);
    if (!sheetBuf) return;

    const rows = parseSheetRows(new TextDecoder().decode(sheetBuf), sharedStrings);
    const headerInfo = detectHeader(rows);
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
          currentCategory = cells[0].value.trim();
          categoriesSet.add(currentCategory);
          continue;
        }
        const nameCol = iName >= 0 ? iName : 0;
        const rawName = row[nameCol] || cells[0].value;
        const name = cleanProductName(rawName);
        if (!name) continue;
        const cat = iCat >= 0 && row[iCat] ? String(row[iCat]).trim() : currentCategory;
        if (cat) categoriesSet.add(cat);
        const product: ParsedExcelProduct = {
          sheet: sheetName,
          category: cat || sheetName,
          name,
          rawName: String(rawName).trim(),
          rowIndex: r + 1,
        };
        if (iUnit >= 0 && row[iUnit] !== '') product.unit = row[iUnit];
        if (iQty >= 0 && row[iQty] !== '') product.quantity = parseNumber(row[iQty]);
        if (iPrice >= 0 && row[iPrice] !== '') product.price = parseNumber(row[iPrice]);
        products.push(product);
      }
    } else {
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = rowCells(row);
        if (!cells.length) continue;
        if (looksLikeCategory(cells, row)) {
          currentCategory = cells[0].value.trim();
          categoriesSet.add(currentCategory);
          continue;
        }
        const rawName = cells[0].value;
        const name = cleanProductName(rawName);
        if (!name || /^(total|subtotal|categoria|departamento)\b/i.test(name)) continue;
        const product: ParsedExcelProduct = {
          sheet: sheetName,
          category: currentCategory,
          name,
          rawName: String(rawName).trim(),
          rowIndex: r + 1,
        };
        if (cells.length > 1) {
          const qty = parseNumber(cells[1].value);
          if (qty > 0) product.quantity = qty;
        }
        products.push(product);
      }
    }
  });

  const uniqueCategories = Array.from(categoriesSet).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return {
    sheetNames,
    totalProducts: products.length,
    uniqueCategories,
    products,
  };
}
