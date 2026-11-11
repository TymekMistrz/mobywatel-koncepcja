/* ---------- Asystent: odpowiedzi dopasowane do wybranej osoby i do daty w aplikacji ----------
   Ten plik nadpisuje część scenariuszy z scenarios.js. Dane bierze z osoby (osoby.js) przez DANE (dane.js),
   a terminy liczy względem „dziś” w aplikacji, więc po przesunięciu daty w panelu odpowiedzi nadal się zgadzają. */
(function(){
 let ostatnie='';
 const D=DANE;
 const kiedy=s=>{const t=D.termin(s);return t?` (${t})`:''};
 const poTerminie=s=>{const x=D.dni(s);return x!==null&&x<0};
 const przypomnijChips=(s,co)=>{const p=D.przypomnienie(s);
  if(!p)return chips([{label:'Rozumiem'}]);
  chips([{label:'Przypomnij '+p,go:()=>result({title:'Przypomnienie ustawione',rows:[['Kiedy',p+', 9:00'],['O czym',co]]})},{label:'Nie trzeba'}]);};

 /* ważność dowodu */
 S.dowodWaz=async()=>{
  const d=D.dowodDo(),x=D.dni(d);
  if(x<0){
   await say(`Twój dowód stracił ważność <b>${d}</b>, czyli ${D.ileDni(-x)} temu. Nie możesz się nim teraz posługiwać. Wniosek o nowy złożysz tutaj, potem w ciągu 30 dni odciski palców w urzędzie.`);
   chips([{label:'Złóż wniosek o nowy dowód',go:()=>S.renew('waznosc')},{label:'Później'}]);return;
  }
  if(x<=90){
   await say(`Twój dowód jest ważny do <b>${d}</b>, czyli jeszcze ${D.ileDni(x)}. Na nowy dowód czeka się do 30 dni, więc wniosek najlepiej złożyć teraz.`);
   chips([{label:'Złóż wniosek o nowy dowód',go:()=>S.renew('waznosc')},{label:'Przypomnij za tydzień',go:()=>result({title:'Przypomnienie ustawione',rows:[['Kiedy',D.krotko(new Date(Date.now()+7*864e5))+', 9:00'],['O czym','wniosek o nowy dowód']]})}]);return;
  }
  const p=new Date(CZAS.parse(d)-90*864e5);
  await say(`Twój dowód jest ważny do <b>${d}</b>. Na nowy wniosek masz jeszcze czas, przypomnę Ci o nim 3 miesiące wcześniej.`);
  chips([{label:'Przypomnij '+D.fmt(p),go:()=>result({title:'Przypomnienie ustawione',rows:[['Kiedy',D.fmt(p)+', 9:00']]})},{label:'Nie trzeba'}]);
 };

 /* OC i badanie techniczne */
 function sprawaAuta(rodzaj){
  const t=(OS.tiles||[]).find(t=>t.k==='oc'&&(rodzaj==='badanie'?/badanie/i:/\bOC\b/).test(t.h));
  const a=D.auto();
  if(t)return {tytul:t.h,data:D.data(t.d),opis:t.s};
  if(!a)return null;
  return rodzaj==='badanie'?{tytul:'Badanie techniczne',data:a.badanieDo,opis:a.opis+', '+a.nr}
                           :{tytul:'OC pojazdu',data:a.ocDo,opis:a.opis+', '+a.nr+', '+a.ubezp};
 }
 async function oAucie(rodzaj){
  const s=sprawaAuta(rodzaj);
  if(!s){await say('Nie masz zarejestrowanego pojazdu.');return}
  const oc=rodzaj==='oc',po=poTerminie(s.data);
  await info({icon:'car',title:s.tytul,source:oc?'UFG, CEPiK':'CEPiK',rows:[[oc?'Koniec okresu':'Ważne do',s.data+kiedy(s.data)],['Szczegóły',s.opis]],
   tone:po?'warn':'',note:po?(oc?'Brak ważnego OC. Nie jedź tym autem, dopóki nie kupisz polisy — UFG nalicza wysoką karę za każdy dzień bez OC.':'Badanie straciło ważność. Bez ważnego badania policja może zatrzymać dowód rejestracyjny.')
     :(oc?'Umowa OC zwykle przedłuża się sama na kolejny rok, jeśli jej nie wypowiesz. Sprawdź to u ubezpieczyciela.':'Badanie zrobisz w dowolnej stacji kontroli pojazdów, wynik trafi do CEPiK automatycznie.')});
  if(po){await say(oc?'Pokazać oferty OC dla tego auta?':'Pokazać najbliższe stacje kontroli pojazdów?');chips([{label:oc?'Pokaż oferty':'Pokaż stacje',go:()=>say('W pełnej wersji pokażę tu listę z mapą. W prototypie ten krok jest pominięty.')},{label:'Nie teraz'}]);return}
  await say('Przypomnieć Ci kilka dni przed terminem?');
  przypomnijChips(s.data,s.tytul);
 }
 S.oc=()=>oAucie('oc');
 S.badanie=()=>oAucie('badanie');

 /* płatności */
 S.pay=async()=>{
  const q=norm(ostatnie),lista=D.sprawy('pay');
  const t=lista.find(t=>/zus|skladk/.test(q)&&/ZUS/i.test(t.h))||lista.find(t=>/mandat/.test(q)&&/mandat/i.test(t.h))||lista.find(t=>/podat/.test(q)&&/podatek/i.test(t.h))||lista[0];
  if(!t){await say('Nie masz teraz nic do zapłacenia.');return}
  const kw=(/([\d\s]+(?:,\d{2})?)\s*zł/.exec(t.d)||[])[1]||'',data=D.data(t.d);
  if(poTerminie(data))await say(`Termin minął ${D.ileDni(-D.dni(data))} temu, dlatego mogą doliczyć odsetki. Zapłać jak najszybciej.`);
  await confirmCard({icon:'coin',title:t.h,source:'ePłatności',rows:[['Za',t.s],['Kwota',kw.trim()+' zł'],['Termin',data+kiedy(data)],['Płatność','BLIK']],label:`Zapłać ${kw.trim()} zł`,
   then:()=>result({title:'Zapłacone',source:'Potwierdzenie w Twoich sprawach',rows:[['Kwota',kw.trim()+' zł'],['Tytuł',t.h]]})});
 };

 /* punkty karne */
 S.punkty=async()=>{
  const p=+(D.pole('pj',/^Punkty karne/)||0),lim=D.pole('pj',/^Limit punktów/),probny=D.pole('pj',/^Okres próbny/);
  if(!D.doc('pj')){await say('Nie masz prawa jazdy w aplikacji.');return}
  if(!p){await info({icon:'clock',title:'Punkty karne: 0',source:'CEPiK',rows:[['Limit','24 pkt']],note:'Nie masz punktów karnych.'});return}
  const rows=[['Punkty',String(p)]];if(lim)rows.push(['Limit',lim]);else rows.push(['Limit','24 pkt']);if(probny)rows.push(['Okres próbny','do '+probny.replace(/^do /,'')]);
  await info({icon:'clock',title:'Punkty karne: '+p,source:'CEPiK',rows,note:'Punkty wygasają po roku od opłacenia mandatu.'+(probny?' W okresie próbnym przekroczenie limitu oznacza cofnięcie uprawnień.':'')});
  const m=D.sprawy('pay').find(t=>/mandat/i.test(t.h));
  if(m){await say('Masz też mandat do zapłaty. Zapłacić teraz?');chips([{label:'Zapłać mandat',go:()=>{ostatnie='mandat';S.pay()}},{label:'Później'}])}
 };

 /* lista spraw */
 S.todo=async()=>{
  const ts=OS.tiles||[];
  if(!ts.length){await say('Nie masz teraz nic do załatwienia.');return}
  await say('Oto, co czeka na Ciebie:');
  const c=await card(`<div class="ui list">${hd('bell','Do załatwienia')}${ts.map((t,i)=>`<button class="it" data-i="${i}"><span class="pip"></span><span class="x"><b>${t.h}</b><small>${t.d}</small></span><span class="go">Otwórz</span></button>`).join('')}${srcH('Twoje sprawy')}</div>`);
  c.querySelectorAll('.it').forEach(b=>b.onclick=()=>act(()=>{const t=ts[+b.dataset.i];addUser(t.q||t.h);route(t.q||t.h)}));
 };

 /* pisma z urzędów, różne dla każdej osoby */
 const listMarta=S.letter;
 S.letter=async()=>{
  const t=D.sprawa('letter');
  if(OS.id==='marta')return listMarta();
  if(OS.id==='jan'){
   const d=D.data(t.d);
   await info({icon:'mail',title:'Czynności sprawdzające VAT',source:'e-Doręczenia, US Kraków-Podgórze',body:'Urząd prosi o faktury zakupowe powyżej 15 000 zł z deklaracji JPK_V7M za sierpień 2026, żeby potwierdzić odliczony VAT.',rows:[['Odpowiedź do',d+kiedy(d)]]});
   await say('W KSeF są 2 takie faktury z sierpnia. Przygotować odpowiedź z załącznikami?');
   chips([{label:'Przygotuj odpowiedź',go:()=>confirmCard({icon:'mail',title:'Odpowiedź przez e-Doręczenia',source:'Do: US Kraków-Podgórze',rows:[['Załączniki','2 faktury z KSeF (PDF)'],['Podpis','podpis zaufany']],label:'Podpisz i wyślij',then:()=>result({title:'Odpowiedź doręczona',source:'e-Doręczenia',rows:[['Status','doręczona do urzędu'],['Potwierdzenie','w Twoich sprawach']]})})},{label:'Później'}]);return;
  }
  if(OS.id==='ewa'){
   await info({icon:'mail',title:'Informacja z ZUS o emeryturze',source:'ZUS, PUE',rows:[['Wiek emerytalny','<span data-stala>03.02.2029</span>'],['Wniosek możesz złożyć','<span data-stala>od 04.01.2029</span>'],['Prognoza','ok. 3 400 zł brutto miesięcznie']],note:'Prognoza zakłada, że pracujesz do wieku emerytalnego z obecnym wynagrodzeniem.'});
   await say('Przypomnieć Ci, kiedy będzie można złożyć wniosek?');
   chips([{label:'<span data-stala>Przypomnij 04.01.2029</span>',say:'Przypomnij 4 stycznia 2029',go:()=>result({title:'Przypomnienie ustawione',rows:[['Kiedy','<span data-stala>04.01.2029, 9:00</span>'],['O czym','wniosek o emeryturę']]})},{label:'Nie trzeba'}]);return;
  }
  if(OS.id==='kacper'){
   await info({icon:'mail',title:'Decyzja o stypendium rektora',source:'Politechnika Gdańska, e-Doręczenia',rows:[['Kwota','1 100 zł miesięcznie'],['Od','października 2026'],['Wypłata','na konto do 10. dnia miesiąca']],note:'Od decyzji możesz się odwołać w ciągu 14 dni od doręczenia.'});
   return;
  }
  return listMarta();
 };

 /* Karta Dużej Rodziny tylko dla osób, które ją mają */
 const kdr0=S.kdr;S.kdr=async()=>{if(!D.doc('kdr')){await say('Nie masz Karty Dużej Rodziny. Przysługuje rodzicom co najmniej trojga dzieci.');return}return kdr0()};

 /* dodatkowe sprawy z podpowiedzi osób */
 S.recepty=async()=>{
  await info({icon:'doc',title:'Recepty mamy',source:'IKP, upoważnienie od mamy',rows:[['Recepty do realizacji','2'],['Leki','na nadciśnienie, ważne do 20.12'],['Upoważnienie','aktywne, bezterminowe']],note:'Recepty zrealizujesz w aptece, podając kod z aplikacji i PESEL mamy.'});
 };
 S.peselOdblok=async()=>{
  await say('Cofnę zastrzeżenie PESEL na czas, który wybierzesz. Po tym czasie wróci samo.');
  await confirmCard({icon:'shield',title:'Czasowe cofnięcie zastrzeżenia PESEL',source:'Rejestr Zastrzeżeń PESEL',rows:[['PESEL',D.peselMaska()],['Na','7 dni'],['Zastrzeżenie wróci',D.fmt(new Date(Date.now()+7*864e5))]],label:'Cofnij na 7 dni',
   then:()=>result({title:'Zastrzeżenie cofnięte na 7 dni',rows:[['Wraca automatycznie',D.fmt(new Date(Date.now()+7*864e5))]]})});
 };
 S.egipt=async()=>{
  await info({icon:'alert',title:'Egipt: przed wyjazdem',source:'MSZ, Rejestr Paszportowy',rows:[['Paszport Igora','ważny do 14.03.2027 — Egipt wymaga 6 miesięcy ważności'],['Ostrzeżenia MSZ','zachowaj ostrożność, bez zakazu podróży'],['Wiza','na lotnisku, 25 USD']],tone:'warn',note:'Paszport Igora może być za krótko ważny. Złożyć wniosek o nowy?'});
  chips([{label:'Złóż wniosek o paszport',go:()=>say('W pełnej wersji złożę go tutaj. Odbiór i odciski palców w urzędzie wojewódzkim.')},{label:'Później'}]);
 };
 S.glosowanie=async()=>{
  await say('Możesz na stałe przepisać się do obwodu w Gdańsku, bez zmiany zameldowania. Wniosek złożę do Urzędu Miejskiego w Gdańsku.');
  await confirmCard({icon:'doc',title:'Wpis do stałego rejestru wyborców',source:'Centralny Rejestr Wyborców',rows:[['Gmina','Gdańsk'],['Adres','ul. Grunwaldzka 211'],['Obecnie','Elbląg']],label:'Złóż wniosek',
   then:()=>result({title:'Wniosek złożony',rows:[['Decyzja','do 3 dni roboczych'],['Gdzie','Twoje sprawy']]})});
 };

 /* nowe zwroty — przed scenariuszami z scenarios.js */
 const route0=route;
 route=function(t){
  ostatnie=t;
  if(pending)return route0(t);
  const n=norm(t);
  if(/recept/.test(n))return S.recepty();
  if(/odblok\w* pesel|pesel.*(odblok|cofn)|cofnij zastrz/.test(n))return S.peselOdblok();
  if(/egipt|paszport|wyjazd/.test(n))return S.egipt();
  if(/glosow|wybor|obwod/.test(n))return S.glosowanie();
  if(/emerytur|urz\w* skarbow|\bvat\b|decyzj|stypendi|politechnik/.test(n))return S.letter();
  if(/mandat/.test(n)&&!/punkt/.test(n))return S.pay();
  if(/zus|skladk/.test(n))return S.pay();
  if(/badani|przeglad/.test(n))return S.badanie();
  return route0(t);
 };
})();
