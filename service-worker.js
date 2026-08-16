const CACHE_NAME = 'sbg-click-sound-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;

  event.respondWith((async () => {
    const response = await fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;

    const html = await response.text();
    if (html.includes('click-sound.js')) return new Response(html, {headers: response.headers});

    const injected = html.replace(/<\/body>/i, '<script src="/click-sound.js"></script></body>');
    return new Response(injected, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  })());
});
