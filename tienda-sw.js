/* Service worker de Tienda YGO: la app abre sin internet y se actualiza sola cuando hay conexión. */
const VERSION = 'tienda-v31';
const CORE = ['./tienda.html', './tienda.webmanifest', './tienda-192.png', './tienda-512.png', './huitzilin-logo.jpg', './tienda-maskable-512.png', './firebase-config.js'];
const CDN = ['www.gstatic.com', 'cdn.jsdelivr.net', 'unpkg.com', 'tessdata.projectnaptha.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // propios: primero la red (para recibir actualizaciones), si no hay internet, la copia guardada
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./tienda.html'))));
  } else if (CDN.includes(url.hostname)) {
    // librerías externas (lector de texto): primero la copia guardada
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
  // APIs de precios y tipo de cambio: siempre por la red
});
