// Plant+ — PWA instalável que requer conexão com a internet.
// Limpa caches antigos que permitiam a abertura da interface offline.
const VERSAO = 'plantplus-online-v8';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(nome => nome.startsWith('plantplus-')).map(nome => caches.delete(nome)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode !== 'navigate') return; // demais arquivos e dados: rede normal
  event.respondWith((async () => {
    try { return await fetch(event.request); }
    catch (_) {
      return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1b4d2e"><title>Plant+ — Sem conexão</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;background:#dcedc8;color:#1b4d2e;font:16px system-ui,sans-serif}main{margin:24px;padding:28px;text-align:center;border-radius:20px;background:#fbf8ef;max-width:400px}button{margin-top:12px;padding:12px 24px;border:0;border-radius:25px;background:#2e7d32;color:white;font:inherit;cursor:pointer}</style></head><body><main><h1>🌿 Plant+</h1><h2>Sem conexão com a internet</h2><p>Verifique sua conexão e tente novamente para acessar o aplicativo.</p><button onclick="location.reload()">Tentar novamente</button></main></body></html>`, {
        status: 503,
        headers: {'Content-Type': 'text/html; charset=utf-8','Cache-Control':'no-store'}
      });
    }
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(async clients => {
    const aberto = clients.find(c => new URL(c.url).origin === self.location.origin);
    return aberto ? aberto.focus() : self.clients.openWindow('./');
  }));
});
