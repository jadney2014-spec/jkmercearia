import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendBirthdayEmail, BirthdayNotificationData, BirthdayMember } from './services/emailService';
import { sendBirthdayWhatsApp } from './services/whatsAppService';
import { defaultConfig } from './config/birthdayConfig';

/**
 * Função agendada que verifica aniversários diariamente às 8h
 * Usa Firebase Scheduler (Cloud Scheduler) para executar
 */
export const checkBirthdays = functions.pubsub
  .schedule('0 8 * * *') // Todos os dias às 8h (UTC)
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('🎂 Iniciando verificação de aniversários...');
    
    try {
      const db = admin.firestore();
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentDay = today.getDate();
      
      // Calcular início e fim da semana (domingo a sábado)
      const dayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Buscar todos os membros
      const membersSnapshot = await db.collection('members').get();

      if (membersSnapshot.empty) {
        console.log('⚠️ Nenhum membro com data de nascimento encontrado.');
        return null;
      }

      const allMembers: BirthdayMember[] = [];
      membersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.birth_date) {
          allMembers.push({
            id: doc.id,
            name: data.name || 'Nome não informado',
            birth_date: data.birth_date,
            phone: data.phone || undefined,
            email: data.email || undefined
          });
        }
      });

      // Filtrar aniversariantes do dia
      const todayBirthdays = allMembers.filter(member => {
        const birthDate = new Date(member.birth_date);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        return birthMonth === currentMonth && birthDay === currentDay;
      });

      // Filtrar aniversariantes da semana
      const weekBirthdays = allMembers.filter(member => {
        const birthDate = new Date(member.birth_date);
        const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        return thisYear >= startOfWeek && thisYear <= endOfWeek;
      });

      // Remover duplicatas (aniversariantes do dia já estão na semana)
      const weekOnlyBirthdays = weekBirthdays.filter(
        member => !todayBirthdays.some(todayMember => todayMember.id === member.id)
      );

      console.log(`✅ Encontrados ${todayBirthdays.length} aniversariantes hoje`);
      console.log(`✅ Encontrados ${weekOnlyBirthdays.length} aniversariantes adicionais nesta semana`);

      // Verificar se já foi enviada notificação hoje
      const todayStr = today.toISOString().split('T')[0];
      const existingNotification = await db.collection('birthday_notifications')
        .where('date', '==', todayStr)
        .where('type', '==', 'daily')
        .limit(1)
        .get();

      if (!existingNotification.empty) {
        console.log('ℹ️ Notificação já foi enviada hoje. Pulando...');
        return null;
      }

      // Preparar dados para notificação
      const notificationData: BirthdayNotificationData = {
        today: todayBirthdays,
        thisWeek: weekOnlyBirthdays,
        date: today.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };

      // Enviar notificações
      const emailSent = await sendBirthdayEmail(notificationData);
      const whatsappSent = await sendBirthdayWhatsApp(notificationData);

      // Salvar no Firestore para dashboard
      await db.collection('birthday_notifications').add({
        type: 'daily',
        date: todayStr,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        today: todayBirthdays.map(m => ({ id: m.id, name: m.name })),
        thisWeek: weekOnlyBirthdays.map(m => ({ id: m.id, name: m.name })),
        todayCount: todayBirthdays.length,
        weekCount: weekOnlyBirthdays.length,
        emailSent,
        whatsappSent,
        status: 'completed'
      });

      console.log('✅ Notificação de aniversários processada com sucesso!');
      console.log(`   Email: ${emailSent ? '✅' : '❌'}`);
      console.log(`   WhatsApp: ${whatsappSent ? '✅' : '❌'}`);

      return null;
    } catch (error: any) {
      console.error('❌ Erro ao verificar aniversários:', error);
      
      // Salvar erro no Firestore
      try {
        await admin.firestore().collection('birthday_notifications').add({
          type: 'daily',
          date: new Date().toISOString().split('T')[0],
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'error',
          error: error.message
        });
      } catch (firestoreError) {
        console.error('❌ Erro ao salvar erro no Firestore:', firestoreError);
      }
      
      throw error;
    }
  });

/**
 * Função HTTP para testar manualmente a verificação de aniversários
 */
export const testBirthdayCheck = functions.https.onRequest(async (req, res) => {
  try {
    console.log('🧪 Teste manual de verificação de aniversários...');
    
    const db = admin.firestore();
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    // Calcular semana
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const membersSnapshot = await db.collection('members')
      .where('birth_date', '!=', null)
      .get();

    const allMembers: BirthdayMember[] = [];
    membersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.birth_date) {
        allMembers.push({
          id: doc.id,
          name: data.name || 'Nome não informado',
          birth_date: data.birth_date,
          phone: data.phone || undefined,
          email: data.email || undefined
        });
      }
    });

    const todayBirthdays = allMembers.filter(member => {
      const birthDate = new Date(member.birth_date);
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();
      return birthMonth === currentMonth && birthDay === currentDay;
    });

    const weekBirthdays = allMembers.filter(member => {
      const birthDate = new Date(member.birth_date);
      const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      return thisYear >= startOfWeek && thisYear <= endOfWeek;
    });

    const weekOnlyBirthdays = weekBirthdays.filter(
      member => !todayBirthdays.some(todayMember => todayMember.id === member.id)
    );

    const notificationData: BirthdayNotificationData = {
      today: todayBirthdays,
      thisWeek: weekOnlyBirthdays,
      date: today.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    // Enviar notificações (sem verificar duplicação para teste)
    const emailSent = await sendBirthdayEmail(notificationData);
    const whatsappSent = await sendBirthdayWhatsApp(notificationData);

    res.json({
      success: true,
      message: 'Teste de aniversários executado',
      data: {
        today: todayBirthdays.length,
        thisWeek: weekOnlyBirthdays.length,
        todayList: todayBirthdays.map(m => m.name),
        weekList: weekOnlyBirthdays.map(m => m.name),
        emailSent,
        whatsappSent
      }
    });
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

