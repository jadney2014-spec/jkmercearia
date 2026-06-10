import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que detecta mudanças de rota e permite invalidar caches/forçar recarregamento
 * Ãštil para garantir que componentes recarreguem dados ao navegar
 */
export const useRouteRefresh = (onRouteChange?: () => void) => {
  const location = useLocation();
  const previousPathnameRef = useRef<string>(location.pathname);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // Ignora a primeira montagem
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousPathnameRef.current = location.pathname;
      return;
    }

    // Se a rota mudou, executa callback
    if (previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      
      // Pequeno delay para garantir que a nova rota foi renderizada
      setTimeout(() => {
        if (onRouteChange) {
          onRouteChange();
        }
      }, 100);
    }
  }, [location.pathname, onRouteChange]);

  return {
    currentPath: location.pathname,
    isFirstMount: isFirstMountRef.current
  };
};

/**
 * Hook para limpar caches de dados quando a rota muda
 */
export const useCacheInvalidation = () => {
  const location = useLocation();
  const previousPathnameRef = useRef<string>(location.pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname) {
      // Limpar caches específicos ao mudar de rota
      try {
        // Lista de chaves de cache a limpar
        const cacheKeys = [
          'dashboard_cache',
          'transactions_cache',
          'members_cache',
          'categories_cache',
        ];

        cacheKeys.forEach(key => {
          sessionStorage.removeItem(key);
        });

        console.log('ðŸ§¹ Cache limpo ao mudar de rota:', location.pathname);
      } catch (error) {
        console.warn('Erro ao limpar cache:', error);
      }

      previousPathnameRef.current = location.pathname;
    }
  }, [location.pathname]);
};

