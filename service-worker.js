// Seleção de Baixa Grande — correções da página inicial
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const VIDEO = 'lv_0_20260816145459.mp4';

const FIX_SCRIPT = `
(function(){
  'use strict';
  function fixVideos(){
    document.querySelectorAll('video').forEach(function(video){
      video.setAttribute('playsinline','');
      video.muted=true;
      var p=video.play();
      if(p) p.catch(function(){});
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixVideos);
  else fixVideos();
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
      const NAV_SCRIPT = `
(function(){
  if(!/\\.html$/.test(location.pathname) && location.pathname!=='/') return;
  var current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  // A barra inferior aparece apenas dentro do portal, nunca na tela de entrada.
  if(current==='index.html' || location.pathname==='/') return;
  if(document.querySelector('.mobile-portal-nav')) return;
  var links=[
    ['home.html','⌂','Início'],
    ['noticias.html','▤','Notícias'],
    ['jogos.html','⚽','Jogos'],
    ['galeria.html','▧','Galeria']
  ];
  var nav=document.createElement('nav');
  nav.className='mobile-portal-nav';
  nav.setAttribute('aria-label','Navegação rápida no celular');
  nav.innerHTML=links.map(function(item){
    var active=current===item[0] || (current==='index.html' && item[0]==='home.html');
    return '<a href="'+item[0]+'"'+(active?' aria-current="page"':'')+'><span>'+item[1]+'</span>'+item[2]+'</a>';
  }).join('')+'<a href="#nav" data-mobile-menu><span>☰</span>Menu</a>';
  var style=document.createElement('style');
  style.textContent='@media(max-width:760px){body{padding-bottom:88px!important}.mobile-portal-nav{position:fixed;z-index:99999;left:10px;right:10px;bottom:max(8px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:8px 5px calc(7px + env(safe-area-inset-bottom));border:1px solid #dce7f3;border-radius:17px;background:rgba(255,255,255,.97);box-shadow:0 8px 32px #092d5b24;backdrop-filter:blur(16px);font-family:Arial,sans-serif}.mobile-portal-nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#64748b;font-size:9px;font-weight:700;line-height:1.1;padding:3px 0;text-decoration:none}.mobile-portal-nav a span{font-size:19px;line-height:1}.mobile-portal-nav a[aria-current=page]{color:#1555c0}.mobile-portal-nav a:active{transform:scale(.96)}}@media(min-width:761px){.mobile-portal-nav{display:none!important}}';
  document.head.appendChild(style);
  document.body.appendChild(nav);
  nav.querySelector('[data-mobile-menu]').addEventListener('click',function(e){
    e.preventDefault();
    var button=document.getElementById('menuBtn');
    var mainNav=document.getElementById('nav');
    if(button){button.click();return;}
    if(mainNav){mainNav.classList.toggle('menu-open');mainNav.scrollIntoView({behavior:'smooth',block:'nearest'});return;}
    location.href='central.html';
  });
})();
`;
      const injection = '<script data-sb-fix="1">' + FIX_SCRIPT.replace(/<\\/script>/gi,'<\\/scr'+'ipt>') + '</script>';
      if (!html.includes('data-sb-fix="1"')) html = html.replace(/<\\/body>/i, injection + '</body>');
      return new Response(html, {status:response.status,statusText:response.statusText,headers:response.headers});
    })());
    return;
  }

  event.respondWith(fetch(event.request, {cache:'no-store'}));
});