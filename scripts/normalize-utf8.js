/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const extensions = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.json', '.html', '.css', '.md'
]);

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'build',
  'dist',
  '.next',
  'out',
  'coverage',
  '.turbo',
  '.vite',
  '.cache',
  'client/build'
]);

function shouldIgnoreDir(dirName, fullPath) {
  if (IGNORE_DIRS.has(dirName)) return true;

  const normalized = fullPath.replace(/\\/g, '/');
  if (normalized.includes('/node_modules/')) return true;
  if (normalized.includes('/client/build/')) return true;
  if (normalized.includes('/build/')) return true;
  if (normalized.includes('/dist/')) return true;
  if (normalized.includes('/.git/')) return true;

  return false;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (shouldIgnoreDir(ent.name, fullPath)) continue;
      out.push(...walk(fullPath));
      continue;
    }

    out.push(fullPath);
  }

  return out;
}

function fixMaybeLatin1(buffer) {
  const utf8 = buffer.toString('utf8');
  const latin1 = buffer.toString('latin1');

  // Se UTF-8 tiver muitos replacement chars () e o Latin1 parecer mojibake (Ã/Â),
  // tentamos reinterpretar como Latin1 -> UTF-8.
  if (utf8.includes('\uFFFD') && /[ÃÂ]/.test(latin1)) {
    try {
      const recovered = Buffer.from(latin1, 'latin1').toString('utf8');
      if (recovered && recovered !== utf8) return recovered;
    } catch {
      // ignore
    }
  }

  return utf8;
}

function countMojibakeMarkers(s) {
  // marcadores mais comuns quando UTF-8 foi salvo/mostrado como latin1
  const m = s.match(/[ÃÂ]|â€”|â€“|â€|ðŸ|ï»¿/g);
  return m ? m.length : 0;
}

function fixCommonMojibakeString(s) {
  // Ex.: "ServiÃ§o" (bytes de UTF-8 salvos como texto) => reinterpretar como latin1 e decodificar UTF-8.
  if (!/[ÃÂ]|â€”|â€“|â€|ðŸ|ï»¿/.test(s)) return s;

  try {
    const candidate = Buffer.from(s, 'latin1').toString('utf8');

    // Só aceita se realmente melhorar (reduz mojibake) e não introduz replacement chars.
    if (
      candidate &&
      candidate !== s &&
      !candidate.includes('\uFFFD') &&
      countMojibakeMarkers(candidate) < countMojibakeMarkers(s)
    ) {
      return candidate;
    }
  } catch {
    // ignore
  }

  return s;
}

function normalizeContent(input) {
  const fixedMojibake = fixCommonMojibakeString(input);
  return (
    fixedMojibake
      // remove BOM
      .replace(/^\uFEFF/, '')
      // remove replacement char
      .replace(/\uFFFD/g, '')
      // normaliza composição
      .normalize('NFC')
  );
}

function main() {
  const root = process.cwd();
  const files = walk(root);

  let changed = 0;
  let scanned = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!extensions.has(ext)) continue;

    scanned++;

    let buffer;
    try {
      buffer = fs.readFileSync(file);
    } catch {
      continue;
    }

    const original = buffer.toString('utf8');
    const fixed = normalizeContent(fixMaybeLatin1(buffer));

    if (original !== fixed) {
      fs.writeFileSync(file, fixed, { encoding: 'utf8' });
      changed++;
      console.log(`✔ Corrigido: ${path.relative(root, file)}`);
    }
  }

  console.log(`\nArquivos analisados: ${scanned}`);
  console.log(`Arquivos corrigidos: ${changed}`);
}

main();
