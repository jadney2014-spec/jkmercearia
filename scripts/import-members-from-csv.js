const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function isEmpty(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

function parseDateYmd(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length > 0) return;

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svc) {
    const creds = JSON.parse(svc);
    admin.initializeApp({ credential: admin.credential.cert(creds) });
    return;
  }

  admin.initializeApp();
}

async function upsertMember(db, row) {
  const email = String(row.email || '').trim().toLowerCase();
  const cpfDigits = digitsOnly(row.cpf);

  let snap = null;

  if (email) {
    const q = await db.collection('members').where('email', '==', email).limit(1).get();
    if (!q.empty) snap = q.docs[0];
  }

  if (!snap && cpfDigits) {
    const q = await db.collection('members').where('cpf', '==', cpfDigits).limit(1).get();
    if (!q.empty) snap = q.docs[0];
  }

  const mapped = {
    name: String(row.name || '').trim(),
    email,
    phone: String(row.phone || '').trim(),
    address: String(row.address || '').trim(),
    birth_date: parseDateYmd(row.birth_date),
    cpf: cpfDigits,
    cell_group: String(row.cell_group || '').trim(),
    photo_url: String(row.photo_url || '').trim(),
    status: 'active',
    member_since: parseDateYmd(row.member_since),
  };

  if (snap) {
    const current = snap.data() || {};
    const updates = {};

    for (const [k, v] of Object.entries(mapped)) {
      if (k === 'status') continue;
      if (isEmpty(current[k]) && !isEmpty(v)) {
        updates[k] = v;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date();
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.source = current.source || 'csv_import';
      await snap.ref.update(updates);
      return { action: 'updated', id: snap.id, updates: Object.keys(updates) };
    }

    return { action: 'skipped', id: snap.id, updates: [] };
  }

  const doc = {
    ...mapped,
    notes: '',
    created_at: new Date(),
    updated_at: new Date(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'csv_import',
  };

  const ref = await db.collection('members').add(doc);
  return { action: 'created', id: ref.id, updates: [] };
}

async function main() {
  const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../csv/Cadastro Membros Resgate.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV não encontrado:', csvPath);
    process.exit(1);
  }

  initFirebaseAdmin();
  const db = admin.firestore();

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error('CSV vazio ou sem dados');
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);

  const iTimestamp = idx('Carimbo de data/hora');
  const iEmail = idx('Nome de usuário');
  const iName = idx('Nome completo:');
  const iCpf = idx('CPF: (somente digitos)');
  const iBirth = idx('Data Nascimento:');
  const iCell = idx('Célula:');
  const iAddress = idx('Endereço:');
  const iPhoto = idx('Foto: (a foto será utilizada para identificação e materiais futuros)');

  const report = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    rows: [],
  };

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cols = parseCsvLine(lines[lineIndex]);

    const row = {
      member_since: iTimestamp >= 0 ? parseDateYmd(cols[iTimestamp]) : '',
      email: iEmail >= 0 ? cols[iEmail] : '',
      name: iName >= 0 ? cols[iName] : '',
      cpf: iCpf >= 0 ? cols[iCpf] : '',
      birth_date: iBirth >= 0 ? cols[iBirth] : '',
      cell_group: iCell >= 0 ? cols[iCell] : '',
      address: iAddress >= 0 ? cols[iAddress] : '',
      photo_url: iPhoto >= 0 ? cols[iPhoto] : '',
      phone: '',
    };

    if (!row.email && !digitsOnly(row.cpf)) {
      continue;
    }

    report.total += 1;

    try {
      const res = await upsertMember(db, row);
      report.rows.push({ line: lineIndex + 1, email: row.email, cpf: digitsOnly(row.cpf), ...res });
      if (res.action === 'created') report.created += 1;
      else if (res.action === 'updated') report.updated += 1;
      else report.skipped += 1;
    } catch (e) {
      report.rows.push({ line: lineIndex + 1, email: row.email, cpf: digitsOnly(row.cpf), action: 'error', error: String(e && e.message ? e.message : e) });
    }
  }

  const outPath = path.resolve(process.cwd(), `import-members-report-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Import finalizado');
  console.log('CSV:', csvPath);
  console.log('Total processado:', report.total);
  console.log('Criados:', report.created);
  console.log('Atualizados:', report.updated);
  console.log('Ignorados:', report.skipped);
  console.log('Relatório:', outPath);
}

main().catch((e) => {
  console.error('Erro no import:', e);
  process.exit(1);
});
