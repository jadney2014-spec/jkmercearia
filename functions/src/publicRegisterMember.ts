import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({ origin: true });

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string): string {
  return String(value || '').trim();
}

export const publicRegisterMember = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') {
        return res.status(200).send('');
      }

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
      }

      const body = req.body || {};

      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const phone = normalizePhone(body.phone);
      const address = typeof body.address === 'string' ? body.address.trim() : '';
      const birth_date = typeof body.birth_date === 'string' ? body.birth_date.trim() : '';

      if (!name || name.length < 3) {
        return res.status(400).json({ error: 'Nome inválido' });
      }

      if (!email || !isEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      if (!phone || phone.length < 8) {
        return res.status(400).json({ error: 'Telefone inválido' });
      }

      // Idempotência simples: evita duplicar o mesmo email (se já existir)
      const db = admin.firestore();
      const existing = await db
        .collection('members')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existing.empty) {
        return res.status(200).json({
          success: true,
          message: 'Cadastro já recebido anteriormente.',
          memberId: existing.docs[0].id,
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

      return res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso',
        memberId: docRef.id,
      });
    } catch (error: any) {
      console.error('❌ publicRegisterMember error:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      });
    }
  });
});
