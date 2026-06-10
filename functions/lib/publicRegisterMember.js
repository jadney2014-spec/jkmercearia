"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRegisterMember = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function normalizePhone(value) {
    return String(value || '').trim();
}
exports.publicRegisterMember = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('❌ publicRegisterMember error:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            });
        }
    });
});
//# sourceMappingURL=publicRegisterMember.js.map