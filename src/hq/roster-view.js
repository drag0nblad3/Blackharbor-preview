/* hq/roster-view.js: Roster screen: hero cards, gear info, set rows, slot picker, equipHero/eqTo. */
/* Version 117 (Tyler): tap an empty gear slot on a hero card to pick an armory item for it */
let slotPick=null;
const handFits=(s,G)=>G.slot!=='arms'||G.two||G.hand==='either'||G.hand===(s==='arms'?'main':'off');
const slotFits=(h,s)=>{const base=s.replace(/2$/,'');return [...new Set(S.armory)].filter(g=>GEAR[g]&&!GEAR[g].cons&&GEAR[g].slot===base&&handFits(s,GEAR[g])).sort((a,b)=>wearOK(h,b)-wearOK(h,a)||GEAR[a].req-GEAR[b].req)};
function slotPickView(){if(!slotPick)return '';const h=S.heroes.find(x=>x.id===slotPick.h);if(!h||!(S.phase==='hq'||prepGear())){slotPick=null;return ''}
  if(!tutOn())return loadoutPicker(h,slotPick.s);
  const ks=slotFits(h,slotPick.s);
  return `<div id="slotpick" role="dialog" aria-modal="true" aria-label="Equip ${esc(h.name)}"><div class="gbox"><div class="eyebrow">${esc(h.name)} · ${SLOTS[slotPick.s]} slot</div><h3 style="margin:0">Equip from the armory</h3>
    ${ks.length?ks.map(g=>{const G=GEAR[g],ok=wearOK(h,g),pl=eqPlan(h,g,slotPick.s),n=S.armory.filter(x=>x===g).length;return `<button class="btn opt t-${G.type}" data-a="equip:${h.id}:${g}:${slotPick.s}" data-tip="gear:${g}" ${ok?'':'disabled'}><span>${esc(G.name)}${n>1?` ×${n}`:''}</span><small>${ok?[modsTxt(G.mods),G.ab?G.ab.n:'',pl.out.length?`swaps out ${[...new Set(pl.out)].map(o=>GEAR[o].name).join(' and ')}`:'',G.two?'two hands':''].filter(Boolean).join(' · '):`Needs ${reqTxt(G)}`}</small></button>`}).join('')
      :`<div class="cap">Nothing in the armory fits this slot. Craft one in the Workshop on the HQ tab.</div>`}
    <div class="small muted">Long-press an item for full details.</div><button class="btn" data-a="slotpick:close">Cancel</button></div></div>`}
document.addEventListener('click',e=>{if(slotPick&&e.target.id==='slotpick'){slotPick=null;render()}});
document.addEventListener('keydown',e=>{if(slotPick&&e.key==='Escape'){slotPick=null;render()}});
function rosterView(){const p=party(),b=bench(),atHQ=S.phase==='hq',fl=S.flash;S.flash=null;
  return `${guideBar()}${bhPagehead('Heroes of Blackharbor','Team roster','Compare heroes at a glance; open any card for disciplines, equipment, and upgrades.',[['Active',`${p.length}/4`],['Reserves',b.length],['Upgrades',roster().reduce((n,h)=>n+h.pendingUp,0)]])}${fl?`<div class="cap tilt"><b>Fresh off the press!</b> ${esc(fl)}</div>`:''}<div class="bh-roster-layout"><aside class="bh-roster-rail">${bhRosterOps(p,b)}</aside><div class="bh-roster-content"><section class="panel">${coll('ro-party',`<div><div class="eyebrow" data-tip="kw:party">Active party · ${p.length}/4</div><h2>Party</h2></div>`,
    `<p class="small muted" style="margin:0">${prepGear()?'You caught the villain by surprise: gear can be changed before entering the lair.':atHQ?'Only the party goes on missions and investigations. Benched heroes train and recover: full health and +1 XP every issue.':'The party can be changed at HQ between issues.'}</p>
    ${p.length?`<div class="grid2">${p.map(h=>heroCard(h,'party')).join('')}</div>`:'<div class="cap">The party is empty. Add heroes from the bench before the next mission.</div>'}`)}</section>
  <section class="panel">${coll('ro-bench',`<div><div class="eyebrow">Reserves · ${b.length}</div><h2>Bench</h2></div>`,`${b.length?'':'<p class="small muted" style="margin:0">Nobody on the bench.</p>'}<div class="grid2">${b.map(h=>heroCard(h,'bench')).join('')}</div>${atHQ&&roster().length<ROSTER_MAX?'<div class="row"><button class="btn sm" data-a="view:hq">Recruit more heroes at HQ</button></div>':''}`)}</section>
  ${S.fallen.length?`<p class="small muted" style="margin:0">Retired: ${S.fallen.map(esc).join(', ')}</p>`:''}</div></div>`}
/* passive gear effects, one line each */
function gearExtra(g){const o=[];if(g.two)o.push('<b>Two-handed:</b> fills both the Main Hand and the Off Hand.');else if(g.hand==='main')o.push('<b>Main Hand</b> weapon.');else if(g.hand==='off')o.push('<b>Off Hand</b> item.');
  if(g.pair)o.push(`<b>Paired:</b> goes in either hand. Hold one in each hand and both count in full${g.pair.fx||Object.values(g.pair.mods||{}).some(Boolean)?`, plus ${g.pair.txt}`:''}.`);
  if(g.pain)o.push(`<b>Pain into ${TRACKS[g.pain].res}:</b> regain 1 ${TRACKS[g.pain].res} whenever you take damage.`);
  if(g.relent)o.push('<b>Relentless:</b> +1 die on attacks against a villain you also attacked last round.');
  if(g.riposte)o.push('<b>Riposte:</b> once per round, when the villain misses you and is within your range, strike back with a free 1-die attack.');
  if(g.rescue)o.push('<b>Lifeline:</b> each civilian you get out through an exit restores 1 Power or 1 Arcana, or 2 health if neither is missing.');
  if(g.aura)o.push(`<b>Aura:</b> you and allies within ${AURA_R} hexes get ${modsTxt(g.aura)}.`);if(g.auraFx)o.push(`<b>Aura, ${AURA_FX[g.auraFx].n}:</b> you and allies within ${AURA_R} hexes ${AURA_FX[g.auraFx].txt}.`);return o}
function gearInfo(k){const g=GEAR[k];return `${g.set?`<span class="settag" data-tip="kw:set">${esc(VILLAINS[g.set].name)} set</span>`:''}<div class="row between"><div class="gear-title">${equipmentIcon(k,56)}<h3>${g.name}</h3></div><span class="row" style="gap:4px">${reqChips(g)}</span></div>
  <div class="small"><span class="eyebrow">${gearSlotN(g)}${g.pair?' · paired':''}</span> · ${g.cons?'Consumable · one use, then it is gone':(modsTxt(g.mods)||'No passive bonus')+(gearPoolTxt(g)?' · '+gearPoolTxt(g):'')}</div>
  ${g.ab?`<div class="small t-${g.type}"><b style="color:var(--tc)">${g.ab.n} · ${abCost(g)}.</b> ${abTxt(g.ab)}</div>`:''}
  ${g.jumps?'<div class="small" data-tip="kw:jumps"><b>All your moves are jumps.</b></div>':''}${gearExtra(g).map(t=>`<div class="small">${t}</div>`).join('')}
  ${g.field?`<div class="small"><span class="disc t-${g.type}" data-tip="kw:fieldgear">Out of combat</span> ${g.field.txt}</div>`:''}${g.set?setFoot(g.set):''}`}
/* set footer on a set item: the bonus, and how many pieces each hero on the roster wears */
function setFoot(k){const w=roster().map(h=>[h,setCount(h,k)]).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  return `<div class="small setfoot"><b class="sn">${SETS[k].n}</b> <span class="muted">(${SET_N} pieces)</span> ${SETS[k].txt}<br><span class="muted">${w.length?'Wearing: '+w.map(([h,n])=>`${esc(h.name)} ${n}/${SET_N}${n>=SET_N?' ✓':''}`).join(', '):'Nobody is wearing this set yet.'}</span></div>`}
function setRows(h){const ks=[...new Set(Object.values(h.gear).map(g=>GEAR[g]&&GEAR[g].set).filter(Boolean))];if(!ks.length)return '';
  return `<div class="setrows">${ks.map(k=>{const n=setCount(h,k),on=n>=SET_N,id=`set-${h.id}-${k}`,left=SET_N-n;
    return `<details class="setp ${on?'on':''}" data-cid="${id}" ${uiOpen(id,false)?'open':''}><summary><span class="settag">${esc(VILLAINS[k].name)}</span><span class="sn">${SETS[k].n}</span><span class="setpips">${[...Array(Math.max(SET_N,n))].map((_,i)=>`<i class="${i<n?'f':''}"></i>`).join('')}</span><span class="mono small">${n}/${SET_N}</span>${on?'<span class="small sn">Active</span>':''}</summary><div class="small">${on?'':`Wear ${left} more piece${left>1?'s':''} to unlock: `}${SETS[k].txt}</div></details>`}).join('')}</div>`}
function heroCard(h,where){const b=BASE(h),mx=stat(h,'maxHp'),mc=stat(h,'maxComp'),p=POWERS[b.power];
  if(h.pendingUp>0&&h.trackPick&&!h.upChoices){h.upChoices=shuffle(Object.keys(UPG).filter(k=>k!=='range'||stat(h,'range')>1)).slice(0,3)}
  const ranks=Object.keys(TRACKS).map(t=>`<span class="disc t-${t} ${h.ranks[t]?'fill':''}" data-tip="kw:${t}">${TRACKS[t].name} ${h.ranks[t]}</span>`).join('');
  const res=poolTxt(h);if(h.pendingUp>0&&!h.trackPick&&Object.keys(TRACKS).every(t=>h.ranks[t]>=RANK_MAX))h.trackPick='none';
  const atHQ=S.phase==='hq',gearOK=atHQ||prepGear();
  const efr=gearOK&&S.armory.length?eqFilter(h):null,avail=efr?efr.ks:[];
  const lvlUp=h.pendingUp>0?(!h.trackPick?`<div class="cap"><b>Level up!</b> Which discipline does ${esc(h.name)} grow into?</div>
    <div class="grid2">${Object.entries(TRACKS).map(([t,d])=>{const n=h.ranks[t],mx=n>=RANK_MAX,nx=n+1,pk=nx===1&&t===b.track?'':perkTxt(t,nx),gn=gainTxt(h,t),br=bridgesOf({...h,ranks:{...h.ranks,[t]:h.ranks[t]+1}}).filter(k=>!bridgeOn(h,k)).map(k=>BRIDGE[k].n).join(' and ');return `<button class="btn opt t-${t}" data-a="track:${h.id}:${t}" data-tip="kw:${t}" style="border-color:var(--tc)" ${mx?'disabled':''}><span style="color:var(--tc)">${d.name} ${n} → ${mx?'mastered':nx}${nx===RANK_MAX?' · Capstone':''}</span><small>${mx?`Already at the rank ${RANK_MAX} cap.`:[pk&&`Capstone: ${pk}`,gn&&`Engine: ${gn}`,br&&`Unlocks the ${br} bridge perk`,`Opens ${d.name} ${nx} gear`].filter(Boolean).join('. ')+'.'}</small></button>`}).join('')}</div>`
    :`<div class="cap"><b>${TRACKS[h.trackPick]?`${TRACKS[h.trackPick].name} rank gained.`:'Every discipline is mastered.'}</b> Now choose one upgrade:</div><div class="row">${h.upChoices.map(k=>`<button class="btn sm pri" data-a="up:${h.id}:${k}" data-tip="upg:${k}">${UPG[k].name}</button>`).join('')}</div>`):'';
  const SK={HP:'hp',MOV:'move',DICE:'speed',ACC:'acc',STR:'str',EVA:'eva',RNG:'range',COMP:'comp'},SI={HP:'hp',MOV:'move',DICE:'dice',ACC:'acc',STR:'str',EVA:'eva',RNG:'rng',COMP:'comp'};
  const st=[['HP',`${h.hp}/${mx}`],['MOV',stat(h,'move')],['DICE',stat(h,'speed')],['ACC',(stat(h,'acc')<0?'':'+')+stat(h,'acc')],['STR',(stat(h,'str')<0?'':'+')+stat(h,'str')],['EVA',stat(h,'eva')],['RNG',stat(h,'range')],['COMP',mc]];
  return `<div class="card"><details class="coll" data-cid="h-${h.id}" ${uiOpen('h-'+h.id,where==='prep'||where==='fight'||tutOn()||!!S.guide)?'open':''}><summary><div class="row"><span class="vic" style="--vc:${b.col}">${pIc(b.power)}</span><h3>${esc(h.name)}</h3><span class="lvl" data-tip="kw:xp">LVL ${lvlOf(h)}</span>${h.est?'<span class="tag" data-tip="kw:established">Established</span>':''}<span class="small mono muted" data-tip="kw:hp">HP ${h.hp}/${mx}</span><span class="small mono muted" data-tip="kw:comp">COMP ${h.comp}/${mc}</span>${b.field?'<span class="tag g" data-tip="kw:field">Field</span>':''}${h.pendingUp?'<span class="tag" data-tip="kw:levelup">Level up!</span>':''}</div></summary><div class="cbody">
  ${atHQ&&where==='party'?`<div class="row"><button class="btn sm" data-a="bench:${h.id}">Move to bench</button></div>`:''}${atHQ&&where==='bench'?(party().length<4?`<div class="row"><button class="btn sm pri" data-a="join:${h.id}">Join the party</button></div>`:`<div class="row"><span class="eyebrow">Swap in for</span>${party().map(o=>`<button class="btn sm" data-a="swap:${h.id}:${o.id}">${esc(o.name)}</button>`).join('')}</div>`):''}
  <div class="small muted">${esc(b.role)}${h.name!==b.name?` · carries the ${esc(b.name)} mantle`:''}</div>${h.origin?`<div class="small muted" data-tip="kw:origin">Origin: ${esc(h.origin.join(' · '))}</div>`:''}
  <div class="row">${ranks}</div>
  <div class="small muted" data-tip="kw:engines">Combat engines: ${res}</div>${bridgesOf(h).map(k=>`<div class="small" data-tip="kw:bridge"><b>${BRIDGE[k].n}.</b> ${BRIDGE[k].txt}</div>`).join('')}
  <div class="bar" data-tip="kw:hp"><i style="width:${100*h.hp/mx}%"></i></div><div class="bar c" data-tip="kw:comp"><i style="width:${100*h.comp/mc}%"></i></div>
  <div class="stats ico">${st.map(([k,v])=>`<div class="stat" data-tip="kw:${SK[k]}" title="${k}" aria-label="${k} ${v}">${UI(SI[k])}<b>${v}</b></div>`).join('')}</div>
  <div class="small" data-tip="pow:${b.power}"><b>${p.name}.</b> ${p.txt}</div>
  ${b.field?`<div class="small fieldab" data-tip="kw:field"><b>${b.field.n}</b> <span class="disc t-${b.track}">Field</span> ${b.field.txt}</div>`:''}
  <div class="row small"><span class="eyebrow" data-tip="kw:xp">XP</span><span class="meter">${[...Array(xpNeed(h))].map((_,i)=>`<i class="${i<h.xp?'f':''}"></i>`).join('')}</span><span class="mono">${h.xp}/${xpNeed(h)}</span></div>
  ${h.injuries.length?`<div class="row">${h.injuries.map(i=>`<span class="tag" data-tip="inj:${i}">${INJ[i].name}</span>`).join('')}</div>`:''}
  ${where==='fight'?`<details class="loadout-fold" data-cid="fight-loadout" ${uiOpen('fight-loadout',false)?'open':''}><summary>Hero loadout <span class="mono">${Object.keys(SLOTS).filter(s=>loadoutWorn(h,s).key).length}/8 slots</span></summary>${heroLoadout(h,gearOK)}</details>`:heroLoadout(h,gearOK)}${pairOf(h)?`<div class="small" data-tip="kw:paired"><b>Paired ${GEAR[pairOf(h)].name}s:</b> ${GEAR[pairOf(h)].pair.txt}. Both weapons' own stats count in full.</div>`:''}${setRows(h)}
  <div class="row small"><span class="eyebrow" data-tip="kw:pouch">Pouch ${pouchOf(h).length}/${POUCH_MAX}</span>${pouchOf(h).map((g,i)=>`<span class="tag g" data-tip="gear:${g}">${GEAR[g].name}</span>${gearOK?`<button class="btn sm" data-a="unpouch:${h.id}:${i}">Remove</button>`:''}`).join('')||'<span class="muted">Empty. Consumables from the armory go here.</span>'}</div>
  ${efr?`<div class="eyebrow">Equip from the armory</div>${efr.bar}`:''}${avail.length?`<div class="row">${avail.map(g=>{const ok=wearOK(h,g),G=GEAR[g];return `<button class="btn sm" data-a="equip:${h.id}:${g}" data-tip="gear:${g}" ${ok?'':'disabled'} title="${ok?'':`Needs ${reqTxt(G)}`}">${equipmentIcon(g,28)} + ${G.name} <span class="muted">(${G.cons?`pouch ${pouchOf(h).length}/${POUCH_MAX}`:gearSlotN(G)}${ok?'':G.cons?', full':`, needs ${reqTxt(G)}`})</span></button>`}).join('')}</div>`:''}
  ${lvlUp}
  </div></details></div>`}
/* S.guide only exists on volumes started after this update: s 0 splash, 1 team, 2 base, 3 gear, 4 roster. pop names the step a pop-up is suggesting. */
function equipHero(h,g,pref){const i=S.armory.indexOf(g),G=GEAR[g];if(i<0||!wearOK(h,g))return false;
  if(G.cons){S.armory.splice(i,1);pouchOf(h).push(g);if(S.guide)S.guide.eq=true;return true}
  S.armory.splice(i,1);putGear(h,g,pref).forEach(o=>S.armory.push(o));if(G.mods.maxHp)h.hp+=G.mods.maxHp;clampHero(h);if(S.guide)S.guide.eq=true;return true}
function eqTo(g,craft){const G=GEAR[g],hs=[...party(),...bench()];if(!hs.length)return '<button class="btn sm" disabled title="Recruit a hero first">Equip to…</button>';
  return `<details class="eqto"><summary class="btn sm">${craft?'Craft &amp; equip to…':'Equip to…'}</summary><div class="eqmenu">${hs.map(h=>{const ok=wearOK(h,g),pl=G.cons?null:eqPlan(h,g);
    return `<button class="btn sm" data-a="${craft?`crafteq:${g}:${h.id}`:`equip:${h.id}:${g}`}" ${ok?'':'disabled'}>${esc(h.name)}${S.party.includes(h.id)?'':' <span class="muted">(bench)</span>'} <span class="muted">${ok?(pl&&pl.out.length?`swaps out ${[...new Set(pl.out)].map(o=>GEAR[o].name).join(' and ')}`:G.cons?`pouch ${pouchOf(h).length}/${POUCH_MAX}`:`${SLOTS[pl.s]} empty`):G.cons?'pouch full':`needs ${reqTxt(G)}`}</span></button>`}).join('')}</div></details>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.rofocus=(p1)=>{
      const h=roster().find(h=>h.id===p1);if(!h)return;
      S.view='roster';S.ui=S.ui||{};S.ui['ro-party']=true;S.ui['ro-bench']=true;
      S.ui['h-'+h.id]=true;render();
      if(!FAST){const sheet=document.querySelector('[data-cid="h-'+h.id+'"]');
        if(sheet)sheet.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});}
      return NO_RENDER;
    };
ACT.equip=(p1,p2,p3)=>{const h=S.heroes.find(x=>x.id===p1);slotPick=null;if(!h||!(S.phase==='hq'||prepGear()))return;equipHero(h,p2,p3)};
ACT.gearinspect=(p1)=>{if(slotPick&&slotFits(heroById(slotPick.h),slotPick.s).includes(p1))slotPick.g=p1};
ACT.slotpick=(p1,p2)=>{slotPick=p1==='close'?null:{h:p1,s:p2}};
ACT.unequip=(p1,p2)=>{const h=S.heroes.find(x=>x.id===p1);if(!h||!(S.phase==='hq'||prepGear()))return;const g=h.gear[p2];if(g){delete h.gear[p2];S.armory.push(g);clampHero(h)}};
ACT.track=(p1,p2)=>{const h=S.heroes.find(x=>x.id===p1);if(!h||h.trackPick||!TRACKS[p2]||h.ranks[p2]>=RANK_MAX)return;const mh=stat(h,'maxHp'),mc=stat(h,'maxComp');h.ranks[p2]++;h.trackPick=p2;h.hp+=Math.max(0,stat(h,'maxHp')-mh);h.comp+=Math.max(0,stat(h,'maxComp')-mc)};
ACT.up=(p1,p2)=>{const h=S.heroes.find(x=>x.id===p1);h.upgrades.push(p2);h.pendingUp--;h.upChoices=null;h.trackPick=null;if(p2==='hp')h.hp+=3;if(p2==='comp')h.comp+=2};
ACT.unpouch=(p1,p2)=>{const h=S.heroes.find(x=>x.id===p1);if(!h||!(S.phase==='hq'||prepGear()))return;const p=pouchOf(h),g=p[+p2];if(g){p.splice(+p2,1);S.armory.push(g)}};
ACT.bench=(p1)=>{S.party=S.party.filter(id=>id!==p1)};
ACT.join=(p1)=>{if(S.party.length<4&&!S.party.includes(p1))S.party.push(p1)};
ACT.swap=(p1,p2)=>{const i=S.party.indexOf(p2);if(i>=0&&!S.party.includes(p1))S.party[i]=p1};
