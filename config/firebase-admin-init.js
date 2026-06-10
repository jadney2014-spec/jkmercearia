const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, '..', 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }

  return null;
}

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin.app();
  }

  admin.initializeApp();
  return admin.app();
}

module.exports = { initFirebaseAdmin, loadServiceAccount };
