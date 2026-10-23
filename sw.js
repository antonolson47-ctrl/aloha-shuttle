const V = 'aloha-shuttle-v1';
const FILES = ['./', 'index.html', 'style.css', 'core.js', 'levels.js', 'audio.js', 'game.js', 'title.jpg', 'map.jpg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(n => { const cp = n.clone(); caches.open(V).then(c => c.put(e.request, cp)); return n; }).catch(() => caches.match('index.html')))); });
