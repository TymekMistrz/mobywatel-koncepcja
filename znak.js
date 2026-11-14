/* ---------- Potwierdź swoje dane: jeden skaner. Skanujesz znak aplikacji podmiotu (telefonu obok albo strony na komputerze)
   i po Face ID przekazujesz mu swoje dane w zakresie, o który prosi. Znak to zmieniający się żeton w pierścieniu kropek. ---------- */
const DEV=(()=>{try{let d=sessionStorage.getItem('mobDev');if(!d){d=Math.random().toString(36).slice(2,10);sessionStorage.setItem('mobDev',d)}return d}catch(e){return Math.random().toString(36).slice(2,10)}})();
const QI={x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',pc:'<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',ph:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',inbox:'<path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/><path d="M5.5 6.5h13L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5z"/><path d="M12 3v7M9.5 7.5 12 10l2.5-2.5"/>'};
const qsvg=(n,w=1.8)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${QI[n]||I[n]||''}</svg>`;
const hhmm=()=>new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const API=(u,b)=>fetch(u,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{cache:'no-store'}).then(r=>r.json());
const E=x=>esc(String(x==null?'':x));
const rowsHTML=rows=>rows.map(([k,v])=>`<div class="drow"><span>${E(k)}</span>${v==='foto'?'<span class="dph"><span class="ph"></span></span>':`<b>${E(v)}</b>`}</div>`).join('');

/* moje dane (z portfela) i zakresy, o które może prosić znak */
const MOJE=Object.assign({foto:'foto'},OS.moje);
const ZAKRESY={
 tozsamosc:{nazwa:'Tożsamość',pola:[['Zdjęcie','foto'],['Imię i nazwisko','imie_nazwisko'],['Data urodzenia','data_urodzenia'],['PESEL','pesel'],['Dowód osobisty','dowod']]},
 pelnoletnosc:{nazwa:'Pełnoletność',pola:[['Zdjęcie','foto'],['Pełnoletność','pelnoletnosc']]},
 prawo_jazdy:{nazwa:'Prawo jazdy',pola:[['Zdjęcie','foto'],['Imię i nazwisko','imie_nazwisko'],['Prawo jazdy','prawo_jazdy']]},
 mstluczka:{nazwa:'Dane do oświadczenia',pola:[['Kierowca','imie_nazwisko'],['Pojazd','pojazd'],['OC','oc'],['Prawo jazdy','prawo_jazdy']]}
};
const wypelnij=pola=>pola.map(([l,k])=>[l,MOJE[k]||k]);

/* ---------- mój znak: żeton zmienia się co 30 s, serwer wie, do kogo należy ---------- */
let TOKEN=0,TOKEN_T=0,MOJ_CEL='tozsamosc',ZS=null;
function nowyToken(){TOKEN=Math.floor(Math.random()*65536);TOKEN_T=Date.now();rysujZnaki()}
function rysujZnaki(){document.querySelectorAll('.live').forEach(el=>{el.innerHTML=ZNAK.svg(TOKEN)});const b=$('#mojZnak');if(b)animujZnak(b,ZNAK.svg(TOKEN))}
/* Zmiana znaku: stare kropki „wirują” do środka po spirali, flaga pulsuje, a nowy pierścień
   rysuje się po okręgu jak wskazówka — kropki zapalają się kolejno zgodnie z ruchem wskazówek zegara. */
function animujZnak(el,nowy){
 const stary=el.querySelector('svg.znak');
 if(!stary||matchMedia('(prefers-reduced-motion: reduce)').matches){el.innerHTML=nowy;return}
 const E='cubic-bezier(.4,0,.2,1)';
 const g=stary.querySelector('g.kropki')||(()=>{const gg=document.createElementNS('http://www.w3.org/2000/svg','g');gg.setAttribute('class','kropki');stary.querySelectorAll('circle:not(:first-child)').forEach(c=>gg.append(c));stary.insertBefore(gg,stary.querySelector('image'));return gg})();
 g.animate([{transform:'rotate(0) scale(1)',opacity:1},{transform:'rotate(120deg) scale(.35)',opacity:0}],{duration:280,easing:'ease-in',fill:'forwards'});
 const fl=stary.querySelector('image');fl&&fl.animate([{transform:'scale(1)'},{transform:'scale(.86)'}],{duration:280,easing:E,fill:'forwards'});
 setTimeout(()=>{el.innerHTML=nowy;wejscieZnaku(el)},260);
}
/* rysowanie pierścienia: łuk obiega okrąg, kropki zapalają się kolejno (przy zmianie znaku i przy otwarciu ekranu) */
function wejscieZnaku(el,op=0){
  const sv=el.querySelector('svg.znak');if(!sv||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const E='cubic-bezier(.4,0,.2,1)';
  /* wskazówka: cienki łuk obiega pierścień */
  const NS='http://www.w3.org/2000/svg',luk=document.createElementNS(NS,'circle');
  luk.setAttribute('r','37');luk.setAttribute('fill','none');luk.setAttribute('stroke','#dc143c');luk.setAttribute('stroke-width','1.2');luk.setAttribute('stroke-linecap','round');
  luk.setAttribute('pathLength','100');luk.setAttribute('transform','rotate(-90)');luk.setAttribute('class','luk');sv.insertBefore(luk,sv.querySelector('image'));
  luk.animate([{strokeDasharray:'0 100',opacity:.9},{strokeDasharray:'100 0',opacity:.9,offset:.85},{strokeDasharray:'100 0',opacity:0}],{duration:620,delay:op,easing:E,fill:'both'}).finished.then(()=>luk.remove());
  /* kropki zapalają się w kolejności kąta */
  sv.querySelectorAll('circle:not(:first-child):not(.luk)').forEach(c=>{
   const k=(Math.atan2(+c.getAttribute('cy'),+c.getAttribute('cx'))+Math.PI/2+2*Math.PI)%(2*Math.PI)/(2*Math.PI);
   c.style.transformBox='fill-box';c.style.transformOrigin='center';
   c.animate([{transform:'scale(0)',opacity:0},{transform:'scale(1.6)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:300,delay:op+k*520,easing:'ease-out',fill:'backwards'});
  });
  const f2=sv.querySelector('image');f2&&(f2.style.transformBox='fill-box',f2.style.transformOrigin='center',f2.animate([{transform:'scale(.86)'},{transform:'scale(1.06)',offset:.5},{transform:'scale(1)'}],{duration:420,delay:op,easing:E,fill:'backwards'}));
}
nowyToken();setInterval(nowyToken,30000);
new MutationObserver(()=>{if(document.querySelector('.live:empty'))rysujZnaki()}).observe(document.body,{childList:true,subtree:true});
async function beat(){
 if(document.visibilityState!=='visible')return;
 const z=ZAKRESY[MOJ_CEL];
 try{const j=await API('/api/znak/beat',{dev:DEV,token:TOKEN,kind:'telefon',kto:'Telefon z aplikacją',cel:MOJ_CEL,zakres:z.pola});
  if(j.zmien)nowyToken();
  if(ZS){const w=$('#zx .wait');if(w&&!w.dataset.odm)w.innerHTML=j.skanuje?'<i></i>Druga osoba potwierdza przekazanie…':'<i></i>Czekam na dane…'}
  (j.otrzymane||[]).forEach(d=>odebrano(d))}catch(e){}
}
setInterval(beat,1200);

/* ---------- ekrany ---------- */
let PS=null;
function pMount(id='qrx'){let o=$('#'+id);if(!o){o=el(`<div class="qrx" id="${id}" role="dialog" aria-modal="true"></div>`);app.append(o)}return o}
function pScreen(html,cls='',id='qrx'){const o=pMount(id);const juz=o.classList.contains('on');o.className='qrx '+cls;o.innerHTML=html;if(!juz)void o.offsetWidth;o.classList.add('on');/* wjazd od dołu przy pierwszym otwarciu */o.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>id==='qrx'?pFinish({ok:false}):zFinish({ok:false}));return o}
function pTop(t){return `<div class="qtop"><button class="qclose" data-close aria-label="Zamknij"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 9.5 5.5 5.5 5.5-5.5"/></svg></button><b>${t}</b><span></span></div>`}
function pStopCam(){if(PS&&PS.stream){PS.stream.getTracks().forEach(t=>t.stop());PS.stream=null}if(PS)PS.run=false}
function pFinish(r){const s=PS;if(!s)return;pStopCam();clearInterval(s.tick);PS=null;const o=$('#qrx');if(o){o.classList.remove('on');setTimeout(()=>{if(!PS)o.innerHTML=''},320)}s.resolve(r)}

/* ---------- skaner ---------- */
function qrFlow(opt={}){
 if(PS)pFinish({ok:false});
 return new Promise(resolve=>{PS={resolve,opt,run:true};pScan()});
}
async function pScan(){
 const st=PS;
 const o=pScreen(`${pTop('Potwierdź swoje dane')}<div class="cam"><video playsinline muted autoplay></video><div class="guide"><span></span></div><p class="camhint">Uruchamiam aparat…</p></div>
  <div class="qscanfoot"><p class="lh">Nakieruj aparat na znak aplikacji: na ekranie telefonu obok, na stronie internetowej albo w okienku urzędu. Przekażesz dane temu, czyj znak zeskanujesz.</p>
  <button class="qalt" id="pokazZnak">${qsvg('inbox',1.7)}Chcę przyjąć dane: pokaż mój znak</button></div>`,'dark scan');
 o.querySelector('#pokazZnak').onclick=()=>przejdzDoZnaku();
 const hint=t=>{const h=o.querySelector('.camhint');if(h)h.textContent=t};
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
 catch(e){hint('Brak dostępu do aparatu. Zezwól na aparat w ustawieniach przeglądarki.');return}
 if(PS!==st){stream.getTracks().forEach(t=>t.stop());return}
 st.stream=stream;const v=o.querySelector('video');v.srcObject=stream;try{await v.play()}catch(e){}
 o.querySelector('.cam').classList.add('live');hint('Szukam znaku…');
 const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});let last=null,lastT=0,busy=false;
 const loop=async()=>{
  if(!st.run||PS!==st)return;
  if(v.readyState>=2&&!busy){
   const W=480,H=Math.round(W*v.videoHeight/v.videoWidth)||360;cv.width=W;cv.height=H;cx.drawImage(v,0,0,W,H);
   let r=ZNAK.decode(cx.getImageData(0,0,W,H).data,W,H);
   const g=o.querySelector('.guide');if(g)g.classList.toggle('seen',!!r);
   if(r&&r.token===TOKEN){hint('To Twój własny znak. Zeskanuj znak odbiorcy.');r=null}
   if(r){
    if(last===r.token&&Date.now()-lastT<1500){busy=true;hint('Rozpoznano znak, sprawdzam…');
     try{const j=await API('/api/znak/kto?t='+r.token+'&dev='+DEV);
      if(j&&j.dev){try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}pStopCam();pConsent(j);return}
      hint('Ten znak jest nieaktualny. Poproś o odświeżenie ekranu.')}catch(e){hint('Brak połączenia. Spróbuj jeszcze raz.')}
     busy=false}
    last=r.token;lastT=Date.now()}
  }
  setTimeout(loop,90);
 };
 loop();
}
function pConsent(j){
 const st=PS,rows=wypelnij(j.zakres||ZAKRESY.tozsamosc.pola),nazwa=(ZAKRESY[j.cel]||{}).nazwa;
 const o=pScreen(`${pTop('Przekazanie danych')}<div class="qbody">
  <div class="who"><span class="wico">${qsvg(j.kind==='web'?'pc':'ph')}</span><div><small>${j.kind==='web'?'Strona internetowa prosi o dane':'Telefon obok prosi o dane'}</small><b>${E(j.kto)}</b><em>${svg('check')}Znak aplikacji aktualny${nazwa?' · '+nazwa:''}</em></div></div>
  <h3 class="qh">Zobaczy te dane</h3><div class="dlist">${rowsHTML(rows)}</div>
  <p class="qnote">Dane zostaną przekazane jednorazowo. Odbiorca nie dostanie dostępu do niczego więcej.</p>
  <div class="qbtns"><button class="qbtn ghost">Odmów</button><button class="qbtn primary">Udostępnij dane</button></div></div>`,'light');
 o.querySelector('.qbtn.ghost').onclick=()=>{API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:false}).catch(()=>{});pFinish({ok:false})};
 o.querySelector('.qbtn.primary').onclick=async()=>{await faceid();if(PS!==st)return;
  try{await API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:true,dane:{od:OS.imie+' '+OS.nazwisko,foto:OS.id,cel:j.cel,rows,pojazd:j.cel==='mstluczka'?{model:MOJE.pojazd_model,kolor:MOJE.pojazd_kolor}:null}})}catch(e){}
  const t=hhmm();
  const o2=pScreen(`${pTop('Gotowe')}<div class="qbody qdone"><div class="bigok">${svg('check')}</div><h2>Dane przekazane</h2><p>${E(j.kto)}<br>godz. ${t}</p>
   <div class="dlist small">${rows.map(([k])=>`<div class="drow"><span>${k}</span><b>${svg('check')}</b></div>`).join('')}</div><button class="qbtn primary wide">Gotowe</button></div>`,'light');
  o2.querySelector('.qbtn').onclick=()=>pFinish({ok:true,wynik:{przekazano:true,odbiorca:j.kto,zakres:rows.map(x=>x[0]),godzina:t}});
 };
}

/* ---------- mój znak: przyjmowanie danych od osoby, która go zeskanuje ---------- */
/* „Przyjmij dane” → skaner: to samo przejście w drugą stronę (jasne tło gaśnie w ciemne, znak zmienia się w celownik) */
function przejdzDoSkanera(){
 const z=$('#zx');
 qrFlow({});
 const q=$('#qrx');if(!z||!q||matchMedia('(prefers-reduced-motion: reduce)').matches){z&&(z.style.transition='none');zFinish({ok:false});z&&requestAnimationFrame(()=>z.style.transition='');return}
 q.style.zIndex='81';getComputedStyle(q).transform;q.getAnimations().forEach(a=>a.cancel());   // bez wjazdu od dołu
 const EZ='cubic-bezier(.22,.8,.24,1)';
 q.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease'});
 const cel=q.querySelector('.guide');cel&&cel.animate([{opacity:0,transform:'scale(1.12)'},{opacity:1,transform:'scale(1)'}],{duration:460,delay:40,easing:EZ,fill:'backwards'});
 [...q.querySelectorAll('.qscanfoot>*,.camhint')].forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,delay:140+i*50,easing:EZ,fill:'backwards'}));
 const zn=z.querySelector('.mojznak');zn&&zn.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.9)'}],{duration:240,easing:'ease-in',fill:'forwards'});
 setTimeout(()=>{z.style.transition='none';zFinish({ok:false});z.getAnimations({subtree:true}).forEach(a=>a.cancel());
  requestAnimationFrame(()=>requestAnimationFrame(()=>{z.style.transition='';q.style.zIndex=''}))},360);
}
/* Skaner → „Przyjmij dane” bez zamykania: arkusz zostaje na miejscu, ciemne tło skanera przechodzi w jasne,
   a znak wyrasta na środku. Skaner chowamy dopiero, gdy jest już całkiem przykryty. */
function przejdzDoZnaku(){
 const q=$('#qrx');pStopCam();
 przyjmijFlow({});
 const z=$('#zx');if(!z||!q||matchMedia('(prefers-reduced-motion: reduce)').matches){q&&(q.style.transition='none');pFinish({ok:false});q&&requestAnimationFrame(()=>q.style.transition='');return}
 z.style.zIndex='81';getComputedStyle(z).transform;z.getAnimations().forEach(a=>a.cancel());   // bez wjazdu od dołu
 const EZ='cubic-bezier(.22,.8,.24,1)';
 z.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease'});
 const zn=z.querySelector('.mojznak');zn&&zn.animate([{opacity:0,transform:'scale(.86)'},{opacity:1,transform:'scale(1)'}],{duration:460,delay:40,easing:EZ,fill:'backwards'});
 [...z.querySelectorAll('.mz>p,.mz>.seg,.mz>.wait')].forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,delay:140+i*50,easing:EZ,fill:'backwards'}));
 [...q.children].forEach(el=>el.animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'}));
 setTimeout(()=>{q.style.transition='none';pFinish({ok:false});q.getAnimations({subtree:true}).forEach(a=>a.cancel());
  requestAnimationFrame(()=>requestAnimationFrame(()=>{q.style.transition='';z.style.zIndex=''}))},360);
}
function przyjmijFlow(opt={}){
 if(ZS)zFinish({ok:false});
 MOJ_CEL=opt.cel&&ZAKRESY[opt.cel]?opt.cel:'tozsamosc';
 return new Promise(resolve=>{ZS={resolve,opt};zShow();beat()});
}
function zShow(){
 const st=ZS,wyb=['tozsamosc','pelnoletnosc','prawo_jazdy'];
 const o=pScreen(`${pTop('Przyjmij dane')}<div class="qbody c mz">
  <div class="mojznak" id="mojZnak">${ZNAK.svg(TOKEN)}</div>
  <p class="qlead c" data-h>Poproś drugą osobę, by w swojej aplikacji dotknęła <b>Potwierdź swoje dane</b> i zeskanowała ten znak.</p>
  ${MOJ_CEL==='mstluczka'?'<p class="qnote c">Zakres: dane do oświadczenia o zdarzeniu</p>':`<div class="seg light">${wyb.map(k=>`<button data-c="${k}" class="${k===MOJ_CEL?'on':''}">${ZAKRESY[k].nazwa}</button>`).join('')}</div>`}
  <div class="wait"><i></i>Czekam na dane…</div>
  ${MOJ_CEL==='mstluczka'?'':`<button class="qalt wstecz" id="doSkanera">${qsvg('scan',1.7)}Chcę przekazać dane: skanuj znak</button>`}</div>`,'light','zx');
 {const w=o.querySelector('#doSkanera');if(w)w.onclick=()=>przejdzDoSkanera()}
 {const mz=o.querySelector('#mojZnak');if(mz)wejscieZnaku(mz,240)}   /* krąg rysuje się też przy pierwszym otwarciu */
 o.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{MOJ_CEL=b.dataset.c;o.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));nowyToken();beat()});
}
function zFinish(r){const s=ZS;ZS=null;MOJ_CEL='tozsamosc';const o=$('#zx');if(o){o.classList.remove('on');setTimeout(()=>{if(!ZS)o.innerHTML=''},320)}clearInterval(s&&s.tick);if(s)s.resolve(r)}
function odebrano(d){
 if(!d.ok){if(ZS){const w=$('#zx .wait');if(w){w.dataset.odm=1;w.innerHTML='<i></i>Druga osoba odmówiła. Możesz poprosić jeszcze raz.';setTimeout(()=>{delete w.dataset.odm},6000)}}return}
 if(!ZS)ZS={resolve:()=>{},opt:{}};
 const st=ZS,rows=(d.dane&&d.dane.rows)||[],foto=rows.some(r=>r[1]==='foto'),rest=rows.filter(r=>r[1]!=='foto');
 const name=(rows.find(r=>r[0]==='Imię i nazwisko'||r[0]==='Kierowca')||[])[1],cel=d.dane&&d.dane.cel,z=ZAKRESY[cel]||ZAKRESY.tozsamosc;let left=180;
 try{navigator.vibrate&&navigator.vibrate([80,40,80])}catch(e){}
 const wynik={imie_nazwisko:name||'osoba pełnoletnia',zakres:z.nazwa,dane:Object.fromEntries(rest),status:'przekazane z aplikacji'};
 const o=pScreen(`${pTop(z.nazwa)}<div class="qbody">
  <div class="okbar">${svg('check')}<b>Dane z aplikacji</b><span>Face ID, ${hhmm()}</span></div>
  <div class="person">${foto?`<span class="pav photo"><span class="ph" style="background-image:url(assets/foto-${/^[a-z]+$/.test(d.dane.foto||'')?d.dane.foto:'marta'}.svg)"></span></span>`:'<span class="pav">•</span>'}<div><b>${E(name||'Osoba pełnoletnia')}</b><small>Dane z rejestrów państwowych</small></div></div>
  ${d.dane&&d.dane.pojazd&&d.dane.pojazd.model&&typeof SYLWETKI!=='undefined'?`<div class="otrz-syl">${SYLWETKI.svg(String(d.dane.pojazd.model),String(d.dane.pojazd.kolor||''))}</div>`:''}
  <div class="dlist">${rowsHTML(rest.filter(r=>r[1]!==name))}</div>
  <p class="qnote c">Dane znikną z ekranu za <b class="pt">${mmss(left)}</b></p>
  <button class="qbtn primary wide">${cel==='mstluczka'?'Dalej':'Zakończ'}</button></div>`,'light','zx');
 st.tick=setInterval(()=>{left=Math.max(0,left-1);const b=o.querySelector('.pt');if(b)b.textContent=mmss(left);if(!left)zFinish({ok:true,wynik})},1000);
 o.querySelector('.qbtn').onclick=()=>zFinish({ok:true,wynik});
}
/* znak na karcie dowodu: dotknięcie powiększa go, by druga osoba mogła go zeskanować */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.face .live');if(!t)return;e.preventDefault();e.stopPropagation();przyjmijFlow({})},true);
/* „Pokaż dane” na dowodzie; po zminimalizowaniu aplikacji dane znów są ukryte */
function odkryjDane(e){const t=e.target.closest&&e.target.closest('.face .reveal');if(!t)return false;e.preventDefault();e.stopPropagation();app.classList.remove('ukryte');return true}
['pointerdown','pointerup','click'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest&&e.target.closest('.face .reveal')){if(ev==='click')odkryjDane(e);else e.stopPropagation()}},true));
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&odkryjDane(e))return},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(PS)pFinish({ok:false});else if(ZS)zFinish({ok:false})}});
{const b=$('#qrBtn');if(b)b.onclick=()=>qrFlow({})}
