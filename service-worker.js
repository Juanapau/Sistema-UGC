// Service Worker para Sistema UGC PWA
// Versión del caché - cambia este número cuando quieras forzar actualización
const CACHE_VERSION = 'ugc-v1.0.1'; // ← Incrementada para forzar actualización
const CACHE_NAME = `ugc-cache-${CACHE_VERSION}`;

// Archivos críticos que se cachean para funcionar offline
const CRITICAL_FILES = [
  '/Sistema-UGC/',
  '/Sistema-UGC/index.html',
  '/Sistema-UGC/app.js',
  '/Sistema-UGC/styles.css',
  '/Sistema-UGC/notas-rapidas.js',
  '/Sistema-UGC/regimen-content.js',
  '/Sistema-UGC/logo.png',
  '/Sistema-UGC/incidencias-maestros.html'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Instalando v1.0.1...');
  
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
  console.log('✅ Service Worker: Activando v1.0.1...');
  
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
  // 🆕 CORREGIDO: Pasar peticiones POST sin interceptar
  if (event.request.method !== 'GET') {
    // Dejar que la petición pase directamente sin interceptar
    return; // No hacemos event.respondWith(), el navegador la maneja
  }
  
  // 🆕 CORREGIDO: Pasar peticiones a Google Sheets sin interceptar
  if (event.request.url.includes('script.google.com')) {
    // Dejar que la petición pase directamente
    return;
  }
  
  // Solo cachear peticiones GET que no sean a Google Sheets
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

console.log('✅ Service Worker v1.0.1 cargado - POST requests corregidas');
