import React, { useState, useEffect } from 'react';
import { PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PerfectFillImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  containerHeight?: number;
  borderRadius?: string;
}

const PerfectFillImage: React.FC<PerfectFillImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Imagem da Célula',
  containerHeight = 192,
  borderRadius = 'rounded-lg'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (src) {
      const img = new Image();
      
      img.onload = () => {
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

  if (imageError || !src) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 ${borderRadius} ${className}`}
        style={{ 
          height: `${containerHeight}px`,
          minHeight: `${containerHeight}px`
        }}
      >
        <PhotoIcon className="h-16 w-16 text-blue-400 dark:text-gray-500 mb-3" />
        <span className="text-sm text-blue-600 dark:text-gray-400 text-center px-4 font-medium">
          {fallbackText}
        </span>
      </div>
    );
  }

  if (!imageLoaded) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 ${borderRadius} animate-pulse ${className}`}
        style={{ 
          height: `${containerHeight}px`,
          minHeight: `${containerHeight}px`
        }}
      >
        <PhotoIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${borderRadius} ${className}`} 
      style={{ 
        height: `${containerHeight}px`,
        minHeight: `${containerHeight}px`,
        width: '100%'
      }}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          width: '100%',
          height: '100%',
          minHeight: `${containerHeight}px`
        }}
      />
    </div>
  );
};

export default PerfectFillImage;




