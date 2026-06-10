import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface AppUpdateCheckerProps {
  checkInterval?: number; // Intervalo em minutos para verificar atualizações
}

/**
 * Componente que verifica e notifica sobre atualizações do aplicativo
 * Como o app está configurado para carregar do servidor remoto,
 * as atualizações são automáticas - este componente apenas informa o usuário
 */
const AppUpdateChecker: React.FC<AppUpdateCheckerProps> = ({ 
  checkInterval = 5 
}) => {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Verificar se está rodando no app nativo
    const platform = Capacitor.getPlatform();
    setIsNativeApp(platform === 'android' || platform === 'ios');

    if (isNativeApp) {
      // Verificar atualizações periodicamente
      const interval = setInterval(() => {
        checkForUpdates();
      }, checkInterval * 60 * 1000); // Converter minutos para milissegundos

      // Verificar imediatamente ao montar
      checkForUpdates();

      return () => clearInterval(interval);
    }
  }, [isNativeApp, checkInterval]);

  const checkForUpdates = async () => {
    try {
      // Como o app carrega do servidor remoto, uma simples recarga já traz atualizações
      // Mas vamos verificar se há uma nova versão disponível
      const response = await fetch('https://comunidaderesgate-82655.web.app/manifest.json', {
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const manifest = await response.json();
        setLastUpdateCheck(new Date());
        
        // Se necessário, podemos comparar versões aqui
        // Por enquanto, apenas registramos que verificamos
        console.log('âœ… Verificação de atualização concluída', {
          timestamp: new Date().toISOString(),
          platform: Capacitor.getPlatform()
        });
      }
    } catch (error) {
      console.warn('âš ï¸ Erro ao verificar atualizações:', error);
    }
  };

  const handleAppStateChange = async () => {
    // Quando o app volta para o primeiro plano, verificar atualizações
    if (isNativeApp) {
      await checkForUpdates();
    }
  };

  useEffect(() => {
    if (isNativeApp) {
      // Escutar mudanças de estado do app
      let listenerPromise: Promise<any>;
      
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleAppStateChange();
        }
      }).then((listener) => {
        listenerPromise = Promise.resolve(listener);
      });

      return () => {
        if (listenerPromise) {
          listenerPromise.then((listener) => {
            listener.remove();
          }).catch(() => {
            // Ignorar erros ao remover listener
          });
        }
      };
    }
  }, [isNativeApp]);

  // Este componente não renderiza nada visualmente
  // Ele apenas executa verificações em background
  return null;
};

export default AppUpdateChecker;
