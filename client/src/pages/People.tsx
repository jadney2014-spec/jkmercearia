import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon, CakeIcon } from '@heroicons/react/24/outline';
import AnimatedCard from '../components/AnimatedCard';
import MemberStats from '../components/MemberStats';
import BirthdayNotifications from '../components/BirthdayNotifications';

const People: React.FC = () => {
  const [tab, setTab] = useState<'members' | 'birthdays'>('members');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Pessoas</h1>
          <p className="mt-1 text-sm sm:text-md text-slate-600 dark:text-gray-400">
            Membros e aniversariantes
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('members')}
            className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === 'members'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
            }`}
          >
            Membros
          </button>
          <button
            type="button"
            onClick={() => setTab('birthdays')}
            className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === 'birthdays'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
            }`}
          >
            Aniversários
          </button>
        </div>
      </div>

      {tab === 'members' ? (
        <div className="space-y-4">
          <AnimatedCard delay={0}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resumo de Membros</h3>
                </div>
                <Link
                  to="/tesouraria/members"
                  className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Gerenciar
                </Link>
              </div>
              <MemberStats />
            </div>
          </AnimatedCard>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatedCard delay={0}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CakeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aniversariantes</h3>
              </div>
              <BirthdayNotifications />
            </div>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
};

export default People;
