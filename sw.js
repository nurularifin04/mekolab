const CACHE_NAME = 'mekolab-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/definitions.js',
  './js/ui-elements.js',
  './js/utils.js',
  './js/level-processor.js',
  './lib/jsQR.modified.js',
  './assets/favicon/favicon-96x96.png',
  './assets/favicon/web-app-manifest-192x192.png',
  './assets/favicon/web-app-manifest-512x512.png',
  'https://unpkg.com/pako@2.1.0/dist/pako.min.js',
  'https://unpkg.com/qrcode-generator@2.0.2/dist/qrcode.js',
  'https://unpkg.com/sweetalert2@11.22.4/dist/sweetalert2.all.js',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_left_alt,arrow_right_alt,block,cancel,check,circle,close,data_table,deployed_code,download,edit,image_arrow_up,play_arrow,qr_code,save'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        if (event.request.url.includes('fonts.googleapis.com') || 
            event.request.url.includes('fonts.gstatic.com') || 
            event.request.url.includes('unpkg.com')) {
          fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          });
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
