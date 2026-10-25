/* Service worker do Funkin Maker Mobile: deixa o app instalável e funcionando offline.
   Ao publicar uma versão nova do jogo, troque o número em VERSAO para forçar a atualização. */
const VERSAO = 'fmm-v1';
const BASE = ['./', 'index.html', 'manifest.json', 'logo.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  /* páginas: tenta a internet primeiro (pega versão nova); sem internet, usa o que está salvo */
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(VERSAO).then(c => c.put('index.html', cp)).catch(() => {}); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  /* demais arquivos: usa o salvo e atualiza em segundo plano */
  e.respondWith(
    caches.match(r).then(salvo => {
      const rede = fetch(r)
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSAO).then(c => c.put(r, cp)).catch(() => {}); } return res; })
        .catch(() => salvo);
      return salvo || rede;
    })
  );
});
