import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar CORS
const corsHandler = cors({ origin: true });

// Função de health check
export const health = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, () => {
    console.log('🏥 Health check Firebase Functions');
    
    res.status(200).json({
      status: 'OK',
      message: 'Firebase Functions funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path
    });
  });
});