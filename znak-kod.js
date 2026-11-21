/* Znak aplikacji: 16-bitowy, zmieniający się żeton zapisany w pierścieniu 32 kropek wokół godła.
   Układ bitów: 6 bitów synchronizacji (111110) + 16 bitów żetonu + 10 bitów CRC.
   Dekoder szuka czerwonego godła (największe „kwadratowe” czerwone pole), z jego rozmiaru wylicza pierścień,
   próbkuje go po okręgu (z korekcją na pochylenie: elipsa z wymiarów godła), dobiera fazę i obrót, sprawdza CRC. */
(function(root){
 const N=32,SYNC=[1,1,1,1,1,0],RING=37/34,SQ=0.93; // promień pierścienia / bok godła (w jednostkach rysunku)
 function crc10(v){let c=0;for(let i=15;i>=0;i--){const b=((v>>i)&1)^((c>>9)&1);c=(c<<1)&0x3ff;if(b)c^=0x233}return c}
 function bits(token){const b=SYNC.slice();for(let i=15;i>=0;i--)b.push((token>>i)&1);const c=crc10(token);for(let i=9;i>=0;i--)b.push((c>>i)&1);return b}
 function check(b){for(let i=0;i<6;i++)if(b[i]!==SYNC[i])return null;let t=0;for(let i=6;i<22;i++)t=(t<<1)|b[i];let c=0;for(let i=22;i<32;i++)c=(c<<1)|b[i];return crc10(t)===c?t:null}
 /* rysunek: viewBox -50..50; godło 34x34 w środku; kropki na promieniu 37 */
 function svg(token,opt={}){
  const b=bits(token),red=opt.color||'#dc143c',img=opt.img||'assets/icon-app.svg';let d='';
  for(let i=0;i<N;i++){if(!b[i])continue;const a=-Math.PI/2+i/N*Math.PI*2;d+=`<circle cx="${(Math.cos(a)*37).toFixed(2)}" cy="${(Math.sin(a)*37).toFixed(2)}" r="2.9" fill="${red}"/>`}
  return `<svg class="znak" viewBox="-50 -50 100 100" role="img" aria-label="Znak aplikacji"><circle r="49" fill="#fff"/>${d}<image href="${img}" x="-17" y="-17" width="34" height="34"/></svg>`;
 }
 /* dekoder: data = RGBA, w x h */
 function decode(data,w,h){
  const n=w*h,score=new Int16Array(n);let hist=new Uint32Array(256);
  for(let i=0,p=0;i<n;i++,p+=4){const r=data[p],g=data[p+1],bl=data[p+2];let s=r-(g>bl?g:bl);if(r<70)s=0;s=s<0?0:s;score[i]=s;hist[s>255?255:s]++}
  let acc=0,p995=255;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>n*0.006){p995=v;break}}
  const T=Math.max(30,p995*0.45);
  // składowe spójne (union-find)
  const lab=new Int32Array(n).fill(-1),par=[];const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(score[i]<T)continue;const L=x>0?lab[i-1]:-1,U=y>0?lab[i-w]:-1;
   if(L<0&&U<0){lab[i]=par.length;par.push(par.length)}else if(L>=0&&U>=0){const a=find(L),c=find(U);lab[i]=a;if(a!==c)par[c]=a}else lab[i]=L>=0?L:U}
  const comp=new Map();
  for(let i=0;i<n;i++){if(lab[i]<0)continue;const r=find(lab[i]),x=i%w,y=(i/w)|0;let c=comp.get(r);if(!c){c={r,a:0,x0:x,x1:x,y0:y,y1:y,sx:0,sy:0,sxx:0,syy:0,sxy:0};comp.set(r,c)}c.a++;if(x<c.x0)c.x0=x;if(x>c.x1)c.x1=x;if(y<c.y0)c.y0=y;if(y>c.y1)c.y1=y;c.sx+=x;c.sy+=y;c.sxx+=x*x;c.syy+=y*y;c.sxy+=x*y}
  /* kandydaci na godło: dawne kwadratowe godło albo czerwona połowa flagi (prostokąt 2:1, także obrócony i pochylony) */
  const cand=[...comp.values()].filter(c=>{const bw=c.x1-c.x0+1,bh=c.y1-c.y0+1;return c.a>=30&&bw/bh>0.28&&bw/bh<3.6&&c.a/(bw*bh)>0.2&&bw<w*0.7}).sort((a,b)=>b.a-a.a).slice(0,6);
  function elipsa(c,cx,cy,asp){
   const R0=1.12*Math.sqrt((asp>1.25?2:1)*c.a/0.93),lim=1.9*R0,xs=[],ys=[];
   const x0=Math.max(0,Math.floor(cx-lim)),x1=Math.min(w-1,Math.ceil(cx+lim)),y0=Math.max(0,Math.floor(cy-lim)),y1=Math.min(h-1,Math.ceil(cy+lim));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*w+x;if(lab[i]<0)continue;const r=find(lab[i]);if(r===c.r)continue;const q=comp.get(r);if(!q||q.a>c.a*0.6)continue;
    const dx=(x-cx)/R0,dy=(y-cy)/R0;if(dx*dx+dy*dy>3.6)continue;xs.push(dx);ys.push(dy)}
   if(xs.length<12)return null;
   /* najmniejsze kwadraty: A x² + B xy + C y² + D x + E y = 1 */
   const M=Array.from({length:5},()=>new Float64Array(6)),st=Math.max(1,Math.floor(xs.length/3000));
   for(let k=0;k<xs.length;k+=st){const x=xs[k],y=ys[k],v=[x*x,x*y,y*y,x,y];for(let a=0;a<5;a++){for(let b=0;b<5;b++)M[a][b]+=v[a]*v[b];M[a][5]+=v[a]}}
   for(let a=0;a<5;a++){let p=a;for(let r=a+1;r<5;r++)if(Math.abs(M[r][a])>Math.abs(M[p][a]))p=r;[M[a],M[p]]=[M[p],M[a]];if(Math.abs(M[a][a])<1e-12)return null;
    for(let r=0;r<5;r++){if(r===a)continue;const f=M[r][a]/M[a][a];for(let k=a;k<6;k++)M[r][k]-=f*M[a][k]}}
   const [A,B,C,D,E]=M.map((r,i)=>r[5]/r[i]);
   const det=4*A*C-B*B;if(det<=0)return null;                    // to nie elipsa
   const ex=(B*E-2*C*D)/det,ey=(B*D-2*A*E)/det;
   const K=1-(A*ex*ex+B*ex*ey+C*ey*ey+D*ex+E*ey);if(K<=0)return null;
   const tr=A+C,dd=Math.sqrt(Math.max(0,(A-C)*(A-C)/4+B*B/4)),l1=tr/2-dd,l2=tr/2+dd;if(l1<=0||l2<=0)return null;
   const ra=Math.sqrt(K/l1),rb=Math.sqrt(K/l2),t=0.5*Math.atan2(B,A-C)+Math.PI/2;   // ra: dłuższa półoś
   if(ra/rb>4||ra<0.4||ra>2.2)return null;
   return {x:cx+ex*R0,y:cy+ey*R0,r1:ra*R0,r2:rb*R0,ux:Math.cos(t),uy:Math.sin(t)};
  }
  const smp=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<1||y<1||x>=w-1||y>=h-1)return 0;const i=y*w+x;return (score[i]*2+score[i-1]+score[i+1]+score[i-w]+score[i+w])/6};
  for(const c of cand){
   // środek i osie z momentów: kwadrat o boku s ma wariancję s^2/12 w każdym kierunku (odporne na obrót i pochylenie)
   const cx=c.sx/c.a,cy=c.sy/c.a,vxx=c.sxx/c.a-cx*cx,vyy=c.syy/c.a-cy*cy,vxy=c.sxy/c.a-cx*cy;
   const tr=vxx+vyy,de=Math.sqrt(Math.max(0,(vxx-vyy)*(vxx-vyy)/4+vxy*vxy)),l1=tr/2+de,l2=Math.max(1e-3,tr/2-de),th=0.5*Math.atan2(2*vxy,vxx-vyy);
   const ux=Math.cos(th),uy=Math.sin(th),A=Math.sqrt(12*l1),B=Math.sqrt(12*l2);
   /* hipotezy położenia pierścienia: [środek x, środek y, promień wzdłuż osi głównej, promień wzdłuż osi poprzecznej]
      1) kwadratowe godło: środek = środek plamy; 2) flaga: czerwona połowa leży pod środkiem godła, środek godła
      jest o pół wysokości plamy dalej wzdłuż krótszej osi — nie wiemy, w którą stronę (obrót), więc próbujemy obu */
   const H=[[cx,cy,A*SQ*RING,B*SQ*RING]];
   const asp=A/B;
   if(asp>1.25){const RF=37/34/0.965;for(const sg of [1,-1])H.push([cx-sg*uy*B/2,cy+sg*ux*B/2,A*RF,2*B*RF])}
   /* 3) dowolny kąt i pochylenie: dopasowujemy elipsę (stożkową) do czerwonych pikseli kropek wokół godła.
      Pochylenie zamienia okrąg w elipsę, a odczyt po osiach elipsy różni się od prawdziwego tylko obrotem,
      który i tak sprawdzamy (wszystkie początki i oba kierunki). */
   const el=elipsa(c,cx,cy,asp);
   /* perspektywa: środek godła (obraz prawdziwego środka okręgu) leży bliżej dalszej krawędzi elipsy.
      Znając go, równe kąty na okręgu odtwarzamy przekształceniem Möbiusa koła (mapy rzutowe zachowujące stożkową). */
   const H2=[];
   if(el){const sr=[[cx,cy]];if(asp>1.25)for(const sg of [1,-1])sr.push([cx-sg*uy*B/2,cy+sg*ux*B/2]);
    for(const [px,py] of sr){const dx=px-el.x,dy=py-el.y,a1=(dx*el.ux+dy*el.uy)/el.r1,a2=(-dx*el.uy+dy*el.ux)/el.r2,dd=a1*a1+a2*a2;
     if(dd<0.5){const k=1/(1+Math.sqrt(1-dd));H2.push([el.x,el.y,el.r1,el.r2,el.ux,el.uy,a1*k,a2*k])}}
    H2.push([el.x,el.y,el.r1,el.r2,el.ux,el.uy,0,0])}
   for(const [hx,hy,R1,R2,vx,vy,qa,qb] of [...H2,...H])
   for(const f of (vx!==undefined?[1,0.97,1.03,0.94]:[1,0.95,1.05,0.9,1.1,0.85,1.15])){
    const ux=vx!==undefined?vx:Math.cos(th),uy=vy!==undefined?vy:Math.sin(th);
    const r1=R1*f,r2=R2*f,P=new Float32Array(256),cx=hx,cy=hy;
    const pt=qa!==undefined&&(qa||qb)?(a,m)=>{
      /* w = (z+q)/(1+conj(q)·z) w układzie osi elipsy, potem z powrotem na obraz */
      const zr=Math.cos(a),zi=Math.sin(a),nr=zr+qa,ni=zi+qb,drr=1+qa*zr+qb*zi,dri=qa*zi-qb*zr,dn=drr*drr+dri*dri;
      const wr=(nr*drr+ni*dri)/dn*m,wi=(ni*drr-nr*dri)/dn*m;
      return [cx+wr*r1*ux-wi*r2*uy,cy+wr*r1*uy+wi*r2*ux]}
     :(a,m)=>{const ca=Math.cos(a)*m,sa=Math.sin(a)*m;// punkt na elipsie w układzie osi głównych
     const e1=ca*(ux)+sa*(uy),e2=-ca*uy+sa*ux;return [cx+(e1*r1)*ux-(e2*r2)*uy,cy+(e1*r1)*uy+(e2*r2)*ux]};
    for(let k=0;k<256;k++){const a=-Math.PI/2+k/256*Math.PI*2;let m=0;for(const q of [0.96,1,1.04]){const [x,y]=pt(a,q);const v=smp(x,y);if(v>m)m=v}P[k]=m}
    let best=null;
    for(let ph=0;ph<8;ph++){const v=[];for(let s=0;s<N;s++){let m=0;for(let j=-1;j<=1;j++)m+=P[(ph+s*8+j+256)%256];v.push(m/3)}
     const mx=Math.max(...v),mn=Math.min(...v);if(mx-mn<15)continue;const thr=(mx+mn)/2;let con=0;for(const x of v)con+=Math.abs(x-thr);con/=(mx-mn);
     if(!best||con>best.con)best={con,v,thr}}
    if(!best)continue;
    const b=best.v.map(x=>x>best.thr?1:0);
    for(const dir of [1,-1])for(let s=0;s<N;s++){const r=[];for(let i=0;i<N;i++)r.push(b[((s+dir*i)%N+N)%N]);const t=check(r);if(t!==null&&t!==0)return {token:t,x:cx/w,y:cy/h,size:r1/RING/w}}
   }
  }
  return null;
 }
 const api={svg,decode,bits,check,crc10};
 if(typeof module!=='undefined')module.exports=api;else root.ZNAK=api;
})(this);
