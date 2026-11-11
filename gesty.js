/* ---------- Symulacja dotyku myszką (prototyp oglądany na komputerze) ----------
   - kursor zawsze jako „rączka”, tekst się nie zaznacza,
   - przeciąganie myszką przewija listy, czat i karty jak palcem (z bezwładnością),
   - po przeciągnięciu nie „klika” elementu, na którym puszczono przycisk.
   Na prawdziwym ekranie dotykowym ten plik nic nie zmienia. */
(function(){
 if(matchMedia('(pointer:coarse)').matches)return;
 document.documentElement.classList.add('mysz');
 const PROG=6; // ile pikseli trzeba przesunąć, żeby to był gest, a nie kliknięcie
 const przewijalny=el=>{for(;el&&el!==document.documentElement;el=el.parentElement){const cs=getComputedStyle(el);
  if(/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+1)return {el,os:'y'};
  if(/(auto|scroll)/.test(cs.overflowX)&&el.scrollWidth>el.clientWidth+1)return {el,os:'x'}}return null};
 let g=null,przesuniete=false,raf=0;
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0)return;
  przesuniete=false;cancelAnimationFrame(raf);
  if(e.target.closest('input,textarea,[contenteditable]'))return;
  const p=przewijalny(e.target);
  g={p,x:e.clientX,y:e.clientY,start:p?(p.os==='y'?p.el.scrollTop:p.el.scrollLeft):0,v:0,last:p?(p.os==='y'?e.clientY:e.clientX):0,t:performance.now()};
 },true);
 document.addEventListener('pointermove',e=>{
  if(!g)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!przesuniete&&Math.hypot(dx,dy)>PROG)przesuniete=true;
  if(!przesuniete||!g.p)return;
  const pos=g.p.os==='y'?e.clientY:e.clientX,d=g.p.os==='y'?dy:dx;
  if(g.p.os==='y')g.p.el.scrollTop=g.start-d;else g.p.el.scrollLeft=g.start-d;
  const t=performance.now();g.v=(pos-g.last)/Math.max(1,t-g.t);g.last=pos;g.t=t;
 },true);
 document.addEventListener('pointerup',()=>{
  if(!g)return;const {p,v}=g;g=null;
  if(!przesuniete||!p)return;
  let s=-v*16;const krok=()=>{if(Math.abs(s)<.4)return;if(p.os==='y')p.el.scrollTop+=s;else p.el.scrollLeft+=s;s*=.94;raf=requestAnimationFrame(krok)};
  raf=requestAnimationFrame(krok);
 },true);
 document.addEventListener('click',e=>{if(przesuniete){e.stopPropagation();e.preventDefault();przesuniete=false}},true);
 document.addEventListener('dragstart',e=>e.preventDefault());
})();
