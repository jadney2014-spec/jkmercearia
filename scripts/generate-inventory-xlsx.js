const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const items = require('./inventario-dados');

const OUT_DIR = path.join(__dirname, '..', 'data');
const XLSX_PATH = path.join(OUT_DIR, 'inventario-mercearia.xlsx');
const JSON_PATH = path.join(OUT_DIR, 'inventario-mercearia.json');
const CSV_PATH = path.join(OUT_DIR, 'inventario-mercearia.csv');
const TXT_PATH = path.join(OUT_DIR, 'inventario-mercearia.txt');

function sheetName(category) {
  return category.slice(0, 31).replace(/[\\/*?:\[\]]/g, ' ');
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const byCategory = new Map();
  for (const item of items) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  const workbook = XLSX.utils.book_new();
  for (const [category, list] of byCategory) {
    const rows = [
      ['Produto', 'Quantidade', 'Unidade'],
      ...list.map((i) => [i.name, i.quantity, i.unit || 'un']),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName(category));
  }
  XLSX.writeFile(workbook, XLSX_PATH);

  fs.writeFileSync(JSON_PATH, JSON.stringify(items, null, 2), 'utf8');

  const csvLines = ['Categoria;Produto;Quantidade;Unidade'];
  for (const i of items) {
    csvLines.push(`${i.category};${i.name};${i.quantity};${i.unit || 'un'}`);
  }
  fs.writeFileSync(CSV_PATH, csvLines.join('\n'), 'utf8');

  const txtLines = ['INVENTÁRIO JK MERCEARIA', `Total de itens: ${items.length}`, ''];
  let currentCat = '';
  for (const i of items) {
    if (i.category !== currentCat) {
      currentCat = i.category;
      txtLines.push('', `=== ${currentCat} ===`);
    }
    txtLines.push(`${i.name} — ${i.quantity} ${i.unit || 'un'}`);
  }
  fs.writeFileSync(TXT_PATH, txtLines.join('\n'), 'utf8');

  console.log(`Itens: ${items.length}`);
  console.log(`Categorias: ${byCategory.size}`);
  console.log(`Excel: ${XLSX_PATH}`);
  console.log(`JSON:  ${JSON_PATH}`);
  console.log(`CSV:   ${CSV_PATH}`);
  console.log(`TXT:   ${TXT_PATH}`);
}

main();
