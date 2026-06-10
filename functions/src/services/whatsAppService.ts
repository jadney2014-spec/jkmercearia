import * as admin from 'firebase-admin';
import { BirthdayNotificationData, BirthdayMember } from './emailService';

export async function sendBirthdayWhatsApp(data: BirthdayNotificationData): Promise<boolean> {
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
  } catch (error: any) {
    console.error('❌ Erro ao enviar WhatsApp de aniversários:', error);
    return false;
  }
}

function formatWhatsAppMessage(data: BirthdayNotificationData): string {
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
  } else {
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
  } else {
    message += `Nenhum aniversariante nesta semana.\n`;
  }

  message += `\n_Esta é uma notificação automática do sistema de gestão._\n`;
  message += `_Que Deus abençoe todos os aniversariantes! 🙏_`;

  return message;
}

