import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  BellSlashIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import storage from '../utils/storage';

const SafeAnimatePresence = AnimatePresence as unknown as React.FC<React.PropsWithChildren<any>>;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'financial' | 'members' | 'goals' | 'system' | 'security';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: {
    financial: boolean;
    members: boolean;
    goals: boolean;
    system: boolean;
    security: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    categories: {
      financial: true,
      members: true,
      goals: true,
      system: true,
      security: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true,
    },
  });

  // Carregar configurações do armazenamento local
  useEffect(() => {
    const savedSettings = storage.getJSON<NotificationSettings>('notificationSettings');
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  // Salvar configurações no armazenamento local
  useEffect(() => {
    storage.setJSON('notificationSettings', settings);
  }, [settings]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.enabled) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast se habilitado
    if (settings.enabled) {
      const toastOptions = {
        position: "top-right" as const,
        autoClose: notification.duration || 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      };

      switch (notification.type) {
        case 'success':
          toast.success(notification.message, { ...toastOptions, toastId: newNotification.id });
          break;
        case 'error':
          toast.error(notification.message, { ...toastOptions, toastId: newNotification.id });
          break;
        case 'warning':
          toast.warning(notification.message, { ...toastOptions, toastId: newNotification.id });
          break;
        case 'info':
          toast.info(notification.message, { ...toastOptions, toastId: newNotification.id });
          break;
        case 'achievement':
          toast.success(`ðŸŽ‰ ${notification.message}`, { ...toastOptions, toastId: newNotification.id });
          break;
      }
    }

    // Notificação desktop se habilitada
    if (settings.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/img/ICONE-RESGATE.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [settings]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.dismiss(id);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    toast.dismiss();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        unreadCount,
        settings,
        updateSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Componente de notificação individual
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = {
    success: {
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    error: {
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100 dark:bg-red-900',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      borderColor: 'border-yellow-200 dark:border-yellow-700'
    },
    info: {
      icon: InformationCircleIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    achievement: {
      icon: CheckCircleIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
      borderColor: 'border-purple-200 dark:border-purple-700'
    }
  };

  const priorityConfig = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${config.borderColor} ${
        !notification.read ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 p-2 rounded-full ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${priorityConfig[notification.priority]}`}>
                  {notification.priority}
                </span>
                <button
                  onClick={() => onRemove(notification.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notification.timestamp.toLocaleString('pt-BR')}
              </span>
              
              <div className="flex items-center space-x-2">
                {!notification.read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Marcar como lida
                  </button>
                )}
                
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente principal de notificações
export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll, 
    unreadCount,
    settings,
    updateSettings 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <SafeAnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notificações
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {filter === 'all' ? 'Não lidas' : 'Todas'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} não lidas
                  </span>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Marcar todas como lidas
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="p-4 space-y-3">
                  <SafeAnimatePresence initial={false}>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onRemove={removeNotification}
                      />
                    ))}
                  </SafeAnimatePresence>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BellSlashIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma notificação
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filter === 'unread' 
                      ? 'Todas as notificações foram lidas'
                      : 'Você está em dia com suas notificações'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={clearAll}
                  className="w-full text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Limpar todas
                </button>
              </div>
            )}
          </motion.div>
        ) : null}
      </SafeAnimatePresence>
    </div>
  );
};

export default NotificationProvider;
