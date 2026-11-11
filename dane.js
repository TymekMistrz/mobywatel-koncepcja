/* ---------- Dane bieżącej osoby dla scenariuszy rozmów ----------
   Scenariusze (scenarios.js) biorą stąd imię, dokumenty, auto, miasto i urzędy,
   żeby odpowiedzi asystenta zgadzały się z tym, co widać w aplikacji.
   Daty liczone są względem „dziś” w aplikacji (suwak daty w panelu, czas.js). */
const MIEJSCA={
 marta:{miasto:'Warszawa',urzad:'Urząd Dzielnicy Mokotów',urzadGminy:'Urząd m.st. Warszawy',zdarzenie:'ul. Puławska 145, Warszawa',szpital:'Szpital Bielański, Warszawa',partner:'Tomasz Kowalski'},
 jan:{miasto:'Kraków',urzad:'Urząd Miasta Krakowa, os. Zgody 2',urzadGminy:'Urząd Miasta Krakowa',zdarzenie:'ul. Kalwaryjska 60, Kraków',szpital:'Szpital Uniwersytecki, Kraków',partner:'Anna Wiśniewska'},
 ewa:{miasto:'Lublin',urzad:'Urząd Miasta Lublin, ul. Wieniawska 14',urzadGminy:'Urząd Miasta Lublin',zdarzenie:'al. Racławickie 12, Lublin',szpital:'SPSK nr 1, Lublin',partner:'Marek Nowak'},
 kacper:{miasto:'Gdańsk',urzad:'Urząd Miejski w Gdańsku, ul. Partyzantów 74',urzadGminy:'Urząd Miejski w Gdańsku',zdarzenie:'ul. Grunwaldzka 211, Gdańsk',szpital:'Szpital Copernicus, Gdańsk',partner:'Julia Nowicka'},
};
const DANE=(()=>{
 const M=MIEJSCA[OS.id]||MIEJSCA.marta;
 const doc=id=>OS.docs.find(d=>d.id===id);
 const pole=(id,re)=>{const d=doc(id);if(!d)return null;const p=[...(d.f||[]),...(d.rows||[])].find(([k])=>re.test(k));return p?p[1]:null};
 const DAY=864e5;
 const dzis=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
 /* dni do daty „dd.mm(.rrrr)” w osi czasu aplikacji */
 const dni=s=>{const d=CZAS.parse(s);return d?Math.round((d-dzis())/DAY):null};
 const fmt=d=>d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric'});
 const krotko=d=>d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'});
 const data=s=>{const m=/(\d{2}\.\d{2}(?:\.\d{4})?)/.exec(s||'');return m?m[1]:null};
 const ileDni=x=>x===1?'1 dzień':x+' dni';
 /* „za 11 dni” / „dziś” / „3 dni po terminie” */
 const termin=s=>{const x=dni(s);if(x===null)return '';return x>1?'za '+ileDni(x):x===1?'jutro':x===0?'dziś':ileDni(-x)+' po terminie'};
 /* przypomnienie kilka dni przed terminem, ale nigdy w przeszłości; null, gdy termin minął */
 const przypomnienie=(s,przed=4)=>{const d=CZAS.parse(s);if(!d)return null;const t=new Date(Math.max(d-przed*DAY,dzis().getTime()+DAY));return t>d?null:krotko(t)};
 const auto=()=>{const d=doc('auto');if(!d)return null;const r=k=>(d.rows.find(([a])=>a===k)||[])[1]||'';
  const oc=r('OC'),badanie=r('Badanie techniczne');
  return {opis:r('Pojazd'),nr:r('Nr rejestracyjny'),ubezp:oc.split(',')[0],ocDo:data(oc),badanieDo:data(badanie),marka:r('Pojazd').split(' ')[0]}};
 const nazwisko=fem=>{const n=OS.nazwisko;if(fem)return n.replace(/ski$/,'ska').replace(/cki$/,'cka');return n.replace(/ska$/,'ski').replace(/cka$/,'cki')};
 const pesel=()=>pole('dowod',/^PESEL/)||'';
 return {M,doc,pole,dni,fmt,krotko,data,termin,przypomnienie,auto,nazwisko,ileDni,
  imieNazwisko:()=>OS.imie+' '+OS.nazwisko,
  nrDowodu:()=>(pole('dowod',/^Dowód osobisty$/)||'').split(',')[0],
  dowodDo:()=>data(pole('dowod',/^Dowód ważny do/)),
  peselMaska:()=>{const p=pesel();return p.slice(0,6)+'•••'+p.slice(9)},
  sprawa:k=>(OS.tiles||[]).find(t=>t.k===k),
  terminSprawy:(k,dom)=>{const t=(OS.tiles||[]).find(t=>t.k===k);const d=(t&&data(t.d))||dom;const r=termin(d);return d+(r?' ('+r+')':'')},
  sprawy:k=>(OS.tiles||[]).filter(t=>t.k===k)};
})();
