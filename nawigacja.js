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
 const ZAKLADKI=[['dok','Dokumenty','docs'],['uslugi','Usługi','grid'],['skan','Skanuj','scan'],['skrzynka','Twoje sprawy','mail'],['wiecej','Więcej','more']];

 /* elementy w DOM */
 const page=document.createElement('section');page.className='page';page.id='page';page.setAttribute('aria-live','polite');
 const nav=document.createElement('nav');nav.className='tabbar';nav.id='tabbar';nav.setAttribute('aria-label','Nawigacja');
 nav.innerHTML=ZAKLADKI.map(([k,l,i])=>`<button data-tab="${k}" class="${k==='skan'?'skan':''}">${k==='skan'?`<span class="kolo">${ico(i)}</span>`:ico(i)}<span>${l}</span></button>`).join('');
 app.append(page,nav);
 let TAB='dok';

 function listaH(items){return `<div class="plist">${items.map(([i,t,s,q])=>`<button class="prow" ${q?`data-q="${q.replace(/"/g,'&quot;')}"`:'data-soon="1"'}><span class="pic">${ico(i)}</span><span class="ptx"><b>${t}</b><small>${s}</small></span>${ico('chev','pch')}</button>`).join('')}</div>`}
 function stronaUslugi(){return `<h2 class="ph">Usługi</h2>${USLUGI.map(([g,items])=>`<div class="pgr">${g}</div>${listaH(items)}`).join('')}`}
 function stronaSkrzynka(){
  const t=(typeof OS!=='undefined'&&OS.tiles)||[];
  return `<h2 class="ph">Twoje sprawy</h2><div class="pgr">Wymaga działania · ${t.length}</div>
   <div class="plist">${t.map(x=>`<button class="prow" data-q="${(x.q||x.h).replace(/"/g,'&quot;')}"><span class="pic ${x.u?'pil':''}">${ico(x.i==='car'?'car':x.i==='coin'?'coin':'mail')}</span><span class="ptx"><b>${x.h}</b><small class="${/termin minął|po terminie/.test(x.d)?'zle':x.u?'pilne':''}">${x.d}</small><small>${x.s||''}</small></span>${ico('chev','pch')}</button>`).join('')}</div>`}
 function stronaWiecej(){
  return `<h2 class="ph">Więcej</h2>
   <div class="pprof"><span class="pav" style="background-image:url(assets/foto-${OS.id}.svg)"></span><span><b>${OS.imie} ${OS.nazwisko}</b><small>${OS.opis}</small></span></div>
   ${listaH(WIECEJ)}`}
 function rysuj(){
  nav.querySelectorAll('button').forEach(b=>{const on=b.dataset.tab===TAB;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  app.classList.toggle('nastronie',TAB!=='dok');
  if(TAB==='uslugi')page.innerHTML=stronaUslugi();
  if(TAB==='skrzynka')page.innerHTML=stronaSkrzynka();
  if(TAB==='wiecej')page.innerHTML=stronaWiecej();
  page.scrollTop=0;
 }
 window.ustawZakladke=function(k){
  if(k==='skan'){if(typeof qrFlow==='function')qrFlow({});return}
  if(app.classList.contains('chatting'))exitChat();
  if(typeof closeHist==='function')closeHist();
  TAB=k;rysuj();
 };
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)ustawZakladke(b.dataset.tab)});
 page.addEventListener('click',e=>{
  const r=e.target.closest('.prow');if(!r)return;
  if(r.dataset.q){TAB='dok';rysuj();startTopic(r.dataset.q);return}
  r.classList.add('soon');setTimeout(()=>r.classList.remove('soon'),1400);
 });
 /* pisanie lub mówienie do asystenta z innej strony → wracamy na ekran z rozmową */
 const wroc=()=>{if(TAB!=='dok'){TAB='dok';rysuj()}};
 $('#composer').addEventListener('submit',wroc,true);
 ['#mic','#cam'].forEach(s=>{const b=$(s);b&&b.addEventListener('click',wroc,true)});
 /* koperta w nagłówku otwiera „Twoje sprawy” */
 const mb=$('#mailBtn');if(mb)mb.onclick=()=>ustawZakladke('skrzynka');
 rysuj();
 if(typeof layout==='function')layout();
})();
