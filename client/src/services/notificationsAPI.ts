// API para gestão de notificações
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import type { Notification, NotificationType, NotificationSettings } from '../types/Notification';
import { NOTIFICATION_TEMPLATES } from '../types/Notification';

const isMissingCompositeIndexError = (error: any) => {
  const code = error?.code;
  const message = String(error?.message || '');
  return code === 'failed-precondition' || message.toLowerCase().includes('requires an index');
};

// Helper para converter Timestamp
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
};

// API para Notificações
export const notificationsAPI = {
  // Criar notificação
  createNotification: async (
    userId: string,
    type: NotificationType,
    data?: any
  ): Promise<Notification | null> => {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const notificationData = {
        userId,
        type,
        title: template.title,
        message: template.message(data),
        data: data || {},
        read: false,
        priority: template.priority,
        createdAt: Timestamp.now(),
      };

      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, notificationData);

      return {
        id: docRef.id,
        ...notificationData,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  },

  // Criar notificação agendada
  scheduleNotification: async (
    userId: string,
    type: NotificationType,
    scheduledFor: Date,
    data?: any
  ): Promise<Notification | null> => {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const notificationData = {
        userId,
        type,
        title: template.title,
        message: template.message(data),
        data: data || {},
        read: false,
        priority: template.priority,
        createdAt: Timestamp.now(),
        scheduledFor: Timestamp.fromDate(scheduledFor),
      };

      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, notificationData);

      return {
        id: docRef.id,
        ...notificationData,
        createdAt: new Date(),
        scheduledFor,
      };
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  },

  // Obter notificações do usuário
  getUserNotifications: async (
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> => {
    try {
      const notificationsRef = collection(db, 'notifications');
      let q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Índice composto necessário (Firestore):
      // collection: notifications
      // fields:
      // - userId ASC
      // - createdAt DESC
      // Observação: igualdade + orderBy em campo diferente costuma exigir índice composto.

      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        // Índice composto necessário (Firestore):
        // collection: notifications
        // fields:
        // - userId ASC
        // - read ASC
        // - createdAt DESC
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          read: data.read || false,
          priority: data.priority || 'normal',
          createdAt: convertTimestamp(data.createdAt),
          scheduledFor: data.scheduledFor ? convertTimestamp(data.scheduledFor) : undefined,
        };
      });
    } catch (error: any) {
      if (isMissingCompositeIndexError(error)) {
        console.warn('Query de notificações precisa de índice composto. A UI continuará sem notificações até criar o índice.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  },

  // Marcar como lida
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  },

  // Marcar todas como lidas
  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      const notifications = await notificationsAPI.getUserNotifications(userId, true);
      const promises = notifications.map(n => notificationsAPI.markAsRead(n.id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  },

  // Deletar notificação
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  },

  // Criar lembretes de escala
  scheduleScaleReminders: async (
    escalaId: string,
    ministerioNome: string,
    dataEscala: Date,
    membrosIds: string[]
  ): Promise<void> => {
    try {
      const now = new Date();
      const escalaDate = new Date(dataEscala);
      
      // Lembrete 24h antes
      const reminder24h = new Date(escalaDate);
      reminder24h.setHours(reminder24h.getHours() - 24);
      
      // Lembrete 1h antes
      const reminder1h = new Date(escalaDate);
      reminder1h.setHours(reminder1h.getHours() - 1);

      const horario = escalaDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const promises: Promise<any>[] = [];

      membrosIds.forEach(membroId => {
        // Agendar lembrete 24h antes
        if (reminder24h > now) {
          promises.push(
            notificationsAPI.scheduleNotification(
              membroId,
              'lembrete_escala_24h',
              reminder24h,
              {
                escalaId,
                ministerioNome,
                horario,
                data: escalaDate.toLocaleDateString('pt-BR'),
              }
            )
          );
        }

        // Agendar lembrete 1h antes
        if (reminder1h > now) {
          promises.push(
            notificationsAPI.scheduleNotification(
              membroId,
              'lembrete_escala_1h',
              reminder1h,
              {
                escalaId,
                ministerioNome,
                horario,
                data: escalaDate.toLocaleDateString('pt-BR'),
              }
            )
          );
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Erro ao agendar lembretes:', error);
    }
  },

  // Listener em tempo real
  subscribeToNotifications: (
    userId: string,
    callback: (notifications: Notification[]) => void
  ) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Índice composto necessário (Firestore):
    // collection: notifications
    // fields:
    // - userId ASC
    // - createdAt DESC

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data || {},
            read: data.read || false,
            priority: data.priority || 'normal',
            createdAt: convertTimestamp(data.createdAt),
            scheduledFor: data.scheduledFor ? convertTimestamp(data.scheduledFor) : undefined,
          };
        });
        callback(notifications);
      },
      (error) => {
        if (isMissingCompositeIndexError(error)) {
          console.warn('Listener de notificações precisa de índice composto. A UI continuará sem tempo real até criar o índice.', {
            code: (error as any)?.code,
            message: (error as any)?.message,
          });
          callback([]);
          return;
        }

        console.error('Erro no listener de notificações:', error);
      }
    );
  },
};
