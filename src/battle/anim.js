/* battle/anim.js: Fight animation stage, attack animation (A), SFX tables, page tearing. */
/* ---------- animation layer (persistent, outside #app so re-renders don't cut effects) ---------- */
const COL={mag:'#EE548C',cyan:'#3DB6DD',yel:'#F3CB4B',tech:'#3DB6DD',innate:'#F08A4B',magic:'#B48CF0',heal:'#5BC27D',grey:'#9AA1B2',rock:'#8A7A66'};
let stage=null;
function getStage(){if(!stage){stage=document.createElement('div');stage.id='stage';stage.setAttribute('aria-hidden','true');document.body.appendChild(stage)}return stage}
function bpos(p){if(FAST||RM)return null;const b=document.querySelector('.board');if(!b)return null;const r=b.getBoundingClientRect();const c=(r.width-5)/BW();
  return {x:r.left+2.5+p.cx*c,y:r.top+2.5+p.cy*c,c,top:r.top}}
function mk(html){const d=document.createElement('div');d.innerHTML=html.trim();const e=d.firstElementChild;getStage().appendChild(e);return e}
const gone=(e,ms)=>new Promise(r=>setTimeout(()=>{e.remove();r()},ms));
const TC=(dx,dy,extra='')=>`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) ${extra}`;
const A={
  bolt(f,t,col,thin){const a=bpos(f),b=bpos(t);if(!a||!b)return Promise.resolve();
    const n=9,pts=[];const nx=b.y-a.y,ny=-(b.x-a.x),L=Math.hypot(nx,ny)||1;
    for(let i=0;i<=n;i++){const k=i/n;let x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k;if(i&&i<n){const j=(Math.random()-.5)*a.c*.7;x+=nx/L*j;y+=ny/L*j}pts.push(x.toFixed(1)+','+y.toFixed(1))}
    const p=pts.join(' ');
    const s=mk(`<svg class="a-full"><polyline points="${p}" fill="none" stroke="${col}" stroke-width="${thin?4:12}" stroke-linejoin="round" stroke-linecap="round" opacity=".6"/><polyline points="${p}" fill="none" stroke="#fff" stroke-width="${thin?1.5:4}" stroke-linejoin="round" stroke-linecap="round"/>${thin?'':`<circle cx="${b.x}" cy="${b.y}" r="${a.c*.5}" fill="#fff" opacity=".85"/>`}</svg>`);
    s.animate([{opacity:0},{opacity:1,offset:.08},{opacity:.25,offset:.25},{opacity:1,offset:.4},{opacity:.6,offset:.7},{opacity:0}],{duration:560});
    if(!thin){const fl=mk(`<div class="a-flash"></div>`);fl.animate([{opacity:0},{opacity:.35,offset:.1},{opacity:0}],{duration:300});gone(fl,300)}
    return gone(s,560)},
  laser(f,t,col){const a=bpos(f),b=bpos(t);if(!a||!b)return Promise.resolve();
    const s=mk(`<svg class="a-full"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="${a.c*.34}" stroke-linecap="round" opacity=".55"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-width="${a.c*.1}" stroke-linecap="round"/></svg>`);
    s.animate([{opacity:0},{opacity:1,offset:.12},{opacity:.7,offset:.6},{opacity:0}],{duration:520});return gone(s,520)},
  shot(f,t,col){const a=bpos(f),b=bpos(t);if(!a||!b)return Promise.resolve();const s=a.c*.34;
    const e=mk(`<div class="a-orb" style="width:${s}px;height:${s}px;left:${a.x}px;top:${a.y}px;box-shadow:0 0 0 3px ${col},0 0 16px 6px ${col}"></div>`);
    const d=Math.hypot(b.x-a.x,b.y-a.y),dur=Math.max(180,Math.min(420,d*1.4));
    e.animate([{transform:TC(0,0,'scale(.6)')},{transform:TC(b.x-a.x,b.y-a.y,'scale(1)')}],{duration:dur,easing:'ease-in'});
    return gone(e,dur).then(()=>A.pop(t,col))},
  pop(t,col){const b=bpos(t);if(!b)return Promise.resolve();const e=mk(`<div class="a-ring" style="left:${b.x}px;top:${b.y}px;width:${b.c}px;height:${b.c}px;border-color:${col};background:${col}55"></div>`);
    e.animate([{transform:TC(0,0,'scale(.2)'),opacity:1},{transform:TC(0,0,'scale(1)'),opacity:0}],{duration:240,easing:'ease-out'});return gone(e,240)},
  throw(f,t,kind='car'){const a=bpos(f),b=bpos(t);if(!a||!b)return Promise.resolve();const dx=b.x-a.x,dy=b.y-a.y,lift=Math.hypot(dx,dy)*.45+a.c*.6;
    const e=mk(`<div class="a-throw ${kind}" style="left:${a.x}px;top:${a.y}px;width:${a.c*.9}px;height:${a.c*.5}px"><i></i><i></i></div>`);
    e.animate([{transform:TC(0,0,'rotate(0) scale(.8)')},{transform:TC(dx/2,dy/2-lift,'rotate(220deg) scale(1.15)'),offset:.5},{transform:TC(dx,dy,'rotate(430deg) scale(1)')}],{duration:620,easing:'cubic-bezier(.3,.1,.6,1)'});
    return gone(e,620).then(()=>A.smoke(t,3))},
  slash(t,col){const b=bpos(t);if(!b)return Promise.resolve();const ps=[];
    for(let i=0;i<3;i++){const e=mk(`<div class="a-slash" style="left:${b.x+(i-1)*b.c*.12}px;top:${b.y+(i-1)*b.c*.08}px;width:${b.c*1.2}px;height:${b.c*1.2}px;border-top-color:${col}"></div>`);
      e.animate([{transform:TC(0,0,'rotate(-110deg) scale(.5)'),opacity:0},{opacity:1,offset:.2},{transform:TC(0,0,'rotate(70deg) scale(1.1)'),opacity:0}],{duration:300,delay:i*45,easing:'ease-out',fill:'backwards'});
      ps.push(gone(e,300+i*45))}return Promise.all(ps)},
  lunge(tid,to){if(FAST||RM)return;const e=document.querySelector(`[data-tid="${tid}"]`),b=bpos(to);if(!e||!b)return;const r=e.getBoundingClientRect();
    const dx=(b.x-(r.left+r.width/2))*.4,dy=(b.y-(r.top+r.height/2))*.4;e.animate([{transform:'none'},{transform:`translate(${dx}px,${dy}px) scale(1.08)`,offset:.45},{transform:'none'}],{duration:300,easing:'ease-out'})},
  shield(at,col,big){const b=bpos(at);if(!b)return Promise.resolve();const R=b.c*(big?.95:.7);
    const pts=[...Array(6)].map((_,i)=>{const a=Math.PI/3*i-Math.PI/2;return `${Math.cos(a).toFixed(3)},${Math.sin(a).toFixed(3)}`}).join(' ');
    const e=mk(`<svg class="a-box" viewBox="-1.1 -1.1 2.2 2.2" style="left:${b.x}px;top:${b.y}px;width:${R*2}px;height:${R*2}px"><polygon points="${pts}" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width=".09"/><polygon points="${pts}" fill="none" stroke="#fff" stroke-width=".03" transform="scale(.82)"/></svg>`);
    e.animate([{transform:TC(0,0,'scale(.4)'),opacity:0},{transform:TC(0,0,'scale(1.12)'),opacity:1,offset:.25},{transform:TC(0,0,'scale(1)'),opacity:.4,offset:.45},{opacity:1,offset:.6},{opacity:.5,offset:.75},{transform:TC(0,0,'scale(1.05)'),opacity:0}],{duration:700});
    return gone(e,700)},
  ring(at,col,cells,{dashed=false,fill=true,count=1,inward=false}={}){const b=bpos(at);if(!b)return Promise.resolve();const ps=[];const D=b.c*cells;
    for(let i=0;i<count;i++){const e=mk(`<div class="a-ring" style="left:${b.x}px;top:${b.y}px;width:${D}px;height:${D}px;border-color:${col};border-style:${dashed?'dashed':'solid'};${fill?`background:radial-gradient(circle,transparent 45%,${col}66 70%,transparent 72%)`:''}"></div>`);
      const k=inward?[{transform:TC(0,0,'scale(1)'),opacity:0},{transform:TC(0,0,'scale(.15)'),opacity:1}]:[{transform:TC(0,0,'scale(.15)'),opacity:1},{transform:TC(0,0,'scale(1)'),opacity:0}];
      e.animate(k,{duration:520,delay:i*140,easing:'ease-out',fill:'backwards'});ps.push(gone(e,520+i*140))}return Promise.all(ps)},
  heal(at,col){const b=bpos(at);if(!b)return Promise.resolve();const ps=[];
    for(let i=0;i<4;i++){const e=mk(`<div class="a-plus" style="left:${b.x+(i-1.5)*b.c*.22}px;top:${b.y}px;color:${col};font-size:${b.c*.45}px">+</div>`);
      e.animate([{transform:TC(0,0),opacity:0},{opacity:1,offset:.2},{transform:TC(0,-b.c*.9),opacity:0}],{duration:650,delay:i*90,easing:'ease-out',fill:'backwards'});ps.push(gone(e,650+i*90))}
    return Promise.all(ps)},
  smoke(at,n=6){const b=bpos(at);if(!b)return Promise.resolve();const ps=[];
    for(let i=0;i<n;i++){const s=b.c*(.35+Math.random()*.35),ang=Math.random()*6.28,r=b.c*(.3+Math.random()*.4);
      const e=mk(`<div class="a-puff" style="left:${b.x}px;top:${b.y}px;width:${s}px;height:${s}px"></div>`);
      e.animate([{transform:TC(0,0,'scale(.3)'),opacity:.95},{transform:TC(Math.cos(ang)*r,Math.sin(ang)*r,'scale(1.4)'),opacity:0}],{duration:560,easing:'ease-out'});ps.push(gone(e,560))}
    return Promise.all(ps)},
  sparkle(at,col){const b=bpos(at);if(!b)return Promise.resolve();const ps=[];
    for(let i=0;i<9;i++){const ang=6.28*i/9,r=b.c*.8;const e=mk(`<div class="a-spark" style="left:${b.x}px;top:${b.y}px;width:${b.c*.2}px;height:${b.c*.2}px;background:${col}"></div>`);
      e.animate([{transform:TC(0,0,'rotate(45deg) scale(.4)'),opacity:1},{transform:TC(Math.cos(ang)*r,Math.sin(ang)*r,'rotate(225deg) scale(1)'),opacity:0}],{duration:480,easing:'ease-out'});ps.push(gone(e,480))}
    return Promise.all(ps)},
  sigil(at,col,cells=2.4){const b=bpos(at);if(!b)return Promise.resolve();const R=b.c*cells/2;
    const st=[...Array(5)].map((_,i)=>{const a=Math.PI*4/5*i-Math.PI/2;return `${(Math.cos(a)*.78).toFixed(3)},${(Math.sin(a)*.78).toFixed(3)}`}).join(' ');
    const e=mk(`<svg class="a-box" viewBox="-1.1 -1.1 2.2 2.2" style="left:${b.x}px;top:${b.y}px;width:${R*2}px;height:${R*2}px"><circle r="1" fill="none" stroke="${col}" stroke-width=".07"/><circle r=".86" fill="none" stroke="${col}" stroke-width=".025" stroke-dasharray=".08 .06"/><polygon points="${st}" fill="${col}" fill-opacity=".15" stroke="${col}" stroke-width=".05"/></svg>`);
    e.animate([{transform:TC(0,0,'rotate(-90deg) scale(.3)'),opacity:0},{transform:TC(0,0,'rotate(0) scale(1)'),opacity:1,offset:.35},{opacity:1,offset:.7},{transform:TC(0,0,'rotate(60deg) scale(1.1)'),opacity:0}],{duration:800,easing:'ease-out'});
    return gone(e,800)},
  reticle(at,col){const b=bpos(at);if(!b)return Promise.resolve();const R=b.c*1.2;
    const e=mk(`<svg class="a-box" viewBox="-1.2 -1.2 2.4 2.4" style="left:${b.x}px;top:${b.y}px;width:${R*2}px;height:${R*2}px"><circle r=".8" fill="none" stroke="${col}" stroke-width=".08"/><path d="M0 -1.15V-.45M0 .45V1.15M-1.15 0H-.45M.45 0H1.15" stroke="${col}" stroke-width=".09"/></svg>`);
    e.animate([{transform:TC(0,0,'scale(1.8) rotate(45deg)'),opacity:0},{transform:TC(0,0,'scale(1) rotate(0)'),opacity:1,offset:.5},{opacity:1,offset:.8},{opacity:0}],{duration:620,easing:'ease-out'});
    return gone(e,620)},
  beam(at,col){const b=bpos(at);if(!b)return Promise.resolve();const h=Math.max(b.c,b.y-b.top+b.c*.3);
    const e=mk(`<div class="a-beam" style="left:${b.x}px;top:${b.y-h}px;width:${b.c*.9}px;height:${h}px;background:linear-gradient(90deg,transparent,${col} 25%,#fff 50%,${col} 75%,transparent)"></div>`);
    e.animate([{transform:'translateX(-50%) scaleY(0)',opacity:1},{transform:'translateX(-50%) scaleY(1)',opacity:1,offset:.35},{transform:'translateX(-50%) scaleY(1) scaleX(1.6)',opacity:.9,offset:.6},{transform:'translateX(-50%) scaleY(1) scaleX(.2)',opacity:0}],{duration:700});
    return gone(e,700).then(()=>A.ring(at,col,2.6))},
  lift(at){const b=bpos(at);if(!b)return Promise.resolve();
    const e=mk(`<div class="a-orb" style="left:${b.x}px;top:${b.y}px;width:${b.c*.45}px;height:${b.c*.45}px;background:${COL.yel};box-shadow:0 0 0 2px #151821,0 0 14px 4px ${COL.yel}"></div>`);
    e.animate([{transform:TC(0,0)},{transform:TC(0,-b.c*1.6,'scale(.4)'),opacity:0}],{duration:520,easing:'ease-in'});
    return Promise.all([gone(e,520),A.sparkle(at,COL.yel)])},
};
function strikeAnim(style,from,to,col,tid){
  switch(style){case 'none':return Promise.resolve();case 'bolt':return A.bolt(from,to,col);case 'shot':return A.shot(from,to,col);
    case 'throw':return A.throw(from,to,'car');case 'rock':return A.throw(from,to,'rock');case 'beam':return A.beam(to,col);
    default:if(tid)A.lunge(tid,to);return sleep(FAST||RM?0:110).then(()=>A.slash(to,col))}}
const ctrU=u=>HC(u.x,u.y),ctrV=()=>vCtr(S.sd.v);

/* ---------- card reveals: comic book opening (draws) and torn pages (wounds) ---------- */
const TYPE_SFX={multi:'BARRAGE!',walls:'BUILD!',hazard:'MELTDOWN!',cage:'CAGED!',shrapnel:'DEMOLISH!',fortify:'FORTIFY!',charge:'CHARGING!',strike:'STRIKE!',sweep:'SHOCKWAVE!',summon:'BACKUP!',endanger:'HOSTAGE!',taunt:'TAUNT!',henchvolley:'OPEN FIRE!',vanish:'POOF!',reanimate:'RECHARGE!',puppet:'OBEY!',rampage:'RAMPAGE!',swallow:'GULP!',pull:'ATTRACT!',repel:'REPEL!',fade:'FADE…',converge:'SWARM!',scatter:'SCATTER!',leap:'BOING!',bomb:'TSSS!',swapbomb:'SWITCH!',airburst:'LOOK UP!',beam:'ZZARK!',burrow:'SHUNK!'};
const TAC_SFX={weak:'CRACK!',armor:'TINK!',over:'OPENING!',counter:'COUNTER!',mono:'BLAH BLAH…',shield:'NO!',escape:'HA HA!',glance:'SOLID!'};
const TEAR=(()=>{const z=[];for(let i=0;i<=12;i++)z.push([i*100/12,48+(i%2?6:-5)+((i*37)%5)-2]);return z})();
const tearTop=`polygon(0 0,100% 0,${TEAR.slice().reverse().map(([x,y])=>`${x}% ${y}%`).join(',')})`;
const tearBot=`polygon(${TEAR.map(([x,y])=>`${x}% ${y}%`).join(',')},100% 100%,0 100%)`;
