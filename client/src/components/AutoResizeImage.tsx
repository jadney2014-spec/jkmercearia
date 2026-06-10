import React, { useState, useEffect } from 'react';
import { PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AutoResizeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  maxHeight?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fillContainer?: boolean; // Nova prop para preencher container
  containerWidth?: number; // Largura do container para cálculo
}

const AutoResizeImage: React.FC<AutoResizeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Imagem não disponível',
  maxHeight = 300,
  objectFit = 'cover',
  fillContainer = false,
  containerWidth = 400
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
    
    if (fillContainer) {
      // Para preencher container completamente
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const, // Especificar tipo literal
        objectPosition: 'center'
      };
    }
    
    // Cálculo original para dimensionamento proporcional
    let calculatedHeight = maxHeight;
    let calculatedWidth = calculatedHeight * aspectRatio;
    
    // Se a largura for muito grande, ajustar baseado na largura
    if (calculatedWidth > containerWidth) {
      calculatedWidth = containerWidth;
      calculatedHeight = calculatedWidth / aspectRatio;
    }
    
    return {
      width: `${calculatedWidth}px`,
      height: `${calculatedHeight}px`,
      objectFit: objectFit // Usar diretamente o valor da prop
    };
  };

  if (imageError || !src) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg ${className}`}
        style={{ height: fillContainer ? '100%' : `${maxHeight}px` }}
      >
        <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {fallbackText}
        </span>
      </div>
    );
  }

  if (!imageLoaded) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}
        style={{ height: fillContainer ? '100%' : `${maxHeight}px` }}
      >
        <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-lg shadow-md transition-opacity duration-300 ${className}`}
      style={getImageStyle()}
      loading="lazy"
    />
  );
};

export default AutoResizeImage;
