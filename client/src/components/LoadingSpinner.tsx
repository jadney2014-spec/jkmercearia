import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    success: 'border-green-600',
    danger: 'border-red-600'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className="text-sm text-gray-600">
          {text}
        </p>
      )}
    </div>
  );
};

// Memoizar para evitar re-renders desnecessários
export default React.memo(LoadingSpinner);
