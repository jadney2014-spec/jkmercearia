import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const addMembro = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
      }

      const { nome, email, telefone, endereco, nascimento } = req.body;

      if (!nome || !email || !telefone || !endereco || !nascimento) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      const newMember = {
        nome,
        email,
        telefone,
        endereco,
        nascimento,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const writeResult = await admin.firestore().collection('membros').add(newMember);

      res.status(201).json({
        success: true,
        message: 'Membro adicionado com sucesso!',
        id: writeResult.id,
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar membro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});
