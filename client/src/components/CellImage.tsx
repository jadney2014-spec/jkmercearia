import React, { useState, useEffect } from 'react';
import { PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CellImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  containerHeight?: number;
}

const CellImage: React.FC<CellImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Imagem da Célula',
  containerHeight = 192 // h-48 = 192px
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (src) {
      const img = new Image();
      
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        setImageLoaded(true);
        setImageError(false);
      };
      
      img.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };
      
      img.src = src;
    }
  }, [src]);

  const getImageStyle = (): React.CSSProperties => {
    if (!imageDimensions) return {};
    
    const { width, height } = imageDimensions;
    const aspectRatio = width / height;
    
    // Calcular dimensões para preencher completamente o container
    // Usar object-fit: cover para garantir preenchimento total
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const, // Especificar tipo literal
      objectPosition: 'center',
      minHeight: `${containerHeight}px`
    };
  };

  if (imageError || !src) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg ${className}`}
        style={{ height: `${containerHeight}px` }}
      >
        <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
          {fallbackText}
        </span>
      </div>
    );
  }

  if (!imageLoaded) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg animate-pulse ${className}`}
        style={{ height: `${containerHeight}px` }}
      >
        <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ height: `${containerHeight}px` }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full transition-transform duration-300 hover:scale-105"
        style={getImageStyle()}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default CellImage;
