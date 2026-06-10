export interface BirthdayConfig {
  notificationTime: string; // Horário no formato HH:mm (ex: "08:00")
  recipientEmail: string;
  recipientWhatsApp: string;
  timezone: string;
  weeklyNotificationDay: number; // 0 = Domingo, 1 = Segunda, etc.
}

export const defaultConfig: BirthdayConfig = {
  notificationTime: '08:00',
  recipientEmail: process.env.BIRTHDAY_EMAIL || 'cresgate012@gmail.com',
  recipientWhatsApp: process.env.BIRTHDAY_WHATSAPP || '',
  timezone: 'America/Sao_Paulo',
  weeklyNotificationDay: 0 // Domingo
};

