// Dashboard Mobile otimizado para membros - Estilo LouveApp
import React, { useState, useEffect } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { useNotifications } from '../hooks/useNotifications';
import { escalasAPI } from '../services/scalesAPI';
import type { Escala } from '../types/Scale';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const MobileDashboard: React.FC = () => {
  const { profile, isMembro, isLider, isAdmin } = useUserRole();
  const { notifications, unreadCount } = useNotifications();
  const [myScales, setMyScales] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingScales, setUpcomingScales] = useState<Escala[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<number>(0);

  useEffect(() => {
    if (profile?.id) {
      loadMyScales();
    }
  }, [profile?.id]);

  const loadMyScales = async () => {
    try {
      setLoading(true);
      const allEscalas = await escalasAPI.getEscalas();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Filtrar apenas escalas futuras onde o membro está escalado
      const escalas = allEscalas
        .filter(escala => {
          const escalaDate = new Date(escala.data);
          escalaDate.setHours(0, 0, 0, 0);
          return escalaDate >= hoje;
        })
        .filter(escala =>
          escala.membros.some(membro => membro.membro_id === profile?.id)
        )
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      setMyScales(escalas);
      setUpcomingScales(escalas.slice(0, 3)); // Próximas 3 para destaque
      
      // Contar confirmações pendentes
      const pendentes = escalas.filter(escala => {
        const membro = escala.membros.find(m => m.membro_id === profile?.id);
        return membro && membro.status === 'pendente';
      }).length;
      setPendingConfirmations(pendentes);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEscala = new Date(d);
    dataEscala.setHours(0, 0, 0, 0);
    
    const diffTime = dataEscala.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === 2) return 'Depois de amanhã';
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatFullDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMyFunction = (escala: Escala): string => {
    const membro = escala.membros.find(m => m.membro_id === profile?.id);
    return membro?.funcao || 'Não definida';
  };

  const getMyStatus = (escala: Escala): 'pendente' | 'confirmado' => {
    const membro = escala.membros.find(m => m.membro_id === profile?.id);
    return membro?.status === 'confirmado' ? 'confirmado' : 'pendente';
  };

  const handleConfirmPresence = async (escalaId: string) => {
    if (!profile?.id) return;
    try {
      await escalasAPI.confirmarPresenca(escalaId, profile.id);
      loadMyScales(); // Recarregar após confirmação
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header melhorado - estilo LouveApp */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Olá, {profile?.name?.split(' ')[0] || 'Membro'}!
            </h1>
            <p className="text-primary-100 text-sm">
              {isMembro && 'Suas escalas e atividades'}
              {isLider && 'Painel de controle do líder'}
              {isAdmin && 'Painel administrativo'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Link
              to="/tesouraria/notifications"
              className="relative bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{myScales.length}</div>
            <div className="text-xs text-primary-100">Escalas</div>
          </div>
          {pendingConfirmations > 0 && (
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-3 border border-yellow-400/30">
              <div className="text-2xl font-bold text-yellow-200">{pendingConfirmations}</div>
              <div className="text-xs text-yellow-100">Pendentes</div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de confirmações pendentes */}
      {pendingConfirmations > 0 && (
        <div className="mx-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">
                Você tem {pendingConfirmations} {pendingConfirmations === 1 ? 'confirmação pendente' : 'confirmações pendentes'}
              </p>
              <Link
                to="/tesouraria/my-scales"
                className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mt-1 inline-block"
              >
                Confirmar agora →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Próximas Escalas - estilo LouveApp */}
      {isMembro && upcomingScales.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Próximas Escalas
            </h2>
            {myScales.length > 3 && (
              <Link
                to="/tesouraria/my-scales"
                className="text-sm text-primary-600 dark:text-primary-400 font-medium"
              >
                Ver todas ({myScales.length})
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {upcomingScales.map((escala) => {
              const myStatus = getMyStatus(escala);
              const myFunction = getMyFunction(escala);
              const isPending = myStatus === 'pendente';
              const isToday = formatDate(escala.data) === 'Hoje';

              return (
                <div
                  key={escala.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 ${
                    isPending && isToday
                      ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : isPending
                      ? 'border-yellow-300 dark:border-yellow-700'
                      : 'border-green-200 dark:border-green-800'
                  } overflow-hidden`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MusicalNoteIcon className="h-5 w-5 text-primary-600" />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {escala.ministerio_nome}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="font-medium">{formatFullDate(escala.data)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                            {myFunction}
                          </span>
                          {isToday && (
                            <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                              Hoje!
                            </span>
                          )}
                        </div>
                      </div>
                      {myStatus === 'confirmado' ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircleIcon className="h-8 w-8 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Confirmado</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                            <ClockIcon className="h-4 w-4 text-yellow-600" />
                          </div>
                          <span className="text-xs text-yellow-600 font-medium">Pendente</span>
                        </div>
                      )}
                    </div>
                    
                    {isPending && (
                      <button
                        onClick={() => handleConfirmPresence(escala.id)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mt-3"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        Confirmar Presença
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards de Acesso Rápido - estilo LouveApp */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {isMembro && (
            <>
              <Link
                to="/tesouraria/my-scales"
                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <ClipboardDocumentListIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Minhas Escalas</span>
              </Link>
              <Link
                to="/tesouraria/events"
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <CalendarIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Eventos</span>
              </Link>
            </>
          )}

          {(isLider || isAdmin) && (
            <>
              <Link
                to="/tesouraria/scales"
                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <ClipboardDocumentListIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Escalas</span>
              </Link>
              <Link
                to="/tesouraria/members"
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <UserGroupIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Membros</span>
              </Link>
              <Link
                to="/tesouraria/reports"
                className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <ChartBarIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Relatórios</span>
              </Link>
              <Link
                to="/tesouraria/ministries"
                className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg p-5 text-center hover:shadow-xl transition-all transform hover:scale-105"
              >
                <MusicalNoteIcon className="h-10 w-10 mx-auto mb-2" />
                <span className="text-sm font-bold">Ministérios</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Últimas Notificações */}
      {notifications.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Notificações Recentes
            </h2>
            <Link
              to="/tesouraria/notifications"
              className="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <Link
                key={notification.id}
                to="/tesouraria/notifications"
                className={`block bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 ${
                  !notification.read 
                    ? 'border-l-4 border-l-primary-600 border-r-2 border-t-2 border-b-2' 
                    : 'border-gray-200 dark:border-gray-700'
                } p-4 hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-3">
                  <BellIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    !notification.read ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há escalas */}
      {isMembro && myScales.length === 0 && !loading && (
        <div className="px-4 text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Você não possui escalas no momento
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Quando você for escalado, aparecerá aqui
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
