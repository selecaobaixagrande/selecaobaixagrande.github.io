(()=>{
  const ctx=()=>{
    if(!window.__clickAudioCtx) window.__clickAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    return window.__clickAudioCtx;
  };
  function clickSound(){
    try{
      const c=ctx();
      if(c.state==='suspended') c.resume();
      const o=c.createOscillator(),g=c.createGain();
      o.type='square';
      o.frequency.setValueAtTime(900,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(520,c.currentTime+.09);
      g.gain.setValueAtTime(.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.32,c.currentTime+.008);
      g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.16);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.17);
    }catch(e){}
  }
  let target=null,time=0;
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button,a,[role="button"],input[type="button"],input[type="submit"]');
    if(!b)return;
    target=b;time=Date.now();clickSound();
  },{capture:true});
  document.addEventListener('click',e=>{
    const b=e.target.closest('a[href]');
    if(!b||b.target==='_blank'||b.hasAttribute('download')||b.href.startsWith('javascript:'))return;
    if(target!==b)return;
    e.preventDefault();
    const wait=Math.max(220-(Date.now()-time),0);
    setTimeout(()=>{location.href=b.href},wait);
  },{capture:true});
})();