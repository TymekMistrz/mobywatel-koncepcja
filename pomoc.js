/* ---------- Pomoc bliskiej osoby: upoważnienia w rodzinie ----------
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
 const OKRESY=[['miesiac','1 miesiąc',30],['rok','1 rok',365],['bez','Do odwołania',0]];
 const PUSTY=()=>({up:[],log:[],zal:{},pros:[]});
 const ico=(k,c)=>window.icoH?icoH(k,c):'';
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

 /* ---------- stan wspólny dla wszystkich okien ---------- */
 function wczytaj(){try{const s=JSON.parse(localStorage.getItem(KLUCZ));if(s&&s.up)return Object.assign(PUSTY(),s)}catch(e){}return PUSTY()}
 let st=wczytaj();
 function zapisz(){try{localStorage.setItem(KLUCZ,JSON.stringify(st))}catch(e){}odswiez()}
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
 let KTO=null;   /* czyje sprawy oglądam: null = moje, albo id osoby, która dała mi upoważnienie */
 function naglowek(){
  const p=st.up.filter(u=>u.do===OS.id&&u.status==='oczekuje');
  const a=aktywneDlaMnie();
  let h=p.map(u=>`<button class="pmbaner" data-pm="zapro" data-id="${u.id}"><span class="pmav" style="background-image:url(assets/foto-${u.od}.svg)"></span>
    <span class="ptx"><b>${nazwa(u.od)} prosi Cię o pomoc</b><small>Zobacz, w czym możesz ${rel(OS.id,u.od)?'pomagać '+rel(OS.id,u.od).relD:'pomagać'}</small></span>${ico('chev','pch')}</button>`).join('');
  if(a.length)h+=`<div class="pmseg" role="tablist">${[['','Moje sprawy'],...a.map(u=>[u.od,rel(OS.id,u.od)?cap(rel(OS.id,u.od).rel):imie(u.od)])].map(([k,l])=>
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
   <div class="pgr">Sprawy ${r?r.relB==='mamę'?'mamy':'córki':imie(KTO)} · ${t.length}</div>
   <div class="plist">${t.map((x,i)=>{const moze=!x.z||u.zakres.includes(x.z);const ok=z.has(x.h);
    return `<button class="prow" data-h="${i}"><span class="pic ${x.u&&!ok?'pil':''}">${ico(moze?(x.i==='car'?'car':x.i==='coin'?'coin':x.i==='doc'?'doc':'mail'):'lock')}</span><span class="ptx"><b>${x.h}</b>${ok?'<small class="gotowe">Załatwione</small>':`<small class="${x.u?'pilne':''}">${x.d}</small>`}<small>${moze?'':'Bez dostępu: '+(ZAKRESY.find(q=>q[0]===x.z)||[,''])[1].toLowerCase()}</small></span>${ico('chev','pch')}</button>`}).join('')}</div>
   <div class="pmstopka">${ico('shield')}<span>${imie(KTO)} widzi w swojej aplikacji wszystko, co tu zrobisz. Dokumentów ${r&&r.relB==='mamę'?'mamy':''} nie zobaczysz i niczego za nią nie podpiszesz.</span></div>`;
 }

 /* sprawa osoby, która dała upoważnienie — akcje tylko w udzielonym zakresie */
 function otworzSprawe(i){
  const u=aktywneDlaMnie().find(x=>x.od===KTO);if(!u)return;
  const t=OSOBY[KTO].tiles[i],kto=KTO,r=rel(OS.id,kto),moze=!t.z||u.zakres.includes(t.z);
  const z=zal(kto),s=SP.stan(t,z),d=D.data(t.d),kw=((/([\d\s]+(?:,\d{2})?)\s*zł/.exec(t.d)||[])[1]||'').trim();
  const kogo=r?(r.relB==='mamę'?'mamy':'córki'):imie(kto);
  const wiersze=[['W imieniu',nazwa(kto)]];if(d)wiersze.push(['Termin',d+(D.termin(d)?' ('+D.termin(d)+')':'')]);else wiersze.push(['Status',t.d]);
  let akcja='';
  if(!moze)akcja=`<div class="spnote pmlock">${ico('lock')}<span>${cap(r?r.rel:imie(kto))} nie dał${OSOBY[kto].plec==='K'?'a':''} Ci dostępu do: <b>${(ZAKRESY.find(q=>q[0]===t.z)||[,''])[1].toLowerCase()}</b>.</span></div>
    <button class="spbtn" id="pmpros">Poproś o dostęp</button>`;
  else if(z.has(t.h))akcja='';
  else if(t.k==='pay')akcja=`<button class="spbtn" id="pmgo">Zapłać ${kw} zł za ${r&&r.relB==='mamę'?'mamę':imie(kto)}</button>`;
  else if(t.k==='recepty')akcja=`<button class="spbtn" id="pmgo">Pokaż kody recept</button>`;
  else if(t.k==='letter')akcja=`<button class="spbtn" id="pmgo">Przeczytaj pismo</button>`;
  SP.pokaz('Sprawa '+kogo,`
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
 function ekranPomocy(){
  ekran='pomoc';
  const moje=odeMnie(),dla=dlaMnie(),rodz=(RODZ[OS.id]||[]);
  const pros=st.pros.filter(p=>p.do===OS.id&&p.status==='czeka');
  const hist=st.log.filter(l=>l.za===OS.id).slice(0,8);
  const wolni=rodz.filter(r=>!moje.some(u=>u.do===r.id));
  SP.pokaz('Pomoc bliskiej osoby',`
   <div class="sptxt" style="margin-top:0">Bliska osoba może pomagać Ci w sprawach urzędowych na swoim telefonie. Ty decydujesz, w czym, i w każdej chwili możesz to cofnąć.</div>
   ${pros.length?`<div class="sppgr">Prośby</div><div class="plist">${pros.map(p=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${p.od}.svg)"></span><span class="ptx"><b>${nazwa(p.od)} prosi o dostęp</b><small>${(ZAKRESY.find(q=>q[0]===p.zakres)||[,''])[1]}</small>
     <span class="pmprz"><button class="pmmaly" data-pm="pros-tak" data-id="${p.id}">Zgadzam się</button><button class="pmmaly ghost" data-pm="pros-nie" data-id="${p.id}">Nie teraz</button></span></span></div>`).join('')}</div>`:''}
   <div class="sppgr">Pomagają Ci</div>
   ${moje.length?`<div class="plist">${moje.map(u=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${u.do}.svg)"></span><span class="ptx"><b>${nazwa(u.do)}${rel(OS.id,u.do)?', '+rel(OS.id,u.do).rel:''}</b>
     <small>${u.status==='oczekuje'?'Czeka na przyjęcie zaproszenia':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz"><button class="pmmaly ghost pmcofnij" data-pm="cofnij" data-id="${u.id}">${u.status==='oczekuje'?'Anuluj zaproszenie':'Cofnij dostęp'}</button></span></span></div>`).join('')}</div>`
    :`<div class="pmpusto">Nikt nie ma teraz dostępu do Twoich spraw.</div>`}
   ${wolni.length||!rodz.length?`<button class="spbtn" data-pm="nowe">${ico('users')}Upoważnij bliską osobę</button>`:''}
   ${hist.length?`<div class="sppgr">Co zrobiono w Twoim imieniu</div><div class="plist">${hist.map(l=>`<div class="prow pmprow"><span class="pic">${svg('check')}</span><span class="ptx"><b>${imie(l.kto)} ${esc(l.co)}</b><small>${D.fmt(new Date(l.t))}, ${new Date(l.t).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</small></span></div>`).join('')}</div>`:''}
   ${dla.length?`<div class="sppgr">Pomagasz</div><div class="plist">${dla.map(u=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${u.od}.svg)"></span><span class="ptx"><b>${nazwa(u.od)}${rel(OS.id,u.od)?', '+rel(OS.id,u.od).rel:''}</b>
     <small>${u.status==='oczekuje'?'Zaprasza Cię do pomocy':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz">${u.status==='oczekuje'?`<button class="pmmaly" data-pm="zapro" data-id="${u.id}">Zobacz zaproszenie</button>`:`<button class="pmmaly" data-pm="idz" data-k="${u.od}">Sprawy ${rel(OS.id,u.od)&&rel(OS.id,u.od).relB==='mamę'?'mamy':imie(u.od)}</button><button class="pmmaly ghost" data-pm="rezygnuj" data-id="${u.id}">Zrezygnuj</button>`}</span></span></div>`).join('')}</div>`:''}
   <div class="pmstopka">${ico('shield')}<span>Upoważniona osoba nie widzi Twoich dokumentów i niczego za Ciebie nie podpisze. Wszystko, co zrobi, zobaczysz tutaj i w „Kto sprawdzał moje dane”.</span></div>`,
   el=>el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>klik(b)));
 }

 /* kreator: komu → w czym → na jak długo → potwierdzenie */
 function kreator(w){
  ekran='kreator';
  const rodz=(RODZ[OS.id]||[]).filter(r=>!odeMnie().some(u=>u.do===r.id));
  if(!rodz.length){SP.pokaz('Upoważnij bliską osobę',`<div class="sptxt" style="margin-top:0">W rejestrze PESEL nie ma dorosłych dzieci ani rodziców, którym możesz dać dostęp.</div>
   <div class="spnote">${ico('help')}<span>W tym prototypie upoważnienie pokazujemy na przykładzie Haliny Lis i jej córki Ewy Nowak. Wybierz Halinę w panelu pokazu.</span></div>`);return}
  w=w||{krok:1,do:rodz[0].id,zakres:['sprawy','oplaty'],okres:'rok'};
  const kropki=`<div class="pmkroki" aria-label="Krok ${w.krok} z 3">${[1,2,3].map(n=>`<i class="${n<=w.krok?'on':''}"></i>`).join('')}</div>`;
  let h='';
  if(w.krok===1)h=`${kropki}<h2 class="pmh">Komu chcesz dać dostęp?</h2><div class="sptxt">Z rejestru PESEL: Twoja rodzina, która ma mObywatela.</div>
   <div class="plist">${rodz.map(r=>`<button class="prow pmwyb ${w.do===r.id?'on':''}" data-do="${r.id}"><span class="pmav" style="background-image:url(assets/foto-${r.id}.svg)"></span><span class="ptx"><b>${nazwa(r.id)}</b><small>${cap(r.rel)}</small></span><span class="pmradio"></span></button>`).join('')}</div>
   <button class="spbtn" data-dalej>Dalej</button>`;
  if(w.krok===2)h=`${kropki}<h2 class="pmh">W czym ${imie(w.do)} może pomagać?</h2>
   <div class="plist">${ZAKRESY.map(([k,t,s,staly])=>SP.przelacznik(t,s+(staly?' · zawsze':''),w.zakres.includes(k)).replace('class="prow sw"',`class="prow sw" data-z="${k}" ${staly?'aria-disabled="true"':''}`)).join('')}</div>
   <div class="spnote">${ico('lock')}<span>${imie(w.do)} nie zobaczy Twoich dokumentów i niczego za Ciebie nie podpisze.</span></div>
   <button class="spbtn" data-dalej>Dalej</button>`;
  if(w.krok===3){const ok=OKRESY.find(o=>o[0]===w.okres);
   h=`${kropki}<h2 class="pmh">Na jak długo?</h2>
   <div class="pmokres">${OKRESY.map(([k,l])=>`<button data-ok="${k}" class="${w.okres===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="ui"><div class="rows">${rowsH([['Komu',nazwa(w.do)+', '+rel(OS.id,w.do).rel],['W czym',cap(zakresTxt(w.zakres))],['Do kiedy',ok[2]?D.fmt(new Date(Date.now()+ok[2]*DAY)):'do odwołania']])}</div></div>
   <div class="sptxt">${imie(w.do)} dostanie zaproszenie w swojej aplikacji. Dostęp zacznie działać, gdy je przyjmie.</div>
   <button class="spbtn" data-dalej>Potwierdź i wyślij</button>`}
  SP.pokaz('Upoważnij bliską osobę',h,el=>{
   el.querySelectorAll('[data-do]').forEach(b=>b.onclick=()=>{w.do=b.dataset.do;kreator(w)});
   el.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true')return;const k=b.dataset.z;w.zakres=w.zakres.includes(k)?w.zakres.filter(x=>x!==k):[...w.zakres,k];
    b.setAttribute('aria-checked',w.zakres.includes(k));b.querySelector('.spsw').classList.toggle('on',w.zakres.includes(k))});
   el.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{w.okres=b.dataset.ok;kreator(w)});
   const d=el.querySelector('[data-dalej]');
   d.onclick=async()=>{
    if(w.krok<3){w.krok++;kreator(w);return}
    await faceid();
    st=wczytaj();const ok=OKRESY.find(o=>o[0]===w.okres);
    st.up.unshift({id:'u'+Date.now(),od:OS.id,do:w.do,zakres:ZAKRESY.map(z=>z[0]).filter(k=>w.zakres.includes(k)),okres:w.okres,dni:ok[2],utw:Date.now(),status:'oczekuje'});
    zapisz();ekran='pomoc';
    const box=SP.sh.querySelector('.body');
    box.innerHTML=`<div class="spok">${svg('check')}<b>Zaproszenie wysłane</b><div class="sptxt">${imie(w.do)} zobaczy je w swojej aplikacji, w „Twoich sprawach”. Gdy je przyjmie, dostaniesz powiadomienie.</div></div>
     <div id="spakcja"><button class="spbtn ghost" data-wroc>Gotowe</button></div>`;
    box.querySelector('[data-wroc]').onclick=()=>ekranPomocy();
   };
  });
 }

 /* zaproszenie po stronie osoby pomagającej */
 function zaproszenie(id){
  ekran='zapro';
  const u=st.up.find(x=>x.id===id);if(!u||u.status!=='oczekuje'){ekranPomocy();return}
  const r=rel(OS.id,u.od);
  SP.pokaz('Zaproszenie',`
   <div class="sphero"><span class="pmav duzy" style="background-image:url(assets/foto-${u.od}.svg)"></span><h2>${nazwa(u.od)}${r?', Twoja '+r.rel:''}, prosi Cię o pomoc w sprawach urzędowych</h2></div>
   <div class="sppgr">Będziesz ${OS.plec==='K'?'mogła':'mógł'}</div>
   <div class="plist">${ZAKRESY.filter(z=>u.zakres.includes(z[0])).map(([k,t,s])=>`<div class="prow pmprow"><span class="pic">${svg('check')}</span><span class="ptx"><b>${t}</b><small>${s.replace('Twoje','jej').replace('Twoim imieniu','jej imieniu')}</small></span></div>`).join('')}</div>
   <div class="ui"><div class="rows">${rowsH([['Na',(OKRESY.find(o=>o[0]===u.okres)||[,''])[1].toLowerCase()],['Każde działanie','widzi '+imie(u.od)]])}</div></div>
   <div id="spakcja"><button class="spbtn" id="pmtak">Przyjmij</button><button class="spbtn ghost" id="pmnie">Odrzuć</button></div>`,
   el=>{
    el.querySelector('#pmtak').onclick=async()=>{await faceid();st=wczytaj();const x=st.up.find(y=>y.id===id);if(!x)return;
     x.status='aktywne';x.od_dnia=Date.now();x.do_dnia=x.dni?Date.now()+x.dni*DAY:null;loguj(OS.id,x.od,rodzaj('przyjęła','przyjął')+' upoważnienie');zapisz();
     KTO=x.od;ekran=null;
     el.querySelector('#spakcja').innerHTML=`<div class="spok">${svg('check')}<b>Możesz już pomagać</b><div class="sptxt">Sprawy ${r&&r.relB==='mamę'?'mamy':imie(x.od)} są w „Twoich sprawach”.</div></div><button class="spbtn" id="pmidz">Przejdź do spraw</button>`;
     el.querySelector('#pmidz').onclick=()=>{SP.zamknij();idzDoSpraw(x.od)}};
    el.querySelector('#pmnie').onclick=()=>{st=wczytaj();const x=st.up.find(y=>y.id===id);if(x){x.status='odrzucone';zapisz()}SP.zamknij()};
   });
 }
 function idzDoSpraw(k){KTO=k;if(window.ustawZakladke)ustawZakladke('skrzynka');if(window.odswiezStrone)odswiezStrone()}

 /* jeden punkt obsługi przycisków z data-pm (strona i arkusz) */
 function klik(b){
  const a=b.dataset.pm,id=b.dataset.id;
  if(a==='kto'){KTO=b.dataset.k||null;if(window.odswiezStrone)odswiezStrone();return}
  if(a==='zapro'){zaproszenie(id);return}
  if(a==='nowe'){kreator();return}
  if(a==='idz'){SP.zamknij();idzDoSpraw(b.dataset.k);return}
  st=wczytaj();
  if(a==='cofnij'||a==='rezygnuj'){const u=st.up.find(x=>x.id===id);if(u){const by=u.status;u.status='cofniete';u.cofn=Date.now();u.kto_cofnal=OS.id;
    if(a==='rezygnuj'&&by==='aktywne')loguj(OS.id,u.od,rodzaj('zrezygnowała','zrezygnował')+' z upoważnienia');zapisz()}
   SP.toast(a==='cofnij'?'Dostęp cofnięty. Zmiana działa od razu.':'Zrezygnowano z upoważnienia.');ekranPomocy();return}
  if(a==='pros-tak'||a==='pros-nie'){const p=st.pros.find(x=>x.id===id);if(p){p.status=a==='pros-tak'?'tak':'nie';
    if(a==='pros-tak'){const u=st.up.find(x=>x.od===OS.id&&x.do===p.od&&zywe(x));if(u&&!u.zakres.includes(p.zakres))u.zakres=ZAKRESY.map(z=>z[0]).filter(k=>u.zakres.includes(k)||k===p.zakres)}zapisz()}
   SP.toast(a==='pros-tak'?'Dostęp rozszerzony.':'Prośba odrzucona.');ekranPomocy();return}
 }

 /* wpisy do „Kto sprawdzał moje dane” */
 function wpisyKto(){
  return st.log.filter(l=>l.za===OS.id&&!/upoważnieni/.test(l.co)).slice(0,6).map(l=>[`${nazwa(l.kto)} — upoważnienie`,l.co,D.fmt(new Date(l.t)),true]);
 }

 /* ---------- zmiany z drugiego telefonu: odśwież widok i powiedz, co się stało ---------- */
 function odswiez(){
  if(window.odswiezStrone){const p=document.querySelector('#page');const y=p?p.scrollTop:0;odswiezStrone();if(p)p.scrollTop=y}
  const otw=SP.sh.classList.contains('on');
  if(otw&&ekran==='pomoc')ekranPomocy();
 }
 addEventListener('storage',e=>{
  if(e.key!==KLUCZ)return;
  const stare=st;st=wczytaj();
  const nowe=(a,b)=>b.filter(x=>!a.some(y=>y.id===x.id));
  nowe(stare.up,st.up).filter(u=>u.do===OS.id&&u.status==='oczekuje').forEach(u=>SP.toast(`${nazwa(u.od)} prosi Cię o pomoc w sprawach urzędowych`));
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
  odswiez();
 });

 /* Więcej → „Pomoc bliskiej osoby” otwiera nasz ekran */
 const ow=window.otworzWiecej;
 window.otworzWiecej=n=>n==='Pomoc bliskiej osoby'?ekranPomocy():(ekran=null,ow(n));
 window.POMOC={naglowek,strona,otworzSprawe,klik,wpisyKto,ekranPomocy,kreator,
  stan:()=>st,aktywneDlaMnie,odeMnie,nazwa,rel,
  reset:()=>{try{localStorage.removeItem(KLUCZ)}catch(e){}st=PUSTY();KTO=null;odswiez()}};
})();
