import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import storage from '../utils/storage';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Limpar qualquer token ou dados de sessão que possam ter ficado
    storage.remove('token');
    sessionStorage.clear();
    
    // Redirecionar automaticamente para login após 5 segundos
    const timer = setTimeout(() => {
      navigate('/tesouraria/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header com Ícone */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <CheckCircleIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Logout Realizado!
            </h2>
            <p className="mt-2 text-green-100 text-sm">
              Você saiu com segurança do sistema
            </p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-8 text-center">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sessão Encerrada
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sua sessão foi encerrada com segurança. Todos os dados temporários foram limpos.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Link
                to="/tesouraria/login"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar ao Login
              </Link>
              
              <Link
                to="/"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Ir para o Site Principal
              </Link>
            </div>

            {/* Informação de Redirecionamento */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Redirecionamento automático:</span><br />
                Você será redirecionado para o login em alguns segundos...
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              (c) 2024 Comunidade Cristã Resgate. Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Card de Informações Adicionais */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Segurança
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Por motivos de segurança, recomendamos que você feche completamente o navegador após o logout.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                Todos os dados de sessão foram removidos com segurança
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;
