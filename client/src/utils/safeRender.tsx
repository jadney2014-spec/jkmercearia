import React, { ComponentType, ReactElement } from 'react';

/**
 * Componente de fallback seguro para substituir componentes undefined
 */
const SafeFallback: React.FC<{ componentName?: string }> = ({ componentName = 'Component' }) => {
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
        âš ï¸ Componente "{componentName}" não pôde ser carregado. Por favor, recarregue a página.
      </p>
    </div>
  );
};

/**
 * Wrapper que garante que um componente nunca seja undefined
 * Substitui componentes undefined por um fallback seguro
 */
export function safeComponent<T extends {}>(
  Component: ComponentType<T> | undefined | null,
  componentName?: string
): ComponentType<T> {
  if (!Component || Component === undefined || Component === null) {
    console.error(`âŒ Componente ${componentName || 'Unknown'} está undefined. Usando fallback.`);
    return SafeFallback as ComponentType<T>;
  }

  // Verificar se é uma função válida ou objeto React válido
  if (typeof Component !== 'function' && typeof Component !== 'object') {
    console.error(`âŒ Componente ${componentName || 'Unknown'} tem tipo inválido: ${typeof Component}. Usando fallback.`);
    return SafeFallback as ComponentType<T>;
  }

  // Se for um objeto, verificar se tem $$typeof (elemento React válido)
  if (typeof Component === 'object' && !(Component as any).$$typeof) {
    // Pode ser um componente lazy ou memoizado
    if ((Component as any).type || (Component as any).render) {
      return Component as ComponentType<T>;
    }
    console.error(`âŒ Componente ${componentName || 'Unknown'} é um objeto inválido. Usando fallback.`);
    return SafeFallback as ComponentType<T>;
  }

  return Component as ComponentType<T>;
}

/**
 * Hook para renderizar componentes com segurança
 */
export function useSafeComponent<T extends {}>(
  Component: ComponentType<T> | undefined | null,
  componentName?: string
): ComponentType<T> {
  return React.useMemo(() => safeComponent(Component, componentName), [Component, componentName]);
}

/**
 * HOC que envolve um componente com proteção contra undefined
 */
export function withSafeRender<P extends {}>(
  Component: ComponentType<P> | undefined | null,
  componentName?: string
): React.FC<P> {
  const SafeComponent = safeComponent(Component, componentName);
  
  return (props: P) => {
    try {
      return React.createElement(SafeComponent, props);
    } catch (error) {
      console.error(`âŒ Erro ao renderizar componente ${componentName || 'Unknown'}:`, error);
      return React.createElement(SafeFallback, { componentName });
    }
  };
}
