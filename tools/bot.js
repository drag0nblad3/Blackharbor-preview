/* Canonical campaign bot (2026-10-26): sim/abil-bot/bot.js (ABIL=1 uses gear abilities and powers) plus pw/ar pools per hero from sim/v124. Loaded by sim.js; do not run directly. */

/* ================= headless campaign bot ================= */
render=()=>{};
const MODE=process.env.MODE||'upgrade'; // 'upgrade' = craft upgrades for the party; 'collect' = also spend leftovers on new blueprints
const ETHB=process.env.ETHB||'public';
const click0=a=>{const el={dataset:{a},disabled:false,getAttribute:()=>null};const ev={target:{closest:s=>s==='[data-a]'?el:null},stopPropagation(){},preventDefault(){}};(__H.click||[]).forEach(f=>f(ev))};
let CUR=1;const IN={},CR=[];const sv=()=>({...S.salvage}),tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
const add=(src,n,vk)=>{if(!n)return;const a=IN[CUR]=IN[CUR]||{src:{},vil:{}};a.src[src]=(a.src[src]||0)+n;if(vk)a.vil[vk]=(a.vil[vk]||0)+n};
const rec=(src,b)=>{for(const k in S.salvage){const d=S.salvage[k]-(b[k]||0);if(d>0)add(src,d,k)}};
const click=a=>{if(a.startsWith('craft:')){const k=a.slice(6),G=GEAR[k];if(afford(G.cost))CR.push({arc:CUR,k,tier:G.cons?'cons':slotTier(G),set:!!G.set,c:Object.values(G.cost)[0]})}click0(a)};
const tick=()=>new Promise(r=>setImmediate(r));
async function idle(){let g=0;while(S.sd&&S.sd.busy&&g++<200000)await tick()}
const GEAR_KEYS=Object.keys(GEAR).filter(k=>!GEAR[k].cons);
const FAC_ORDER=['workshop','skunk','medbay','training','comms','magnet','lab','cell','press','hangar','reactor','dojo','antivenom','bunker','sanctum','jammer','bombsq','optics'];
const W={eva:1,acc:1,str:1,maxHp:1,maxComp:.5,maxArc:1,maxPwr:1,pwrRegen:2,move:3,speed:4,range:2,arcWound:2,pot:3};
const gScore=k=>{if(!k||!GEAR[k])return 0;const g=GEAR[k];let s=g.req*6;for(const[m,v]of Object.entries(g.mods||{}))s+=(W[m]||.5)*v;if(g.ab)s+=3;if(g.field)s+=2;if(g.aura||g.auraFx)s+=2;return s};
const ST={crafted:new Set(),blockF:{tech:0,intel:0,both:0,none:0},blockG:{set:0,any:0,none:0},stalls:0};

function slotKeys(g){const G=GEAR[g];if(G.slot==='arms'&&!G.two&&G.hand)return G.hand==='main'?['arms']:G.hand==='off'?['arms2']:['arms','arms2'];return SLOT_KEYS[G.slot]||[G.slot]}
/* best upgrade gain for hero h if they wore item g */
function gain(h,g){const G=GEAR[g];if(G.two||G.cons||!canWear(h,g))return 0;if(Object.values(h.gear).includes(g)&&!(SLOT_KEYS[G.slot]))return 0;
  const ks=slotKeys(g);let worst=null,ws=1e9;for(const s of ks){const cur=h.gear[s];if(cur&&GEAR[cur].two)return 0;const sc=gScore(cur);if(sc<ws){ws=sc;worst=s}}
  return Math.max(0,gScore(g)-ws)}
function equipBest(hs){let did=true,g=0;while(did&&g++<50){did=false;
  for(const h of hs){let best=null,bg=0;for(const k of new Set(S.armory)){if(GEAR[k].cons)continue;const v=gain(h,k);if(v>bg){bg=v;best=k}}
    if(best){const ks=slotKeys(best);let worst=ks[0],ws=1e9;for(const s of ks){const sc=gScore(h.gear[s]);if(sc<ws){ws=sc;worst=s}}
      if(h.gear[worst]&&ks.length>1){const o=h.gear[worst];delete h.gear[worst];S.armory.push(o)}
      if(equipHero(h,best))did=true}}}}
function spend(allowed){
  const ok=it=>!allowed||allowed.has(it);
  /* facilities, greedy in priority order */
  let built=true;while(built){built=false;for(const f of FAC_ORDER){if(S.facilities.includes(f)||!isUnlocked('fac:'+f)||!facOpen(f)||!ok('fac:'+f))continue;if(afford(FAC[f].cost)){click('build:'+f);built=true}}}
  /* free research */
  if(S.facilities.includes('skunk')&&!allowed)research(true);
  const hs=party();equipBest(roster());
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
  if(!h.trackPick){const m=BASE(h).track;let t=h.ranks[m]<RANK_MAX?m:Object.keys(TRACKS).filter(k=>h.ranks[k]<RANK_MAX).sort((a,b)=>h.ranks[a]-h.ranks[b])[0];if(t)click(`track:${h.id}:${t}`);else h.trackPick='none'}
  const ch=shuffle(Object.keys(UPG).filter(k=>k!=='range'||stat(h,'range')>1)).slice(0,3);const pref=['speed','str','acc','hp','eva','move','range','comp'];
  ch.sort((a,b)=>pref.indexOf(a)-pref.indexOf(b));click(`up:${h.id}:${ch[0]}`)}}}
function pickParty(){const r=roster().slice().sort((a,b)=>(lvlOf(b)+3*b.hp/stat(b,'maxHp'))-(lvlOf(a)+3*a.hp/stat(a,'maxHp')));S.party=r.slice(0,4).map(h=>h.id)}

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
function danger(k){const sd=S.sd;let s=0;if(sd.haz&&sd.haz.some(h=>h.k===k))s+=40;if(litMap()[k])s+=30;const[x,y]=k.split(',').map(Number);if((sd.bombs||[]).some(b=>{const p=bombP(b);return cheb(p,{x,y})<=1}))s+=15;return s}
async function moveTo(u,score){const sd=S.sd,h=heroOf(u);if(u.moved)return;const r=reachH(u,stat(h,'move')+(u.boost||0));
  let best=null,bs=score(u.x,u.y)-danger(u.x+','+u.y);for(const k of Object.keys(r)){const[x,y]=k.split(',').map(Number);if(sd.units.some(o=>o!==u&&!o.ko&&o.x===x&&o.y===y))continue;const s=score(x,y)-danger(k);if(s>bs){bs=s;best={x,y}}}
  if(best){sd.sel=sd.units.indexOf(u);sd.mode='move';onCell(best.x,best.y);await idle()}}
/* ---------- abilities (ported from combat-sim/bot.js) ---------- */
const ABIL=!!process.env.ABIL;
const ATK=['dice','str','acc','back','reap','callout','mark','hex'],DEF=['reflect','dr','drAll','absorb','evaNext','eva','ward','riposte','anchor'],VDEB=['curse','blind','skip','tear','vsplash','excise','scry','bury','foresee','scramble','eclipse'];
function abKind(g){const f=g.ab.fx||{};if(g.ab.mode==='strike')return 'strike';if(g.ab.mode==='tele')return 'tele';if(g.ab.mode==='cover')return 'skip';
  if(f.again)return 'again';if(f.heal)return 'heal';if(ATK.some(k=>f[k]))return 'atk';if(VDEB.some(k=>f[k]))return 'deb';if(f.shock)return 'shock';
  if(DEF.some(k=>f[k]))return 'def';if(f.comp||f.rally)return 'comp';if(f.gain||f.gainP)return 'gain';if(f.boost||f.move)return 'move';return 'skip'}
const abList=h=>[...new Set(Object.values(h.gear))].filter(k=>GEAR[k].ab);
async function useAbK(u,h,k,ally){const sd=S.sd,g=GEAR[k];sd.sel=sd.units.indexOf(u);if(!abOk(u,h,k))return false;
  if(g.ab.mode==='ally'){sd.mode='abally';sd.abKey=k;const t=ally||u;await onCell(t.x,t.y);return true}
  if(g.ab.mode){return false}await useAb(k);return true}
async function botAbs(u,h,phase,will){const sd=S.sd;for(const k of abList(h)){if(sd.result||u.ko)return;const g=GEAR[k],kind=abKind(g),f=g.ab.fx||{};if(!abOk(u,h,k))continue;
    if(g.ab.mode==='ally'){const al=live().filter(o=>cheb(o,u)<=abV(g.ab.r,potOf(h)));
      if(f.heal){const t=al.filter(o=>stat(heroOf(o),'maxHp')-heroOf(o).hp>=2).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];if(t&&phase==='pre')await useAbK(u,h,k,t)}
      else if(phase==='post'){const t=al.filter(o=>!o.evaNext&&dV(o,sd.v)<=2).sort((a,b)=>heroOf(a).hp-heroOf(b).hp)[0];if(t)await useAbK(u,h,k,t)}continue}
    if(phase==='pre'){if(kind==='heal'&&stat(h,'maxHp')-h.hp>=3)await useAbK(u,h,k);
      else if(kind==='atk'&&will)await useAbK(u,h,k);else if(kind==='deb'&&dV(u,sd.v)<=6)await useAbK(u,h,k);
      else if(kind==='comp'&&h.comp<=Math.ceil(stat(h,'maxComp')/2))await useAbK(u,h,k);
      else if(kind==='gain')await useAbK(u,h,k)}
    else if(phase==='post'){if(kind==='def'&&dV(u,sd.v)<=3)await useAbK(u,h,k);
      else if(kind==='shock'&&sd.hench.some(m=>cheb(m,u)<=f.shock[0]))await useAbK(u,h,k)}}}
async function botPower(u,h,phase){const sd=S.sd,pw=BASE(h).power;sd.sel=sd.units.indexOf(u);if(!powOk(u,h))return;
  if(phase==='pre'&&(pw==='berserk'||pw==='overclock'||pw==='mark'))return usePower();
  if(phase==='pre'&&pw==='curse'&&dV(u,sd.v)<=4)return usePower();
  if(phase==='pre'&&pw==='regen'&&stat(h,'maxHp')-h.hp>=2)return usePower()}
async function attack(u){if(ABIL){const sd=S.sd,h=heroOf(u);if(!u.acted&&!u.ko&&!sd.result){const vi=bestV(u);if(vi>=0){focusV(vi);const v=sd.v;
    const st=abList(h).find(k=>GEAR[k].ab.mode==='strike'&&abOk(u,h,k)&&(!GEAR[k].ab.rng||dV(u,v)<=GEAR[k].ab.rng));sd.sel=sd.units.indexOf(u);
    if(st){sd.mode='abstrike';sd.abKey=st;const c=vCells(v)[0];await onCell(c.x,c.y);await idle();return}
    if(dV(u,v)<=stat(h,'range')&&BASE(h).power==='arc'&&powOk(u,h)){const c=vCells(v).find(c=>cheb(u,c)<=stat(h,'range'));sd.mode='arc';await onCell(c.x,c.y);await idle();return}}}}
  return attack0(u)}
async function attack0(u){const sd=S.sd,h=heroOf(u);if(u.acted||u.ko||sd.result)return;const rng=stat(h,'range');sd.sel=sd.units.indexOf(u);
  const vi=bestV(u);if(vi>=0){const v=sd.vl[vi].v;if(dV(u,v)<=rng){const SR={rear:0,flank:1,front:2},c=vCells(v).filter(q=>cheb(u,q)<=rng).sort((a,b)=>SR[sideOf(u,v,v.sw?a:undefined)]-SR[sideOf(u,v,v.sw?b:undefined)])[0];
    sd.mode='attack';await onCell(c.x,c.y);await idle();return}}
  const m=sd.hench.find(m=>cheb(m,u)<=rng);if(m){sd.mode='attack';await onCell(m.x,m.y);await idle()}}
async function heroTurn(u,resc){const sd=S.sd,h=heroOf(u);if(u.ko||sd.result)return;
  if(resc){const free=sd.civs.filter(c=>c.f==null&&!civHeld(c)),fol=followers(u);
    const esc=async()=>{if(!u.acted&&sd.civs.some(c=>c.f==null&&!civHeld(c)&&cheb(c,u)<=1)){sd.sel=sd.units.indexOf(u);await escort();await idle()}};
    if(fol.length||free.length){await esc();
      const tgt=followers(u).length&&!free.some(c=>cheb(c,u)<=4)?sd.exits.map(e=>{const[x,y]=e.split(',').map(Number);return {x,y}}):free.length?free:sd.exits.map(e=>{const[x,y]=e.split(',').map(Number);return {x,y}});
      await moveTo(u,(x,y)=>-Math.min(...tgt.map(t=>cheb(t,{x,y}))));await esc();await attack(u);return}}
  const vi=bestV(u);if(vi<0)return;focusV(vi);const v=sd.vl[vi].v,rng=stat(h,'range');
  await moveTo(u,(x,y)=>{const p={x,y},d=dV(p,v);if(d<=rng){const sd2=sideOf(p,v);return 100+(sd2==='rear'?10:sd2==='flank'?5:0)+(rng>1?Math.min(d,rng)*1.5:0)}return -d*2-(sd.hench.some(m=>cheb(m,p)<=1)?1:0)});
  if(ABIL){const inR=dV(u,v)<=rng;await botAbs(u,h,'pre',inR);await botPower(u,h,'pre');await idle();if(sd.result||u.ko)return}
  await attack(u);
  if(ABIL&&!sd.result&&!u.ko){for(const k of abList(h))if(abKind(GEAR[k])==='again'&&abOk(u,h,k)&&!sd.result&&!u.ko){await useAbK(u,h,k);await idle();await attack(u)}
    if(!sd.result&&!u.ko){await botAbs(u,h,'post',false);await idle()}}}
const REC=[];let ABN=0,PWN=0;{const _pa=payAb,_pp=payPow;payAb=function(u,k){ABN++;return _pa(u,k)};payPow=function(u,h){PWN++;return _pp(u,h)}}
async function fight(){const sd=S.sd;ABN=0;PWN=0;
  REC.push({issue:S.issue,arc:arcOf(S.issue),fin:S.phase==='event'||!!sd.finale,vs:sd.vl.map(o=>({k:o.key,lv:o.v.level})),
    fac:S.facilities.slice(),hs:sd.units.map(u=>{const h=heroOf(u);return {c:h.cls||h.base||h.id,lv:lvlOf(h),disc:BASE(h).track,acc:stat(h,'acc'),str:stat(h,'str'),dice:stat(h,'speed'),eva:stat(h,'eva'),rng:stat(h,'range'),sets:setsOn(h),gear:wornGear(h),ranks:{...h.ranks},ups:h.upgrades.slice(),pw:pwrMax(h),ar:arcMax(h)}})});let g=0;while((sd.round<1||sd.busy)&&g++<200000)await tick();
  let rounds=0;while(!sd.result&&rounds<40){rounds++;
    const L=sd.units.filter(u=>!u.ko);const resc=sd.civs.length?L.slice().sort((a,b)=>stat(heroOf(b),'move')-stat(heroOf(a),'move'))[0]:null;
    for(const u of sd.units.slice()){if(sd.result)break;await heroTurn(u,u===resc)}
    if(sd.result)break;await villainPhase();await idle()}
  {const R=REC[REC.length-1];R.rounds=rounds;R.ko=sd.units.filter(u=>u.ko).length;R.hpLost=sd.units.reduce((t,u)=>{const h=heroOf(u);return t+Math.max(0,stat(h,'maxHp')-h.hp)},0);R.res=sd.result||'stall';R.ab=ABN;R.pw=PWN}
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
    trust:S.trust,lvl:party().reduce((a,h)=>a+lvlOf(h),0)/4}}
async function campaign(){newCampaign();S.guide=null;S.ui={};
  const cls=shuffle(Object.keys(HERO_BASE)).slice(0,6);cls.forEach(c=>click('qb:'+c));
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
    if(S.phase==='event'){levelUps();pickParty();spend();click('finale:rally');const r=await fight();res['F'+r]=1;click('debrief');snaps.push(snap('Finale'));click('next');break}
    break}
  return {rec:REC.splice(0),IN:JSON.parse(JSON.stringify(IN)),CR:CR.slice(),snaps,res,trust:S.trust,over:S.over,issue:S.issue,blockF:{...ST.blockF},blockG:{...ST.blockG},stalls:ST.stalls}}
/* run N campaigns and return their records (sim.js calls this) */
async function runCampaigns(N,onDone){const out=[];
  for(let i=0;i<N;i++){for(const k in IN)delete IN[k];CR.length=0;ST.crafted=new Set();ST.blockF={tech:0,intel:0,both:0,none:0};ST.blockG={set:0,any:0,none:0};ST.stalls=0;
    try{out.push(await campaign())}catch(e){out.push({err:String(e.stack).slice(0,600)})}if(onDone)onDone(i,out[out.length-1])}
  return out}
