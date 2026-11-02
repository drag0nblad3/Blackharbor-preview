/* core/save.js: Game state S, the save key, save/load and every save migration (keep migrations when the save shape changes). */
const KEY='blackharbor-preview-v4';
let S;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{const t=localStorage.getItem(KEY);if(t){S=JSON.parse(t);if(S.sd){S.sd.busy=false;S.sd.vturn=false;S.sd.reactionContext=false;if(!S.sd.vl){S.sd.v.charge=S.sd.charge;S.sd.v.hex=S.sd.hex;S.sd.vl=[{key:S.sd.vkey,v:S.sd.v}];S.sd.vi=0}S.sd.v=S.sd.vl[S.sd.vi||0].v;N=S.sd.N||9}S.seen=S.seen||{};S.seenR=S.seenR||{};S.diff=diffClamp(S.diff);storyLoad();if(S.sd&&!S.sd.bombs)S.sd.bombs=[];if(S.sd&&!S.sd.beams)S.sd.beams=[];if(S.salvage&&S.salvage.serpent==null)S.salvage.serpent=0;if(S.salvage&&S.pool&&S.villains){const have=new Set([...S.pool,...S.villains.map(v=>v.key)]);['lode','noct','swarm','bomber','grid'].forEach(k=>{if(S.salvage[k]==null)S.salvage[k]=0;if(!have.has(k))S.pool.splice(rnd(S.pool.length+1)-1,0,k)})}if(S.sd&&!S.sd.hexv){try{migrateSd()}catch(e){}}if(S.sd&&!S.sd.exits)S.sd.exits=mkExits(S.sd.N||9,!!S.sd.finale);S.xover=S.xover||[];if(S.cre&&S.phase!=='hq'){S.cre=null;if(S.view==='create')S.view='mission'}if(S.inv){if(S.inv.peak==null)S.inv.peak=S.inv.clues;S.inv.found=S.inv.found||[]}if(!S.party){const had=roster();S.party=had.slice(0,4).map(h=>h.id);Object.keys(HERO_BASE).forEach(c=>{if(!S.heroes.some(h=>h.cls===c)){const n=newHero(c);giveStart(n);S.heroes.push(n)}})}if(!S.d20){S.heroes.forEach(h=>{if(h.base){h.base={...h.base};for(const k of ['acc','str','eva'])h.base[k]=(h.base[k]||0)*2}});S.d20=true}if(!S.str1){S.heroes.forEach(h=>{if(h.base){h.base={...h.base};h.base.str=(h.base.str||0)-1}});S.str1=true}if(!S.deck3){(S.villains||[]).forEach(v=>{if(v.level>1)addAdv(v,v.level-1)});S.deck3=true}if(!S.deck2){(S.villains||[]).forEach(v=>{const d=deckSize(v)-v.deck.length,nb=VILLAINS[v.key].base.length;if(d>0)addAdv(v,d);for(let i=d;i<0&&v.deck.length>nb;i++){v.deck.pop();v.advIdx=Math.max(0,v.advIdx-1)}});S.deck2=true}if(!S.mig3){S.heroes.forEach(h=>{const r=h.ranks;if(h.cls==='volt')[r.tech,r.magic]=[r.magic,r.tech];if(h.cls==='wisp')[r.magic,r.innate]=[r.innate,r.magic]});S.mig3=true}if(!S.disc5)migrateDisc5();if(!S.v22)migrateV22();if(!S.v59)migrateV59();
/* Version 61: new set pieces unlock for arcs already reached and villains already beaten */
if(!S.v61){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V61.map(k=>'gear:'+k)),add=it=>{if(fresh.has(it)&&!S.unlocked.includes(it))S.unlocked.push(it)};
  for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);(S.villains||[]).filter(v=>v.status==='captured'||v.beaten).forEach(v=>(DEFEAT_UNLOCK[v.key]||[]).forEach(add));S.v61=true}
/* Version 62: new blueprints follow the arcs already reached; stats moved between slots, so clamp health and composure */
if(!S.v62){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V62.map(k=>'gear:'+k)),add=it=>{if(fresh.has(it)&&!S.unlocked.includes(it))S.unlocked.push(it)};
  START_UNLOCK.forEach(add);for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);S.heroes.forEach(clampHero);S.v62=true}if(!S.v82)migrateV82();if(!S.v121)migrateV121();if(!S.v123)migrateV123();if(!S.v124)migrateV124();if(!S.v126)migrateV126();if(!S.v130)migrateV130();/* Version 132 (Tyler): heroes no longer sit out an issue after a knockout */if(!S.v132){(S.heroes||[]).forEach(h=>delete h.rest);S.v132=true}if(!S.v133)migrateV133();if(!S.noRattled){(S.heroes||[]).forEach(h=>{if(h.injuries&&h.injuries.includes('rattled')){h.injuries=h.injuries.filter(k=>k!=='rattled');clampHero(h)}});S.noRattled=true}
  /* Version 102: the new starter blueprints */['gear:baton','gear:knuckles','gear:goggles','gear:hood','gear:headband'].forEach(it=>{if(S.unlocked&&!S.unlocked.includes(it))S.unlocked.push(it)});migratePlans();return true}}catch(e){}return false}
/* Version 82: capture, interrogation, leads and the clue consumables are gone. Captured villains go free again (they keep their blueprints),
   a built Containment Cell is refunded, and Informant's Tips and Search Warrants are sold back for intel. */
/* Version 121: Main Hand / Off Hand. A main-only weapon in the off hand (or off-only in the main hand) moves over if that hand is free, else goes back to the armory */
/* Version 123: unlock the new Off Hand gear for arcs already reached, and top villain playbooks up to the +3 per level size */
/* Version 124: open gear blueprints by tier for the Arc already reached */
/* Version 126: tier 3 blueprints for saves already past issue 10 */
/* Version 130: lasting injuries from the old injury roll are healed (Rattled stays). Heroes who already retired stay retired */
/* Balance pass: unequip new rank-3 items on earlier heroes while preserving their ownership. */
function migrateV133(){const moved=new Set(['mutagen','compeyes']);S.armory=S.armory||[];
  (S.heroes||[]).forEach(h=>{for(const slot of ['head','legs']){const k=h.gear&&h.gear[slot];if(k&&moved.has(k)&&!canWear(h,k)){S.armory.push(k);delete h.gear[slot]}}clampHero(h)});
  if((S.issue||1)<TIER3_ISSUE)S.unlocked=(S.unlocked||[]).filter(it=>!moved.has(it.slice(5)));
  else for(const k of moved)if(!S.unlocked.includes('gear:'+k))S.unlocked.push('gear:'+k);
  if(S.sd&&S.sd.units)S.sd.units.forEach(u=>{const h=heroOf(u);if(h&&u.res){u.res.tech=Math.min(u.res.tech,pwrMax(h));u.res.magic=Math.min(u.res.magic,arcMax(h))}});
  S.v133=true}
function migrateV130(){(S.heroes||[]).forEach(h=>{if(h.injuries&&h.injuries.some(k=>k!=='rattled')){h.injuries=h.injuries.filter(k=>k==='rattled');clampHero(h)}});S.v130=true}
function migrateV126(){const add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};if((S.issue||1)>=TIER3_ISSUE)MID_UNLOCK.forEach(add);if(arcOf(Math.min(S.issue||1,MAX_ISSUE))>=3)ARC_UNLOCK[3].forEach(add);S.v126=true}
function migrateV124(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};
  START_UNLOCK.forEach(add);for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);S.v124=true}
function migrateV123(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};
  ['gear:riotshield','gear:bonebuckler','gear:wardtome'].forEach(add);if(arc>=2)['gear:kinbuckler','gear:scramblepad','gear:quillguard','gear:veillantern'].forEach(add);if(arc>=3)['gear:aegisgen','gear:ironbark','gear:sanctaegis'].forEach(add);
  (S.villains||[]).forEach(vs=>{const n=deckSize(vs)-vs.deck.length;if(n>0)addAdv(vs,n)});S.v123=true}
function migrateV121(){(S.heroes||[]).forEach(h=>{const g=h.gear||{};
  const bad=(s,x)=>x&&GEAR[x]&&!GEAR[x].two&&GEAR[x].hand===(s==='arms'?'off':'main');
  if(bad('arms',g.arms)&&bad('arms2',g.arms2))[g.arms,g.arms2]=[g.arms2,g.arms];
  for(const s of ['arms','arms2']){const x=g[s];if(!bad(s,x))continue;const o=s==='arms'?'arms2':'arms';delete g[s];if(!g[o])g[o]=x;else S.armory.push(x)}
  clampHero(h)});S.v121=true}
function migrateV82(){const gone=['c_tip','c_warrant'];let sold=0;const keep=g=>{if(gone.includes(g)){sold+=g==='c_warrant'?2:1;return false}return true};
  (S.villains||[]).forEach(v=>{if(v.status==='captured'){v.status='active';v.scheme=0;v.beaten=(v.beaten||0)+1}delete v.interrogated});
  if((S.facilities||[]).includes('cell')){S.facilities=S.facilities.filter(f=>f!=='cell');S.tech+=5;S.intel+=3}
  S.unlocked=(S.unlocked||[]).filter(it=>it!=='fac:cell'&&!gone.some(g=>it==='gear:'+g));
  S.armory=(S.armory||[]).filter(keep);(S.heroes||[]).forEach(h=>{if(h.pouch)h.pouch=h.pouch.filter(keep)});S.intel+=sold;
  delete S.leads;if(S.phase==='intg'){S.phase='hq';S.view='hq'}delete S.intg;S.v82=true}
/* v20: ranks cap at 5 (extra ranks move to the lowest other discipline), fights in progress get the new pools, and campaigns already in Arc 2 or 3 get the new blueprints */

/* Version 22 saves: stats drop with the per-rank perks, heroes get a pouch, and the new blueprints follow the arcs already reached */
function migrateV22(){S.heroes.forEach(h=>{h.pouch=h.pouch||[];h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});
  const arc=arcOf(Math.min(S.issue,MAX_ISSUE)),add=['gear:grapbelt','gear:satchel','gear:journal','gear:c_smoke','gear:c_flash','gear:c_stim','gear:c_salts','gear:c_charm'];
  if(arc>=2)add.push('gear:wiretap','gear:trophy','gear:sash','gear:c_frag','gear:c_batt','gear:c_vial','gear:c_adren');
  if(arc>=3)add.push('gear:bandolier','gear:champ','gear:censer');unlock(add);
  if(S.sd)S.sd.units.forEach(u=>{u.innUsed=u.innUsed||0});S.v22=true}
/* Version 59: new set items unlock for arcs already reached; stats moved, so clamp health and composure */
function migrateV59(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V59.map(k=>'gear:'+k));
  for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).filter(it=>fresh.has(it)&&!S.unlocked.includes(it)).forEach(it=>S.unlocked.push(it));
  S.heroes.forEach(h=>{h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});S.v59=true}
function migrateDisc5(){S.heroes.forEach(h=>{const r=h.ranks;for(const t in r)while(r[t]>RANK_MAX){r[t]--;const o=Object.keys(r).filter(x=>r[x]<RANK_MAX).sort((a,b)=>r[a]-r[b])[0];if(o)r[o]++}h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});
  if(S.sd&&S.sd.units)S.sd.units.forEach(u=>{const h=heroOf(u);if(!h)return;const t0=u.res&&u.res.tech!=null?u.res.tech:pwrMax(h);u.res={tech:Math.min(pwrMax(h),t0),magic:arcMax(h)};u.innUsed=0});
  const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V20.map(k=>'gear:'+k));for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).filter(it=>fresh.has(it)&&!S.unlocked.includes(it)).forEach(it=>S.unlocked.push(it));
  if(!S.unlocked.includes('gear:runeblade'))S.unlocked.push('gear:runeblade');S.disc5=true}

/* a fight saved on the old square board keeps its positions as hex offsets; villains get their footprint and refreshed pages */
function migrateSd(){const sd=S.sd;sd.walls=sd.walls||[];sd.pits=sd.pits||[];sd.vl.forEach((o,i)=>{const v=o.v;v.shape=VILLAINS[o.key].shape;if(v.face==null)v.face=5;
    ['deck','discard','wounds'].forEach(f=>v[f]=(v[f]||[]).map(c=>buildCard(o.key,{id:c.id,mk:c.mk||0},v.level)));if(v.last)v.last=buildCard(o.key,{id:v.last.id,mk:v.last.mk||0},v.level);
    focusV(i);if(!vFits(v.x,v.y)){let best=null,bd=1e9;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y))continue;const d=cheb({x,y},v);if(d<bd){bd=d;best={x,y}}}if(best){v.x=best.x;v.y=best.y}}
    if(vBig(v))shoveOut(5)});focusV(sd.vi||0);sd.hexv=1}
