// Hook para gerenciar notificações
import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { notificationsAPI } from '../services/notificationsAPI';
import type { Notification } from '../types/Notification';

export const useNotifications = (unreadOnly: boolean = false) => {
  const { user, authReady } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return;
    }

    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Carregar notificações iniciais
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const userNotifications = await notificationsAPI.getUserNotifications(user.uid, unreadOnly);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Escutar mudanças em tempo real
    const unsubscribe = notificationsAPI.subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [authReady, user, unreadOnly]);

  const markAsRead = async (notificationId: string) => {
    await notificationsAPI.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (user) {
      await notificationsAPI.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    await notificationsAPI.deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const deleted = notifications.find(n => n.id === notificationId);
    if (deleted && !deleted.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: async () => {
      if (user) {
        const userNotifications = await notificationsAPI.getUserNotifications(user.uid, unreadOnly);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.read).length);
      }
    },
  };
};
