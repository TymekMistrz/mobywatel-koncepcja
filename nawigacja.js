/* ---------- Dolny pasek nawigacji i strony aplikacji ----------
   Zakładki: Dokumenty (ekran startowy ze stosem kart), Usługi, Skanuj, Twoje sprawy, Więcej.
   Pole „Co chcesz załatwić?” jest zawsze nad paskiem — rozmowa z asystentem działa z każdej strony.
   Treść stron (listy usług, menu „Więcej”) zmieniasz w tablicach poniżej. */

/* Usługi: [ikona, nazwa, opis, co wpisać do asystenta]. Frazy pasują do scenariuszy w scenarios.js */
const USLUGI=[
 ['Dokumenty',[
  ['shield','Zgubiony lub skradziony portfel','Zastrzeż dowód i zablokuj dokumenty','Zgubiłam portfel'],
  ['id','Ważność dowodu','Sprawdź termin i złóż wniosek o nowy','Kiedy mój dowód traci ważność?'],
  ['lock','Zastrzeżenie PESEL','Chroni przed kredytem na Twoje dane','Zastrzeż mój PESEL'],
 ]],
 ['Pojazdy',[
  ['car','Stłuczka bez druku','Oświadczenie sprawców w telefonie','Miałam stłuczkę'],
  ['search','Kupuję używane auto','Historia pojazdu, OC i umowa','Kupuję używane auto'],
  ['clock','Punkty karne','Ile masz punktów i kiedy znikną','Ile mam punktów karnych?'],
  ['doc','OC i badanie techniczne','Terminy i przypomnienia','Kiedy kończy się OC?'],
 ]],
 ['Rodzina',[
  ['baby','Narodziny dziecka','Akt urodzenia, PESEL i świadczenia','Urodziło nam się dziecko'],
  ['users','Karta Dużej Rodziny','Gdzie i z jakimi zniżkami','Gdzie mogę użyć Karty Dużej Rodziny?'],
 ]],
 ['Podatki i opłaty',[
  ['coin','Zapłać podatek lub opłatę','Podatek od nieruchomości, mandaty','Chcę zapłacić podatek od nieruchomości'],
  ['mail','Pisma z urzędów','Odczytaj i odpowiedz','Co jest w moim piśmie z urzędu?'],
 ]],
 ['Bezpieczeństwo',[
  ['alert','Podejrzany SMS lub e-mail','Sprawdzę i zgłoszę oszustwo','Dostałam dziwnego SMS-a'],
 ]],
];
/* Więcej: [ikona, nazwa, opis] — w prototypie tylko informacyjnie */
const WIECEJ=[
 ['user','Moje dane','Adres, kontakt, zgody'],
 ['lock','Bezpieczeństwo','PIN, biometria, zaufane urządzenia'],
 ['eye','Kto sprawdzał moje dane','Historia udostępnień'],
 ['bell','Powiadomienia','Terminy, pisma, przypomnienia'],
 ['help','Pomoc','Najczęstsze pytania i kontakt'],
];

(function(){
 const IK={
  docs:'<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M3.5 10h17"/>',
  grid:'<rect x="4.5" y="4.5" width="6" height="6" rx="1.8"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.8"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.8"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.8"/>',
  scan:'<path d="M4 9V7a3 3 0 0 1 3-3h2M15 4h2a3 3 0 0 1 3 3v2M20 15v2a3 3 0 0 1-3 3h-2M9 20H7a3 3 0 0 1-3-3v-2"/>',
  mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 8 7.5 5 7.5-5"/>',
  more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  shield:'<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  id:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M14 10h3.5M14 13.5h3.5"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  car:'<path d="M5 16.5V12l1.8-4.2A2 2 0 0 1 8.6 6.5h6.8a2 2 0 0 1 1.8 1.3L19 12v4.5"/><path d="M4 12h16v4.5H4z"/><circle cx="7.5" cy="14.3" r=".6"/><circle cx="16.5" cy="14.3" r=".6"/><path d="M6 16.5V19M18 16.5V19"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4.2l2.8 1.8"/>',
  doc:'<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>',
  baby:'<circle cx="12" cy="9" r="4.5"/><path d="M6.5 20c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/><path d="M10.5 9h.01M13.5 9h.01"/>',
  users:'<circle cx="9" cy="9" r="3.2"/><circle cx="16.5" cy="10" r="2.6"/><path d="M3.5 19c.7-3 2.8-4.6 5.5-4.6s4.8 1.6 5.5 4.6M14.5 14.6c2.6-.3 4.8 1.1 5.6 4.4"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M14.5 9.3c-.5-.8-1.4-1.3-2.5-1.3-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2c1.5.3 2.6.9 2.6 2.1s-1.1 2-2.6 2c-1.1 0-2.1-.5-2.6-1.3M12 6.5V8M12 16v1.5"/>',
  alert:'<path d="M12 4.5 3 19.5h18z"/><path d="M12 10v4M12 17h.01"/>',
  user:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  bell:'<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5zM10 20.5a2 2 0 0 0 4 0"/>',
  help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17h.01"/>',
  chev:'<path d="m9.5 6 6 6-6 6"/>',
 };
 const ico=(k,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IK[k]||''}</svg>`;
 const ZAKLADKI=[['dok','Dokumenty','docs'],['uslugi','Usługi','grid'],['skrzynka','Twoje sprawy','mail'],['wiecej','Więcej','more']];   /* skanowanie: przycisk „Skanuj” w nagłówku */

 /* elementy w DOM */
 const page=document.createElement('section');page.className='page';page.id='page';page.setAttribute('aria-live','polite');
 const nav=document.createElement('nav');nav.className='tabbar';nav.id='tabbar';nav.setAttribute('aria-label','Nawigacja');
 const sprawy=(typeof OS!=='undefined'&&OS.tiles&&OS.tiles.length)||0;
 nav.innerHTML=ZAKLADKI.map(([k,l,i])=>`<button data-tab="${k}" class="${k==='skan'?'skan':''}">${k==='skan'?`<span class="kolo">${ico(i)}</span>`:`<span class="ikona">${ico(i)}${k==='skrzynka'&&sprawy?'<i class="kropka" aria-hidden="true"></i>':''}</span>`}<span>${l}</span></button>`).join('');
 /* kropka przy „Twoje sprawy”, gdy coś czeka na działanie */
 if(sprawy){const b=nav.querySelector('[data-tab="skrzynka"]');b.setAttribute('aria-label',`Twoje sprawy, ${sprawy} wymaga działania`)}
 app.append(page,nav);
 let TAB='dok';

 function listaH(items){return `<div class="plist">${items.map(([i,t,s,q])=>`<button class="prow" ${q?`data-q="${q.replace(/"/g,'&quot;')}"`:'data-soon="1"'}><span class="pic">${ico(i)}</span><span class="ptx"><b>${t}</b></span>${ico('chev','pch')}</button>`).join('')}</div>`}   /* same nazwy, bez opisów pod spodem */
 function stronaUslugi(){return `${USLUGI.map(([g,items])=>`<div class="pgr">${g}</div>${listaH(items)}`).join('')}`}
 function stronaSkrzynka(){
  const t=(typeof OS!=='undefined'&&OS.tiles)||[];
  return `<div class="pgr">Wymaga działania · ${t.length}</div>
   <div class="plist">${t.map(x=>`<button class="prow" data-q="${(x.q||x.h).replace(/"/g,'&quot;')}"><span class="pic ${x.u?'pil':''}">${ico(x.i==='car'?'car':x.i==='coin'?'coin':'mail')}</span><span class="ptx"><b>${x.h}</b><small class="${/termin minął|po terminie/.test(x.d)?'zle':x.u?'pilne':''}">${x.d}</small><small>${x.s||''}</small></span>${ico('chev','pch')}</button>`).join('')}</div>`}
 function stronaWiecej(){
  return `
   <div class="pprof"><span class="pav" style="background-image:url(assets/foto-${OS.id}.svg)"></span><span><b>${OS.imie} ${OS.nazwisko}</b><small>${OS.opis.split(',').slice(0,2).join(',')}</small></span></div>
   ${listaH(WIECEJ)}`}
 /* pasek: przesuwający się wskaźnik pod aktywną ikoną i krótki „podskok” ikony */
 const wsk=document.createElement('span');wsk.className='wsk';nav.prepend(wsk);
 function zaznacz(k){
  nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.tab===k;const by=b.classList.contains('on');b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');
   if(on&&!by&&!SPOKOJ){const ic=b.querySelector('svg');ic&&ic.animate([{transform:'scale(1)'},{transform:'scale(.82)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'})}});
  const b=nav.querySelector(`[data-tab="${k}"]`);if(!b)return;
  const x=b.offsetLeft+b.offsetWidth/2-28;wsk.style.transform=`translateX(${x}px)`;wsk.style.opacity=1;
 }
 function rysuj(){
  zaznacz(TAB);
  /* tytuł u góry: „mObywatel” na ekranie z dokumentami, na pozostałych nazwa strony */
  const t=$('#title');if(t)t.textContent=TAB==='dok'?'mObywatel':(ZAKLADKI.find(z=>z[0]===TAB)||[,''])[1];
  app.classList.toggle('nastronie',TAB!=='dok');
  if(TAB==='uslugi')page.innerHTML=stronaUslugi();
  if(TAB==='skrzynka')page.innerHTML=stronaSkrzynka();
  if(TAB==='wiecej')page.innerHTML=stronaWiecej();
  page.scrollTop=0;
 }
 /* ---------- animacje przejść między stronami ---------- */
 const SPOKOJ=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const KOLEJ=['dok','uslugi','skrzynka','wiecej'];
 const EASE='cubic-bezier(.22,.8,.24,1)';
 const widokDok=()=>[$('#stackwrap'),$('#reminders')].filter(Boolean);
 function wyjedz(els,dir){return Promise.all(els.map(el=>{const od=el.style.transform||'translateX(0)',op=el.style.opacity||1;el.style.transform='';el.style.opacity='';
  return el.animate([{opacity:op,transform:od},{opacity:0,transform:`translateX(${-dir*Math.max(28,Math.abs(parseFloat(od.replace(/[^-\d.]/g,''))||0)+20)}px)`}],{duration:150,easing:'ease-in',fill:'forwards'}).finished}))}
 function wjedz(els,dir){els.forEach(el=>{el.getAnimations().forEach(a=>a.cancel());el.animate([{opacity:0,transform:`translateX(${dir*36}px)`},{opacity:1,transform:'translateX(0)'}],{duration:320,easing:EASE})})}
 let trwa=false;
 window.ustawZakladke=async function(k){
  if(k==='skan'){if(typeof qrFlow==='function')qrFlow({});return}
  if(app.classList.contains('chatting'))exitChat();
  if(typeof closeHist==='function')closeHist();
  if(k===TAB||trwa){TAB=k;rysuj();return}
  const dir=Math.sign(KOLEJ.indexOf(k)-KOLEJ.indexOf(TAB))||1;
  if(SPOKOJ){TAB=k;rysuj();return}
  trwa=true;
  const stare=[...(TAB==='dok'?widokDok():[page]),$('#title')];
  zaznacz(k);                                   // pasek reaguje od razu
  await wyjedz(stare,dir);
  stare.forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
  TAB=k;rysuj();
  wjedz([...(TAB==='dok'?widokDok():[page]),$('#title')],dir);
  trwa=false;
 };
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)ustawZakladke(b.dataset.tab)});
 page.addEventListener('click',e=>{
  const r=e.target.closest('.prow');if(!r)return;
  if(r.dataset.q){TAB='dok';rysuj();startTopic(r.dataset.q);return}
  komunikat((r.querySelector('.ptx b')||{}).textContent||'Ta funkcja');
 });
 /* okienko „funkcja niedostępna w prototypie” (dla pozycji, których jeszcze nie zaprojektowano) */
 const modal=document.createElement('div');modal.className='alertm';modal.setAttribute('aria-hidden','true');
 modal.innerHTML=`<div class="alertm-box" role="alertdialog" aria-modal="true" aria-labelledby="alertmT" aria-describedby="alertmO">
   <b id="alertmT">Funkcja niedostępna w prototypie</b>
   <p id="alertmO"></p>
   <button type="button">OK</button></div>`;
 app.append(modal);
 const zamknijM=()=>{modal.classList.remove('on');modal.setAttribute('aria-hidden','true')};
 modal.querySelector('button').onclick=zamknijM;
 modal.addEventListener('click',e=>{if(e.target===modal)zamknijM()});
 window.komunikat=function(nazwa){
  modal.querySelector('#alertmO').textContent=`Sekcja „${nazwa}” jest częścią docelowej koncepcji, ale w tej wersji prototypu nie zaprojektowano jeszcze dalszego przebiegu procesu. Pozostałe sprawy możesz sprawdzić w zakładce Usługi lub zapytać asystenta.`;
  modal.classList.add('on');modal.setAttribute('aria-hidden','false');setTimeout(()=>modal.querySelector('button').focus(),50);
 };
 /* pisanie lub mówienie do asystenta z innej strony → wracamy na ekran z rozmową */
 const wroc=()=>{if(TAB!=='dok'){TAB='dok';rysuj()}};
 $('#composer').addEventListener('submit',wroc,true);
 ['#mic','#cam'].forEach(s=>{const b=$(s);b&&b.addEventListener('click',wroc,true)});
 /* nagłówek: wyraźny przycisk „Skanuj” zamiast samej ikony */
 const qb=$('#qrBtn');if(qb){qb.classList.add('skanuj');qb.setAttribute('aria-label','Skanuj kod, aby potwierdzić swoje dane');
  qb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5V7a3 3 0 0 1 3-3h1.5M15.5 4H17a3 3 0 0 1 3 3v1.5M20 15.5V17a3 3 0 0 1-3 3h-1.5M8.5 20H7a3 3 0 0 1-3-3v-1.5"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.5"/></svg><span>Skanuj</span>'}
 /* koperta w nagłówku zbędna — sprawy są w pasku (z kropką) */
 const mb=$('#mailBtn');if(mb)mb.remove();
 /* ---------- gest przesunięcia w lewo / w prawo: następna / poprzednia zakładka (bez „Skanuj”) ----------
    Podczas przeciągania obok widać już sąsiednią stronę (podgląd), która wjeżdża razem z palcem. */
 {
  const strefa=e=>e.target.closest&&e.target.closest('#page,#stackwrap,#reminders');
  const zajete=()=>app.classList.contains('chatting')||app.classList.contains('todo')||($('#detail')&&$('#detail').classList.contains('on'))||($('#qrx')&&$('#qrx').classList.contains('on'))||trwa;
  const biezace=()=>TAB==='dok'?widokDok():[page];
  const tresc=k=>k==='uslugi'?stronaUslugi():k==='skrzynka'?stronaSkrzynka():stronaWiecej();
  function zrobPodglad(k){
   let el;
   if(k==='dok'){el=document.createElement('div');el.className='podglad podglad-dok';
    widokDok().forEach(x=>{const c=x.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.style.transform='';c.style.opacity='';el.append(c)})}
   else{el=document.createElement('section');el.className='page podglad';el.innerHTML=tresc(k)}
   el.setAttribute('aria-hidden','true');app.insertBefore(el,nav);return el;
  }
  const przesun=(el,x)=>{el.style.transform=`translateX(${x}px)`};
  const jedz=(el,do_)=>el.animate([{transform:el.style.transform||'translateX(0)'},{transform:`translateX(${do_}px)`}],{duration:260,easing:EASE,fill:'forwards'}).finished;
  const sprzataj=els=>els.forEach(el=>{el.getAnimations().forEach(a=>a.cancel());el.style.transform='';el.style.opacity=''});
  let g=null;
  app.addEventListener('pointerdown',e=>{if(!strefa(e)||zajete()||(e.pointerType==='mouse'&&e.button!==0))return;g={x:e.clientX,y:e.clientY,t:performance.now(),poziom:null,cel:undefined,pg:null,lx:e.clientX,lt:performance.now(),v:0}},true);
  app.addEventListener('pointermove',e=>{
   if(!g)return;if(e.pointerType==='mouse'&&e.buttons===0){koniec(e);return}   // przycisk puszczony poza ekranem telefonu
   const dx=e.clientX-g.x,dy=e.clientY-g.y;
   {const n=performance.now();if(n-g.lt>0){g.v=.6*g.v+.4*((e.clientX-g.lx)/(n-g.lt))}g.lx=e.clientX;g.lt=n}
   if(g.poziom===null&&Math.hypot(dx,dy)>10){g.poziom=Math.abs(dx)>Math.abs(dy)*1.3;if(g.poziom)try{app.setPointerCapture(e.pointerId)}catch(_){}}
   if(!g.poziom)return;
   const i=KOLEJ.indexOf(TAB),k=dx<0?KOLEJ[i+1]:KOLEJ[i-1],W=app.clientWidth;
   if(g.cel!==k){if(g.pg){g.pg.remove();g.pg=null}g.cel=k;if(k)g.pg=zrobPodglad(k)}
   if(!k){biezace().forEach(el=>przesun(el,dx*.18));return}      // skrajna zakładka: lekki opór
   biezace().forEach(el=>przesun(el,dx));
   przesun(g.pg,dx+(dx<0?W:-W));
   const t=$('#title');if(t)t.style.opacity=String(Math.max(0,1-Math.abs(dx)/(W*.45)));
  },true);
  async function koniec(e){
   if(!g)return;const {x,t,poziom,cel,pg,v:vk,lt}=g;g=null;try{app.releasePointerCapture(e.pointerId)}catch(_){}if(!poziom){if(pg)pg.remove();return}
   const dx=(e.clientX??x)-x,v=Math.abs(dx)/Math.max(1,performance.now()-t),W=app.clientWidth,tyt=$('#title');
   const stare=biezace();
   /* decyzja jak na telefonie: gdzie strona „dojechałaby” rozpędem (pozycja + prędkość przy puszczeniu).
      Za mały lub zawrócony ruch → strona wraca; przejście tylko, gdy rzut mija połowę ekranu w tę samą stronę. */
   const vp=performance.now()-lt>90?0:vk,rzut=dx+vp*200;
   if(cel&&pg&&Math.abs(dx)>24&&Math.sign(rzut)===Math.sign(dx)&&Math.abs(rzut)>W*.5){
    trwa=true;zaznacz(cel);const s=dx<0?-1:1;
    await Promise.all([...stare.map(el=>jedz(el,s*W)),jedz(pg,0)]);
    TAB=cel;rysuj();                                  // prawdziwa strona dokładnie w miejscu podglądu
    sprzataj([...stare,...biezace()]);pg.remove();
    if(tyt){tyt.style.opacity='';tyt.animate([{opacity:0},{opacity:1}],{duration:200})}
    trwa=false;return;
   }
   /* za krótko: wszystko wraca na miejsce */
   await Promise.all([...stare.map(el=>jedz(el,0)),...(pg?[jedz(pg,dx<0?W:-W)]:[])]);
   sprzataj(stare);if(pg)pg.remove();if(tyt)tyt.style.opacity='';
  }
  app.addEventListener('lostpointercapture',e=>{if(g&&g.poziom)koniec(e)});
  app.addEventListener('pointerup',koniec,true);app.addEventListener('pointercancel',koniec,true);
 }
 /* ---------- gest powrotu: szczegóły dokumentu przeciągnij w prawo, skaner przeciągnij w dół ---------- */
 function gestZamkniecia(el,os,zamknij){
  let g=null;
  el.style.touchAction=os==='x'?'pan-y':'pan-x';
  el.addEventListener('pointerdown',e=>{if(!el.classList.contains('on')||(e.pointerType==='mouse'&&e.button!==0)||e.target.closest('input,textarea'))return;g={x:e.clientX,y:e.clientY,t:performance.now(),moje:null,lp:os==='x'?e.clientX:e.clientY,lt:performance.now(),v:0}});
  el.addEventListener('pointermove',e=>{
   if(!g)return;if(e.pointerType==='mouse'&&e.buttons===0){koniec(e);return}
   const dx=e.clientX-g.x,dy=e.clientY-g.y,d=os==='x'?dx:dy,inny=os==='x'?dy:dx;
   {const n=performance.now(),p=os==='x'?e.clientX:e.clientY;if(n-g.lt>0)g.v=.6*g.v+.4*((p-g.lp)/(n-g.lt));g.lp=p;g.lt=n}
   if(g.moje===null&&Math.hypot(dx,dy)>10){g.moje=d>0&&Math.abs(d)>Math.abs(inny)*1.3;if(g.moje)try{el.setPointerCapture(e.pointerId)}catch(_){}}
   if(!g.moje)return;
   el.style.transition='none';el.style.transform=os==='x'?`translateX(${Math.max(0,d)}px)`:`translateY(${Math.max(0,d)}px)`;
   if(os==='x')widokDok().concat([$('#top'),$('#title'),$('#composer')].filter(Boolean)).forEach(x=>{x.style.transition='none';x.style.transform=`translateX(${-22+22*Math.min(1,Math.max(0,d)/el.offsetWidth)}%)`});
  });
  function koniec(e){
   if(!g)return;const {x,y,t,moje,v:vk,lt}=g;g=null;try{el.releasePointerCapture(e.pointerId)}catch(_){}if(!moje)return;
   const d=os==='x'?(e.clientX??x)-x:(e.clientY??y)-y,v=d/Math.max(1,performance.now()-t),dl=os==='x'?el.offsetWidth:el.offsetHeight;
   const vp=performance.now()-lt>90?0:vk,rzut=d+vp*200;
   const zamyka=d>24&&rzut>dl*.5;          // zamyka tylko, gdy ruch „dojechałby” za połowę ekranu
   el.style.transition='';void el.offsetWidth;el.style.transform='';
   if(os==='x')widokDok().concat([$('#top'),$('#title'),$('#composer')].filter(Boolean)).forEach(x=>{x.style.transition='';x.style.transform=''});
   if(zamyka)zamknij();
  }
  el.addEventListener('pointerup',koniec);el.addEventListener('pointercancel',koniec);
 }
 {const det=$('#detail');if(det)gestZamkniecia(det,'x',()=>det.classList.remove('on'))}
 /* skaner tworzy się przy pierwszym otwarciu — gest podpinamy, gdy się pojawi */
 new MutationObserver(()=>{const q=$('#qrx');if(q&&!q.dataset.gest){q.dataset.gest=1;gestZamkniecia(q,'y',()=>{if(typeof pFinish==='function')pFinish({ok:false})})}}).observe(app,{childList:true});
 /* ---------- przełączniki segmentowe (np. Tożsamość / Pełnoletność / Prawo jazdy): przesuwające się tło ---------- */
 function segAnim(seg){
  if(seg.dataset.anim)return;seg.dataset.anim=1;seg.classList.add('anim');
  const w=document.createElement('span');w.className='seg-wsk';w.setAttribute('aria-hidden','true');seg.prepend(w);
  const ustaw=plynnie=>{const b=seg.querySelector('button.on');if(!b)return;
   w.style.transition=plynnie&&!SPOKOJ?'':'none';w.style.width=b.offsetWidth+'px';w.style.height=b.offsetHeight+'px';w.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`};
  requestAnimationFrame(()=>ustaw(false));
  seg.addEventListener('click',()=>requestAnimationFrame(()=>ustaw(true)));
 }
 const szukajSeg=()=>app.querySelectorAll('.seg:not([data-anim])').forEach(segAnim);
 new MutationObserver(szukajSeg).observe(app,{childList:true,subtree:true});szukajSeg();
 /* logo (flaga) w nagłówku: płynny powrót do ekranu z dokumentami, bez przeładowania strony */
 const hb=$('#homeBtn');if(hb)hb.onclick=()=>{
  const det=$('#detail');if(det)det.classList.remove('on');
  if(typeof pFinish==='function')try{pFinish({ok:false})}catch(e){}
  if(typeof closeTodo==='function')try{closeTodo()}catch(e){}
  if(app.classList.contains('chatting'))exitChat();
  if(TAB!=='dok'){ustawZakladke('dok');return}
  /* już na ekranie głównym: dowód wraca na wierzch, karty lekko się „układają” */
  if(typeof SEL!=='undefined'&&typeof STACK_ORDER!=='undefined'){SEL=STACK_ORDER.length-1;layout()}
  const sw=$('#stackwrap');if(sw&&!SPOKOJ)sw.animate([{transform:'translateY(0)'},{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:320,easing:'ease-out'});
 };
 rysuj();
 if(typeof layout==='function')layout();
})();
