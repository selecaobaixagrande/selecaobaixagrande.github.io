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

    var originalItems=[...section.querySelectorAll('.card,.game-card,.match-card,.result-card,.result-feature,[class*="game"],[class*="match"]')].filter(function(el){return !el.closest('[data-latest-games-tabs]');});

    var female=document.createElement('div');
    female.setAttribute('data-female-games','1');
    female.style.cssText='display:none;gap:14px;flex-direction:column;width:100%';
    female.innerHTML=
      '<article style="border:1px solid #292d32;border-radius:16px;background:linear-gradient(145deg,#111316,#0b0c0e);padding:22px;text-align:center">'+
        '<div style="color:#ff5962;font:900 8px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Copa Regional de Futsal Feminino 2026</div>'+ 
        '<div style="font:700 22px Oswald,Arial,sans-serif">BAIXA GRANDE <span style="color:#ff5962">×</span> MUNDO NOVO</div>'+ 
        '<div style="font:900 34px Oswald,Arial,sans-serif;margin:10px 0">2 × 1</div>'+ 
        '<div style="color:#9ba0a8;font:700 9px Arial,sans-serif;letter-spacing:1px">ENCERRADO</div>'+ 
        '<div style="color:#777d85;font:10px Arial,sans-serif;margin-top:9px">Ginásio de Esportes — Mairi</div>'+ 
      '</article>'+ 
      '<article style="border:1px solid #292d32;border-radius:16px;background:linear-gradient(145deg,#111316,#0b0c0e);padding:22px;text-align:center">'+
        '<div style="color:#ff5962;font:900 8px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Copa Regional de Futsal Feminino 2026</div>'+ 
        '<div style="font:700 22px Oswald,Arial,sans-serif">TAPIRAMUTÁ <span style="color:#ff5962">×</span> BAIXA GRANDE</div>'+ 
        '<div style="font:900 34px Oswald,Arial,sans-serif;margin:10px 0">4 × 8</div>'+ 
        '<div style="color:#9ba0a8;font:700 9px Arial,sans-serif;letter-spacing:1px">ENCERRADO</div>'+ 
        '<div style="color:#777d85;font:10px Arial,sans-serif;margin-top:9px">Ginásio de Esportes — Mairi</div>'+ 
        '<div style="color:#777d85;font:10px Arial,sans-serif;margin-top:5px">Quartas de Final</div>'+ 
      '</article>';
    tabs.parentNode.insertBefore(female,tabs.nextSibling);

    function render(gender){
      var isFemale=gender==='feminino';
      originalItems.forEach(function(el){el.hidden=isFemale;});
      female.style.display=isFemale?'flex':'none';
      tabs.querySelectorAll('button').forEach(function(btn){
        var active=btn.dataset.gender===gender;
        btn.setAttribute('aria-selected',String(active));
        btn.style.background=active?'#b5121b':'#111316';
        btn.style.borderColor=active?'#b5121b':'#363a40';
      });
    }
    tabs.addEventListener('click',function(e){
      var btn=e.target.closest('button[data-gender]');
      if(btn) render(btn.dataset.gender);
    });
    render('masculino');
  }

  function fixVideos(){
    document.querySelectorAll('video').forEach(function(video){
      var src=new URL('${VIDEO}',location.href).href;
      video.setAttribute('playsinline','');
      video.setAttribute('preload','auto');
      video.muted=true;
      video.src=src;
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