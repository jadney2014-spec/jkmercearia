// Utilitário para otimização de imagens

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Gera URL otimizada para imagem (usando serviços como Cloudinary, Imgix, etc.)
 * Por enquanto, retorna a URL original, mas pode ser estendido
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  // Se já é uma URL de dados ou SVG, retornar como está
  if (originalUrl.startsWith('data:') || originalUrl.endsWith('.svg')) {
    return originalUrl;
  }

  // Por enquanto, retornar URL original
  // TODO: Integrar com serviço de otimização de imagens (Cloudinary, Imgix, etc.)
  return originalUrl;
};

/**
 * Preload de imagem
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload de múltiplas imagens
 */
export const preloadImages = async (sources: string[]): Promise<void> => {
  await Promise.all(sources.map(src => preloadImage(src).catch(() => {
    // Ignorar erros de preload
    console.warn(`Falha ao preload imagem: ${src}`);
  })));
};

/**
 * Lazy load de imagem com Intersection Observer
 */
export const createLazyImageLoader = (
  callback: (src: string) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '200px',
    threshold: 0.01,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        callback(img.dataset.src || img.src);
        observer.unobserve(img);
      }
    });
  }, defaultOptions);

  return observer;
};

// Versão corrigida
export const observeLazyImage = (
  element: HTMLImageElement,
  callback: () => void,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.unobserve(element);
      }
    });
  }, {
    rootMargin: '200px',
    threshold: 0.01,
    ...options
  });

  observer.observe(element);
  return observer;
};
