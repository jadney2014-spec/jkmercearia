import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_BASE_PATH } from '../constants/app';

export function usePreloadComponents() {
  const location = useLocation();

  useEffect(() => {
    const preloadComponent = (importFn: () => Promise<any>) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => importFn());
      } else {
        setTimeout(() => importFn(), 100);
      }
    };

    const base = APP_BASE_PATH;

    switch (location.pathname) {
      case `${base}/dashboard`:
        preloadComponent(() => import('../pages/Vendas'));
        preloadComponent(() => import('../pages/Products'));
        break;
      case `${base}/vendas`:
        preloadComponent(() => import('../pages/Products'));
        break;
      case `${base}/products`:
        preloadComponent(() => import('../pages/Categories'));
        break;
      case `${base}/reports`:
        preloadComponent(() => import('../pages/Vendas'));
        break;
      default:
        break;
    }
  }, [location.pathname]);
}

export default usePreloadComponents;
