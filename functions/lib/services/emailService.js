"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBirthdayEmail = sendBirthdayEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendBirthdayEmail(data) {
    try {
        const emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || 'cresgate012@gmail.com',
                pass: process.env.SMTP_PASS || ''
            }
        };
        if (!emailConfig.auth.pass) {
            console.warn('⚠️ SMTP_PASS não configurado. Email não será enviado.');
            return false;
        }
        const transporter = nodemailer_1.default.createTransport(emailConfig);
        const recipientEmail = process.env.BIRTHDAY_EMAIL || 'cresgate012@gmail.com';
        const todayList = data.today.length > 0
            ? data.today.map(m => `• ${m.name}${m.phone ? ` (${m.phone})` : ''}`).join('<br>')
            : '<p style="color: #6b7280;">Nenhum aniversariante hoje.</p>';
        const weekList = data.thisWeek.length > 0
            ? data.thisWeek.map(m => {
                const birthDate = new Date(m.birth_date);
                const today = new Date();
                const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const dayName = thisYear.toLocaleDateString('pt-BR', { weekday: 'long' });
                const dayNumber = thisYear.getDate();
                const monthName = thisYear.toLocaleDateString('pt-BR', { month: 'long' });
                return `• ${m.name} - ${dayNumber} de ${monthName} (${dayName})${m.phone ? ` - ${m.phone}` : ''}`;
            }).join('<br>')
            : '<p style="color: #6b7280;">Nenhum aniversariante nesta semana.</p>';
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 30px; }
          .section-title { color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
          .birthday-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 10px; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Notificação de Aniversários</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Comunidade Cristã Resgate</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${data.date}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2 class="section-title">
                Aniversariantes de Hoje
                <span class="badge">${data.today.length}</span>
              </h2>
              <div class="birthday-list">
                ${todayList}
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">
                Aniversariantes desta Semana
                <span class="badge">${data.thisWeek.length}</span>
              </h2>
              <div class="birthday-list">
                ${weekList}
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão da Comunidade Cristã Resgate.</p>
            <p style="margin-top: 10px;">Que Deus abençoe todos os aniversariantes! 🙏</p>
          </div>
        </div>
      </body>
      </html>
    `;
        const textContent = `
🎉 NOTIFICAÇÃO DE ANIVERSÁRIOS
Comunidade Cristã Resgate
${data.date}

ANIVERSARIANTES DE HOJE (${data.today.length}):
${data.today.length > 0
            ? data.today.map(m => `• ${m.name}${m.phone ? ` (${m.phone})` : ''}`).join('\n')
            : 'Nenhum aniversariante hoje.'}

ANIVERSARIANTES DESTA SEMANA (${data.thisWeek.length}):
${data.thisWeek.length > 0
            ? data.thisWeek.map(m => {
                const birthDate = new Date(m.birth_date);
                const today = new Date();
                const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                const dayName = thisYear.toLocaleDateString('pt-BR', { weekday: 'long' });
                const dayNumber = thisYear.getDate();
                const monthName = thisYear.toLocaleDateString('pt-BR', { month: 'long' });
                return `• ${m.name} - ${dayNumber} de ${monthName} (${dayName})${m.phone ? ` - ${m.phone}` : ''}`;
            }).join('\n')
            : 'Nenhum aniversariante nesta semana.'}

---
Esta é uma notificação automática do sistema de gestão da Comunidade Cristã Resgate.
Que Deus abençoe todos os aniversariantes! 🙏
    `;
        const mailOptions = {
            from: `"Sistema de Aniversários - Comunidade Cristã Resgate" <${emailConfig.auth.user}>`,
            to: recipientEmail,
            subject: `🎉 Aniversários - ${data.date}`,
            html: htmlContent,
            text: textContent
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de aniversários enviado:', info.messageId);
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao enviar email de aniversários:', error);
        return false;
    }
}
//# sourceMappingURL=emailService.js.map