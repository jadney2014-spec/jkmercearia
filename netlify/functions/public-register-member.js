const admin = require('firebase-admin');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function getAdminApp() {
  if (admin.apps && admin.apps.length > 0) return admin.app();

  // Netlify: configure FIREBASE_SERVICE_ACCOUNT as JSON string
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado no ambiente.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT inválido (JSON).');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método não permitido' });
  }

  try {
    getAdminApp();
    const db = admin.firestore();

    const body = JSON.parse(event.body || '{}');

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const birth_date = typeof body.birth_date === 'string' ? body.birth_date.trim() : '';
    const cpf = typeof body.cpf === 'string' ? body.cpf.trim() : '';
    const cell_group = typeof body.cell_group === 'string' ? body.cell_group.trim() : '';
    const photo_url = typeof body.photo_url === 'string' ? body.photo_url.trim() : '';

    if (!name || name.length < 3) {
      return json(400, { error: 'Nome inválido' });
    }

    if (!email || !isEmail(email)) {
      return json(400, { error: 'Email inválido' });
    }

    if (!phone || phone.length < 8) {
      return json(400, { error: 'Telefone inválido' });
    }

    if (cpf) {
      const digits = cpf.replace(/\D/g, '');
      if (digits.length !== 11) {
        return json(400, { error: 'CPF inválido' });
      }
    }

    let existing = await db.collection('members').where('email', '==', email).limit(1).get();
    if (existing.empty && cpf) {
      existing = await db.collection('members').where('cpf', '==', cpf.replace(/\D/g, '')).limit(1).get();
    }

    if (!existing.empty) {
      const doc = existing.docs[0];
      const current = doc.data() || {};

      const updates = {};
      if (!current.cpf && cpf) updates.cpf = cpf.replace(/\D/g, '');
      if (!current.cell_group && cell_group) updates.cell_group = cell_group;
      if (!current.photo_url && photo_url) updates.photo_url = photo_url;
      if (!current.address && address) updates.address = address;
      if (!current.birth_date && birth_date) updates.birth_date = birth_date;
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date();
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await doc.ref.update(updates);
      }

      return json(200, {
        success: true,
        message: 'Cadastro já recebido anteriormente.',
        memberId: doc.id,
        duplicated: true,
      });
    }

    const member_since = new Date().toISOString().slice(0, 10);

    const memberData = {
      name,
      email,
      phone,
      address: address || '',
      birth_date: birth_date || '',
      cpf: cpf ? cpf.replace(/\D/g, '') : '',
      cell_group: cell_group || '',
      photo_url: photo_url || '',
      member_since,
      status: 'active',
      notes: '',
      created_at: new Date(),
      updated_at: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'public_form',
    };

    const docRef = await db.collection('members').add(memberData);

    return json(201, {
      success: true,
      message: 'Cadastro realizado com sucesso',
      memberId: docRef.id,
    });
  } catch (error) {
    console.error('❌ public-register-member error:', error);
    return json(500, {
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? String(error && error.message ? error.message : error) : undefined,
    });
  }
};
