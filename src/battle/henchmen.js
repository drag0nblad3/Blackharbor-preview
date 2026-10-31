/* battle/henchmen.js: Leaps, serpent, sweeps, elites and henchmen turns, shots, tactics. */
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
const hName=hm=>hm.shadow?'stolen shadow':hm.infested?'infested mite':hm.elite?eliteOf(hm.owner||S.sd.vkey).name:'the '+VILLAINS[hm.owner||S.sd.vkey].hench.name.toLowerCase();
function mkElite(o,t){const L=o.v.level;return {id:'e_'+o.key,owner:o.key,x:t.x,y:t.y,hp:henchHp(2+L),elite:1}}
/* Version 107 (Tyler): Hive Jammer takes 1 health off every henchman, down to 1 */
const henchHp=n=>S.facilities.includes('jammer')?Math.max(1,n-1):n;
const regularHenchHp=owner=>henchHp(owner==='cantor'?1:2);
const eliteEva=hm=>9+Math.floor(henchLv(hm)/2);
function henchLv(hm){const sd=S.sd,o=sd.vl.find(o=>o.key===(hm.owner||sd.vkey));return o?o.v.level:sd.v.level}
/* Version 89 (Tyler): three more special henchmen. Gallows' Failed Experiment is slow (moves 2), hits 1 harder and shrugs off the first hit
   each round. Ouroboros' High Priest attacks from range 3 and raises a fallen Cultist each round while fewer than 2 remain. The Architect's
   Foreman throws up a wall next to the hero closest to the Architect each round (it lasts 2 rounds). */
function henchDmg(hm){if(hm.elite)return 1+Math.floor(henchLv(hm)/2)+(eliteOf(hm.owner||S.sd.vkey).brute?1:0);const sd=S.sd,ok=hm.owner||sd.vkey;/* Tyler, 2026-10-30: Cantor's hired guns follow the normal curve again (2 at level 4, 3 at level 8) */const o=sd.vl.find(o=>o.key===ok),lv=o?o.v.level:sd.v.level;return 1+Math.floor(lv/4)}
async function henchAct(hm){if(hm.shadow||hm.collectionRound===S.sd.round)return;const sd=S.sd,L=live();if(!L.length)return;const def=hm.elite?eliteOf(hm.owner||sd.vkey):VILLAINS[hm.owner||sd.vkey].hench;
  if(hm.elite&&def.guard){const o=sd.vl.find(o=>o.key===hm.owner&&!o.v.down);if(o&&dV(hm,o.v)>1){const opts=reach(hm,3,hm);let best=null,bd=1e9;
    for(const k in opts){const[x,y]=k.split(',').map(Number);if(dV({x,y},o.v)!==1)continue;const d=Math.min(...L.map(u=>cheb(u,{x,y})));if(d<bd){bd=d;best=[x,y]}}
    if(best){hm.x=best[0];hm.y=best[1];render();await sleep(300)}}
    const adj=L.filter(u=>cheb(u,hm)<=def.rng);if(o&&!adj.length)return}
  else if(!hm.elite&&await henchGrab(hm))return;
  if(hm.elite&&await eliteTurn(hm,def,L))return;if(sd.result||!sd.hench.includes(hm))return;
  let t=L.slice().sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];
  if(cheb(t,hm)>def.rng){const opts=reach(hm,def.mv||3,hm);let best=null,bd=cheb(t,hm);
    for(const k in opts){const[x,y]=k.split(',').map(Number);const d=cheb(t,{x,y});if(d<bd||(d===bd&&best&&Math.random()<.3)){bd=d;best=[x,y]}}
    if(best){hm.x=best[0];hm.y=best[1];render();await sleep(300)}}
  await henchShoot(hm,def,L)}
// One normal henchman shot; also used by Crowd Control without moving.
async function henchShoot(hm,def,L){
  const t=L.filter(u=>cheb(u,hm)<=def.rng&&!shotBlocked(hm,u))
    .sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];
  if(!t)return false;
  await strikeAnim(def.style,ctrU(hm),ctrU(t),COL.grey,'m'+hm.id);
  const h=heroOf(t),r=luckUp(t)?Math.min(d20(),d20()):d20(),eva=stat(h,'eva')+(t.buffEva||0)+(t.evaNext||0)+avoidEva(t);
  if(t.evaNext){log('hero',`Wind Ward: +${t.evaNext} evasion for ${h.name}.`);t.evaNext=0}
  const ha=(setOn(h,'swarm')?-2:2)+(hm.elite?2:0),hit=r===20||(r!==1&&r+ha>=eva);
  log('vill',`${def.name} attacks ${h.name}: ${r}${ha<0?'−'+(-ha):'+'+ha} vs ${eva}. ${hit?`Hit for ${henchDmg(hm)}.`:'Miss.'}`);
  if(hit&&!await wardBlocks(t)){fxU(t,def.rng>1?'PEW!':'THUD!','vhit');damageHero(t,henchDmg(hm))}
  else if(!hit){fxU(t,'SWISH!','miss');await avoidRedirect(t,hm,henchDmg(hm),def.name)}
  return true}

/* Version 91 (Tyler): the Foreman's girders block shots (any attack at range 2+ whose hex line crosses one) and topple onto an adjacent hero
   when they come down two villain turns later, for 2 + half the Architect's level. */
function hexLine(a,b){const A=ax(a),B=ax(b),n=cheb(a,b),out=[];const ac={q:A.q+1e-6,r:A.r+1e-6},bc={q:B.q+1e-6,r:B.r+1e-6};
  for(let i=1;i<n;i++){const t=i/n,q=ac.q+(bc.q-ac.q)*t,r=ac.r+(bc.r-ac.r)*t,s=-q-r;let rq=Math.round(q),rr=Math.round(r),rs=Math.round(s);
    const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs-s);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;out.push(off(rq,rr))}return out}
function shotBlocked(a,b){const sd=S.sd;if(cheb(a,b)<=1||!sd.walls.some(w=>w.girder))return false;return hexLine(a,b).some(p=>sd.walls.some(w=>w.girder&&w.k===p.x+','+p.y))}
const shotVB=(u,v)=>vCells(v).every(c=>shotBlocked(u,c));
async function eliteTurn(hm,def,L){const sd=S.sd,o=sd.vl.find(o=>o.key===hm.owner&&!o.v.down);if(!o)return;
  // Payload's Bombardier alternates ranged shots with a telegraphed bomb
  // lob. The toss replaces its normal attack, and uses the existing fuse,
  // avoidance, blast, and friendly-fire rules instead of immediate damage.
  if(def.bombardier&&sd.round%2===0){
    const target=L.filter(u=>cheb(u,hm)<=4).sort((a,b)=>cheb(a,hm)-cheb(b,hm))[0];
    if(target&&dropBomb(target.x,target.y,1,2+Math.floor(henchLv(hm)/3),1)){
      await A.smoke(ctrU(target),3);
      fxU(target,'FUSE!','vhit');
      log('vill',`${def.name} lobs a short-fuse bomb at ${heroOf(target).name} from up to 4 hexes away.`);
      render();
      return true;
    }
  }
  if(def.priest&&sd.hench.filter(m=>!m.elite&&m.owner===hm.owner).length<2){const t=freeTiles((x,y)=>cheb({x,y},hm)===1)[0];
    if(t){sd.hench.push({id:'p'+Date.now(),owner:hm.owner,x:t.x,y:t.y,hp:regularHenchHp(hm.owner)});await A.smoke(HC(t.x,t.y),3);fxP(t.x,t.y,'RISE!','say');log('vill',`${def.name} chants, and a fallen ${VILLAINS[hm.owner].hench.name.toLowerCase()} rises again.`);render()}}
  if(def.foreman){const near=L.slice().sort((a,b)=>dV(a,o.v)-dV(b,o.v))[0];const t=near&&freeTiles((x,y)=>cheb({x,y},near)===1&&dV({x,y},o.v)<dV(near,o.v))[0];
    if(t){sd.walls.push({k:t.x+','+t.y,ttl:2,girder:1,dmg:2+Math.floor(henchLv(hm)/2)});await A.smoke(HC(t.x,t.y),3);fxP(t.x,t.y,'CLANG!','say');log('vill',`${def.name} bolts a girder into place in front of ${heroOf(near).name}. It blocks shots, and it will topple in 2 turns.`);render()}}}
function drawTactic(){const sd=S.sd,k=sd.vkey,v=sd.v;sd.tdk=sd.tdk||{};
  for(let g=0;g<60;g++){if(!sd.tdk[k]||!sd.tdk[k].length)sd.tdk[k]=shuffle([...(VILLAINS[k].tact?TACT.filter(t=>VILLAINS[k].tact.includes(t.id)):['weak','armor','over','counter','glance'].map(id=>TACT.find(t=>t.id===id))),...VINTEL[k].react.filter(r=>rxLive(v,r)).map(r=>({...r,sig:k}))]);
    const tc=sd.tdk[k].shift();if(tc.sig&&!rxLive(v,rxOf(k,tc.id)))continue;if(tc.sig)markSeenR(k,tc.id);return tc}
  return TACT[TACT.length-1]}
function benchTile(u,v,fn){return freeTiles((x,y)=>cheb({x,y},u)===1).sort(fn)[0]}
