/* ---------- Ekrany spraw, usług i sekcji „Więcej” ----------
   Każda pozycja z list otwiera najpierw swój ekran (wjeżdża z prawej, wraca gestem w prawo).
   Na ekranie sprawy widać status, termin i jedną główną akcję; rozmowa z asystentem jest opcją, nie jedyną drogą.
   Treści zmieniasz w obiektach KROKI (usługi) i WIECEJ_EKRANY poniżej. */
(function(){
 const D=DANE,DAY=864e5;
 const sh=document.createElement('div');sh.className='sheet';sh.id='sprawa';sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');
 app.append(sh);
 if(window.gestZamkniecia)gestZamkniecia(sh,'x',()=>zamknij());
 const zamknij=()=>sh.classList.remove('on');
 const ZALATWIONE=window.ZALATWIONE=new Set();
 const top=()=>getComputedStyle($('.status')).display!=='none'?50:6;
 function pokaz(tytul,html,po){
  sh.innerHTML=`<div style="height:${top()}px;flex:none"></div><div class="nav"><button class="back" data-z>${svg('back')}Wróć</button><b>${tytul}</b><span></span></div><div class="body sp">${html}</div>`;
  sh.querySelector('[data-z]').onclick=zamknij;
  sh.classList.add('on');sh.querySelector('.body').scrollTop=0;
  po&&po(sh);
 }
 const toast=t=>{let e=$('#sptoast');if(!e){e=document.createElement('div');e.id='sptoast';e.className='sptoast';e.setAttribute('role','status');app.append(e)}
  e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2400)};
 const sukces=(box,tytul,wiersze=[])=>{box.innerHTML=`<div class="spok">${svg('check')}<b>${tytul}</b>${wiersze.length?`<div class="ui"><div class="rows">${rowsH(wiersze)}</div></div>`:''}</div>`};

 /* ---------- Twoje sprawy ---------- */
 function stan(t){
  const d=D.data(t.d),x=d?D.dni(d):null;
  if(ZALATWIONE.has(t.h))return {cls:'ok',txt:'Załatwione'};
  if(x===null)return /nowa/i.test(t.d)?{cls:'info',txt:'Nowa wiadomość'}:{cls:'info',txt:'Do sprawdzenia'};
  if(x<0)return {cls:'zle',txt:'Po terminie, '+D.ileDni(-x)};
  if(x<=7)return {cls:'pilne',txt:x===0?'Termin dziś':'Termin za '+D.ileDni(x)};
  return {cls:'info',txt:'Termin za '+D.ileDni(x)};
 }
 function akcja(t){
  const d=D.data(t.d),kw=((/([\d\s]+(?:,\d{2})?)\s*zł/.exec(t.d)||[])[1]||'').trim();
  if(t.k==='pay')return {label:`Zapłać ${kw} zł`,run:async box=>{await faceid();ZALATWIONE.add(t.h);sukces(box,'Zapłacone',[['Kwota',kw+' zł'],['Tytuł',t.h]])}};
  if(t.k==='renew')return {label:'Złóż wniosek o nowy dowód',run:async box=>{await faceid();ZALATWIONE.add(t.h);
   sukces(box,'Wniosek złożony',[['Teraz','odciski palców w urzędzie do '+D.krotko(new Date(Date.now()+30*DAY))],['Urząd',D.M.urzad],['Gotowy','do 30 dni od wizyty']])}};
  if(t.k==='todo')return {label:'Złóż wniosek',run:async box=>{await faceid();ZALATWIONE.add(t.h);sukces(box,'Wniosek złożony',[['Decyzja','do 3 dni roboczych']])}};
  if(t.k==='oc'&&d){const p=D.przypomnienie(d);
   if(p)return {label:'Przypomnij '+p,run:async box=>{sukces(box,'Przypomnienie ustawione',[['Kiedy',p+', 9:00']])}};}
  return null;
 }
 window.otworzSprawe=i=>{
  const t=(OS.tiles||[])[i];if(!t)return;
  const s=stan(t),a=ZALATWIONE.has(t.h)?null:akcja(t),d=D.data(t.d);
  const wiersze=[];if(d)wiersze.push(['Termin',d+(D.termin(d)?' ('+D.termin(d)+')':'')]);else wiersze.push(['Status',t.d]);
  pokaz('Sprawa',`
   <div class="sphero"><span class="spic">${svg(t.i==='car'?'car':t.i==='coin'?'coin':t.i==='id'?'id':t.i==='clock'?'clock':'mail')}</span>
    <h2>${t.h}</h2><span class="sppill ${s.cls}">${s.txt}</span></div>
   <div class="ui"><div class="rows">${rowsH(wiersze)}</div></div>
   <div class="sptxt">${t.s||''}</div>
   <div id="spakcja">${a?`<button class="spbtn" id="spgo">${a.label}</button>`:''}
    <button class="spbtn ghost" id="spask">${svg('dots')}Zapytaj asystenta</button></div>`,
   el=>{
    const box=el.querySelector('#spakcja');
    if(a)el.querySelector('#spgo').onclick=()=>a.run(box).then(()=>{const st=el.querySelector('.sppill');if(st){st.className='sppill ok';st.textContent='Załatwione'}if(window.odswiezStrone)odswiezStrone()});
    el.querySelector('#spask').onclick=()=>doCzatu(t.q||t.h);
   });
 };

 /* ---------- Usługi ---------- */
 const KROKI={
  'Zgubiony lub skradziony portfel':[['Zabezpieczymy dowód','zastrzeżenie w bankach i blokada na 14 dni'],['Sprawdzisz resztę','prawo jazdy, KDR, karty płatnicze'],['Gdy się znajdzie','odblokujesz jednym przyciskiem']],
  'Ważność dowodu':[['Sprawdzisz termin','i ustawisz przypomnienie'],['Złożysz wniosek','tutaj, ze zdjęciem z aparatu'],['Pójdziesz do urzędu','na odciski palców, w ciągu 30 dni']],
  'Zastrzeżenie PESEL':[['Zastrzeżesz PESEL','od razu, bez wizyty w urzędzie'],['Bank sprawdzi zastrzeżenie','przed każdym kredytem'],['Cofniesz w każdej chwili','także na kilka dni']],
  'Stłuczka bez druku':[['Sprawdzimy, czy ktoś jest ranny','przy rannych dzwonisz pod 112'],['Wymienicie się danymi','drugi kierowca skanuje Twój znak'],['Podpiszecie oświadczenie','i zgłosisz szkodę']],
  'Kupuję używane auto':[['Zrób zdjęcie dowodu rejestracyjnego','odczytam numer i VIN'],['Sprawdzimy historię','przebieg, szkody, OC, badania'],['Przygotujemy umowę','i PCC-3']],
  'Punkty karne':[['Zobaczysz punkty','i kiedy wygasną'],['Sprawdzisz limit','w okresie próbnym 20 pkt'],['Zapłacisz mandat','jeśli czeka']],
  'OC i badanie techniczne':[['Sprawdzisz terminy','OC i badania z CEPiK i UFG'],['Ustawisz przypomnienie','kilka dni wcześniej'],['Po terminie','pokażemy, co zrobić od razu']],
  'Narodziny dziecka':[['Podasz imię dziecka','reszta jest w rejestrach'],['Zgłosimy urodzenie','do USC, PESEL następnego dnia'],['Złożysz wnioski','800+ i Kartę Dużej Rodziny']],
  'Karta Dużej Rodziny':[['Pokażemy zniżki','pociągi, parki narodowe, partnerzy'],['Znajdziesz partnerów','w Twojej okolicy'],['Karta działa w telefonie','bez plastiku']],
  'Zapłać podatek lub opłatę':[['Wybierzesz należność','podatki, mandaty, składki'],['Zapłacisz BLIK-iem','potwierdzasz Face ID'],['Potwierdzenie','trafi do Twoich spraw']],
  'Pisma z urzędów':[['Przeczytasz pismo','w prostych słowach'],['Przygotujemy odpowiedź','z załącznikami z Twoich plików'],['Podpiszesz i wyślesz','przez e-Doręczenia']],
  'Podejrzany SMS lub e-mail':[['Wkleisz treść','albo zrzut ekranu'],['Sprawdzimy','na Liście Ostrzeżeń CERT Polska'],['Zgłosimy oszustwo','jednym przyciskiem']],
 };
 window.otworzUsluge=(nazwa,q)=>{
  const k=KROKI[nazwa]||[];
  pokaz('Usługa',`
   <div class="sphero"><h2>${nazwa}</h2></div>
   ${k.length?`<div class="sppgr">Jak to przebiega</div><ol class="spkroki">${k.map(([a,b])=>`<li><b>${a}</b><small>${b}</small></li>`).join('')}</ol>`:''}
   <div class="spnote">${svg('shield')}<span>Nic nie zostanie wysłane bez Twojego potwierdzenia.</span></div>
   <div id="spakcja"><button class="spbtn" id="spgo">Rozpocznij</button></div>`,
   el=>{el.querySelector('#spgo').onclick=()=>doCzatu(q||nazwa)});
 };

 /* ---------- Więcej ---------- */
 const przelacznik=(t,s,on)=>`<button class="prow sw" role="switch" aria-checked="${on}"><span class="ptx"><b>${t}</b>${s?`<small>${s}</small>`:''}</span><span class="spsw ${on?'on':''}"></span></button>`;
 const temu=n=>D.fmt(new Date(Date.now()-n*DAY));
 const WIECEJ_EKRANY={
  'Moje dane':()=>`<div class="ui"><div class="rows">${rowsH([...(D.doc('dowod')||{rows:[]}).rows.filter(([k])=>!/^Dowód/.test(k)),['Miejscowość',D.M.miasto],['Telefon','+48 ••• ••• 412'],['E-mail',OS.imie.toLowerCase()+'@poczta.pl']])}</div></div>
   <div class="sptxt">Dane pochodzą z rejestrów państwowych. Telefon i e-mail zmienisz tutaj, resztę w urzędzie.</div>`,
  'Bezpieczeństwo':()=>`<div class="plist">${przelacznik('Face ID','logowanie i potwierdzanie spraw',true)}${przelacznik('Kod PIN','gdy Face ID nie zadziała',true)}${przelacznik('Ukrywaj dane dowodu','na ekranie głównym, do dotknięcia oka',true)}</div>
   <div class="sppgr">Zaufane urządzenia</div><div class="plist"><div class="prow"><span class="ptx"><b>Ten telefon</b><small>aktywny teraz</small></span></div></div>`,
  'Kto sprawdzał moje dane':()=>{const L=[
    ['Sklep — weryfikacja wieku','tylko „ma ukończone 18 lat”',2,true],
    ['Bank — otwarcie konta','imię, nazwisko, PESEL, numer dowodu',5,true],
    ['Policja — kontrola drogowa','prawo jazdy, OC pojazdu',21,false],
    ['Apteka — e-recepta','PESEL',40,true]];
   return `<div class="sptxt" style="margin-top:0">Ostatnie 60 dni. Każde sprawdzenie Twoich danych jest tu zapisane.</div>
   <div class="plist">${L.map(([kto,co,n,zg])=>`<div class="prow spl"><span class="pic ${zg?'':'pil'}">${svg(zg?'check':'alert')}</span><span class="ptx"><b>${kto}</b><small>Zakres: ${co}</small><small>${temu(n)} · ${zg?'za Twoją zgodą':'z mocy prawa'}</small><button class="splink" data-zgl>Nie rozpoznaję</button></span></div>`).join('')}</div>`},
  'Powiadomienia':()=>`<div class="plist">${przelacznik('Terminy dokumentów','dowód, prawo jazdy, OC, badanie',true)}${przelacznik('Pisma z urzędów','nowe wiadomości w e-Doręczeniach',true)}${przelacznik('Płatności','podatki, mandaty, składki',true)}${przelacznik('Kto sprawdzał moje dane','przy każdym sprawdzeniu',false)}</div>`,
  'Pomoc':()=>`<div class="plist">${[['Jak potwierdzić swoje dane w sklepie?','Dotknij „Skanuj”, wybierz „Pokaż mój znak” i zakres, np. tylko pełnoletność.'],['Co zrobić, gdy zgubię telefon?','Zaloguj się na innym urządzeniu i wyloguj zgubiony telefon w „Bezpieczeństwo”.'],['Czy asystent coś wyśle beze mnie?','Nie. Każde wysłanie wymaga Twojego potwierdzenia Face ID.']].map(([q,a])=>`<details class="spfaq"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
   <div id="spakcja"><button class="spbtn ghost" id="spask">${svg('dots')}Zapytaj asystenta</button></div>`,
 };
 window.otworzWiecej=nazwa=>{
  const f=WIECEJ_EKRANY[nazwa];if(!f){komunikat(nazwa);return}
  pokaz(nazwa,f(),el=>{
   el.querySelectorAll('.prow.sw').forEach(b=>b.onclick=()=>{const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);b.querySelector('.spsw').classList.toggle('on',on)});
   el.querySelectorAll('[data-zgl]').forEach(b=>b.onclick=()=>{b.textContent='Zgłoszono';b.disabled=true;toast('Zgłoszenie wysłane. Odpowiemy w ciągu 7 dni.')});
   const ask=el.querySelector('#spask');if(ask)ask.onclick=()=>doCzatu('Potrzebuję pomocy z aplikacją');
  });
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape')zamknij()});
})();
