// Página para membros visualizarem suas escalas - Estilo LouveApp Mobile
import React, { useState, useEffect } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { escalasAPI } from '../services/scalesAPI';
import type { Escala } from '../types/Scale';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import ScaleSubstitution from '../components/ScaleSubstitution';

type ViewMode = 'list' | 'calendar';

const MyScales: React.FC = () => {
  const { profile } = useUserRole();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (profile?.id) {
      loadMyScales();
    }
  }, [profile?.id]);

  const loadMyScales = async () => {
    try {
      setLoading(true);
      const allEscalas = await escalasAPI.getEscalas();
      
      // Filtrar apenas escalas onde o membro está escalado
      const myEscalas = allEscalas.filter(escala =>
        escala.membros.some(membro => membro.membro_id === profile?.id)
      );
      
      setEscalas(myEscalas);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
      toast.error('Erro ao carregar suas escalas');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPresence = async (escalaId: string) => {
    if (!profile?.id) return;

    try {
      await escalasAPI.confirmarPresenca(escalaId, profile.id);
      toast.success('Presença confirmada!');
      loadMyScales();
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      toast.error('Erro ao confirmar presença');
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
      year: 'numeric',
    });
  };

  const formatFullDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMyFunction = (escala: Escala): string => {
    const membro = escala.membros.find(m => m.membro_id === profile?.id);
    return membro?.funcao || 'Não definida';
  };

  const getMyStatus = (escala: Escala): 'pendente' | 'confirmado' | 'substituido' | 'ausente' => {
    const membro = escala.membros.find(m => m.membro_id === profile?.id);
    return membro?.status || 'pendente';
  };

  const isPast = (date: Date | string): boolean => {
    return new Date(date) < new Date();
  };

  // Separar escalas futuras e passadas
  const escalasFuturas = escalas.filter(e => !isPast(e.data)).sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );
  const escalasPassadas = escalas.filter(e => isPast(e.data)).sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  // Calendário mobile-friendly
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getEscalasForDate = (date: Date) => {
    return escalas.filter(escala => {
      const escalaDate = new Date(escala.data);
      return (
        escalaDate.getDate() === date.getDate() &&
        escalaDate.getMonth() === date.getMonth() &&
        escalaDate.getFullYear() === date.getFullYear() &&
        escala.membros.some(m => m.membro_id === profile?.id)
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando suas escalas...</p>
        </div>
      </div>
    );
  }

  const pendingCount = escalasFuturas.filter(e => getMyStatus(e) === 'pendente').length;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white p-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Minhas Escalas
        </h1>
        <p className="text-primary-100 text-sm mb-4">
          Visualize e confirme suas escalas
        </p>
        
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{escalasFuturas.length}</div>
            <div className="text-xs text-primary-100">Futuras</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{escalasPassadas.length}</div>
            <div className="text-xs text-primary-100">Passadas</div>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-yellow-400/30">
              <div className="text-2xl font-bold text-yellow-200">{pendingCount}</div>
              <div className="text-xs text-yellow-100">Pendentes</div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de confirmações pendentes */}
      {pendingCount > 0 && (
        <div className="mx-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">
                Você tem {pendingCount} {pendingCount === 1 ? 'confirmação pendente' : 'confirmações pendentes'}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Confirme sua presença nas escalas abaixo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle de visualização */}
      <div className="px-4 flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            viewMode === 'calendar'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Calendário
        </button>
      </div>

      {/* Visualização em Lista */}
      {viewMode === 'list' && (
        <>
          {/* Escalas Futuras */}
          {escalasFuturas.length > 0 && (
            <div className="px-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Próximas Escalas
              </h2>
              <div className="space-y-3">
                {escalasFuturas.map((escala) => {
                  const myStatus = getMyStatus(escala);
                  const myFunction = getMyFunction(escala);
                  const isConfirmed = myStatus === 'confirmado';
                  const isPending = myStatus === 'pendente';
                  const isSubstituido = myStatus === 'substituido';
                  const isToday = formatDate(escala.data) === 'Hoje';
                  
                  // Verificar se é substituto
                  const meuMembro = escala.membros.find(m => m.membro_id === profile?.id);
                  const isSubstituto = meuMembro?.observacoes?.includes('Substituição de') || false;

                  return (
                    <div
                      key={escala.id}
                      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 ${
                        isSubstituido
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                          : isSubstituto
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                          : isPending && isToday
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
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                <span>{formatTime(escala.data)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                                {myFunction}
                              </span>
                              {isSubstituido && (
                                <span className="text-xs font-medium px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                                  Substituído
                                </span>
                              )}
                              {isSubstituto && (
                                <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                                  Substituto
                                </span>
                              )}
                              {isToday && (
                                <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                                  Hoje!
                                </span>
                              )}
                            </div>
                            {isSubstituido && meuMembro?.substituido_por && (
                              <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <p className="text-xs text-orange-700 dark:text-orange-300">
                                  Você foi substituído nesta escala. Verifique as notificações para mais detalhes.
                                </p>
                              </div>
                            )}
                            {isSubstituto && (
                              <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  Você está escalado como substituto. Confirme sua presença.
                                </p>
                              </div>
                            )}
                            {escala.observacoes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                                {escala.observacoes}
                              </p>
                            )}
                          </div>
                          {isConfirmed ? (
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
                        
                        {(isPending || isSubstituto) && !isSubstituido && (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleConfirmPresence(escala.id)}
                              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                              Confirmar Presença
                            </button>
                            {isPending && !isSubstituto && (
                              <div className="flex justify-center">
                                <ScaleSubstitution
                                  escala={escala}
                                  membroEscalado={escala.membros.find(m => m.membro_id === profile?.id)!}
                                  onSubstitutionRequested={loadMyScales}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {isSubstituido && (
                          <div className="w-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2.5 rounded-xl font-medium text-center">
                            Você foi substituído nesta escala
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Escalas Passadas */}
          {escalasPassadas.length > 0 && (
            <div className="px-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Escalas Passadas
              </h2>
              <div className="space-y-2">
                {escalasPassadas.slice(0, 10).map((escala) => {
                  const myFunction = getMyFunction(escala);
                  const myStatus = getMyStatus(escala);

                  return (
                    <div
                      key={escala.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {escala.ministerio_nome}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(escala.data)} - {myFunction}
                          </p>
                        </div>
                        {myStatus === 'confirmado' && (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        )}
                        {myStatus === 'ausente' && (
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Visualização em Calendário */}
      {viewMode === 'calendar' && (
        <div className="px-4">
          {/* Navegação do calendário */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const escalasDoDia = getEscalasForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < new Date() && !isToday;
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`aspect-square p-1 rounded-lg border-2 ${
                      isToday
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : isPast
                        ? 'border-gray-200 dark:border-gray-700 opacity-50'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    {escalasDoDia.length > 0 && (
                      <div className="space-y-0.5">
                        {escalasDoDia.slice(0, 2).map(escala => {
                          const status = getMyStatus(escala);
                          return (
                            <div
                              key={escala.id}
                              className={`text-[10px] px-1 py-0.5 rounded truncate ${
                                status === 'confirmado'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-500 text-white'
                              }`}
                              title={escala.ministerio_nome}
                            >
                              {escala.ministerio_nome.substring(0, 8)}
                            </div>
                          );
                        })}
                        {escalasDoDia.length > 2 && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            +{escalasDoDia.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há escalas */}
      {escalas.length === 0 && (
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

export default MyScales;
