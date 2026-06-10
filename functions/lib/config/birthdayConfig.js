"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    notificationTime: '08:00',
    recipientEmail: process.env.BIRTHDAY_EMAIL || 'cresgate012@gmail.com',
    recipientWhatsApp: process.env.BIRTHDAY_WHATSAPP || '',
    timezone: 'America/Sao_Paulo',
    weeklyNotificationDay: 0 // Domingo
};
//# sourceMappingURL=birthdayConfig.js.map