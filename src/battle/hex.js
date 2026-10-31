/* battle/hex.js: Hex board geometry, villain footprints and facing, blocking, villain movement and shoves. */
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
  if((sd.dupes||[]).some(d=>d.x===x&&d.y===y))return true;
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
function swSync(v){const want=VINTEL.swarm.react.filter(r=>r.part&&rxLive(v,r)).map(r=>r.id),all=swBodies(v),out={lost:[],grew:[]};let keep=all.filter(b=>want.includes(b.k));if(!keep.length)keep=[all[0]];
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
function vStat(k){const sd=S.sd;return VILLAINS[sd.vkey][k]+vLvB(k,sd.v.level)+diffStat(k)+(k==='eva'?sd.v.fadeEva||0:0)-(k==='eva'?hexA(sd.v.hex):0)-(k==='acc'&&sd.v.blind?3:0)}
