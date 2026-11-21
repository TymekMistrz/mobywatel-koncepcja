/* ---------- Pomoc bliskiej osoby: upoważnienie dla zaufanej osoby (rodzina, przyjaciel, sąsiad) ----------
   Osoba starsza (Halina) daje bliskiej osobie (córce Ewie) dostęp do wybranych spraw:
   zakres, czas, potwierdzenie Face ID. Ewa przyjmuje zaproszenie i w „Twoich sprawach”
   przełącza się na sprawy mamy — może działać tylko w udzielonym zakresie, a każde jej działanie
   widać u Haliny (historia, „Kto sprawdzał moje dane”). Halina cofa dostęp jednym przyciskiem.

   Prototyp: stan trzymamy w localStorage tej przeglądarki (klucz „mobPomoc”). Zdarzenie „storage”
   przenosi zmiany na żywo między telefonami w panelu pokazu (dwie ramki) i między oknami. */
(function(){
 const KLUCZ='mobPomoc',DAY=864e5,D=DANE;
 const ZAKRESY=[
  ['sprawy','Sprawy i terminy','widzi Twoje terminy i przypomnienia',true],
  ['oplaty','Opłaty i podatki','może zapłacić w Twoim imieniu'],
  ['pisma','Pisma z urzędów','czyta pisma z e-Doręczeń'],
  ['recepty','Recepty','widzi recepty do wykupienia w aptece']];
 const OKRESY=[['miesiac','1 miesiąc',30],['bez','Do odwołania',0],['wlasny','Własny termin',null]];
 const EASE='cubic-bezier(.22,.8,.24,1)',SPOK=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dzis=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
 const isoDzien=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const zIso=t=>{const [y,m,d]=String(t).split('-').map(Number);return new Date(y,m-1,d,23,59,59)};
 /* koniec upoważnienia: z liczby dni (od przyjęcia) albo konkretna data wybrana przez osobę dającą dostęp */
 /* pole daty pokazuje daty tak jak reszta aplikacji (przesunięte o CZAS.PRZES dni względem osi danych) */
 const PR=(window.CZAS&&CZAS.PRZES)||0;
 const naEkran=iso=>{const d=zIso(iso);d.setDate(d.getDate()+PR);return isoDzien(d)};
 const zEkranu=iso=>{const d=zIso(iso);d.setDate(d.getDate()-PR);return isoDzien(d)};
 const koniecDla=w=>w.okres==='wlasny'?zIso(w.koniec).getTime():null;
 const okresTxt=u=>u.koniec?'do '+D.fmt(new Date(u.koniec)):u.dni?'1 miesiąc':'do odwołania';
 const PUSTY=()=>({up:[],log:[],zal:{},pros:[]});
 const ico=(k,c)=>window.icoH?icoH(k,c):'';
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

 /* ---------- stan wspólny dla wszystkich okien ---------- */
 function wczytaj(){try{const s=JSON.parse(localStorage.getItem(KLUCZ));if(s&&s.up)return Object.assign(PUSTY(),s)}catch(e){}return PUSTY()}
 let st=wczytaj();
 function zapisz(){try{localStorage.setItem(KLUCZ,JSON.stringify(st))}catch(e){}odswiez();rozeslij()}
 const nazwa=id=>OSOBY[id]?OSOBY[id].imie+' '+OSOBY[id].nazwisko:id;
 const imie=id=>OSOBY[id]?OSOBY[id].imie:id;
 const RODZ=typeof RODZINA!=='undefined'?RODZINA:{};
 const rel=(ja,on)=>(RODZ[ja]||[]).find(r=>r.id===on)||null;
 const rodzaj=(k,m)=>OS.plec==='K'?k:m;
 const zywe=u=>u.status==='aktywne'&&(!u.do_dnia||Date.now()<u.do_dnia);
 const odeMnie=()=>st.up.filter(u=>u.od===OS.id&&(u.status==='oczekuje'||zywe(u)));
 const dlaMnie=()=>st.up.filter(u=>u.do===OS.id&&(u.status==='oczekuje'||zywe(u)));
 const aktywneDlaMnie=()=>st.up.filter(u=>u.do===OS.id&&zywe(u));
 const doKiedy=u=>u.do_dnia?'do '+D.fmt(new Date(u.do_dnia)):'do odwołania';
 const zakresTxt=z=>ZAKRESY.filter(x=>z.includes(x[0])).map(x=>x[1].toLowerCase()).join(', ');
 const loguj=(kto,za,co)=>{st.log.unshift({kto,za,co,t:Date.now()});st.log=st.log.slice(0,40)};
 const zal=id=>new Set(st.zal[id]||[]);

 /* sprawy załatwione przez kogokolwiek (właściciela albo upoważnioną osobę) widać u obu */
 if(window.ZALATWIONE&&(RODZ[OS.id]||[]).length){
  (st.zal[OS.id]||[]).forEach(h=>ZALATWIONE.add(h));
  const add=ZALATWIONE.add.bind(ZALATWIONE);
  ZALATWIONE.add=h=>{add(h);st=wczytaj();const z=new Set(st.zal[OS.id]||[]);if(!z.has(h)){z.add(h);st.zal[OS.id]=[...z];zapisz()}return ZALATWIONE};
 }

 /* ---------- „Twoje sprawy”: zaproszenie, przełącznik „Moje / Mama”, sprawy mamy ---------- */
 let KTO=null,segPrzed=null;   /* segPrzed: skąd ma ruszyć wskaźnik przełącznika „Moje / Mama” */   /* czyje sprawy oglądam: null = moje, albo id osoby, która dała mi upoważnienie */
 function naglowek(){
  const p=st.up.filter(u=>u.do===OS.id&&u.status==='oczekuje');
  const a=aktywneDlaMnie();
  let h=p.map(u=>`<button class="pmbaner" data-pm="zapro" data-id="${u.id}"><span class="pmav" style="background-image:url(assets/foto-${u.od}.svg)"></span>
    <span class="ptx"><b>${nazwa(u.od)} prosi Cię o pomoc</b><small>Zobacz, w czym możesz ${rel(OS.id,u.od)?'pomagać '+rel(OS.id,u.od).relD:'pomagać'}</small></span>${ico('chev','pch')}</button>`).join('');
  const opcje=[['','Moje sprawy'],...a.map(u=>[u.od,rel(OS.id,u.od)?cap(rel(OS.id,u.od).rel):imie(u.od)])],teraz=Math.max(0,opcje.findIndex(o=>o[0]===(KTO||'')));
  if(segPrzed===null||segPrzed>=opcje.length)segPrzed=teraz;
  if(a.length)h+=`<div class="pmseg" role="tablist" style="--n:${opcje.length};--i:${segPrzed}"><span class="pmwsk" aria-hidden="true"></span>${opcje.map(([k,l])=>
    `<button role="tab" data-pm="kto" data-k="${k}" aria-selected="${(KTO||'')===k}" class="${(KTO||'')===k?'on':''}">${l}</button>`).join('')}</div>`;
  return h;
 }
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 function strona(){
  if(KTO&&!aktywneDlaMnie().some(u=>u.od===KTO))KTO=null;
  if(!KTO)return null;
  const u=aktywneDlaMnie().find(x=>x.od===KTO),os=OSOBY[KTO],z=zal(KTO),r=rel(OS.id,KTO);
  const t=os.tiles||[];
  return naglowek()+`
   <div class="pmimie"><span class="pmav" style="background-image:url(assets/foto-${KTO}.svg)"></span><span class="ptx"><b>Działasz w imieniu: ${nazwa(KTO)}</b><small>Upoważnienie ${doKiedy(u)} · ${zakresTxt(u.zakres)}</small></span></div>
   <div class="pgr">${r?'Sprawy '+(r.relB==='mamę'?'mamy':'córki'):'Sprawy: '+nazwa(KTO)} · ${t.length}</div>
   <div class="plist">${t.map((x,i)=>{const moze=!x.z||u.zakres.includes(x.z);const ok=z.has(x.h);
    return `<button class="prow" data-h="${i}"><span class="pic ${x.u&&!ok?'pil':''}">${ico(moze?(x.i==='car'?'car':x.i==='coin'?'coin':x.i==='doc'?'doc':'mail'):'lock')}</span><span class="ptx"><b>${x.h}</b>${ok?'<small class="gotowe">Załatwione</small>':`<small class="${x.u?'pilne':''}">${x.d}</small>`}<small>${moze?'':'Bez dostępu: '+(ZAKRESY.find(q=>q[0]===x.z)||[,''])[1].toLowerCase()}</small></span>${ico('chev','pch')}</button>`}).join('')}</div>
   <div class="pmstopka">${ico('shield')}<span>${imie(KTO)} widzi w swojej aplikacji wszystko, co tu zrobisz. ${OSOBY[KTO].plec==='K'?'Jej':'Jego'} dokumentów nie zobaczysz i niczego za ${OSOBY[KTO].plec==='K'?'nią':'niego'} nie podpiszesz.</span></div>`;
 }

 /* sprawa osoby, która dała upoważnienie — akcje tylko w udzielonym zakresie */
 function otworzSprawe(i){
  const u=aktywneDlaMnie().find(x=>x.od===KTO);if(!u)return;
  const t=OSOBY[KTO].tiles[i],kto=KTO,r=rel(OS.id,kto),moze=!t.z||u.zakres.includes(t.z);
  const z=zal(kto),s=SP.stan(t,z),d=D.data(t.d),kw=((/([\d\s]+(?:,\d{2})?)\s*zł/.exec(t.d)||[])[1]||'').trim();
  const kogo=r?(r.relB==='mamę'?'mamy':'córki'):'tej osoby';   /* nie tylko rodzina: bez relacji piszemy ogólnie */
  const wiersze=[['W imieniu',nazwa(kto)]];if(d)wiersze.push(['Termin',d+(D.termin(d)?' ('+D.termin(d)+')':'')]);else wiersze.push(['Status',t.d]);
  let akcja='';
  if(!moze)akcja=`<div class="spnote pmlock">${ico('lock')}<span>${cap(r?r.rel:imie(kto))} nie dał${OSOBY[kto].plec==='K'?'a':''} Ci dostępu do: <b>${(ZAKRESY.find(q=>q[0]===t.z)||[,''])[1].toLowerCase()}</b>.</span></div>
    <button class="spbtn" id="pmpros">Poproś o dostęp</button>`;
  else if(z.has(t.h))akcja='';
  else if(t.k==='pay')akcja=`<button class="spbtn" id="pmgo">Zapłać ${kw} zł${r&&r.relB==='mamę'?' za mamę':''}</button>`;
  else if(t.k==='recepty')akcja=`<button class="spbtn" id="pmgo">Pokaż kody recept</button>`;
  else if(t.k==='letter')akcja=`<button class="spbtn" id="pmgo">Przeczytaj pismo</button>`;
  SP.pokaz(r?'Sprawa '+kogo:'Sprawa: '+nazwa(kto),`
   <div class="sphero"><span class="spic">${svg(t.i==='coin'?'coin':t.i==='doc'?'doc':t.i==='car'?'car':'mail')}</span>
    <h2>${t.h}</h2><span class="sppill ${s.cls}">${s.txt}</span></div>
   <div class="ui"><div class="rows">${rowsH(wiersze)}</div></div>
   ${moze&&t.k!=='letter'?`<div class="sptxt">${t.s||''}</div>`:''}
   <div id="spakcja">${akcja}</div>`,
   el=>{
    const box=el.querySelector('#spakcja');
    const p=el.querySelector('#pmpros');
    if(p)p.onclick=()=>{st=wczytaj();if(!st.pros.some(x=>x.od===OS.id&&x.do===kto&&x.zakres===t.z&&x.status==='czeka')){st.pros.unshift({id:'p'+Date.now(),od:OS.id,do:kto,zakres:t.z,t:Date.now(),status:'czeka'});zapisz()}
     box.innerHTML=`<div class="spok">${svg('check')}<b>Prośba wysłana</b><div class="sptxt">${imie(kto)} zobaczy ją w swojej aplikacji i zdecyduje.</div></div>`};
    const g=el.querySelector('#pmgo');if(!g)return;
    g.onclick=async()=>{
     if(t.k==='pay'){await faceid();st=wczytaj();const zz=zal(kto);zz.add(t.h);st.zal[kto]=[...zz];loguj(OS.id,kto,`zapłacił${OS.plec==='K'?'a':''}: ${t.h}, ${kw} zł`);zapisz();
      SP.sukces(box,`Zapłacone w imieniu: ${nazwa(kto)}`,[['Kwota',kw+' zł'],['Tytuł',t.h],['Potwierdzenie','widzi je też '+imie(kto)]]);
      const pill=el.querySelector('.sppill');if(pill){pill.className='sppill ok';pill.textContent='Załatwione'}return}
     if(t.k==='recepty'){st=wczytaj();loguj(OS.id,kto,'sprawdził'+(OS.plec==='K'?'a':'')+' recepty');zapisz();
      box.innerHTML=`<div class="ui"><div class="rows">${rowsH([['PESEL '+kogo,(OSOBY[kto].moje.pesel||'').slice(0,6)+'•••••'],['Recepta 1','kod 4821 · ważna do 20.12'],['Recepta 2','kod 7716 · ważna do 20.12']])}</div></div>
       <div class="sptxt">W aptece podaj PESEL ${kogo} i kod recepty. Farmaceuta wyda leki Tobie.</div>`;return}
     if(t.k==='letter'){st=wczytaj();loguj(OS.id,kto,'przeczytał'+(OS.plec==='K'?'a':'')+': '+t.h);const zz=zal(kto);zz.add(t.h);st.zal[kto]=[...zz];zapisz();
      box.innerHTML=`<div class="sptxt" style="margin-top:0">${t.s||''}</div><div class="spnote">${ico('check')}<span>Oznaczone jako przeczytane u ${kogo}.</span></div>`;
      const pill=el.querySelector('.sppill');if(pill){pill.className='sppill ok';pill.textContent='Załatwione'}}
    };
   });
 }

 /* ---------- Więcej → „Pomoc bliskiej osoby” ---------- */
 let ekran=null;   /* co jest otwarte w arkuszu, żeby odświeżyć po zmianie w drugim telefonie */
 let byloKl=null;   /* klucze wierszy z poprzedniego rysowania — nowe wiersze dostają animację wejścia */
 function ekranPomocy(opt={}){
  const pierwszy=ekran!=='pomoc'&&!opt.nowe;
  ekran='pomoc';
  const moje=odeMnie(),dla=dlaMnie(),rodz=(RODZ[OS.id]||[]);
  const pros=st.pros.filter(p=>p.do===OS.id&&p.status==='czeka');
  const hist=st.log.filter(l=>l.za===OS.id).slice(0,8);
  SP.pokaz('Pomoc bliskiej osoby',`
   <div class="sptxt" style="margin-top:0">Ktoś, komu ufasz — z rodziny, przyjaciel albo sąsiad — może pomagać Ci w sprawach urzędowych na swoim telefonie. Ty decydujesz, w czym, i w każdej chwili możesz to cofnąć.</div>
   ${pros.length?`<div class="sppgr">Prośby</div><div class="plist">${pros.map(p=>`<div class="prow pmprow" data-klucz="p${p.id}"><span class="pmav" style="background-image:url(assets/foto-${p.od}.svg)"></span><span class="ptx"><b>${nazwa(p.od)} prosi o dostęp</b><small>${(ZAKRESY.find(q=>q[0]===p.zakres)||[,''])[1]}</small>
     <span class="pmprz"><button class="pmmaly" data-pm="pros-tak" data-id="${p.id}">Zgadzam się</button><button class="pmmaly ghost" data-pm="pros-nie" data-id="${p.id}">Nie teraz</button></span></span></div>`).join('')}</div>`:''}
   <div class="sppgr">Pomagają Ci</div>
   ${moje.length?`<div class="plist">${moje.map(u=>`<div class="prow pmprow" data-klucz="m${u.id}${u.status}"><span class="pmav" style="background-image:url(assets/foto-${u.do}.svg)"></span><span class="ptx"><b>${nazwa(u.do)}${rel(OS.id,u.do)?', '+rel(OS.id,u.do).rel:''}</b>
     <small>${u.status==='oczekuje'?'Czeka na przyjęcie zaproszenia':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz"><button class="pmmaly ghost pmcofnij" data-pm="cofnij" data-id="${u.id}">${u.status==='oczekuje'?'Anuluj zaproszenie':'Cofnij dostęp'}</button></span></span></div>`).join('')}</div>`
    :`<div class="pmpusto">Nikt nie ma teraz dostępu do Twoich spraw.</div>`}
   <button class="spbtn" data-pm="nowe">${ico('users')}Upoważnij bliską osobę</button>
   ${hist.length?`<div class="sppgr">Co zrobiono w Twoim imieniu</div><div class="plist">${hist.map(l=>`<div class="prow pmprow" data-klucz="l${l.t}"><span class="pic">${svg('check')}</span><span class="ptx"><b>${imie(l.kto)} ${esc(l.co)}</b><small>${D.fmt(new Date(l.t))}, ${new Date(l.t).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</small></span></div>`).join('')}</div>`:''}
   ${dla.length?`<div class="sppgr">Pomagasz</div><div class="plist">${dla.map(u=>`<div class="prow pmprow" data-klucz="d${u.id}${u.status}"><span class="pmav" style="background-image:url(assets/foto-${u.od}.svg)"></span><span class="ptx"><b>${nazwa(u.od)}${rel(OS.id,u.od)?', '+rel(OS.id,u.od).rel:''}</b>
     <small>${u.status==='oczekuje'?'Zaprasza Cię do pomocy':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz">${u.status==='oczekuje'?`<button class="pmmaly" data-pm="zapro" data-id="${u.id}">Zobacz zaproszenie</button>`:`<button class="pmmaly" data-pm="idz" data-k="${u.od}">${rel(OS.id,u.od)&&rel(OS.id,u.od).relB==='mamę'?'Sprawy mamy':'Przejdź do spraw'}</button><button class="pmmaly ghost" data-pm="rezygnuj" data-id="${u.id}">Zrezygnuj</button>`}</span></span></div>`).join('')}</div>`:''}
   <div class="sppgr">Chcesz pomagać komuś bliskiemu?</div>
   <div class="plist"><button class="prow" data-pm="mojznak"><span class="pic">${ico('scan')}</span><span class="ptx"><b>Pokaż mój znak</b><small>Ta osoba skanuje go w swoim telefonie i sama decyduje, w czym możesz pomagać.</small></span>${ico('chev','pch')}</button></div>
   ${OSTRZ}
   <div class="pmstopka">${ico('shield')}<span>Upoważniona osoba nie widzi Twoich dokumentów i niczego za Ciebie nie podpisze. Wszystko, co zrobi, zobaczysz tutaj i w „Kto sprawdzał moje dane”.</span></div>`,
   el=>{el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>klik(b));
    const body=el.querySelector('.body'),kl=new Set([...body.querySelectorAll('[data-klucz]')].map(x=>x.dataset.klucz));
    if(!SPOK()){
     if(pierwszy)   /* otwarcie: sekcje spokojnie wchodzą jedna po drugiej */
      [...body.children].forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,delay:Math.min(i,8)*35,easing:EASE,fill:'backwards'}));
     else if(byloKl)   /* odświeżenie (np. zmiana na drugim telefonie): wchodzą tylko nowe wiersze, z krótkim podświetleniem */
      body.querySelectorAll('[data-klucz]').forEach(x=>{if(byloKl.has(x.dataset.klucz))return;
       x.animate([{opacity:0,transform:'translateY(-6px) scale(.98)'},{opacity:1,transform:'none'}],{duration:360,easing:EASE});
       x.animate([{background:'#fff6d6'},{background:'#fff'}],{duration:1400,easing:'ease-out'})});
    }
    byloKl=kl;
   });
 }
 /* wiersz znika: zwija się i odjeżdża, dopiero potem zmieniamy stan i rysujemy na nowo */
 function zwin(row,ok){
  if(!row||SPOK())return Promise.resolve();
  if(ok){const p=row.querySelector('.pmprz');if(p)p.innerHTML=`<span class="pmok">${svg('check')}${ok}</span>`}
  const h=row.offsetHeight;row.style.overflow='hidden';
  return row.animate([{height:h+'px',opacity:1,transform:'none'},{height:h+'px',opacity:ok?1:.4,transform:ok?'none':'translateX(-24px)',offset:ok?.55:.35},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px',marginTop:'0px',marginBottom:'0px',transform:ok?'none':'translateX(-24px)'}],{duration:ok?900:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.catch(()=>{});
 }

 /* ostrzeżenie przed oszustwem „na policjanta / urzędnika” — w kreatorze i na ekranie pomocy */
 const OSTRZ=`<div class="pmostrz" role="note">${ico('alert')}<span><b>Policja, urząd, bank ani ZUS nigdy nie poproszą Cię o takie upoważnienie</b> — ani przez telefon, ani osobiście. Jeśli ktoś Cię do tego namawia albo pogania, to oszustwo. Przerwij i zadzwoń do kogoś bliskiego.</span></div>`;

 /* PESEL: suma kontrolna; numer dowodu: 3 litery + 6 cyfr */
 const peselOk=p=>{if(!/^\d{11}$/.test(p))return false;const w=[1,3,7,9,1,3,7,9,1,3];let s=0;for(let i=0;i<10;i++)s+=w[i]*+p[i];return (10-s%10)%10===+p[10]};
 const nrDow=t=>String(t||'').toUpperCase().replace(/[\s-]/g,'');
 function znajdz(pesel,dow){return Object.values(OSOBY).find(o=>o.moje&&o.moje.pesel===pesel&&nrDow(o.moje.nr_dowodu)===nrDow(dow))||null}
 function czyMozna(id){
  if(id===OS.id)return 'To Twoje własne dane. Wpisz dane osoby, która ma Ci pomagać.';
  if(odeMnie().some(u=>u.do===id))return `${nazwa(id)} ma już Twoje upoważnienie albo zaproszenie.`;
  return null;
 }

 /* Znak do upoważnienia: osoba pomagająca POKAZUJE swój znak, osoba starsza go SKANUJE w swoim telefonie.
    W pokazie (bez serwera) znak „widzi” drugi telefon w tej samej przeglądarce. */
 const KZNAK='mobPomocZnak';
 /* żeton znaku do upoważnienia niesie, czyj to znak: 3 bity osoby + 5 bitów znacznika + 8 losowych.
    Dzięki temu skaner rozpozna osobę także z drugiego urządzenia (w pokazie wszystkie osoby są w każdej przeglądarce). */
 const IDS=Object.keys(OSOBY),TAG=22;
 const tokenOsoby=id=>((IDS.indexOf(id)&7)<<13)|(TAG<<8)|(1+((Math.random()*254)|0));
 const osobaZTokenu=t=>((t>>8)&31)===TAG?IDS[(t>>13)&7]||null:null;
 const opublikowany=()=>{try{const z=JSON.parse(localStorage.getItem(KZNAK));if(z&&Date.now()-z.t<5*60e3)return z}catch(e){}return null};

 /* kratki: jedna kratka na znak. D = cyfra, L = litera (A–Z). przerwy: indeksy, przed którymi jest odstęp */
 function kratki(id,wzor,przerwy,wart,etyk){
  return `<div class="pmkratki" id="${id}" role="group" aria-labelledby="${etyk}">${[...wzor].map((t,i)=>`<input class="${przerwy.includes(i)?'od':''}" data-t="${t}" maxlength="1" inputmode="${t==='D'?'numeric':'text'}" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" aria-label="${t==='D'?'cyfra':'litera'} ${i+1}" value="${esc((wart||'')[i]||'')}">`).join('')}</div>`}
 const pasuje=(t,c)=>t==='D'?/^\d$/.test(c):/^[A-Z]$/.test(c);
 const wartosc=g=>[...g.querySelectorAll('input')].map(x=>x.value).join('');
 function ustawKratki(g,txt){const k=[...g.querySelectorAll('input')];let i=0;for(const c of String(txt).toUpperCase()){if(i>=k.length)break;if(pasuje(k[i].dataset.t,c)){k[i].value=c;i++}}k.slice(i).forEach(x=>x.value='')}
 function kratkiDzialaj(g){
  const k=[...g.querySelectorAll('input')];
  const zly=x=>{x.classList.remove('zly');void x.offsetWidth;x.classList.add('zly')};
  function wklej(od,txt){let i=od;for(const c of String(txt).toUpperCase()){if(i>=k.length)break;if(pasuje(k[i].dataset.t,c)){k[i].value=c;i++}}(k[i]||k[k.length-1]).focus()}
  k.forEach((x,i)=>{
   x.addEventListener('beforeinput',e=>{if(e.inputType!=='insertText'||!e.data)return;e.preventDefault();
    if(e.data.length>1){wklej(i,e.data);return}
    const c=e.data.toUpperCase();if(!pasuje(x.dataset.t,c)){zly(x);return}x.value=c;x.classList.remove('zly');if(k[i+1])k[i+1].focus();else x.blur()});
   /* awaryjnie (klawiatury bez beforeinput, np. autouzupełnianie): czyścimy, co nie pasuje */
   x.addEventListener('input',()=>{const v=x.value.toUpperCase();if(!v)return;if(v.length>1){x.value='';wklej(i,v);return}if(!pasuje(x.dataset.t,v)){x.value='';zly(x);return}x.value=v;if(k[i+1])k[i+1].focus()});
   x.addEventListener('keydown',e=>{
    if(e.key==='Backspace'){e.preventDefault();if(x.value)x.value='';else if(k[i-1]){k[i-1].value='';k[i-1].focus()}}
    else if(e.key==='ArrowLeft'&&k[i-1]){e.preventDefault();k[i-1].focus()}
    else if(e.key==='ArrowRight'&&k[i+1]){e.preventDefault();k[i+1].focus()}});
   x.addEventListener('focus',()=>{try{x.select()}catch(e){}});
   x.addEventListener('paste',e=>{e.preventDefault();wklej(i,(e.clipboardData||window.clipboardData).getData('text'))});
  });
 }

 /* „duch” obecnej treści arkusza: zostaje na wierzchu i odjeżdża, a pod nim wjeżdża nowy ekran */
 function zdejmij(){
  const sh=SP.sh;if(!sh.classList.contains('on')||SPOK())return null;const b=sh.querySelector('.body');if(!b)return null;
  const r=b.getBoundingClientRect(),rs=sh.getBoundingClientRect(),y=b.scrollTop;
  return {b,r,rs,y};
 }
 function przesun(st0,kier,bezPaska){
  const sh=SP.sh,b=sh.querySelector('.body');if(!b||SPOK())return;
  if(st0){const g=st0.b;g.classList.add('pmduch');
   Object.assign(g.style,{position:'absolute',left:(st0.r.left-st0.rs.left)+'px',top:(st0.r.top-st0.rs.top)+'px',width:st0.r.width+'px',height:st0.r.height+'px',pointerEvents:'none',zIndex:2,overflow:'hidden'});
   if(bezPaska)g.querySelectorAll('.pmkroki').forEach(k=>k.style.visibility='hidden');
   sh.append(g);g.scrollTop=st0.y;
   g.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-kier*40}px)`}],{duration:200,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished.then(()=>g.remove(),()=>g.remove());}
  [...b.children].filter(c=>!(bezPaska&&c.classList.contains('pmkroki'))).forEach((c,i)=>c.animate([{opacity:0,transform:`translateX(${kier*48}px)`},{opacity:1,transform:'none'}],{duration:400,delay:70+Math.min(i,6)*18,easing:EASE,fill:'backwards'}));
 }
 /* kreator u osoby, która daje dostęp: jak znaleźć osobę → potwierdź osobę → w czym → na jak długo */
 function kreator(w){
  ekran='kreator';
  w=w||{krok:1,do:null,przez:null,zakres:['sprawy','oplaty'],okres:'miesiac'};
  if(!w.koniec){const d=dzis();d.setMonth(d.getMonth()+3);w.koniec=isoDzien(d)}
  const N=4,nr=typeof w.krok==='number'?w.krok:1,bylo=w._nr||nr;
  /* pasek postępu: rysujemy stan poprzedni, a w następnej klatce przełączamy — wypełnienie płynnie rośnie albo się cofa */
  const kropki=`<div class="pmkroki" role="progressbar" aria-valuemin="1" aria-valuemax="${N}" aria-valuenow="${nr}" aria-label="Krok ${nr} z ${N}">${Array.from({length:N},(_,n)=>`<i class="${n<bylo?'on':''}"><b></b></i>`).join('')}</div>`;
  const r=w.do?rel(OS.id,w.do):null,kogo=w.do?imie(w.do):'';
  let h='';
  if(w.krok===1)h=`${kropki}<h2 class="pmh">Kto ma Ci pomagać?</h2>
   <div class="sptxt" style="margin-top:4px">Może to być ktoś z rodziny, przyjaciel albo sąsiad — każda pełnoletnia osoba z mObywatelem.</div>
   <div class="sptxt">Osobę dodajesz tylko na swoim telefonie. Ona nie może sama uzyskać dostępu do Twoich spraw.</div>
   ${OSTRZ}
   <div class="plist pmsposob">
    <button class="prow" data-spos="znak"><span class="pic">${ico('scan')}</span><span class="ptx"><b>Zeskanuj jej znak</b><small>Gdy jesteście obok siebie. Ona pokazuje znak w swojej aplikacji, Ty go skanujesz.</small></span>${ico('chev','pch')}</button>
    <button class="prow" data-spos="pesel"><span class="pic">${ico('id')}</span><span class="ptx"><b>Wpisz PESEL i numer dowodu</b><small>Obie dane muszą się zgadzać z rejestrem.</small></span>${ico('chev','pch')}</button>
   </div>`;
  if(w.krok==='pesel')h=`${kropki}<h2 class="pmh">Dane osoby, która ma pomagać</h2>
   <div class="sptxt">Przepisz je z jej dowodu osobistego. Nie podawaj nikomu własnych.</div>
   <div class="pmpole"><span id="pmlpes">PESEL</span>${kratki('pmpesel','DDDDDDDDDDD',[6],w.pesel,'pmlpes')}</div>
   <div class="pmpole"><span id="pmldow">Seria i numer dowodu osobistego</span>${kratki('pmdow','LLLDDDDDD',[3],w.dow,'pmldow')}<small class="pmpodp">3 litery i 6 cyfr — jak na dowodzie</small></div>
   <div class="pmblad" id="pmblad" role="alert">${w.blad?esc(w.blad):''}</div>
   <button class="spbtn" data-szukaj>Dalej</button>
   ${opublikowany()||RODZ[OS.id]?`<button class="pmpokaz" data-przyklad>Pokaz: wpisz przykładowe dane ${RODZ[OS.id]?'('+nazwa(RODZ[OS.id][0].id)+')':''}</button>`:''}`;
  if(w.krok===2){const os=OSOBY[w.do];
   h=`${kropki}<h2 class="pmh">Czy to ta osoba?</h2>
   <div class="pmosoba"><span class="pmav duzy" style="background-image:url(assets/foto-${w.do}.svg)"></span><span><b>${nazwa(w.do)}</b><small>ur. ${os.moje.data_urodzenia} · ${(MIEJSCA[w.do]||{}).miasto||''}</small><small>${w.przez==='znak'?'Znak zeskanowany przed chwilą':'PESEL i numer dowodu zgadzają się z rejestrem'}</small></span></div>
   <div class="sptxt">Daj dostęp tylko komuś, kogo znasz osobiście i komu ufasz.</div>
   <button class="spbtn" data-dalej>Tak, to ${os.plec==='K'?'ona':'on'}</button><button class="spbtn ghost" data-od-nowa style="margin-top:10px;width:100%">Nie, zacznij od nowa</button>`}
  if(w.krok===3)h=`${kropki}<h2 class="pmh">W czym ${kogo} może pomagać?</h2>
   <div class="plist">${ZAKRESY.map(([k,t,s,staly])=>SP.przelacznik(t,s+(staly?' · zawsze':''),w.zakres.includes(k)).replace('class="prow sw"',`class="prow sw" data-zk="${k}" ${staly?'aria-disabled="true"':''}`)).join('')}</div>
   <div class="spnote">${ico('lock')}<span>${kogo} nie zobaczy Twoich dokumentów i niczego za Ciebie nie podpisze.</span></div>
   <button class="spbtn" data-dalej>Dalej</button>`;
  if(w.krok===4){const ok=OKRESY.find(o=>o[0]===w.okres);
   const jutro=dzis();jutro.setDate(jutro.getDate()+1);const max=dzis();max.setFullYear(max.getFullYear()+5);
   h=`${kropki}<h2 class="pmh">Na jak długo?</h2>
   <div class="pmokres" role="radiogroup" aria-label="Na jak długo">${OKRESY.map(([k,l])=>`<button role="radio" aria-checked="${w.okres===k}" data-ok="${k}" class="${w.okres===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="pmdata ${w.okres==='wlasny'?'on':''}"><label class="pmpole"><span>Dostęp wygaśnie</span><input type="date" id="pmkoniec" min="${naEkran(isoDzien(jutro))}" max="${naEkran(isoDzien(max))}" value="${naEkran(w.koniec)}"></label></div>
   <div class="ui"><div class="rows">${rowsH([['Komu',nazwa(w.do)+(r?', '+r.rel:'')],['W czym',cap(zakresTxt(w.zakres))],['Do kiedy',`<span class="pmdokiedy">${w.okres==='wlasny'?D.fmt(zIso(w.koniec)):ok[2]?D.fmt(new Date(Date.now()+ok[2]*DAY)):'do odwołania'}</span>`]])}</div></div>
   ${OSTRZ}
   <div class="sptxt">${kogo} dostanie zaproszenie w swojej aplikacji. Dostęp zacznie działać, gdy je przyjmie. Cofniesz go w każdej chwili.</div>
   <button class="spbtn" data-dalej>Potwierdź i wyślij</button>`}
  /* przejście między krokami: poprzedni ekran odjeżdża, nowy wjeżdża z kierunku ruchu; pasek zostaje na miejscu */
  const klucz=String(w.krok),kier=w._kier||1;w._kier=1;
  const stary=w._klucz&&w._klucz!==klucz?zdejmij():null;
  w._klucz=klucz;w._nr=nr;
  SP.pokaz('Upoważnij bliską osobę',h,el=>{
   przesun(stary,kier,true);
   requestAnimationFrame(()=>requestAnimationFrame(()=>el.querySelectorAll('.pmkroki i').forEach((x,n)=>{x.classList.toggle('on',n<nr);x.style.transitionDelay=Math.abs(n-(bylo-1))*60+'ms'})));
   el.querySelectorAll('[data-spos]').forEach(b=>b.onclick=()=>{if(b.dataset.spos==='znak'){skanuj(w);return}w.krok=b.dataset.spos;kreator(w)});
   el.querySelectorAll('[data-zk]').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true')return;const k=b.dataset.zk;w.zakres=w.zakres.includes(k)?w.zakres.filter(x=>x!==k):[...w.zakres,k];
    b.setAttribute('aria-checked',w.zakres.includes(k));b.querySelector('.spsw').classList.toggle('on',w.zakres.includes(k))});
   el.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{w.okres=b.dataset.ok;
    /* bez przeładowania kroku: zaznaczenie, pole daty i podsumowanie zmieniają się na miejscu */
    el.querySelectorAll('[data-ok]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)});
    const pd=el.querySelector('.pmdata');pd.classList.toggle('on',w.okres==='wlasny');podsum()});
   const kn=el.querySelector('#pmkoniec');
   const podsum=()=>{const r=el.querySelector('.pmdokiedy');if(!r)return;const ok=OKRESY.find(o=>o[0]===w.okres);
    r.textContent=w.okres==='wlasny'?D.fmt(zIso(w.koniec)):ok[2]?D.fmt(new Date(Date.now()+ok[2]*DAY)):'do odwołania';
    r.animate([{opacity:.3},{opacity:1}],{duration:260})};
   if(kn)kn.onchange=()=>{if(!kn.value)return;const v=zEkranu(kn.value),t=zIso(v);const j=dzis();j.setDate(j.getDate()+1);
    if(t<j){kn.value=naEkran(w.koniec);SP.toast('Wybierz datę od jutra.');return}w.koniec=v;podsum()};
   const nowa=el.querySelector('[data-od-nowa]');if(nowa)nowa.onclick=()=>{w.krok=1;w.do=null;w._kier=-1;kreator(w)};
   /* PESEL + numer dowodu */
   const sz=el.querySelector('[data-szukaj]');
   if(sz){const pe=el.querySelector('#pmpesel'),dw=el.querySelector('#pmdow');
    kratkiDzialaj(pe);kratkiDzialaj(dw);
    const pr=el.querySelector('[data-przyklad]');
    if(pr)pr.onclick=()=>{const z=opublikowany(),id=(RODZ[OS.id]&&RODZ[OS.id][0].id)||(z&&z.osoba);if(!id)return;ustawKratki(pe,OSOBY[id].moje.pesel);ustawKratki(dw,nrDow(OSOBY[id].moje.nr_dowodu))};
    sz.onclick=()=>{w.pesel=wartosc(pe);w.dow=wartosc(dw);
     const bl=t=>{w.blad=t;el.querySelector('#pmblad').textContent=t};
     if(w.pesel.length<11)return bl('Wpisz wszystkie 11 cyfr PESEL.');
     if(!peselOk(w.pesel))return bl('Ten PESEL jest niepoprawny. Sprawdź cyfry.');
     if(!/^[A-Z]{3}\d{6}$/.test(w.dow))return bl('Uzupełnij numer dowodu: 3 litery i 6 cyfr.');
     const o=znajdz(w.pesel,w.dow);
     if(!o)return bl('Nie znaleźliśmy osoby z aplikacją mObywatel o tym PESEL i numerze dowodu.');
     const n=czyMozna(o.id);if(n)return bl(n);
     w.blad='';w.do=o.id;w.przez='pesel';w.krok=2;kreator(w)}}
   const d=el.querySelector('[data-dalej]');if(!d)return;
   d.onclick=async()=>{
    if(w.krok<4){w.krok++;kreator(w);return}
    await faceid();
    st=wczytaj();const ok=OKRESY.find(o=>o[0]===w.okres);
    st.up.unshift({zm:teraz(),id:'u'+Date.now(),od:OS.id,do:w.do,przez:w.przez,zakres:ZAKRESY.map(z=>z[0]).filter(k=>w.zakres.includes(k)),okres:w.okres,dni:ok[2]||0,koniec:koniecDla(w),utw:Date.now(),status:'oczekuje'});
    zapisz();ekran='pomoc';
    /* zaproszenie do drugiego urządzenia: na temat zeskanowanego znaku albo (po PESEL) na temat osoby */
    {const u=st.up[0];wyslij(w.przez==='znak'&&w.token!=null?tematZnaku(w.token):tematOsoby(w.do),paczka(u))}
    const box=SP.sh.querySelector('.body');
    box.innerHTML=`<div class="spok">${svg('check')}<b>Zaproszenie wysłane</b><div class="sptxt">${kogo} zobaczy je w swojej aplikacji, w „Twoich sprawach”. Gdy je przyjmie, dostaniesz powiadomienie.</div></div>
     <div id="spakcja"><button class="spbtn ghost" data-wroc>Gotowe</button></div>`;
    if(!SPOK())[...box.children].forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'none'}],{duration:420,delay:i*90,easing:EASE,fill:'backwards'}));
    box.querySelector('[data-wroc]').onclick=()=>{const s0=zdejmij();ekranPomocy({nowe:true});przesun(s0,-1,false)};
   };
  });
 }

 /* osoba pomagająca pokazuje swój znak — ten sam ekran co „Przyjmij dane” pod „Skanuj” (nic nie wpisuje i o nic nie prosi) */
 function mojZnak(){
  const token=tokenOsoby(OS.id);
  try{localStorage.setItem(KZNAK,JSON.stringify({osoba:OS.id,token,t:Date.now()}))}catch(e){}
  if(znakTemat)odsubskrybuj(znakTemat);znakTemat=tematZnaku(token);subskrybuj(znakTemat,null);
  if(ZS)zFinish({ok:false});
  ekran='mojznak';
  ZS={resolve:()=>{schowajZnak();if(ekran==='mojznak')ekran=SP.sh.classList.contains('on')?'pomoc':null},opt:{pomoc:1}};
  const o=pScreen(`${pTop('Mój znak do upoważnienia')}<div class="qbody c mz">
   <div class="mojznak" id="mojZnak">${ZNAK.svg(token)}</div>
   <p class="qlead c">Pokaż ten znak osobie, która chce dać Ci dostęp do swoich spraw. Ona skanuje go w <b>swoim</b> telefonie: Więcej → Pomoc bliskiej osoby → Upoważnij.</p>
   <div class="wait" data-odm="1"><i></i>Czekam, aż zeskanuje…</div>
   <p class="qnote c">Znak niczego nie udostępnia. Wygasa po 5 minutach.</p></div>`,'light','zx');
  const mz=o.querySelector('#mojZnak');if(mz&&typeof wejscieZnaku==='function')wejscieZnaku(mz,240);
 }
 /* osoba dająca dostęp skanuje znak — ten sam skaner co pod „Skanuj” na ekranie głównym.
    W pokazie (bez serwera) znak z drugiego telefonu w tej samej przeglądarce rozpoznajemy po chwili sam. */
 function skanuj(w){
  if(PS)pFinish({ok:false});
  const st={resolve:r=>{if(r&&r.ok){w.do=r.osoba;w.przez='znak';w.krok=2;kreator(w)}},opt:{},run:true};PS=st;
  const o=pScreen(`${pTop('Zeskanuj znak')}<div class="cam"><video playsinline muted autoplay></video><div class="guide"><span></span></div><p class="camhint">Szukam znaku…</p></div>
   <div class="qscanfoot"><p class="lh">Nakieruj aparat na znak w telefonie osoby, która ma Ci pomagać. Poproś ją, żeby otworzyła: Więcej → Pomoc bliskiej osoby → Pokaż mój znak.</p></div>`,'dark scan');
  const hint=t=>{const h=o.querySelector('.camhint');if(h)h.textContent=t};
  const start=Date.now();let koniec=false;
  const trafiony=z=>{if(koniec||PS!==st)return;w.token=z.token;const n=czyMozna(z.osoba);if(n){hint(n);return}koniec=true;
   const g=o.querySelector('.guide');if(g)g.classList.add('seen');hint('Rozpoznano znak');try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
   setTimeout(()=>{if(PS===st)pFinish({ok:true,osoba:z.osoba})},550)};
  (async()=>{let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})}catch(e){return}
   if(PS!==st){stream.getTracks().forEach(t=>t.stop());return}
   st.stream=stream;const v=o.querySelector('video');v.srcObject=stream;try{await v.play()}catch(e){}o.querySelector('.cam').classList.add('live');
   const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});let ost=null;
   const loop=()=>{if(!st.run||PS!==st||koniec)return;
    if(v.readyState>=2){const W=640,H=Math.round(W*v.videoHeight/v.videoWidth)||480;cv.width=W;cv.height=H;cx.drawImage(v,0,0,W,H);
     /* ten sam znak w dwóch kolejnych klatkach, zanim go przyjmiemy — mniej fałszywych odczytów */
     const r=ZNAK.decode(cx.getImageData(0,0,W,H).data,W,H),os=r?osobaZTokenu(r.token):null;
     if(r&&!os)hint('To nie jest znak do upoważnienia. Poproś o „Pokaż mój znak”.');
     if(os){if(ost===r.token){if(os===OS.id)hint('To Twój własny znak.');else trafiony({osoba:os,token:r.token})}ost=r.token}else ost=null}
    setTimeout(loop,120)};loop()})();
  st.tick=setInterval(()=>{if(PS!==st){clearInterval(st.tick);return}const z=opublikowany();if(z&&z.osoba!==OS.id&&Date.now()-start>1500)trafiony(z)},300);
 }
 let znakTemat=null;
 const schowajZnak=()=>{if(znakTemat){odsubskrybuj(znakTemat);znakTemat=null}try{const z=opublikowany();if(z&&z.osoba===OS.id)localStorage.removeItem(KZNAK)}catch(e){}};

 /* zaproszenie po stronie osoby pomagającej */
 function zaproszenie(id){
  ekran='zapro';
  const u=st.up.find(x=>x.id===id);if(!u||u.status!=='oczekuje'){ekranPomocy();return}
  const r=rel(OS.id,u.od);
  SP.pokaz('Zaproszenie',`
   <div class="sphero"><span class="pmav duzy" style="background-image:url(assets/foto-${u.od}.svg)"></span><h2>${nazwa(u.od)}${r?', Twoja '+r.rel:''}, prosi Cię o pomoc w sprawach urzędowych</h2></div>
   <div class="sppgr">Będziesz ${OS.plec==='K'?'mogła':'mógł'}</div>
   <div class="plist">${ZAKRESY.filter(z=>u.zakres.includes(z[0])).map(([k,t,s])=>`<div class="prow pmprow"><span class="pic">${svg('check')}</span><span class="ptx"><b>${t}</b><small>${s.replace('Twoje','jej').replace('Twoim imieniu','jej imieniu')}</small></span></div>`).join('')}</div>
   <div class="ui"><div class="rows">${rowsH([['Na',okresTxt(u)],['Każde działanie','widzi '+imie(u.od)]])}</div></div>
   <div id="spakcja"><button class="spbtn" id="pmtak">Przyjmij</button><button class="spbtn ghost" id="pmnie">Odrzuć</button></div>`,
   el=>{
    el.querySelector('#pmtak').onclick=async()=>{await faceid();st=wczytaj();const x=st.up.find(y=>y.id===id);if(!x)return;
     x.status='aktywne';x.zm=teraz();x.od_dnia=Date.now();x.do_dnia=x.koniec||(x.dni?Date.now()+x.dni*DAY:null);loguj(OS.id,x.od,rodzaj('przyjęła','przyjął')+' upoważnienie');zapisz();
     KTO=x.od;ekran=null;
     el.querySelector('#spakcja').innerHTML=`<div class="spok">${svg('check')}<b>Możesz już pomagać</b><div class="sptxt">${r&&r.relB==='mamę'?'Sprawy mamy są':'Sprawy: '+nazwa(x.od)+' są'} w „Twoich sprawach”.</div></div><button class="spbtn" id="pmidz">Przejdź do spraw</button>`;
     el.querySelector('#pmidz').onclick=()=>{SP.zamknij();idzDoSpraw(x.od)}};
    el.querySelector('#pmnie').onclick=()=>{st=wczytaj();const x=st.up.find(y=>y.id===id);if(x){x.status='odrzucone';x.zm=teraz();zapisz()}SP.zamknij()};
   });
 }
 function idzDoSpraw(k){KTO=k;if(window.ustawZakladke)ustawZakladke('skrzynka');if(window.odswiezStrone)odswiezStrone()}

 /* jeden punkt obsługi przycisków z data-pm (strona i arkusz) */
 function klik(b){
  const a=b.dataset.pm,id=b.dataset.id;
  if(a==='kto'){
   const seg=b.closest('.pmseg'),bt=seg?[...seg.querySelectorAll('button')]:[],od=bt.findIndex(x=>x.classList.contains('on')),do_=bt.indexOf(b);
   if(od===do_)return;
   segPrzed=od;KTO=b.dataset.k||null;if(window.odswiezStrone)odswiezStrone();
   /* wskaźnik przejeżdża pod nową opcję, a lista wjeżdża z tej strony, w którą przesuwa się wskaźnik */
   const pg=document.querySelector('#page'),ns=pg&&pg.querySelector('.pmseg');
   if(ns)requestAnimationFrame(()=>requestAnimationFrame(()=>{ns.style.setProperty('--i',do_);segPrzed=do_}));else segPrzed=do_;
   if(pg&&ns&&!SPOK()){const k=do_>od?1:-1;let i=0;for(let el=ns.nextElementSibling;el;el=el.nextElementSibling)
    el.animate([{opacity:0,transform:`translateX(${k*36}px)`},{opacity:1,transform:'none'}],{duration:380,delay:Math.min(i++,5)*25,easing:EASE,fill:'backwards'})}
   return}
  if(a==='zapro'){zaproszenie(id);return}
  if(a==='nowe'){const s0=zdejmij();kreator();przesun(s0,1,false);return}
  if(a==='mojznak'){mojZnak();return}
  if(a==='idz'){SP.zamknij();idzDoSpraw(b.dataset.k);return}
  const row=b.closest&&b.closest('.prow');
  if((a==='cofnij'||a==='rezygnuj'||a==='pros-tak'||a==='pros-nie')&&row&&!b.dataset.anim){
   b.dataset.anim=1;row.querySelectorAll('button').forEach(x=>x.disabled=true);
   zwin(row,a==='pros-tak'?'Dostęp rozszerzony':null).then(()=>{byloKl=null;klik(b)});return}
  st=wczytaj();
  if(a==='cofnij'||a==='rezygnuj'){const u=st.up.find(x=>x.id===id);if(u){const by=u.status;u.status='cofniete';u.zm=teraz();u.cofn=Date.now();u.kto_cofnal=OS.id;
    if(a==='rezygnuj'&&by==='aktywne')loguj(OS.id,u.od,rodzaj('zrezygnowała','zrezygnował')+' z upoważnienia');zapisz()}
   SP.toast(a==='cofnij'?'Dostęp cofnięty. Zmiana działa od razu.':'Zrezygnowano z upoważnienia.');ekranPomocy();return}
  if(a==='pros-tak'||a==='pros-nie'){const p=st.pros.find(x=>x.id===id);if(p){p.status=a==='pros-tak'?'tak':'nie';
    if(a==='pros-tak'){const u=st.up.find(x=>x.od===OS.id&&x.do===p.od&&zywe(x));if(u&&!u.zakres.includes(p.zakres))u.zm=teraz(),u.zakres=ZAKRESY.map(z=>z[0]).filter(k=>u.zakres.includes(k)||k===p.zakres)}zapisz()}
   SP.toast(a==='pros-tak'?'Dostęp rozszerzony.':'Prośba odrzucona.');ekranPomocy();return}
 }

 /* wpisy do „Kto sprawdzał moje dane” */
 function wpisyKto(){
  return st.log.filter(l=>l.za===OS.id&&!/upoważnieni/.test(l.co)).slice(0,6).map(l=>[`${nazwa(l.kto)} — upoważnienie`,l.co,D.fmt(new Date(l.t)),true]);
 }

 /* ---------- przekaźnik między urządzeniami ----------
    Bez własnego serwera: publiczny, darmowy przekaźnik ntfy.sh (wysyłka POST, odbiór przez SSE).
    Tematy: znak (zaproszenie po zeskanowaniu), osoba (zaproszenie po PESEL), upoważnienie (każda późniejsza zmiana).
    Idą tylko fikcyjne dane z prototypu. Gdy przekaźnik nie działa, zostaje synchronizacja w tej samej przeglądarce. */
 const PRZ='https://ntfy.sh/',PREF='mobywatel-koncepcja-v1-';
 const tematZnaku=t=>PREF+'znak-'+t,tematOsoby=id=>PREF+'osoba-'+id,tematUp=id=>PREF+'up-'+id;
 const teraz=()=>performance.timeOrigin+performance.now();   /* prawdziwy czas — symulowana data pokazu go nie zmienia */
 const subs=new Map(),wyslane={};
 function subskrybuj(t,since){if(subs.has(t)||typeof EventSource==='undefined')return;
  try{const es=new EventSource(PRZ+t+'/sse'+(since?'?since='+since:''));
   es.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.event&&m.event!=='message')return;odbierz(JSON.parse(m.message))}catch(x){}};
   subs.set(t,es)}catch(e){}}
 function odsubskrybuj(t){const es=subs.get(t);if(es){es.close();subs.delete(t)}}
 function wyslij(t,o){try{fetch(PRZ+t,{method:'POST',body:JSON.stringify(o)}).catch(()=>{})}catch(e){}}
 const para=(l,u)=>(l.kto===u.od&&l.za===u.do)||(l.kto===u.do&&l.za===u.od);
 function paczka(u){return {v:1,up:u,log:st.log.filter(l=>para(l,u)).slice(0,10),pros:st.pros.filter(p=>p.od===u.do&&p.do===u.od).slice(0,6),zal:{[u.od]:st.zal[u.od]||[]}}}
 const RANGA={oczekuje:0,aktywne:1,odrzucone:2,cofniete:2};
 const lepszy=(a,b)=>RANGA[a.status]!==RANGA[b.status]?RANGA[a.status]>RANGA[b.status]:(a.zm||0)>(b.zm||0);
 /* scalanie paczki z drugiego urządzenia — kolejność nie ma znaczenia, a powtórki niczego nie zmieniają */
 function odbierz(p){
  if(!p||p.v!==1||!p.up||!p.up.id)return;
  const stare=wczytaj();st=wczytaj();let zm=false;
  const x=st.up.find(y=>y.id===p.up.id);
  if(!x){st.up.unshift(p.up);zm=true}else if(lepszy(p.up,x)){Object.assign(x,p.up);zm=true}
  for(const l of p.log||[])if(!st.log.some(o=>o.t===l.t&&o.co===l.co&&o.kto===l.kto)){st.log.push(l);zm=true}
  st.log.sort((a,b)=>b.t-a.t);st.log=st.log.slice(0,40);
  for(const q of p.pros||[]){const o=st.pros.find(y=>y.id===q.id);if(!o){st.pros.unshift(q);zm=true}else if(o.status==='czeka'&&q.status!=='czeka'){o.status=q.status;zm=true}}
  for(const [k,v] of Object.entries(p.zal||{})){const z=new Set(st.zal[k]||[]);const n=z.size;v.forEach(h=>z.add(h));if(z.size!==n){st.zal[k]=[...z];zm=true}}
  wyslane[p.up.id]=JSON.stringify(paczka(st.up.find(y=>y.id===p.up.id)));
  if(!zm)return;
  try{localStorage.setItem(KLUCZ,JSON.stringify(st))}catch(e){}
  poZmianie(stare);rozeslij();
 }
 /* po każdej zmianie: wysyłamy paczki upoważnień, które dotyczą tej osoby i się zmieniły */
 function rozeslij(){
  for(const u of st.up){if(u.od!==OS.id&&u.do!==OS.id)continue;const j=JSON.stringify(paczka(u));if(wyslane[u.id]===j)continue;wyslane[u.id]=j;wyslij(tematUp(u.id),paczka(u))}
  synchronizuj();
 }
 /* słuchamy: swojego tematu osoby i każdego żywego upoważnienia, w którym biorę udział */
 function synchronizuj(){
  subskrybuj(tematOsoby(OS.id),null);
  const chce=new Set(st.up.filter(u=>(u.od===OS.id||u.do===OS.id)&&(u.status==='oczekuje'||u.status==='aktywne')).map(u=>tematUp(u.id)));
  chce.forEach(t=>subskrybuj(t,'2h'));
  [...subs.keys()].forEach(t=>{if(t.startsWith(PREF+'up-')&&!chce.has(t))odsubskrybuj(t)});
 }
 st.up.forEach(u=>{wyslane[u.id]=JSON.stringify(paczka(u))});
 setTimeout(synchronizuj,300);

 /* ---------- zmiany z drugiego telefonu: odśwież widok i powiedz, co się stało ---------- */
 function odswiez(){
  if(window.odswiezStrone){const p=document.querySelector('#page');const y=p?p.scrollTop:0;odswiezStrone();if(p)p.scrollTop=y}
  const otw=SP.sh.classList.contains('on');
  if(otw&&ekran==='pomoc')ekranPomocy();
 }
 addEventListener('storage',e=>{if(e.key!==KLUCZ)return;const stare=st;st=wczytaj();poZmianie(stare)});
 /* po zmianie z drugiego telefonu (ta sama przeglądarka albo przekaźnik): powiadomienia i odświeżenie */
 function poZmianie(stare){
  const nowe=(a,b)=>b.filter(x=>!a.some(y=>y.id===x.id));
  nowe(stare.up,st.up).filter(u=>u.do===OS.id&&u.status==='oczekuje').forEach(u=>{
   /* pokazywany znak został zeskanowany: od razu zaproszenie */
   if(ekran==='mojznak'){schowajZnak();if(ZS)zFinish({ok:true});zaproszenie(u.id);return}
   SP.toast(`${nazwa(u.od)} prosi Cię o pomoc w sprawach urzędowych`)});
  st.up.forEach(u=>{const s=stare.up.find(x=>x.id===u.id);if(!s||s.status===u.status)return;
   if(u.od===OS.id&&u.status==='aktywne')SP.toast(`${imie(u.do)} ${OSOBY[u.do].plec==='K'?'przyjęła':'przyjął'} upoważnienie`);
   if(u.do===OS.id&&u.status==='cofniete'){SP.toast(`${nazwa(u.od)} ${OSOBY[u.od].plec==='K'?'cofnęła':'cofnął'} upoważnienie`);if(KTO===u.od){KTO=null;if(SP.sh.classList.contains('on')&&ekran!=='pomoc')SP.zamknij()}}
   if(u.od===OS.id&&u.status==='cofniete'&&u.kto_cofnal!==OS.id)SP.toast(`${imie(u.do)} ${OSOBY[u.do].plec==='K'?'zrezygnowała':'zrezygnował'} z upoważnienia`);
   if(u.od===OS.id&&u.status==='odrzucone')SP.toast(`${imie(u.do)} ${OSOBY[u.do].plec==='K'?'odrzuciła':'odrzucił'} zaproszenie`)});
  st.up.forEach(u=>{const s=stare.up.find(x=>x.id===u.id);if(s&&u.do===OS.id&&u.zakres.length>s.zakres.length)SP.toast(`${imie(u.od)} ${OSOBY[u.od].plec==='K'?'rozszerzyła':'rozszerzył'} Twój dostęp`)});
  const nl=st.log.filter(l=>l.za===OS.id&&!stare.log.some(o=>o.t===l.t&&o.co===l.co));
  if(nl.length)SP.toast(`${imie(nl[0].kto)} ${nl[0].co}`);
  nowe(stare.pros,st.pros).filter(p=>p.do===OS.id).forEach(p=>SP.toast(`${imie(p.od)} prosi o dostęp: ${(ZAKRESY.find(q=>q[0]===p.zakres)||[,''])[1].toLowerCase()}`));
  /* sprawy załatwione przez drugą osobę */
  if(window.ZALATWIONE)(st.zal[OS.id]||[]).forEach(h=>Set.prototype.add.call(ZALATWIONE,h));
  odswiez();synchronizuj();
 }

 /* zamknięcie arkusza ze znakiem = znak przestaje działać */
 addEventListener('pagehide',schowajZnak);
 new MutationObserver(()=>{if(!SP.sh.classList.contains('on')&&ekran!=='mojznak'){ekran=null;byloKl=null}}).observe(SP.sh,{attributes:true,attributeFilter:['class']});
 /* Więcej → „Pomoc bliskiej osoby” otwiera nasz ekran */
 const ow=window.otworzWiecej;
 window.otworzWiecej=n=>n==='Pomoc bliskiej osoby'?ekranPomocy():(ekran=null,ow(n));
 window.POMOC={naglowek,strona,otworzSprawe,klik,wpisyKto,ekranPomocy,kreator,
  stan:()=>st,aktywneDlaMnie,odeMnie,nazwa,rel,
  reset:()=>{try{localStorage.removeItem(KLUCZ)}catch(e){}st=PUSTY();KTO=null;odswiez()}};
})();
