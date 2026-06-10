// Página de notificações melhorada - Estilo LouveApp
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useUserRole } from '../hooks/useUserRole';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Button from '../components/Button';
import type { NotificationType } from '../types/Notification';

type FilterType = 'all' | 'unread' | NotificationType;

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const { isAdmin, isLider } = useUserRole();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'nova_escala':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />;
      case 'lembrete_escala_24h':
      case 'lembrete_escala_1h':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'confirmacao_presenca':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'escala_cancelada':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      case 'substituicao_solicitada':
      case 'substituicao_aprovada':
      case 'substituicao_recebida':
        return <ArrowPathIcon className="h-5 w-5 text-orange-600" />;
      case 'escala_atualizada':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'normal':
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      nova_escala: { label: 'Nova Escala', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
      lembrete_escala_24h: { label: 'Lembrete 24h', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
      lembrete_escala_1h: { label: 'Lembrete 1h', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      confirmacao_presenca: { label: 'Confirmação', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      substituicao_solicitada: { label: 'Substituição', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      substituicao_aprovada: { label: 'Substituição', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      substituicao_recebida: { label: 'Substituição', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
      escala_cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      escala_atualizada: { label: 'Atualizada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    };
    return badges[type] || { label: 'Notificação', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' };
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navegar para página relevante
    if (notification.data?.escalaId) {
      window.location.href = `/tesouraria/scales`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Notificações
            </h1>
            <p className="text-primary-100 text-sm">
              {unreadCount > 0
                ? `${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`
                : 'Todas as notificações foram lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="relative">
              <BellIcon className="h-8 w-8" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{notifications.length}</div>
            <div className="text-xs text-primary-100">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{unreadCount}</div>
            <div className="text-xs text-primary-100">Não Lidas</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{notifications.length - unreadCount}</div>
            <div className="text-xs text-primary-100">Lidas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Filtros
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'unread'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Não Lidas ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('nova_escala')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'nova_escala'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Escalas
          </button>
          <button
            onClick={() => setFilter('substituicao_recebida')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'substituicao_recebida'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Substituições
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="mt-4">
            <Button onClick={markAllAsRead} variant="secondary" className="w-full">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Notificações */}
      {filteredNotifications.length === 0 ? (
        <div className="px-4 text-center py-12">
          <BellIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Nenhuma notificação encontrada
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {filter === 'unread' 
              ? 'Todas as notificações foram lidas'
              : 'Quando houver novas notificações, elas aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {filteredNotifications.map((notification) => {
            const badge = getTypeBadge(notification.type);
            const isUnread = !notification.read;

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 ${
                  isUnread 
                    ? getPriorityColor(notification.priority)
                    : 'border-gray-200 dark:border-gray-700'
                } p-4 cursor-pointer hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`text-base font-bold ${
                              isUnread
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Marcar como lida"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
