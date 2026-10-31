/* hq/hq-view.js: HQ screen: HQ operations, threat board, roster ops, hqView, arcView, recruitment panel. */
/* Operational side rails: existing resources, team and case state, no new mechanics. */
function bhHqOps(){
  const active=S.villains.filter(v=>v.status==='active'),team=party(),
    needs=roster().filter(h=>h.pendingUp>0);
  return `<div class="bh-rail-heading">Operations desk <small>Issue #${S.issue}</small></div>
    <div class="bh-rail-block"><div class="bh-rail-title">On the streets <span>${active.length} active</span></div>
      ${active.length?active.map(v=>`<div class="bh-ops-threat">
        <span class="vportrait-mini">${vPortrait(v.key,'thumb')}</span>
        <div class="bh-ops-threat-copy"><b>${esc(VILLAINS[v.key].short)}</b><small>Level ${v.level} · Scheme ${v.scheme}/${schemeMax()}</small></div>
        <button class="btn sm" data-a="book:${v.key}" aria-label="Open ${esc(VILLAINS[v.key].name)} playbook">File</button>
      </div>`).join(''):'<p class="small">No active villains yet.</p>'}
      <button class="btn sm bh-rail-button" data-a="view:villains">Open threat board</button>
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">Team readiness <span>${team.length}/4</span></div>
      ${team.map(h=>`<div class="bh-mini-hero"><b>${esc(h.name)}</b><span title="Health">${UI('hp')} ${h.hp}/${stat(h,'maxHp')}</span>
        <span title="Composure">${UI('comp')} ${h.comp}/${stat(h,'maxComp')}</span></div>`).join('')||'<p class="small">Recruit heroes to build a field team.</p>'}
      ${needs.length?`<p class="bh-alert">${needs.length} hero${needs.length===1?'':'es'} ready to level up</p>`:''}
      <button class="btn sm bh-rail-button" data-a="view:roster">Manage roster</button>
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">Base ledger</div>
      <div class="bh-rail-ledger"><span>Trust <b>${S.trust}</b></span>
        <span>Tech <b>${S.tech}</b></span><span>Intel <b>${S.intel}</b></span>
        <span>Salvage <b>${Object.values(S.salvage).reduce((a,b)=>a+b,0)}</b></span></div>
    </div>`;
}
function bhThreatOps(active,arc,iia){
  return `<div class="bh-rail-heading">Case docket <small>Arc ${arc} · Issue ${iia}</small></div>
    <div class="bh-rail-block"><div class="bh-rail-title">Open investigations</div>
      ${active.map(v=>`<div class="bh-case-index">
        <span class="vportrait-mini">${vPortrait(v.key,'thumb')}</span>
        <div><b>${esc(VILLAINS[v.key].short)}</b><small>Level ${v.level} · ${v.scheme}/${schemeMax()} scheme</small></div>
      </div>`).join('')||'<p class="small">No active targets.</p>'}
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">Investigation team <span>${party().length}/4</span></div>
      ${party().map(h=>`<div class="bh-mini-hero"><b>${esc(h.name)}</b><span>HP ${h.hp}/${stat(h,'maxHp')}</span></div>`).join('')||'<p class="small">Select a team before investigating.</p>'}
      <button class="btn sm bh-rail-button" data-a="view:roster">Adjust party</button>
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">What matters</div>
      <p class="small">Every untouched villain advances their scheme each issue. Study known playbook pages before choosing who to hunt.</p>
      <div class="bh-rail-ledger"><span>Active <b>${active.length}</b></span><span>Threats waiting <b>${S.pool.length}</b></span></div>
    </div>`;
}
function bhRosterOps(p,b){
  return `<div class="bh-rail-heading">Team selector <small>${p.length}/4 active</small></div>
    <div class="bh-rail-block"><div class="bh-rail-title">Field squad</div>
      ${p.map(h=>bhRosterPick(h,'party')).join('')||'<p class="small">Nobody assigned to the field squad.</p>'}
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">Reserves <span>${b.length}</span></div>
      ${b.map(h=>bhRosterPick(h,'bench')).join('')||'<p class="small">No reserve heroes.</p>'}
    </div>
    <div class="bh-rail-block"><div class="bh-rail-title">Equipment locker</div>
      <div class="bh-rail-ledger"><span>Armory items <b>${S.armory.length}</b></span>
      <span>Pending upgrades <b>${roster().reduce((n,h)=>n+h.pendingUp,0)}</b></span></div>
      ${S.phase==='hq'?'<button class="btn sm bh-rail-button" data-a="view:hq">Visit workshop</button>':''}
    </div>`;
}
function bhRosterPick(h,where){
  const b=BASE(h);
  return `<button type="button" class="bh-roster-pick" data-a="rofocus:${h.id}" aria-label="Open ${esc(h.name)} character sheet">
    <span class="bh-pick-icon" style="--hc:${b.col}">${pIc(b.power)}</span>
    <span class="bh-pick-copy"><b>${esc(h.name)}</b><small>Lvl ${lvlOf(h)} · ${esc(b.role)}</small></span>
    <span class="bh-pick-hp">${h.hp}/${stat(h,'maxHp')} HP${h.pendingUp?' ★':''}</span>
  </button>`;
}
function hqView(only){if(tutOn())return tutHq(only);const arc=arcOf(S.issue),iia=(S.issue-1)%ISSUES_PER_ARC+1;
  const act=S.villains.filter(o=>o.status==='active');
  const vcard=o=>{const d=VILLAINS[o.key],seen=((S.seen&&S.seen[o.key])||[]).length;
    return `<div class="card villain-dossier-card" data-villain="${o.key}">
    <div class="villain-dossier-art">${vPortrait(o.key,'card')}</div>
    <div class="row between"><div class="row" style="flex-wrap:nowrap;gap:8px"><span class="vbadge" style="${vSty(o.key)}">${vIc(o.key)}</span><h3>${d.name}</h3></div><span class="lvl" data-tip="kw:vlevel">LVL ${o.level}</span></div>
    <div class="small muted">${d.tag}. Drops <span class="cost">${resIc(o.key)}</span>${d.salvage}. <span class="kwd" data-tip="kw:playbook">${o.deck.length}-page playbook</span>.</div>
    <button class="btn sm" data-a="book:${o.key}" style="align-self:flex-start">Read playbook · ${seen} seen</button>
    <div class="row small"><span class="eyebrow" data-tip="kw:scheme">Scheme</span><span class="meter">${[...Array(schemeMax())].map((_,i)=>`<i class="${i<o.scheme?'f':''}"></i>`).join('')}</span></div>
      ${S.guide&&party().length<4?`<button class="btn pri" data-a="inv:${o.key}" data-tip="kw:party" disabled>Needs 4 heroes · ${party().length}/4</button>`:`<button class="btn pri" data-a="inv:${o.key}" ${party().length?'':'disabled'}>Investigate</button>`}</div>`};
  const facCard=k=>{const f=FAC[k],b=S.facilities.includes(k),soon=!facOpen(k);return `<div class="card ${b?'built':''}" data-tip="fac:${k}">
    <div class="row between"><h3>${f.name}</h3>${b?'<span class="tag g">Built</span>':''}</div><div class="small">${f.txt}</div>
    ${b?'':`<div class="row between"><span class="small mono">${costHtml(f.cost)}</span><button class="btn sm" data-a="build:${k}" ${afford(f.cost)&&!soon?'':'disabled'}>${soon?`Opens in Arc ${f.arc}`:'Build'}</button></div>`}</div>`};
  const lockedCard=it=>`<div class="card locked" data-tip="${it}"><div class="row between"><h3>${itemName(it)}</h3><span class="tag" data-tip="kw:blueprint">No blueprint</span></div>${it.startsWith('gear:')?`<div class="row">${reqChips(GEAR[it.slice(5)])}<span class="small muted">${gearSlotN(GEAR[it.slice(5)])}</span></div>`:''}<div class="small muted">Unlocks from: ${unlockSources(it)}</div></div>`;
  const facNow=k=>facOpen(k)&&afford(FAC[k].cost);
  const facU=Object.keys(FAC).filter(k=>isUnlocked('fac:'+k)&&!S.facilities.includes(k)).sort((a,b)=>facNow(b)-facNow(a)),facB=Object.keys(FAC).filter(k=>S.facilities.includes(k)),facL=Object.keys(FAC).filter(k=>!isUnlocked('fac:'+k));
  const ws=S.facilities.includes('workshop');
  const canMake=k=>(ws||GEAR[k].cons)&&afford(GEAR[k].cost),wsBy=(S.ui&&S.ui.wsBy)||'vil',VK=Object.keys(VILLAINS).filter(k=>k in S.salvage),vil=g=>VK.some(v=>g.cost[v]);
  const consG={id:'cons',label:'<span class="disc fill hyb" data-tip="kw:pouch">Consumables</span>',f:g=>!!g.cons};
  const groups=wsBy==='slot'?[...Object.keys(GSLOTS).map(s=>({id:'slot-'+s,label:`<b>${GSLOTS[s]}</b>`,f:g=>g.slot===s})),consG]
    :wsBy==='disc'?[...Object.keys(TRACKS).map(t=>({id:t,label:`<span class="disc fill t-${t}" data-tip="kw:${t}">${TRACKS[t].name}</span>`,f:g=>!g.cons&&!isHybrid(g)&&g.reqs[t]})),consG,{id:'hybrid',sub:1,label:'<span class="disc fill hyb" data-tip="kw:hybrid">Hybrid</span>',f:g=>!g.cons&&isHybrid(g)}]
    :[...VK.map(v=>({id:'vil-'+v,label:`<b>${VILLAINS[v].name}</b><span class="small">${RES_NAME[v]} · ${S.salvage[v]} on hand</span>`,f:g=>!g.cons&&!!g.cost[v]})),
      {id:'vil-any',sub:1,label:'<b>Any salvage</b>',f:g=>!g.cons&&!!g.cost.any&&!vil(g)},{id:'vil-none',label:'<b>Tech &amp; Intel only</b>',f:g=>!g.cons&&!g.cost.any&&!vil(g)},consG];
  /* Version 103 (Tyler): craft cards list copies already owned, in the armory and on heroes */
  const ownedTxt=k=>{const inA=S.armory.filter(x=>x===k).length,on=roster().map(h=>[h,Object.values(h.gear).filter(x=>x===k).length+pouchOf(h).filter(x=>x===k).length]).filter(([,n])=>n);const tot=inA+on.reduce((a,[,n])=>a+n,0);
    return tot?`<div class="small owned"><b>Owned ${tot}:</b> ${[inA?`${inA} in the armory`:'',...on.map(([h,n])=>`${GEAR[k].cons?'carried':'worn'} by ${esc(h.name)}${n>1?` ×${n}`:''}`)].filter(Boolean).join(' · ')}</div>`:''};
  const craftCard=k=>{const g=GEAR[k];return `<div class="card" data-tip="gear:${k}">${gearInfo(k)}${ownedTxt(k)}
    <div class="row between"><span class="small mono">${costHtml(g.cost)}</span><button class="btn sm" data-a="craft:${k}" ${canMake(k)?'':'disabled'}>Craft</button></div>${canMake(k)?eqTo(k,true):''}</div>`};
  const wsGroup=(gr,ks)=>{ks=ks.slice().sort((a,b)=>canMake(b)-canMake(a)||GEAR[a].req-GEAR[b].req);if(!ks.length)return '';const rdy=ks.filter(canMake).length;
    const inner=gr.sub&&ks.length>8?Object.keys(GSLOTS).map(sl=>wsGroup({id:gr.id+'-'+sl,label:`<b>${GSLOTS[sl]}</b>`},ks.filter(k=>GEAR[k].slot===sl))).join(''):`<div class="grid2">${ks.map(craftCard).join('')}</div>`;
    return coll('ws-'+gr.id,`${gr.label}<span class="small muted">${ks.length} blueprint${ks.length===1?'':'s'}</span>${rdy?`<span class="tag g">${rdy} ready</span>`:''}`,inner,rdy>0&&(gr.id!=='hybrid'||ks.length<5),'nested')};
  /* Version 128 (Tyler): groups list only what you can craft now; unaffordable blueprints share one collapsed header near the bottom, above the missing blueprints */
  const gear=groups.map(gr=>wsGroup(gr,Object.keys(GEAR).filter(k=>gr.f(GEAR[k])&&isUnlocked('gear:'+k)&&canMake(k)))).join('');
  const cantK=Object.keys(GEAR).filter(k=>isUnlocked('gear:'+k)&&!canMake(k)&&groups.some(gr=>gr.f(GEAR[k])));
  const cant=cantK.length?wsGroup({id:'cant',sub:1,label:`<span class="eyebrow">Can't afford yet</span>`},cantK):'';
  const armK=[...new Set(S.armory)],armOK=g=>roster().some(h=>wearOK(h,g));
  const armG=[...Object.keys(GSLOTS),'pouch'].map(sl=>{const ks=armK.filter(g=>GEAR[g].slot===sl).sort((a,b)=>armOK(b)-armOK(a));if(!ks.length)return '';const n=S.armory.filter(g=>GEAR[g].slot===sl).length,rdy=ks.filter(armOK).length;
    return coll('arm-'+sl,`<span class="eyebrow">${slotN(sl)} · ${n}</span>${rdy?`<span class="tag g">${rdy} wearable</span>`:''}`,`<div class="grid2">${ks.map(g=>{const n=S.armory.filter(x=>x===g).length;return `<div class="card" data-tip="gear:${g}">${gearInfo(g)}<span class="small muted">${n>1?`${n} in stock`:'Ready to equip'}${armOK(g)?'':' · nobody can use it yet'}</span>${eqTo(g,false)}</div>`}).join('')}</div>`,true,'nested')}).join('');
  const wsTabs=`<div class="row small"><span class="eyebrow">Craft new gear · group by</span>${[['vil','Villain salvage'],['disc','Discipline'],['slot','Slot']].map(([k,l])=>`<button class="btn sm ${wsBy===k?'pri':''}" data-a="wsby:${k}">${l}</button>`).join('')}</div>
    <div class="row small"><span class="eyebrow">Paying any salvage</span>${[['0','Ask me which'],['1','Use my biggest pile']].map(([k,l])=>`<button class="btn sm ${(S.anyAuto?'1':'0')===k?'pri':''}" data-a="anyauto:${k}">${l}</button>`).join('')}</div>`;
  const gearL=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k)).sort((a,b)=>GEAR[a].req-GEAR[b].req);
  const rTop=!roster().length||(S.guide&&S.guide.s<=1);
  if(only==='villains')return `${guideBar()}${bhPagehead('Blackharbor intelligence','Threat board','Track their schemes, review their playbooks, and choose the next target.',[['Active threats',act.length],['Party',`${party().length}/4`],['Issue',iia]])}<div class="bh-threat-layout"><aside class="bh-threat-rail">${bhThreatOps(act,arc,iia)}</aside><section class="panel bh-threat-content">${coll('vl-cases',`<div><div class="eyebrow">Volume ${S.vol} · Arc ${arc} of ${ARCS} · Issue ${iia} of ${ISSUES_PER_ARC}</div><h2>Case files</h2></div>`,
    `<div class="steps" data-tip="kw:arc">${[...Array(ISSUES_PER_ARC)].map((_,i)=>`<span class="${i<iia-1?'f':''}"></span>`).join('')}</div>
    <div class="cap tilt">${arc<ARCS?`When this arc ends, every active villain levels up and rewrites part of their playbook, and a new villain arrives.`:'Final arc. When it ends, two villains team up for the event comic finale.'} Villains you don't hunt keep scheming. Long-press any stat, item or keyword for details.</div>
    <div class="row small"><span class="eyebrow" data-tip="kw:party">Party</span>${party().map(h=>`<span class="tag g">${esc(h.name)}</span>`).join('')||'<span class="tag">Empty</span>'}<button class="btn sm" data-a="view:roster">Change party</button></div>
    <div class="grid2">${act.map(vcard).join('')}</div>
    ${!S.villains.length?'<p class="cap">Recruit four heroes to reveal the three opening villains. The threats will match your team’s disciplines.</p>':''}
    ${S.villains.length&&S.pool.length?`<p class="small muted" style="margin:0">${S.pool.length} more villain${S.pool.length>1?'s':''} will surface later in this volume.</p>`:''}`)}</section></div>
  `;
  const fl=S.flash;S.flash=null;
  return `${guideBar()}${bhPagehead('Guardians command center','Headquarters','Develop facilities, outfit the team, and prepare for the next issue.',[['Field team',`${party().length}/4`],['Facilities',S.facilities.length],['Armory',S.armory.length]])}${fl?`<div class="cap tilt"><b>Fresh off the press!</b> ${esc(fl)}</div>`:''}<div class="bh-hq-layout"><aside class="bh-hq-rail">${bhHqOps()}</aside><div class="hqcols"><div class="hqa">${recruitPanel()}
  ${skunkPanel()}
  <section class="panel">${coll('hq-base',`<div><div class="eyebrow">Headquarters · ${S.facilities.length} built</div><h2>Base development</h2></div>`,
    `${facU.length?`<div class="grid2">${facU.map(facCard).join('')}</div>`:'<p class="small muted" style="margin:0">Every facility blueprint on file is built.</p>'}
    ${facB.length?coll('hq-facb',`<span class="eyebrow">Built · ${facB.length}</span>`,`<div class="grid2">${facB.map(facCard).join('')}</div>`,false,'nested'):''}
    ${facL.length?coll('hq-facl',`<span class="eyebrow" data-tip="kw:blueprint">Missing facility blueprints · ${facL.length}</span>`,`<div class="grid2">${facL.map(k=>lockedCard('fac:'+k)).join('')}</div>`,false,'nested'):''}`)}</section>
  ${S.chronicle.length?`<section class="panel">${coll('hq-back',`<div class="eyebrow">Back issues · ${S.chronicle.length}</div>`,`<ul class="lines small">${S.chronicle.slice().reverse().map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`,false)}</section>`:''}</div><div class="hqb">
  <section class="panel">${coll('hq-ws',`<div><div class="eyebrow">Workshop</div><h2>Gear from salvage</h2></div>`,
    `${ws?'':'<p class="small muted" style="margin:0">Build the Workshop to craft gear. Consumables can be bought without it.</p>'}
    <p class="small muted" style="margin:0">Each item fills one body slot and needs the listed discipline ranks to equip. Gear costs only salvage, and higher-rank gear costs more. Tech abilities spend Power, Magic spells spend Arcana, and Innate abilities require Innate rank. Hybrid gear needs ranks in more than one discipline. "Any salvage" can be paid from any villain's salvage.</p>
    <a class="btn sm gear-sprite-link" href="equipment-gallery.html" target="_blank" rel="noopener">Browse equipment gallery ↗</a>
    ${wsFind(canMake,craftCard)}
    ${coll('ws-browse',`<span class="eyebrow">Browse the armory and every blueprint</span>`,`${S.armory.length?coll('ws-arm',`<span class="eyebrow">In the armory · ${S.armory.length}</span>`,armG,true,'nested'):''}
    ${wsTabs}${gear||'<p class="small muted" style="margin:0">Nothing you can afford to craft right now.</p>'}${cant}
    ${gearL.length?coll('hq-gearl',`<span class="eyebrow" data-tip="kw:blueprint">Missing gear blueprints · ${gearL.length}</span>`,`<div class="grid2">${gearL.map(k=>lockedCard('gear:'+k)).join('')}</div>`,false,'nested'):''}`,false,'nested')}`)}</section>
  </div></div></div>`}
function arcView(){const a=S.arcInfo;return `<section class="panel"><div class="eyebrow">Volume ${S.vol}</div><div><span class="sfxhead">Arc ${a.arc} begins!</span></div>
  <div class="cap tilt">Time passes. The villains still at large grow stronger and rewrite their playbooks.</div>
  ${coll('arc-lines','<span class="eyebrow">What changed · '+a.lines.length+'</span>',`<ul class="lines">${a.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`)}<button class="btn pri" data-a="arcnext">Begin issue #${S.issue}</button></section>`}
function recruitPanel(){const n=roster().length,full=n>=ROSTER_MAX,arc=xArc(),xo=xoverOpen(),qb=Object.keys(HERO_BASE).filter(k=>!roster().some(h=>h.cls===k));
  const xl=xo?'Start a Crossover':arc<2?'Opens in Arc 2':arc<ARCS?`Used. Next one in Arc ${arc+1}`:'Used this arc';
  return `<section class="panel">${coll('hq-recruit',`<div><div class="eyebrow">Recruitment · ${n}/${ROSTER_MAX} heroes</div><h2>New heroes</h2></div>`,
    `${!n?'<div class="cap tilt"><b>The Blackharbor Guardians need four heroes.</b> Write an origin story for each hero, or grab a quick build to skip ahead. Every mission sends a party of 4, so fill all four spots before you investigate. The armory holds a starter locker of ten items to hand out once the team is set.</div>':''}
    ${full?'<p class="small muted" style="margin:0">The roster is full.</p>':''}
    <div class="grid2"><div class="card orec"><h3>Origin Story</h3><div class="small">Create a basic hero over six comic pages. Every choice shows what it does to them. Free: level 1, no gear, no HQ changes.</div><button class="btn pri" data-a="ostart:basic" data-tip="kw:origin" ${full?'disabled':''}>Write an origin</button></div>
      <div class="card orec xo"><h3>Crossover Issue</h3><div class="small">Recruit an Established Character from their own series. They arrive at level ${Math.max(2,arc)+1} or higher, with gear and HQ bonuses you choose. One per arc, from Arc 2.</div><button class="btn ${xo?'pri':''}" data-a="ostart:xover" data-tip="kw:crossover" ${xo&&!full?'':'disabled'}>${xl}</button></div></div>
    ${qb.length?coll('hq-qb',`<span class="eyebrow" data-tip="kw:quickbuild">Quick builds · ${qb.length}</span>`,`<p class="small muted" style="margin:0">The classic Guardians lineup, ready to go. Same rules as a basic hero: level 1 and no gear.</p><div class="grid2">${qb.map(qbCard).join('')}</div>`,!n,'nested'):''}`)}</section>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.build=(p1)=>{if(facOpen(p1)&&afford(FAC[p1].cost)){pay(FAC[p1].cost);S.facilities.push(p1)}};
ACT.qb=(p1)=>{recruitQuick(p1)};
