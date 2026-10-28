/* Blackharbor battle code (showdowns): hex board and movement, villain and henchman turns, hazards (charge zones, bombs, beams),
   hero attacks, powers and gear abilities, the fight views (splash pages, board, ability buttons) and board taps (onCell).
   Loads after game.js; everything here is called at runtime, so nothing in game.js may run battle code while the page loads. */

/* ============ SHOWDOWN ============ */
/* hex board: pointy-top hexes stored as odd-r offset (x = column, y = row; odd rows sit half a hex right).
   Distances and shapes use axial (q,r). Board units: one hex is 1 wide, HS = side length. */
const HS=1/Math.sqrt(3);
const ax=p=>({q:p.x-((p.y-(p.y&1))>>1),r:p.y});
const off=(q,r)=>({x:q+((r-(r&1))>>1),y:r});
const AXD=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];/* E NE NW W SW SE */
const FACE_DEG=[0,-60,-120,180,120,60];
function cheb(a,b){const A=ax(a),B=ax(b),dq=A.q-B.q,dr=A.r-B.r;return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2}
const step=(p,d)=>{const A=ax(p);return off(A.q+AXD[d][0],A.r+AXD[d][1])};
const nbrs=p=>AXD.map((_,d)=>step(p,d));
const inB=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
const HC=(x,y)=>({cx:x+.5+(y&1?.5:0),cy:HS+y*1.5*HS});
const BW=()=>N+.5,BH=()=>(1.5*N+.5)*HS;
function hexesWithin(p,r){const out=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},p)<=r)out.push({x,y});return out}
const SHAPES={one:[[0,0]],tri:[[0,0],[1,0],[0,1]],diamond:[[0,0],[1,0],[0,1],[1,1]],big:[[0,0],...AXD],serpent:[[0,0]],swarm:[[0,0]]};
const vShape=v=>SHAPES[v.shape]||SHAPES.one;
const vBig=v=>!!v.body||vShape(v).length>1;
/* serpent: v.body lists the segments behind the head (v.x,v.y). Stepping the head drags each segment into the one ahead of it;
   v.grow holds segments still owed from a meal, so the tail stays put on the next step. A jump of more than one hex moves the body rigidly. */
/* swarm: v.sw lists the other bodies {x,y,f}; v.pk names every body, lead first. Bodies move one by one and each keeps its own facing. */
/* Version 130 (Tyler): what each villain says on the fight's splash pages. The opening line follows the investigation
   (ambush 0-1 clues, normal Standoff, prepared 4+); escape plays on a win (beaten villains always get away), taunt on a loss */


const vLine=(k,t)=>(VLINES[k]&&VLINES[k][t])||({escape:'This isn\'t over.',taunt:'Is that all Blackharbor has?'})[t]||'So. You found me.';
const swBodies=v=>[{x:v.x,y:v.y,f:v.face,k:v.pk[0],i:0},...v.sw.map((c,j)=>({x:c.x,y:c.y,f:c.f,k:v.pk[j+1],i:j+1}))];
const swNear=(v,p)=>swBodies(v).sort((a,b)=>cheb(p,a)-cheb(p,b)||a.i-b.i)[0];
function swSet(v,i,x,y,f){const b=i?v.sw[i-1]:v;b.x=x;b.y=y;if(f!=null){if(i)b.f=f;else v.face=f}}
function vCellsAt(v,x,y){if(v.sw){if(x===v.x&&y===v.y)return [{x,y},...v.sw.map(c=>({x:c.x,y:c.y}))];
    const dq=ax({x,y}).q-ax(v).q,dr=y-v.y;return [{x,y},...v.sw.map(c=>{const A=ax(c);return off(A.q+dq,A.r+dr)})]}
  if(v.body){const H={x:v.x,y:v.y};if(x===v.x&&y===v.y)return [H,...v.body];
    if(cheb({x,y},H)===1)return [{x,y},H,...v.body.slice(0,v.grow?v.body.length:v.body.length-1)];
    const dq=ax({x,y}).q-ax(H).q,dr=y-v.y;return [{x,y},...v.body.map(c=>{const A=ax(c);return off(A.q+dq,A.r+dr)})]}
  const A=ax({x,y});return vShape(v).map(([dq,dr])=>off(A.q+dq,A.r+dr))}
const vCells=v=>vCellsAt(v,v.x,v.y);
const inV=(v,x,y)=>vCells(v).some(c=>c.x===x&&c.y===y);
function dV(p,v){return Math.min(...vCells(v).map(c=>cheb(p,c)))}
function vCtr(v){if(v.body||v.sw)return HC(v.x,v.y);const cs=vCells(v).map(c=>HC(c.x,c.y));return {cx:cs.reduce((s,c)=>s+c.cx,0)/cs.length,cy:cs.reduce((s,c)=>s+c.cy,0)/cs.length}}
const angDiff=(a,b)=>Math.abs(((a-b)%360+540)%360-180);
function dirC(a,b){const g=Math.atan2(b.cy-a.cy,b.cx-a.cx)*180/Math.PI;let best=0,bd=999;FACE_DEG.forEach((f,i)=>{const d=angDiff(g,f);if(d<bd){bd=d;best=i}});return best}
function faceTo(p){const v=S.sd.v;if(v.sw){const n=swNear(v,p),L=live();swBodies(v).forEach(b=>{const t=b===n||b.i===n.i?p:L.slice().sort((a,c)=>cheb(a,b)-cheb(c,b))[0]||p;if(t.x!==b.x||t.y!==b.y)swSet(v,b.i,b.x,b.y,dirC(HC(b.x,b.y),HC(t.x,t.y)))});return}v.face=dirC(vCtr(v),HC(p.x,p.y))}
/* facing: front is within 60° of the arrow, the blind spot is the narrow cone behind (125° or more) */
function sideOf(p,v,b){if(v.sw&&!b)b=swNear(v,p);const c=b?HC(b.x,b.y):vCtr(v),t=HC(p.x,p.y),d=angDiff(Math.atan2(t.cy-c.cy,t.cx-c.cx)*180/Math.PI,FACE_DEG[(b?b.f:v.face)??5]);return d<=60?'front':d>=125?'rear':'flank'}
const heroOf=u=>S.heroes.find(h=>h.id===u.hid);
const live=()=>S.sd.units.filter(u=>!u.ko);
function blocked(x,y,o={}){const sd=S.sd;if(x<0||y<0||x>=N||y>=N)return true;
  if(!o.noWall&&sd.obs.includes(x+','+y))return true;
  if(!o.noWall&&sd.walls&&sd.walls.some(w=>w.k===x+','+y))return true;
  if(!o.noPit&&sd.pits&&sd.pits.includes(x+','+y))return true;
  for(const o2 of (sd.vl||[{v:sd.v}])){if(o2.v.down)continue;if(o.ignoreV&&o2.v===sd.v)continue;if(inV(o2.v,x,y))return true}
  if(sd.units.some(u=>!u.ko&&u!==o.self&&u.x===x&&u.y===y))return true;
  if(sd.hench.some(h=>h!==o.self&&h.x===x&&h.y===y))return true;
  if(sd.civs.some(c=>c.x===x&&c.y===y&&!(c.f&&o.self&&o.self.hid===c.f)))return true;return false}
function reach(s,mv,self){const dist={[s.x+','+s.y]:0},q=[[s.x,s.y]];
  while(q.length){const[x,y]=q.shift(),d=dist[x+','+y];if(d>=mv)continue;
    for(const n of nbrs({x,y})){const nx=n.x,ny=n.y,k=nx+','+ny;if(k in dist||blocked(nx,ny,{self}))continue;dist[k]=d+1;q.push([nx,ny])}}
  delete dist[s.x+','+s.y];return dist}
/* A villain bigger than one hex ignores heroes, henchmen and civilians when it moves (loose) and shoves them aside; strict = they block.
   smash: it walks straight through walls and rubble (vSlide knocks them down). Big villains also stride over pits. */
function vFits(x,y,strict,smash){const sd=S.sd,v=sd.v,loose=vBig(v)&&!strict,big=vBig(v);
  if(v.body&&vCellsAt(v,x,y).slice(1).some(c=>c.x===x&&c.y===y))return false;
  return vCellsAt(v,x,y).every(c=>{const k=c.x+','+c.y;return inB(c.x,c.y)&&(smash||(!sd.obs.includes(k)&&!(sd.walls||[]).some(w=>w.k===k)))&&(big||!(sd.pits||[]).includes(k))&&!sd.vl.some(o=>o.v!==v&&!o.v.down&&inV(o.v,c.x,c.y))&&(loose||!blocked(c.x,c.y,{ignoreV:true,noPit:big,noWall:smash}))})}
function shoveOut(d){const sd=S.sd,v=sd.v,occ=vCells(v),isOcc=p=>occ.some(c=>c.x===p.x&&c.y===p.y),cc=vCtr(v);
  const movers=[...sd.units.map(o=>({o,k:'h'})),...sd.hench.map(o=>({o,k:'m'})),...sd.civs.map(o=>({o,k:'c'}))].filter(e=>isOcc(e.o));
  for(const e of movers){const o=e.o,ok=p=>inB(p.x,p.y)&&!isOcc(p)&&!blocked(p.x,p.y,{self:o});
    let t=ok(step(o,d))?step(o,d):null;
    if(!t)t=nbrs(o).filter(ok).sort((a,b)=>{const A=HC(a.x,a.y),B=HC(b.x,b.y);return Math.hypot(B.cx-cc.cx,B.cy-cc.cy)-Math.hypot(A.cx-cc.cx,A.cy-cc.cy)})[0]||null;
    if(!t){const seen=new Set([o.x+','+o.y]),q=[o];while(q.length&&!t){const p=q.shift();for(const n of nbrs(p)){const k=n.x+','+n.y;if(seen.has(k)||!inB(n.x,n.y))continue;seen.add(k);if(ok(n)){t=n;break}q.push(n)}}}
    if(t){o.x=t.x;o.y=t.y}}
  return movers}
function vPut(v,x,y){if(v.body){const adj=cheb({x,y},v)===1;v.body=vCellsAt(v,x,y).slice(1);if(adj&&v.grow)v.grow--}v.x=x;v.y=y}
/* a serpent steers by its head; v.path records each step so vMove can animate the body slithering */
function vSlide(p,steps,stop,o,sign){if(S.sd.v.sw)return swSlide(p,steps,stop,sign);if(VILLAINS[S.sd.vkey].rooted){if(p&&live().length)faceTo(p);return []}const v=S.sd.v,sh=[],hd=q=>v.body?cheb(p,q):dV(p,q);for(let i=0;i<steps;i++){if(sign<0&&dV(p,v)<=stop&&(!v.body||cheb(p,v)<=stop))break;let best=null,bd=hd(v),bdir=0;
  const sm=vBig(v);for(let d=0;d<6;d++){const n=step(v,d);if(!vFits(n.x,n.y,o.strict,sm))continue;const dd=v.body?cheb(p,n):dV(p,{...v,x:n.x,y:n.y});if(sign<0?dd<bd:dd>bd){bd=dd;best=n;bdir=d}}
  if(!best)break;vPut(v,best.x,best.y);v.face=bdir;if(sm)smashUnder(v);if(v.body)(v.path=v.path||[]).push({x:v.x,y:v.y,body:v.body.map(c=>({...c}))});if(vBig(v)&&!o.strict)shoveOut(bdir).forEach(e=>{if(!sh.includes(e.o))sh.push(e.o)})}
  if(sign>0&&live().length)faceTo(p);
  return sh}
/* the lead body chases p; the others chase their own nearest hero, so the swarm drifts apart unless something pulls it together */
function swStep(v,i,p,steps,stop,sign){const b=swBodies(v)[i],r=reach(b,steps,b),sc=c=>sign<0?Math.max(stop,cheb(p,c)):-cheb(p,c);let best=null,bs=sc(b),bn=0;
  for(const k in r){const[x,y]=k.split(',').map(Number),s=sc({x,y});if(s<bs||(s===bs&&best&&r[k]<bn)){bs=s;bn=r[k];best={x,y}}}
  if(best)swSet(v,i,best.x,best.y,dirC(HC(b.x,b.y),HC(best.x,best.y)))}
function swSlide(p,steps,stop,sign){const v=S.sd.v,L=live();swBodies(v).forEach(b=>{const t=sign<0&&b.i?L.slice().sort((a,c)=>cheb(a,b)-cheb(c,b))[0]||p:p;swStep(v,b.i,t,steps,b.i&&t!==p?1:stop,sign)});
  if(live().length)faceTo(p);return []}
/* bodies follow the hit reactions: tearing a body's page drops it, recovering the page regrows it next to the swarm */
function swSync(v){const want=VINTEL.swarm.react.filter(r=>rxLive(v,r)).map(r=>r.id),all=swBodies(v),out={lost:[],grew:[]};let keep=all.filter(b=>want.includes(b.k));if(!keep.length)keep=[all[0]];
  out.lost=all.filter(b=>!keep.includes(b)).map(b=>b.k);v.x=keep[0].x;v.y=keep[0].y;v.face=keep[0].f;v.pk=keep.map(b=>b.k);v.sw=keep.slice(1).map(b=>({x:b.x,y:b.y,f:b.f}));
  for(const k of want){if(v.pk.includes(k))continue;const t=freeTiles((x,y)=>dV({x,y},v)===1)[0];if(!t)break;v.sw.push({x:t.x,y:t.y,f:v.face});v.pk.push(k);out.grew.push(k)}
  return out}
/* a big villain knocks down any wall or rubble under its body; vMove plays the dust and logs it */
function smashUnder(v){const sd=S.sd,ks=vCells(v).map(c=>c.x+','+c.y).filter(k=>sd.obs.includes(k)||sd.walls.some(w=>w.k===k));if(!ks.length)return;
  sd.obs=sd.obs.filter(k=>!ks.includes(k));sd.walls=sd.walls.filter(w=>!ks.includes(w.k));(v.smashed=v.smashed||[]).push(...ks)}
const vToward=(p,steps,stop,o={})=>vSlide(p,steps,stop,o,-1);
const vAway=(p,steps,o={})=>vSlide(p,steps,0,o,1);
/* Version 115: a hex stores how much evasion it takes away (true = 4, from older saves and EMP) */
const hexA=x=>x===true?4:(x||0);
/* Version 121 (Tyler): villain accuracy grows at half speed (+1 every 2 levels). Version 122: it starts at +4 at level 1 */
const vLvB=(k,lv)=>k==='acc'?4+Math.floor((lv-1)/2):lv-1;
function vStat(k){const sd=S.sd;return VILLAINS[sd.vkey][k]+vLvB(k,sd.v.level)-(k==='eva'?hexA(sd.v.hex):0)-(k==='acc'&&sd.v.blind?4:0)}
function log(k,t){S.sd.log.push({k,t});if(S.sd.log.length>60)S.sd.log.shift()}
/* comic SFX: positions are in board units (see HC) */
let fxTimer;
function fx(cx,cy,t,k='hit'){const sd=S.sd;if(!sd)return;sd.fx=sd.fx||[];sd.fx.push({cx,cy,t,k,born:Date.now()});
  clearTimeout(fxTimer);fxTimer=setTimeout(()=>{if(S.sd&&S.sd.fx){S.sd.fx=S.sd.fx.filter(f=>Date.now()-f.born<1600);render()}},1700)}
const fxP=(x,y,t,k)=>{const c=HC(x,y);fx(c.cx,c.cy,t,k)};
const fxU=(u,t,k)=>fxP(u.x,u.y,t,k);
const fxV=(t,k)=>{const c=vCtr(S.sd.v);fx(c.cx,c.cy,t,k)};
const SFX_HIT=['BAM!','POW!','WHAM!','KRAK!','THWACK!','BOOM!'],SFX_VHIT=['THOOM!','KRASH!','SMACK!','CRUNCH!'];
function mkUnit(h,x,y){return {hid:h.id,x,y,moved:false,acted:false,ko:false,anchor:setOn(h,'lode'),res:{tech:pwrMax(h),magic:arcMax(h)},innUsed:0,buffDice:0,buffStr:0}}
function freeTiles(f){const out=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!blocked(x,y)&&(!f||f(x,y)))out.push({x,y});return out}

function focusV(i){const sd=S.sd;if(i<0||!sd.vl[i])return;sd.vi=i;sd.v=sd.vl[i].v;sd.vkey=sd.vl[i].key}
/* lair terrain (V76): each lair has its own layout of rubble, fixed walls, pits and hazard hexes; the finale rolls a random mix.
   wall and pit lists are segment lengths, laid in straight hex lines. Pieces never touch a villain or the heroes' start row,
   and a piece that would cut off part of the floor is thrown out and re-rolled. */
const LAIR={
  gallows:{rub:2,wall:[3,2],haz:2,hn:'live wiring'},      // lab benches, sparking cables
  quarry:{rub:6,pit:[2,1,1]},                             // quarry floor: boulders and blasting holes
  cantor:{rub:2,wall:[3,3],pit:[1]},                      // club: bar counters, tables, a trapdoor
  architect:{rub:1,wall:[2,2,2],pit:[1],haz:2,hn:'molten floor'},
  helios:{rub:3,pit:[2],haz:3,hn:'reactor slag'},
  serpent:{rub:3,pit:[3,2]},                              // sewer channels with crossings
  lode:{rub:4,wall:[3,2]},                                // scrapyard: crushed cars, scrap fences
  noct:{rub:2,wall:[1,1,1,1,1]},                          // pillars to hide behind
  swarm:{rub:2,wall:[2],pit:[1,1,1]},                     // hive comb and burrows
  bomber:{rub:2,pit:[3,2]},                               // gaps between rooftops
  grid:{rub:3,wall:[1],pit:[2]}};                         // little cover for a beam fight
function randLair(){const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),seg=(n,lo,hi)=>Array.from({length:n},()=>r(lo,hi));
  return {rub:r(3,6),wall:seg(r(1,3),1,3),pit:seg(r(1,3),1,2),haz:Math.random()<.5?r(1,3):0,hn:'molten floor'}}
function layTerrain(L){const sd=S.sd,taken=k=>sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k)||sd.haz.some(h=>h.k===k);
  const ok=(x,y)=>inB(x,y)&&y>=2&&y<=N-3&&!taken(x+','+y)&&!sd.vl.some(o=>dV({x,y},o.v)<=1)&&!(sd.exits||[]).includes(x+','+y);
  /* every open hex must still connect to the heroes' start row */
  const open=()=>{const solid=k=>sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k);const seen=new Set(),q=[];
    for(let x=0;x<N;x++){const k=x+','+(N-1);if(!solid(k)){seen.add(k);q.push({x,y:N-1})}}
    while(q.length){const p=q.shift();for(const n of nbrs(p)){const k=n.x+','+n.y;if(!inB(n.x,n.y)||seen.has(k)||solid(k)||sd.vl.some(o=>inV(o.v,n.x,n.y)))continue;seen.add(k);q.push(n)}}
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=x+','+y;if(!solid(k)&&!sd.vl.some(o=>inV(o.v,x,y))&&!seen.has(k))return false}
    return sd.vl.every(o=>vCells(o.v).some(c=>nbrs(c).some(n=>seen.has(n.x+','+n.y))))};
  const put=(len,add,del)=>{for(let g=0;g<60;g++){const x=rnd(N)-1,y=1+rnd(N-2),d=pick([0,1,5]);const ks=[];let p={x,y};
      for(let i=0;i<len;i++){if(!ok(p.x,p.y))break;ks.push(p.x+','+p.y);p=step(p,d)}
      if(ks.length<len||new Set(ks).size<len)continue;ks.forEach(add);if(open())return;ks.forEach(del)}};
  (L.wall||[]).forEach(n=>put(n,k=>sd.walls.push({k,ttl:1,perm:1}),k=>{sd.walls=sd.walls.filter(w=>w.k!==k)}));
  (L.pit||[]).forEach(n=>put(n,k=>sd.pits.push(k),k=>{sd.pits=sd.pits.filter(e=>e!==k)}));
  for(let i=0;i<(L.rub||0);i++)put(1,k=>sd.obs.push(k),k=>{sd.obs=sd.obs.filter(e=>e!==k)});
  for(let i=0;i<(L.haz||0);i++)put(1,k=>sd.haz.push({k,ttl:1,dmg:2,perm:1,n:L.hn}),k=>{sd.haz=sd.haz.filter(h=>h.k!==k)})}
/* Version 78 (Tyler): half the lairs have an evidence terminal on the villain's back edge (row 0). A hero on it or beside it can hack it
   with their action for TERM_INTEL intel. Area damage (charged attacks, bombs, shockwaves) on its hex destroys it. */
const TERM_INTEL=2;
const termP=()=>{const[x,y]=S.sd.term.k.split(',').map(Number);return {x,y}};
/* Version 92 (Tyler): the terminal appears in every fight without a special henchman, instead of half of all fights */
function placeTerm(){const sd=S.sd;sd.term=null;if(sd.vl.some(o=>eliteOf(o.key)&&o.v.level>=3))return;
  const ks=[];for(let x=0;x<N;x++){const k=x+',0';if(sd.obs.includes(k)||sd.walls.some(w=>w.k===k)||sd.pits.includes(k)||sd.haz.some(h=>h.k===k)||(sd.exits||[]).includes(k)||sd.vl.some(o=>inV(o.v,x,0)))continue;ks.push(k)}
  if(ks.length)sd.term={k:pick(ks)}}
function termHit(inZ,src){const sd=S.sd;if(!sd.term||!inZ(termP()))return;const p=termP();sd.term=null;fxP(p.x,p.y,'CRUNCH!','vhit');log('vill',`${src} wrecks the evidence terminal.`)}
const canHack=u=>!!(S.sd.term&&!u.acted&&!u.ko&&cheb(u,termP())<=1);
function hack(){const sd=S.sd,u=sd.units[sd.sel];if(!u||!canHack(u))return;const h=heroOf(u);
  return act(async()=>{u.acted=true;const p=termP();A.lunge('h'+u.hid,HC(p.x,p.y));await A.sparkle(HC(p.x,p.y),COL.cyan);sd.term=null;sd.termGot=(sd.termGot||0)+TERM_INTEL;S.intel+=TERM_INTEL;
    fxP(p.x,p.y,'DOWNLOADED!','good');log('hero',`${h.name} hacks the evidence terminal. +${TERM_INTEL} intel.`)})}
function startShowdown(opt={}){
  const fin=!!opt.finale;N=fin?11:9;
  const keys=fin?opt.keys:[S.inv.v],q=fin?(opt.quality||'normal'):invQuality(S.inv.clues);
  const sd=S.sd={N,finale:fin,vkey:keys[0],quality:q,round:q==='ambush'?0:1,obs:[],units:[],hench:[],civs:[],vl:[],vi:0,
    tdk:{},walls:[],pits:[],haz:[],bombs:[],beams:[],sel:null,mode:null,busy:false,log:[],evac:0,harmed:0,woundsBy:{},result:null,fx:[],intro:!FAST};
  sd.hexv=1;const spots=fin?[[2,1],[7,1]]:[[4,1]];
  keys.forEach((k,i)=>{const vs=vState(k),sh=VILLAINS[k].shape,big=sh==='big',ser=sh==='serpent';sd.vl.push({key:k,v:{x:spots[i][0]+(big?1:0),y:spots[i][1]+(big||ser?1:0)+(k==='grid'?2:0),shape:sh,face:5,level:vs.level,deck:shuffle(vs.deck.map(e=>buildCard(k,e))),discard:[],wounds:[],last:null}});
    if(ser){const v=sd.vl[sd.vl.length-1].v;v.body=[0,1,2,3].map(j=>({x:Math.min(N-1,spots[i][0]+j),y:spots[i][1]}));v.ate=0;v.grow=0}
    if(sh==='swarm'){const v=sd.vl[sd.vl.length-1].v;const sx=spots[i][0],taken=(x,y)=>sd.vl.slice(0,-1).some(o=>inV(o.v,x,y));v.sw=[[-2,1],[2,1],[-1,2],[1,2],[-3,2],[3,2]].map(([dx,y])=>({x:sx+dx,y:y+spots[i][1],f:5})).filter(p=>inB(p.x,p.y)&&!taken(p.x,p.y)).slice(0,2);v.pk=['hive','sting','shell'].slice(0,v.sw.length+1)}
    if(k==='noct')sd.vl[sd.vl.length-1].v.hide=q!=='prepared'});
  focusV(0);
  sd.exits=mkExits(N,fin);layTerrain(fin?randLair():LAIR[keys[0]]||LAIR.gallows);placeTerm();
  const hs=party();
  if(q==='ambush'&&!S.facilities.includes('hangar')){hs.forEach(h=>{const t=pick(freeTiles((x,y)=>y>=3&&y<=N-2));sd.units.push(mkUnit(h,t.x,t.y))})}
  else{const cols=fin?[2,4,6,8]:[1,3,5,7];hs.forEach((h,i)=>{let x=cols[i%cols.length],y=N-1;if(blocked(x,y)){const t=pick(freeTiles((a,b)=>b>=N-2));x=t.x;y=t.y}sd.units.push(mkUnit(h,x,y))})}
  hs.forEach(h=>{h.comp=stat(h,'maxComp');h.cd=0});
  lastPos={};
  sd.vl.forEach((o,vi)=>{const n=Math.min(4,fin?Math.ceil(o.v.level/2):o.v.level)+(q==='ambush'?1:0);
    for(let i=0;i<n;i++){const t=pick(freeTiles((x,y)=>y>=1&&y<=4&&Math.abs(x-(o.v.x+.5))<=3))||pick(freeTiles((x,y)=>y<=5));if(t)sd.hench.push({id:'h'+vi+'_'+i,owner:o.key,x:t.x,y:t.y,hp:henchHp(2)})}
    if(eliteOf(o.key)&&o.v.level>=3){const t=freeTiles((x,y)=>dV({x,y},o.v)===1)[0]||pick(freeTiles((x,y)=>y<=4));if(t){sd.hench.push(mkElite(o,t));sd.elites=(sd.elites||[]).concat(o.key)}}});
  if(S.facilities.includes('dojo'))sd.units.forEach(u=>u.evaNext=6);
  /* about a third of civilians start deep in the lair, behind or beside the villain */
  const nc=opt.civs||3;for(let i=0;i<nc;i++){const dry=(x,y)=>!sd.haz.some(h=>h.k===x+','+y),t=(Math.random()<.35&&pick(freeTiles((x,y)=>y<=1&&dry(x,y))))||pick(freeTiles((x,y)=>y>=2&&y<=N-3&&dry(x,y)));if(t)sd.civs.push({id:i,x:t.x,y:t.y})}
  if(q==='prepared')sd.vl.forEach(o=>o.v.wounds.push(o.v.deck.shift()));
  sd.vl.forEach(o=>{if(o.v.sw)swSync(o.v)});
  sd.vl.forEach((o,i)=>{focusV(i);const t=live().slice().sort((a,b)=>dV(a,o.v)-dV(b,o.v))[0];if(t)faceTo(t)});focusV(0);
  S.phase='sd';S.view='mission';vWarn();
  log('sys',fin?`Event comic: ${keys.map(k=>VILLAINS[k].name).join(' and ')} strike together!`:`Issue #${S.issue}: the lair of ${VILLAINS[keys[0]].name}. ${QUAL[q].n}.`);
  if(q==='ambush'){log('sys','Ambush! The villain moves first.');if(!sd.intro){render();setTimeout(villainPhase,500)}}
  else log('sys',fin?'Round 1. Tap a villain to target it, and a hero to act.':'Round 1. Tap a hero to act.');
}
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
const TYPE_SFX={multi:'BARRAGE!',walls:'BUILD!',hazard:'MELTDOWN!',cage:'CAGED!',shrapnel:'DEMOLISH!',fortify:'FORTIFY!',charge:'CHARGING!',strike:'STRIKE!',sweep:'SHOCKWAVE!',summon:'BACKUP!',endanger:'HOSTAGE!',taunt:'TAUNT!',vanish:'POOF!',reanimate:'RECHARGE!',puppet:'OBEY!',rampage:'RAMPAGE!',swallow:'GULP!',pull:'ATTRACT!',repel:'REPEL!',fade:'FADE…',converge:'SWARM!',scatter:'SCATTER!',leap:'BOING!',bomb:'TSSS!',detonate:'KABOOM!',airburst:'LOOK UP!',beam:'ZZARK!',burrow:'SHUNK!'};
const TAC_SFX={weak:'CRACK!',armor:'TINK!',over:'OPENING!',counter:'COUNTER!',mono:'BLAH BLAH…',shield:'NO!',escape:'HA HA!',glance:'SOLID!'};
const TEAR=(()=>{const z=[];for(let i=0;i<=12;i++)z.push([i*100/12,48+(i%2?6:-5)+((i*37)%5)-2]);return z})();
const tearTop=`polygon(0 0,100% 0,${TEAR.slice().reverse().map(([x,y])=>`${x}% ${y}%`).join(',')})`;
const tearBot=`polygon(${TEAR.map(([x,y])=>`${x}% ${y}%`).join(',')},100% 100%,0 100%)`;
function reveal(o){if(FAST)return Promise.resolve();
  return new Promise(res=>{
    const L=document.createElement('div');L.id='cards';if(o.vk){L.className='vth';L.setAttribute('style',vSty(o.vk))}L.setAttribute('role','dialog');L.setAttribute('aria-label',`${o.title}: ${o.text}`);
    const page=(cls,style='')=>`<div class="pg ${cls||''}${o.sig?' sig':''}" style="${style}"><div class="hd"><span>${o.vk?vIc(o.vk):''}${esc(o.deck)}</span><span>${esc(o.tag||'')}</span></div>${o.rib?`<div class="sigrib ${o.ribCls||''}">${esc(o.rib)}</div>`:''}
      <div class="art ${o.art||''}">${o.vk?vWm(o.vk):''}<span>${esc(o.sfx)}</span></div><h2>${esc(o.title)}</h2><div class="tx">${esc(o.text)}</div>
      ${o.foot?`<div class="tx small"><b>${esc(o.foot)}</b></div>`:''}<div class="ft">${o.mode==='tear'?'Tap to tear it out':'Tap to resolve'}</div></div>`;
    const tear=o.mode==='tear';
    L.innerHTML=tear?`<div class="book tearbook">${page('top',`clip-path:${tearTop}`)}${page('bot',`clip-path:${tearBot}`)}
        <svg class="tearline" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${TEAR.map(([x,y])=>`${x},${y}`).join(' ')}" vector-effect="non-scaling-stroke"/></svg><span class="woundstamp">Wound!</span></div>
        <button class="btn pri cardgo" type="button">Tear it out</button>`
      :`<div class="book">${page()}<div class="cover ${o.coverCls||''}"><small>${esc(o.coverTop)}</small><b>${esc(o.coverTitle)}</b><small>${esc(o.coverFoot||'')}</small></div></div>
        <button class="btn pri cardgo" type="button">Resolve</button>`;
    document.body.appendChild(L);const ready=Date.now()+(tear||RM?250:850);
    const btn=L.querySelector('.cardgo');setTimeout(()=>btn.focus({preventScroll:true}),RM?0:800);
    const go=e=>{e.stopPropagation();if(Date.now()<ready)return;L.removeEventListener('click',go);L.classList.add('leaving');
      L.querySelector('.book').classList.add(tear?'torn':'out');setTimeout(()=>{L.remove();res()},RM?0:tear?700:280)};
    L.addEventListener('click',go)})}
function villainCardView(c){const sd=S.sd,def=VILLAINS[sd.vkey];return {vk:sd.vkey,mode:'open',deck:`${def.name} · Playbook`,tag:`Round ${Math.max(1,sd.round)}`,sfx:TYPE_SFX[c.t]||'!',title:c.n,text:c.txt,
  sig:!!c.sig,rib:c.sig?'★ Signature Move ★':'',art:'vil',coverCls:c.sig?'vil sig':'vil',coverTop:c.sig?'★ Signature move! ★':'Villain turn',coverTitle:def.name,coverFoot:`Issue #${S.issue} · ${sd.v.deck.length} pages left`}}
const ARCN={front:'front',flank:'side',rear:'rear'};const arcTxt=a=>a.map(x=>ARCN[x]).join(' and ')+(a.length>1?' arcs':' arc');
function tacticCardView(tc,h,side,inArc,why){return {mode:'open',deck:tc.sig?`${VILLAINS[tc.sig].short} · Hit reaction`:'Hit deck',tag:h.name,sfx:tc.sig?tc.sfx:TAC_SFX[tc.id]||'!',title:tc.n,text:tc.txt,
  rib:tc.sig?'Signature reaction':'',ribCls:'r',foot:[why||(tc.arc&&side?`${h.name} struck from the ${ARCN[side]} arc: ${inArc?'it triggers!':'wrong side, it does nothing.'}`:''),tc.sig&&tc.src?`Lost when ${VILLAINS[tc.sig].cards[tc.src].n} is torn from the playbook.`:''].filter(Boolean).join(' '),art:'tac',coverCls:'tac',coverTop:'Hit!',coverTitle:`${h.name} connects`,coverFoot:'Draw a hit card'}}
async function woundAnim(foot,q){const sd=S.sd,v=sd.v,k=sd.vkey;if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[];log('sys','The playbook is reshuffled.')}
  if(v.excise&&v.deck.length>1){const top=v.deck.slice(0,v.excise);v.excise=0;top.forEach(c=>markSeen(k,c.id));
    const i=await choose(`Find the Flaw · ${VILLAINS[k].short}`,'Choose the page this wound tears out.',top.map(c=>({l:`${c.sig?'★ ':''}${c.n}`,s:c.txt})));const p=top[i];v.deck.splice(v.deck.indexOf(p),1);v.deck.unshift(p);log('hero',`Find the Flaw: ${p.n} is the page that tears.`)}
  const c=v.deck[0];if(c)markSeen(k,c.id);if(q)q.page=c;if(c&&!q)await reveal({vk:k,mode:'tear',deck:`${VILLAINS[k].name} · Playbook`,tag:`${Math.max(0,v.deck.length+v.discard.length-1)} pages left`,sfx:TYPE_SFX[c.t]||'!',title:c.n,text:c.txt,foot,art:'vil',sig:!!c.sig,rib:c.sig?'★ Signature Move ★':''});
  const was=VINTEL[k].react.filter(r=>rxLive(v,r));
  v.hurtAt=Date.now();const end=woundV();log('hero',`${c?c.n:'A page'} is torn from the playbook.`);
  const splash=(...a)=>q?q.splash.push(a):breakSplash(...a);
  if(c&&c.sig){log('hero',`${c.brk} ${c.n} is gone.`);await splash(c.brk,`${c.n} is torn from ${VILLAINS[k].name}'s playbook`,'Signature Move destroyed')}
  for(const r of was.filter(r=>!rxLive(v,r))){markSeenR(k,r.id);log('hero',`${r.brk} The ${r.n} reaction leaves the hit deck.`);await splash(r.brk,`${r.n} is gone from the hit deck`,'Signature reaction destroyed')}
  if(v.sw&&!v.down){const s=swSync(v);s.lost.forEach(b=>{log('hero',`The ${SWN[b].toLowerCase()} body falls out of the swarm.`);fxV('SPLAT!','hit')})}
  vWarn();render();return end}
/* one panel per attack: the attack roll and each hit's reaction card, then 100ms later the strength checks beside them */
function attackPanel(o){if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='atk';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${o.name} attacks: ${o.hits} hits, ${o.rows.filter(r=>r.ok).length} wounds`);
    const row=(r,dl)=>{const tc=r.tc,note=r.note?`<div class="note">${esc(r.note)}</div>`:'';
      const res=r.ok?'WOUND!':r.block?'BLOCKED!':'CLANG!',roll=r.block?esc(r.blockTxt):r.auto?`${tc.sig?esc(tc.n):'Weak point'}: the wound lands.`:`Strength roll <b>${r.r}</b> + ${r.str} = ${r.r+r.str} vs toughness ${r.tough}${r.r===20?' (natural 20)':r.r===1?' (natural 1)':''}`;
      return `<div class="arow"><div class="rx ${tc.sig?'sig':''} ${r.off?'off':''}">${dl}<span class="sfx">${esc(tc.sig?tc.sfx:TAC_SFX[tc.id]||'!')}</span><h4>${esc(tc.n)}</h4><div>${esc(tc.txt)}</div>${note}</div>
        <div class="st ${r.ok?'ok':''}"><span class="res">${res}</span><div>${roll}</div>${r.page?`<div class="torn">Torn out: ${r.page.sig?'★ ':''}${esc(r.page.n)}</div>`:''}</div></div>`};
    const isHit=d=>d===20||(d!==1&&d+o.acc>=o.eva),acc=(d,i)=>`<div class="dl"><span class="die ${isHit(d)?'hit':''}">${d}</span><small>Die ${i+1}: ${d} + ${o.acc} = ${d+o.acc} vs evasion ${o.eva}${d===20?' (natural 20)':d===1?' (natural 1)':''}</small></div>`;
    let k=0;const rows=o.rolls.map((d,i)=>{if(!isHit(d))return `<div class="arow"><div class="rx miss">${acc(d,i)}</div><div class="st"><span class="res">MISS</span><div>No hit card drawn.</div></div></div>`;
      const r=o.rows[k++];return r?row(r,acc(d,i)):`<div class="arow"><div class="rx">${acc(d,i)}</div><div class="st"><span class="res">—</span><div>The villain is already down.</div></div></div>`});
    L.innerHTML=`<div class="atkp"><div class="ah"><b>${esc(o.name)} attacks!</b><small>${o.rolls.length} ${o.rolls.length===1?'die':'dice'} · ${o.hits} hit${o.hits===1?'':'s'} · ${o.rows.filter(r=>r.ok).length} wound${o.rows.filter(r=>r.ok).length===1?'':'s'}</small></div>
      <div class="rows">${rows.join('')}</div></div><button class="btn pri cardgo" type="button">Continue</button>`;
    document.body.appendChild(L);const ready=Date.now()+(RM?150:450);const btn=L.querySelector('.cardgo');setTimeout(()=>btn.focus({preventScroll:true}),RM?0:300);
    const go=e=>{e.stopPropagation();if(Date.now()<ready)return;L.removeEventListener('click',go);L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:200)};
    L.addEventListener('click',go)})}
/* a signature reaction stays in the hit deck while the page that carries it is still in the playbook */
const rxLive=(v,r)=>!r.src||[...v.deck,...v.discard].some(p=>p.id===r.src);
function breakSplash(title,sub,tag){if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='brk';L.setAttribute('role','alert');
    L.innerHTML=`<div class="burst"><div class="bt"><span>${esc(tag)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></div></div>`;document.body.appendChild(L);
    const t0=Date.now();let done=false;const go=()=>{if(done||Date.now()-t0<350)return;done=true;L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:240)};
    L.addEventListener('click',e=>{e.stopPropagation();go()});setTimeout(go,RM?1600:2600)})}
/* several breaks from one attack stack in one overlay, each bursting in shortly after the last; one tap clears them all */
function breakStack(list){if(!list.length)return Promise.resolve();if(list.length===1)return breakSplash(...list[0]);if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='brk';L.className='stack';L.setAttribute('role','alert');const gap=RM?0:420;
    L.innerHTML=list.map(([title,sub,tag],i)=>`<div class="burst" style="animation-delay:${i*gap}ms"><div class="bt"><span>${esc(tag)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></div></div>`).join('');document.body.appendChild(L);
    const t0=Date.now(),all=(list.length-1)*gap;let done=false;const go=()=>{if(done||Date.now()-t0<all+350)return;done=true;L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:240)};
    L.addEventListener('click',e=>{e.stopPropagation();go()});setTimeout(go,all+(RM?1600:2800))})}
/* a villain about to play a Signature Move shouts a hint; tearing that page first cancels it */
function vWarn(){const sd=S.sd;if(!sd)return;sd.vl.forEach(o=>{const v=o.v,top=v.deck[0];
  if(v.down||v.charge||!top||!top.sig||sd.result){v.warn=null;return}
  if(v.warn===top.uid)return;v.warn=top.uid;log('vill',`${VILLAINS[o.key].short} shouts: “${top.shout}”`)})}

/* ---------- combat ---------- */
function damageHero(u,n){const h=heroOf(u);if(u.stasis&&n>0){fxU(u,'NO EFFECT','good');log('hero',`Time Stop: ${h.name} takes no damage.`);return}if(S.cheat&&S.cheat.god){log('sys',`${h.name} shrugs off ${n} damage (invincible).`);return}if(n>1&&setOn(h,'architect')){n--;log('hero',`Load-Bearing: ${h.name} takes 1 less.`)}if(n>2&&auraOn(u,'brace')){n--;log('hero',`Shield Wall: ${h.name} takes 1 less.`)}if(u.dr&&n>0){const m=Math.max(1,n-u.dr);log('hero',`${h.name}'s guard soaks ${n-m} damage.`);n=m}if(u.absorb&&n>0){const m=Math.min(u.absorb,n);u.absorb-=m;n-=m;log('hero',`${h.name}'s shield absorbs ${m} damage${u.absorb?` (${u.absorb} left)`:' and fades'}.`)}h.hp-=n;u.hurtAt=Date.now();if(n>0&&h.hp>0)painGain(u,h);if(h.hp<=0&&!u.anti&&S.facilities.includes('antivenom')){h.hp=1;u.anti=true;fxU(u,'ANTIVENOM!','good');log('hero',`Antivenom Lab: ${h.name} stays on their feet with 1 health.`)}if(h.hp<=0){h.hp=0;u.ko=true;u.guard=false;log('vill',`${h.name} is down!`)}}
function harmCiv(c,why){const sd=S.sd;sd.civs=sd.civs.filter(o=>o!==c);sd.harmed++;fxP(c.x,c.y,'AAAH!','vhit');log('vill',`A civilian is hurt by ${why}.`)}
/* Civilians are saved on an exit hex (sd.exits). c.f = id of the hero they follow, c.held = id of the henchman dragging them. */
function mkExits(n,fin){const e=[`0,${n-1}`,`${n-1},${n-1}`];if(fin)e.push(`${Math.random()<.5?0:n-1},${Math.floor(n/2)}`);return e}
const isExit=p=>(S.sd.exits||[]).includes(p.x+','+p.y);
const followers=u=>S.sd.civs.filter(c=>c.f===u.hid);
const civHeld=c=>!!c.held&&S.sd.hench.some(m=>m.id===c.held);
const panicky=c=>!c.f&&!civHeld(c)&&!live().some(u=>cheb(u,c)<=1);
function saveCiv(c,u){const sd=S.sd;if(!sd.civs.includes(c))return;sd.civs=sd.civs.filter(o=>o!==c);sd.evac++;fxP(c.x,c.y,'SAVED!','good');
  const h=u&&heroOf(u);log('hero',h?`${h.name} gets a civilian out through the exit.`:'A civilian makes it out through an exit.');if(h&&gearHas(h,'rescue'))lifeline(u,h)}
function civHazard(c){const sd=S.sd,k=c.x+','+c.y;if(sd.haz.some(h=>h.k===k))harmCiv(c,'the molten floor');else if(litMap()[k])harmCiv(c,'a beam')}
function letGo(u,why){const fs=followers(u);fs.forEach(c=>c.f=null);if(fs.length&&why)log('hero',`${heroOf(u).name} ${why}`);return fs.length}
/* after a hero moves, the civilians they lead catch up through free hexes; a hero on an exit sends them all out */
function civFollow(u){const sd=S.sd,fs=followers(u);if(!fs.length)return;
  if(u.ko){letGo(u,'goes down, and the civilians scatter.');return}
  if(isExit(u)){fs.forEach(c=>saveCiv(c,u));return}
  const placed=[u],lim=stat(heroOf(u),'move')+3,near=p=>placed.some(o=>cheb(o,p)<=1);
  for(const c of fs.sort((a,b)=>cheb(a,u)-cheb(b,u))){
    if(near(c)){placed.push(c);continue}
    const r=reach(c,lim,c);let best=null,bd=1e9;for(const k in r){const[x,y]=k.split(',').map(Number);if(r[k]<bd&&near({x,y})){bd=r[k];best={x,y}}}
    if(best){c.x=best.x;c.y=best.y;placed.push(c);civHazard(c);if(isExit(c))saveCiv(c,u)}
    else{c.f=null;fxP(c.x,c.y,'WAIT!','miss');log('hero',`A civilian can't keep up with ${heroOf(u).name} and is left behind.`)}}}

/* Avoid Damage uses one action. Nearby safe cover improves the defense, and
   a missed targeted attack can strike cover if it lies in the attack path. */
function avoidCover(u){
  const sd=S.sd,beam=litMap(),out=[];
  for(const p of nbrs(u)){
    if(!inB(p.x,p.y))continue;
    const k=p.x+','+p.y;
    if(sd.pits.includes(k)||sd.haz.some(h=>h.k===k)||(sd.bombs||[]).some(b=>b.k===k)||beam[k])continue;
    if(sd.walls.some(w=>w.k===k))out.push({...p,k,kind:'wall'});
    else if(sd.obs.includes(k))out.push({...p,k,kind:'rubble'});
    else if(sd.term&&sd.term.k===k)out.push({...p,k,kind:'terminal'});
    else {
      const ally=sd.units.find(o=>o!==u&&!o.ko&&o.x===p.x&&o.y===p.y);
      if(ally)out.push({...p,k,kind:'hero',unit:ally});
      else{const civ=sd.civs.find(o=>o.x===p.x&&o.y===p.y);if(civ)out.push({...p,k,kind:'civilian',unit:civ})}
    }
  }
  return out;
}
const avoidEva=u=>u.avoidDamage?(avoidCover(u).length?5:3):0;
function avoidDamage(){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||u.acted||u.ko||u.avoidDamage||sd.busy||sd.result)return;
  return act(async()=>{
    u.acted=true;u.avoidDamage=true;
    await A.shield(ctrU(u),COL.cyan,true);
    const n=avoidEva(u);
    fxU(u,'AVOID +'+n,'good');
    log('hero',heroOf(u).name+' avoids damage: +'+n+' evasion until the next round'+(n===5?' with adjacent cover':'')+'.');
  });
}
async function avoidRedirect(u,source,dmg,label){
  if(!u.avoidDamage)return false;
  const covers=avoidCover(u);
  /* Ranged attacks must pass through the cover hex. An adjacent melee miss
     can strike a target beside both attacker and defender. */
  const origins=source.body||source.sw||source.shape?vCells(source):[source];
  const found=[];
  for(const from of origins){
    const dist=cheb(from,u),line=dist>1?hexLine(from,u):[];
    for(const cover of covers){
      const valid=dist<=1?cheb(from,cover)<=1:line.some(p=>p.x===cover.x&&p.y===cover.y);
      if(valid)found.push({cover,dist:cheb(from,cover)});
    }
  }
  if(!found.length)return false;
  const priority={wall:0,rubble:1,terminal:2,hero:3,civilian:4};
  found.sort((a,b)=>priority[a.cover.kind]-priority[b.cover.kind]||a.dist-b.dist);
  const c=found[0].cover,sd=S.sd,name=heroOf(u).name;
  const target=c.kind==='hero'?heroOf(c.unit).name:c.kind==='civilian'?'a civilian':c.kind==='wall'?'a wall':c.kind==='rubble'?'rubble':'the evidence terminal';
  log('hero',name+' ducks behind '+target+'; '+label+' strikes it instead.');
  if(c.kind==='hero'){
    if(!await wardBlocks(c.unit)){damageHero(c.unit,dmg);fxU(c.unit,'STRAY HIT!','vhit')}
  }else if(c.kind==='civilian'){
    harmCiv(c.unit,'a redirected '+label);
  }else if(c.kind==='terminal'){
    termHit(p=>p.x===c.x&&p.y===c.y,label);
  }else if(c.kind==='rubble'){
    sd.obs=sd.obs.filter(k=>k!==c.k);fxP(c.x,c.y,'SMASH!','vhit');
  }else{
    const wall=sd.walls.find(w=>w.k===c.k);
    if(wall&&!wall.perm){sd.walls=sd.walls.filter(w=>w!==wall);fxP(c.x,c.y,'CRACK!','vhit')}
    else fxP(c.x,c.y,'BLOCKED!','good');
  }
  render();
  return true;
}
function rallySpirit(){const sd=S.sd,u=sd&&sd.units[sd.sel];if(!u||u.ko||u.acted||sd.busy||sd.result)return;sd.mode=sd.mode==='rallySpirit'?null:'rallySpirit';render()}
function escort(){const sd=S.sd,u=sd.units[sd.sel];if(!u||u.ko||(u.acted&&!u.freeEvac))return;const h=heroOf(u),cs=sd.civs.filter(c=>c.f!==u.hid&&!civHeld(c)&&cheb(c,u)<=1);if(!cs.length)return;
  return act(async()=>{if(u.freeEvac)u.freeEvac=false;else u.acted=true;A.lunge('h'+u.hid,HC(cs[0].x,cs[0].y));await Promise.all(cs.map(c=>A.sparkle(HC(c.x,c.y),COL.yel)));
    cs.forEach(c=>{c.f=u.hid;fxP(c.x,c.y,'THIS WAY!','good')});log('hero',`${h.name} gathers ${cs.length} civilian${cs.length>1?'s':''}. They follow ${h.name} until they reach an exit.`);
    if(isExit(u))cs.forEach(c=>saveCiv(c,u))})}
/* villain turn: loose civilians with nobody beside them run 1 hex from the nearest threat; they may run into hazards or out an exit */
async function civPanic(){const sd=S.sd,T=[];sd.vl.forEach(o=>{if(!o.v.down)vCells(o.v).forEach(c=>T.push(c))});sd.hench.forEach(m=>T.push(m));(sd.bombs||[]).forEach(b=>T.push(bombP(b)));
  const scared=sd.civs.filter(panicky);if(!T.length||!scared.length)return;const dT=p=>Math.min(...T.map(t=>cheb(t,p)));let ran=0;
  for(const c of scared){if(!sd.civs.includes(c))continue;const d0=dT(c);
    const opts=nbrs(c).filter(n=>!blocked(n.x,n.y)).map(n=>({n,d:dT(n)+Math.random()*.4})).filter(o=>o.d>=d0+1).sort((a,b)=>b.d-a.d);
    fxP(c.x,c.y,pick(['HELP!','AIEE!','RUN!','EEK!']),'panic');c.panic=Date.now();
    if(opts.length){c.x=opts[0].n.x;c.y=opts[0].n.y;ran++}}
  log('vill',ran?`${ran} panicking civilian${ran>1?'s run':' runs'} from the fight.`:'The civilians cower in place.');render();await sleep(FAST?0:650);
  for(const c of scared){if(!sd.civs.includes(c))continue;civHazard(c);if(sd.civs.includes(c)&&isExit(c))saveCiv(c,null)}render()}
/* a henchman next to a loose civilian grabs them and drags them 1 hex toward its villain each turn instead of attacking */
async function henchGrab(hm){const sd=S.sd,o=sd.vl.find(o=>o.key===(hm.owner||sd.vkey)&&!o.v.down)||sd.vl.find(o=>!o.v.down);if(!o)return false;
  const vv=o.v,first=!sd.civs.some(c=>c.held===hm.id),cv=sd.civs.find(c=>c.held===hm.id)||sd.civs.find(c=>!c.f&&!civHeld(c)&&cheb(c,hm)<=1);if(!cv)return false;
  cv.held=hm.id;const dv=p=>dV(p,vv),n=nbrs(cv).filter(p=>!blocked(p.x,p.y)&&dv(p)<dv(cv)).sort((a,b)=>dv(a)-dv(b))[0];
  const hn=VILLAINS[o.key].hench.name;
  if(n){cv.x=n.x;cv.y=n.y;if(cheb(hm,cv)>1){const t=freeTiles((x,y)=>cheb({x,y},cv)===1).sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];if(t){hm.x=t.x;hm.y=t.y}}
    if(cheb(hm,cv)>1)cv.held=null;else{fxP(cv.x,cv.y,first?'GOTCHA!':'LET GO!','vhit');log('vill',first?`A ${hn.toLowerCase()} grabs a civilian and drags them toward ${VILLAINS[o.key].name}.`:`The ${hn.toLowerCase()} drags the civilian closer to ${VILLAINS[o.key].name}.`)}
    render();await sleep(FAST?0:350);civHazard(cv)}
  else{fxP(cv.x,cv.y,first?'GOTCHA!':'HELP!','vhit');log('vill',`A ${hn.toLowerCase()} holds a civilian hostage.`)}
  return true}
async function wardBlocks(u){if(!u.ward)return false;u.ward=false;await A.shield(ctrU(u),COL.magic,true);fxU(u,'WARDED!','good');log('hero',`A ward turns the blow aside from ${heroOf(u).name}.`);render();return true}
async function vHit(u,dmg,label,style){const h=heroOf(u);if(S.sd.v.cursed&&dmg>0)dmg=Math.max(1,dmg-2);faceTo(u);render();await strikeAnim(style,ctrV(),ctrU(u),COL.mag,'v'+S.sd.vi);
  let r=d20();/* Version 115 (Tyler): Lucky Coin no longer affects villain attacks */const acc=vStat('acc'),eva=stat(h,'eva')+(u.buffEva||0)+(u.evaNext||0)+avoidEva(u);if(u.evaNext){log('hero',`Wind Ward: +${u.evaNext} evasion for ${h.name}.`);u.evaNext=0};const hit=r===20||(r!==1&&r+acc>=eva);
  log('vill',`${label} at ${h.name}: rolled ${r}+${acc} vs evasion ${eva}. ${hit?`Hit for ${dmg}.`:'Miss.'}`);
  if(hit&&await wardBlocks(u))return false;
  if(hit&&u.reflect&&!S.sd.v.down){u.reflect=0;log('hero',`${h.name} turns the blow back: ${VILLAINS[S.sd.vkey].short} tears a page.`);await woundAnim(`${h.name}: reflected.`)}
  fxU(u,hit?pick(SFX_VHIT):'SWISH!',hit?'vhit':'miss');if(hit)damageHero(u,dmg);render();if(!hit){if(style!=='none')await avoidRedirect(u,S.sd.v,dmg,label);await riposte(u)}return hit}
/* Version 117 (Tyler): a conditional target (weakest, farthest) is picked only among heroes the villain can reach this turn
   (within move + range, by hex distance). If nobody is in reach it goes for the nearest hero. */
function pickTarget(mode,reach){const sd=S.sd;let L=live();if(!L.length)return null;
  if(reach!=null&&mode!=='nearest'){const inR=L.filter(u=>dV(u,sd.v)<=reach);if(inR.length)L=inR;else mode='nearest'}
  if(mode==='weakest')return L.slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];
  const byD=L.slice().sort((a,b)=>dV(a,sd.v)-dV(b,sd.v));return mode==='farthest'?byD[byD.length-1]:byD[0]}
function dmgScale(d){return d+Math.floor(S.sd.v.level/2)} /* Version 83 (Tyler): +1 damage at every even level */
function vStyle(c){if(c.fx)return c.fx;return (c.rng||0)>1||c.t==='endanger'?VILLAINS[S.sd.vkey].rstyle:'slash'}
async function vMove(fn,crush=0,label=''){const sd=S.sd,v=sd.v,ox=v.x,oy=v.y,osw=JSON.stringify(v.sw||0);const sh=fn()||[];const path=v.path;delete v.path;
  if(path&&path.length){const fin={x:v.x,y:v.y,body:v.body};for(const p of path){v.x=p.x;v.y=p.y;v.body=p.body;noFlip.add('v'+sd.vi);render();await sleep(FAST?0:RM?60:150)}v.x=fin.x;v.y=fin.y;v.body=fin.body}
  else if(v.x!==ox||v.y!==oy||JSON.stringify(v.sw||0)!==osw){render();await sleep(Math.min(520,180+90*Math.hypot(v.x-ox,v.y-oy)))}
  for(const o of sh){if(sd.units.includes(o)){if(o.ko)continue;if(crush){fxU(o,'CRUNCH!','vhit');damageHero(o,crush);log('vill',`${label||'The charge'} shoves ${heroOf(o).name} aside for ${crush} damage.`)}else{fxU(o,'SHOVED!','miss');log('vill',`${heroOf(o).name} is shoved aside.`)}}
    else if(sd.civs.includes(o)){if(crush)harmCiv(o,label||'the stampede');else fxP(o.x,o.y,'EEK!','miss')}}
  if(v.smashed&&v.smashed.length){const ks=v.smashed;delete v.smashed;await Promise.all(ks.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),3)}));fxV('KRASH!','vhit');log('vill',`${VILLAINS[sd.vkey].name} smashes straight through ${ks.length>1?ks.length+' hexes of walls and rubble':'a wall'}.`);render()}
  if(sh.length)render()}
async function execCard(c){const sd=S.sd,v=sd.v,vn=VILLAINS[sd.vkey].name;
  switch(c.t){
    case 'strike':{let t=pickTarget(c.tgt,(VILLAINS[sd.vkey].rooted?0:c.mv||0)+(c.rng||1));if(!t)break;await vMove(()=>vToward(t,c.mv,c.rng),c.crush||0,c.n);
      if(dV(t,v)>c.rng){log('vill',`${vn} can't reach ${heroOf(t).name}.`);fxV('GRR!','say');break}
      if(shotVB(t,v)){log('vill',`A girder is in the way: ${vn}'s ${c.n} can't reach ${heroOf(t).name}.`);fxV('GRR!','say');break}
      let dmg=dmgScale(c.dmg);const g=live().find(o=>o.guard&&o!==t&&cheb(o,t)<=2);
      if(g){log('hero',`${heroOf(g).name} braces and takes the blow.`);A.lunge('h'+g.hid,ctrU(t));await A.shield(ctrU(g),COL.yel,true);t=g;if(dmg>0)dmg=Math.max(1,dmg-1)}
      {const hit=await vHit(t,dmg,c.n,vStyle(c));if(hit&&c.comp&&!t.ko){const th=heroOf(t);th.comp=Math.max(0,th.comp-c.comp);fxU(t,'RATTLED!','vhit');log('vill',`${th.name} loses ${c.comp} composure.`);render()}}
      if(c.col)sd.civs.filter(cv=>cheb(cv,t)<=1).forEach(cv=>harmCiv(cv,'flying wreckage'));break}
    case 'sweep':await sweep(c.r,dmgScale(c.dmg),c.n);break;
    /* Version 133: Mole Boy digs under the floor and bursts up beside the farthest hero, leaving rubble where he went down */
    case 'burrow':{const t=pickTarget('farthest');if(!t)break;const from={x:v.x,y:v.y},sp=nbrs(t).filter(p=>inB(p.x,p.y)&&!(p.x===v.x&&p.y===v.y)&&vFits(p.x,p.y,true)).sort((a,b)=>cheb(a,from)-cheb(b,from))[0];
      if(!sp){log('vill',`${vn} can't find soft ground near ${heroOf(t).name}.`);fxV('GRR!','say');break}
      await A.smoke(ctrV(),3);vPut(v,sp.x,sp.y);noFlip.add('v'+sd.vi);const k0=from.x+','+from.y;if(!sd.obs.includes(k0))sd.obs.push(k0);render();await A.smoke(ctrV(),3);fxV('SHUNK!','say');
      log('vill',`${vn} dives underground and bursts up next to ${heroOf(t).name}, leaving rubble where he went down.`);await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
    case 'rampage':{const t=pickTarget('nearest');if(t)await vMove(()=>vToward(t,c.mv,1),c.crush||0,c.n);await sweep(1,dmgScale(c.dmg),c.n);break}
    case 'summon':{const added=[];for(let i=0;i<c.k;i++){const t=freeTiles().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(t){const m={id:'s'+Date.now()+i,owner:sd.vkey,x:t.x,y:t.y,hp:henchHp(2)};sd.hench.push(m);added.push(m)}}
      fxV('GET THEM!','say');render();await Promise.all(added.map(m=>A.smoke(ctrU(m))));log('vill',`${added.length} ${VILLAINS[sd.vkey].hench.name.toLowerCase()}s arrive.`);break}
    case 'endanger':{const cv=sd.civs.slice().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(cv)faceTo(cv);
      if(!cv){const t=pickTarget('nearest');if(t){await vMove(()=>vToward(t,2,1));if(dV(t,v)<=1)await vHit(t,dmgScale(2),c.n,'slash')}break}
      await vMove(()=>vToward(cv,2,1));const prot=live().find(u=>cheb(u,cv)<=1);
      if(prot){A.lunge('h'+prot.hid,ctrU(cv));await strikeAnim(vStyle(c),ctrV(),ctrU(prot),COL.mag,'v'+S.sd.vi);log('hero',`${heroOf(prot).name} shields a civilian and takes ${dmgScale(c.dmg||2)}.`);
        if(!await wardBlocks(prot)){await A.shield(ctrU(prot),COL.yel);fxU(prot,'OOF!','vhit');damageHero(prot,dmgScale(c.dmg||2))}}
      else if(dV(cv,v)<=3){await strikeAnim(vStyle(c),ctrV(),ctrU(cv),COL.mag,'v'+S.sd.vi);harmCiv(cv,c.n)}
      else{log('vill',`${c.n} falls short. The civilian runs.`);fxP(cv.x,cv.y,'EEK!','miss')}break}
    case 'taunt':{await A.ring(ctrV(),COL.yel,c.r*2+2,{dashed:true,fill:false,count:3});
      const hit=live().filter(u=>dV(u,v)<=c.r);const lm=litMap(),ex=u=>(c.bombx&&(sd.bombs||[]).some(b=>cheb(bombP(b),u)<=1)?1:0)+(c.litx&&lm[u.x+','+u.y]?1:0);hit.forEach(u=>{const h=heroOf(u);h.comp=Math.max(0,h.comp-c.amt-ex(u));fxU(u,'GRR!','miss')});
      log('vill',hit.length?`${c.n}: ${hit.map(u=>heroOf(u).name).join(', ')} lose ${c.amt} composure.`:`${c.n}: nobody is close enough to hear.`);break}
    case 'vanish':{let best=null,bs=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y,true))continue;const s=Math.min(...live().map(u=>dV(u,{x,y})))+Math.random();if(s>bs){bs=s;best=[x,y]}}
      await A.smoke(ctrV(),9);if(best){v.x=best[0];v.y=best[1]}noFlip.add('v'+sd.vi);render();await A.smoke(ctrV(),9);fxV('POOF!','miss');{const t=pickTarget('nearest');if(t)faceTo(t)}log('vill',`${vn} vanishes and reappears across the room.`);break}
    case 'multi':{const ts=live().filter(u=>dV(u,v)<=c.rng).sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,c.cnt);
      if(!ts.length){log('vill',`${c.n} has no one in range.`);fxV('GRR!','say');break}
      for(const t of ts)await vHit(t,dmgScale(c.dmg),c.n,vStyle(c));break}
    case 'walls':{if(c.retreat){const n=live().slice().sort((a,b)=>dV(a,v)-dV(b,v))[0];if(n){const was=JSON.stringify(vCells(v));await vMove(()=>vAway(n,c.retreat),0,c.n);if(JSON.stringify(vCells(v))!==was)log('vill',`${vn} backs away into the maze.`)}} /* Version 94 (Tyler): Labyrinth retreats before the walls go up */
      const L=live().slice().sort((a,b)=>dV(a,v)-dV(b,v));const made=[];
      for(let i=0;i<(c.lines||1)&&i<L.length;i++){const t=L[i],d=dirC(HC(t.x,t.y),vCtr(v)),mid=ax(step(t,d)),pd=AXD[(d+2)%6],half=Math.floor(c.len/2);
        for(let j=0;j<c.len;j++){const{x,y}=off(mid.q+pd[0]*(j-half),mid.r+pd[1]*(j-half)),k=x+','+y;
          if(inB(x,y)&&!blocked(x,y)&&!made.includes(k))made.push(k)}}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),3)}));
      made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));fxV('BUILD!','say');log('vill',`${c.n}: ${made.length} wall hexes rise from the floor.`);break}
    case 'hazard':{const ts=live().slice().sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,c.cnt||1),ks=new Set();
      ts.forEach(t=>hexesWithin(t,c.r).forEach(({x,y})=>{const k=x+','+y;if(sd.obs.includes(k)||inV(v,x,y))return;ks.add(k)}));
      await Promise.all(ts.map(t=>A.ring(ctrU(t),COL.innate,c.r*2+1.4,{count:2})));
      const dm=dmgScale(c.dmg);ks.forEach(k=>{const e=sd.haz.find(h=>h.k===k);if(e){e.ttl=Math.max(e.ttl,c.ttl);e.dmg=Math.max(e.dmg,dm)}else sd.haz.push({k,ttl:c.ttl,dmg:dm})});
      ts.forEach(t=>fxU(t,'HOT!','vhit'));log('vill',`${c.n}: ${ks.size} hexes turn molten. Get off them before the villain acts again.`);break}
    case 'cage':{const t=pickTarget('nearest');if(!t)break;const made=[];for(const{x,y}of nbrs(t)){if(!blocked(x,y))made.push(x+','+y)}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),2)}));made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));
      fxU(t,'CAGED!','vhit');log('vill',`${c.n} boxes in ${heroOf(t).name}.`);break}
    case 'shrapnel':{const tiles=[...sd.walls.map(w=>w.k),...sd.obs].map(k=>{const[x,y]=k.split(',').map(Number);return {k,x,y}}).filter(p=>dV(p,v)<=c.r);
      if(!tiles.length){log('vill',`${c.n}: nothing nearby to blow up.`);fxV('TCH!','say');break}
      await Promise.all(tiles.map(p=>A.ring(HC(p.x,p.y),COL.innate,1.8)));
      const hit=live().filter(u=>tiles.some(p=>cheb(p,u)<=1));sd.walls=sd.walls.filter(w=>!tiles.some(p=>p.k===w.k));render();
      log('vill',`${c.n}: ${tiles.length} piles explode.`);for(const u of hit)await vHit(u,dmgScale(c.dmg),c.n,'none');break}
    case 'fortify':{const made=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(dV({x,y},v)!==1||blocked(x,y))continue;made.push(x+','+y)}
      await Promise.all(made.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),2)}));made.forEach(k=>sd.walls.push({k,ttl:c.ttl}));
      if(v.wounds.length){v.deck.push(v.wounds.pop());shuffle(v.deck)}fxV('FORTIFIED!','vhit');log('vill',`${vn} walls itself in and recovers a page.`);break}
    case 'beam':{const L=live();if(!L.length)break;const near=pickTarget('nearest');let lines=[];
      if(c.pat==='star'){faceTo(near);lines=[0,1,2,3,4,5].map(d=>({from:emitCell(v,d),d}))}
      else if(c.pat==='fan'){faceTo(near);const f=v.face;lines=[f,(f+1)%6,(f+5)%6].map(d=>({from:emitCell(v,d),d}))}
      else if(c.pat==='aim'){const ts=L.slice().sort((a,b)=>dV(a,v)-dV(b,v));lines=(c.tgt==='farthest'?ts.reverse():ts).slice(0,c.cnt||1).map(t=>aimLine(v,t));v.face=lines[0].d}
      else if(c.pat==='prism'){const ps=sd.hench.filter(m=>m.owner===sd.vkey);
        if(!ps.length){log('vill',`${c.n}: no ${VILLAINS[sd.vkey].hench.name.toLowerCase()}s left, so ${vn} fires himself.`);lines=[aimLine(v,near)];v.face=lines[0].d}
        else lines=ps.map(m=>aimLine(m,L.slice().sort((a,b)=>cheb(a,m)-cheb(b,m))[0]))}
      else if(c.pat==='sweep'){faceTo(near);const hit=new Set(),f=v.face;
        for(let i=0;i<(c.cnt||4)&&!sd.result;i++){const d=(f+i)%6;v.face=d;render();await sleep(FAST?0:160);await fireBeams([{from:emitCell(v,d),d}],dmgScale(c.dmg),c.n,{hit,ttl:c.ttl})}break}
      fxV('WHIRR!','say');render();await sleep(FAST?0:220);await fireBeams(lines,dmgScale(c.dmg),c.n,{ttl:c.ttl});break}
    case 'charge':{const z=chargeZone(c.zone);sd.v.charge={n:c.n,dmg:dmgScale(c.dmg),zone:z,w0:v.wounds.length,need:chargeNeed(v)};render();
      await A.ring(ctrV(),COL.yel,4,{inward:true,count:3});fxV('CHARGING…','say');log('vill',`${vn} begins charging ${c.n}! ${z.length} hexes are marked. Tear ${chargeNeed(v)} pages or get clear before it fires.`);break}
    case 'reanimate':{await A.ring(ctrV(),COL.mag,3,{inward:true,count:2});let n=0;for(let i=0;i<(c.heal||1)&&v.wounds.length;i++){v.deck.push(v.wounds.pop());n++}if(n){shuffle(v.deck);fxV('ZZZAP!','vhit');log('vill',`${vn} recovers ${n} torn page${n>1?'s':''}.`)}else log('vill',`${vn} has nothing to recover.`);break}
    case 'swallow':{const hn=VILLAINS[sd.vkey].hench.name.toLowerCase(),food=()=>[...sd.civs.map(o=>({o,k:'c'})),...sd.hench.map(o=>({o,k:'m'}))].sort((a,b)=>cheb(a.o,v)-cheb(b.o,v));let ate=0;
      for(let n=0;n<(c.cnt||1)&&!sd.result;n++){const F=food()[0];if(!F)break;faceTo(F.o);await vMove(()=>vToward(F.o,n?2:c.mv,1),0,c.n);
        const what=F.k==='c'?'a civilian':`a ${hn}`;
        if(cheb(F.o,v)>1){log('vill',`${vn} slithers after ${what} but can't reach.`);fxP(F.o.x,F.o.y,'EEK!','miss');break}
        faceTo(F.o);const prot=F.k==='c'&&live().find(u=>cheb(u,F.o)<=1);
        if(prot){A.lunge('v'+sd.vi,ctrU(prot));log('hero',`${heroOf(prot).name} shoves the civilian clear and takes the bite for ${dmgScale(c.dmg)}.`);
          if(!await wardBlocks(prot)){await A.shield(ctrU(prot),COL.yel);fxU(prot,'CHOMP!','vhit');damageHero(prot,dmgScale(c.dmg))}render();break}
        A.lunge('v'+sd.vi,ctrU(F.o));await A.ring(ctrU(F.o),COL.mag,1.6,{inward:true,count:2});fxP(F.o.x,F.o.y,'GULP!','vhit');
        if(F.k==='c'){sd.civs=sd.civs.filter(o=>o!==F.o);sd.harmed++}else sd.hench=sd.hench.filter(o=>o!==F.o);
        ate++;v.ate=(v.ate||0)+1;const grew=serpGrow(v);render();
        log('vill',`${vn} swallows ${what} whole! ${grew?`It grows to ${vCells(v).length+(v.grow||0)} hexes long.`:'It is too long to grow any more, so it recovers a torn page instead.'}`)}
      if(!ate&&!food().length){const t=pickTarget('nearest');if(!t)break;log('vill',`Nothing left to eat. ${vn} turns on the heroes.`);await vMove(()=>vToward(t,c.mv,1),0,c.n);
        if(dV(t,v)<=1)await vHit(t,dmgScale(c.dmg),c.n,'slash');else fxV('HSSS!','say')}break}
    case 'pull':{const t0=pickTarget('nearest');if(t0)faceTo(t0);await A.ring(ctrV(),COL.cyan,c.r*2+2,{inward:true,count:3});const ts=live().filter(u=>!u.anchor&&dV(u,v)<=c.r).sort((a,b)=>dV(a,v)-dV(b,v));let moved=0;
      for(const u of ts){let n=0;for(let i=0;i<c.mv;i++){const fr=p=>sideOf(p,v)==='front'?0:1,t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(a,v)-dV(b,v)||fr(a)-fr(b))[0];if(!t||dV(t,v)>=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){moved++;fxU(u,'CLANK!','vhit')}}
      render();await sleep(FAST?0:320);log('vill',`${c.n}: ${moved?`${moved} hero${moved>1?'es are':' is'} dragged toward ${vn}.`:'nobody is close enough to feel it.'}`);
      await sweep(1,dmgScale(c.dmg),c.n);break}
    case 'repel':{await A.ring(ctrV(),COL.cyan,c.r*2+2,{count:3});const ts=live().filter(u=>!u.anchor&&dV(u,v)<=c.r).sort((a,b)=>dV(b,v)-dV(a,v)),dm=dmgScale(c.dmg);
      if(!ts.length)log('vill',`${c.n}: nobody is close enough to throw.`);
      for(const u of ts){let n=0,slam=false;for(let i=0;i<c.mv;i++){const t=freeTiles((x,y)=>cheb({x,y},u)===1).sort((a,b)=>dV(b,v)-dV(a,v))[0];if(!t||dV(t,v)<=dV(u,v)){slam=true;break}u.x=t.x;u.y=t.y;n++}
        render();await sleep(FAST?0:180);const hn=heroOf(u).name;
        if(slam){if(await wardBlocks(u))continue;fxU(u,'SLAM!','vhit');damageHero(u,dm);log('vill',`${hn} is flung ${n} hex${n===1?'':'es'} and slams into something for ${dm}.`)}
        else{fxU(u,'WHOOSH!','miss');log('vill',`${hn} is flung ${n} hexes away.`)}}
      render();break}
    case 'fade':{const L=live();let best=null,bs=-1e9;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y,true))continue;const d=L.length?Math.min(...L.map(u=>cheb(u,{x,y}))):3,s=-Math.abs(d-3)+Math.random()*.9;if(s>bs){bs=s;best=[x,y]}}
      await A.smoke(ctrV(),9);if(best){v.x=best[0];v.y=best[1]}v.face=rnd(6)-1;v.hide=true;noFlip.add('v'+sd.vi);render();await A.smoke(ctrV(),6);
      if(c.amt){L.forEach(u=>{const h=heroOf(u);h.comp=Math.max(0,h.comp-c.amt);fxU(u,'?!','vhit')});log('vill',`The lights die. Every hero loses ${c.amt} composure.`)}
      fxV('…','miss');log('vill',`${vn} fades into the dark and reappears somewhere else. Her facing is hidden.`);break}
    case 'converge':{const t=pickTarget('nearest');if(!t)break;if(!v.sw){await vMove(()=>vToward(t,c.mv,1));if(dV(t,v)<=1)await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
      const os=JSON.stringify([v.x,v.y,v.sw]);swBodies(v).forEach(b=>swStep(v,b.i,t,c.mv,1,-1));faceTo(t);if(JSON.stringify([v.x,v.y,v.sw])!==os){render();await sleep(FAST?0:420)}
      const adj=swBodies(v).filter(b=>cheb(b,t)===1).length;
      if(!adj){log('vill',`${vn} swarms toward ${heroOf(t).name} but can't close in.`);fxV('BZZ!','say');break}
      await vHit(t,dmgScale(c.dmg)*adj,`${c.n} (${adj} bod${adj>1?'ies':'y'})`,'slash');break}
    case 'scatter':{const L=live().slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp);if(!L.length)break;if(!v.sw){const t=L[0];await vMove(()=>vToward(t,3,1));if(dV(t,v)<=1)await vHit(t,dmgScale(c.dmg),c.n,'slash');break}
      await A.smoke(ctrV(),9);const pairs=[];
      swBodies(v).forEach((b,j)=>{const t=L[j%L.length],sp=freeTiles((x,y)=>cheb({x,y},t)===1).sort((a,c2)=>Math.min(...swBodies(v).filter(o=>o.i!==b.i).map(o=>cheb(c2,o)))-Math.min(...swBodies(v).filter(o=>o.i!==b.i).map(o=>cheb(a,o))))[0];
        if(sp){swSet(v,b.i,sp.x,sp.y,dirC(HC(sp.x,sp.y),HC(t.x,t.y)));noFlip.add(`v${sd.vi}s${b.i}`);pairs.push([b.i,t])}});
      noFlip.add('v'+sd.vi);render();fxV('BZZZT!','say');log('vill',`${vn} bursts into ${pairs.length} pieces that land beside the heroes.`);
      for(const [i,t] of pairs){if(sd.result||t.ko)continue;const b=swBodies(v)[i];if(!b||cheb(b,t)>1)continue;await vHit(t,dmgScale(c.dmg),`${c.n} (${SWN[b.k]})`,'slash')}break}
    case 'puppet':{const L=live();if(!L.length)break;const u=L.sort((a,b)=>heroOf(a).comp-heroOf(b).comp)[0],h=heroOf(u);
      await Promise.all([A.bolt(ctrV(),ctrU(u),COL.magic,true),A.bolt(ctrV(),ctrU(u),COL.magic,true)]);h.comp=Math.max(0,h.comp-(c.amt||1));u.dazed=true;fxU(u,'?!','vhit');
      log('vill',`${h.name}'s limbs stop obeying. They can't move next round.`);break}
    case 'leap':{let n=0;const done=[];
      for(let i=0;i<(c.cnt||1)&&!sd.result;i++){const L=live().filter(u=>!done.includes(u)&&dV(u,v)<=c.mv).sort((a,b)=>dV(a,v)-dV(b,v));let t=null,sp=null;
        for(const u of L){const s=leapSpot(u);if(s){t=u;sp=s;break}}
        if(!t)break;done.push(t);const lit=c.fuse&&dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg));await vLeap(t,sp);n++;
        if(lit)fxU(t,'TSSS!','vhit');log('vill',`${vn} vaults over ${heroOf(t).name}${lit?' and leaves a lit bomb at their feet':''}.`);render()}
      if(!n){const t=pickTarget('nearest');if(!t)break;log('vill',`Nobody close enough has open ground behind them, so ${vn} bounds toward ${heroOf(t).name}.`);await vMove(()=>vToward(t,c.mv,1));
        if(c.fuse&&dV(t,v)<=3){await A.throw(ctrV(),ctrU(t),'bomb');if(dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg))){fxU(t,'TSSS!','vhit');log('vill',`She tosses the bomb at ${heroOf(t).name} instead.`)}}else fxV('TCH!','say')}
      render();break}
    case 'bomb':{const inR=()=>{const L=live().filter(u=>dV(u,v)<=c.rng).sort((a,b)=>dV(a,v)-dV(b,v));return c.tgt==='farthest'?L.reverse():L};let ts=inR();
      if(!ts.length){const t=pickTarget('nearest');if(t)await vMove(()=>vToward(t,2,c.rng));ts=inR()}
      ts=ts.slice(0,c.cnt||1);if(!ts.length){log('vill',`${c.n}: nobody in range to throw at.`);fxV('TCH!','say');break}
      faceTo(ts[0]);render();const got=[];
      for(const t of ts){await A.throw(ctrV(),ctrU(t),'bomb');if(dropBomb(t.x,t.y,c.fuse,dmgScale(c.dmg))){got.push(t);fxU(t,'TSSS!','vhit')}render()}
      log('vill',got.length?`${c.n}: ${got.length>1?`${got.length} lit bombs land`:'a lit bomb lands'} at ${got.map(t=>heroOf(t).name).join(' and ')}'s feet. ${c.fuse} villain turn${c.fuse>1?'s':''} to get clear.`:`${c.n}: she is out of bombs, ${BOMB_MAX} are already lit.`);break}
    case 'detonate':{const L=(sd.bombs||[]).slice();await A.ring(ctrV(),COL.yel,3,{inward:true,count:2});
      if(!L.length){fxV('CLICK…','miss');log('vill',`${vn} squeezes the detonator, but there are no bombs left to blow.`);break}
      log('vill',`${vn} hits the switch. ${L.length>1?`${L.length} bombs go`:'A bomb goes'} off at once!`);await blowBombs(L,c.dmg||0);break}
    case 'airburst':{const m=N>>1,sp=hexesWithin({x:m,y:m},2).sort((a,b)=>cheb(a,{x:m,y:m})-cheb(b,{x:m,y:m})).find(p=>(p.x===v.x&&p.y===v.y)||vFits(p.x,p.y,true));
      if(sp&&(sp.x!==v.x||sp.y!==v.y)){fxV('BOING!','say');vPut(v,sp.x,sp.y);render();await sleep(FAST?0:RM?60:360)}
      {const t=pickTarget('nearest');if(t)faceTo(t)}const z=chargeZone(c.zone);sd.v.charge={n:c.n,dmg:dmgScale(c.dmg),zone:z,w0:v.wounds.length,need:chargeNeed(v)};render();
      await A.ring(ctrV(),COL.yel,4,{inward:true,count:3});fxV('CHARGING…','say');log('vill',`${vn} lands in the middle of the room and starts the countdown on ${c.n}. ${z.length} hexes are marked. Tear ${chargeNeed(v)} pages or get clear before it fires.`);break}
  }}
/* Payload leaps clear over a hero, past anything in between, onto the hex straight behind them or one of the two beside it */
function leapSpot(t){const v=S.sd.v,d=dirC(vCtr(v),HC(t.x,t.y));return [d,(d+1)%6,(d+5)%6].map(e=>step(t,e)).find(p=>!(p.x===v.x&&p.y===v.y)&&vFits(p.x,p.y,true))||null}
async function vLeap(t,sp){const sd=S.sd,v=sd.v;A.lunge('v'+sd.vi,ctrU(t));fxV('BOING!','say');await sleep(FAST?0:160);
  vPut(v,sp.x,sp.y);v.face=dirC(HC(t.x,t.y),HC(sp.x,sp.y));render();await sleep(FAST?0:RM?60:380);fxV('HUP!','say')}
/* a meal adds a segment behind the tail, or on its next step if the tail is boxed in; past the cap it heals a page instead */
const SERP_MAX=9;
function serpGrow(v){if(v.body.length+1+(v.grow||0)>=SERP_MAX){if(v.wounds.length){v.deck.push(v.wounds.pop());shuffle(v.deck)}return false}
  const cs=vCells(v),tail=cs[cs.length-1],t=nbrs(tail).filter(p=>!blocked(p.x,p.y)).sort((a,b)=>cheb(b,v)-cheb(a,v))[0];
  if(t)v.body.push(t);else v.grow=(v.grow||0)+1;return true}
async function sweep(r,dmg,label){const sd=S.sd,v=sd.v;A.lunge('v'+sd.vi,ctrV());await A.ring(ctrV(),COL.mag,r*2+2.4);const hit=live().filter(u=>dV(u,v)<=r);
  if(!hit.length)log('vill',`${label} hits only rubble.`);for(const u of hit)await vHit(u,dmg,label,'none');
  sd.civs.filter(c=>dV(c,v)<=r).forEach(c=>harmCiv(c,label))}
/* Version 84 (Tyler): henchman damage scales half as fast as villain damage, +1 every 4 levels of the villain they serve */
/* Version 86 (Tyler): special henchmen. A villain with an elite brings one from level 3. Health 2 + level, evasion 9 + half the level,
   +4 to hit, damage 1 + half the level (twice as fast as normal henchmen). Taking one down is worth 1 of that villain's salvage.
   The Cantor's Made Man is a bodyguard: while he stands next to her he takes the first hit of every hero attack on her. */
const eliteOf=k=>VILLAINS[k].elite||null;
const hName=hm=>hm.elite?eliteOf(hm.owner||S.sd.vkey).name:'the '+VILLAINS[hm.owner||S.sd.vkey].hench.name.toLowerCase();
function mkElite(o,t){const L=o.v.level;return {id:'e_'+o.key,owner:o.key,x:t.x,y:t.y,hp:henchHp(2+L),elite:1}}
/* Version 107 (Tyler): Hive Jammer takes 1 health off every henchman, down to 1 */
const henchHp=n=>S.facilities.includes('jammer')?Math.max(1,n-1):n;
const eliteEva=hm=>9+Math.floor(henchLv(hm)/2);
function henchLv(hm){const sd=S.sd,o=sd.vl.find(o=>o.key===(hm.owner||sd.vkey));return o?o.v.level:sd.v.level}
/* Version 89 (Tyler): three more special henchmen. Gallows' Failed Experiment is slow (moves 2), hits 1 harder and shrugs off the first hit
   each round. Ouroboros' High Priest attacks from range 3 and raises a fallen Cultist each round while fewer than 2 remain. The Architect's
   Foreman throws up a wall next to the hero closest to the Architect each round (it lasts 2 rounds). */
function henchDmg(hm){if(hm.elite)return 1+Math.floor(henchLv(hm)/2)+(eliteOf(hm.owner||S.sd.vkey).brute?1:0);const sd=S.sd,o=sd.vl.find(o=>o.key===(hm.owner||sd.vkey)),lv=o?o.v.level:sd.v.level;return 1+Math.floor(lv/4)}
async function henchAct(hm){const sd=S.sd,L=live();if(!L.length)return;const def=hm.elite?eliteOf(hm.owner||sd.vkey):VILLAINS[hm.owner||sd.vkey].hench;
  if(hm.elite&&def.guard){const o=sd.vl.find(o=>o.key===hm.owner&&!o.v.down);if(o&&dV(hm,o.v)>1){const opts=reach(hm,3,hm);let best=null,bd=1e9;
    for(const k in opts){const[x,y]=k.split(',').map(Number);if(dV({x,y},o.v)!==1)continue;const d=Math.min(...L.map(u=>cheb(u,{x,y})));if(d<bd){bd=d;best=[x,y]}}
    if(best){hm.x=best[0];hm.y=best[1];render();await sleep(300)}}
    const adj=L.filter(u=>cheb(u,hm)<=def.rng);if(o&&!adj.length)return}
  else if(!hm.elite&&await henchGrab(hm))return;
  if(hm.elite)await eliteTurn(hm,def,L);if(sd.result||!sd.hench.includes(hm))return;
  let t=L.slice().sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];
  if(cheb(t,hm)>def.rng){const opts=reach(hm,def.mv||3,hm);let best=null,bd=cheb(t,hm);
    for(const k in opts){const[x,y]=k.split(',').map(Number);const d=cheb(t,{x,y});if(d<bd||(d===bd&&best&&Math.random()<.3)){bd=d;best=[x,y]}}
    if(best){hm.x=best[0];hm.y=best[1];render();await sleep(300)}}
  if(cheb(t,hm)<=def.rng&&!shotBlocked(hm,t)){await strikeAnim(def.style,ctrU(hm),ctrU(t),COL.grey,'m'+hm.id);
    const h=heroOf(t),r=luckUp(t)?Math.min(d20(),d20()):d20(),eva=stat(h,'eva')+(t.buffEva||0)+(t.evaNext||0)+avoidEva(t);if(t.evaNext){log('hero',`Wind Ward: +${t.evaNext} evasion for ${h.name}.`);t.evaNext=0};const ha=(setOn(h,'swarm')?-2:2)+(hm.elite?2:0),hit=r===20||(r!==1&&r+ha>=eva);
    log('vill',`${def.name} attacks ${h.name}: ${r}${ha<0?'−'+(-ha):'+'+ha} vs ${eva}. ${hit?`Hit for ${henchDmg(hm)}.`:'Miss.'}`);
    if(hit&&!await wardBlocks(t)){fxU(t,def.rng>1?'PEW!':'THUD!','vhit');damageHero(t,henchDmg(hm))}else if(!hit){fxU(t,'SWISH!','miss');await avoidRedirect(t,hm,henchDmg(hm),def.name)}}}
/* Version 91 (Tyler): the Foreman's girders block shots (any attack at range 2+ whose hex line crosses one) and topple onto an adjacent hero
   when they come down two villain turns later, for 2 + half the Architect's level. */
function hexLine(a,b){const A=ax(a),B=ax(b),n=cheb(a,b),out=[];const ac={q:A.q+1e-6,r:A.r+1e-6},bc={q:B.q+1e-6,r:B.r+1e-6};
  for(let i=1;i<n;i++){const t=i/n,q=ac.q+(bc.q-ac.q)*t,r=ac.r+(bc.r-ac.r)*t,s=-q-r;let rq=Math.round(q),rr=Math.round(r),rs=Math.round(s);
    const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;out.push(off(rq,rr))}return out}
function shotBlocked(a,b){const sd=S.sd;if(cheb(a,b)<=1||!sd.walls.some(w=>w.girder))return false;return hexLine(a,b).some(p=>sd.walls.some(w=>w.girder&&w.k===p.x+','+p.y))}
const shotVB=(u,v)=>vCells(v).every(c=>shotBlocked(u,c));
async function eliteTurn(hm,def,L){const sd=S.sd,o=sd.vl.find(o=>o.key===hm.owner&&!o.v.down);if(!o)return;
  if(def.priest&&sd.hench.filter(m=>!m.elite&&m.owner===hm.owner).length<2){const t=freeTiles((x,y)=>cheb({x,y},hm)===1)[0];
    if(t){sd.hench.push({id:'p'+Date.now(),owner:hm.owner,x:t.x,y:t.y,hp:henchHp(2)});await A.smoke(HC(t.x,t.y),3);fxP(t.x,t.y,'RISE!','say');log('vill',`${def.name} chants, and a fallen ${VILLAINS[hm.owner].hench.name.toLowerCase()} rises again.`);render()}}
  if(def.foreman){const near=L.slice().sort((a,b)=>dV(a,o.v)-dV(b,o.v))[0];const t=near&&freeTiles((x,y)=>cheb({x,y},near)===1&&dV({x,y},o.v)<dV(near,o.v))[0];
    if(t){sd.walls.push({k:t.x+','+t.y,ttl:2,girder:1,dmg:2+Math.floor(henchLv(hm)/2)});await A.smoke(HC(t.x,t.y),3);fxP(t.x,t.y,'CLANG!','say');log('vill',`${def.name} bolts a girder into place in front of ${heroOf(near).name}. It blocks shots, and it will topple in 2 turns.`);render()}}}
function drawTactic(){const sd=S.sd,k=sd.vkey,v=sd.v;sd.tdk=sd.tdk||{};
  for(let g=0;g<60;g++){if(!sd.tdk[k]||!sd.tdk[k].length)sd.tdk[k]=shuffle([...(VILLAINS[k].tact?TACT.filter(t=>VILLAINS[k].tact.includes(t.id)):TACT),...VINTEL[k].react.filter(r=>rxLive(v,r)).map(r=>({...r,sig:k}))]);
    const tc=sd.tdk[k].shift();if(tc.sig&&!rxLive(v,rxOf(k,tc.id)))continue;if(tc.sig)markSeenR(k,tc.id);return tc}
  return TACT[TACT.length-1]}
function benchTile(u,v,fn){return freeTiles((x,y)=>cheb({x,y},u)===1).sort(fn)[0]}
function woundV(){const sd=S.sd,v=sd.v;if(v.down)return true;if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[]}
  if(v.deck.length)v.wounds.push(v.deck.shift());
  if(!v.deck.length&&!v.discard.length){v.down=true;v.charge=null;
    if(sd.vl.every(o=>o.v.down)){endSd('win');return true}
    fxV('DEFEATED!','hit');log('sys',`${VILLAINS[sd.vkey].name} is down! Finish the other one.`);focusV(sd.vl.findIndex(o=>!o.v.down));return true}
  return false}
async function heroAttack(u,target,bonus=0,fixedDice=0,style){const sd=S.sd,h=heroOf(u),v=sd.v,b=BASE(h);
  if(letGo(u,'lets go of the civilians to fight.'))render();
  const aim=sd.aim,body=target==='v'&&v.sw?(aim&&swBodies(v).find(o=>o.x===aim.x&&o.y===aim.y&&cheb(u,o)<=stat(h,'range'))||swNear(v,u)):null;sd.aim=null;
  const side=target==='v'?sideOf(u,v,body):null,blind=side==='rear';if(blind){fxU(u,'BLIND SPOT!','good');log('hero',`${h.name} strikes from the blind spot: +1 die.`)}
  /* Version 113 (Tyler): side/rear bonus dice (Backstab, Frenzy, From the Shadows) only work in melee */
  const melee=target==='v'&&(body?cheb(u,body):dV(u,v))<=1,back=target==='v'&&side!=='front'&&melee?(u.buffBack||0)+(setOn(h,'noct')?1:0):0,call=target==='v'?(v.callout||0):0;if(call){v.callout=0;log('hero',`Callout: +${call} ${call===1?'die':'dice'} on this attack.`)}if(back)log('hero',`${h.name} strikes from the ${ARCN[side]} arc: +${back} more.`);
  const turret=setOn(h,'grid')&&!u.moved?1:0;if(turret)log('hero',`Turret Stance: ${h.name} hasn't moved yet, +1 die.`);
  const rel=target==='v'&&!u.noRel&&gearHas(h,'relent')&&u.relKey===sd.vkey?Math.min(1,u.relN||0):0;if(rel)log('hero',`Relentless: +${rel} ${rel===1?'die':'dice'} for keeping up the pressure.`);if(target==='v'&&!u.noRel)u.relHit=sd.vkey;
  const dice=(fixedDice||stat(h,'speed')+bonus)+(u.buffDice||0)+(target==='v'&&v.marked&&side!=='front'?1:0)+(blind?1:0)+back+call+turret+rel,strB=u.buffStr||0,accB=u.buffAcc||0,reap=target==='v'?(u.buffReap||0):0;u.buffDice=0;u.buffStr=0;u.buffAcc=0;u.buffBack=0;if(target==='v')u.buffReap=0;
  const acc=stat(h,'acc')+accB,rolls=[];let hits=0,wounds=0;
  await strikeAnim(style||b.fx,ctrU(u),target==='v'?(body?HC(body.x,body.y):ctrV()):ctrU(target),b.glow,'h'+u.hid);
  if(target==='v'){const eva=vStat('eva');
    for(let i=0;i<dice;i++){const r=d20();rolls.push(r);if(r===20||(r!==1&&r+acc>=eva))hits++}
    log('hero',`${h.name} attacks: rolled ${rolls.join(', ')} (+${acc}) vs evasion ${eva}. ${hits} hit${hits===1?'':'s'}.`);
    {const gm=hits?sd.hench.find(m=>m.elite&&m.owner===sd.vkey&&m.hp>0&&eliteOf(m.owner).guard&&dV(m,v)<=1):null;
      if(gm){hits--;gm.hp--;gm.hurtAt=Date.now();fxP(gm.x,gm.y,gm.hp<=0?'K.O.!':'BLOCKED!','hit');log('vill',`${eliteOf(gm.owner).name} steps in front of ${VILLAINS[sd.vkey].short} and takes the first hit.${gm.hp<=0?' He goes down.':''}`);if(gm.hp<=0)sd.hench=sd.hench.filter(m=>m!==gm);render()}}
    if(!hits){fxV('WHIFF!','miss');render();return}
    if(v.hide){v.hide=false;fxU(u,'GOTCHA!','good');log('hero',`${h.name} lands a hit and reads her stance. ${VILLAINS[sd.vkey].short}'s facing is revealed.`)}
    const ranged=dV(u,v)>1,close=body&&swBodies(v).some(o=>o.i!==body.i&&cheb(o,body)===1);
    if(body)log('hero',`${h.name} strikes the ${SWN[body.k].toLowerCase()} body from its ${ARCN[side]} arc.${close?' Another body is right beside it: +2 toughness.':''}`);
    let counter=0,flee=false,drain=0,summon=0,push=0,wall=false,pull=0,hide=false,bombAt=0,fuseTick=false,reflect=0,flash=false;const rows=[],q={splash:[]};
    for(let i=0;i<hits&&!sd.result;i++){let tc=drawTactic();if(tc.sig)tc={...tc,...rxOf(tc.sig,tc.id)};const okArc=!tc.arc||tc.arc.includes(side),okRng=!tc.ranged||ranged,okPart=!tc.part||(body&&body.k===tc.part),inArc=okArc&&okRng&&okPart;
      const why=!tc.sig?'':!okPart?`${h.name} hit the ${body?SWN[body.k].toLowerCase():''} body, not the ${SWN[tc.part].toLowerCase()}, so it does nothing.`:!okRng?`${h.name} is adjacent, and it only answers ranged attacks.`:tc.ranged&&okArc?`${h.name} attacked from range: it triggers!`:'';
      const note=why||(tc.arc&&side?`${h.name} struck from the ${ARCN[side]} arc: ${inArc?'it triggers!':'wrong side, it does nothing.'}`:'');
      if(tc.sig&&!inArc){log('hero',why||`${tc.n} only works in the ${arcTxt(tc.arc)}. ${h.name} is in the ${ARCN[side]} arc, so it does nothing.`);fxU(u,!okPart?'WRONG BODY!':!okRng?'TOO CLOSE!':'WRONG SIDE!','good')}
      let tough=vStat('tough')+(close?2:0),auto=false,block=false,blockTxt='A civilian is in the way.';
      if(tc.sig&&inArc){if(tc.auto)auto=true;tough+=(tc.tough||0)+(tc.gorge?2*Math.min(3,v.ate||0):0);if(tc.dmg&&(!tc.adj||dV(u,v)<=1))counter+=tc.dmg;drain+=tc.comp||0;summon+=tc.summon||0;if(tc.escape)flee=true;if(tc.push&&(!tc.adj||dV(u,v)<=1))push=Math.max(push,tc.push);if(tc.pull)pull=Math.max(pull,tc.pull);if(tc.hide)hide=true;if(tc.wall)wall=true;if(tc.bomb)bombAt=Math.max(bombAt,tc.bomb);if(tc.fuse)fuseTick=true;if(tc.reflect)reflect=Math.max(reflect,tc.reflect);if(tc.flash)flash=true;
        if(tc.guard&&sd.hench.some(hm=>dV(hm,v)<=1)){block=true;blockTxt='A henchman takes the blow.'}}
      else if(!tc.sig){if(tc.id==='weak')auto=true;if(tc.id==='armor')tough+=4;if(tc.id==='over')tough-=4;if(tc.id==='counter')counter+=2;
      if(tc.id==='shield'&&sd.civs.some(c=>dV(c,v)<=2))block=true;if(tc.id==='escape')flee=true}
      const r=d20(),str=stat(h,'str')+strB,ok=!block&&(auto||r===20||(r!==1&&r+str>=tough));
      const rollTxt=block?blockTxt:auto?`${tc.sig?tc.n:'Weak point'}: the wound lands.`:`Wound roll ${r} + ${str} vs toughness ${tough}.`;
      log('hero',`${tc.n}: ${rollTxt} ${ok?'Wound!':block?'':'No wound.'}`);
      const rw={tc,note,off:tc.sig&&!inArc,auto,block,blockTxt,r,str,tough,ok};rows.push(rw);
      if(ok){wounds++;sd.woundsBy[h.id]=(sd.woundsBy[h.id]||0)+1;if(tc.id==='mono')h.comp=Math.min(stat(h,'maxComp'),h.comp+1);
        q.page=null;const end=await woundAnim(`${h.name}: ${rollTxt}`,q);rw.page=q.page;if(end)break}}
    await attackPanel({name:h.name,acc,eva,rolls,hits,rows});
    fxV(wounds>=3?'KA-BOOM!':wounds?pick(SFX_HIT):rows.some(o=>o.block)?'NO!':'CLANG!',wounds?'hit':'miss');render();
    await breakStack(q.splash);
    if(wounds&&setOn(h,'bomber')&&!sd.result){const hm=sd.hench.filter(m=>cheb(m,u)<=1);if(hm.length){await A.ring(ctrU(u),COL.yel,2.4);hm.forEach(m=>{m.hp-=1;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'SHRAPNEL!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',`Shrapnel: ${hm.length} henchm${hm.length===1?'an':'en'} next to ${h.name} take 1.`);render()}}
    if(counter&&!sd.result){log('vill',`Reaction! ${h.name} takes ${counter}.`);await strikeAnim('slash',ctrV(),ctrU(u),COL.mag,'v'+S.sd.vi);fxU(u,'OOF!','vhit');damageHero(u,counter);render()}
    if(drain&&!sd.result){h.comp=Math.max(0,h.comp-drain);fxU(u,'RATTLED!','vhit');log('vill',`${h.name} loses ${drain} composure.`);render()}
    if(push&&!u.ko&&u.anchor&&!sd.result){fxU(u,'ANCHORED!','good');log('hero',`${h.name} is anchored and holds firm.`)}
    if(push&&!u.ko&&!u.anchor&&!sd.result){let n=0;for(let i=0;i<push;i++){const t=benchTile(u,v,(a,b)=>dV(b,v)-dV(a,v));if(!t||dV(t,v)<=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){log('vill',n>1?`${h.name} is flung ${n} hexes back.`:`${h.name} is shoved back.`);render();await sleep(260)}else log('vill',`${h.name} is pinned in place and can't be shoved.`)}
    if(pull&&!u.ko&&u.anchor&&!sd.result){fxU(u,'ANCHORED!','good');log('hero',`${h.name} is anchored and holds firm.`)}
    if(pull&&!u.ko&&!u.anchor&&!sd.result){let n=0;for(let i=0;i<pull;i++){const t=benchTile(u,v,(a,b)=>dV(a,v)-dV(b,v));if(!t||dV(t,v)>=dV(u,v))break;u.x=t.x;u.y=t.y;n++}if(n){fxU(u,'YANKED!','vhit');log('vill',`${h.name} is dragged ${n} hex${n>1?'es':''} toward ${VILLAINS[sd.vkey].short}.`);render();await sleep(260)}}
    if(wall&&!sd.result){const t=benchTile(u,v,(a,b)=>dV(a,v)-dV(b,v));if(t){sd.walls.push({k:t.x+','+t.y,ttl:2});await A.smoke(HC(t.x,t.y),2);log('vill','A scaffold wall slams down.');render()}}
    for(let n=0;n<summon&&!sd.result;n++){const t=freeTiles((x,y)=>dV({x,y},v)===1)[0];if(!t)break;sd.hench.push({id:'r'+Date.now()+n,owner:sd.vkey,x:t.x,y:t.y,hp:henchHp(2)});fxP(t.x,t.y,'BACKUP!','say');log('vill',`A ${VILLAINS[sd.vkey].hench.name.toLowerCase()} joins the fight.`);render()}
    if(bombAt&&!sd.result&&!u.ko&&dropBomb(u.x,u.y,1,dmgScale(bombAt))){fxU(u,'TSSS!','vhit');log('vill',`${VILLAINS[sd.vkey].short} leaves a lit bomb at ${h.name}'s feet.`);render()}
    if(flee&&!sd.result){const was=JSON.stringify(vCells(v));await vMove(()=>vAway(u,2,{strict:true}));if(JSON.stringify(vCells(v))!==was){fxV('HA HA!','say');log('vill','The villain slips out of reach.')}else{fxV('CORNERED!','good');log('vill','The villain tries to slip away, but there is nowhere to go.')}}
    if(wounds&&!u.ko){if(reap){const n=reap*wounds;h.hp=Math.min(stat(h,'maxHp'),h.hp+n);fxU(u,`+${n} HP`,'good');log('hero',`${h.name} reaps ${n} health.`)}
      const aw=h.ranks.magic?stat(h,'arcWound'):0;if(aw&&u.res){const was=u.res.magic||0;u.res.magic=Math.min(arcMax(h),was+aw);if(u.res.magic>was)log('hero',`${h.name} draws ${u.res.magic-was} Arcana from the torn page.`)}}
    if(fuseTick&&!sd.result&&sd.bombs&&sd.bombs.length){fxV('FZZT!','say');log('vill','Short Fuse! Every bomb on the board ticks down 1.');await bombTick()}
    if(reflect&&!sd.result&&!u.ko&&!v.down){fxV('PTCHOO!','say');log('vill',`Reflector Visor! The attack bounces back at ${h.name} as a beam.`);await fireBeams([aimLine(v,u)],dmgScale(reflect),'Reflector Visor')}
    if(flash&&!sd.result){const lm=litMap(),on=live().filter(o=>lm[o.x+','+o.y]);fxV('FLASH!','say');
      if(on.length){for(const o of on){fxU(o,'ZZT!','vhit');damageHero(o,optic(1))}log('vill',`Flashback! Every lit beam pulses: ${on.map(o=>heroOf(o).name).join(', ')} take${on.length>1?'':'s'} ${optic(1)}.`);checkLoss()}
      else log('vill','Flashback! The beams pulse, but nobody is standing in one.');render()}
    if(hide&&!sd.result&&!v.down){v.hide=true;log('vill',`${VILLAINS[sd.vkey].short} melts back into the shadows. Her facing is hidden again.`);render()}
  }else{const hm=target,meva=hm.elite?eliteEva(hm):7;for(let i=0;i<dice;i++){const r=d20();rolls.push(r);if(r===20||(r!==1&&r+acc>=meva))hits++}
    if(hits&&hm.elite&&eliteOf(hm.owner||sd.vkey).brute&&hm.shrug!==sd.round){hm.shrug=sd.round;hits--;log('vill',`${hName(hm)} shrugs off the first hit this round.`)}
    hm.hp-=hits;hm.hurtAt=Date.now();log('hero',`${h.name} hits ${hName(hm)}: rolled ${rolls.join(', ')}. ${hits} damage.`);
    fxP(hm.x,hm.y,hm.hp<=0?'K.O.!':hits?pick(SFX_HIT):'WHIFF!',hits?'hit':'miss');
    if(hm.hp<=0){render();await A.smoke(ctrU(hm),4);sd.hench=sd.hench.filter(o=>o!==hm);log('hero','Henchman down.')}render()}}
async function splash(target){const sd=S.sd;const from=target==='v'?ctrV():ctrU(target);
  const near=sd.hench.filter(h=>h!==target&&(target==='v'?dV(h,sd.v)<=1:cheb(h,target)<=1));if(!near.length)return;
  await Promise.all(near.map(h=>A.bolt(from,ctrU(h),COL.magic,true)));
  near.forEach(h=>{h.hp--;h.hurtAt=Date.now();fxP(h.x,h.y,h.hp<=0?'K.O.!':'ZAP!','hit')});const dead=near.filter(h=>h.hp<=0);sd.hench=sd.hench.filter(h=>h.hp>0);
  log('hero',`Arc Burst jumps to ${near.length} henchm${near.length===1?'an':'en'}${dead.length?`, dropping ${dead.length}`:''}.`);render()}
function endSd(r){S.sd.result=r;S.sd.mode=null;S.sd.sel=null;if(r==='win')fxV('DEFEATED!','hit');
  log('sys',r==='win'?'The villain\'s playbook is empty. Victory!':r==='loss'?'Every hero is down.':'The villain escapes before you can finish it.')}
function checkLoss(){if(!S.sd.result&&!live().length)endSd('loss')}
async function villainPhase(){const sd=S.sd;if(!sd||sd.result||sd.busy)return;sd.busy=true;sd.vturn=true;sd.mode=null;sd.sel=null;render();await sleep(250);
  beamTick();await hazardTick();checkLoss();await bombTick();checkLoss();
  for(let i=0;i<sd.vl.length&&!sd.result;i++){if(sd.vl[i].v.down)continue;focusV(i);const v=sd.v,vn=VILLAINS[sd.vkey].name;
    if(v.skip){v.skip=false;fxV('FROZEN!','good');if(v.charge){log('hero',`Time Stop: ${vn} loses ${v.charge.n}.`);v.charge=null}
      else{if(!v.deck.length){v.deck=shuffle(v.discard);v.discard=[]}const c=v.deck.shift();if(c){markSeen(sd.vkey,c.id);v.discard.push(c);log('hero',`Time Stop: ${vn} loses its turn. ${c.n} is thrown away unplayed.`)}}render();await sleep(400)}
    else if(v.charge){await fireCharge();checkLoss()}
    else{
      if(!v.deck.length){v.deck=shuffle(v.discard);v.discard=[];log('sys',`${vn} reshuffles the playbook.`)}
      if(!v.deck.length)continue;
      const c=v.deck[0];await reveal(villainCardView(c));markSeen(sd.vkey,c.id);v.deck.shift();
      v.last=c;v.foresee=false;log('vill',`${vn} plays ${c.n}.`);fxV(c.n.toUpperCase()+'!','say');render();await sleep(300);
      await execCard(c);v.discard.push(c);if(v.sw){const r=swSync(v);r.grew.forEach(k=>log('vill',`The ${SWN[k].toLowerCase()} body re-forms and rejoins the swarm.`));if(r.grew.length)render()}}
    checkLoss();render();await sleep(300)}
  for(const hm of sd.hench.slice()){if(sd.result)break;if(!sd.hench.includes(hm))continue;await henchAct(hm);checkLoss();render();await sleep(120)}
  if(!sd.result){sd.units.forEach(civFollow);await civPanic()}
  sd.units.forEach(u=>u.guard=false);sd.vl.forEach(o=>{o.v.hex=false;o.v.marked=false;o.v.cursed=false;o.v.callout=0;o.v.blind=false;o.v.excise=0});sd.walls.forEach(w=>{if(!w.perm)w.ttl--});{const fall=sd.walls.filter(w=>w.girder&&w.ttl<=0);sd.walls=sd.walls.filter(w=>w.ttl>0);
    for(const w of fall){const[x,y]=w.k.split(',').map(Number),t=live().filter(u=>cheb(u,{x,y})===1).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];await A.smoke(HC(x,y),4);
      if(t){fxU(t,'CRASH!','vhit');log('vill',`A girder topples onto ${heroOf(t).name} for ${w.dmg}.`);damageHero(t,w.dmg)}else log('vill','A girder topples over and hits nobody.');render()}checkLoss()}
  focusV(sd.vl.findIndex(o=>!o.v.down));vWarn();
  if(!sd.result){sd.round++;
    {sd.units.forEach(u=>{u.stasis=false;u.moved=!!u.dazed;u.dazed=false;u.acted=false;u.freeEvac=false;u.buffDice=0;u.buffStr=0;u.buffAcc=0;u.buffBack=0;u.buffReap=0;u.buffEva=0;u.avoidDamage=false;u.dr=0;u.anchor=false;if(u.capUsed&&!u.abRd)u.capUsed=false;u.abRd=false;u.innUsed=0;u.abUsed=[];u.jump=false;u.ripo=false;u.ripUsed=false;u.reflect=0;
        if(u.relHit){u.relN=u.relHit===u.relKey?(u.relN||0)+1:1;u.relKey=u.relHit}else{u.relN=0;u.relKey=null}u.relHit=null;
        const h=heroOf(u);u.anchor=setOn(h,'lode');if(!u.ko){if(setOn(h,'cantor'))h.comp=Math.min(stat(h,'maxComp'),h.comp+1);if(setOn(h,'serpent'))h.hp=Math.min(stat(h,'maxHp'),h.hp+1)}u.lowP=(u.res.tech||0)<=1;u.res.tech=Math.min(pwrMax(h),(u.res.tech||0)+pwrRegen(h));u.res.magic=Math.min(arcMax(h),u.res.magic||0);if(S.facilities.includes('sanctum')&&!u.ko)h.comp=Math.min(stat(h,'maxComp'),h.comp+1)});
      roster().forEach(h=>{if(h.cd>0)h.cd--});
      sd.units.forEach(u=>{const h=heroOf(u);if(u.ko||!setOn(h,'helios'))return;const hm=sd.hench.filter(m=>cheb(m,u)<=1);if(!hm.length)return;hm.forEach(m=>{m.hp-=1;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'SIZZLE!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',`Corona: ${h.name} scorches ${hm.length} henchm${hm.length===1?'an':'en'}.`)});
      {const got={mend:[],calm:[],charge:[]};sd.units.forEach(u=>{if(u.ko)return;const h=heroOf(u);
        if(auraOn(u,'mend')&&h.hp*2<=stat(h,'maxHp')){h.hp++;got.mend.push(h.name)}
        if(auraOn(u,'calm')&&h.comp*2<=stat(h,'maxComp')){h.comp++;got.calm.push(h.name)}
        if(auraOn(u,'charge')&&pwrMax(h)&&u.lowP&&(u.res.tech||0)<pwrMax(h)){u.res.tech++;got.charge.push(h.name)}});
        for(const id in got)if(got[id].length)log('hero',`${AURA_FX[id].n}: ${got[id].join(', ')} ${id==='mend'?'regain 1 health':id==='calm'?'regain 1 composure':'recharge 1 more Power'}.`)}
      log('sys',`Round ${sd.round}. Your move.`)}}
  sd.busy=false;sd.vturn=false;render()}

/* ============ AFTERMATH ============ */
function debrief(){const sd=S.sd,vs=vState(sd.vkey),def=VILLAINS[sd.vkey],L=[],res=sd.result;
  const evT=S.ethos.b==='secret'?Math.min(1,sd.evac):sd.evac,per=S.ethos.a==='force'?2:1;
  if(sd.termGot)L.push(`Evidence terminal hacked: +${sd.termGot} intel.`);
  S.trust+=evT-sd.harmed*per;L.push(`${sd.evac} civilian${sd.evac===1?'':'s'} evacuated (+${evT} trust), ${sd.harmed} harmed (−${sd.harmed*per} trust).`);
  eliteSalvage(L);
  let headline;
  if(res==='win'){const sal=3+(sd.quality==='prepared'?1:0)+fieldCount('salvage')+(S.facilities.includes('magnet')?1:0);S.salvage[sd.vkey]+=sal;S.tech++;L.push(`Salvaged ${sal} ${def.salvage} and 1 tech from the lair.`);
    {let n=0;for(const {h} of fieldGear('strip'))n+=Math.floor((sd.woundsBy[h.id]||0)/3);if(n){S.salvage[sd.vkey]+=n;L.push(`Scrapper's Hooks: +${n} ${def.salvage} stripped from the pages torn out.`)}}
    vs.beaten=(vs.beaten||0)+1;
    if(S.ethos.a==='restraint'){S.salvage[sd.vkey]++;L.push(`Restraint: +1 ${def.salvage}.`)}
    {const un=unlock(DEFEAT_UNLOCK[sd.vkey]);if(un.length)L.push(`Seized blueprints: ${un.join(', ')}.`)}
    levelUpVillain(vs);vs.scheme=0;headline='Victory!';L.push(`${def.name} escapes in the chaos and returns at level ${vs.level}.`)}
  else if(res==='loss'){S.trust-=2;const add=levelUpVillain(vs);vs.scheme=0;headline='Defeat';L.push(`The team is carried out of the lair. −2 trust. ${def.name} grows bolder (level ${vs.level}).`)}
  else{S.trust--;S.salvage[sd.vkey]++;vs.scheme=0;headline='Slipped away';L.push(`${def.name} gets away. You recover 1 ${def.salvage}. −1 trust.`)}
  if(S.facilities.includes('lab')){S.tech++;L.push('The lab reverse-engineers scraps: +1 tech.')}
  const med=S.facilities.includes('medbay'),train=S.facilities.includes('training'),xpAt=L.length,xpL=[];
  for(const u of sd.units){const h=heroOf(u);let xp=1+(train?1:0)+((sd.woundsBy[h.id]||0)>=2?1:0)+(Object.values(h.gear).some(g=>GEAR[g].field&&GEAR[g].field.id==='xp')?1:0);h.xp+=xp;xpL.push(`${h.name} +${xp}`);
    while(h.xp>=xpNeed(h)){h.xp-=xpNeed(h);h.pendingUp++;L.push(`${h.name} reaches level ${lvlOf(h)+h.pendingUp}. Choose a discipline and an upgrade in the roster. Next level needs ${xpNeed(h)} XP.`)}
    /* Version 130 (Tyler): no injury roll, careers never end, and a knocked-out hero is ready for the next issue */
    if(u.ko)h.hp=Math.ceil(stat(h,'maxHp')/2);
    else h.hp=Math.max(h.hp,Math.ceil(stat(h,'maxHp')*.6));
    /* Med Bay: half of the health still missing after normal recovery */
    if(med)h.hp+=Math.ceil((stat(h,'maxHp')-h.hp)/2);
    if(h.comp<=0&&!h.injuries.includes('rattled')){h.injuries.push('rattled');L.push(`${h.name} ended the fight with no composure and is Rattled (−1 max composure).`)}
    h.comp=stat(h,'maxComp');h.cd=0;clampHero(h)}
  if(xpL.length)L.splice(xpAt,0,`XP earned: ${xpL.join(', ')}.`);
  const mk=fieldCount('medkit');if(mk){party().forEach(h=>{h.hp=Math.min(stat(h,'maxHp'),h.hp+3*mk)});L.push(`Field Medic Kit: the party recovers ${3*mk} extra health.`)}
  finishIssue(L,{hunted:sd.vkey,headline,vkey:sd.vkey})}


function chargeZone(z){const sd=S.sd,v=sd.v,L=live().slice().sort((a,b)=>dV(a,v)-dV(b,v)),ks=new Set();
  const box=(t,r=1)=>hexesWithin(t,r).forEach(p=>{if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(p.x+','+p.y)});
  const hurt=()=>L.slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp);
  if(z==='blast'&&L[0]){box(L[0],2);faceTo(L[0])}
  if(z==='blast2')L.slice(0,3).forEach(t=>box(t));
  if(z==='mark'&&L.length){const ts=hurt().slice(0,2);ts.forEach(t=>box(t));faceTo(ts[0]);v.hide=false}
  if(z==='line'&&L.length){const far=L.slice(-2).reverse();far.forEach((t,i)=>{const d=dirC(vCtr(v),HC(t.x,t.y)),A=ax(t);if(!i)v.face=d;
    for(let k=-2*N;k<=2*N;k++){const p=off(A.q+AXD[d][0]*k,A.r+AXD[d][1]*k);if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(p.x+','+p.y)}})}
  if(z==='focus'&&L.length){const t=hurt()[0];faceTo(t);box(t);
    for(let d=0;d<6;d++){let p=t;for(let g=0;g<2*N;g++){p=step(p,d);const k=p.x+','+p.y;if(!inB(p.x,p.y)||sd.obs.includes(k)||(sd.walls||[]).some(w=>w.k===k)||inV(v,p.x,p.y))break;ks.add(k)}}}
  if(z==='nova')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!inV(v,x,y)&&dV({x,y},v)<=3)ks.add(x+','+y);
  return [...ks]}
async function hazardTick(){const sd=S.sd;if(!sd.haz.length)return;
  for(const u of live().filter(u=>sd.haz.some(h=>h.k===u.x+','+u.y))){const hz=sd.haz.find(h=>h.k===u.x+','+u.y);
    await A.ring(ctrU(u),COL.innate,1.6);fxU(u,'SIZZLE!','vhit');damageHero(u,hz.dmg);log('vill',`${heroOf(u).name} is burned by the ${hz.n||'molten floor'} for ${hz.dmg}.`);render()}
  sd.haz.forEach(h=>{if(!h.perm)h.ttl--});sd.haz=sd.haz.filter(h=>h.ttl>0)}
/* Payload's bombs: sd.bombs [{k,fuse,dmg,o}] tick down at the start of each villain turn and go off on their hex and the 6 around it.
   They hit heroes, civilians and henchmen, never a villain. A Sapper beside a bomb packs it for +1. */
const BOMB_MAX=4;
const bombP=b=>{const[x,y]=b.k.split(',').map(Number);return {x,y}};
function dropBomb(x,y,fuse,dmg){const sd=S.sd,k=x+','+y;sd.bombs=sd.bombs||[];const e=sd.bombs.find(b=>b.k===k);
  if(e){e.fuse=Math.min(e.fuse,fuse);e.dmg=Math.max(e.dmg,dmg);return true}
  if(sd.bombs.length>=BOMB_MAX)return false;sd.bombs.push({k,fuse,dmg,o:sd.vkey});return true}
async function blowBombs(list,bonus=0){const sd=S.sd;
  for(const b of list){if(sd.result)break;sd.bombs=sd.bombs.filter(o=>o!==b);const p=bombP(b),inZ=q=>cheb(q,p)<=1,sap=sd.hench.some(m=>m.owner===b.o&&cheb(m,p)<=1)?1:0,dm=b.dmg+bonus+sap;
    render();await A.ring(HC(p.x,p.y),COL.yel,3.4,{count:2});fxP(p.x,p.y,pick(['KA-BOOM!','BLAM!','KRAKOOM!']),'vhit');
    if(sap)log('vill','A Sapper packed that bomb: +1 damage.');
    const hd=dm,hs=live().filter(inZ),hm=sd.hench.filter(inZ);
    for(const u of hs){if(await wardBlocks(u))continue;fxU(u,'OOF!','vhit');damageHero(u,hd);log('vill',`A bomb goes off on ${heroOf(u).name} for ${hd}.`)}
    sd.civs.filter(inZ).forEach(c=>harmCiv(c,'a bomb'));termHit(inZ,'A bomb');
    hm.forEach(m=>{m.hp-=dm;m.hurtAt=Date.now()});const dead=hm.filter(m=>m.hp<=0);if(dead.length){sd.hench=sd.hench.filter(m=>m.hp>0);log('vill',`The blast takes out ${dead.length} of the villain's own henchm${dead.length>1?'en':'an'}.`)}
    if(!hs.length&&!hm.length)log('vill','A bomb goes off, but nobody is close enough to get hurt.');
    render();checkLoss();await sleep(FAST?0:220)}}
async function bombTick(){const sd=S.sd;if(!sd.bombs||!sd.bombs.length)return;sd.bombs.forEach(b=>b.fuse--);render();const due=sd.bombs.filter(b=>b.fuse<=0);if(due.length)await blowBombs(due)}
/* Gridlock's beams run along a hex line to the board edge. A beam stops at walls, rubble and villains, and at the first hero or civilian
   it hits; a hero hit is knocked back along the beam as many hexes as the damage. Hexes it crossed stay lit until his next turn:
   stepping into one costs BEAM_HOT and ends the move, and a hero can jump over a single lit hex for 2 movement. Prisms split a beam 60° both ways. */
const BEAM_HOT=2;
function litMap(){const m={};((S.sd&&S.sd.beams)||[]).forEach(b=>b.ks.forEach(k=>{m[k]=Math.max(m[k]||0,b.hot)}));return m}
/* Version 108 (Tyler): Optics Bench no longer cuts beam damage, it fits scope rails (see stat) */
function optic(n){return n}
function beamTick(){const sd=S.sd;if(!sd.beams||!sd.beams.length)return;sd.beams.forEach(b=>b.ttl--);sd.beams=sd.beams.filter(b=>b.ttl>0);render()}
function beamStep(u){const n=litMap()[u.x+','+u.y];if(!n||u.ko)return;const dm=optic(n);fxU(u,'ZZZT!','vhit');damageHero(u,dm);log('vill',`${heroOf(u).name} steps into a beam and takes ${dm}. Their move ends there.`);checkLoss()}
/* hero movement with lit beams: a lit hex can be entered but not passed through, unless you jump clean over it */
/* beams end a normal move; only a jumping hero (u.jump from Solar Dive, u.boostJump from Mighty Leap, Jet or Piston Leap, or gear with jumps) can clear one lit hex for 2 movement */
const JUMP_AB=['wings'];
function reachH(u,mv){const lm=litMap(),pt=new Set(S.sd.pits||[]),jump=!!(u.jump||u.boostJump||jumpsAll(heroOf(u)));reachH.leaps=new Set();if(!Object.keys(lm).length&&!(jump&&pt.size))return reach(u,mv,u);
  const s=u.x+','+u.y,dist={[s]:0},q=[[u.x,u.y]],lp=reachH.leaps;
  while(q.length){const[x,y]=q.shift(),k0=x+','+y,d=dist[k0];if(d>=mv||(k0!==s&&lm[k0]))continue;
    for(let e=0;e<6;e++){const n=step({x,y},e),k=n.x+','+n.y;
      if(!blocked(n.x,n.y,{self:u})&&!(k in dist&&dist[k]<=d+1)){dist[k]=d+1;lp.delete(k);q.push([n.x,n.y])}
      if(jump&&(lm[k]||pt.has(k))&&d+2<=mv){const n2=step(n,e),k2=n2.x+','+n2.y;if(inB(n2.x,n2.y)&&!lm[k2]&&!blocked(n2.x,n2.y,{self:u})&&!(k2 in dist&&dist[k2]<=d+2)){dist[k2]=d+2;lp.add(k2);q.push([n2.x,n2.y])}}}}
  delete dist[s];return dist}
/* each direction fires from the body hex that leads that way, so a 4-hex turret has several emitters */
function emitCell(v,d){const u=FACE_DEG[d]*Math.PI/180,dx=Math.cos(u),dy=Math.sin(u);return vCells(v).map(c=>{const h=HC(c.x,c.y);return {c,s:h.cx*dx+h.cy*dy}}).sort((a,b)=>b.s-a.s)[0].c}
function rayK(f,d,t){const A=ax(f),B=ax(t),dq=B.q-A.q,dr=B.r-A.r,[a,b]=AXD[d],k=a?dq/a:dr/b;return k>0&&Number.isInteger(k)&&dq===a*k&&dr===b*k?k:0}
/* aim from a villain or a single hex: straight through the target if any emitter lines up, else the closest direction */
function aimLine(from,t){const vil=!!from.shape,cells=vil?vCells(from):[from];let best=null;
  for(const c of cells)for(let d=0;d<6;d++){const k=rayK(c,d,t),n=step(c,d);if(k&&!(vil&&inV(from,n.x,n.y))&&(!best||k<best.k))best={from:{x:c.x,y:c.y},d,k}}
  if(best)return {from:best.from,d:best.d};
  const d=dirC(vil?vCtr(from):HC(from.x,from.y),HC(t.x,t.y));return {from:vil?emitCell(from,d):{x:from.x,y:from.y},d}}
function traceBeam(L,hitSet,split){const sd=S.sd,ks=[],res={ks,hit:null,civ:null,splits:[]};let p=L.from;
  for(let g=0;g<4*N;g++){p=step(p,L.d);if(!inB(p.x,p.y))break;const k=p.x+','+p.y;
    if(sd.obs.includes(k)||(sd.walls||[]).some(w=>w.k===k)||sd.vl.some(o=>!o.v.down&&inV(o.v,p.x,p.y)))break;
    ks.push(k);const u=live().find(o=>o.x===p.x&&o.y===p.y);if(u){if(!hitSet.has(u))res.hit=u;break}
    const cv=sd.civs.find(c=>c.x===p.x&&c.y===p.y);if(cv){res.civ=cv;break}
    const pm=sd.hench.find(m=>m.x===p.x&&m.y===p.y&&m.owner==='grid');
    if(pm&&!split.has(pm)){split.add(pm);res.splits.push({from:{x:p.x,y:p.y},d:(L.d+1)%6},{from:{x:p.x,y:p.y},d:(L.d+5)%6})}}
  return res}
async function fireBeams(lines,dmg,label,o={}){const sd=S.sd,v=sd.v,hitSet=o.hit||new Set(),split=new Set(),q=lines.slice(),done=[],hot=dmgScale(BEAM_HOT);sd.beams=sd.beams||[];
  while(q.length&&done.length<24){const L=q.shift(),r=traceBeam(L,hitSet,split);done.push({L,r});q.push(...r.splits);if(r.hit)hitSet.add(r.hit)}
  const lit=done.filter(e=>e.r.ks.length);lit.forEach(e=>sd.beams.push({k0:e.L.from.x+','+e.L.from.y,ks:e.r.ks,ttl:o.ttl||1,hot}));
  await Promise.all(lit.map(e=>{const[zx,zy]=e.r.ks[e.r.ks.length-1].split(',').map(Number);return A.laser(HC(e.L.from.x,e.L.from.y),HC(zx,zy),'#FF2D55')}));render();
  const civs=done.filter(e=>e.r.civ),hits=done.filter(e=>e.r.hit);civs.forEach(e=>{if(sd.civs.includes(e.r.civ))harmCiv(e.r.civ,label)});
  const dm=optic(v.cursed&&dmg>0?Math.max(1,dmg-2):dmg);
  for(const e of hits){const u=e.r.hit,h=heroOf(u);if(u.ko||sd.result)continue;if(await wardBlocks(u))continue;
    fxU(u,'ZZARK!','vhit');damageHero(u,dm);let n=0;
    if(!u.ko){if(u.anchor)fxU(u,'ANCHORED!','good');else for(let i=0;i<dm;i++){const t=step(u,e.L.d);if(!inB(t.x,t.y)||blocked(t.x,t.y,{self:u}))break;u.x=t.x;u.y=t.y;n++}}
    log('vill',`${label} hits ${h.name} for ${dm}${n?` and knocks them back ${n} hex${n>1?'es':''}`:u.anchor?'. They are anchored and hold firm':''}.`);render();await sleep(FAST?0:220)}
  const nk=new Set(lit.flatMap(e=>e.r.ks)).size;
  log('vill',hits.length||civs.length?`${nk} hexes stay lit until ${VILLAINS[sd.vkey].short}'s next turn.`:`${label}: ${lit.length} beam${lit.length===1?'':'s'} light up ${nk} hexes, but nobody is caught.`);
  checkLoss();return hits.map(e=>e.r.hit)}
async function fireCharge(){const sd=S.sd,v=sd.v,ch=sd.v.charge;sd.v.charge=null;
  if(v.wounds.length-ch.w0>=(ch.need||2)){fxV('STAGGERED!','good');log('hero',`The heroes tore ${v.wounds.length-ch.w0} pages. ${ch.n} fizzles out!`);render();await sleep(400);return}
  const cells=ch.zone.map(k=>{const[x,y]=k.split(',').map(Number);return {...HC(x,y),x,y}});
  sd.firing=ch.zone;fxV(ch.n.toUpperCase()+'!','say');render();
  await Promise.all([A.bolt(ctrV(),cells[Math.floor(cells.length/2)],COL.yel),...cells.map((p,i)=>sleep(i*22).then(()=>A.ring(p,COL.yel,1.4)))]);
  sd.firing=null;const inZ=p=>ch.zone.includes(p.x+','+p.y);
  const hit=live().filter(inZ);
  const cd=ch.dmg>0&&v.cursed?Math.max(1,ch.dmg-2):ch.dmg;for(const u of hit){if(await wardBlocks(u))continue;fxU(u,pick(['FWOOOM!','KRAKOOM!']),'vhit');damageHero(u,cd);log('vill',`${ch.n} scorches ${heroOf(u).name} for ${ch.dmg}.`)}
  sd.civs.filter(inZ).forEach(c=>harmCiv(c,ch.n));termHit(inZ,ch.n);
  if(!hit.length)log('vill',`${ch.n} fires, but everyone got clear!`);render()}


/* Version 130 (Tyler): a splash page opens every fight with the villain's line for how the investigation went,
   and another closes it with the villain's escape (win) or taunt (loss). Headless sims never see either. */
let fsSeen='';
function fsplashView(){const sd=S.sd;if(FAST||S.phase!=='sd'||!sd||sd.patrol)return '';
  const keys=sd.vl.map(o=>o.key),q=sd.quality,id=(sd.intro?'in':sd.result)+S.vol+'.'+S.issue+keys.join(),still=id===fsSeen?' still':'';fsSeen=id;
  if(sd.intro){const head=sd.finale&&S.event?`Event comic · ${esc(S.event.title)}`:`Issue #${S.issue} · Lair showdown`;
    return `<div id="fsplash" class="${still}" role="dialog" aria-modal="true" aria-label="The fight begins">${keys.map((k,i)=>{const d=VILLAINS[k];
      return `<div class="fs fsv-${k}" style="${vSty(k)}"><span class="fsem">${vIc(k)}</span><span class="fsfx" aria-hidden="true">${VSFX[k]||''}</span><small>${head} · Level ${sd.vl[i].v.level}</small><b class="fsn">${esc(d.name)}</b>${i===0?`<span class="fsq" data-tip="kw:q_${q}">${QUAL[q].n}</span>`:''}
        <div class="say">“${esc(vLine(k,q))}”</div>${i===keys.length-1?`<div class="fsd">${QUAL[q].txt}</div>`:''}</div>`}).join('')}
      <div class="fsb"><button class="btn pri" data-a="sdgo">${q==='ambush'?'Brace yourselves!':'Fight!'}</button></div></div>`}
  if(sd.result&&!sd.busy&&!sd.outro){const win=sd.result==='win',t=win?'escape':'taunt';
    const head=win?(sd.finale?'City saved!':'Victory!'):sd.result==='loss'?(sd.finale?'Blackharbor falls':'Defeat'):'Slipped away';
    return `<div id="fsplash" class="${still}" role="dialog" aria-modal="true" aria-label="${head}">${keys.map((k,i)=>{const d=VILLAINS[k];
      return `<div class="fs fsv-${k}" style="${vSty(k)}"><span class="fsem">${vIc(k)}</span><span class="fsfx" aria-hidden="true">${VSFX[k]||''}</span>${i===0?`<span class="fsx ${win?'':'bad'}">${head}</span>`:''}<small>${win?'Escaping':'Gloating'}</small><b class="fsn">${esc(d.name)}</b>
        <div class="say">“${esc(vLine(k,t))}”</div>${i===keys.length-1?`<div class="fsd">${win?(sd.finale?'The playbooks are empty and Blackharbor is safe, for now.':`${esc(d.short)} slips away in the chaos${d.intro?'. Something tells you he\'ll be back.':' and will be back a level stronger.'}`):'The team is carried out of the lair.'}</div>`:''}</div>`}).join('')}
      <div class="fsb"><button class="btn" data-a="sdlook">See the board</button><button class="btn pri" data-a="debrief">Debrief</button></div></div>`}
  return ''}
/* Version 134 (Tyler): hit feedback. Each render compares health and torn pages with the last render of the same fight and
   floats a damage number where something dropped. A hero losing 3+ health or a villain losing 2+ pages shakes the board. */
let HPS={sd:null,m:{}},SHK=0;
function hitTick(sd){const fresh=HPS.sd!==sd;if(fresh)HPS={sd,m:{}};const m=HPS.m;let big=false;
  const see=(key,val,cx,cy,k,bigAt)=>{const was=m[key];m[key]=val;if(fresh||was==null||val>=was)return;const d=was-val;fx(cx+.3,cy-.3,'−'+d,k);if(d>=bigAt)big=true};
  sd.units.forEach(o=>{const c=HC(o.x,o.y);see('h'+o.hid,heroOf(o).hp,c.cx,c.cy,'dmgh',3)});
  sd.hench.forEach(x=>{const c=HC(x.x,x.y);see('m'+x.id,x.hp,c.cx,c.cy,'dmg',9)});
  sd.vl.forEach((o,i)=>{const c=vCtr(o.v);see('v'+i,-(o.v.wounds||[]).length,c.cx,c.cy,'dmg',2)});
  if(big)SHK=Date.now()}
/* Version 141 (Tyler): subtle facing zones. Hexes up to two away in a villain's front arc get the lair's --zf tint and its
   blind spot gets --zr (sideOf decides). Hidden Nocturne shows none. Drawn above the floor, under every token. */
function vZones(W,H){const sd=S.sd;if(sd.result)return '';let s='';const wl=new Set((sd.walls||[]).map(w=>w.k));
  sd.vl.forEach(o=>{const v=o.v;if(v.down||v.hide)return;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!inB(x,y)||inV(v,x,y)||wl.has(x+','+y))continue;const d=dV({x,y},v);if(d<1||d>2)continue;const z=sideOf({x,y},v);if(z==='flank')continue;const h=HC(x,y);
      s+=`<polygon class="z${z==='front'?'f':'r'}${d>1?' z2':''}" points="${VHX(h.cx,h.cy,.97)}"/>`}});
  return s?`<svg class="zones" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`:''}
function sdView(){const sd=S.sd,def=VILLAINS[sd.vkey],v=sd.v;
  const u=sd.sel!=null?sd.units[sd.sel]:null,h=u?heroOf(u):null;
  let reachM={},tg=new Set(),al=new Set();
  if(u&&!sd.busy){if(sd.mode==='move'&&!u.moved)reachM=reachH(u,stat(h,'move')+(u.boost||0));
    const rng=stat(h,'range');
    const vt=o=>vCells(o.v).forEach(({x,y})=>tg.add(x+','+y));
    if(sd.mode==='attack'||sd.mode==='arc'){sd.vl.forEach(o=>{if(!o.v.down&&dV(u,o.v)<=rng&&!shotVB(u,o.v))vt(o)});sd.hench.forEach(m=>{if(cheb(m,u)<=rng&&!shotBlocked(u,m))tg.add(m.x+','+m.y)})}
    if(sd.mode==='patch')live().forEach(o=>{if(cheb(o,u)<=3)al.add(o.x+','+o.y)});
    const sab=sd.abKey&&GEAR[sd.abKey]&&GEAR[sd.abKey].ab,sr=sab&&sab.r!=null?abV(sab.r,potOf(h)):0;
    if(sd.mode==='abally')live().forEach(o=>{if(cheb(o,u)<=sr)al.add(o.x+','+o.y)});
    if(sd.mode==='abstrike')sd.vl.forEach(o=>{if(!o.v.down&&(!sab.rng||dV(u,o.v)<=sab.rng))vt(o)});
    if(sd.mode==='barricade')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},u)<=2&&!blocked(x,y))reachM[x+','+y]=1;
    if(sd.mode==='abtele'||sd.mode==='abcover')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},u)<=sr&&!blocked(x,y))reachM[x+','+y]=1}
  const W=BW(),H=BH(),P=(x,y)=>{const c=HC(x,y);return `left:${(c.cx-.5)*100/W}%;top:${(c.cy-HS)*100/H}%;width:${100/W}%;height:${2*HS*100/H}%`},D=(x,y)=>{const c=HC(x,y);return `data-cx="${c.cx}" data-cy="${c.cy}"`};
  const blindK=new Set(),frontK=new Set();sd.vl.forEach(o=>{if(o.v.down||o.v.hide)return;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p={x,y};if(inV(o.v,x,y)||dV(p,o.v)>3)continue;const sd2=sideOf(p,o.v);if(sd2==='rear')blindK.add(x+','+y);else if(sd2==='front')frontK.add(x+','+y)}});
  const blastK=new Set(),blast2K=new Set();(sd.bombs||[]).forEach(b=>hexesWithin(bombP(b),1).forEach(p=>(b.fuse<=1?blastK:blast2K).add(p.x+','+p.y)));
  const litM=litMap();let cells='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=x+','+y;const c=['cell'];if(litM[k])c.push('beam');if(blindK.has(k))c.push('blind');else if(frontK.has(k))c.push('front');if((sd.exits||[]).includes(k))c.push('exit');if(sd.obs.includes(k))c.push('obs');if(sd.walls&&sd.walls.some(w=>w.k===k))c.push('wall');if(sd.pits&&sd.pits.includes(k))c.push('pit');if(sd.haz&&sd.haz.some(h=>h.k===k))c.push('haz');if(blastK.has(k))c.push('blast');else if(blast2K.has(k))c.push('blast2');if(sd.vl.some(o=>o.v.charge&&o.v.charge.zone.includes(k)))c.push('tele');if(sd.firing&&sd.firing.includes(k))c.push('firing');if(k in reachM)c.push('reach');if(tg.has(k))c.push('tgt');if(al.has(k))c.push('ally');
    cells+=`<button class="${c.join(' ')}" data-cell="${k}" data-tip="cell:${x}:${y}" style="${P(x,y)}" aria-label="Hex ${x+1},${y+1}${(sd.exits||[]).includes(k)?', exit':''}${blindK.has(k)?', blind spot':frontK.has(k)?', front arc':''}${litM[k]?', lit beam':''}">${c.includes('wall')?wallArms(x,y):''}</button>`}
  if((sd.beams||[]).length)cells+=`<svg class="beams" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${sd.beams.map(b=>{const[ax0,ay0]=b.k0.split(',').map(Number),[zx,zy]=b.ks[b.ks.length-1].split(',').map(Number),p=HC(ax0,ay0),z=HC(zx,zy),ln=(w,col,op)=>`<line x1="${p.cx}" y1="${p.cy}" x2="${z.cx}" y2="${z.cy}" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`;return ln(.42,'#FF2D55',b.ttl>1?.22:.14)+ln(.2,'#FF2D55',b.ttl>1?.6:.4)+ln(.07,'#FFE3EA',.95)+`<line class="flow" x1="${p.cx}" y1="${p.cy}" x2="${z.cx}" y2="${z.cy}" stroke="#fff" stroke-width=".05" opacity=".9"/><circle cx="${p.cx}" cy="${p.cy}" r=".13" fill="#FF2D55" stroke="#fff" stroke-width=".04"/>`}).join('')}</svg>`;
  const hurt=o=>o.hurtAt&&Date.now()-o.hurtAt<450?'hurt':'';
  const FR={one:1.3,tri:2.2,diamond:2.5,big:3.4,serpent:1.3,swarm:1.3};
  const VT=[];sd.vl.forEach((o,i)=>{const v=o.v;if(v.down)return;const fc=sd.vl.length>1&&i===sd.vi?'focus':'';
    if(v.sw){swBodies(v).forEach(b=>VT.push([b.y,`<div class="vtok ${hurt(v)} ${fc}" data-tid="v${i}${b.i?'s'+b.i:''}" ${D(b.x,b.y)} style="${P(b.x,b.y)};${vSty(b.k)}">${vStandee(b.k,[{x:b.x,y:b.y}],null,b.i?0:v.level,b.x,b.y,1)}<span class="face" style="left:50%;top:50%;width:130%;--fa:${FACE_DEG[b.f??5]}deg" data-tip="kw:swarm"><i></i></span></div>`]));return}
    const a=HC(v.x,v.y),cc=vCtr(v),cs=vCells(v);
    VT.push([Math.max(...cs.map(c=>c.y)),`<div class="vtok ${hurt(v)} ${v.charge?'charging':''} ${fc}" data-tid="v${i}" ${D(v.x,v.y)} style="${P(v.x,v.y)};${vSty(o.key)}">${vStandee(o.key,v.body?[cs[0]]:cs,v.body?cs.slice(1):null,v.level,v.x,v.y,0,v.hide)}<span class="face${v.hide?' hid':''}" style="left:${(cc.cx-a.cx)*100+50}%;top:${(cc.cy-a.cy)*100/(2*HS)+50}%;width:${(FR[v.shape]||1.3)*100}%;--fa:${v.hide?0:FACE_DEG[v.face??5]}deg" data-tip="kw:${v.hide?'vhide':'facing'}">${v.hide?'<em>?</em>':'<i></i>'}</span></div>`])});
  let toks='';
  sd.vl.forEach(o=>{const v=o.v;if(v.down||!v.warn||!v.deck[0]||v.deck[0].uid!==v.warn)return;const cc=vCtr(v),lo=cc.cy<2.2,ext=(FR[v.shape]||1.3)/2;if(v.hush===v.warn)return;toks+=`<div class="shout ${lo?'below':''}" data-a="hush:${sd.vl.indexOf(o)}" role="button" aria-label="Dismiss shout" style="left:${cc.cx*100/W}%;top:${(cc.cy+(lo?ext:-.3))*100/H}%">“${esc(v.deck[0].shout)}”</div>`});
  (sd.exits||[]).forEach(k=>{const[x,y]=k.split(',').map(Number);if(sd.units.some(o=>!o.ko&&o.x===x&&o.y===y)||sd.civs.some(c=>c.x===x&&c.y===y))return;const h=HC(x,y);
    toks+=`<div class="tok exitt" ${D(x,y)} style="${P(x,y)}" data-tip="kw:exit">${miniSvg(x,y,MINI.exitA(h.cx,h.cy,y>=N-1?90:y===0?-90:x===0?180:0))}</div>`});
  if(sd.term){const p=termP(),h=HC(p.x,p.y);VT.push([p.y,`<div class="tok termt" ${D(p.x,p.y)} style="${P(p.x,p.y)}" data-tip="kw:terminal">${miniSvg(p.x,p.y,MINI.terminal(h.cx,h.cy))}</div>`])}
  (sd.bombs||[]).forEach(b=>{const p=bombP(b),h=HC(p.x,p.y);VT.push([p.y,`<div class="tok bombt" ${D(p.x,p.y)} style="${P(p.x,p.y)}">${miniSvg(p.x,p.y,MINI.bomb(h.cx,h.cy,b.fuse,b.fuse<=1))}</div>`])});
  sd.civs.forEach(c=>{const fu=c.f&&sd.units.find(o=>o.hid===c.f),held=civHeld(c),pz=!sd.busy&&!sd.result&&panicky(c),pn=c.panic&&Date.now()-c.panic<1200,h=HC(c.x,c.y);
    const ring=fu?BASE(heroOf(fu)).col:held?'#C92463':null,art=MINI.civArt(eyeHash(c.id),{panic:pz||held||pn});
    VT.push([c.y,`<div class="tok civt ${pn?'panic':''}" data-tid="c${c.id}" ${D(c.x,c.y)} style="${P(c.x,c.y)}" title="Civilian">${miniSvg(c.x,c.y,miniStand(h.cx,h.cy,art,'#F3CB4B',ring,.8,pz?miniBang:null,'crim'))}</div>`])});
  sd.hench.forEach(m=>{const h=HC(m.x,m.y),[b,a]=VART[m.owner]||VART.mole,art=(MINI.HF[m.owner]||MINI.HF.swarm)(b,a),el=m.elite;
    VT.push([m.y,`<div class="tok hmt ${hurt(m)}" data-tid="m${m.id}" ${el?'data-tip="kw:elite"':''} ${D(m.x,m.y)} style="${P(m.x,m.y)}">${miniSvg(m.x,m.y,miniStand(h.cx,h.cy,art,b,el?'#F3CB4B':null,el?.98:.86,miniNum(m.hp),'erim'))}</div>`])});
  /* standees overlap the hex above, so heroes and villains are drawn top rows first (villains by their lowest row) */
  sd.units.forEach((o,i)=>{const hh=heroOf(o),b=BASE(hh);const done=o.moved&&o.acted;
    VT.push([o.y+.1,`<div class="tok hst ${o.ko?'ko':''} ${sd.sel===i?'sel':''} ${done?'done':''} ${hurt(o)}" data-tid="h${o.hid}" ${D(o.x,o.y)} style="${P(o.x,o.y)}"><span class="st" title="${esc(hh.name)}">${standee(hh,o)}${o.guard?'<span class="gd"></span>':''}${hh.comp<=0&&!o.ko?'<span class="sh">!</span>':''}</span></div>`])});
  VT.sort((p,q)=>p[0]-q[0]).forEach(t=>toks+=t[1]);
  if(!FAST)hitTick(sd);const now=Date.now();(sd.fx||[]).forEach(f=>{const el=now-f.born;if(el>1600)return;
    toks+=`<div class="fx k-${f.k}" style="left:${f.cx*100/W}%;top:${f.cy*100/H}%;animation-delay:-${el}ms" aria-hidden="true"><div class="b"><span>${esc(f.t)}</span></div></div>`});
  const pipT=v.deck.length+v.discard.length+v.wounds.length;
  const vbar=`<div class="pips" aria-label="Playbook" data-tip="kw:pips">${v.deck.map(()=>'<span class="pip f"></span>').join('')}${v.discard.map(()=>'<span class="pip d"></span>').join('')}${v.wounds.map(()=>'<span class="pip w"></span>').join('')}</div>`;
  let ctrl,ctrlRest='';
  if(sd.result&&sd.patrol){ctrl=`<div class="cap"><b>Patrol cleared.</b> Both Diggers are down.</div><button class="btn pri" data-a="tut:hq">Head back to HQ</button>`}
  else if(sd.result){ctrl=`<div class="cap"><b>${sd.result==='win'?'Victory.':sd.result==='loss'?'Defeat.':'Escape.'}</b> Head back to HQ to count the cost.</div><button class="btn pri" data-a="debrief">Debrief</button>`}
  else if(sd.busy){ctrl=`<div class="cap">${sd.vturn?`${def.name} is acting…`:'Resolving…'}</div>`}
  else if(u&&h){const p=POWERS[BASE(h).power];const canAct=!u.acted&&!u.ko;const adjCiv=sd.civs.some(c=>c.f!==u.hid&&!civHeld(c)&&cheb(c,u)<=1),nFol=followers(u).length;
    const freeP=!!p.free;
    ctrl=`<div class="row between hrow"><div class="hwho">${eyesArt(h)}<div><h3>${esc(h.name)}</h3><div class="small muted hline"><span data-tip="kw:hp">${UI('hp')}${h.hp}/${stat(h,'maxHp')}</span> · <span data-tip="kw:comp">${UI('comp')}${h.comp}/${stat(h,'maxComp')}</span>${h.comp<=0?' · <b style="color:var(--magenta)" class="kwd" data-tip="kw:shaken">Shaken (−2 STR/ACC/EVA, −1 MOV)</b>':''}${u.dazed?' · <span class="kwd" data-tip="kw:dazed">Dazed</span>':''}</div></div></div>
      <span class="hst"><span class="${u.moved?'used':''}" title="${u.moved?'Moved':'Can move'}" aria-label="${u.moved?'Moved':'Can move'}">${UI('move')}</span><span class="${u.acted?'used':''}" title="${u.acted?'Acted':'Can act'}" aria-label="${u.acted?'Acted':'Can act'}">${UI('atk')}</span></span></div>
      <div class="row">
        <button class="btn sm sub ${sd.mode==='move'?'on':''}" data-a="mode:move" data-tip="act:move" ${u.moved?'disabled':''}>${UI('move')}Move<small>${stat(h,'move')+(u.boost||0)} hex${stat(h,'move')+(u.boost||0)===1?'':'es'}</small></button>
        <button class="btn sm sub ${sd.mode==='attack'?'on':''}" data-a="mode:attack" data-tip="act:attack" ${canAct?'':'disabled'}>${UI('atk')}Attack<small>Range ${stat(h,'range')}</small></button>
        ${combatMenus(u,h)}
      </div>
      ${combatInfo(u,h)}
      ${combatTargetHelp(u,h)?`<div class="cap combat-target-help">${esc(combatTargetHelp(u,h))}</div>`:''}`;
    ctrlRest=`
      <div class="resrow"><span class="r" style="--tc:var(--cyan)" data-tip="kw:comp">${UI('comp')} ${[...Array(stat(h,'maxComp'))].map((_,i)=>`<i class="${i<h.comp?'f':''}"></i>`).join('')} <b class="mono">${h.comp}/${stat(h,'maxComp')}</b></span></div>
      ${pwrMax(h)||arcMax(h)||potOf(h)?`<div class="resrow">${pwrMax(h)?`<span class="r t-tech" data-tip="res:tech">PWR ${[...Array(pwrMax(h))].map((_,i)=>`<i class="${i<u.res.tech?'f':''}"></i>`).join('')} <b class="mono">${u.res.tech}/${pwrMax(h)} · +${pwrRegen(h)}/rd</b></span>`:''}${arcMax(h)?`<span class="r t-magic" data-tip="res:magic">ARC ${[...Array(arcMax(h))].map((_,i)=>`<i class="${i<u.res.magic?'f':''}"></i>`).join('')} <b class="mono">${u.res.magic}/${arcMax(h)}</b></span>`:''}${potOf(h)?`<span class="r t-innate" data-tip="res:innate">POT <b class="mono">${potOf(h)}</b> · ${Math.max(0,innUses(h)-(u.innUsed||0))?'Innate ready':'Innate used'}</span>`:''}</div>`:''}
      ${(u.boost||u.buffDice||u.buffStr||u.ward||u.absorb||u.evaNext||u.buffAcc||u.buffBack||u.buffReap||u.dr||u.buffEva||u.avoidDamage||u.anchor)?`<div class="row">${u.boost?`<span class="tag g" data-tip="kw:boost">+${u.boost} next move${u.boostJump?' (jump)':''}</span>`:''}${u.buffDice?`<span class="tag g" data-tip="kw:buff">+${u.buffDice} dice next attack</span>`:''}${u.buffStr?`<span class="tag g" data-tip="kw:buff">+${u.buffStr} Strength next attack</span>`:''}${u.ward?'<span class="tag g" data-tip="kw:warded">Warded</span>':''}${u.absorb?`<span class="tag g" data-tip="kw:absorb">Shield: absorbs ${u.absorb}</span>`:''}${u.buffAcc?`<span class="tag g" data-tip="kw:buff">+${u.buffAcc} accuracy next attack</span>`:''}${u.buffBack?`<span class="tag g" data-tip="kw:buff">+${u.buffBack} dice on a melee attack from a side or the rear</span>`:''}${u.buffReap?`<span class="tag g" data-tip="kw:buff">Reap ${u.buffReap} per page</span>`:''}${u.dr?`<span class="tag g" data-tip="kw:guard">Guard −${u.dr} per hit</span>`:''}${u.buffEva?`<span class="tag g" data-tip="kw:guard">+${u.buffEva} evasion</span>`:''}${u.avoidDamage?`<span class="tag g" data-tip="kw:guard">Avoid Damage +${avoidEva(u)} evasion</span>`:''}${u.evaNext?`<span class="tag g" data-tip="kw:windward">Wind Ward +${u.evaNext} evasion</span>`:''}${u.anchor?'<span class="tag g" data-tip="kw:anchor">Anchored</span>':''}</div>`:''}
      ${auraTags(u)}${u.ripo||(gearHas(h,'relent')&&u.relN&&u.relKey===sd.vkey)?`<div class="row">${u.ripo?'<span class="tag g" data-tip="kw:riposte">Riposte ready</span>':''}${gearHas(h,'relent')&&u.relN&&u.relKey===sd.vkey?`<span class="tag g" data-tip="kw:relent">Relentless +${Math.min(1,u.relN)} vs ${VILLAINS[sd.vkey].short}</span>`:''}</div>`:''}
      ${sd.mode==='rallySpirit'&&canAct?`<div class="cap">Rally Spirit: tap yourself or an ally within ${lvlOf(h)} hexes to restore 3 composure. Uses your action.</div>`:''}
      ${(sd.mode==='attack'||sd.mode==='arc')&&canAct&&!tg.size?`<div class="cap">Nothing in range. ${esc(h.name)} reaches ${stat(h,'range')} hex${stat(h,'range')===1?'':'es'}${stat(h,'range')===1?', so they must stand next to the target':''}, and walls, rubble and other units block shots. Move first, then attack.</div>`:''}
      <div class="eyebrow">Character sheet</div>${heroCard(h,'fight')}`}
  else ctrl=`<div class="small muted">Tap a hero to select them. Each hero can move once and take one action per round. Long-press any hex to see what is on it, or any button, stat or keyword for details.</div>`;
  const last=(v.last?`<div class="cap"><b>${esc(v.last.n)}.</b> ${esc(v.last.txt)}</div>`:'')+
    (sd.v.foresee?`<div class="cap t-magic" style="border-color:var(--tc)"><b>Foreseen next card:</b> ${v.deck.length?`${esc(v.deck[0].n)}. ${esc(v.deck[0].txt)}`:'The playbook will be reshuffled first.'}</div>`:'')+
    sd.vl.filter(o=>!o.v.down&&o.v.warn&&o.v.deck[0]&&o.v.deck[0].uid===o.v.warn).map(o=>`<div class="cap warn" data-tip="kw:sigmove"><b>${VILLAINS[o.key].short} shouts: “${esc(o.v.deck[0].shout)}”</b> A Signature Move is next. Tear a page before the villain acts to rip it out.</div>`).join('')+
    sd.vl.filter(o=>o.v.charge&&!o.v.down).map(o=>`<div class="cap charge" data-tip="kw:charge"><b>${VILLAINS[o.key].short} is charging ${esc(o.v.charge.n)}.</b> Fires for ${o.v.charge.dmg} on the marked hexes next villain turn instead of a new page. Torn since: ${o.v.wounds.length-o.v.charge.w0} of ${o.v.charge.need||2} needed to stagger it.</div>`).join('')+
    ((sd.bombs||[]).length?`<div class="cap charge" data-tip="kw:bomb"><b>${sd.bombs.length} lit bomb${sd.bombs.length>1?'s':''} on the board.</b> ${sd.bombs.some(b=>b.fuse<=1)?'Hexes striped red blow at the start of the next villain turn, so get 2 hexes clear of the bomb.':'The numbers count down each villain turn.'}</div>`:'')+
    (v.marked?'<div class="small"><span class="disc t-innate" data-tip="kw:marked">Marked: +1 die on side and rear attacks this round</span></div>':'')+(v.cursed?'<div class="small"><span class="disc t-magic" data-tip="kw:cursed">Cursed: −2 damage this round</span></div>':'')+
    (sd.v.hex?'<div class="small"><span class="disc t-magic" data-tip="kw:hexed">Hexed: −${hexA(sd.v.hex)} evasion this round</span></div>':'')+(v.skip?'<div class="small"><span class="disc t-magic" data-tip="kw:frozen">Time Stop: loses its next turn</span></div>':'')+(v.blind?'<div class="small"><span class="disc t-tech" data-tip="kw:blinded">Blinded: −4 accuracy this round</span></div>':'')+(v.excise?'<div class="small"><span class="disc t-tech" data-tip="kw:excise">Find the Flaw: you pick the next page torn this round</span></div>':'')+(v.callout?`<div class="small"><span class="disc t-tech" data-tip="kw:callout">Called out: +${v.callout} dice on the next hero attack</span></div>`:'');
  return `<div class="sdl"><section class="panel sdp">
    <div class="bhd">    <div class="row between"><div>${sd.patrol?`<div class="eyebrow">Patrol · Round ${sd.round}</div><h2>Subway platform</h2>`:`<div class="eyebrow">${sd.finale?'Event comic':'Lair showdown'} · Round ${Math.max(1,sd.round)} · <span class="kwd" data-tip="kw:q_${sd.quality}">${QUAL[sd.quality].n}</span></div><h2>${sd.finale&&S.event?esc(S.event.title):def.name}</h2>`}</div>
    <span class="small mono" data-tip="kw:evac">Evac ${sd.evac} · Harmed ${sd.harmed}</span></div>
    ${sd.vl.length>1?`<div class="row vswitch"><span class="eyebrow">Target</span>${sd.vl.map((o,i)=>`<button class="btn sm ${i===sd.vi?'on':''}" data-a="focus:${i}" ${o.v.down?'disabled':''} style="${vSty(o.key)}">${vIc(o.key)}${VILLAINS[o.key].short} · ${o.v.down?'down':`${o.v.deck.length+o.v.discard.length} pages`}</button>`).join('')}</div>`:''}
    ${sd.patrol?'':`<div class="row between small"><span>${sd.vl.length>1?`<b>${VILLAINS[sd.vkey].short}</b> · `:''}<span class="kwd" data-tip="kw:playbook">Playbook</span> <b class="mono">${v.deck.length}</b> · <span class="kwd" data-tip="kw:discard">Discard</span> <b class="mono">${v.discard.length}</b> · <span class="kwd" data-tip="kw:wound">Torn</span> <b class="mono">${v.wounds.length}</b> of ${pipT}</span><button class="btn sm" data-a="book:${sd.vkey}">Read playbook</button></div>
    ${vbar}${last}`}</div>
    <div class="bcol"><div class="boardwrap"><div class="board${lairCls()}${Date.now()-SHK<320?' shk':''}" style="aspect-ratio:${W}/${H};animation-delay:-${Math.min(320,Date.now()-SHK)}ms">${cells}${lairCls()?'<div class="amb"></div>':''}${vZones(W,H)}${toks}</div></div>
    ${coll('legend','<span class="eyebrow">Board key</span>',`<div class="legend"><span data-tip="kw:civilian"><span class="vic" style="--vc:var(--yellow)">${IC('civ')}</span>Civilian</span><span data-tip="kw:exit"><i class="sw" style="background:color-mix(in srgb,var(--good) 32%,var(--panel));border:1.5px solid var(--good)"></i>Exit</span><span data-tip="kw:henchman"><span class="vic" style="${vSty(sd.vkey)};border-radius:25%">${mIc(sd.vkey)}</span>Henchman (HP)</span><span data-tip="kw:rubble"><span class="vic" style="--vc:var(--line)">${IC('rubble')}</span>Rubble</span><span data-tip="kw:walls"><i class="sw" style="background:#7A5A48"></i>Wall</span><span data-tip="kw:pit"><i class="sw" style="background:radial-gradient(#030407 40%,#3A404D)"></i>Pit</span><span data-tip="kw:haz"><i class="sw" style="background:#F08A4B"></i>Molten</span><span data-tip="kw:charge"><i class="sw" style="background:repeating-linear-gradient(45deg,#F3CB4B 0 3px,transparent 3px 6px)"></i>Charge zone</span><span data-tip="kw:terminal"><span class="vic" style="--vc:var(--cyan)">${UI('intel')}</span>Evidence terminal</span><span data-tip="kw:bomb"><span class="vic" style="--vc:#FFD27A">${IC('bomb')}</span>Bomb (fuse)</span><span data-tip="kw:braced"><i class="sw" style="background:var(--yellow);transform:rotate(45deg);width:9px;height:9px"></i>Braced</span><span data-tip="kw:facing"><i class="sw" style="width:0;height:0;border:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:10px solid var(--yellow)"></i>Facing</span><span data-tip="kw:blind"><i class="sw" style="background:color-mix(in srgb,var(--ink) 18%,var(--panel))"></i>Blind spot</span><span data-tip="kw:facearc"><i class="sw" style="background:color-mix(in srgb,var(--magenta) 22%,var(--panel))"></i>Front arc</span></div>`,false,'nested')}</div>
    <div class="bact">${ctrl}${!sd.result&&!sd.busy?`<button class="btn pri" data-a="endround">End round</button>`:''}</div>
    <div class="brest">${ctrlRest}</div>
  </section>
  <section class="panel sdlog">${coll('sd-log','<div class="eyebrow">Combat log</div>',`<div class="log">${sd.log.slice().reverse().map(l=>`<p class="${l.k}">${esc(l.t)}</p>`).join('')}</div>`)}</section></div>`}

function abOk(u,h,k){const g=GEAR[k],a=g&&g.ab,sd=S.sd;if(!a||u.ko)return false;const f=a.fx||{};
  if(g.cons){if(!pouchOf(h).includes(k))return false}else if(g.type!=='innate'&&(u.abUsed||[]).includes(k))return false;else if(g.type==='innate'){if(potOf(h)<a.min||!innOk(u,h))return false}else if((u.res[g.type]||0)<a.c)return false;
  if(a.act&&u.acted)return false;if(f.move&&!u.moved)return false;if(f.boost&&u.boost)return false;if(f.again&&!u.acted)return false;
  if(f.eclipse&&!sd.vl.some(o=>o.v.charge&&!o.v.down))return false;if(f.mark&&u.markUsed)return false;
  if((f.tear||f.skip||f.hex||f.curse||f.face||f.foresee||f.mark||f.callout||f.blind||f.scry||f.bury||f.excise||f.scramble||f.vsplash)&&sd.v.down)return false;
  if(f.gain&&(u.res.magic||0)>=arcMax(h))return false;if(f.gainP&&(u.res.tech||0)>=pwrMax(h))return false;
  return true}


/* Combat menus: selecting a choice is informational; only explicit confirmation
   may activate a power, consume resources or start board targeting. */
function combatMenu(kind){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||sd.busy||sd.result||!['abilities','other'].includes(kind))return;
  sd.combatMenuOpen=sd.combatMenuOpen===kind?null:kind;
  /* Updating only the menu avoids replacing the clicked button while the
     browser is still processing the pointer event. Later renders use state. */
  document.querySelectorAll('#app .combat-dropdown').forEach(d=>{
    const which=d.classList.contains('abilities-dropdown')?'abilities':'other',open=sd.combatMenuOpen===which;
    d.querySelector('.combat-menu-toggle').setAttribute('aria-expanded',String(open));
    d.querySelector('.combat-dropdown-menu').hidden=!open;
  });
}
function combatPick(kind,key){
  const sd=S.sd,u=sd&&sd.units[sd.sel];
  if(!u||sd.busy||sd.result)return;
  const h=heroOf(u),keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
  if(kind==='ability'&&key!=='power'&&(!keys.includes(key)||!GEAR[key]||!GEAR[key].ab))return;
  if(kind==='other'&&!['escort','hack','avoidDamage','rallySpirit','letgo'].includes(key))return;
  if(kind!=='ability'&&kind!=='other')return;
  sd.combatPick={hid:u.hid,kind,key};
  sd.combatMenuOpen=null;
  sd.mode=null;
  render();
}
function combatClear(){
  const sd=S.sd;if(!sd||sd.busy)return;sd.combatPick=null;sd.combatMenuOpen=null;render();
}
/* Icons show what using the action consumes, not what its resource cost is.
   A future move-cost ability can mark itself with moveAct. */
const combatCostIcon=kind=>kind==='action'?UI('atk'):kind==='move'?UI('move'):'⚡';
function combatInfo(u,h){
  const sd=S.sd,c=sd.combatPick;
  if(!c||c.hid!==u.hid)return '';
  let name='',description='',cost='',ok=false,tip='';
  if(c.kind==='ability'){
    if(c.key==='power'){
      const pw=BASE(h).power,p=POWERS[pw];if(!p)return '';
      name=p.name;description=p.txt;cost=powCost(pw);ok=powOk(u,h);
      tip=['arc','patch','barricade'].includes(pw)?'Confirm, then choose a target on the board.':'Confirm to activate.';
    }else{
      const keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
      if(!keys.includes(c.key)||!GEAR[c.key]||!GEAR[c.key].ab)return '';
      const g=GEAR[c.key],a=g.ab;
      name=a.n;cost=abCost(g);description='From '+g.name+'. '+abTxt(a,g.type==='innate'?potOf(h):null);
      ok=abOk(u,h,c.key);
      tip=a.mode?'Confirm, then select a target on the board.':'Confirm to activate.';
    }
  }else{
    switch(c.key){
      case 'escort':
        name='Escort';description='Gather adjacent civilians to follow this hero to an exit. Uses an action unless you have a free Escort.';
        ok=(!u.acted||u.freeEvac)&&sd.civs.some(v=>v.f!==u.hid&&!civHeld(v)&&cheb(v,u)<=1);
        tip='Requires an adjacent civilian.';break;
      case 'hack':
        name='Hack';description='Download evidence from an adjacent terminal, gaining '+TERM_INTEL+' intel. Uses your action.';
        ok=canHack(u);tip='Requires an intact terminal within 1 hex.';break;
      case 'avoidDamage':
        name='Avoid Damage';description='Spend an action for +3 Evasion until your next turn (+5 if adjacent to safe walls, rubble, heroes, civilians or terminals). On a miss, a suitable cover tile in the attack path can be hit instead.';
        ok=!u.acted&&!u.ko&&!u.avoidDamage;
        tip='Current cover provides +'+(avoidCover(u).length?5:3)+' Evasion.';break;
      case 'rallySpirit':
        name='Rally Spirit';description='Spend an action to restore up to 3 Composure to yourself or a conscious ally within '+lvlOf(h)+' hexes.';
        ok=!u.acted&&!u.ko;tip='Confirm, then tap yourself or an ally.';break;
      case 'letgo':
        name='Let Go';description='Release the civilians currently following this hero. Does not use an action.';
        ok=followers(u).length>0;tip=followers(u).length+' civilians currently following.';break;
      default:return '';
    }
  }
  return `<section class="combat-choice" aria-label="Selected combat action">
    <div class="eyebrow">${c.kind==='ability'?'Ability details':'Action details'}</div>
    <div class="row between"><strong>${esc(name)}</strong>${cost?`<span class="small mono">${esc(cost)}</span>`:''}</div>
    <p class="small" style="margin:0">${esc(description)}</p>
    <p class="small muted" style="margin:0">${esc(tip)}</p>
    <div class="row">
      <button class="btn pri combat-confirm" type="button" data-a="combatUse" ${ok?'':'disabled'}>${c.kind==='ability'?'Activate ability':'Use action'}</button>
      <button class="btn sm" type="button" data-a="combatClear">Cancel</button>
    </div>
    ${ok?'':'<span class="small muted">Unavailable right now.</span>'}
  </section>`;
}
function combatUse(){
  const sd=S.sd,u=sd&&sd.units[sd.sel],c=sd&&sd.combatPick;
  if(!u||!c||c.hid!==u.hid||sd.busy||sd.result)return;
  const h=heroOf(u),key=c.key;
  if(c.kind==='ability'){
    if(key==='power'){
      if(!powOk(u,h))return;
      sd.combatPick=null;return usePower();
    }
    const keys=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))];
    if(!keys.includes(key)||!GEAR[key]||!GEAR[key].ab||!abOk(u,h,key))return;
    sd.combatPick=null;return useAb(key);
  }
  if(c.kind!=='other')return;
  switch(key){
    case 'escort':
      if((!u.acted||u.freeEvac)&&sd.civs.some(v=>v.f!==u.hid&&!civHeld(v)&&cheb(v,u)<=1)){sd.combatPick=null;return escort()}break;
    case 'hack':
      if(canHack(u)){sd.combatPick=null;return hack()}break;
    case 'avoidDamage':
      if(!u.acted&&!u.ko&&!u.avoidDamage){sd.combatPick=null;return avoidDamage()}break;
    case 'rallySpirit':
      if(!u.acted&&!u.ko){sd.combatPick=null;return rallySpirit()}break;
    case 'letgo':
      if(followers(u).length){letGo(u,'lets the civilians go.');sd.combatPick=null;render()}break;
  }
}
function combatMenus(u,h){
  const sd=S.sd,pw=BASE(h).power,p=POWERS[pw],gear=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))].filter(k=>GEAR[k]&&GEAR[k].ab);
  const choice=(kind,key,label,detail,costKind)=>`<button type="button" class="btn sm combat-option ${sd.combatPick&&sd.combatPick.hid===u.hid&&sd.combatPick.kind===kind&&sd.combatPick.key===key?'on':''}" data-a="combatPick:${kind}:${key}"><span class="combat-cost-icon" aria-label="${costKind==='action'?'Uses action':costKind==='move'?'Uses move':'Free action'}" title="${costKind==='action'?'Uses action':costKind==='move'?'Uses move':'Free action'}">${combatCostIcon(costKind)}</span><span class="combat-option-text">${esc(label)}${detail?`<small>${esc(detail)}</small>`:''}</span></button>`;
  const abilities=`<div class="combat-dropdown abilities-dropdown"><button type="button" class="btn sm combat-menu-toggle" data-a="combatMenu:abilities" aria-expanded="${sd.combatMenuOpen==='abilities'}" aria-controls="combat-abilities-menu">Abilities ▾</button>
    <div id="combat-abilities-menu" class="combat-dropdown-menu abilities-menu" ${sd.combatMenuOpen==='abilities'?'':'hidden'}>
      ${choice('ability','power',p.name,'Primary · '+powCost(pw,true),p.free?'free':'action')}
      ${gear.map(k=>{const g=GEAR[k],a=g.ab;return choice('ability',k,a.n,g.name+' · '+abCost(g,true),a.act?'action':a.moveAct?'move':'free')}).join('')}
    </div></div>`;
  const nFol=followers(u).length;
  const others=`<div class="combat-dropdown other-actions"><button type="button" class="btn sm combat-menu-toggle" data-a="combatMenu:other" aria-expanded="${sd.combatMenuOpen==='other'}" aria-controls="combat-other-menu">Other Actions ▾</button>
    <div id="combat-other-menu" class="combat-dropdown-menu other-actions-menu" ${sd.combatMenuOpen==='other'?'':'hidden'}>
      ${choice('other','escort','Escort','Gather civilians',u.freeEvac?'free':'action')}
      ${sd.term?choice('other','hack','Hack','Evidence terminal','action'):''}
      ${choice('other','avoidDamage','Avoid Damage','+3 Evasion · +5 by cover','action')}
      ${choice('other','rallySpirit','Rally Spirit','Range '+lvlOf(h)+' · +3 Composure','action')}
      ${nFol?choice('other','letgo','Let Go','Following '+nFol,'free'):''}
    </div></div>`;
  return abilities+others;
}
function combatTargetHelp(u,h){
  const sd=S.sd,m=sd.mode;
  if(m==='rallySpirit')return 'Rally Spirit: tap yourself or an ally within '+lvlOf(h)+' hexes.';
  if(m==='patch')return 'Patch Up: tap yourself or an ally within 3 hexes.';
  if(m==='barricade')return 'Barricade: tap an empty tile within 2 hexes.';
  if(m==='arc')return 'Arc Burst: tap an enemy within attack range.';
  if(m&&m.startsWith('ab')&&sd.abKey&&GEAR[sd.abKey]&&GEAR[sd.abKey].ab){
    const a=GEAR[sd.abKey].ab;
    return a.n+': '+(a.mode==='ally'?'tap yourself or a nearby ally.':a.mode==='strike'?'tap a villain in range.':'tap an empty tile in range.');
  }
  return '';
}
function abButtons(u,h){const ks=[...new Set(Object.values(h.gear)),...new Set(pouchOf(h))].filter(g=>GEAR[g].ab);if(!ks.length)return '';const P=potOf(h);
  return `<div class="row">${ks.map(k=>{const g=GEAR[k],a=g.ab,ok=abOk(u,h,k),low=g.type==='innate'&&P<a.min,on=S.sd.abKey===k&&S.sd.mode&&S.sd.mode.startsWith('ab');
    return `<button class="btn sm abtn t-${g.type} ${on?'on':''}" data-a="ab:${k}" data-tip="gear:${k}" ${ok?'':'disabled'} title="${esc(low?`Requires Innate rank ${a.min}. ${abTxt(a)}`:abTxt(a,g.type==='innate'?P:null))}">${a.n}<small>${abCost(g,true)}</small></button>`}).join('')}</div>`}

async function act(fn){const sd=S.sd;if(sd.busy)return;sd.busy=true;const keepSel=sd.sel;sd.mode=null;render();
  try{await fn()}finally{if(S.sd===sd){sd.busy=false;if(!sd.result)sd.units.forEach(civFollow);checkLoss();if(sd.sel==null&&!sd.result)sd.sel=keepSel;if(sd.thenMode&&!sd.result){sd.mode=sd.thenMode}sd.thenMode=null;render()}}}
function usePower(){const sd=S.sd,u=sd.units[sd.sel],h=heroOf(u),pw=BASE(h).power,P=POWERS[pw];if(!powOk(u,h)&&sd.mode!==pw)return;
  const glow=BASE(h).glow;
  if(pw==='overclock')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),glow,2.2,{inward:true,count:2});u.buffDice+=1;u.buffAcc=(u.buffAcc||0)+2;fxU(u,'OVERCLOCK!','good');log('hero',`${h.name} overclocks: +1 die and +2 accuracy on the next attack.`)});
  if(pw==='drone')return act(async()=>{payPow(u,h);const hm=sd.hench.filter(m=>cheb(m,u)<=3);await Promise.all(hm.map(m=>A.shot(ctrU(u),ctrU(m),glow)));
    hm.forEach(m=>{m.hp-=2;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);if(!hm.length)fxU(u,'NO TARGETS','miss');log('hero',`${h.name}'s drone zaps ${hm.length} henchm${hm.length===1?'an':'en'}.`)});
  if(pw==='emp'){if(dV(u,sd.v)>3){fxU(u,'TOO FAR','miss');render();return}
    return act(async()=>{payPow(u,h);await A.ring(ctrV(),glow,3,{count:2});sd.v.hex=true;fxV('EMP!','good');log('hero',`${h.name}'s EMP scrambles ${VILLAINS[sd.vkey].name}: −4 evasion this round.`)})}
  if(pw==='regen')return act(async()=>{payPow(u,h);await A.heal(ctrU(u),COL.heal);const n=Math.max(1,potOf(h));h.hp=Math.min(stat(h,'maxHp'),h.hp+n);fxU(u,`+${n} HP`,'good');log('hero',`${h.name} regenerates ${n} health.`)});
  if(pw==='berserk')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),glow,2.4,{inward:true,count:2});u.buffDice+=1;u.buffStr+=4;fxU(u,'RAAARGH!','good');log('hero',`${h.name} goes berserk: +1 die and +4 Strength on the next attack.`)});
  if(pw==='leap')return act(async()=>{payPow(u,h);await A.smoke(ctrU(u),5);u.boost=(u.boost||0)+2;u.boostJump=true;fxU(u,'BOUND!','good');log('hero',`${h.name} gathers for a leap: +2 to the next move, and it is a jump.`);if(!u.moved)sd.thenMode="move"});
  if(pw==='aegis')return act(async()=>{payPow(u,h);const al=live().filter(o=>o!==u&&cheb(o,u)<=3).sort((a,b)=>(heroOf(a).hp/stat(heroOf(a),'maxHp'))-(heroOf(b).hp/stat(heroOf(b),'maxHp')))[0];
    u.absorb=Math.max(u.absorb||0,3);await A.shield(ctrU(u),COL.magic,true);if(al){al.absorb=Math.max(al.absorb||0,3);await A.shield(ctrU(al),COL.magic,true);fxU(al,'AEGIS!','good')}fxU(u,'AEGIS!','good');log('hero',`${h.name} raises an aegis${al?` over themselves and ${heroOf(al).name}`:''}: the next 3 damage is absorbed.`)});
  if(pw==='drain'){if(dV(u,sd.v)>4){fxU(u,'TOO FAR','miss');render();return}
    return act(async()=>{u.acted=true;payPow(u,h);const w0=sd.woundsBy[h.id]||0;await heroAttack(u,'v',0,0,'bolt');const w=(sd.woundsBy[h.id]||0)-w0;
      if(w&&!u.ko){h.hp=Math.min(stat(h,'maxHp'),h.hp+w);await A.heal(ctrU(u),COL.magic);fxU(u,`+${w} HP`,'good');log('hero',`${h.name} drains ${w} health.`)}})}
  if(pw==='serene')return act(async()=>{payPow(u,h);await A.ring(ctrU(u),COL.cyan,5,{count:2});live().forEach(o=>{const t=heroOf(o);t.comp=Math.min(stat(t,'maxComp'),t.comp+2)});fxU(u,'BREATHE…','say');log('hero',`${h.name} steadies the team: +2 composure each.`)});
  if(pw==='brace')return act(async()=>{u.guard=true;payPow(u,h);await A.shield(ctrU(u),COL.yel,true);fxU(u,'BRACE!','good');log('hero',`${h.name} braces to protect nearby allies.`)});
  if(pw==='blur')return act(async()=>{await A.sparkle(ctrU(u),BASE(h).glow);u.buffEva=(u.buffEva||0)+2;u.freeEvac=true;payPow(u,h);fxU(u,'ZOOM!','good');log('hero',`${h.name} blurs: +2 evasion this round.`)});
  if(pw==='mark')return act(async()=>{sd.v.marked=true;u.markUsed=true;payPow(u,h);await A.reticle(ctrV(),BASE(h).glow);fxV('MARKED!','good');log('hero',`${h.name} marks ${VILLAINS[sd.vkey].name}: +1 die on every attack against it from a side or the rear this round.`)});
  if(pw==='omen')return act(async()=>{payPow(u,h);await A.sigil(ctrV(),BASE(h).glow,2);sd.v.foresee=true;if(sd.v.deck.length)markSeen(sd.vkey,sd.v.deck[0].id);live().forEach(o=>{const t=heroOf(o);t.comp=Math.min(stat(t,'maxComp'),t.comp+1)});fxU(u,'I FORESEE…','say');log('hero',`${h.name} reads the omens.`)});
  if(pw==='quake')return act(async()=>{payPow(u,h);A.lunge('h'+u.hid,ctrU(u));await A.ring(ctrU(u),BASE(h).glow,3.2,{count:2});
    const hm=sd.hench.filter(m=>cheb(m,u)<=1),qd=Math.max(1,potOf(h)),qh=Math.max(1,Math.ceil(qd/2));hm.forEach(m=>{m.hp-=qh;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'THOOM!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);
    const keep=sd.vi;for(let i=0;i<sd.vl.length;i++){if(sd.vl[i].v.down||dV(u,sd.vl[i].v)>1)continue;focusV(i);if(VILLAINS[sd.vkey].rooted){fxV('BOLTED DOWN!','miss');log('hero',`${VILLAINS[sd.vkey].short} is bolted to the floor and can't be shoved.`);continue}const vz=VSIZE[sd.v.shape]||1;if(vz>qd){fxV('UNMOVED!','miss');log('hero',`${VILLAINS[sd.vkey].short} is size ${vz}, too big to shove at Innate rank ${qd}.`);continue}await vMove(()=>vAway(u,1,{strict:true}));fxV('SHOVED!','hit')}focusV(keep);
    log('hero',`${h.name} quakes the ground${hm.length?`, flattening ${hm.length} henchm${hm.length===1?'an':'en'}`:''}.`)});
  if(pw==='curse'){if(dV(u,sd.v)>4){fxU(u,'TOO FAR','miss');render();return}
    return act(async()=>{payPow(u,h);await A.bolt(ctrU(u),ctrV(),BASE(h).glow,true);await A.sigil(ctrV(),BASE(h).glow,2.6);sd.v.cursed=true;fxV('CURSED!','good');log('hero',`${h.name} curses ${VILLAINS[sd.vkey].name}: its attacks deal 2 less damage this round (never below 1).`)})}
  sd.mode=sd.mode===pw?null:pw;render()}
function payAb(u,k){const g=GEAR[k];u.abRd=true;if(!g.cons&&g.type!=='innate')(u.abUsed=u.abUsed||[]).push(k);if(g.cons){const p=pouchOf(heroOf(u)),i=p.indexOf(k);if(i>=0)p.splice(i,1);return}if(g.type==='innate'){if(u.innUsed)u.capUsed=true;u.innUsed=(u.innUsed||0)+1}else u.res[g.type]-=g.ab.c}
function useAb(k){const sd=S.sd,u=sd.units[sd.sel],h=u&&heroOf(u),g=GEAR[k],a=g&&g.ab;if(!u||!a||!abOk(u,h,k))return;
  if(a.mode){const m='ab'+a.mode;sd.mode=sd.mode===m&&sd.abKey===k?null:m;sd.abKey=k;render();return}
  return act(async()=>{payAb(u,k);log('hero',`${h.name} uses ${a.n} (${abCost(g)}).`);await abApply(u,h,g,u)})}
/* resolves an ability's effects; tu is the chosen ally for mode 'ally' (otherwise the user) */
async function abApply(u,h,g,tu){const sd=S.sd,a=g.ab,f=pairFx(h,g),P=potOf(h),v=x=>abV(x,P),col=COL[g.type],th=heroOf(tu);
  if(f.evaNext){const n=v(f.evaNext);await A.shield(ctrU(tu),COL.cyan,true);tu.evaNext=(tu.evaNext||0)+n;fxU(tu,'WHOOSH!','good');log('hero',`Wind wraps ${th.name}: +${n} evasion against the next attack.`)}
  if(f.ward){await A.shield(ctrU(tu),COL.magic,true);tu.ward=true;fxU(tu,'WARD!','good')}
  if(f.heal){const n=v(f.heal);await A.heal(ctrU(tu),COL.heal);th.hp=Math.min(stat(th,'maxHp'),th.hp+n);fxU(tu,`+${n} HP`,'good');log('hero',`${th.name} regains ${n} health.`)}
  if(f.comp){const n=v(f.comp);await A.heal(ctrU(u),COL.cyan);h.comp=Math.min(stat(h,'maxComp'),h.comp+n);fxU(u,'FOCUS!','good')}
  if(f.absorb){const n=v(f.absorb);tu.absorb=Math.max(tu.absorb||0,n);await A.shield(ctrU(tu),col,true);fxU(tu,'SHELL!','good');log('hero',`${th.name} gains a shield that absorbs ${n} damage.`)}
  if(f.dr){const n=v(f.dr);u.dr=(u.dr||0)+n;await A.shield(ctrU(u),col);fxU(u,'GUARD!','good');log('hero',`${h.name} takes ${n} less damage per hit this round.`)}
  if(f.drAll){const n=v(f.drAll);await A.ring(ctrU(u),col,2.4,{count:2});live().filter(o=>cheb(o,u)<=1).forEach(o=>{o.dr=(o.dr||0)+n;fxU(o,'BRACED!','good')})}
  if(f.eva){u.buffEva=(u.buffEva||0)+v(f.eva);fxU(u,'DODGE!','good')}
  if(f.anchor)u.anchor=true;
  if(f.breach){const adj=[];for(const n of nbrs(u)){const k=n.x+','+n.y;if(sd.walls.some(w=>w.k===k)||sd.obs.includes(k))adj.push(k)}
    await Promise.all(adj.map(k=>{const[x,y]=k.split(',').map(Number);return A.smoke(HC(x,y),4)}));sd.walls=sd.walls.filter(w=>!adj.includes(w.k));sd.obs=sd.obs.filter(k=>!adj.includes(k));fxU(u,adj.length?'KRUNCH!':'THUNK.','hit')}
  if(f.shove){const keep=sd.vi;for(let i=0;i<sd.vl.length;i++){if(sd.vl[i].v.down||dV(u,sd.vl[i].v)>1)continue;focusV(i);if(VILLAINS[sd.vkey].rooted){fxV('BOLTED DOWN!','miss');log('hero',`${VILLAINS[sd.vkey].short} is bolted to the floor and can't be shoved.`);continue}const vz=VSIZE[sd.v.shape]||1;if(vz>P){fxV('UNMOVED!','miss');log('hero',`${VILLAINS[sd.vkey].short} is size ${vz}, too big to shove at Innate rank ${P}.`);continue}await vMove(()=>vAway(u,1,{strict:true}));fxV('SHOVED!','hit');log('hero',`${h.name} shoves ${VILLAINS[sd.vkey].short} back.`)}focusV(keep)}
  if(f.dice||f.str||f.acc||f.back){const d=f.dice?v(f.dice):0,st=f.str?v(f.str):0,ac=f.acc?v(f.acc):0,bk=f.back?v(f.back):0;u.buffDice+=d;u.buffStr+=st;u.buffAcc=(u.buffAcc||0)+ac;u.buffBack=(u.buffBack||0)+bk;
    if(!f.move&&a.mode!=='tele'){await A.ring(ctrU(u),col,2.2,{inward:true,count:2});fxU(u,pick(['VRRRM!','RAAAH!','POWER UP!']),'good')}
    log('hero',`${h.name}'s next attack: ${[d&&`+${d} ${d===1?'die':'dice'}`,ac&&`${ac<0?'−'+(-ac):'+'+ac} accuracy`,st&&`+${st} Strength`,bk&&`+${bk} more on a melee attack from a side or the rear`].filter(Boolean).join(', ')}.`)}
  if(f.reap)u.buffReap=(u.buffReap||0)+v(f.reap);
  if(f.rally){const n=v(f.rally);await A.ring(ctrU(u),COL.cyan,5,{count:2});live().filter(o=>cheb(o,u)<=2).forEach(o=>{const t=heroOf(o);t.comp=Math.min(stat(t,'maxComp'),t.comp+n);fxU(o,'STEADY!','good')})}
  if(f.gain){u.res.magic=Math.min(arcMax(h),(u.res.magic||0)+v(f.gain));await A.sparkle(ctrU(u),COL.magic);fxU(u,'+ARCANA','good')}if(f.gainP){u.res.tech=Math.min(pwrMax(h),(u.res.tech||0)+v(f.gainP));await A.sparkle(ctrU(u),COL.tech);fxU(u,'+POWER','good')}
  if(f.callout){sd.v.callout=(sd.v.callout||0)+v(f.callout);await A.reticle(ctrV(),col);fxV('CALLED OUT!','good')}
  if(f.mark){sd.v.marked=true;u.markUsed=true;await A.reticle(ctrV(),col);fxV('TARGETED!','good')}
  if(f.hex||f.curse){await A.sigil(ctrV(),col,3);if(f.hex)sd.v.hex=Math.max(hexA(sd.v.hex),f.hexAmt||4);if(f.curse)sd.v.cursed=true;fxV(f.hex&&f.curse?'WITHERED!':f.hex?'HEXED!':'CURSED!','good')}
  if(f.face){faceTo(u);render();fxV('LOOK AT ME!','say');log('hero',`${VILLAINS[sd.vkey].short} turns to face ${h.name}.`)}
  if(f.foresee){await A.sigil(ctrV(),col,2);sd.v.foresee=true;if(sd.v.deck.length)markSeen(sd.vkey,sd.v.deck[0].id);fxU(u,'I SEE…','say')}
  if(f.eclipse){const ci=sd.vl.findIndex(o=>o.v.charge&&!o.v.down);if(ci>=0){focusV(ci);await A.sigil(ctrV(),col,3);sd.v.charge=null;fxV('ECLIPSED!','good');log('hero',`${h.name} snuffs out the charge.`)}}
  if(f.shock){const[r,d]=f.shock,hm=sd.hench.filter(m=>cheb(m,u)<=r);termHit(q=>cheb(q,u)<=r,a.n);await A.ring(ctrU(u),col,r*2+1.4,{count:2});
    hm.forEach(m=>{m.hp-=d;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);log('hero',hm.length?`${a.n} hits ${hm.length} henchm${hm.length===1?'an':'en'}.`:`${a.n} hits nobody.`)}
  if(f.stasis){const zs=live().filter(o=>cheb(o,u)<=1);await A.ring(ctrU(u),col,3.4,{count:3});zs.forEach(o=>{o.stasis=true;fxU(o,'FROZEN IN TIME','good')});log('hero',`${h.name} stops time: ${zs.map(o=>heroOf(o).name).join(', ')} can't be hurt until ${h.name}'s next turn.`)}
  if(f.skip){sd.v.skip=true;await A.sigil(ctrV(),col,3);fxV('TIME STOPS!','good');log('hero',`${VILLAINS[sd.vkey].short} will lose its next turn.`)}
  if(f.tear){await A.beam(ctrV(),col);for(let i=0;i<f.tear&&!sd.result&&!sd.v.down;i++)await woundAnim(`${h.name}: ${a.n}.`)}
  if(f.boost){const n=v(f.boost);u.boost=(u.boost||0)+n;if(f.jump)u.boostJump=true;await A.smoke(ctrU(u),5);fxU(u,'WHOOSH!','good');log('hero',`${h.name}: +${n} to the next move${f.jump?', and it is a jump':''}.`);if(!u.moved)sd.thenMode='move'}
  if(f.move){u.moved=false;if(JUMP_AB.includes(g.ab.id))u.jump=true;await A.smoke(ctrU(u),5);fxU(u,'WHOOSH!','good');sd.thenMode='move'}
  if(f.again){u.acted=false;await A.ring(ctrU(u),col,3,{count:2});fxU(u,'UNLEASHED!','good')}
  if(f.blind){await A.sigil(ctrV(),col,2.6);sd.v.blind=true;fxV('BLINDED!','good');log('hero',`${VILLAINS[sd.vkey].short} is blinded: −4 accuracy this round.`)}
  if(f.vsplash)await splashV(v(f.vsplash));
  if(f.reflect){u.reflect=1;await A.shield(ctrU(u),col);fxU(u,'BRACED!','good');log('hero',`${h.name} is ready to turn the next villain hit back on it.`)}
  if(f.riposte){u.ripo=true;await A.shield(ctrU(u),col);fxU(u,'EN GARDE!','good');log('hero',`${h.name} is ready to strike back at the next miss.`)}
  if(f.excise){sd.v.excise=v(f.excise);await A.reticle(ctrV(),col);fxV('FLAW FOUND!','good');log('hero',`${h.name} finds the flaw: the next page torn from ${VILLAINS[sd.vkey].short} this round is one you choose from its next ${sd.v.excise}.`)}
  if(f.scramble){const vv=sd.v;if(!vv.deck.length&&vv.discard.length){vv.deck=vv.discard;vv.discard=[]}vv.deck=shuffle(vv.deck);vv.foresee=false;vv.warn=null;await A.ring(ctrV(),col,3,{count:2});fxV('SCRAMBLED!','good');log('hero',`${VILLAINS[sd.vkey].short}'s playbook is shuffled.`);vWarn()}
  if(f.scry)await scry(v(f.scry),col,u);
  if(f.bury)await bury(col,u);
  if(f.hpCost){const n=Math.min(v(f.hpCost),h.hp-1);if(n>0){h.hp-=n;fxU(u,`−${n} HP`,'vhit');log('hero',`${h.name} pays ${n} health for it.`)}}
  render()}
/* a paired weapon's ability adds its pair bonus */
function pairFx(h,g){const f=g.ab.fx||{},p=pairOf(h)===g.ab.id&&GEAR[g.ab.id].pair.fx;if(!p)return f;const o={...f};
  for(const k in p){const x=o[k];o[k]=x==null?p[k]:Array.isArray(x)?[x[0]+p[k],...x.slice(1)]:x+p[k]}return o}
/* deck tricks: look at the next pages, then choose which comes first (Scry) or send the next one to the bottom (Bury) */
async function scry(n,col,u){const sd=S.sd,v=sd.v,k=sd.vkey;if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[];log('sys','The playbook is reshuffled.')}
  const top=v.deck.slice(0,n);if(!top.length)return;top.forEach(c=>markSeen(k,c.id));await A.sigil(ctrV(),col,2);
  const i=top.length>1?await choose(`Scry · ${VILLAINS[k].short}`,'Pick the page the villain plays next. The others stay in order behind it.',top.map(c=>({l:`${c.sig?'★ ':''}${c.n}`,s:c.txt}))):0;
  const c=top[i];v.deck.splice(v.deck.indexOf(c),1);v.deck.unshift(c);v.foresee=true;v.warn=null;vWarn();fxU(u,'I SEE…','say');log('hero',`Scry: ${VILLAINS[k].short} will play ${c.n} next.`)}
async function bury(col,u){const sd=S.sd,v=sd.v,k=sd.vkey;if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[];log('sys','The playbook is reshuffled.')}
  const c=v.deck[0];if(!c)return;markSeen(k,c.id);await A.reticle(ctrV(),col);
  const i=v.deck.length>1?await choose(`Spot the Tell · ${VILLAINS[k].short}`,`Next page: ${c.n}. ${c.txt}`,[{l:'Bury it',s:'Move it to the bottom of the playbook.'},{l:'Leave it on top',s:'Keep it foreseen, so you know what is coming.'}]):1;
  if(i===0){v.deck.push(v.deck.shift());v.foresee=false;v.warn=null;vWarn();fxV('BURIED!','good');log('hero',`${c.n} is buried at the bottom of ${VILLAINS[k].short}'s playbook.`)}
  else{v.foresee=true;fxU(u,'GOT IT.','say');log('hero',`${c.n} stays on top, foreseen.`)}}
/* a small pick-one overlay; AUTO_CHOOSE answers it in tests */
let AUTO_CHOOSE=null;
function choose(title,sub,opts){if(FAST||AUTO_CHOOSE!=null)return Promise.resolve(Math.min(opts.length-1,AUTO_CHOOSE||0));
  return new Promise(res=>{const L=document.createElement('div');L.id='choose';L.setAttribute('role','dialog');L.setAttribute('aria-label',title);
    L.innerHTML=`<div class="chz"><div class="eyebrow">${esc(title)}</div><div class="small">${esc(sub)}</div>${opts.map((o,i)=>`<button class="btn opt" type="button" data-i="${i}"><span>${esc(o.l)}</span>${o.s?`<small>${esc(o.s)}</small>`:''}</button>`).join('')}</div>`;
    document.body.appendChild(L);setTimeout(()=>{const b=L.querySelector('[data-i]');if(b)b.focus({preventScroll:true})},50);
    L.addEventListener('click',e=>{const b=e.target.closest('[data-i]');e.stopPropagation();if(!b)return;L.remove();res(+b.dataset.i)})})}
/* Riposte: a free 1-die attack when the villain misses, once per round; it keeps the hero's charged bonuses for their own attack */
async function riposte(u){const sd=S.sd,h=heroOf(u);if(sd.result||u.ko||u.ripUsed||!(u.ripo||gearHas(h,'riposte'))||sd.v.down||dV(u,sd.v)>stat(h,'range'))return;
  u.ripUsed=true;const keep=[u.buffDice,u.buffStr,u.buffAcc,u.buffBack,u.buffReap],call=sd.v.callout;u.buffDice=u.buffStr=u.buffAcc=u.buffBack=u.buffReap=0;sd.v.callout=0;u.noRel=true;
  fxU(u,'RIPOSTE!','good');log('hero',`Riposte! ${h.name} strikes back.`);await heroAttack(u,'v',0,1);
  u.noRel=false;[u.buffDice,u.buffStr,u.buffAcc,u.buffBack,u.buffReap]=keep;sd.v.callout=call}
function painGain(u,h){for(const g of new Set(Object.values(h.gear))){const t=GEAR[g]&&GEAR[g].pain;if(!t||!u.res)continue;const mx=resMax(h,t);
  if((u.res[t]||0)<mx){u.res[t]=(u.res[t]||0)+1;log('hero',`${GEAR[g].name}: ${h.name} turns the pain into 1 ${TRACKS[t].res}.`)}}}
function lifeline(u,h){if(pwrMax(h)&&u.res.tech<pwrMax(h)){u.res.tech++;fxU(u,'+POWER','good');log('hero',`Lifeline: ${h.name} regains 1 Power.`)}
  else if(arcMax(h)&&u.res.magic<arcMax(h)){u.res.magic++;fxU(u,'+ARCANA','good');log('hero',`Lifeline: ${h.name} regains 1 Arcana.`)}
  else if(h.hp<stat(h,'maxHp')){h.hp=Math.min(stat(h,'maxHp'),h.hp+2);fxU(u,'+2 HP','good');log('hero',`Lifeline: ${h.name} regains 2 health.`)}}
async function splashV(n){const sd=S.sd,hm=sd.hench.filter(m=>dV(m,sd.v)<=2);if(!hm.length)return;
  await Promise.all(hm.map(m=>A.bolt(ctrV(),ctrU(m),COL.magic,true)));
  hm.forEach(m=>{m.hp-=n;m.hurtAt=Date.now();fxP(m.x,m.y,m.hp<=0?'K.O.!':'ZAP!','hit')});sd.hench=sd.hench.filter(m=>m.hp>0);
  log('hero',`The blast catches ${hm.length} henchm${hm.length===1?'an':'en'}.`);render()}
function onCell(x,y){const sd=S.sd;if(sd.busy||sd.result)return;const k=x+','+y;const vAt=sd.vl.findIndex(o=>!o.v.down&&inV(o.v,x,y));
  const u=sd.sel!=null?sd.units[sd.sel]:null,h=u&&heroOf(u);
  const unitIdx=sd.units.findIndex(o=>!o.ko&&o.x===x&&o.y===y);
  if(u){
    if(sd.mode==='move'&&!u.moved){const r=reachH(u,stat(h,'move')+(u.boost||0));if(k in r){const lp=reachH.leaps.has(k),sw=sd.civs.find(c=>c.x===x&&c.y===y);if(sw){sw.x=u.x;sw.y=u.y}u.x=x;u.y=y;u.moved=true;u.jump=false;u.boost=0;u.boostJump=false;sd.mode=null;if(lp){fxU(u,'HUP!','good');log('hero',`${h.name} jumps clear over a beam.`)}beamStep(u);civFollow(u);render();return}}
    if(sd.mode==='attack'||sd.mode==='arc'){const rng=stat(h,'range');let t=null;
      if(vAt>=0&&dV(u,sd.vl[vAt].v)<=rng&&!shotVB(u,sd.vl[vAt].v)){focusV(vAt);t='v';sd.aim={x,y}}else{const m=sd.hench.find(m=>m.x===x&&m.y===y&&cheb(m,u)<=rng&&!shotBlocked(u,m));if(m)t=m}
      if(t){const arc=sd.mode==='arc';return act(async()=>{u.acted=true;if(arc)payPow(u,h);await heroAttack(u,t,arc?1:0);if(arc&&!sd.result)await splash(t)})}}
    if(sd.mode==='rallySpirit'&&unitIdx>=0&&!u.acted&&!u.ko&&cheb(u,sd.units[unitIdx])<=lvlOf(h)){const tu=sd.units[unitIdx],t=heroOf(tu);return act(async()=>{u.acted=true;if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL.heal);await A.heal(ctrU(tu),COL.heal);const gained=Math.min(3,Math.max(0,stat(t,'maxComp')-t.comp));t.comp+=gained;fxU(tu,gained?'+'+gained+' SPIRIT':'STEADY!','good');log('hero',`${h.name} rallies ${tu===u?'themselves':t.name}, restoring ${gained} composure.`)})}
    if(sd.mode==='patch'&&unitIdx>=0&&cheb(sd.units[unitIdx],u)<=3){const tu=sd.units[unitIdx],t=heroOf(tu);
      return act(async()=>{payPow(u,h);if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL.heal);await A.heal(ctrU(tu),COL.heal);
        t.hp=Math.min(stat(t,'maxHp'),t.hp+3);t.comp=Math.min(stat(t,'maxComp'),t.comp+2);fxU(tu,'+3 HP','good');log('hero',`${h.name} patches up ${t.name}.`)})}
    if(sd.mode==='barricade'&&cheb({x,y},u)<=2&&!blocked(x,y))return act(async()=>{payPow(u,h);await A.smoke(HC(x,y),4);sd.walls.push({k,ttl:3});fxU(u,'CLANK!','good');log('hero',`${h.name} bolts up a barricade.`)});
    if(sd.mode==='abally'&&unitIdx>=0){const key=sd.abKey,g=GEAR[key],a=g.ab,tu=sd.units[unitIdx];
      if(cheb(tu,u)<=abV(a.r,potOf(h)))return act(async()=>{payAb(u,key);log('hero',`${h.name} uses ${a.n} on ${tu===u?'themselves':heroOf(tu).name} (${abCost(g)}).`);if(tu!==u)await A.shot(ctrU(u),ctrU(tu),COL[g.type]);await abApply(u,h,g,tu)})}
    if(sd.mode==='abtele'&&cheb({x,y},u)<=abV(GEAR[sd.abKey].ab.r,potOf(h))&&!blocked(x,y)){const key=sd.abKey,g=GEAR[key],a=g.ab;
      return act(async()=>{payAb(u,key);await A.sparkle(ctrU(u),COL[g.type]);u.x=x;u.y=y;noFlip.add('h'+u.hid);beamStep(u);render();await A.sparkle(ctrU(u),COL[g.type]);fxU(u,a.leap?'KA-THOOM!':'BAMF!','good');log('hero',`${h.name} uses ${a.n} (${abCost(g)}).`);await abApply(u,h,g,u)})}
    if(sd.mode==='abcover'&&cheb({x,y},u)<=abV(GEAR[sd.abKey].ab.r,potOf(h))&&!blocked(x,y)){const key=sd.abKey,g=GEAR[key],a=g.ab;
      return act(async()=>{payAb(u,key);await A.smoke(HC(x,y),4);sd.walls.push({k,ttl:2});fxU(u,'CLANK!','good');log('hero',`${h.name} uses ${a.n} (${abCost(g)}): a wall goes up.`)})}
    if(sd.mode==='abstrike'&&vAt>=0){const key=sd.abKey,g=GEAR[key],a=g.ab;
      if((!a.rng||dV(u,sd.vl[vAt].v)<=a.rng)&&!shotVB(u,sd.vl[vAt].v)){focusV(vAt);sd.aim={x,y};
        return act(async()=>{payAb(u,key);u.acted=true;log('hero',`${h.name} unleashes ${a.n} (${abCost(g)})!`);if(a.str)u.buffStr+=a.str;await heroAttack(u,'v',a.plus||0,a.dice||0,'beam');if(a.splash&&!sd.result)await splashV(a.splash)})}}}
  if(vAt>=0&&sd.vl.length>1&&unitIdx<0){focusV(vAt);render();return}
  if(unitIdx>=0){if(sd.sel!==unitIdx){sd.combatPick=null;sd.combatMenuOpen=null}sd.sel=unitIdx;const o=sd.units[unitIdx];sd.mode=o.moved?null:'move'}
  else{sd.sel=null;sd.mode=null;sd.combatPick=null;sd.combatMenuOpen=null}
  render()}
