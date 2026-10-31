/* battle/hazards.js: Charge zones, bombs, beams and signature breaks. */
function chargeZone(z,c={}){const sd=S.sd,v=sd.v,zr=c.zr||0,L=live().slice().sort((a,b)=>dV(a,v)-dV(b,v)),ks=new Set();
  const box=(t,r=1)=>hexesWithin(t,r).forEach(p=>{if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(p.x+','+p.y)});
  const hurt=()=>L.slice().sort((a,b)=>heroOf(a).hp-heroOf(b).hp);
  if(z==='blast'&&L[0]){box(L[0],2);faceTo(L[0])}
  if(z==='blast2')L.slice(0,3).forEach(t=>box(t));
  if(z==='mark'&&L.length){const ts=hurt().slice(0,2);ts.forEach(t=>box(t));faceTo(ts[0]);v.hide=false}
  if(z==='line'&&L.length){const far=L.slice(-2).reverse();far.forEach((t,i)=>{const d=dirC(vCtr(v),HC(t.x,t.y)),A=ax(t);if(!i)v.face=d;
    for(let k=-2*N;k<=2*N;k++){const p=off(A.q+AXD[d][0]*k,A.r+AXD[d][1]*k);if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(p.x+','+p.y)}})}
  if(z==='focus'&&L.length){const t=hurt()[0];faceTo(t);box(t);
    for(let d=0;d<6;d++){let p=t;for(let g=0;g<2*N;g++){p=step(p,d);const k=p.x+','+p.y;if(!inB(p.x,p.y)||sd.obs.includes(k)||(sd.walls||[]).some(w=>w.k===k)||inV(v,p.x,p.y))break;ks.add(k)}}}
  if(z==='nova')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!inV(v,x,y)&&dV({x,y},v)<=3+zr)ks.add(x+','+y);
  /* Death Mark: only the marked heroes' own hexes, 1 more hero per upgrade ring */
  if(z==='hero'&&L.length){const ts=hurt().slice(0,1+zr);ts.forEach(t=>ks.add(t.x+','+t.y));faceTo(ts[0]);v.hide=false}
  /* upgrade rings widen the other zones */
  if(zr&&z!=='nova'&&z!=='hero')for(let i=0;i<zr;i++)[...ks].forEach(k=>{const[x,y]=k.split(',').map(Number);hexesWithin({x,y},1).forEach(p=>{if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(p.x+','+p.y)})});
  return [...ks]}
async function hazardTick(){const sd=S.sd;if(!sd.haz.length)return;
  for(const u of live().filter(u=>sd.haz.some(h=>h.k===u.x+','+u.y))){const hz=sd.haz.find(h=>h.k===u.x+','+u.y);
    await A.ring(ctrU(u),COL.innate,1.6);fxU(u,'SIZZLE!','vhit');damageHero(u,hz.dmg);log('vill',`${heroOf(u).name} is burned by the ${hz.n||'molten floor'} for ${hz.dmg}.`);render()}
  sd.haz.forEach(h=>{if(!h.perm)h.ttl--});sd.haz=sd.haz.filter(h=>h.ttl>0)}
/* Payload bombs: sd.bombs [{k,fuse,dmg,o,radius}] explode at the next
   villain turn. Most cover seven hexes (radius 1); advanced cards can create
   19-hex blasts (radius 2). Payload and all her own henchmen are immune. */
const BOMB_MAX=4;
const bombP=b=>{const[x,y]=b.k.split(',').map(Number);return {x,y}};
const bombRadius=b=>Math.max(1,Math.min(2,b.radius||1));
function dropBomb(x,y,fuse,dmg,radius=1,daze){const sd=S.sd,k=x+','+y;sd.bombs=sd.bombs||[];const e=sd.bombs.find(b=>b.k===k);
  // Always one-round fuses, including legacy callers and loaded saves.
  if(e){e.fuse=1;e.dmg=Math.max(e.dmg,dmg);e.radius=Math.max(bombRadius(e),radius);if(daze)e.daze=1;return true}
  if(sd.bombs.length>=BOMB_MAX)return false;sd.bombs.push({k,fuse:1,dmg,o:sd.vkey,radius,...(daze?{daze:1}:{})});return true}
async function blowBombs(list,bonus=0){const sd=S.sd;
  for(const b of list){if(sd.result)break;sd.bombs=sd.bombs.filter(o=>o!==b);const p=bombP(b),radius=bombRadius(b),inZ=q=>cheb(q,p)<=radius,sap=sd.hench.some(m=>m.owner===b.o&&!m.elite&&cheb(m,p)<=1)?1:0,dm=b.dmg+bonus+sap;
    render();await A.ring(HC(p.x,p.y),COL.yel,2*radius+1.4,{count:2});fxP(p.x,p.y,pick(['KA-BOOM!','BLAM!','KRAKOOM!']),'vhit');
    if(sap)log('vill','A Sapper packed that bomb: +1 damage.');
    const hd=dm,hs=live().filter(inZ),hm=sd.hench.filter(m=>m.owner!=='bomber'&&inZ(m));
    for(const u of hs){if(await wardBlocks(u))continue;fxU(u,'OOF!','vhit');damageHero(u,hd);log('vill',`A bomb goes off on ${heroOf(u).name} for ${hd}.`);if(b.daze)dazeU(u)}
    sd.civs.filter(inZ).forEach(c=>harmCiv(c,'a bomb'));termHit(inZ,'A bomb');
    hm.forEach(m=>{m.hp-=dm;m.hurtAt=Date.now()});const dead=hm.filter(m=>m.hp<=0);if(dead.length){sd.hench=sd.hench.filter(m=>m.hp>0);log('vill',`The blast takes out ${dead.length} of the villain's own henchm${dead.length>1?'en':'an'}.`)}
    if(!hs.length&&!hm.length)log('vill','A bomb goes off, but nobody is close enough to get hurt.');
    render();checkLoss();await sleep(FAST?0:220)}}
async function bombTick(){const sd=S.sd;if(!sd.bombs||!sd.bombs.length)return;sd.bombs.forEach(b=>b.fuse=0);render();const due=sd.bombs.filter(b=>b.fuse<=0);if(due.length)await blowBombs(due)}
/* Gridlock's beams run along a hex line to the board edge. A beam stops at walls, rubble and villains, and at the first hero or civilian
   it hits; a hero hit is knocked back along the beam as many hexes as the damage. Hexes it crossed stay lit until his next turn:
   stepping into one costs BEAM_HOT and ends the move, and a hero can jump over a single lit hex for 2 movement. Prisms split a beam 60° both ways. */
const BEAM_HOT=2;
function litMap(){const m={};((S.sd&&S.sd.beams)||[]).forEach(b=>b.ks.forEach(k=>{m[k]=Math.max(m[k]||0,b.hot)}));return m}
/* Version 108 (Tyler): Optics Bench no longer cuts beam damage, it fits scope rails (see stat) */
function optic(n){return n}
function beamTick(){const sd=S.sd;if(!sd.beams||!sd.beams.length)return;sd.beams.forEach(b=>b.ttl--);sd.beams=sd.beams.filter(b=>b.ttl>0);render()}
function beamStep(u){const n=litMap()[u.x+','+u.y];if(!n||u.ko)return;const dm=optic(n);fxU(u,'ZZZT!','vhit');damageHero(u,dm);log('vill',`${heroOf(u).name} steps into a beam and takes ${dm}. Their move ends there.`);checkLoss()}
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
    if(o.daze)dazeU(u);log('vill',`${label} hits ${h.name} for ${dm}${n?` and knocks them back ${n} hex${n>1?'es':''}`:u.anchor?'. They are anchored and hold firm':''}.`);render();await sleep(FAST?0:220)}
  const nk=new Set(lit.flatMap(e=>e.r.ks)).size;
  log('vill',hits.length||civs.length?`${nk} hexes stay lit until ${VILLAINS[sd.vkey].short}'s next turn.`:`${label}: ${lit.length} beam${lit.length===1?'':'s'} light up ${nk} hexes, but nobody is caught.`);
  checkLoss();return hits.map(e=>e.r.hit)}
/* Magic capstone: a page torn by this hero staggers the villain's charge at once */
function sigBreak(h,v){if(!v||v.down||(!v.charge&&!v.planned?.sig)||!rankMod(h,'magic','sigBreak'))return;const n=v.charge?.n||v.planned.n;cancelPlan(v);fxV('STAGGERED!','good');log('hero',`Magic capstone: ${h.name} tears the page and ${n} fizzles out!`)}
async function fireCharge(){const sd=S.sd,v=sd.v,ch=sd.v.charge;sd.v.charge=null;
  const cells=ch.zone.map(k=>{const[x,y]=k.split(',').map(Number);return {...HC(x,y),x,y}});
  sd.firing=ch.zone;fxV(ch.n.toUpperCase()+'!','say');render();
  await Promise.all([A.bolt(ctrV(),cells[Math.floor(cells.length/2)],COL.yel),...cells.map((p,i)=>sleep(i*22).then(()=>A.ring(p,COL.yel,1.4)))]);
  sd.firing=null;const inZ=p=>ch.zone.includes(p.x+','+p.y);
  const hit=live().filter(inZ);
  const cd=ch.dmg>0&&v.cursed?Math.max(1,ch.dmg-2):ch.dmg;for(const u of hit){if(await wardBlocks(u))continue;fxU(u,pick(['FWOOOM!','KRAKOOM!']),'vhit');damageHero(u,cd);log('vill',`${ch.n} scorches ${heroOf(u).name} for ${ch.dmg}.`);if(ch.daze)dazeU(u)}
  sd.civs.filter(inZ).forEach(c=>harmCiv(c,ch.n));termHit(inZ,ch.n);
  if(!hit.length)log('vill',`${ch.n} fires, but everyone got clear!`);render()}
