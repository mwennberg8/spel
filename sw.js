/* Frågekampens service worker. Nätet först, så en ny version syns direkt;
   cachen tar över när nätet saknas, så spelet går att köra offline.
   Bara egna filer: anrop till Homey, Gemini och typsnitten går orörda förbi. */
const CACHE = 'fragekampen-2.1.2';
const FILER = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILER)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  /* Bara Frågekampens gamla cachar städas – dashboarden på samma webbplats har egna. */
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith('fragekampen-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || !u.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  e.respondWith(fetch(r).then(svar => {
    if (svar.ok) { const kopia = svar.clone(); caches.open(CACHE).then(c => c.put(r, kopia)); }
    return svar;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(t => t || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
