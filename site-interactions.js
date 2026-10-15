/* Navegação acessível e interações consistentes para páginas públicas */
(() => {
  const links = [
    ["Início","home.html"],["Central do portal","central.html"],["Notícias","noticias.html"],
    ["Jogos","jogos.html"],["Resultados","resultados.html"],["Categorias","categorias.html"],
    ["Elenco","elenco.html"],["Galeria","galeria.html"],["Conquistas","conquistas.html"],
    ["Estatísticas","estatisticas.html"],["Vídeos","videos.html"],["Parceiros","parceiros.html"]
  ];
  const style = document.createElement("style");
  style.textContent = `
    .sb-quick-menu{position:fixed;right:18px;bottom:18px;z-index:99999;font:600 14px/1.4 Inter,Arial,sans-serif}
    .sb-quick-toggle{display:flex;align-items:center;gap:10px;min-height:48px;padding:0 17px;border:1px solid #f04450;border-radius:14px;background:linear-gradient(135deg,#b5121b,#df2635);color:#fff;font-weight:800;box-shadow:0 12px 32px #0005,0 5px 18px #b5121b35;cursor:pointer;transition:transform .2s,box-shadow .2s}
    .sb-quick-toggle:hover{transform:translateY(-2px);box-shadow:0 16px 36px #0006,0 8px 24px #b5121b45}
    .sb-quick-panel{position:absolute;right:0;bottom:58px;width:min(285px,calc(100vw - 28px));padding:10px;border:1px solid #dce7f3;border-radius:16px;background:#fff;color:#12366d;box-shadow:0 24px 70px #0003;display:grid;gap:3px;opacity:0;visibility:hidden;transform:translateY(8px) scale(.98);transform-origin:bottom right;transition:opacity .18s,transform .18s,visibility .18s}
    .sb-quick-menu.is-open .sb-quick-panel{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
    .sb-quick-title{padding:9px 11px 12px;font-size:10px;letter-spacing:1.8px;color:#6b7f98;font-weight:900;text-transform:uppercase}
    .sb-quick-panel a{padding:10px 11px;border-radius:9px;text-decoration:none;color:#12366d;font-weight:700}
    .sb-quick-panel a:hover,.sb-quick-panel a:focus-visible{background:#eef4fb;color:#b5121b;outline:none}
    @media(max-width:480px){.sb-quick-menu{right:12px;bottom:12px}.sb-quick-toggle{min-height:46px}.sb-quick-panel{bottom:54px}}
    @media(prefers-reduced-motion:reduce){.sb-quick-toggle,.sb-quick-panel{transition:none}}
  `;
  document.head.appendChild(style);
  // Páginas que já possuem menu principal usam o controle existente.
  const hasExistingMenu = document.querySelector("#menuBtn, .menu-toggle, button.menu, #menu");
  if (hasExistingMenu) {
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        const nav = document.querySelector("#nav, .page-nav nav, header nav, .nav");
        const btn = document.querySelector("#menuBtn, .menu-toggle, button.menu");
        nav?.classList.remove("menu-open","open");
        if (btn) btn.setAttribute("aria-expanded","false");
      }
    });
    return;
  }
  const root = document.createElement("div");
  root.className = "sb-quick-menu";
  root.innerHTML = '<div class="sb-quick-panel" id="sbQuickPanel" aria-label="Menu do portal"><div class="sb-quick-title">Portal oficial</div>' +
    links.map(([label,url]) => '<a href="' + url + '">' + label + '</a>').join("") +
    '</div><button class="sb-quick-toggle" type="button" aria-expanded="false" aria-controls="sbQuickPanel"><span aria-hidden="true">☰</span><span>Menu do site</span></button>';
  document.body.appendChild(root);
  const btn = root.querySelector("button");
  const close = () => {root.classList.remove("is-open");btn.setAttribute("aria-expanded","false");};
  btn.addEventListener("click", () => {const open=root.classList.toggle("is-open");btn.setAttribute("aria-expanded",String(open));});
  root.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
  document.addEventListener("click",e=>{if(!root.contains(e.target))close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
})();
