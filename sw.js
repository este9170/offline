const CACHE_NAME = 'Challenge-v1';
const OFFLINE_PAGE = [
  '/',
  '/login',
  '/signup'
  ];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(OFFLINE_PAGE)
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => !currentCaches.includes(name))
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Pages HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => 
        cache.match(event.request)
          .then(cached => cached || fetch(event.request))
          .catch(() => caches.match('/'))
      )
    );
  }
  
  // CSS + Fonts + Images + JS (TOUT)
  else if (
    url.includes('.css') ||
    url.includes('.woff2') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.js') ||       // ← NOUVEAU !
    url.includes('manifest.json') // ← NOUVEAU !
  ) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then(cache => 
          cache.match(event.request)
            .then(cached => {
              if (cached) {
                return cached;
              }
              
              // Fetch + cache
              return fetch(event.request).then(response => {
                cache.put(event.request, response.clone());
                return response;
              });
            })
            .catch(() => {
              return new Response('Asset offline', {status: 503});
            })
        )
    );
  }
});
