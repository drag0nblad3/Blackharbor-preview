/* Canonical campaign bot (2026-10-26): sim/abil-bot/bot.js (ABIL=1 uses gear abilities and powers) plus pw/ar pools per hero from sim/v124. Loaded by sim.js; do not run directly. */

/* ================= headless campaign bot ================= */
render=()=>{};
const MODE=process.env.MODE||'upgrade'; // 'upgrade' = craft upgrades for the party; 'collect' = also spend leftovers on new blueprints
const ETHB=process.env.ETHB||'public';
const STRATEGY=process.env.STRATEGY||'balanced';
const LOOT_MODE=process.env.LOOT_MODE||'planned'; // 'greedy' retains the prior bot for a control group
const PROFILES={
 balanced:{
  weights:{eva:1,acc:1,str:1,maxHp:1,maxComp:.5,maxArc:1,maxPwr:1,pwrRegen:2,move:3,speed:4,range:2,arcWound:2,pot:3},
  upgrades:['speed','str','acc','hp','eva','move','range','comp'],fac:[],focus:[]},
 assault:{
  weights:{eva:.4,acc:3.2,str:3.3,maxHp:.6,maxComp:.3,maxArc:.5,maxPwr:1,pwrRegen:1,move:2.5,speed:9,range:2.5,arcWound:1,pot:2},
  upgrades:['speed','acc','str','range','move','hp','eva','comp'],fac:['workshop','training','dojo','optics','reactor'],
  focus:['dice','str','acc','back','again']},
 fortress:{
  weights:{eva:5,acc:.6,str:.8,maxHp:5,maxComp:1.2,maxArc:1,maxPwr:1.2,pwrRegen:2,move:1.5,speed:1.5,range:1,arcWound:1,pot:2},
  upgrades:['eva','hp','comp','str','acc','speed','move','range'],fac:['medbay','workshop','antivenom','bunker'],
  focus:['dr','drAll','ward','absorb','heal','evaNext','eva']},
 mobility:{
  weights:{eva:3,acc:2,str:1.2,maxHp:1.1,maxComp:.6,maxArc:1,maxPwr:1,pwrRegen:1.5,move:8,speed:3,range:5,arcWound:1,pot:2},
  upgrades:['move','range','eva','speed','acc','str','hp','comp'],fac:['workshop','hangar','optics','training'],
  focus:['move','boost','jump','tele','eva']},
 support:{
  weights:{eva:2.2,acc:2.5,str:1,maxHp:2,maxComp:3,maxArc:4,maxPwr:4,pwrRegen:5,move:2,speed:2,range:3,arcWound:3,pot:5},
  upgrades:['comp','acc','hp','eva','speed','range','move','str'],fac:['comms','medbay','workshop','lab','sanctum'],
  focus:['heal','comp','rally','scry','hex','curse','gain','gainP','absorb']}
};
// 'Only' builds keep every party hero within a single discipline, including origin and gear.
// A fourth custom-origin recruit supplies a full party where the stock roster has only
// three unique heroes per discipline. Discipline ranks never spill into another track.
const ONLY_TRACK={techOnly:'tech',magicOnly:'magic',innateOnly:'innate'}[STRATEGY]||null;
if(!PROFILES[STRATEGY]&&!ONLY_TRACK&&STRATEGY!=='specialist')throw Error('Unknown campaign strategy: '+STRATEGY);
const PROFILE=PROFILES[STRATEGY]||PROFILES.balanced;
const ROLES=new Map();
const profileOf=h=>STRATEGY==='specialist'&&h?PROFILES[ROLES.get(h.id)||'balanced']:PROFILE;
const gearAllowed=(h,k)=>!ONLY_TRACK||(GEAR[k].type===ONLY_TRACK&&Object.keys(GEAR[k].reqs||{}).every(t=>t===ONLY_TRACK));
const roleScore=(h,role)=>{
 const b=BASE(h),P=PROFILES[role].weights;
 return P.speed*b.speed+P.acc*b.acc+P.str*b.str+
 P.eva*(b.eva-8)/2+P.maxHp*(b.maxHp-8)/2+
 P.move*b.move+P.range*b.range+P.maxComp*b.maxComp;
};
function assignSpecialistParty(){
 const unassigned=roster().slice(),chosen=[];
 for(const role of ['fortress','support','assault','assault']){
  unassigned.sort((a,b)=>roleScore(b,role)-roleScore(a,role));
  const h=unassigned.shift();if(!h)throw Error('Specialist party requires 4 heroes');
  ROLES.set(h.id,role);chosen.push(h.id);
 }
 S.party=chosen;
}
function recruitDisciplineParty(){
 const classes=shuffle(Object.keys(HERO_BASE).filter(k=>HERO_BASE[k].track===ONLY_TRACK));
 if(classes.length!==3)throw Error('Expected 3 stock origins for '+ONLY_TRACK);
 classes.forEach(cls=>click('qb:'+cls));
 // Custom origins are supported by the game; copy a same-discipline preset's
 // starting stats and power for a fourth non-hybrid party member.
 const model=HERO_BASE[classes[0]];
 const hero=newHero('custom',TRACKS[ONLY_TRACK].name+' Specialist',{...model,name:TRACKS[ONLY_TRACK].name+' Specialist'});
 S.heroes.push(hero);
 S.party=roster().map(h=>h.id);
 revealStartingVillains();
 if(S.party.length!==4)throw Error('Single-discipline party must have 4 heroes');
}
const click0=a=>{const el={dataset:{a},disabled:false,getAttribute:()=>null};const ev={target:{closest:s=>s==='[data-a]'?el:null},stopPropagation(){},preventDefault(){}};(__H.click||[]).forEach(f=>f(ev))};
let CUR=1;const IN={},CR=[];const sv=()=>({...S.salvage}),tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
const add=(src,n,vk)=>{if(!n)return;const a=IN[CUR]=IN[CUR]||{src:{},vil:{}};a.src[src]=(a.src[src]||0)+n;if(vk)a.vil[vk]=(a.vil[vk]||0)+n};
const rec=(src,b)=>{for(const k in S.salvage){const d=S.salvage[k]-(b[k]||0);if(d>0)add(src,d,k)}};
const click=a=>{if(a.startsWith('craft:')){const k=a.slice(6),G=GEAR[k];if(afford(G.cost))CR.push({arc:CUR,k,tier:G.cons?'cons':slotTier(G),set:!!G.set,c:Object.values(G.cost)[0]})}click0(a)};
const tick=()=>new Promise(r=>setImmediate(r));
async function idle(){let g=0;while(S.sd&&S.sd.busy&&g++<200000)await tick()}
const GEAR_KEYS=Object.keys(GEAR).filter(k=>!GEAR[k].cons);
const FAC_ORDER=[...new Set([...(STRATEGY==='specialist'?['workshop','training','medbay','comms','dojo','reactor']:PROFILE.fac),'workshop','skunk','medbay','training','comms','magnet','lab','cell','press','hangar','reactor','dojo','antivenom','bunker','sanctum','jammer','bombsq','optics'])];
const gScore=(k,h)=>{if(!k||!GEAR[k])return 0;const g=GEAR[k],P=profileOf(h),W=P.weights;let s=g.req*6;for(const[m,v]of Object.entries(g.mods||{}))s+=(W[m]||.5)*v;if(g.ab){s+=3;const f=g.ab.fx||{};s+=P.focus.filter(q=>q===g.ab.mode||Object.prototype.hasOwnProperty.call(f,q)).length*4;}if(g.field)s+=2;if(g.aura||g.auraFx)s+=2;return s};
const ST={crafted:new Set(),blockF:{tech:0,intel:0,both:0,none:0},blockG:{set:0,any:0,none:0},stalls:0,
 setGoals:[],bigGoal:null,setCrafts:0,bigCrafts:0,reserveSkips:0,goalCompleted:0};

function slotKeys(g){const G=GEAR[g];if(G.slot==='arms'&&!G.two&&G.hand)return G.hand==='main'?['arms']:G.hand==='off'?['arms2']:['arms','arms2'];return SLOT_KEYS[G.slot]||[G.slot]}
/* best upgrade gain for hero h if they wore item g */
function gain(h,g){const G=GEAR[g];if(G.two||G.cons||!canWear(h,g)||!gearAllowed(h,g))return 0;
  if(LOOT_MODE!=='greedy'){
    const pinned=new Set([...ST.setGoals.filter(p=>p.hid===h.id).flatMap(p=>p.items),...wornGear(h).filter(k=>GEAR[k].set&&setsOn(h).includes(GEAR[k].set))]);
    const slots=slotKeys(g);
    if(slots.some(s=>pinned.has(h.gear[s])&&h.gear[s]!==g))return 0;
  }if(Object.values(h.gear).includes(g)&&!(SLOT_KEYS[G.slot]))return 0;
  const ks=slotKeys(g);let worst=null,ws=1e9;for(const s of ks){const cur=h.gear[s];if(cur&&GEAR[cur].two)return 0;const sc=gScore(cur,h);if(sc<ws){ws=sc;worst=s}}
  return Math.max(0,gScore(g,h)-ws)}
function equipBest(hs){let did=true,g=0;while(did&&g++<50){did=false;
  for(const h of hs){let best=null,bg=0;for(const k of new Set(S.armory)){if(GEAR[k].cons)continue;const v=gain(h,k);if(v>bg){bg=v;best=k}}
    if(best){const ks=slotKeys(best);let worst=ks[0],ws=1e9;for(const s of ks){const sc=gScore(h.gear[s],h);if(sc<ws){ws=sc;worst=s}}
      if(h.gear[worst]&&ks.length>1){const o=h.gear[worst];delete h.gear[worst];S.armory.push(o)}
      if(equipHero(h,best))did=true}}}}
/* ---------- Salvage investment planner (bot only) ----------
   Boss salvage has opportunity cost: it buys four-piece sets as well as generic
   items. Allocate it to the most credible set goals before shopping. One global
   high-tier goal receives a modest any-salvage reserve. These reservations are
   virtual: only actual crafts spend resources, and the game rules are unchanged. */
function goalSlots(items){
  const slots=items.map(k=>GEAR[k].slot);
  return slots.length===new Set(slots).size&&items.every(k=>!GEAR[k].two);
}
function plausibleSet(h,items){
  const maximum={tech:h.ranks.tech,innate:h.ranks.innate,magic:h.ranks.magic};
  for(const k of items)for(const [t,n] of Object.entries(GEAR[k].reqs||{}))maximum[t]=Math.max(maximum[t],n);
  const need=Object.keys(maximum).reduce((n,t)=>n+Math.max(0,maximum[t]-h.ranks[t]),0);
  // No speculative hybrid investments in a pure-discipline strategy.
  return need<=2&&items.every(k=>gearAllowed(h,k)&&GEAR[k].req<=lvlOf(h)+2);
}
function ownedFor(h,k){return Object.values(h.gear).includes(k)||S.armory.includes(k)}
function setCandidates(h,boss){
  const all=GEAR_KEYS.filter(k=>GEAR[k].set===boss&&gearAllowed(h,k)&&!GEAR[k].two);
  const result=[];
  for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++)
  for(let d=b+1;d<all.length;d++)for(let e=d+1;e<all.length;e++){
    const items=[all[a],all[b],all[d],all[e]];
    if(!goalSlots(items)||!plausibleSet(h,items))continue;
    const owned=items.filter(k=>ownedFor(h,k)).length;
    const remaining=items.filter(k=>!ownedFor(h,k)).reduce((n,k)=>n+(GEAR[k].cost[boss]||0),0);
    const ready=items.filter(k=>canWear(h,k)&&isUnlocked('gear:'+k)).length;
    const newValue=items.reduce((n,k)=>n+gScore(k,h)/25,0);
    const future=items.filter(k=>!canWear(h,k)||!isUnlocked('gear:'+k)).length;
    // Completing a set matters more than maximizing each individual item.
    const value=(16+newValue+owned*5+ready*2)/(4+remaining+future*2);
    result.push({hid:h.id,boss,items,score:value,remaining,owned,ready});
  }
  return result.sort((a,b)=>b.score-a.score)[0];
}
function planSetGoals(hs){
  const bosses=[...new Set(S.villains.map(v=>v.key))].filter(k=>SETS[k]);
  const choices=hs.flatMap(h=>bosses.map(b=>setCandidates(h,b)).filter(p=>p&&p.ready>=3&&S.issue>=7&&
    (STRATEGY!=='mobility'||['helios','bomber'].includes(p.boss))))
    .sort((a,b)=>b.score-a.score);
  const chosen=[],seenH=new Set(),seenB=new Set();
  // Retain a viable previous commitment: don't constantly abandon progress.
  for(const old of ST.setGoals){
    const h=hs.find(h=>h.id===old.hid);
    if(h&&bosses.includes(old.boss)&&plausibleSet(h,old.items)&&!seenH.has(h.id)&&!seenB.has(old.boss)){
      chosen.push({...old,score:setCandidates(h,old.boss)?.score||old.score});
      seenH.add(h.id);seenB.add(old.boss);
    }
  }
  for(const option of choices){
    if(chosen.length>=1)break;
    if(seenH.has(option.hid)||seenB.has(option.boss))continue;
    // Don't hoard for a marginal plan when little salvage has appeared.
    if(option.score<1.65)continue;
    chosen.push(option);seenH.add(option.hid);seenB.add(option.boss);
  }
  ST.setGoals=chosen.slice(0,1);
}
function remainingSetCost(p){
  const h=roster().find(h=>h.id===p.hid);
  if(!h)return 0;
  return p.items.filter(k=>!ownedFor(h,k)).reduce((n,k)=>n+(GEAR[k].cost[p.boss]||0),0);
}
function setReserves(){
  const saved={};
  for(const p of ST.setGoals){
    // Preserve most of a boss's salvage, but never freeze every scrap of
    // early income. Other upgrades remain available while the set matures.
    const target=remainingSetCost(p),stock=S.salvage[p.boss]||0;
    // Mobility benefits from staying flexible: wait until a movement/range set
    // is nearly affordable rather than trading away early mobility upgrades.
    if(STRATEGY==='mobility'&&stock<target*0.75)continue;
    if(target)saved[p.boss]=(saved[p.boss]||0)+Math.min(target,Math.ceil(stock*(STRATEGY==='mobility'?0.40:0.70)));
  }
  return saved;
}
function freeSalvage(reserves){
  return Object.fromEntries(Object.entries(S.salvage).map(([k,n])=>[k,Math.max(0,n-(reserves[k]||0))]));
}
function availableAny(reserves){return Object.values(freeSalvage(reserves)).reduce((a,b)=>a+b,0)}
function allocateAny(cost,reserves){
  const free=freeSalvage(reserves),pick={};
  let remaining=cost;
  for(const [k,n] of Object.entries(free).sort((a,b)=>b[1]-a[1])){
    const take=Math.min(n,remaining);
    if(take)pick[k]=take;
    remaining-=take;if(!remaining)break;
  }
  return remaining===0?pick:null;
}
function craftPlanned(k,reserves){
  const g=GEAR[k];if(!afford(g.cost))return false;
  if(g.cost.any){
    const allocation=allocateAny(g.cost.any,reserves);
    if(!allocation){ST.reserveSkips++;return false}
    doCraft('craft',k,null,allocation);
  }else{
    if((S.salvage[g.set]||0)<g.cost[g.set])return false;
    doCraft('craft',k);
  }
  ST.crafted.add(k);
  CR.push({arc:CUR,k,tier:slotTier(g),set:!!g.set,c:Object.values(g.cost)[0]});
  if(g.set)ST.setCrafts++;
  if(g.req>=3)ST.bigCrafts++;
  return true;
}
function equipGoals(){
  for(const p of ST.setGoals){
    const h=party().find(h=>h.id===p.hid);
    if(!h)continue;
    for(const k of p.items){
      if(Object.values(h.gear).includes(k)||!isUnlocked('gear:'+k)||!canWear(h,k))continue;
      if(S.armory.includes(k))equipHero(h,k);
    }
  }
}
function completeSets(){
  for(const p of ST.setGoals){
    const h=party().find(h=>h.id===p.hid);
    if(h&&setOn(h,p.boss)&&!p.reported){ST.goalCompleted++;p.reported=true}
  }
}
function chooseBigGoal(hs,ok){
  const options=[];
  for(const h of hs)for(const k of GEAR_KEYS){
    const g=GEAR[k];
    if(g.set||g.req<3||!g.cost.any||!isUnlocked('gear:'+k)||!ok('gear:'+k)||!gearAllowed(h,k)||ownedFor(h,k))continue;
    if(g.two&&ST.setGoals.some(p=>p.hid===h.id&&p.items.some(i=>GEAR[i].slot==='arms')))continue;
    const deficit=Object.entries(g.reqs||{}).reduce((n,[t,rank])=>n+Math.max(0,rank-(h.ranks[t]||0)),0);
    if(deficit>1)continue;
    // Compute the gain in the intended slot without requiring wearability yet.
    const current=g.two?(gScore(h.gear.arms,h)+gScore(h.gear.arms2,h)):
      Math.min(...slotKeys(k).map(s=>gScore(h.gear[s],h)));
    const improvement=gScore(k,h)-current;
    if(improvement<(g.req>=4?20:28))continue;
    options.push({hid:h.id,k,score:improvement/(g.cost.any+2)*(deficit?0.8:1)});
  }
  const old=ST.bigGoal;
  if(old&&options.some(o=>o.hid===old.hid&&o.k===old.k))return old;
  return options.sort((a,b)=>b.score-a.score)[0]||null;
}
function plannedSpend(hs,ok){
  planSetGoals(hs);
  equipGoals();
  // Invest boss-specific salvage in the set before permitting generic upgrades.
  for(let guard=0;guard<22;guard++){
    let changed=false;
    for(const p of ST.setGoals){
      const h=hs.find(h=>h.id===p.hid);if(!h)continue;
      // Don't strand the hero in an incomplete, potentially weaker set.
      // Complete the four-piece package in one affordable investment.
      const allReady=p.items.every(k=>canWear(h,k)&&(ownedFor(h,k)||(isUnlocked('gear:'+k)&&ok('gear:'+k))));
      if(!allReady||S.salvage[p.boss]<remainingSetCost(p))continue;
      const next=p.items.filter(k=>!ownedFor(h,k))
        .sort((a,b)=>(GEAR[a].cost[p.boss]||0)-(GEAR[b].cost[p.boss]||0));
      if(next.length&&craftPlanned(next[0],{})){equipGoals();changed=true;break}
    }
    if(!changed)break;
  }
  equipGoals();completeSets();
  // Use all non-committed salvage for a significant rank-3+ upgrade first.
  const setHold=setReserves();
  ST.bigGoal=chooseBigGoal(hs,ok);
  if(ST.bigGoal){
    const target=ST.bigGoal;
    if(craftPlanned(target.k,setHold)){
      const h=hs.find(h=>h.id===target.hid);
      if(h&&canWear(h,target.k)&&S.armory.includes(target.k))equipHero(h,target.k);
      equipBest(hs);ST.bigGoal=null
    }
  }
  // When a big purchase is still pending, reserve the first available salvage
  // toward its cost, but let a small fraction fund cheaper emergency upgrades.
  const bigCost=ST.bigGoal?GEAR[ST.bigGoal.k].cost.any:0;
  let guard=0;
  while(guard++<40){
    const allHold={...setReserves()};
    // Reserve a fixed total across all boss types, but leave small-change salvage.
    const bigReserve=bigCost?Math.min(bigCost,Math.floor(availableAny(allHold)*(STRATEGY==='mobility'?0.15:0.45))):0;
    const candidates=[];
    for(const h of hs)for(const k of GEAR_KEYS){
      const g=GEAR[k];
      if(!isUnlocked('gear:'+k)||!ok('gear:'+k)||(!g.cost.any&&(!g.set||!g.cost[g.set]))||ownedFor(h,k))continue;
      // Rank-4+ generic equipment follows its dedicated saving target.
      // Boss-specific pieces are still valid standalone upgrades, even when
      // they don't belong to the one set currently being assembled.
      if(g.cost.any&&g.req>=4)continue;
      const v=gain(h,k);if(v<=0)continue;
      candidates.push({h,k,v,price:g.cost.any||g.cost[g.set]});
    }
    candidates.sort((a,b)=>b.v/b.price-a.v/a.price);
    let crafted=false;
    for(const t of candidates){
      const g=GEAR[t.k];
      const free=g.cost.any?availableAny(allHold):Math.max(0,(S.salvage[g.set]||0)-(allHold[g.set]||0));
      if(free<t.price||availableAny(allHold)-t.price<bigReserve){ST.reserveSkips++;continue}
      if(craftPlanned(t.k,g.cost.any?allHold:{})){equipBest(hs);equipGoals();crafted=true;break}
    }
    if(!crafted)break;
  }
  // Two-handed gear is not handled by the greedy one-slot scorer. Equip it
  // explicitly once its owner can wear it, including if it was crafted earlier.
  for(const h of hs)for(const k of [...new Set(S.armory)]){
    const g=GEAR[k];
    if(!g||!g.two||!g.cost.any||g.req<3||!canWear(h,k)||!gearAllowed(h,k))continue;
    if(ST.setGoals.some(p=>p.hid===h.id&&p.items.some(i=>GEAR[i].slot==='arms')))continue;
    const improvement=gScore(k,h)-gScore(h.gear.arms,h)-gScore(h.gear.arms2,h);
    if(improvement>16&&equipHero(h,k))break;
  }
  equipGoals();completeSets();
}

function spend(allowed){
  const ok=it=>!allowed||allowed.has(it);
  /* facilities, greedy in priority order */
  let built=true;while(built){built=false;for(const f of FAC_ORDER){if(S.facilities.includes(f)||!isUnlocked('fac:'+f)||!facOpen(f)||!ok('fac:'+f))continue;if(afford(FAC[f].cost)){click('build:'+f);built=true}}}
  /* free research */
  if(S.facilities.includes('skunk')&&!allowed)research(true);
  const hs=party();equipBest(roster());
  if(S.facilities.includes('workshop')&&LOOT_MODE!=='greedy'){
    if(STRATEGY==='mobility'){
      // The tactical bot needs immediate mobility gear. Only switch to a set
      // investment once a relevant four-piece package can be bought and worn.
      planSetGoals(hs);
      const p=ST.setGoals[0],h=p&&hs.find(x=>x.id===p.hid);
      const ready=p&&h&&p.items.every(k=>canWear(h,k)&&(ownedFor(h,k)||(isUnlocked('gear:'+k)&&ok('gear:'+k))));
      if(ready&&S.salvage[p.boss]>=remainingSetCost(p)){plannedSpend(hs,ok);return}
      ST.setGoals=[];ST.bigGoal=null;
    }else{plannedSpend(hs,ok);return}
  }
  if(S.facilities.includes('workshop')){
    let made=true,guard=0;while(made&&guard++<40){made=false;
      const cand=[];for(const h of hs)for(const k of GEAR_KEYS){if(!isUnlocked('gear:'+k)||!ok('gear:'+k))continue;const v=gain(h,k);if(v>0)cand.push({h,k,v,c:Object.values(GEAR[k].cost)[0]})}
      cand.sort((a,b)=>b.v/b.c-a.v/a.c);
      for(const o of cand){if(afford(GEAR[o.k].cost)){click('craft:'+o.k);ST.crafted.add(o.k);equipBest(hs);made=true;break}}}
    if(MODE==='collect'){let m=true;while(m){m=false;const c=GEAR_KEYS.filter(k=>isUnlocked('gear:'+k)&&ok('gear:'+k)&&!ST.crafted.has(k)&&!STARTER_LOCKER.includes(k)&&afford(GEAR[k].cost)).sort((a,b)=>Object.values(GEAR[a].cost)[0]-Object.values(GEAR[b].cost)[0]);if(c.length){click('craft:'+c[0]);ST.crafted.add(c[0]);m=true}}equipBest(roster())}}
}
function noteBlocks(){
  const f=FAC_ORDER.find(f=>!S.facilities.includes(f)&&isUnlocked('fac:'+f)&&facOpen(f));
  if(!f)ST.blockF.none++;else{const c=FAC[f].cost,t=(c.tech||0)>S.tech,i=(c.intel||0)>S.intel;ST.blockF[t&&i?'both':t?'tech':i?'intel':'none']++}
  if(!S.facilities.includes('workshop'))return;
  let any=0,set=0;for(const h of party())for(const k of GEAR_KEYS){if(!isUnlocked('gear:'+k)||gain(h,k)<=0||afford(GEAR[k].cost))continue;if(GEAR[k].cost.any)any++;else set++}
  if(!any&&!set)ST.blockG.none++;else if(set>=any)ST.blockG.set++;else ST.blockG.any++}

function levelUps(){for(const h of roster()){let g=0;while(h.pendingUp>0&&g++<10){
  if(!h.trackPick){const m=ONLY_TRACK||BASE(h).track;let t=h.ranks[m]<RANK_MAX?m:ONLY_TRACK?null:Object.keys(TRACKS).filter(k=>h.ranks[k]<RANK_MAX).sort((a,b)=>h.ranks[a]-h.ranks[b])[0];
    if(t)click(`track:${h.id}:${t}`);else if(ONLY_TRACK)break;else h.trackPick='none'}
  const ch=shuffle(Object.keys(UPG).filter(k=>k!=='range'||stat(h,'range')>1)).slice(0,3);const pref=profileOf(h).upgrades;
  ch.sort((a,b)=>pref.indexOf(a)-pref.indexOf(b));click(`up:${h.id}:${ch[0]}`)}}}
function pickParty(){
 if(STRATEGY==='specialist'){S.party=roster().filter(h=>ROLES.has(h.id)).map(h=>h.id);return}
 if(ONLY_TRACK){S.party=roster().filter(h=>BASE(h).track===ONLY_TRACK).slice(0,4).map(h=>h.id);return}
 const score=h=>{const alive=3*h.hp/stat(h,'maxHp'),base=lvlOf(h)+alive;if(STRATEGY==='balanced')return base;const p=PROFILE.weights,cl=BASE(h);const v=(p.speed*cl.speed+p.acc*cl.acc+p.str*cl.str+p.eva*(cl.eva-8)/2+p.maxHp*(cl.maxHp-8)/2+p.move*cl.move+p.range*cl.range+p.maxComp*cl.maxComp)/30;return base+v};const r=roster().slice().sort((a,b)=>score(b)-score(a));S.party=r.slice(0,4).map(h=>h.id)}

function optScore(o){if(o.ok&&!o.ok())return -99;const t=o.h;let s=0,m;
  if((m=t.match(/Roll (\d+)\+ for (\d) clue/)))s+=(21-+m[1])/20*3*+m[2];else if((m=t.match(/\+(\d) clue/)))s+=3*+m[1];
  if((m=t.match(/Roll (\d+)\+ for (\d) intel/)))s+=2.5*+m[2]*(21-+m[1])/20;else if((m=t.match(/\+(\d) intel/)))s+=2.5*+m[1];
  if((m=t.match(/\+(\d) tech/)))s+=1.2*+m[1];
  if(/\+1 (salvage|Coils|Shards|Ledgers|Rebar|Sunstone|Scales|Lodestones|Umbra|Chitin|Fuses|Lenses)/.test(t))s+=1.5;
  if(/\+1 trust/.test(t))s+=1;if(/−1 trust|-1 trust/.test(t))s-=2;
  if(/Costs 1 intel/.test(t))s-=2.5;if(/Costs 1 tech/.test(t))s-=1.2;if(/takes 2/.test(t))s-=.6;if(/takes 1/.test(t))s-=.3;
  if(/[Uu]nlock|blueprint/.test(t))s+=2;if(/scheme|slow/i.test(t))s+=1.5;return s+Math.random()*.01}

/* ---------- combat ---------- */
function bestV(u){let bi=-1,bd=1e9;S.sd.vl.forEach((o,i)=>{if(o.v.down)return;const d=dV(u,o.v);if(d<bd){bd=d;bi=i}});return bi}
function danger(k){const sd=S.sd;let s=0;if(sd.haz&&sd.haz.some(h=>h.k===k))s+=40;if(litMap()[k])s+=30;const[x,y]=k.split(',').map(Number);if((sd.bombs||[]).some(b=>{const p=bombP(b);return cheb(p,{x,y})<=bombRadius(b)}))s+=15;return s}
async function moveTo(u,score){const sd=S.sd,h=heroOf(u);if(u.moved)return;const r=reachH(u,stat(h,'move')+(u.boost||0));
  let best=null,bs=score(u.x,u.y)-danger(u.x+','+u.y);for(const k of Object.keys(r)){const[x,y]=k.split(',').map(Number);if(sd.units.some(o=>o!==u&&!o.ko&&o.x===x&&o.y===y))continue;const s=score(x,y)-danger(k);if(s>bs){bs=s;best={x,y}}}
  if(best){sd.sel=sd.units.indexOf(u);sd.mode='move';onCell(best.x,best.y);await idle()}}
/* ---------- abilities (ported from combat-sim/bot.js) ---------- */
const ABIL=!!process.env.ABIL;
const ATK=['dice','str','acc','back','reap','callout','mark','hex'],DEF=['reflect','dr','drAll','absorb','evaNext','eva','ward','riposte','anchor','reactionWard','moveEva'],VDEB=['repress','reactionPeek','revealFacing','curse','blind','skip','tear','vsplash','excise','scry','bury','foresee','scramble','eclipse'];
function abKind(g){const f=g.ab.fx||{};if(g.ab.mode==='blast')return 'blast';if(g.ab.mode==='strike')return 'strike';if(g.ab.mode==='tele')return 'tele';if(g.ab.mode==='cover')return 'skip';
  if(f.again)return 'again';if(f.heal)return 'heal';if(ATK.some(k=>f[k]))return 'atk';if(VDEB.some(k=>f[k]))return 'deb';if(f.shock)return 'shock';
  if(DEF.some(k=>f[k]))return 'def';if(f.comp||f.rally)return 'comp';if(f.gain||f.gainP)return 'gain';if(f.boost||f.move)return 'move';return 'skip'}
const abList=h=>[...new Set(Object.values(h.gear))].filter(k=>GEAR[k].ab);
async function useAbK(u,h,k,ally){const sd=S.sd,g=GEAR[k];sd.sel=sd.units.indexOf(u);if(!abOk(u,h,k))return false;
  if(g.ab.mode==='ally'){sd.mode='abally';sd.abKey=k;const t=ally||u;await onCell(t.x,t.y);return true}
  if(g.ab.mode){return false}await useAb(k);return true}
async function botAbs(u,h,phase,will){const sd=S.sd;for(const k of abList(h)){if(sd.result||u.ko)return;const g=GEAR[k],kind=abKind(g),f=g.ab.fx||{};if(!abOk(u,h,k))continue;
    if(g.ab.mode==='ally'){const al=live().filter(o=>cheb(o,u)<=abV(g.ab.r,potOf(h))&&allyAbilityOK(u,o,g.ab));
      if(f.heal){const t=al.filter(o=>stat(heroOf(o),'maxHp')-heroOf(o).hp>=2).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];if(t&&phase==='pre')await useAbK(u,h,k,t)}
      else if(phase==='post'){const t=al.filter(o=>!o.evaNext&&dV(o,sd.v)<=2).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];if(t)await useAbK(u,h,k,t)}continue}
    if(phase==='pre'&&kind==='blast'){const [r,d]=f.blast;const tiles=sd.hench.filter(m=>cheb(m,u)<=g.ab.r&&!shotBlocked(u,m)).map(m=>({...m,score:sd.hench.filter(t=>cheb(t,m)<=r).reduce((s,t)=>s+Math.min(t.hp,d),0)})).sort((a,b)=>b.score-a.score);if(tiles.length){sd.sel=sd.units.indexOf(u);useAb(k);await onCell(tiles[0].x,tiles[0].y);}continue;}
    if(phase==='pre'&&f.reactionWard&&will&&!u.reactionWard)await useAbK(u,h,k);
    if(phase==='pre'){if(kind==='heal'&&stat(h,'maxHp')-h.hp>=3)await useAbK(u,h,k);
      else if(kind==='atk'&&will)await useAbK(u,h,k);else if(kind==='deb'&&dV(u,sd.v)<=6)await useAbK(u,h,k);
      else if(kind==='comp'&&h.comp<=Math.ceil(stat(h,'maxComp')/2))await useAbK(u,h,k);
      else if(kind==='gain')await useAbK(u,h,k)}
    else if(phase==='post'){if(kind==='def'&&dV(u,sd.v)<=3)await useAbK(u,h,k);
      else if(kind==='shock'&&sd.hench.some(m=>cheb(m,u)<=f.shock[0]))await useAbK(u,h,k)}}}
/* Signature powers. 'move' runs before moving, 'pre' after moving and before attacking, 'post' after attacking.
   Every power has a rule (2026-10-30, Tyler: the bot used to skip Brace, Quake, Patch Up, Barricade, Blur, Omen and others). */
/* Movement and board gear (2026-10-30, Tyler: every gear ability should get used). Boosts and Solar Dive before/after the move,
   teleports and leaps when the villain is still out of attack range, cover walls, Jackhammer next to the villain, Time Stop to save allies. */
const atkScore=(u,v,rng)=>(x,y)=>{const p={x,y},d=dV(p,v);if(d<=rng){const s=sideOf(p,v);return 100+(s==='rear'?10:s==='flank'?5:0)+(rng>1?Math.min(d,rng)*1.5:0)}return -d*2};
async function botMoveGear(u,h,phase){const sd=S.sd,v=sd.v,rng=stat(h,'range');if(!v||sd.result||u.ko)return;
  for(const k of abList(h)){if(sd.result||u.ko)return;const g=GEAR[k],a=g.ab,f=a.fx||{};sd.sel=sd.units.indexOf(u);if(!abOk(u,h,k))continue;
    if(phase==='move'&&f.boost&&!u.moved&&dV(u,v)>stat(h,'move')+rng){await useAbK(u,h,k);await idle();sd.mode=null;continue}
    if(phase==='pre'&&dV(u,v)>rng&&f.move&&u.moved){if(await useAbK(u,h,k)){await idle();sd.mode=null;u.moved=false;await moveTo(u,atkScore(u,v,rng))}continue}
    if(phase==='pre'&&dV(u,v)>rng&&a.mode==='tele'){const r=abV(a.r,potOf(h)),sc=atkScore(u,v,rng);let best=null,bs=sc(u.x,u.y);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cheb({x,y},u)>r||blocked(x,y))continue;const q=sc(x,y)-danger(x+','+y);if(q>bs){bs=q;best={x,y}}}
      if(best){sd.mode='abtele';sd.abKey=k;await onCell(best.x,best.y);await idle();sd.mode=null}continue}
    if(phase==='pre'&&f.breach&&dV(u,v)<=1){await useAbK(u,h,k);await idle();continue}
    if(phase==='post'&&f.stasis&&dV(u,v)<=4&&(live().some(o=>o!==u&&cheb(o,u)<=1&&heroOf(o).hp*2<=stat(heroOf(o),'maxHp'))||h.hp*2<=stat(h,'maxHp'))){await useAbK(u,h,k);await idle();continue}
    if(phase==='post'&&a.mode==='cover'&&dV(u,v)<=5){const r=abV(a.r,potOf(h));let best=null,bd=dV(u,v);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p={x,y};if(cheb(p,u)>r||cheb(p,u)<1||blocked(x,y)||cheb(p,u)!==1)continue;const d=dV(p,v);if(d<bd){bd=d;best=p}}
      if(best){sd.mode='abcover';sd.abKey=k;await onCell(best.x,best.y);await idle();sd.mode=null}}}}
/* Hybrid bridge perks that need a button (2026-10-30, Tyler). Augmented and Paragon are passive.
   Primal: Blood Price on while composure is above half. Technomancer: once per round, refill whichever pool is lower. */
function botBridge(u,h){const sd=S.sd;sd.sel=sd.units.indexOf(u);
  if(bridgeOn(h,'primal')){const want=h.comp*2>stat(h,'maxComp');if(!!u.bloodPay!==want)bridgeAct('blood')}
  if(bridgeOn(h,'techno')&&!u.convRd){const p=(u.res.tech||0)/Math.max(1,pwrMax(h)),a=(u.res.magic||0)/Math.max(1,arcMax(h));
    if(a<0.34&&p>0.5&&(u.res.tech||0)>=3)bridgeAct('toArc');else if(p<0.34&&a>0.5&&(u.res.magic||0)>=2)bridgeAct('toPwr')}}
async function botPower(u,h,phase){const sd=S.sd,pw=BASE(h).power;sd.sel=sd.units.indexOf(u);if(!powOk(u,h))return;
  const v=sd.v,hurt=o=>stat(heroOf(o),'maxHp')-heroOf(o).hp,low=o=>heroOf(o).comp<=Math.ceil(stat(heroOf(o),'maxComp')/2);
  if(phase==='move'){if(pw==='leap'&&!u.moved&&dV(u,v)>stat(h,'move')+stat(h,'range'))return usePower();return}
  if(phase==='pre'){
    if(pw==='berserk'||pw==='overclock'||pw==='mark'||pw==='curse')return usePower();
    if(pw==='regen'&&hurt(u)>=2)return usePower();
    if(pw==='omen'&&!sd.omenSalvage)return usePower();
    if(pw==='emp'&&dV(u,v)<=Math.min(3,stat(h,'range')))return usePower();
    if(pw==='drone'&&sd.hench.some(m=>cheb(m,u)<=3))return usePower();
    if(pw==='quake'&&(sd.hench.some(m=>cheb(m,u)<=1)||dV(u,v)<=1))return usePower();
    if(pw==='serene'&&live().filter(low).length>=2)return usePower();
    if(pw==='patch'){const t=live().filter(o=>cheb(o,u)<=3&&(hurt(o)>=3||low(o))).sort((a,b)=>hurt(b)-hurt(a))[0];if(t){usePower();if(sd.mode==='patch')await onCell(t.x,t.y);sd.mode=null}}
    return}
  if(phase==='post'){
    if(pw==='brace'&&dV(u,v)<=4&&live().some(o=>o!==u&&cheb(o,u)<=1))return usePower();
    if(pw==='blur'&&dV(u,v)<=4)return usePower();
    if(pw==='aegis'&&dV(u,v)<=4)return usePower();
    if(pw==='barricade'&&dV(u,v)<=5){const al=live().filter(o=>o!==u).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0]||u;let best=null,bd=1e9;
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p={x,y};if(cheb(p,u)>2||blocked(x,y)||cheb(p,al)!==1)continue;const d=dV(p,v);if(d<bd){bd=d;best=p}}
      if(best&&bd<dV(al,v)){usePower();if(sd.mode==='barricade')await onCell(best.x,best.y);sd.mode=null}}}}
async function attack(u){if(ABIL){const sd=S.sd,h=heroOf(u);if(!u.acted&&!u.ko&&!sd.result){const vi=bestV(u);if(vi>=0){focusV(vi);const v=sd.v;
    const st=abList(h).find(k=>GEAR[k].ab.mode==='strike'&&abOk(u,h,k)&&(!GEAR[k].ab.rng||dV(u,v)<=GEAR[k].ab.rng));sd.sel=sd.units.indexOf(u);
    if(st){sd.mode='abstrike';sd.abKey=st;const c=vCells(v)[0];await onCell(c.x,c.y);await idle();return}
    if(dV(u,v)<=4&&BASE(h).power==='drain'&&powOk(u,h)){sd.sel=sd.units.indexOf(u);usePower();await idle();return}
    if(dV(u,v)<=stat(h,'range')&&BASE(h).power==='arc'&&powOk(u,h)){const c=vCells(v).find(c=>cheb(u,c)<=stat(h,'range'));sd.mode='arc';await onCell(c.x,c.y);await idle();return}}}}
  return attack0(u)}
async function attack0(u){const sd=S.sd,h=heroOf(u);if(u.acted||u.ko||sd.result)return;const rng=stat(h,'range');sd.sel=sd.units.indexOf(u);
  const vi=bestV(u);if(vi>=0){const v=sd.vl[vi].v;if(dV(u,v)<=rng){const SR={rear:0,flank:1,front:2},c=vCells(v).filter(q=>cheb(u,q)<=rng).sort((a,b)=>SR[sideOf(u,v,v.sw?a:undefined)]-SR[sideOf(u,v,v.sw?b:undefined)])[0];
    sd.mode='attack';await onCell(c.x,c.y);await idle();return}}
  const m=sd.hench.find(m=>cheb(m,u)<=rng);if(m){sd.mode='attack';await onCell(m.x,m.y);await idle()}}
/* Tactics for the charging-slot rules: Avoid Damage, captives and satellites. */
let AVN=0,SATN=0,CAPN=0,SATUP=0;
/* Is this hero the likely target of a planned signature page? Known pages use
   their own targeting; unknown ones are assumed to hit the nearest hero. */
function sigThreat(u){const sd=S.sd;return sd.vl.some(o=>{const v=o.v,c=v.planned;if(v.down||!c||!c.sig)return false;
  if((v.turnDamage||0)+1>=chargeNeed(v))return false;
  const near=()=>live().slice().sort((a,b)=>dV(a,v)-dV(b,v))[0]===u;
  if(!plannedKnown(o.key,v))return near();
  if(c.t==='strike'){const vi=sd.vi;focusV(sd.vl.indexOf(o));const t=pickTarget(c.tgt||'nearest',(c.mv||0)+(c.rng||1));focusV(vi);return t===u}
  if(c.t==='henchvolley')return sd.hench.some(m=>cheb(m,u)<=(m.rng||1)+1);
  if(c.t==='charge'||c.zone)return false;   // windup hexes: the move step already dodges them
  return dV(u,v)<=(c.r||c.rng||3)})}
async function avoid(u){const sd=S.sd;if(u.acted||u.ko||sd.result||u.avoidDamage)return;sd.sel=sd.units.indexOf(u);await avoidDamage();await idle();if(u.avoidDamage)AVN++}
/* A hired gun holding a captive that this hero can reach and shoot this turn. */
function captorFor(u){const sd=S.sd,h=heroOf(u),reach=stat(h,'move')+(u.boost||0)+stat(h,'range');
  return sd.hench.filter(m=>m.owner==='cantor'&&sd.civs.some(c=>c.held===m.id)&&cheb(m,u)<=reach).sort((a,b)=>a.hp-b.hp||cheb(a,u)-cheb(b,u))[0]}
async function hitCaptor(u,m){const sd=S.sd,h=heroOf(u),rng=stat(h,'range');
  await moveTo(u,(x,y)=>{const d=cheb({x,y},m);return d<=rng?100-d:-d});
  if(!u.acted&&!sd.result&&cheb(m,u)<=rng&&!shotBlocked(u,m)){sd.sel=sd.units.indexOf(u);sd.mode='attack';await onCell(m.x,m.y);await idle();
    if(!sd.hench.includes(m))CAPN++;return true}return false}
/* Pull a satellite instead of attacking when this hero's attack is weak
   (3 dice or fewer), since the first wound would be absorbed anyway. */
async function pullSat(u){const sd=S.sd;if(u.acted||u.ko||sd.result)return false;const v=satelliteTarget(u);if(!v||stat(heroOf(u),'speed')>3)return false;
  sd.sel=sd.units.indexOf(u);await act(async()=>{u.acted=true;dropSatellite(v,u)});await idle();SATN++;return true}
async function heroTurn(u,resc){const sd=S.sd,h=heroOf(u);if(u.ko||sd.result)return;
  const bossReach=sd.vl.some(o=>!o.v.down&&dV(u,o.v)<=stat(h,'move')+(u.boost||0)+stat(h,'range'));
  if(resc?!sd.civs.some(c=>c.f==null&&!civHeld(c)):!bossReach){const m=captorFor(u);if(m&&!sd.units.some(o=>o!==u&&!o.ko&&o.huntId===m.id&&o.huntRound===sd.round)){u.huntId=m.id;u.huntRound=sd.round;
    if(await hitCaptor(u,m)){if(!sd.result&&!u.ko&&ABIL){await botAbs(u,h,'post',false);await idle()}return}}}
  if(resc){const free=sd.civs.filter(c=>c.f==null&&!civHeld(c)),fol=followers(u);
    const esc=async()=>{if(!u.acted&&sd.civs.some(c=>c.f==null&&!civHeld(c)&&cheb(c,u)<=1)){sd.sel=sd.units.indexOf(u);await escort();await idle()}};
    if(fol.length||free.length){await esc();
      const tgt=followers(u).length&&!free.some(c=>cheb(c,u)<=4)?sd.exits.map(e=>{const[x,y]=e.split(',').map(Number);return {x,y}}):free.length?free:sd.exits.map(e=>{const[x,y]=e.split(',').map(Number);return {x,y}});
      await moveTo(u,(x,y)=>-Math.min(...tgt.map(t=>cheb(t,{x,y}))));await esc();await attack(u);await avoid(u);return}}
  const vi=bestV(u);if(vi<0)return;focusV(vi);const v=sd.vl[vi].v,rng=stat(h,'range');
  if(ABIL){botBridge(u,h);await botPower(u,h,'move');await botMoveGear(u,h,'move');await idle()}
  await moveTo(u,(x,y)=>{const p={x,y},d=dV(p,v);if(d<=rng){const sd2=sideOf(p,v);return 100+(sd2==='rear'?10:sd2==='flank'?5:0)+(rng>1?Math.min(d,rng)*1.5:0)}return -d*2-(sd.hench.some(m=>cheb(m,p)<=1)?1:0)});
  if(sigThreat(u)&&(heroOf(u).hp*2<=stat(h,'maxHp')||(dV(u,v)>rng&&!sd.hench.some(m=>cheb(m,u)<=rng)))){if(ABIL){await botAbs(u,h,'pre',false);await botAbs(u,h,'post',false);await botPower(u,h,'post');await botMoveGear(u,h,'post');await idle()}await avoid(u);if(u.acted||sd.result||u.ko)return}
  if(await pullSat(u)){if(ABIL&&!sd.result&&!u.ko){await botAbs(u,h,'post',false);await idle()}return}
  if(ABIL){await botMoveGear(u,h,'pre');await idle();if(sd.result||u.ko)return}
  if(ABIL){const inR=dV(u,v)<=rng;await botAbs(u,h,'pre',inR);await botPower(u,h,'pre');await idle();if(sd.result||u.ko)return}
  await attack(u);
  if(ABIL&&!sd.result&&!u.ko){for(const k of abList(h))if(abKind(GEAR[k])==='again'&&abOk(u,h,k)&&!sd.result&&!u.ko){await useAbK(u,h,k);await idle();await attack(u)}
    if(!sd.result&&!u.ko){await botAbs(u,h,'post',false);await botPower(u,h,'post');await botMoveGear(u,h,'post');await idle()}}
  await avoid(u)}
const REC=[];let ABN=0,PWN=0;{const _pa=payAb,_pp=payPow;payAb=function(u,k){ABN++;return _pa(u,k)};payPow=function(u,h){PWN++;return _pp(u,h)}}
async function fight(){const sd=S.sd;ABN=0;PWN=0;AVN=0;SATN=0;CAPN=0;SATUP=0;
  REC.push({issue:S.issue,arc:arcOf(S.issue),fin:S.phase==='event'||!!sd.finale,vs:sd.vl.map(o=>({k:o.key,lv:o.v.level})),
    fac:S.facilities.slice(),hs:sd.units.map(u=>{const h=heroOf(u);return {c:h.cls||h.base||h.id,lv:lvlOf(h),disc:BASE(h).track,acc:stat(h,'acc'),str:stat(h,'str'),dice:stat(h,'speed'),eva:stat(h,'eva'),rng:stat(h,'range'),role:ROLES.get(h.id)||null,origin:BASE(h).track,sets:setsOn(h),gear:wornGear(h),ranks:{...h.ranks},ups:h.upgrades.slice(),pw:pwrMax(h),ar:arcMax(h)}})});let g=0;while((sd.round<1||sd.busy)&&g++<200000)await tick();
  let rounds=0;while(!sd.result&&rounds<40){rounds++;
    const L=sd.units.filter(u=>!u.ko);const resc=sd.civs.length?L.slice().sort((a,b)=>stat(heroOf(b),'move')-stat(heroOf(a),'move'))[0]:null;
    if(sd.vl.some(o=>!o.v.down&&o.v.satellites>0))SATUP++;
    for(const u of sd.units.slice()){if(sd.result)break;await heroTurn(u,u===resc)}
    if(sd.result)break;await villainPhase();await idle()}
  {const R=REC[REC.length-1];R.rounds=rounds;R.ko=sd.units.filter(u=>u.ko).length;R.hpLost=sd.units.reduce((t,u)=>{const h=heroOf(u);return t+Math.max(0,stat(h,'maxHp')-h.hp)},0);R.res=sd.result||'stall';R.ab=ABN;R.pw=PWN;R.av=AVN;R.sat=SATN;R.cap=CAPN;R.satUp=SATUP}
  if(!sd.result){ST.stalls++;endSd('escape')}
  return sd.result}

/* ---------- campaign ---------- */
function snap(label,allowed){const un=allowed?[...allowed]:S.unlocked;const uf=un.filter(i=>i.startsWith('fac:')).map(i=>i.slice(4)),ug=un.filter(i=>i.startsWith('gear:')&&!GEAR[i.slice(5)].cons).map(i=>i.slice(5));
  const owned=new Set([...ST.crafted,...STARTER_LOCKER.filter(k=>!GEAR[k].cons)]);
  return {label,issue:S.issue,facBuilt:S.facilities.length,facUnl:uf.length,facTot:Object.keys(FAC).length,
    gearOwned:ug.filter(k=>owned.has(k)).length,gearUnl:ug.length,gearTot:GEAR_KEYS.length,crafted:ST.crafted.size,
    tech:S.tech,intel:S.intel,salv:Object.values(S.salvage).reduce((a,b)=>a+b,0),
    unlCost:ug.filter(k=>!owned.has(k)).reduce((a,k)=>a+Object.values(GEAR[k].cost)[0],0),
    facCostT:uf.filter(f=>!S.facilities.includes(f)).reduce((a,f)=>a+(FAC[f].cost.tech||0),0),facCostI:uf.filter(f=>!S.facilities.includes(f)).reduce((a,f)=>a+(FAC[f].cost.intel||0),0),
    maxSet:Math.max(0,...roster().map(h=>Math.max(0,...Object.keys(SETS).map(k=>setCount(h,k))))),setHeroes:roster().filter(h=>setsOn(h).length).length,partySet:party().filter(h=>setsOn(h).length).length,
    setGoalCount:ST.setGoals.length,committedSetSalvage:Object.values(setReserves()).reduce((a,b)=>a+b,0),
    trust:S.trust,lvl:party().reduce((a,h)=>a+lvlOf(h),0)/4}}
async function campaign(){newCampaign();S.guide=null;S.ui={};
  if(ONLY_TRACK)recruitDisciplineParty();
  else{const cls=shuffle(Object.keys(HERO_BASE)).slice(0,6);cls.forEach(c=>click('qb:'+c));if(STRATEGY==='specialist')assignSpecialistParty()}
  const snaps=[],res={win:0,loss:0,escape:0,intg:0};let income={tech:0,intel:0,salv:0};
  let g=0;while(g++<400){
    if(S.phase==='over'||S.over&&S.phase!=='after')break;
    if(S.phase==='hq'){levelUps();pickParty();spend();noteBlocks();
      const caps=S.villains.filter(v=>v.status==='captured'&&(v.interrogated||0)<3),act=S.villains.filter(v=>v.status==='active');
      if(!process.env.NOINTG&&caps.length&&(!act.length||!act.some(v=>v.scheme>=2))){click('intg:'+caps[0].key);res.intg++;
        while(S.intg&&S.intg.step<S.intg.qs.length){const q=INTQ.find(x=>x.id===S.intg.qs[S.intg.step]);const os=q.opts();let bi=0,bs=-1e9;os.forEach((o,i)=>{const s=optScore(o);if(s>bs){bs=s;bi=i}});click('intgopt:'+bi);click('intgnext')}
        click('intgend');continue}
      const t=act.slice().sort((a,b)=>b.scheme-a.scheme||a.level-b.level)[0];if(!t){break}
      CUR=arcOf(S.issue);const b0=sv();click('inv:'+t.key);click('invgo');
      while(S.inv.step<3){const ev=evOf(S.inv.events[S.inv.step]);let bi=0,bs=-1e9;ev.opts.forEach((o,i)=>{const s=optScore(o);if(s>bs){bs=s;bi=i}});click('invopt:'+bi);click('invnext')}
      rec('investigation',b0);if(invQuality(S.inv.clues)==='prepared'){equipBest(party())}
      const consB=[];if(process.env.CONS){for(let i=0;i<+process.env.CONS;i++){const c=['c_smoke','c_stim','c_flash','c_salts','c_charm','c_chaff'].find(k=>GEAR[k]&&afford(GEAR[k].cost));if(c){click('craft:'+c);consB.push(c)}}}
      const pre={t:S.tech,i:S.intel,s:Object.values(S.salvage).reduce((a,b)=>a+b,0)};
      click('lair');const r=await fight();res[r]++;for(const c of consB){const i=S.armory.indexOf(c);if(i>=0)S.armory.splice(i,1)}
      const lastOfArc=S.issue%ISSUES_PER_ARC===0,U0=new Set(S.unlocked),arcN=arcOf(S.issue);
      const sd=S.sd,vk=sd.vkey,parts={};if(r==='win'){parts.base=3;parts.prepared=sd.quality==='prepared'?1:0;parts.harness=fieldCount('salvage');parts.magnet=S.facilities.includes('magnet')?1:0;parts.restraint=S.ethos.a==='restraint'?1:0}
      const b1=sv();click('debrief');{let d=tot(S.salvage)-tot(b1);if(r==='win'){for(const k in parts){add('lair '+k,parts[k],vk);d-=parts[k]}add('lair hooks',d,vk)}else add(r==='escape'?'escape':'loss/other',d,vk)}
      if(lastOfArc){const nx=ARC_UNLOCK[arcN+1]||[];const al=new Set(S.unlocked.filter(i=>U0.has(i)||!nx.includes(i)));spend(al);snaps.push(snap('Arc '+arcN,al))}
      {const b2=sv();if(S.after&&S.after.ethos)click(`ethos:${S.after.ethos}:${S.after.ethos==='a'?'restraint':ETHB}`);
      rec('other',b2);click('next');continue}}
    if(S.phase==='after'){if(S.after.ethos)click(`ethos:${S.after.ethos}:${S.after.ethos==='a'?'restraint':ETHB}`);click('next');continue}
    if(S.phase==='arc'){click('arcnext');continue}
    if(S.phase==='event'){levelUps();pickParty();spend();click('finale:rally');while(S.phase==='event'&&S.story&&S.story.q.length)click('storynext');const r=await fight();res['F'+r]=1;click('debrief');snaps.push(snap('Finale'));click('next');break}
    break}
  return {strategy:STRATEGY,rec:REC.splice(0),IN:JSON.parse(JSON.stringify(IN)),CR:CR.slice(),snaps,res,trust:S.trust,over:S.over,issue:S.issue,blockF:{...ST.blockF},blockG:{...ST.blockG},stalls:ST.stalls,loot:{mode:LOOT_MODE,setCrafts:ST.setCrafts,bigCrafts:ST.bigCrafts,reserveSkips:ST.reserveSkips,goalCompleted:ST.goalCompleted}}}
/* run N campaigns and return their records (sim.js calls this) */
async function runCampaigns(N,onDone){const out=[];
  for(let i=0;i<N;i++){ROLES.clear();for(const k in IN)delete IN[k];CR.length=0;ST.crafted=new Set();ST.blockF={tech:0,intel:0,both:0,none:0};ST.blockG={set:0,any:0,none:0};ST.stalls=0;ST.setGoals=[];ST.bigGoal=null;ST.setCrafts=0;ST.bigCrafts=0;ST.reserveSkips=0;ST.goalCompleted=0;
    try{out.push(await campaign())}catch(e){out.push({err:String(e.stack).slice(0,600)})}if(onDone)onDone(i,out[out.length-1])}
  return out}
