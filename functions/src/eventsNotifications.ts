import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const TOPIC_EVENTS = 'events';
const TOPIC_DEVOTIONALS = 'devotionals';

function toDateString(value: any): string | null {
  if (!value) return null;

  // Firestore Timestamp
  if (value?.toDate && typeof value.toDate === 'function') {
    const d: Date = value.toDate();
    return d.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    // expected: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
}

function formatEventDatePtBr(dateStr: string | null, time?: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1);

  const formatted = dt.toLocaleDateString('pt-BR');
  return time ? `${formatted} às ${time}` : formatted;
}

export const onMemberFcmTokenWrite = functions.firestore
  .document('members/{memberId}')
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const beforeToken = before?.fcm_token;
    const afterToken = after?.fcm_token;

    if (beforeToken === afterToken) return null;

    try {
      if (beforeToken && typeof beforeToken === 'string') {
        await admin.messaging().unsubscribeFromTopic([beforeToken], TOPIC_EVENTS);
        await admin.messaging().unsubscribeFromTopic([beforeToken], TOPIC_DEVOTIONALS);
      }

      if (afterToken && typeof afterToken === 'string') {
        await admin.messaging().subscribeToTopic([afterToken], TOPIC_EVENTS);
        await admin.messaging().subscribeToTopic([afterToken], TOPIC_DEVOTIONALS);
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao atualizar inscrição em tópico (events):', error);
      return null;
    }
  });

export const onEventCreatedSendNotification = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};

    const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Novo evento';
    const description = typeof data.description === 'string' ? data.description : '';

    const dateStr = toDateString(data.date);
    const time = typeof data.time === 'string' ? data.time : undefined;
    const when = formatEventDatePtBr(dateStr, time);

    const body = [when ? `📅 ${when}` : null, description ? description : null]
      .filter(Boolean)
      .join('\n');

    try {
      const message: admin.messaging.Message = {
        topic: TOPIC_EVENTS,
        notification: {
          title: `Novo evento: ${title}`,
          body: body || 'Confira os detalhes no app.',
        },
        data: {
          type: 'event',
          event_id: context.params.eventId,
        },
        webpush: {
          fcmOptions: {
            link: '/tesouraria/events',
          },
        },
      };

      const res = await admin.messaging().send(message);
      console.log('✅ Notificação de novo evento enviada:', res);
      return null;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo evento:', error);
      return null;
    }
  });

export const cleanupPastEvents = functions.pubsub
  .schedule('15 3 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const db = admin.firestore();

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = admin.firestore.Timestamp.fromDate(today);

    try {
      // Otimizado para casos em que o campo date é string no formato YYYY-MM-DD
      const snapshot = await db
        .collection('events')
        .where('date', '<', todayStr)
        .limit(400)
        .get();

      let deleted = 0;

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += snapshot.size;
      }

      // Fallback para casos em que date é Timestamp
      const snapshotTs = await db
        .collection('events')
        .where('date', '<', todayTs)
        .limit(400)
        .get();

      if (!snapshotTs.empty) {
        const batchTs = db.batch();
        snapshotTs.docs.forEach((doc) => batchTs.delete(doc.ref));
        await batchTs.commit();
        deleted += snapshotTs.size;
      }

      if (deleted === 0) {
        console.log('ℹ️ cleanupPastEvents: nenhum evento vencido para remover.');
        return null;
      }

      console.log(`✅ cleanupPastEvents: removidos ${deleted} evento(s) vencido(s).`);
      return null;
    } catch (error) {
      console.error('❌ cleanupPastEvents: erro ao remover eventos vencidos:', error);
      return null;
    }
  });

export const resubscribeFcmTopicsDaily = functions.pubsub
  .schedule('55 4 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const db = admin.firestore();

    try {
      const snapshot = await db.collection('members').where('fcm_token', '!=', null).limit(2000).get();

      const tokens = snapshot.docs
        .map((d) => (d.data() as any)?.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => String(t).trim());

      if (!tokens.length) {
        console.log('resubscribeFcmTopicsDaily: nenhum token encontrado.');
        return null;
      }

      // FCM topic subscribe accepts up to 1000 tokens per call
      const chunks: string[][] = [];
      for (let i = 0; i < tokens.length; i += 1000) chunks.push(tokens.slice(i, i + 1000));

      let ok = 0;
      let fail = 0;

      for (const chunk of chunks) {
        const r1 = await admin.messaging().subscribeToTopic(chunk, TOPIC_EVENTS);
        ok += r1.successCount;
        fail += r1.failureCount;

        const r2 = await admin.messaging().subscribeToTopic(chunk, TOPIC_DEVOTIONALS);
        ok += r2.successCount;
        fail += r2.failureCount;
      }

      console.log(`resubscribeFcmTopicsDaily: tokens=${tokens.length} ok=${ok} fail=${fail}`);
      return null;
    } catch (error) {
      console.error('resubscribeFcmTopicsDaily: erro ao re-sincronizar tópicos:', error);
      return null;
    }
  });
