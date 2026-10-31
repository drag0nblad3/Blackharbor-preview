/* heroes/stats.js: Hero numbers: level, pools (power/arcana/innate), stat(), hands and slots, worn gear, auras, equip planning, roster/party helpers, clampHero. */
const lvlOf=h=>h.ranks.tech+h.ranks.innate+h.ranks.magic;
const RANK_MAX=5;
const reactorOn=()=>!!(S&&S.facilities&&S.facilities.includes('reactor'));
/* Version 124 (Tyler): no level bonus. Max Power = Tech rank + 1 per Tech item worn + bonuses; max Arcana = Magic rank + the Magic rank each worn item requires + bonuses (Tyler, Version 125) */
const gearPoolTxt=g=>{if(g.cons)return '';const o=[];if(g.type==='tech')o.push('+1 max Power');if(g.reqs&&g.reqs.magic)o.push(`+${g.reqs.magic} max Arcana`);return o.length?o.join(' and ')+' while worn':''};
const techGearN=h=>wornGear(h).filter(g=>GEAR[g]&&GEAR[g].type==='tech').length;
const magicGearA=h=>wornGear(h).reduce((s,g)=>s+((GEAR[g]&&GEAR[g].reqs&&GEAR[g].reqs.magic)||0),0);
const pwrMax=h=>h.ranks.tech?h.ranks.tech+techGearN(h)+stat(h,'maxPwr')+(reactorOn()?3:0):0;
const arcMax=h=>h.ranks.magic?h.ranks.magic+magicGearA(h)+stat(h,'maxArc')+(reactorOn()?1:0):0;
const pwrRegen=h=>1+stat(h,'pwrRegen');
/* Version 123 (Tyler): Innate rank is gone; Innate abilities use the Innate rank itself */
const potOf=h=>h.ranks.innate||0;
const innUses=h=>1+stat(h,'innUses');
const resMax=(h,t)=>t==='tech'?pwrMax(h):t==='magic'?arcMax(h):0;
const canWear=(h,g)=>Object.entries(GEAR[g].reqs).every(([t,n])=>h.ranks[t]>=n);
/* Shaken: a hero at 0 composure in a fight */
const SHAKEN={str:3,acc:3,eva:3,move:1}; /* Tyler (2026-10-30): -3s, and no lasting Rattled injury */
function stat(h,k,raw){const b=BASE(h);let v=b[k]??0;
  for(const u of h.upgrades)v+=UPG[u].mods[k]||0;
  for(const g of wornGear(h))v+=GEAR[g].mods[k]||0;
  {const pk=pairOf(h);if(pk&&GEAR[pk].pair.mods)v+=GEAR[pk].pair.mods[k]||0}
  v+=auraMod(h,k);
  for(const s of setsOn(h))v+=SETS[s].mods[k]||0;
  for(const t in TRACKS)v+=rankMod(h,t,k);
  for(const i of h.injuries)v+=INJ[i].mods[k]||0;
  if(k==='str'&&S.ethos.a==='force')v+=2;
  if(k==='maxComp'&&S.ethos.b==='secret')v+=1;
  if(S.sd&&h.comp<=0&&SHAKEN[k]&&!rankMod(h,'innate','unshake'))v-=SHAKEN[k];
  /* Version 108 (Tyler): Optics Bench scope rails, +1 range and +1 accuracy in showdowns for heroes with range 2+ */
  if(!raw&&S.sd&&(k==='range'||k==='acc')&&S.facilities.includes('optics')&&(k==='range'?v:stat(h,'range',1))>=2)v+=1;
  if(k==='move'||k==='maxComp'||k==='speed')v=Math.max(1,v);
  return v}
/* Version 124: the Innate capstone's extra Innate ability is once per fight, and comes back after a round in which the hero used no abilities */
const innOk=(u,h)=>(u.innUsed||0)<1+(stat(h,'innUses')>0&&!u.capUsed?1:0);
const handN=g=>g.two?'Two hands':g.hand==='main'?'Main Hand':g.hand==='off'?'Off Hand':'Either Hand';
const gearSlotN=g=>g.slot==='arms'?handN(g):slotN(g.slot);
const pairOf=h=>{const a=h.gear.arms;return a&&a===h.gear.arms2&&GEAR[a]&&GEAR[a].pair?a:null};
/* gear that counts for stats and sets: since Version 121 both copies of a Paired weapon count in full */
function wornGear(h){return Object.values(h.gear)}
const gearHas=(h,p)=>Object.values(h.gear).some(g=>GEAR[g]&&GEAR[g][p]);
/* auras: the wearer and each ally within 1 hex add the gear's aura bonus */
/* an effect aura reaches u if u or a standing ally within 1 hex wears it */
function auraOn(u,id){const sd=S.sd;if(!sd||!u||u.ko)return false;return sd.units.some(o=>!o.ko&&cheb(o,u)<=AURA_R&&Object.values(heroOf(o).gear).some(g=>GEAR[g]&&GEAR[g].auraFx===id))}
/* Fortune works on the first attack against each hero per round */
function luckUp(u){if(!auraOn(u,'luck')||u.luckRd===S.sd.round)return false;u.luckRd=S.sd.round;return true}
function auraTags(u){const L=Object.keys(AURA_FX).filter(id=>auraOn(u,id));return L.length?`<div class="row">${L.map(id=>`<span class="tag g" data-tip="kw:aura">${AURA_FX[id].n}</span>`).join('')}</div>`:''}
function auraMod(h,k){const sd=S&&S.sd;if(!sd||!sd.units)return 0;const u=sd.units.find(o=>o.hid===h.id);if(!u||u.ko)return 0;let v=0;
  for(const o of sd.units){if(o.ko||cheb(o,u)>AURA_R)continue;const t=heroOf(o);if(!t)continue;for(const g of new Set(Object.values(t.gear))){const a=GEAR[g]&&GEAR[g].aura;if(a)v+=a[k]||0}}return v}
/* where an item goes: the slot it fills and the slots it clears (a two-handed weapon clears both hands) */
function eqPlan(h,g,pref){const G=GEAR[g],ks=SLOT_KEYS[G.slot]||[G.slot];
  if(G.slot==='arms'){const a=h.gear.arms,b=h.gear.arms2,tw=a&&GEAR[a].two;
    const s=G.two||G.hand==='main'?'arms':G.hand==='off'?'arms2':pref==='arms'||pref==='arms2'?pref:!a?'arms':a===g?'arms2':b===g?'arms':!b?'arms2':'arms2';
    const clear=G.two||tw?['arms','arms2']:[s];return {s,clear,out:clear.map(x=>h.gear[x]).filter(Boolean)}}
  const clear=[ks.includes(pref)?pref:ks.find(s=>!h.gear[s])||ks[0]];
  return {s:clear[0],clear,out:clear.map(s=>h.gear[s]).filter(Boolean)}}
function putGear(h,g,pref){const p=eqPlan(h,g,pref);p.clear.forEach(s=>delete h.gear[s]);h.gear[p.s]=g;return p.out}
const roster=()=>S.heroes.filter(h=>!h.retired);
const heroById=id=>S.heroes.find(h=>h.id===id);
const party=()=>(S.party||[]).map(heroById).filter(h=>h&&!h.retired);
const bench=()=>roster().filter(h=>!(S.party||[]).includes(h.id));
const partyHas=fid=>party().some(h=>BASE(h).field&&BASE(h).field.id===fid);
const fieldGear=fid=>party().flatMap(h=>Object.values(h.gear).filter(g=>GEAR[g].field&&GEAR[g].field.id===fid).map(g=>({h,g})));
const fieldCount=fid=>fieldGear(fid).length;
function clampHero(h){h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))}
