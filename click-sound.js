(()=>{'use strict';
let clickAudio;
function playClick(){try{if(!clickAudio)clickAudio=new Audio('mixkit-select-click-1109.wav');clickAudio.currentTime=0;clickAudio.volume=.72;const p=clickAudio.play();if(p)p.catch(()=>{})}catch(e){}}
function stopInfiniteLoading(){setTimeout(()=>document.querySelectorAll('.loading').forEach(el=>{if(/^Carregando/i.test(el.textContent.trim()))el.innerHTML='<div class="error-note">Nenhuma informação publicada no momento.</div>'}),7000)}
document.addEventListener('click',e=>{const target=e.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]');if(target)playClick()},{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stopInfiniteLoading);else stopInfiniteLoading();
})();
