/* Stateful boss options. All persistent effects live in the showdown save state. */
const bossKey=p=>p.x+','+p.y;
const bossPoint=k=>{const [x,y]=k.split(',').map(Number);return {x,y}};
function bossObserve(){
  const sd=S.sd;if(S.phase!=='sd'||!sd||sd.result)return;
  for(const {v} of sd.vl){
    if(v.down){delete v.circuit;delete v.shadowMark;delete v.setup;delete v.solarHeat;continue}
    if(v.charge&&v.charge.track){const ks=new Set();for(const id of v.charge.track){const u=sd.units.find(o=>o.hid===id&&!o.ko);if(u)hexesWithin(u,v.charge.tr??1).forEach(p=>{if(inB(p.x,p.y)&&!inV(v,p.x,p.y))ks.add(bossKey(p))})}v.charge.zone=[...ks]}
    if(v.circuit){const [a,b]=v.circuit.map(id=>sd.units.find(u=>u.hid===id));if(!a||!b||a.ko||b.ko||cheb(a,b)>=4){delete v.circuit;log('hero','Closed Circuit breaks.')}}
    const m=v.shadowMark;if(m){const u=sd.units.find(u=>u.hid===m.hid);if(!u||u.ko){delete v.shadowMark;continue}
      if(u.x!==m.x||u.y!==m.y){delete v.shadowMark;
        if(!blocked(m.x,m.y)){const id='shadow-'+sd.round+'-'+u.hid;sd.hench.push({id,owner:'noct',x:m.x,y:m.y,hp:1,shadow:true});v.shadowId=id;log('vill','Stolen Shadow: a 1-HP copy remains at the hero’s old position.');}
        else log('hero','The stolen shadow cannot form on an occupied or blocked hex.');
      }
    }
  }
}
function bossAbility(u,usesPower){
  bossObserve();const sd=S.sd;if(!sd||sd.result)return;
  for(const {v} of sd.vl){if(v.down)continue;
    if(usesPower&&v.circuit&&v.circuit.includes(u.hid)){const other=sd.units.find(o=>o.hid!==u.hid&&v.circuit.includes(o.hid));if(other&&!other.ko){const h=heroOf(other),n=1+compBonus(v.level);h.comp=Math.max(0,h.comp-n);log('vill',`Closed Circuit: ${h.name} loses ${n} Composure.`)}}
    if(v.solarHeat!=null&&dV(u,v)<=2){v.solarHeat=Math.min(4,v.solarHeat+1);log('vill',`Solar Debt: ${v.solarHeat}/4 Heat.`)}
  }
}
function bossMarked(k){return S.sd.vl.some(({v})=>!v.down&&v.setup&&v.setup.zone.includes(k))}
function bossStatusView(){const sd=S.sd,lines=[];
  const hex=k=>{const p=bossPoint(k);return `${p.x+1},${p.y+1}`};
  for(const {key,v} of sd.vl){if(v.down)continue;const n=VILLAINS[key].short;
    if(v.setup)lines.push(`${n}: ${v.setup.type==='heave'?'Tectonic Heave':'Renovation Notice'} resolves before the next boss action. Marked hexes: ${v.setup.zone.map(hex).join(' · ')}.`);
    if(v.circuit)lines.push(`${n}: Closed Circuit links ${v.circuit.map(id=>heroOf(sd.units.find(u=>u.hid===id)).name).join(' and ')}. Separate by 4 hexes; expires at next boss action.`);
    if(v.solarHeat!=null)lines.push(`${n}: Solar Debt ${v.solarHeat}/4 Heat. Radius 2 pulse before next action; 3+ Heat tears a draw-pile page.`);
    if(v.satellites)lines.push(`${n}: ${v.satellites}/2 scrap satellites. Adjacent heroes can pull one down using Other Actions.`);
    if(v.shadowMark)lines.push(`${n}: Stolen Shadow marks ${heroOf(sd.units.find(u=>u.hid===v.shadowMark.hid)).name}. Their next movement leaves a copy.`);
    if(v.shadowId&&sd.hench.some(m=>m.id===v.shadowId))lines.push(`${n}: destroy the 1-HP purple-ringed shadow before the next action to prevent the swap.`);
    {const d=(v.dupes||[]).filter(id=>(sd.dupes||[]).some(m=>m.id===id)).length;if(d)lines.push(`${n}: ${d} shadow double${d>1?'s':''} will repeat the page she has planned${(sd.dupes||[]).some(m=>v.dupes.includes(m.id)&&m.plan)?' (locked in: tearing or skipping her page does not stop them)':''}, then dissipate. Doubles cannot be harmed; stay out of their reach.`)}
    if(v.fadeEva)lines.push(`${n}: Fade gives +${v.fadeEva} evasion until her next action.`);
    if(v.charge&&v.charge.track)lines.push(`${n}: ${v.charge.n} follows its targets: ${v.charge.track.map(id=>sd.units.find(u=>u.hid===id)).filter(u=>u&&!u.ko).map(u=>heroOf(u).name).join(' and ')}.`);
    if(v.borrowed)lines.push(`${n}: ${v.borrowed.filter(b=>sd.hench.some(m=>m.id===b.id)).length}/${v.borrowed.length} infested carriers survive. Green rings mark next-action origins.`);
  }
  return lines.length?`<div class="boss-effects" role="status">${lines.map(t=>`<div class="cap">${esc(t)}</div>`).join('')}</div>`:'';
}
function satelliteTarget(u){return S.sd.vl.map(o=>o.v).find(v=>!v.down&&v.satellites>0&&dV(u,v)<=1)}
function dropSatellite(v,u){if(!v||!v.satellites)return;v.satellites--;
  const p=freeTiles((x,y)=>dV({x,y},v)===1&&!S.sd.exits.includes(x+','+y)).sort((a,b)=>cheb(a,u)-cheb(b,u))[0];
  if(p)S.sd.obs.push(bossKey(p));log('hero',`A scrap satellite falls${p?' as rubble toward '+heroOf(u).name:''}. ${v.satellites} remain.`);
}
async function specialBossCard(c){const sd=S.sd,v=sd.v;
  switch(c.t){
    case 'circuit':{const ts=live().sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,2);if(ts.length===2){v.circuit=ts.map(u=>u.hid);bossObserve()}break}
    case 'heave':{const t=pickTarget('nearest');if(t){const d=dirC(vCtr(v),HC(t.x,t.y));v.setup={type:'heave',zone:[step(t,(d+3)%6),t,step(t,d)].filter(p=>inB(p.x,p.y)).map(bossKey)}}break}
    case 'renovate':{const t=pickTarget('nearest');if(t)v.setup={type:'renovate',zone:hexesWithin(t,1).map(bossKey),edge:nbrs(t).filter(p=>inB(p.x,p.y)).map(bossKey)};break}
    case 'solar':v.solarHeat=0;break;
    case 'satellites':{v.satellites=v.satellites||0;const rocks=sd.obs.map(bossPoint).filter(p=>dV(p,v)<=3).sort((a,b)=>dV(a,v)-dV(b,v)).slice(0,2-v.satellites);for(const p of rocks)sd.obs=sd.obs.filter(k=>k!==bossKey(p));v.satellites+=rocks.length;log('vill',`Scrap Satellites: ${v.satellites}/2 orbit Lodestone.`);break}
    case 'shadow':{sd.hench=sd.hench.filter(m=>m.id!==v.shadowId);delete v.shadowId;const t=pickTarget('nearest');if(t)v.shadowMark={hid:t.hid,x:t.x,y:t.y};
      if(t&&c.knife&&dV(t,v)<=c.rng){await vHit(t,dmgScale(c.knife),c.n,'shot');const h=heroOf(t);if(!t.ko&&c.comp){h.comp=Math.max(0,h.comp-c.comp);log('vill',`${c.n}: ${h.name} loses ${c.comp} composure.`)}}break}
    case 'borrow':{const bodies=swBodies(v).slice(1);v.borrowed=sd.hench.filter(m=>m.owner==='swarm'&&!m.elite&&!m.shadow).slice(0,Math.min(2,bodies.length)).map((m,i)=>{m.infested=true;return {id:m.id,k:bodies[i].k}});break}
    case 'collection':await collection();break;
    case 'double':{const s=doubleSpot(v,c.rng);if(!s)break;const {t,p}=s;
      const keep={x:v.x,y:v.y,face:v.face};v.x=p.x;v.y=p.y;render();await vHit(t,dmgScale(c.dmg),c.n,'slash');v.x=keep.x;v.y=keep.y;v.face=keep.face;
      leaveDupe(v,p);break}
    default:return false;
  }
  log('vill',c.txt||cardText(c,sd.vkey));render();return true;
}
async function collection(){const sd=S.sd;
  for(const m of sd.hench.filter(m=>m.owner==='cantor'&&!m.elite&&!m.shadow)){
    m.collectionRound=sd.round;
    let cv=sd.civs.find(c=>c.held===m.id);const held=!!cv;
    if(!cv)cv=sd.civs.filter(c=>!civHeld(c)).sort((a,b)=>cheb(m,a)-cheb(m,b))[0];if(!cv)continue;
    for(let i=0;i<2;i++){
      if(!held&&cheb(m,cv)<=1)break;
      const edge=p=>Math.min(p.x,p.y,N-1-p.x,N-1-p.y),score=p=>held?edge(p):cheb(p,cv);
      const p=nbrs(m).filter(p=>inB(p.x,p.y)&&!blocked(p.x,p.y)).sort((a,b)=>score(a)-score(b))[0];if(!p||score(p)>=score(m))break;
      const old={x:m.x,y:m.y};m.x=p.x;m.y=p.y;if(held){cv.x=old.x;cv.y=old.y;cv.f=null}
    }
    if(cheb(m,cv)<=1){cv.f=null;cv.held=m.id;log('vill',held?'A hired gun drags a captive toward the edge.':'A hired gun takes a civilian into custody.')}
  }
}
async function resolveBossSetup(v){
  bossObserve();const sd=S.sd;delete v.circuit;
  if(v.solarHeat!=null){const heat=v.solarHeat;delete v.solarHeat;
    for(const u of live().filter(u=>dV(u,v)<=2)){if(heat&&!await wardBlocks(u))damageHero(u,heat)}
    log('vill',`Solar Debt releases ${heat} Heat.`);
    if(heat>=3){refillPages(v);const c=v.deck.shift();if(c){v.wounds.push(c);markSeen(sd.vkey,c.id);log('hero',`Solar overload tears ${c.n} from the draw pile.`);if(!remainingPages(v)){v.down=true;if(sd.vl.every(o=>o.v.down))endSd('win')}}}
    checkLoss();
  }
  const st=v.setup;delete v.setup;
  if(st&&st.type==='renovate'){
    sd.obs=sd.obs.filter(k=>!st.zone.includes(k));sd.walls=sd.walls.filter(w=>w.perm||!st.zone.includes(w.k));
    for(const k of st.edge){const p=bossPoint(k);if(!blocked(p.x,p.y)&&!sd.exits.includes(k))sd.walls.push({k,ttl:3})}
    log('vill','Renovation Notice: old cover disappears; empty perimeter hexes become walls.');
  }
  if(st&&st.type==='heave'){
    const occupants=[...live(),...sd.civs,...sd.hench];
    for(const u of occupants.filter(p=>st.zone.includes(bossKey(p)))){
      const dest=freeTiles((x,y)=>!st.zone.includes(x+','+y)&&!(sd.haz||[]).some(h=>h.k===x+','+y)&&!litMap()[x+','+y]).sort((a,b)=>cheb(a,u)-cheb(b,u))[0];
      if(dest&&!u.anchor){u.x=dest.x;u.y=dest.y;}
      else if(sd.units.includes(u))damageHero(u,2);
      else if(sd.hench.includes(u))u.hp-=2;
      else harmCiv(u,'Tectonic Heave');
    }
    sd.hench=sd.hench.filter(m=>m.hp>0);
    for(const k of st.zone){const p=bossPoint(k);if(!blocked(p.x,p.y)&&!sd.exits.includes(k))sd.obs.push(k)}
    log('vill','Tectonic Heave: the marked line rises into rubble.');checkLoss();
  }
  delete v.shadowMark;
  if(v.shadowId){const m=sd.hench.find(m=>m.id===v.shadowId);delete v.shadowId;
    if(m){sd.hench=sd.hench.filter(o=>o!==m);if(vFits(m.x,m.y,true)){const old={x:v.x,y:v.y};v.x=m.x;v.y=m.y;m.x=old.x;m.y=old.y;sd.hench.push(m);log('vill','Nocturne swaps with her stolen shadow. The spent copy fades.');sd.hench=sd.hench.filter(o=>o!==m);jumpDupe(v,old)}}
  }
  render();
}
function beginBorrowedAction(v){
  if(!v.borrowed||!v.sw)return ()=>{};
  const sd=S.sd,bindings=v.borrowed;delete v.borrowed;
  const original=swBodies(v),parts=original.flatMap((b,i)=>{const link=bindings.find(x=>x.k===b.k);if(!link)return [b];const m=sd.hench.find(m=>m.id===link.id&&m.hp>0);return m?[{...b,x:m.x,y:m.y}]:i?[]:[b]});
  // The lead body is never dropped, so even destroyed carriers leave a valid origin. A bound body can become the lead
  // when Murmur sheds the bodies in front of it; if its carrier is dead it stays where it is.
  const put=bs=>{v.x=bs[0].x;v.y=bs[0].y;v.face=bs[0].f;v.pk=bs.map(b=>b.k);v.sw=bs.slice(1).map(b=>({x:b.x,y:b.y,f:b.f}))};
  v.borrowRestore={original,bindings};put(parts);
  return ()=>restoreBorrowedBodies(v);
}

function restoreBorrowedBodies(v){
  if(!v.borrowRestore)return;
  const {original,bindings}=v.borrowRestore,after=swBodies(v);delete v.borrowRestore;
  const bs=original.map(b=>{if(bindings.some(x=>x.k===b.k))return b;const a=after.find(a=>a.k===b.k);return a&&!original.some(o=>o.k!==b.k&&o.x===a.x&&o.y===a.y)?a:b});
  v.x=bs[0].x;v.y=bs[0].y;v.face=bs[0].f;v.pk=bs.map(b=>b.k);v.sw=bs.slice(1).map(b=>({x:b.x,y:b.y,f:b.f}));
  for(const m of S.sd.hench)if(bindings.some(x=>x.id===m.id)&&!v.borrowed?.some(x=>x.id===m.id))delete m.infested;
  if(!v.down)swSync(v);
}

/* Nocturne's shadow doubles (Tyler, 2026-10-30): an untouchable copy that repeats her next action from its own hex, then dissipates.
   They live in sd.dupes, not sd.hench, so no attack, blast or aura can reach them; they still occupy their hex. */
function leaveDupe(v,p){const sd=S.sd;if(sd.mimic||blocked(p.x,p.y))return;const id='dupe-'+sd.round+'-'+Math.random().toString(36).slice(2,6);
  const d={id,owner:sd.vkey,x:p.x,y:p.y};if(!sd.vturn&&v.planned)d.plan=JSON.parse(JSON.stringify(v.planned));(sd.dupes=sd.dupes||[]).push(d);(v.dupes=v.dupes||[]).push(id);log('vill','A shadow double lingers. It will mimic her next action, then dissipate.')}
/* the hex beside the least composed hero within rng (any hero if none), where a double steps out */
function doubleSpot(v,rng){const L=live();if(!L.length)return null;const inR=L.filter(u=>dV(u,v)<=rng),t=(inR.length?inR:L).sort((a,b)=>heroOf(a).comp-heroOf(b).comp||dV(a,v)-dV(b,v))[0];
  const p=freeTiles((x,y)=>cheb({x,y},t)===1).sort((a,b)=>cheb(a,v)-cheb(b,v))[0];if(!p){log('vill','Her shadow finds no room beside its prey.');return null}return {t,p}}
/* each double locks in its own copy of the page she has planned; tearing or skipping her page later does not touch it */
function planDupes(v){const sd=S.sd;if(!v.planned||!v.dupes)return;for(const m of sd.dupes||[])if(v.dupes.includes(m.id)&&!m.plan)m.plan=JSON.parse(JSON.stringify(v.planned))}
/* Tyler (2026-10-30): every jump or teleport Nocturne makes leaves a double at the hex she left. */
function jumpDupe(v,from){const sd=S.sd,o=sd.vl.find(o=>o.v===v);if(!o||!VILLAINS[o.key].dupeOnJump||v.down||(from.x===v.x&&from.y===v.y))return;const vi=sd.vi;focusV(sd.vl.indexOf(o));leaveDupe(v,from);focusV(vi)}
function takeDupes(v){const d=v.dupes||[];delete v.dupes;return d}
async function dupeTurn(v,c0,ids){const sd=S.sd;
  for(const id of ids){const m=(sd.dupes||[]).find(o=>o.id===id);if(!m)continue;sd.dupes=sd.dupes.filter(o=>o!==m);const c=m.plan||c0;
    if(c&&!sd.result&&!v.down&&live().length){const keep={x:v.x,y:v.y,face:v.face,hide:v.hide};v.x=m.x;v.y=m.y;sd.mimic=true;
      log('vill',`Her shadow double mimics ${c.n}.`);fxV('MIMIC!','say');
      try{await execCard(c)}finally{sd.mimic=false;v.x=keep.x;v.y=keep.y;v.face=keep.face;v.hide=keep.hide}checkLoss()}
    log('vill','The shadow double dissipates.');render()}}
/* Nocturne: heroes left Shaken (no composure) by some of her actions take extra damage. */
function shakenSting(c,L){if(!c.shakenDmg)return;for(const u of L){const h=heroOf(u);if(u.ko||h.comp>0||rankMod(h,'innate','unshake'))continue;
  fxU(u,'SHAKEN!','vhit');log('vill',`${c.n}: ${h.name} is Shaken and takes ${c.shakenDmg}.`);damageHero(u,c.shakenDmg)}}
