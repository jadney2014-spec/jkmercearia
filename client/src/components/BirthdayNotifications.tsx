import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CakeIcon,
  CalendarIcon,
  XMarkIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useBirthdays } from '../hooks/useBirthdays';
import LoadingSpinner from './LoadingSpinner';

const SafeAnimatePresence = AnimatePresence as unknown as React.FC<React.PropsWithChildren<any>>;

const BirthdayNotifications: React.FC = () => {
  const { todayBirthdays, weekBirthdays, loading, error, lastNotification } = useBirthdays();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Garantir que os arrays sempre existam
  const safeTodayBirthdays = Array.isArray(todayBirthdays) ? todayBirthdays : [];
  const safeWeekBirthdays = Array.isArray(weekBirthdays) ? weekBirthdays : [];
  const totalCount = safeTodayBirthdays.length + safeWeekBirthdays.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <CakeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Aniversários
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nenhum aniversariante hoje ou nesta semana
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <CakeIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            {totalCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              >
                {totalCount > 9 ? '9+' : totalCount}
              </motion.div>
            )}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Aniversários
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {safeTodayBirthdays.length > 0 
                ? `${safeTodayBirthdays.length} hoje${safeWeekBirthdays.length > 0 ? `, ${safeWeekBirthdays.length} esta semana` : ''}`
                : `${safeWeekBirthdays.length} nesta semana`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lastNotification && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              {lastNotification.emailSent && (
                <EnvelopeIcon className="h-4 w-4 text-green-500" aria-label="Email enviado" />
              )}
              {lastNotification.whatsappSent && (
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500" aria-label="WhatsApp enviado" />
              )}
            </div>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <SafeAnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              {/* Aniversariantes de Hoje */}
              {safeTodayBirthdays.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CalendarIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Aniversariantes de Hoje
                    </h4>
                    <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
                      {safeTodayBirthdays.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {safeTodayBirthdays.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg"
                      >
                        <div className="p-2 bg-pink-200 dark:bg-pink-800 rounded-full">
                          <CakeIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          {member.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aniversariantes da Semana */}
              {safeWeekBirthdays.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Aniversariantes desta Semana
                    </h4>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {safeWeekBirthdays.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {safeWeekBirthdays.map((member, index) => {
                      const birthDate = new Date(member.birth_date);
                      const today = new Date();
                      const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                      const dayName = thisYear.toLocaleDateString('pt-BR', { weekday: 'short' });
                      const dayNumber = thisYear.getDate();
                      const monthName = thisYear.toLocaleDateString('pt-BR', { month: 'short' });

                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                        >
                          <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
                            <CakeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {dayNumber} de {monthName} ({dayName})
                              {member.phone && ` â€¢ ${member.phone}`}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status da última notificação */}
              {lastNotification && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Última notificação:</span>
                    <div className="flex items-center space-x-2">
                      {lastNotification.emailSent && (
                        <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Email</span>
                        </span>
                      )}
                      {lastNotification.whatsappSent && (
                        <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                      {lastNotification.timestamp && (
                        <span>
                          {lastNotification.timestamp.toDate().toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </SafeAnimatePresence>
    </div>
  );
};

export default BirthdayNotifications;

