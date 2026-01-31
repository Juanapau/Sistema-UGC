// Service Worker para Sistema UGC PWA
// Versión del caché - cambia este número cuando quieras forzar actualización
const CACHE_VERSION = 'ugc-v1.0.0';
const CACHE_NAME = `ugc-cache-${CACHE_VERSION}`;

// Archivos críticos que se cachean para funcionar offline
const CRITICAL_FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/notas-rapidas.js',
  '/regimen-content.js',
  '/logo.png',
  '/incidencias-maestros.html'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Instalando...');
  
  // Forzar que el nuevo service worker tome control inmediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: Cacheando archivos críticos');
      return cache.addAll(CRITICAL_FILES);
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todos los clientes inmediatamente
      return self.clients.claim();
    })
  );
});

// Estrategia de caché: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar solicitudes a Google Sheets API
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar obtener del caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no está en caché y es una página HTML, devolver index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Escuchar mensajes para actualización manual
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
