(()=>{'use strict';
let clickAudio;
function playClick(){try{if(!clickAudio)clickAudio=new Audio('mixkit-select-click-1109.wav');clickAudio.currentTime=0;clickAudio.volume=.72;const p=clickAudio.play();if(p)p.catch(()=>{})}catch(e){}}
function stopInfiniteLoading(){setTimeout(()=>document.querySelectorAll('.loading').forEach(el=>{if(/^Carregando/i.test(el.textContent.trim()))el.innerHTML='<div class="error-note">Nenhuma informação publicada no momento.</div>'}),7000)}
function setupEntranceVideo(){
  const video=document.querySelector('video.video-fundo');
  if(!video)return;
  const fallback='https://raw.githubusercontent.com/selecaobaixagrande/selecaobaixagrande.github.io/main/lv_0_20260816145459.mp4';
  const useFallback=()=>{if(video.dataset.fallbackApplied==='1')return;video.dataset.fallbackApplied='1';video.src=fallback+'?v=20260906';video.load();const p=video.play();if(p)p.catch(()=>{})};
  video.addEventListener('error',useFallback,{once:true});
  video.addEventListener('loadedmetadata',()=>{const p=video.play();if(p)p.catch(()=>{})},{once:true});
  const p=video.play();if(p)p.catch(()=>{});
}
function setupHomeLatestGames(){
  if(!document.body.classList.contains('home'))return;
  const feature=document.querySelector('.result-feature');
  const section=feature?.closest('.home-section');
  if(!feature||!section||document.getElementById('latest-games-tabs'))return;
  const style=document.createElement('style');
  style.textContent=`
  #latest-games-tabs{margin:0 0 14px}
  .latest-games-tabs{display:flex;gap:8px;flex-wrap:wrap}
  .latest-games-tab{appearance:none;border:1px solid #30343a;background:#101214;color:#a8adb4;border-radius:9px;padding:11px 18px;font:900 9px/1 Inter,Arial,sans-serif;letter-spacing:1.4px;cursor:pointer;transition:.2s}
  .latest-games-tab:hover{border-color:#5a6068;color:#fff}
  .latest-games-tab.active{background:#b5121b;border-color:#ed2733;color:#fff;box-shadow:0 8px 24px rgba(181,18,27,.22)}
  .latest-games-panel{display:none}
  .latest-games-panel.active{display:block}
  .latest-game-list{display:grid;gap:12px}
  .latest-game-card{display:grid;grid-template-columns:92px 1fr 110px;align-items:center;gap:18px;padding:20px;border:1px solid #30343a;border-radius:18px;background:linear-gradient(125deg,#101214,#0d0e10);box-shadow:0 16px 40px rgba(0,0,0,.2)}
  .latest-game-date{text-align:center;border-right:1px solid #292d32;padding-right:18px}.latest-game-date strong{display:block;color:#fff;font:700 24px/1 Oswald,Arial,sans-serif}.latest-game-date small{display:block;margin-top:6px;color:#ff5962;font-size:8px;font-weight:900;letter-spacing:1.2px}
  .latest-game-main h3{margin:0;font:700 20px/1 Oswald,Arial,sans-serif}.latest-game-main p{margin:7px 0 0;color:#858b93;font-size:10px;line-height:1.5}.latest-game-main .latest-game-note{color:#cfd2d6;font-weight:700}
  .latest-game-score{text-align:center}.latest-game-score strong{display:block;font:700 30px/1 Oswald,Arial,sans-serif}.latest-game-score span{display:inline-block;margin-top:6px;color:#ff5962;font-size:8px;font-weight:900;letter-spacing:1.2px}
  @media(max-width:600px){.latest-games-tabs{display:grid;grid-template-columns:1fr 1fr}.latest-games-tab{width:100%}.latest-game-card{grid-template-columns:1fr;gap:12px}.latest-game-date{border-right:0;border-bottom:1px solid #292d32;padding:0 0 12px}.latest-game-score{text-align:left}}
  `;
  document.head.appendChild(style);
  const tabs=document.createElement('div');
  tabs.id='latest-games-tabs';
  tabs.className='latest-games-tabs';
  tabs.setAttribute('role','tablist');
  tabs.setAttribute('aria-label','Últimos jogos');
  tabs.innerHTML='<button type="button" class="latest-games-tab active" role="tab" aria-selected="true" data-gender="masculino">MASCULINO</button><button type="button" class="latest-games-tab" role="tab" aria-selected="false" data-gender="feminino">FEMININO</button>';
  section.querySelector('.section-head')?.insertAdjacentElement('afterend',tabs);
  const panels=document.createElement('div');
  panels.innerHTML=`
    <div class="latest-games-panel active" data-panel="masculino"><div class="latest-game-list">
      <article class="latest-game-card"><div class="latest-game-date"><strong>08 JUN</strong><small>2026</small></div><div class="latest-game-main"><h3>BAIXA GRANDE × ITABERABA</h3><p>Copa 2 de Julho — Sub-15</p></div><div class="latest-game-score"><strong>0 × 3</strong><span>ENCERRADO</span></div></article>
      <article class="latest-game-card"><div class="latest-game-date"><strong>07 JUN</strong><small>2026</small></div><div class="latest-game-main"><h3>BAIXA GRANDE × INSTITUTO FUTURO NA REDE</h3><p>Copa 2 de Julho — Sub-15</p><p class="latest-game-note">Vitória nos pênaltis por 4 × 3</p></div><div class="latest-game-score"><strong>1 × 1</strong><span>ENCERRADO</span></div></article>
      <article class="latest-game-card"><div class="latest-game-date"><strong>31 MAI</strong><small>2026</small></div><div class="latest-game-main"><h3>BAIXA GRANDE × MUNDO NOVO</h3><p>Copa 2 de Julho — Sub-15</p></div><div class="latest-game-score"><strong>2 × 1</strong><span>ENCERRADO</span></div></article>
      <article class="latest-game-card"><div class="latest-game-date"><strong>22 MAR</strong><small>2026</small></div><div class="latest-game-main"><h3>BAIXA GRANDE × SÃO JOSÉ DO JACUÍPE</h3><p>Copa Jacuípe — Sub-15</p></div><div class="latest-game-score"><strong>4 × 3</strong><span>ENCERRADO</span></div></article>
    </div></div>
    <div class="latest-games-panel" data-panel="feminino"><div class="latest-game-list">
      <article class="latest-game-card"><div class="latest-game-date"><strong>22 AGO</strong><small>2026</small></div><div class="latest-game-main"><h3>BAIXA GRANDE × MUNDO NOVO</h3><p>Copa Regional de Futsal Feminino 2026</p><p class="latest-game-note">Ginásio de Esportes — Mairi</p></div><div class="latest-game-score"><strong>0 × 2</strong><span>ENCERRADO</span></div></article>
    </div></div>`;
  feature.replaceWith(panels);
  tabs.querySelectorAll('.latest-games-tab').forEach(btn=>btn.addEventListener('click',()=>{
    const gender=btn.dataset.gender;
    tabs.querySelectorAll('.latest-games-tab').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});
    panels.querySelectorAll('.latest-games-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===gender));
  }));
}
document.addEventListener('click',e=>{const target=e.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]');if(target)playClick()},{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{stopInfiniteLoading();setupEntranceVideo();setupHomeLatestGames()});else{stopInfiniteLoading();setupEntranceVideo();setupHomeLatestGames()}
})();
