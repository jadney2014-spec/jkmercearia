import React, { useState, useEffect } from 'react';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Esconder banner após 3 segundos
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`flex items-center justify-center px-4 py-3 text-sm font-medium ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <WifiIcon className="h-5 w-5 mr-2" />
            <span>Conexão restaurada. Sincronizando dados...</span>
          </>
        ) : (
          <>
            <SignalSlashIcon className="h-5 w-5 mr-2" />
            <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
