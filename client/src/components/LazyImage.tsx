import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3C/svg%3E',
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Se já está carregado ou com erro, não fazer nada
    if (isLoaded || hasError) return;

    // Se a imagem já está no viewport, carregar imediatamente
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 200 && rect.bottom > -200;
      
      if (isInViewport) {
        loadImage();
        return;
      }
    }

    // Usar Intersection Observer para carregar quando entrar no viewport
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: '200px', // Carregar 200px antes de entrar no viewport
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback para navegadores sem Intersection Observer
      loadImage();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, isLoaded, hasError]);

  const loadImage = () => {
    if (isLoaded || hasError) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setHasError(true);
      if (onError) onError();
    };
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-50 blur-sm transition-opacity duration-300' : 'opacity-100'} ${hasError ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

export default LazyImage;
