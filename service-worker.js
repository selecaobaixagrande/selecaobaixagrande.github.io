// Seleção de Baixa Grande — atualização sem interferir no vídeo do estádio
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Vídeos precisam passar diretamente para o navegador para preservar o carregamento por faixas (Range).
  if (event.request.destination === 'video' || url.pathname.endsWith('.mp4')) return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});