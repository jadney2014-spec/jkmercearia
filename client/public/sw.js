// Service Worker para cache de assets estáticos e dados
// Versão do cache - incrementar para invalidar cache antigo
const CACHE_VERSION = 'v1.2.1';
const CACHE_NAME = `comunidade-resgate-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `comunidade-resgate-data-${CACHE_VERSION}`;

// Firebase Cloud Messaging - escutar mensagens push
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase (mesma do app)
firebase.initializeApp({
  apiKey: "AIzaSyDW73K6vb7RMdyfsJ6JVzzm1r3sULs4ceY",
  authDomain: "comunidaderesgate-82655.firebaseapp.com",
  projectId: "comunidaderesgate-82655",
  storageBucket: "comunidaderesgate-82655.firebasestorage.app",
  messagingSenderId: "587928941365",
  appId: "1:587928941365:web:b788b8c9acf0a20992d27c"
});

const messaging = firebase.messaging();

// Escutar mensagens push em background
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/img/icons/icon-192x192.png',
    badge: '/img/icons/icon-72x72.png',
    tag: payload.data?.escala_id || 'notification',
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Assets para cachear imediatamente
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// URLs de API para cachear dados
const API_CACHE_PATTERNS = [
  /\/api\/members/,
  /\/api\/transactions/,
  /\/api\/categories/,
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First: Usa cache, depois busca na rede
  CACHE_FIRST: 'cache-first',
  // Network First: Busca na rede primeiro, usa cache se falhar
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate: Retorna cache imediatamente e atualiza em background
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
      });
    })
  );
  
  // Ativar imediatamente sem esperar outras abas fecharem
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Limpar caches antigos (tanto de assets quanto de dados)
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME && 
              cacheName.startsWith('comunidade-resgate')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assumir controle de todas as abas imediatamente
  return self.clients.claim();
});

// Verificar se é uma requisição de dados do Firestore
function isDataRequest(request) {
  const url = new URL(request.url);
  // Firestore usa URLs específicas
  return url.hostname.includes('firestore.googleapis.com') ||
         url.hostname.includes('firebaseio.com') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Navegação SPA (React Router): evitar servir HTML antigo com chunks novos
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstForNavigation(request));
    return;
  }

  // Verificar se é uma requisição de dados (Firestore)
  if (isDataRequest(request)) {
    // Dados: Network First com cache
    event.respondWith(networkFirstWithDataCache(request));
    return;
  }

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas (exceto assets estáticos)
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/static')) {
    return;
  }

  // Estratégia baseada no tipo de recurso
  if (url.pathname.startsWith('/static/')) {
    // Assets estáticos: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // APIs: Network First
    event.respondWith(networkFirst(request));
  } else {
    // Páginas HTML: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Navegação (HTML): Network First com fallback para a raiz cacheada
async function networkFirstForNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Fallback para o index (SPA)
    const cachedIndex = await cache.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }
    throw error;
  }
}

// Estratégia: Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cachear resposta bem-sucedida
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    // Retornar resposta offline se disponível
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Estratégia: Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cachear resposta bem-sucedida
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Cache API só suporta GET. Para outros métodos, apenas faz o fetch.
  if (request.method && request.method !== 'GET') {
    return fetch(request);
  }

  // Buscar na rede em background
  const fetchPromise = fetch(request).then((networkResponse) => {
    // Cachear resposta bem-sucedida
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Se falhar, não fazer nada
  });

  // Retornar cache imediatamente se disponível, senão esperar rede
  return cachedResponse || fetchPromise;
}

// Estratégia: Network First com cache de dados
async function networkFirstWithDataCache(request) {
  const dataCache = await caches.open(DATA_CACHE_NAME);

  // Cache API só suporta GET. Para outros métodos, não tenta cachear.
  if (request.method && request.method !== 'GET') {
    return fetch(request);
  }
  
  try {
    // Tentar buscar na rede primeiro
    const networkResponse = await fetch(request);
    
    // Cachear resposta bem-sucedida
    if (networkResponse.ok) {
      dataCache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Rede falhou, tentando cache de dados:', error);
    
    // Se falhar, tentar cache
    const cachedResponse = await dataCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não houver cache, retornar resposta offline
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Sem conexão e dados não disponíveis no cache' 
      }),
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

