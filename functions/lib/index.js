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
exports.onDevotionalCreatedSendNotification = exports.generateDailyDevotional = exports.resubscribeFcmTopicsDaily = exports.cleanupPastEvents = exports.onEventCreatedSendNotification = exports.onMemberFcmTokenWrite = exports.addMembro = exports.testBirthdayCheck = exports.checkBirthdays = exports.sendContactEmail = exports.verifyToken = exports.login = exports.health = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
// Inicializar Firebase Admin
admin.initializeApp();
// Configurar CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Função de health check
exports.health = functions.https.onRequest((req, res) => {
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
// Função de login (compatível com sistema atual)
exports.login = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username e password são obrigatórios' });
            }
            // Simulação de usuário (substituir por Firestore depois)
            const users = [
                {
                    id: 1,
                    username: 'admin',
                    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
                    name: 'Administrador',
                    role: 'admin'
                }
            ];
            const user = users.find(u => u.username === username);
            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            // Verificar senha (simplificado para demo)
            const bcrypt = require('bcryptjs');
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            // Gerar token JWT
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'firebase-secret-key', { expiresIn: '24h' });
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('❌ Erro no login:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });
});
// Função para verificar token
exports.verifyToken = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token é obrigatório' });
            }
            // Verificar token JWT
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, 'firebase-secret-key');
            res.json({
                valid: true,
                user: decoded
            });
        }
        catch (error) {
            console.error('❌ Erro na verificação do token:', error);
            res.status(401).json({ error: 'Token inválido' });
        }
    });
});
// Função para enviar email de contato
exports.sendContactEmail = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Método não permitido' });
            }
            const { name, email, message } = req.body;
            // Validação
            if (!name || !email || !message) {
                return res.status(400).json({
                    error: 'Todos os campos são obrigatórios',
                    required: ['name', 'email', 'message']
                });
            }
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email inválido' });
            }
            // Configuração do email (usando variáveis de ambiente)
            const nodemailer = require('nodemailer');
            // Verificar se as configurações de email estão disponíveis
            const emailConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
                auth: {
                    user: process.env.SMTP_USER || 'cresgate012@gmail.com',
                    pass: process.env.SMTP_PASS || '' // Senha de app do Gmail ou senha normal
                }
            };
            // Se não houver senha configurada, retornar erro informativo
            if (!emailConfig.auth.pass) {
                console.warn('⚠️ SMTP_PASS não configurado. Email não será enviado.');
                // Salvar no Firestore como fallback
                try {
                    await admin.firestore().collection('contact_messages').add({
                        name,
                        email,
                        message,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        status: 'pending',
                        source: 'website'
                    });
                    return res.status(200).json({
                        success: true,
                        message: 'Mensagem recebida e salva. Entraremos em contato em breve.',
                        saved: true
                    });
                }
                catch (firestoreError) {
                    console.error('Erro ao salvar no Firestore:', firestoreError);
                    return res.status(500).json({
                        error: 'Erro ao processar mensagem. Tente novamente mais tarde.',
                        fallback: 'Por favor, envie diretamente para cresgate012@gmail.com'
                    });
                }
            }
            // Criar transportador de email
            const transporter = nodemailer.createTransport(emailConfig);
            // Configurar email para a igreja
            const mailOptions = {
                from: `"${name}" <${emailConfig.auth.user}>`,
                replyTo: email,
                to: 'cresgate012@gmail.com',
                subject: `Contato do Site - ${name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Nova Mensagem de Contato</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Mensagem:</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>Esta mensagem foi enviada através do formulário de contato do site da Comunidade Cristã Resgate.</p>
            </div>
          </div>
        `,
                text: `
Nova Mensagem de Contato

Nome: ${name}
Email: ${email}
Data: ${new Date().toLocaleString('pt-BR')}

Mensagem:
${message}

---
Esta mensagem foi enviada através do formulário de contato do site da Comunidade Cristã Resgate.
        `
            };
            // Enviar email
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email enviado:', info.messageId);
            // Salvar no Firestore para histórico
            try {
                await admin.firestore().collection('contact_messages').add({
                    name,
                    email,
                    message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'sent',
                    source: 'website',
                    emailId: info.messageId
                });
            }
            catch (firestoreError) {
                console.warn('⚠️ Erro ao salvar no Firestore (não crítico):', firestoreError);
            }
            // Enviar email de confirmação para o usuário (opcional)
            try {
                const confirmationMail = {
                    from: `"Comunidade Cristã Resgate" <${emailConfig.auth.user}>`,
                    to: email,
                    subject: 'Recebemos sua mensagem - Comunidade Cristã Resgate',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">Olá, ${name}!</h2>
              <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Sua mensagem:</strong></p>
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <p>Obrigado por entrar em contato conosco!</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Comunidade Cristã Resgate<br>
                Quadra 38, Área Especial, Lote E<br>
                Vila São José, Brasília - DF, 72010-010<br>
                Email: cresgate012@gmail.com
              </p>
            </div>
          `
                };
                await transporter.sendMail(confirmationMail);
                console.log('✅ Email de confirmação enviado');
            }
            catch (confirmationError) {
                console.warn('⚠️ Erro ao enviar email de confirmação (não crítico):', confirmationError);
            }
            res.status(200).json({
                success: true,
                message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
                messageId: info.messageId
            });
        }
        catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            // Tentar salvar no Firestore como fallback
            try {
                const { name, email, message } = req.body;
                await admin.firestore().collection('contact_messages').add({
                    name,
                    email,
                    message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'error',
                    source: 'website',
                    error: error.message
                });
            }
            catch (firestoreError) {
                console.error('Erro ao salvar no Firestore:', firestoreError);
            }
            res.status(500).json({
                error: 'Erro ao enviar mensagem. Tente novamente mais tarde.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
});
// Exportar funções de aniversários
var birthdayNotifications_1 = require("./birthdayNotifications");
Object.defineProperty(exports, "checkBirthdays", { enumerable: true, get: function () { return birthdayNotifications_1.checkBirthdays; } });
Object.defineProperty(exports, "testBirthdayCheck", { enumerable: true, get: function () { return birthdayNotifications_1.testBirthdayCheck; } });
// Exportar função de membros
var membros_1 = require("./membros");
Object.defineProperty(exports, "addMembro", { enumerable: true, get: function () { return membros_1.addMembro; } });
// Exportar funções de eventos (notificação e limpeza automática)
var eventsNotifications_1 = require("./eventsNotifications");
Object.defineProperty(exports, "onMemberFcmTokenWrite", { enumerable: true, get: function () { return eventsNotifications_1.onMemberFcmTokenWrite; } });
Object.defineProperty(exports, "onEventCreatedSendNotification", { enumerable: true, get: function () { return eventsNotifications_1.onEventCreatedSendNotification; } });
Object.defineProperty(exports, "cleanupPastEvents", { enumerable: true, get: function () { return eventsNotifications_1.cleanupPastEvents; } });
Object.defineProperty(exports, "resubscribeFcmTopicsDaily", { enumerable: true, get: function () { return eventsNotifications_1.resubscribeFcmTopicsDaily; } });
// Exportar função agendada de devocional (Gemini)
var devotionalsGenerator_1 = require("./devotionalsGenerator");
Object.defineProperty(exports, "generateDailyDevotional", { enumerable: true, get: function () { return devotionalsGenerator_1.generateDailyDevotional; } });
Object.defineProperty(exports, "onDevotionalCreatedSendNotification", { enumerable: true, get: function () { return devotionalsGenerator_1.onDevotionalCreatedSendNotification; } });
//# sourceMappingURL=index.js.map