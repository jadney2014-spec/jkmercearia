import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import storage from '../utils/storage';
import { appPath } from '../constants/app';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    storage.remove('token');
    sessionStorage.clear();

    const timer = setTimeout(() => {
      navigate(appPath('login'));
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sessão encerrada</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Você saiu do sistema com segurança.</p>
        <Link
          to={appPath('login')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default Logout;
