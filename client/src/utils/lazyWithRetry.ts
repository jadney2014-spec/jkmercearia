import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Lazy loading com retry automático em caso de falha
 * Isso previne páginas brancas quando o carregamento do módulo falha
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): LazyExoticComponent<T> {
  const componentName = componentImport.toString().match(/['"]([^'"]+)['"]/)?.[1] || 'unknown';
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const module = await componentImport();
        if (!module) {
          throw new Error(`Module ${componentName} is null or undefined`);
        }
        if (!module.default) {
          throw new Error(`Module ${componentName} does not have a default export. Available exports: ${Object.keys(module).join(', ')}`);
        }
        if (typeof module.default !== 'function' && typeof module.default !== 'object') {
          throw new Error(`Module ${componentName} default export is not a valid component (type: ${typeof module.default})`);
        }
        return module;
      } catch (error) {
        lastError = error as Error;
        console.warn(`âŒ Falha ao carregar módulo (tentativa ${i + 1}/${retries}):`, error);
        
        // Aguardar antes de tentar novamente (exponencial backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    // Se todas as tentativas falharam, lançar erro
    console.error('âŒ Todas as tentativas de carregar o módulo falharam');
    throw lastError || new Error('Falha ao carregar módulo após múltiplas tentativas');
  });
}
