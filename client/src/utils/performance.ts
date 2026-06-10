// Utilitários de performance

/**
 * Debounce function para otimizar chamadas frequentes
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function para limitar chamadas
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Request Animation Frame wrapper para animações suaves
 */
export const requestAnimationFrame = (callback: () => void): number => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16) as unknown as number;
};

/**
 * Cancel Animation Frame wrapper
 */
export const cancelAnimationFrame = (id: number): void => {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Verificar se está em dispositivo móvel
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

/**
 * Verificar se está em conexão lenta
 */
export const isSlowConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  const connection = (navigator as any).connection;
  if (!connection) return false;

  // Verificar se é conexão 2G ou saveData está ativado
  return (
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g' ||
    connection.saveData === true
  );
};

/**
 * Preload de recursos críticos
 */
export const preloadResource = (
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  crossorigin?: 'anonymous' | 'use-credentials'
): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) {
    link.crossOrigin = crossorigin;
  }
  document.head.appendChild(link);
};

/**
 * Prefetch de recursos (para próximas páginas)
 */
export const prefetchResource = (href: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Lazy load de script
 */
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    // Verificar se já está carregado
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

/**
 * Medir performance de uma função
 */
export const measurePerformance = async <T>(
  fn: () => T | Promise<T>,
  label?: string
): Promise<T> => {
  if (typeof performance === 'undefined') {
    return await fn();
  }

  const startLabel = label ? `${label}-start` : 'start';
  const endLabel = label ? `${label}-end` : 'end';

  performance.mark(startLabel);
  const result = await fn();
  performance.mark(endLabel);

  try {
    performance.measure(label || 'measure', startLabel, endLabel);
    const measure = performance.getEntriesByName(label || 'measure')[0];
    console.log(`⏱️ Performance ${label || 'measure'}: ${measure.duration.toFixed(2)}ms`);
  } catch (e) {
    // Ignorar erros de medida
  }

  return result;
};

/**
 * Otimizar imagens baseado na conexão
 */
export const getOptimizedImageSize = (): 'small' | 'medium' | 'large' => {
  if (isSlowConnection()) {
    return 'small';
  }
  if (isMobile()) {
    return 'medium';
  }
  return 'large';
};
