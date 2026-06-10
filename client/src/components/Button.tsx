import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading = false,
  ...props 
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 font-bold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation';

  const variantClasses = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'text-white bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  const disabledClasses = 'disabled:bg-gray-300 disabled:cursor-not-allowed';

  const className = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    props.className
  ].join(' ');

  return (
    <button {...props} className={className} disabled={props.disabled || loading}>
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};

// Memoizar para evitar re-renders desnecessários
export default React.memo(Button);
