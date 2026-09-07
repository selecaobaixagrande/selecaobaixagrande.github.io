// Seleção de Baixa Grande — correções da página inicial
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const VIDEO = 'lv_0_20260816145459.mp4';

const FIX_SCRIPT = `
(function(){
  'use strict';
  function setupLatestGames(){
    var headings=[...document.querySelectorAll('h1,h2,h3,h4')];
    var heading=headings.find(function(h){return /últimos\\s+jogos/i.test((h.textContent||'').trim());});
    if(!heading || document.querySelector('[data-latest-games-tabs]')) return;
    var section=heading.closest('section') || heading.parentElement;
    if(!section) return;

    var tabs=document.createElement('div');
    tabs.setAttribute('data-latest-games-tabs','1');
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','Filtrar últimos jogos');
    tabs.style.cssText='display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap';
    tabs.innerHTML='<button type="button" data-gender="masculino" role="tab" aria-selected="true" style="appearance:none;border:1px solid #b5121b;background:#b5121b;color:#fff;border-radius:8px;padding:11px 18px;font:900 10px Arial,sans-serif;letter-spacing:1px;cursor:pointer">MASCULINO</button><button type="button" data-gender="feminino" role="tab" aria-selected="false" style="appearance:none;border:1px solid #363a40;background:#111316;color:#fff;border-radius:8px;padding:11px 18px;font:900 10px Arial,sans-serif;letter-spacing:1px;cursor:pointer">FEMININO</button>';
    heading.parentNode.insertBefore(tabs,heading.nextSibling);

    var items=[...section.querySelectorAll('.card,.game-card,.match-card,.result-card,.result-feature,[class*="game"],[class*="match"]')].filter(function(el){return !el.closest('[data-latest-games-tabs]') && el!==tabs;});
    if(!items.length) items=[...section.children].filter(function(el){return el!==tabs && el!==heading.parentElement && (el.textContent||'').trim().length>5;});

    function isFemale(el){return /feminina|feminino|futsal feminino|futebol feminino|\\bFEM\\b/i.test(el.textContent||'');}
    function render(gender){
      items.forEach(function(el){el.hidden=(gender==='feminino')!==isFemale(el);});
      tabs.querySelectorAll('button').forEach(function(btn){
        var active=btn.dataset.gender===gender;
        btn.setAttribute('aria-selected',String(active));
        btn.style.background=active?'#b5121b':'#111316';
        btn.style.borderColor=active?'#b5121b':'#363a40';
      });
    }
    tabs.addEventListener('click',function(e){var btn=e.target.closest('button[data-gender]');if(btn)render(btn.dataset.gender);});
    render('masculino');
  }
  function fixVideos(){
    document.querySelectorAll('video').forEach(function(video){
      if(!video.querySelector('source')){
        var s=document.createElement('source');
        s.src=new URL('${VIDEO}',location.href).href;
        s.type='video/mp4';
        video.prepend(s);
      }
      video.load();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setupLatestGames();fixVideos();});
  else {setupLatestGames();fixVideos();}
})();
`;

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Vídeos devem ser entregues diretamente para preservar o suporte a Range.
  if (event.request.destination === 'video' || url.pathname.endsWith('.mp4')) return;

  // Injeta a correção somente nas páginas HTML, sem substituir o restante do site.
  if (event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith((async () => {
      const response = await fetch(event.request, {cache:'no-store'});
      const type = response.headers.get('content-type') || '';
      if (!type.includes('text/html')) return response;
      let html = await response.text();
      const injection = '<script data-sb-fix="1">' + FIX_SCRIPT.replace(/<\\/script>/gi,'<\\/scr'+'ipt>') + '</script>';
      if (!html.includes('data-sb-fix="1"')) html = html.replace(/<\\/body>/i, injection + '</body>');
      return new Response(html, {status:response.status,statusText:response.statusText,headers:response.headers});
    })());
    return;
  }

  event.respondWith(fetch(event.request, {cache:'no-store'}));
});