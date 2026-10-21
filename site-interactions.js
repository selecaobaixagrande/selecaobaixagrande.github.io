/* Navegação móvel profissional e consistente em todas as páginas públicas */
(() => {
  const pages = [
    {label:"Início",url:"home.html",icon:"home"},
    {label:"Notícias",url:"noticias.html",icon:"news"},
    {label:"Jogos",url:"jogos.html",icon:"ball"},
    {label:"Galeria",url:"galeria.html",icon:"gallery"},
    {label:"Menu",url:"#menu",icon:"menu"}
  ];
  const allLinks = [
    ["Início","home.html"],["Notícias","noticias.html"],["Agenda de jogos","jogos.html"],
    ["Resultados","resultados.html"],["Classificação","classificacao.html"],["Categorias","categorias.html"],
    ["Elenco","elenco.html"],["Galeria","galeria.html"],["Galeria de jogos","galeria-jogos.html"],
    ["Conquistas","conquistas.html"],["História","historia.html"],["Linha do tempo","linha-do-tempo.html"],
    ["Estatísticas","estatisticas.html"],["Vídeos","videos.html"],["Parceiros","parceiros.html"],
    ["Central do portal","central.html"]
  ];
  const icons = {
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5.5 9v11h13V9M9 20v-6h6v6"/></svg>',
    news:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10Z"/><path d="M14 3v7h7M7 14h10M7 17h10M7 11h3"/></svg>',
    ball:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="m12 7 4 3-1.5 5h-5L8 10Zm0 0V3M8 10l-5-1M9.5 15l-3 4M14.5 15l3 4M16 10l5-1"/></svg>',
    gallery:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
  };
  const style = document.createElement("style");
  style.textContent = `
    .mobile-portal-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;transform:none!important;z-index:99990!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:3px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.98)!important;border:1px solid #dce4ef!important;border-bottom:0!important;border-radius:18px 18px 0 0!important;box-shadow:0 -6px 24px rgba(23,55,101,.12);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .mobile-portal-nav a,.mobile-portal-nav button{appearance:none;-webkit-appearance:none;box-sizing:border-box;min-width:0;min-height:54px;max-width:100%;padding:4px 1px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:0;border-radius:13px;background:transparent;color:#64748b!important;text-decoration:none;font:650 10px/1.1 Inter,system-ui,sans-serif;letter-spacing:.05px;white-space:nowrap;cursor:pointer;touch-action:manipulation;transition:background .18s ease,color .18s ease,transform .18s ease}
    .mobile-portal-nav .nav-icon{display:flex;width:24px;height:24px;align-items:center;justify-content:center}
    .mobile-portal-nav svg{display:block;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .mobile-portal-nav a[aria-current="page"]{color:#183765!important;background:#edf3fc;font-weight:800}
    .mobile-portal-nav a[aria-current="page"] .nav-icon{color:#cf2338}
    .mobile-portal-nav a:active,.mobile-portal-nav button:active{transform:scale(.94)}
    .sb-quick-menu{position:fixed;inset:0;z-index:99995;display:flex;align-items:flex-end;justify-content:center;padding:16px 14px calc(78px + env(safe-area-inset-bottom));background:rgba(4,15,32,.38);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s ease}
    .sb-quick-menu.is-open{opacity:1;visibility:visible}
    .sb-quick-panel{width:min(100%,560px);max-height:min(68vh,560px);overflow:auto;padding:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;background:#fff;color:#12366d;border:1px solid #dce7f3;border-radius:22px;box-shadow:0 22px 70px rgba(0,0,0,.25);transform:translateY(14px) scale(.985);transition:transform .22s cubic-bezier(.2,.7,.2,1)}
    .sb-quick-menu.is-open .sb-quick-panel{transform:translateY(0) scale(1)}
    .sb-quick-title{grid-column:1/-1;padding:4px 5px 10px;font-size:11px;letter-spacing:1.8px;color:#647994;font-weight:900;text-transform:uppercase}
    .sb-quick-panel a{display:flex;align-items:center;min-height:44px;padding:10px 12px;border-radius:11px;text-decoration:none;color:#153b70;background:#f4f7fb;font-size:13px;font-weight:750;transition:background .18s,color .18s,transform .18s}
    .sb-quick-panel a:hover,.sb-quick-panel a:focus-visible{background:#e8eff9;color:#b5121b;outline:2px solid #dce7f3;outline-offset:1px}
    .sb-quick-close{grid-column:1/-1;min-height:44px;margin-top:4px;border:0;border-radius:11px;background:#12366d;color:#fff;font-weight:800;font-size:13px}
    @media(min-width:761px){.mobile-portal-nav{display:none}.sb-quick-menu{align-items:center;padding:24px}.sb-quick-panel{max-height:75vh}}
    @media(max-width:760px){body{padding-bottom:calc(76px + env(safe-area-inset-bottom))!important}footer{padding-bottom:calc(90px + env(safe-area-inset-bottom))!important}.mobile-portal-nav{width:100%;border-radius:18px 18px 0 0}.sb-quick-menu{padding-bottom:calc(78px + env(safe-area-inset-bottom))}}
    @media(prefers-reduced-motion:reduce){.mobile-portal-nav a,.mobile-portal-nav button,.sb-quick-menu,.sb-quick-panel,.sb-quick-panel a{transition:none!important}}
  `;
  document.head.appendChild(style);

  // Replace a versão antiga da barra na HOME e desenhar a mesma navegação em cada página pública.
  document.querySelectorAll(".mobile-portal-nav").forEach(el=>el.remove());
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  // A tela de entrada (index.html) não deve exibir a barra inferior do portal.
  if (current === "index.html" || current === "") return;
  const currentPage = current;
  const bar = document.createElement("nav");
  bar.className = "mobile-portal-nav";
  bar.setAttribute("aria-label","Navegação principal");
  bar.innerHTML = pages.map(p => {
    const active = p.url !== "#menu" && p.url === currentPage;
    if (p.url === "#menu") return '<button type="button" class="mobile-nav-menu" aria-expanded="false" aria-label="Abrir menu completo"><span class="nav-icon">'+icons[p.icon]+'</span><span>Menu</span></button>';
    return '<a href="'+p.url+'" '+(active?'aria-current="page"':'')+'><span class="nav-icon">'+icons[p.icon]+'</span><span>'+p.label+'</span></a>';
  }).join("");
  document.body.appendChild(bar);

  const root = document.createElement("div");
  root.className = "sb-quick-menu";
  root.setAttribute("aria-hidden","true");
  root.innerHTML = '<div class="sb-quick-panel" role="dialog" aria-modal="true" aria-label="Menu completo do portal"><div class="sb-quick-title">Explore o portal oficial</div>' +
    allLinks.map(([label,url]) => '<a href="'+url+'">'+label+'</a>').join("") +
    '<button type="button" class="sb-quick-close">Fechar menu ×</button></div>';
  document.body.appendChild(root);
  const menuButton = bar.querySelector(".mobile-nav-menu");
  const closeButton = root.querySelector(".sb-quick-close");
  const openMenu = () => {root.classList.add("is-open");root.setAttribute("aria-hidden","false");menuButton.setAttribute("aria-expanded","true");document.body.style.overflow="hidden";closeButton.focus({preventScroll:true});};
  const closeMenu = () => {root.classList.remove("is-open");root.setAttribute("aria-hidden","true");menuButton.setAttribute("aria-expanded","false");document.body.style.overflow="";};
  menuButton.addEventListener("click",openMenu);
  closeButton.addEventListener("click",()=>{closeMenu();menuButton.focus({preventScroll:true});});
  root.addEventListener("click",e=>{if(e.target===root)closeMenu();});
  root.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&root.classList.contains("is-open")){closeMenu();menuButton.focus({preventScroll:true});}});
})();
