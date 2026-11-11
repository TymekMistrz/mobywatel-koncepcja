/* Dokumenty są zawsze w układzie „stos” (jak w portfelu w telefonie).
   Ten plik obsługuje tylko menu pod tytułem „Dokumenty ▾” (wybór osoby w pokazie). */
const VARIANT='stos';
app.dataset.v=VARIANT;
function renderMenu(){
 const m=$('#lmenu');if(!m)return;
 const mo=m.querySelector('.mo');if(mo){mo.innerHTML=Object.values(OSOBY).map(o=>`<button data-o="${o.id}" class="${o.id===OS.id?'on':''}" aria-label="${o.imie} ${o.nazwisko}, ${o.opis}"><span class="oav" style="background-image:url(assets/foto-${o.id}.svg)"></span><b>${o.imie}</b><small>${o.opis.split(',')[0]}</small></button>`).join('');
  mo.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.o===OS.id){closeMenu();return}zmienOsobe(b.dataset.o)})}
}
function openMenu(){if(app.classList.contains('chatting'))return;closeHist();renderMenu();app.classList.add('menu');$('#title').setAttribute('aria-expanded','true')}
function closeMenu(){app.classList.remove('menu');$('#title').setAttribute('aria-expanded','false')}
$('#title').onclick=()=>app.classList.contains('menu')?closeMenu():openMenu();
$('#lmenu .scrim').onclick=closeMenu;

