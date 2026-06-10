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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBirthdayWhatsApp = sendBirthdayWhatsApp;
const admin = __importStar(require("firebase-admin"));
async function sendBirthdayWhatsApp(data) {
    try {
        const recipientWhatsApp = process.env.BIRTHDAY_WHATSAPP || '';
        if (!recipientWhatsApp) {
            console.warn('⚠️ BIRTHDAY_WHATSAPP não configurado. WhatsApp não será enviado.');
            return false;
        }
        // Se houver API do WhatsApp configurada (Twilio, etc), usar aqui
        // Por enquanto, vamos gerar um link do WhatsApp Web como fallback
        const message = formatWhatsAppMessage(data);
        // Gerar link do WhatsApp Web
        const encodedMessage = encodeURIComponent(message);
        const whatsappLink = `https://wa.me/${recipientWhatsApp.replace(/\D/g, '')}?text=${encodedMessage}`;
        console.log('📱 Link do WhatsApp gerado:', whatsappLink);
        console.log('💬 Mensagem formatada:', message);
        // Salvar link no Firestore para acesso posterior
        await admin.firestore().collection('birthday_notifications').add({
            type: 'whatsapp',
            date: data.date,
            link: whatsappLink,
            message: message,
            todayCount: data.today.length,
            weekCount: data.thisWeek.length,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        // Se você tiver API do WhatsApp configurada, descomente e use:
        /*
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${recipientWhatsApp}`,
          body: message
        });
        */
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao enviar WhatsApp de aniversários:', error);
        return false;
    }
}
function formatWhatsAppMessage(data) {
    let message = `🎉 *NOTIFICAÇÃO DE ANIVERSÁRIOS*\n`;
    message += `Comunidade Cristã Resgate\n`;
    message += `${data.date}\n\n`;
    message += `*ANIVERSARIANTES DE HOJE* (${data.today.length}):\n`;
    if (data.today.length > 0) {
        data.today.forEach(member => {
            message += `🎂 ${member.name}`;
            if (member.phone) {
                message += ` - ${member.phone}`;
            }
            message += `\n`;
        });
    }
    else {
        message += `Nenhum aniversariante hoje.\n`;
    }
    message += `\n*ANIVERSARIANTES DESTA SEMANA* (${data.thisWeek.length}):\n`;
    if (data.thisWeek.length > 0) {
        data.thisWeek.forEach(member => {
            const birthDate = new Date(member.birth_date);
            const today = new Date();
            const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            const dayName = thisYear.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dayNumber = thisYear.getDate();
            const monthName = thisYear.toLocaleDateString('pt-BR', { month: 'long' });
            message += `🎂 ${member.name} - ${dayNumber} de ${monthName} (${dayName})`;
            if (member.phone) {
                message += ` - ${member.phone}`;
            }
            message += `\n`;
        });
    }
    else {
        message += `Nenhum aniversariante nesta semana.\n`;
    }
    message += `\n_Esta é uma notificação automática do sistema de gestão._\n`;
    message += `_Que Deus abençoe todos os aniversariantes! 🙏_`;
    return message;
}
//# sourceMappingURL=whatsAppService.js.map