import React from 'react';
import ReactDOM from 'react-dom/client';
import './setupLogger';
import './index.css';
import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registerServiceWorker } from './utils/registerServiceWorker';
import { offlineSync } from './utils/offlineSync';
import { setupMessageListener } from './utils/fcm';

// Interceptor GLOBAL para PREVENIR componentes undefined - SEMPRE ATIVO
const originalCreateElement = React.createElement;

// Componente de fallback seguro
const SafeFallbackComponent: React.FC<{ componentName?: string }> = ({ componentName = 'Component' }) => {
  return React.createElement('div', {
    className: 'p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg',
    style: { margin: '1rem' }
  }, React.createElement('p', {
    className: 'text-yellow-800 dark:text-yellow-200 text-sm'
  }, `⚠️ Componente "${componentName}" não pôde ser carregado. Por favor, recarregue a página.`));
};

// Cache para evitar logs repetitivos
const undefinedComponentLogs = new Map<string, number>();
const MAX_LOG_FREQUENCY = 5000; // Log no máximo a cada 5 segundos por componente

(React as any).createElement = function(type: any, props: any, ...children: any[]) {
  // PREVENÇÃO: Se o tipo for undefined/null, substituir por fallback ANTES de chamar React.createElement
  if (type === undefined || type === null) {
    const errorInfo = new Error().stack || '';
    
    // Tentar identificar o componente a partir do stack trace
    let componentName = 'Unknown';
    let sourceInfo = '';
    
    // Extrair informações do stack trace
    const stackLines = errorInfo.split('\n');
    for (const line of stackLines) {
      // Procurar por nomes de arquivos conhecidos
      if (line.includes('ToastContainer') || line.includes('react-toastify')) {
        componentName = 'ToastContainer (react-toastify)';
        sourceInfo = 'react-toastify';
        break;
      } else if (line.includes('AgradecimentoPage')) {
        componentName = 'AgradecimentoPage';
        sourceInfo = 'AgradecimentoPage';
        break;
      } else if (line.includes('CadastroPublicoPage')) {
        componentName = 'CadastroPublicoPage';
        sourceInfo = 'CadastroPublicoPage';
        break;
      } else if (line.includes('motion') || line.includes('Motion') || line.includes('framer-motion')) {
        componentName = 'Motion Component (framer-motion)';
        sourceInfo = 'framer-motion';
        break;
      } else if (line.includes('MemberList')) {
        componentName = 'MemberList';
        sourceInfo = 'MemberList';
        break;
      } else if (line.includes('MemberForm')) {
        componentName = 'MemberForm';
        sourceInfo = 'MemberForm';
        break;
      } else if (line.includes('Modal')) {
        componentName = 'Modal';
        sourceInfo = 'Modal';
        break;
      }
    }
    
    // Usar props como fallback e tentar identificar melhor
    if (componentName === 'Unknown') {
      // Tentar identificar pelo stack trace mais profundamente
      for (const line of stackLines) {
        if (line.includes('motion') || line.includes('Motion')) {
          componentName = 'Motion Component (framer-motion)';
          sourceInfo = 'framer-motion';
          break;
        } else if (line.includes('AnimatePresence')) {
          componentName = 'AnimatePresence (framer-motion)';
          sourceInfo = 'framer-motion';
          break;
        } else if (line.includes('CadastroPublicoPage')) {
          componentName = 'CadastroPublicoPage';
          sourceInfo = 'CadastroPublicoPage';
          break;
        }
      }
      
      // Se ainda for Unknown, tentar pelas props e stack trace
      if (componentName === 'Unknown') {
        // Tentar identificar pelo className (pode indicar qual componente)
        const className = props?.className || '';
        if (className.includes('motion') || className.includes('animate')) {
          componentName = 'Motion Component (framer-motion)';
          sourceInfo = 'framer-motion';
        } else {
          // Tentar extrair do stack trace o arquivo
          const fileMatch = errorInfo.match(/([^/\\]+\.(tsx|ts|jsx|js))[:\d]*/);
          if (fileMatch) {
            const fileName = fileMatch[1];
            componentName = `Component from ${fileName}`;
            // Tentar identificar a origem
            if (fileName.includes('Agradecimento')) {
              sourceInfo = 'AgradecimentoPage';
            } else if (fileName.includes('Cadastro')) {
              sourceInfo = 'CadastroPublicoPage';
            } else if (fileName.includes('index.tsx') || fileName.includes('index.ts')) {
              // Se for do index.tsx, é provavelmente do próprio interceptor - suprimir
              sourceInfo = 'index-interceptor';
            }
          } else {
            componentName = props?.componentName || props?.id || props?.type || props?.name || 'Unknown';
          }
        }
      }
    }
    
    // Rate limiting de logs para evitar spam
    const logKey = `${componentName}-${sourceInfo}`;
    const now = Date.now();
    const lastLog = undefinedComponentLogs.get(logKey) || 0;
    
    // Para AgradecimentoPage, framer-motion, CadastroPublicoPage e index-interceptor, suprimir logs
    const shouldLog = sourceInfo !== 'AgradecimentoPage' && sourceInfo !== 'framer-motion' && sourceInfo !== 'CadastroPublicoPage' && sourceInfo !== 'index-interceptor';
    
    // SEMPRE logar quando for "Unknown" para identificar o problema
    const isUnknown = componentName === 'Unknown' || componentName.includes('Unknown');
    
    if ((shouldLog || isUnknown) && now - lastLog > MAX_LOG_FREQUENCY) {
      undefinedComponentLogs.set(logKey, now);
      
      // Log detalhado para identificar o componente
      const propKeys = props ? Object.keys(props).slice(0, 15) : [];
      const className = props?.className || '';
      const id = props?.id || '';
      
      // Extrair arquivo e linha do stack trace
      const stackPreview = errorInfo.split('\n').slice(0, 8);
      const fileMatches = stackPreview
        .map(line => line.match(/([^/\\]+\.(tsx|ts|jsx|js))[:\d]*/))
        .filter(match => match !== null)
        .map(match => match![1]);
      
      const fileName = fileMatches[0] || 'unknown';
      const allFiles = fileMatches.slice(0, 3).join(', ');
      
      // Log mais detalhado para Unknown
      if (isUnknown) {
        console.error(`🔍 COMPONENTE UNDEFINED DETECTADO (Unknown):`, {
          componentName,
          sourceInfo: sourceInfo || 'não identificado',
          fileName,
          allFiles,
          props: propKeys,
          className: className.substring(0, 100),
          id,
          hasChildren: !!props?.children,
          childrenType: typeof props?.children,
          stackTrace: stackPreview.slice(0, 5).join('\n')
        });
      } else {
        console.warn(`⚠️ Componente undefined detectado: "${componentName}" (${sourceInfo || 'origem desconhecida'}). Substituindo por fallback seguro.`, {
          fileName,
          props: propKeys,
          className: className.substring(0, 50),
          id
        });
      }
    }
    
    // SUBSTITUIR por componente seguro ao invés de lançar erro
    // Para react-toastify, AgradecimentoPage, CadastroPublicoPage, framer-motion e index-interceptor, usar um fallback silencioso
    if (sourceInfo === 'react-toastify' || sourceInfo === 'AgradecimentoPage' || sourceInfo === 'framer-motion' || sourceInfo === 'CadastroPublicoPage' || sourceInfo === 'index-interceptor') {
      // Para esses casos, retornar null ao invés de fallback visual (já têm validações internas)
      return null;
    }
    
    return originalCreateElement.apply(this, [SafeFallbackComponent, { componentName, ...props }, ...children] as any);
  }
  
  // Verificar se é um objeto inválido (não é string, função, nem elemento React válido)
  if (typeof type === 'object' && type !== null) {
    // Elementos React válidos têm $$typeof
    if (type.$$typeof) {
      // É um elemento React válido, prosseguir normalmente
      return originalCreateElement.apply(this, [type, props, ...children] as any);
    }
    
    // Pode ser um componente lazy ou memoizado (tem _payload ou type)
    if ((type as any)._payload || (type as any).type || (type as any).render) {
      // É um componente lazy/memoizado válido, prosseguir
      return originalCreateElement.apply(this, [type, props, ...children] as any);
    }
    
    // Objeto inválido - substituir por fallback
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ React.createElement chamado com objeto inválido. Substituindo por fallback seguro.', {
        type: String(type),
        keys: Object.keys(type || {})
      });
    }
    const componentName = props?.componentName || props?.id || 'InvalidObject';
    return originalCreateElement.apply(this, [SafeFallbackComponent, { componentName, ...props }, ...children] as any);
  }
  
  // Verificar se é uma função válida
  if (typeof type === 'function') {
    try {
      const typeName = type.name || type.displayName || 'Anonymous';
      // Se o nome da função for 'undefined' ou 'null', é suspeito
      if (typeName === 'undefined' || typeName === 'null') {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Função com nome inválido detectada. Substituindo por fallback seguro.', { typeName });
        }
        const componentName = props?.componentName || props?.id || typeName;
        return originalCreateElement.apply(this, [SafeFallbackComponent, { componentName, ...props }, ...children] as any);
      }
    } catch (e) {
      // Se houver erro ao verificar, prosseguir normalmente
    }
  }
  
  // Tipo válido (string, função válida, ou elemento React) - renderizar normalmente
  try {
    return originalCreateElement.apply(this, [type, props, ...children] as any);
  } catch (error) {
    // Se houver erro ao renderizar, substituir por fallback
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro ao renderizar componente. Substituindo por fallback seguro.', error);
    }
    const componentName = typeof type === 'function' ? (type.name || 'Unknown') : String(type);
    return originalCreateElement.apply(this, [SafeFallbackComponent, { componentName, originalError: error instanceof Error ? error.message : String(error) }, ...children] as any);
  }
};

// Handler global de erros para capturar erros não tratados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    try {
      const message = event?.error instanceof Error ? event.error.message : (event?.message || 'Erro inesperado');
      const details = event?.error instanceof Error ? event.error.stack : undefined;
      const existing = document.getElementById('global-runtime-error');
      if (existing) return;

      const el = document.createElement('div');
      el.id = 'global-runtime-error';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.zIndex = '2147483647';
      el.style.background = '#0b0b0b';
      el.style.color = '#ffffff';
      el.style.padding = '16px';
      el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      el.style.overflow = 'auto';
      el.innerText = `Erro ao abrir o app.\n\n${message}${details ? `\n\n${details}` : ''}`;
      document.body.appendChild(el);
    } catch {
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = (event as PromiseRejectionEvent)?.reason;
      const message = reason instanceof Error ? reason.message : String(reason || 'Promise rejeitada');
      const details = reason instanceof Error ? reason.stack : undefined;
      const existing = document.getElementById('global-runtime-error');
      if (existing) return;

      const el = document.createElement('div');
      el.id = 'global-runtime-error';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.zIndex = '2147483647';
      el.style.background = '#0b0b0b';
      el.style.color = '#ffffff';
      el.style.padding = '16px';
      el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      el.style.overflow = 'auto';
      el.innerText = `Erro ao abrir o app.\n\n${message}${details ? `\n\n${details}` : ''}`;
      document.body.appendChild(el);
    } catch {
    }
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </React.StrictMode>
);

// Registrar Service Worker (necessário para Push/FCM em background)
// Em DEV: funciona em localhost (ou HTTPS). Em PROD: sempre.
try {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (process.env.NODE_ENV === 'production' || isLocalhost) {
    registerServiceWorker();
  }
} catch {
}

// Listener de mensagens em primeiro plano (foreground)
try {
  setupMessageListener();
} catch {
}
