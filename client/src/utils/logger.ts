// Logger otimizado que desabilita console.logs em produção para melhor performance

const isDevelopment = process.env.NODE_ENV === 'development';

// Função para log condicional
export const log = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const logError = (...args: any[]) => {
  // Erros sempre são logados, mesmo em produção (mas apenas em desenvolvimento detalhado)
  if (isDevelopment) {
  console.error(...args);
  } else {
    // Em produção, apenas erros críticos
    console.error('[ERROR]', ...args);
  }
};

export const logWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const logInfo = (...args: any[]) => {
  if (isDevelopment) {
    console.info(...args);
  }
};

// Exportar objeto logger para compatibilidade com código existente
export const logger = {
  log,
  error: logError,
  warn: logWarn,
  info: logInfo,
};

// Função para desabilitar console em produção (opcional)
export const disableConsoleInProduction = () => {
  if (!isDevelopment && typeof window !== 'undefined') {
    // Desabilitar console.log e console.warn em produção
    // Manter console.error para erros críticos
    const noop = () => {};
    if (process.env.REACT_APP_DISABLE_CONSOLE === 'true') {
      console.log = noop;
      console.log = noop;
      console.warn = noop;
    }
  }
};

// Inicializar ao carregar
if (typeof window !== 'undefined') {
  disableConsoleInProduction();
}
