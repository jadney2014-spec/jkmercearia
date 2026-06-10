import { useCallback, useMemo } from 'react';

// Hook para memoizar callbacks e evitar re-renders desnecessários
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Hook para memoizar valores computados
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// Hook para debounce de operações pesadas
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      const timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      return () => clearTimeout(timeoutId);
    }) as T,
    [callback, delay, ...deps]
  );
}

export default {
  useOptimizedCallback,
  useOptimizedMemo,
  useDebouncedCallback,
};
