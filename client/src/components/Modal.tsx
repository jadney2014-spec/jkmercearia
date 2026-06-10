import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Componente seguro para o ícone de fechar
const SafeXMarkIcon: React.FC<{ className?: string }> = ({ className }) => {
  if (XMarkIcon) {
    const Icon = XMarkIcon as React.ComponentType<{ className?: string }>;
    return <Icon className={className} />;
  }
  return <span className={className}>X</span>;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  // Validar props
  if (!onClose || typeof onClose !== 'function') {
    console.error('âŒ Modal: onClose não é uma função válida');
    return null;
  }

  if (!title || typeof title !== 'string') {
    console.warn('âš ï¸ Modal: title não é uma string válida');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col m-2 sm:m-0">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white pr-2">{title || 'Modal'}</h3>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 touch-manipulation"
            aria-label="Fechar"
          >
            <SafeXMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Memoizar para evitar re-renders desnecessários
export default React.memo(Modal);
