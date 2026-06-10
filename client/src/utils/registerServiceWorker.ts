// Registro do Service Worker para cache de assets

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso:', registration.scope);

          // Verificar atualizações periodicamente
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  console.log('🔄 Nova versão do Service Worker disponível');
                  
                  // Opcional: Mostrar notificação ao usuário
                  if (window.confirm('Uma nova versão está disponível. Deseja atualizar?')) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });

      // Verificar se há atualizações disponíveis
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Evitar reload automático (pode causar loops). O reload ocorre somente após confirmação.
      });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Erro ao desregistrar Service Worker:', error);
      });
  }
}

