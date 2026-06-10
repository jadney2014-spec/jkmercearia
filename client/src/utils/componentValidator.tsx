import React, { ComponentType, ReactElement } from 'react';

/**
 * Wrapper que valida se um componente está definido antes de renderizá-lo
 * Previne erros de "Element type is invalid... got: undefined"
 */
export function SafeComponent<T extends Record<string, any> = Record<string, any>>({
  component: Component,
  fallback,
  ...props
}: {
  component: ComponentType<T> | undefined | null;
  fallback?: ReactElement;
} & T): ReactElement | null {
  if (!Component) {
    const componentName = (Component as any)?.name || 'Unknown';
  }
  
  if (!Component) {
    if (fallback) {
      return fallback;
    }
    console.error('âŒ SafeComponent: Tentativa de renderizar componente undefined');
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          Erro: Componente não encontrado
        </p>
      </div>
    );
  }

  if (typeof Component !== 'function' && typeof Component !== 'object') {
    console.error('âŒ SafeComponent: Component não é uma função ou objeto válido', typeof Component);
    if (fallback) {
      return fallback;
    }
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          Erro: Componente inválido (tipo: {typeof Component})
        </p>
      </div>
    );
  }

  try {
    return <Component {...(props as unknown as T)} />;
  } catch (error) {
    console.error('âŒ SafeComponent: Erro ao renderizar componente:', error);
    if (fallback) {
      return fallback;
    }
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          Erro ao renderizar componente: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}
