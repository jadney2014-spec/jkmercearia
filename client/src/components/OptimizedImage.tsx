import React, { useState, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Componente de imagem otimizado com suporte a WebP e fallback automático
 * 
 * Características:
 * - Suporte a formato WebP com fallback para JPEG/PNG
 * - Lazy loading nativo
 * - Responsive images com srcset
 * - Fallback automático em caso de erro
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  webpSrc,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  sizes,
  srcSet,
  fallbackSrc,
  onError,
  onLoad,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Gerar srcset se não fornecido
  const generatedSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    if (webpSrc) {
      // Gerar srcset para WebP
      const baseName = webpSrc.replace(/\.webp$/, '');
      return `${baseName}-400.webp 400w, ${baseName}-800.webp 800w, ${baseName}-1200.webp 1200w`;
    }
    return undefined;
  }, [srcSet, webpSrc]);

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      if (onError) onError();
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
    if (onLoad) onLoad();
  };

  // Se erro e tem fallback, usar fallback
  if (imageError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        onError={() => {
          // Se o fallback também falhar, não fazer nada
        }}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <picture>
      {/* WebP source se disponível */}
      {webpSrc && !imageError && (
        <source
          srcSet={generatedSrcSet || webpSrc}
          type="image/webp"
          sizes={sizes}
        />
      )}
      
      {/* Imagem original como fallback */}
      <img
        src={imageError && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        srcSet={generatedSrcSet || srcSet}
        onError={handleError}
        onLoad={handleLoad}
      />
    </picture>
  );
};

export default React.memo(OptimizedImage);

