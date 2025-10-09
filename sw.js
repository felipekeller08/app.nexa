/* sw.js */
const CACHE = "nexa-v1";
const CORE = [
  "/", "/index.html",
  "/style.css", "/app.js",
  "/manifest.webmanifest",
  "/assets/icons/nexa-192.png",
  "/assets/icons/nexa-512.png",
  "/assets/icons/nexa-maskable.png"
];

// instala e pré-cacheia os arquivos essenciais
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

// assume o controle imediatamente
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// estratégia: cache-first para estáticos de mesma origem, network para APIs
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // só GET
  if (request.method !== "GET") return;

  // APIs externas (ex.: conversor): rede direta
  if (url.origin !== location.origin) return;

  // arquivos do app: cache-first com atualização em segundo plano
  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => cached); // offline: usa o cache
      return cached || fetchPromise;
    })
  );
});
