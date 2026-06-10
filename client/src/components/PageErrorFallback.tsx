import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface PageErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  retry?: () => void;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ 
  error, 
  resetError, 
  retry 
}) => {
  const handleRetry = () => {
    if (retry) {
      retry();
    } else if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ops! Algo deu errado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Não foi possível carregar esta página. Por favor, tente novamente.
          </p>
          {error && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <p className="text-xs text-red-700 dark:text-red-300 break-all">
                {error.message || error.toString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Tentar Novamente
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Ir para Home
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
        >
          Recarregar página completa
        </button>
      </div>
    </div>
  );
};

export default PageErrorFallback;
