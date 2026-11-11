/* ---------- Symulowana data pokazu ----------
   Dane osób (osoby.js) są przygotowane na dzień DZIEN_0 = 18.10.2026; na ekranie ten dzień zawsze odpowiada
   prawdziwemu „dziś” (przesunięcie dat na dole pliku).
   Parametr adresu ?dzien=N przesuwa „dziś” w aplikacji o N dni do przodu,
   żeby zobaczyć, jak zmieniają się terminy i ważność dokumentów.
   Ten plik ładuje się PRZED osoby.js (podmienia Date), a CZAS.przelicz()
   wywołujemy zaraz PO osoby.js (przelicza teksty z terminami). */
(function(){
 const RD=Date, DAY=864e5;
 const DZIEN_0=new RD(2026,9,18);
 let n=0;try{n=parseInt(new URLSearchParams(location.search).get('dzien')||'0',10)||0}catch(e){}
 n=Math.max(0,Math.min(1095,n));
 const mid=new RD();mid.setHours(0,0,0,0);
 const OFF=(DZIEN_0.getTime()+n*DAY)-mid.getTime();
 /* new Date() i Date.now() zwracają symulowaną datę (z bieżącą godziną) */
 class D extends RD{constructor(...a){a.length?super(...a):super(RD.now()+OFF)} static now(){return RD.now()+OFF}}
 window.Date=D;
 const today=new RD(DZIEN_0.getTime()+n*DAY);

 const dni=x=>x===1?'1 dzień':x+' dni';
 const cap=(s,up)=>up?s[0].toUpperCase()+s.slice(1):s;
 /* „29.10.2026” albo „29.10” (rok zgadujemy: lip–gru → 2026, sty–cze → 2027) */
 function parse(t){const m=/(\d{2})\.(\d{2})(?:\.(\d{4}))?/.exec(t);if(!m)return null;const mo=+m[2];const y=m[3]?+m[3]:(mo>=7?2026:2027);return new RD(y,mo-1,+m[1])}
 const left=dt=>Math.round((dt-today)/DAY);
 const DATE=/\d{2}\.\d{2}(?:\.\d{4})?(?![\d.])/;

 function rel(s){
  /* „za 11 dni” liczone od dnia 0 → przeliczone na symulowany dzień */
  s=s.replace(/\b([Zz])a (\d+) dni\b/g,(m,z,N)=>{const x=+N-n;const up=z==='Z';
   return x>1?cap('za '+x+' dni',up):x===1?cap('jutro',up):x===0?cap('dziś',up):cap(dni(-x)+' po terminie',up)});
  s=s.replace(/\b([Ww])ażny jeszcze (\d+) dni\b/g,(m,w,N)=>{const x=+N-n;return x>0?w+'ażny jeszcze '+dni(x):(w==='W'?'Nieważny':'nieważny')+' od '+dni(-x)});
  /* „ważny do 05.12.2026”, gdy data minęła */
  s=s.replace(new RegExp('([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+) do ('+DATE.source+')','g'),(m,w,dt)=>{
   const d=parse(dt);if(!d||left(d)>=0)return m;
   const W={'ważny':'nieważny od','ważna':'nieważna od','ważne':'nieważne od','Ważny':'Nieważny od','Ważna':'Nieważna od','Ważne':'Nieważne od','OC':'OC wygasło','badanie':'badanie wygasło','Badanie':'Badanie wygasło'};
   return W[w]?W[w]+' '+dt:w+': termin minął '+dt});
  return s;
 }
 const LBL=/ważn|^OC|^Badanie|wymiana/i;
 function walk(o){
  if(Array.isArray(o)){
   /* para [etykieta, data]: zapamiętaj stan, żeby karta i lista zaznaczyły datę kolorem (bez dopisku) */
   if(o.length===2&&typeof o[0]==='string'&&typeof o[1]==='string'&&LBL.test(o[0])){const d=parse(o[1]);if(d){const x=left(d);o.stan=x<0?'zle':x<=30?'blisko':''}}
   o.forEach((v,i)=>{if(typeof v==='string')o[i]=rel(v);else if(v&&typeof v==='object')walk(v)});return;
  }
  for(const k in o){const v=o[k];if(typeof v==='string'&&!/emerytal/.test(v))o[k]=rel(v);else if(v&&typeof v==='object')walk(v)}
 }
 /* stan dokumentu: najbliższa data ważności (OC, badanie, ważny do…) */
 function stan(d){
  let worst=null;
  [...(d.f||[]),...(d.rows||[])].forEach(([k,v])=>{
   if(typeof v!=='string'||!LBL.test(k))return;const dt=parse(v);if(!dt)return;
   const x=left(dt);if(!worst||x<worst.x)worst={x,k:k.replace(/ do$/,''),dt:v.match(DATE)[0]};
  });
  if(!worst||worst.x>30)return{cls:'ok'};
  const oc=/^OC/i.test(worst.k),bad=/^Badanie/i.test(worst.k);
  if(worst.x<0)return{cls:'bad',txt:oc?'Brak ważnego '+worst.k:bad?'Nieważne badanie techniczne':'Dokument nieważny od '+worst.dt,short:oc?'Brak OC':bad?'Brak badania':'Nieważny'};
  return{cls:'warn',txt:(oc?worst.k+' kończy się':bad?'Badanie techniczne':'Dokument traci ważność')+' '+(worst.x===0?'dziś':'za '+dni(worst.x)),short:(oc?'OC ':bad?'Badanie ':'Ważny ')+(worst.x===0?'dziś':'za '+dni(worst.x))};
 }
 function przelicz(){
  if(typeof OSOBY==='undefined')return;
  Object.values(OSOBY).forEach(os=>{
   (os.docs||[]).forEach(d=>{const s=stan(d);d.stan=s;if(s.cls!=='ok'&&(!d.alert||s.cls==='bad'))d.alert=s.short});
   walk(os);
  });
 }
 const ICO={warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 3 19.5h18z"/><path d="M12 10v4M12 17h.01"/></svg>'};
 function stanHTML(d,okHTML){const s=d.stan||{cls:'ok'};return s.cls==='ok'?okHTML:`<div class="valid ${s.cls}">${ICO.warn}${s.txt}</div>`}
 /* ---------- daty „na żywo”: wszystko, co widać na ekranie, przesuwamy tak, by dzień 0 = prawdziwe dziś ----------
    Logika liczy w osi czasu danych (od 18.10.2026), a tylko wyświetlane daty dostają przesunięcie PRZES dni.
    Dzięki temu dane, scenariusze rozmów i zegar są zawsze spójne, a jury widzi aktualne daty w dowolnym dniu. */
 const PRZES=Math.round((mid-DZIEN_0)/DAY);
 const dd=x=>String(x).padStart(2,'0');
 function przesunTekst(t){
  if(!PRZES||!/\d{2}\.\d{2}/.test(t)||/emerytal/i.test(t))return t;
  return t.replace(/(^|[^\d.,])(\d{2})\.(\d{2})(?:\.(\d{4}))?(?!\d|[.,]\d)/g,(m,pre,d,mo,y)=>{
   if(y&&+y<2025)return m;                                   // daty urodzenia itp. zostają
   const rok=y?+y:(+mo>=7?2026:2027);
   const nd=new RD(rok,+mo-1,+d+PRZES);
   return pre+dd(nd.getDate())+'.'+dd(nd.getMonth()+1)+(y?'.'+nd.getFullYear():'');
  });
 }
 const zrobione=new WeakMap();
 function obrob(node){
  if(node.nodeType===3){if(node.parentElement&&node.parentElement.closest('[data-stala]'))return;const t=node.data;if(zrobione.get(node)===t)return;const u=przesunTekst(t);if(u!==t)node.data=u;zrobione.set(node,node.data);return}
  if(node.nodeType===1&&!/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(node.nodeName)){const w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let x;while((x=w.nextNode()))obrob(x)}
 }
 if(PRZES){
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')obrob(m.target);else m.addedNodes.forEach(obrob)}})
   .observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  document.addEventListener('DOMContentLoaded',()=>obrob(document.body));
 }
 window.CZAS={dzien:n,today,DZIEN_0,przelicz,stanHTML,parse,PRZES,przesunTekst};
})();
