import React, { useEffect, useMemo, useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useUserRole } from '../hooks/useUserRole';
import { escalasAPI } from '../services/scalesAPI';
import type { Escala } from '../types/Scale';

const LouveCalendarPage: React.FC = () => {
  const { profile } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await escalasAPI.getEscalas();
        const my = profile?.id
          ? all.filter((e) => e.membros.some((m) => m.membro_id === profile.id))
          : [];
        setEscalas(my);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile?.id]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getEscalasForDate = (date: Date) => {
    return escalas.filter((escala) => {
      const d = new Date(escala.data);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calendário</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Suas escalas do mês</p>
          </div>
          <CalendarIcon className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="font-semibold text-gray-900 dark:text-white capitalize">{monthLabel}</div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-2 pt-2 pb-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}

            {getDaysInMonth(currentMonth).map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

              const today = new Date();
              const isToday = date.toDateString() === today.toDateString();
              const dayEscalas = getEscalasForDate(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`aspect-square rounded-xl border ${
                    isToday
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-800'
                  } p-1`}
                >
                  <div
                    className={`text-xs font-semibold ${
                      isToday ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {dayEscalas.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayEscalas.slice(0, 2).map((escala) => (
                        <div
                          key={escala.id}
                          className="flex items-center gap-1 text-[10px] rounded-lg px-1 py-0.5 bg-primary-600 text-white truncate"
                          title={escala.ministerio_nome}
                        >
                          <MusicalNoteIcon className="h-3 w-3" />
                          <span className="truncate">{escala.ministerio_nome}</span>
                        </div>
                      ))}
                      {dayEscalas.length > 2 && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">+{dayEscalas.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LouveCalendarPage;
