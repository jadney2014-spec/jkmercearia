import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackElement?: React.ReactNode;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  priority?: boolean; // Para imagens acima da dobra
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Imagem não disponível',
  fallbackElement,
  onError,
  loading = 'lazy',
  priority = false
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(priority || loading === 'eager');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const maxRetries = 2;
  const loadTimeout = 10000; // 10 segundos timeout

  // Função para adicionar cache busting se necessário e tratar blob URLs
  const getImageSrc = useCallback((imageSrc: string, retry: number = 0) => {
    if (!imageSrc) return '';
    
    // Se for blob URL, retornar vazio (blob URLs não funcionam após reload)
    if (imageSrc.startsWith('blob:')) {
      console.warn('Blob URL detectada e ignorada (não funciona após reload):', imageSrc);
      return '';
    }
    
    // Se for URL absoluta ou data URL, retornar como está
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('data:')) {
      // Adicionar cache busting apenas em retry
      if (retry > 0) {
        const separator = imageSrc.includes('?') ? '&' : '?';
        return `${imageSrc}${separator}_retry=${retry}&_t=${Date.now()}`;
      }
      return imageSrc;
    }
    
    // Para URLs relativas, adicionar cache busting em retry
    if (retry > 0) {
      const separator = imageSrc.includes('?') ? '&' : '?';
      return `${imageSrc}${separator}_retry=${retry}&_t=${Date.now()}`;
    }
    
    return imageSrc;
  }, []);

  // Intersection Observer para lazy loading eficiente
  useEffect(() => {
    if (shouldLoad || loading === 'eager' || priority) return;

    // Limpar observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '100px', // Aumentado para 100px para carregar mais cedo
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [shouldLoad, loading, priority]);

  const handleError = useCallback(() => {
    // Tentar novamente se ainda houver tentativas
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
      
      // Forçar reload da imagem com cache busting
      if (imgRef.current) {
        const newSrc = getImageSrc(src, retryCount + 1);
        imgRef.current.src = newSrc;
      }
    } else {
      setHasError(true);
      setIsLoading(false);
      if (onError) {
        onError();
      }
    }
  }, [retryCount, src, onError, getImageSrc, maxRetries]);

  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Reset quando src mudar
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setShouldLoad(priority || loading === 'eager');
    
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [src, priority, loading]);

  // Timeout para evitar loading infinito (separado para melhor controle)
  useEffect(() => {
    if (!shouldLoad || hasError) return;

    timeoutRef.current = setTimeout(() => {
      // Verificar se a imagem ainda está carregando
      if (imgRef.current && !imgRef.current.complete) {
        console.warn(`Image load timeout: ${src}`);
        handleError();
      }
    }, loadTimeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldLoad, hasError, src, handleError, loadTimeout]);

  // Preload para imagens prioritárias (deve estar antes dos early returns)
  useEffect(() => {
    if (priority && src && !hasError) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getImageSrc(src);
      document.head.appendChild(link);
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, src, hasError, getImageSrc]);

  if (!src) {
    return (
      <div ref={containerRef} className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sem imagem</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div ref={containerRef} className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        {fallbackElement || (
          <div className="text-center p-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{fallbackText}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Skeleton/Placeholder durante carregamento */}
      {isLoading && !hasError && (
        <div className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse ${className}`}>
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
      )}
      
      {/* Imagem otimizada */}
      {shouldLoad && !hasError && (
        <img
          ref={imgRef}
          src={getImageSrc(src, retryCount)}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0 absolute' : 'opacity-100 transition-opacity duration-300'}`}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={handleError}
          onLoad={handleLoad}
          // Adicionar referrer policy para evitar problemas de CORS
          referrerPolicy="no-referrer-when-downgrade"
          // Adicionar crossOrigin para imagens externas
          crossOrigin={src.startsWith('http') ? 'anonymous' : undefined}
        />
      )}
    </div>
  );
};

export default SafeImage;
