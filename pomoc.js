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
 function ekranPomocy(){
  ekran='pomoc';
  const moje=odeMnie(),dla=dlaMnie(),rodz=(RODZ[OS.id]||[]);
  const pros=st.pros.filter(p=>p.do===OS.id&&p.status==='czeka');
  const hist=st.log.filter(l=>l.za===OS.id).slice(0,8);
  SP.pokaz('Pomoc bliskiej osoby',`
   <div class="sptxt" style="margin-top:0">Ktoś, komu ufasz — z rodziny, przyjaciel albo sąsiad — może pomagać Ci w sprawach urzędowych na swoim telefonie. Ty decydujesz, w czym, i w każdej chwili możesz to cofnąć.</div>
   ${pros.length?`<div class="sppgr">Prośby</div><div class="plist">${pros.map(p=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${p.od}.svg)"></span><span class="ptx"><b>${nazwa(p.od)} prosi o dostęp</b><small>${(ZAKRESY.find(q=>q[0]===p.zakres)||[,''])[1]}</small>
     <span class="pmprz"><button class="pmmaly" data-pm="pros-tak" data-id="${p.id}">Zgadzam się</button><button class="pmmaly ghost" data-pm="pros-nie" data-id="${p.id}">Nie teraz</button></span></span></div>`).join('')}</div>`:''}
   <div class="sppgr">Pomagają Ci</div>
   ${moje.length?`<div class="plist">${moje.map(u=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${u.do}.svg)"></span><span class="ptx"><b>${nazwa(u.do)}${rel(OS.id,u.do)?', '+rel(OS.id,u.do).rel:''}</b>
     <small>${u.status==='oczekuje'?'Czeka na przyjęcie zaproszenia':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz"><button class="pmmaly ghost pmcofnij" data-pm="cofnij" data-id="${u.id}">${u.status==='oczekuje'?'Anuluj zaproszenie':'Cofnij dostęp'}</button></span></span></div>`).join('')}</div>`
    :`<div class="pmpusto">Nikt nie ma teraz dostępu do Twoich spraw.</div>`}
   <button class="spbtn" data-pm="nowe">${ico('users')}Upoważnij bliską osobę</button>
   ${hist.length?`<div class="sppgr">Co zrobiono w Twoim imieniu</div><div class="plist">${hist.map(l=>`<div class="prow pmprow"><span class="pic">${svg('check')}</span><span class="ptx"><b>${imie(l.kto)} ${esc(l.co)}</b><small>${D.fmt(new Date(l.t))}, ${new Date(l.t).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</small></span></div>`).join('')}</div>`:''}
   ${dla.length?`<div class="sppgr">Pomagasz</div><div class="plist">${dla.map(u=>`<div class="prow pmprow"><span class="pmav" style="background-image:url(assets/foto-${u.od}.svg)"></span><span class="ptx"><b>${nazwa(u.od)}${rel(OS.id,u.od)?', '+rel(OS.id,u.od).rel:''}</b>
     <small>${u.status==='oczekuje'?'Zaprasza Cię do pomocy':'Aktywne '+doKiedy(u)}</small><small>${cap(zakresTxt(u.zakres))}</small>
     <span class="pmprz">${u.status==='oczekuje'?`<button class="pmmaly" data-pm="zapro" data-id="${u.id}">Zobacz zaproszenie</button>`:`<button class="pmmaly" data-pm="idz" data-k="${u.od}">${rel(OS.id,u.od)&&rel(OS.id,u.od).relB==='mamę'?'Sprawy mamy':'Przejdź do spraw'}</button><button class="pmmaly ghost" data-pm="rezygnuj" data-id="${u.id}">Zrezygnuj</button>`}</span></span></div>`).join('')}</div>`:''}
   <div class="sppgr">Chcesz pomagać komuś bliskiemu?</div>
   <div class="plist"><button class="prow" data-pm="mojznak"><span class="pic">${ico('scan')}</span><span class="ptx"><b>Pokaż mój znak</b><small>Ta osoba skanuje go w swoim telefonie i sama decyduje, w czym możesz pomagać.</small></span>${ico('chev','pch')}</button></div>
   ${OSTRZ}
   <div class="pmstopka">${ico('shield')}<span>Upoważniona osoba nie widzi Twoich dokumentów i niczego za Ciebie nie podpisze. Wszystko, co zrobi, zobaczysz tutaj i w „Kto sprawdzał moje dane”.</span></div>`,
   el=>el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>klik(b)));
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

 /* kreator u osoby, która daje dostęp: jak znaleźć osobę → potwierdź osobę → w czym → na jak długo */
 function kreator(w){
  ekran='kreator';
  w=w||{krok:1,do:null,przez:null,zakres:['sprawy','oplaty'],okres:'rok'};
  const N=4,nr=typeof w.krok==='number'?w.krok:1,kropki=`<div class="pmkroki" aria-label="Krok ${nr} z ${N}">${Array.from({length:N},(_,n)=>`<i class="${n<nr?'on':''}"></i>`).join('')}</div>`;
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
   h=`${kropki}<h2 class="pmh">Na jak długo?</h2>
   <div class="pmokres">${OKRESY.map(([k,l])=>`<button data-ok="${k}" class="${w.okres===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="ui"><div class="rows">${rowsH([['Komu',nazwa(w.do)+(r?', '+r.rel:'')],['W czym',cap(zakresTxt(w.zakres))],['Do kiedy',ok[2]?D.fmt(new Date(Date.now()+ok[2]*DAY)):'do odwołania']])}</div></div>
   ${OSTRZ}
   <div class="sptxt">${kogo} dostanie zaproszenie w swojej aplikacji. Dostęp zacznie działać, gdy je przyjmie. Cofniesz go w każdej chwili.</div>
   <button class="spbtn" data-dalej>Potwierdź i wyślij</button>`}
  SP.pokaz('Upoważnij bliską osobę',h,el=>{
   el.querySelectorAll('[data-spos]').forEach(b=>b.onclick=()=>{if(b.dataset.spos==='znak'){skanuj(w);return}w.krok=b.dataset.spos;kreator(w)});
   el.querySelectorAll('[data-zk]').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true')return;const k=b.dataset.zk;w.zakres=w.zakres.includes(k)?w.zakres.filter(x=>x!==k):[...w.zakres,k];
    b.setAttribute('aria-checked',w.zakres.includes(k));b.querySelector('.spsw').classList.toggle('on',w.zakres.includes(k))});
   el.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{w.okres=b.dataset.ok;kreator(w)});
   const nowa=el.querySelector('[data-od-nowa]');if(nowa)nowa.onclick=()=>kreator();
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
    st.up.unshift({id:'u'+Date.now(),od:OS.id,do:w.do,przez:w.przez,zakres:ZAKRESY.map(z=>z[0]).filter(k=>w.zakres.includes(k)),okres:w.okres,dni:ok[2],utw:Date.now(),status:'oczekuje'});
    zapisz();ekran='pomoc';
    const box=SP.sh.querySelector('.body');
    box.innerHTML=`<div class="spok">${svg('check')}<b>Zaproszenie wysłane</b><div class="sptxt">${kogo} zobaczy je w swojej aplikacji, w „Twoich sprawach”. Gdy je przyjmie, dostaniesz powiadomienie.</div></div>
     <div id="spakcja"><button class="spbtn ghost" data-wroc>Gotowe</button></div>`;
    box.querySelector('[data-wroc]').onclick=()=>ekranPomocy();
   };
  });
 }

 /* osoba pomagająca pokazuje swój znak — ten sam ekran co „Przyjmij dane” pod „Skanuj” (nic nie wpisuje i o nic nie prosi) */
 function mojZnak(){
  const token=tokenOsoby(OS.id);
  try{localStorage.setItem(KZNAK,JSON.stringify({osoba:OS.id,token,t:Date.now()}))}catch(e){}
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
  const trafiony=z=>{if(koniec||PS!==st)return;const n=czyMozna(z.osoba);if(n){hint(n);return}koniec=true;
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
     if(os){if(ost===r.token){if(os===OS.id)hint('To Twój własny znak.');else trafiony({osoba:os})}ost=r.token}else ost=null}
    setTimeout(loop,120)};loop()})();
  st.tick=setInterval(()=>{if(PS!==st){clearInterval(st.tick);return}const z=opublikowany();if(z&&z.osoba!==OS.id&&Date.now()-start>1500)trafiony(z)},300);
 }
 const schowajZnak=()=>{try{const z=opublikowany();if(z&&z.osoba===OS.id)localStorage.removeItem(KZNAK)}catch(e){}};

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
     el.querySelector('#spakcja').innerHTML=`<div class="spok">${svg('check')}<b>Możesz już pomagać</b><div class="sptxt">${r&&r.relB==='mamę'?'Sprawy mamy są':'Sprawy: '+nazwa(x.od)+' są'} w „Twoich sprawach”.</div></div><button class="spbtn" id="pmidz">Przejdź do spraw</button>`;
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
  if(a==='mojznak'){mojZnak();return}
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
  odswiez();
 });

 /* zamknięcie arkusza ze znakiem = znak przestaje działać */
 addEventListener('pagehide',schowajZnak);
 /* Więcej → „Pomoc bliskiej osoby” otwiera nasz ekran */
 const ow=window.otworzWiecej;
 window.otworzWiecej=n=>n==='Pomoc bliskiej osoby'?ekranPomocy():(ekran=null,ow(n));
 window.POMOC={naglowek,strona,otworzSprawe,klik,wpisyKto,ekranPomocy,kreator,
  stan:()=>st,aktywneDlaMnie,odeMnie,nazwa,rel,
  reset:()=>{try{localStorage.removeItem(KLUCZ)}catch(e){}st=PUSTY();KTO=null;odswiez()}};
})();
