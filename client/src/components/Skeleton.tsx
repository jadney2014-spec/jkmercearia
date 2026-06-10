import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-label="Carregando..."
      role="status"
    />
  );
};

// Componente SkeletonCard para compatibilidade
interface SkeletonCardProps {
  delay?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ delay = 0 }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" height={16} width="33%" />
        <Skeleton variant="rectangular" height={32} width={64} />
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" height={12} width="100%" />
        <Skeleton variant="text" height={12} width="66%" />
        <Skeleton variant="text" height={12} width="50%" />
      </div>
    </div>
  );
};

// Exportar ambos como default (padrão do projeto)
export default Skeleton;
export { SkeletonCard };
