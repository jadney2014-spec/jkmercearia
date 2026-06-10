import React from 'react';
import { SignalSlashIcon, WifiIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const OfflinePage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <SignalSlashIcon className="h-24 w-24 text-gray-400 dark:text-gray-600 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Você está offline
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Parece que você não tem conexão com a internet no momento.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            O que você ainda pode fazer:
          </h2>
          
          <ul className="text-left space-y-3 text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Visualizar dados já carregados</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Navegar pelas páginas visitadas</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Preencher formulários (serão salvos quando voltar online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">!</span>
              <span>Algumas funcionalidades podem estar limitadas</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center"
          >
            <WifiIcon className="h-5 w-5 mr-2" />
            Tentar reconectar
          </button>
          
          <Link
            to="/"
            className="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center"
          >
            Voltar para página inicial
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Quando sua conexão for restaurada, seus dados serão sincronizados automaticamente.
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
