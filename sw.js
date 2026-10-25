/* Service worker do Funkin Maker Mobile: deixa o app instalável e funcionando offline.
   Ao publicar uma versão nova do jogo, troque o número em VERSAO para forçar a atualização. */
const VERSAO = 'fmm-v2';
const BASE = ['/', '/index.html', '/manifest.json', '/logo.png', '/icon-192.png', '/icon-512.png', '/icon-maskable.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  /* salva um arquivo por vez: se algum falhar, o resto continua e o app não quebra */
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
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
  /* páginas: internet primeiro; sem internet, usa a cópia salva */
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSAO).then(c => c.put('/index.html', cp)).catch(() => {}); } return res; })
        .catch(() => caches.match('/index.html').then(m => m || caches.match('/')))
    );
    return;
  }
  /* demais arquivos: internet primeiro, cópia salva se falhar */
  e.respondWith(
    fetch(r)
      .then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSAO).then(c => c.put(r, cp)).catch(() => {}); } return res; })
      .catch(() => caches.match(r))
  );
});
