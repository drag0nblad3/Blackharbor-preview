/* battle/view.js: Fight screen: splash pages, hit ticks, zones, combat brief, sdView. */
/* Version 130 (Tyler): a splash page opens every fight with the villain's line for how the investigation went,
   and another closes it with the villain's escape (win) or taunt (loss). Headless sims never see either. */
let fsSeen='';
function fsplashView(){const sd=S.sd;if(FAST||S.phase!=='sd'||!sd||sd.patrol)return '';
  const keys=sd.vl.map(o=>o.key),q=sd.quality,id=(sd.intro?'in':sd.result)+S.vol+'.'+S.issue+keys.join(),still=id===fsSeen?' still':'';fsSeen=id;
  if(sd.intro){const head=sd.finale&&S.event?`Event comic · ${esc(S.event.title)}`:`Issue #${S.issue} · Lair showdown`;
    return `<div id="fsplash" class="${still}" role="dialog" aria-modal="true" aria-label="The fight begins">${keys.map((k,i)=>{const d=VILLAINS[k];
      return `<div class="fs fsv-${k}" style="${vSty(k)}"><span class="fsem">${vIc(k)}</span><span class="fsfx" aria-hidden="true">${VSFX[k]||''}</span><small>${head} · Level ${sd.vl[i].v.level}</small><b class="fsn">${esc(d.name)}</b>${i===0?`<span class="fsq" data-tip="kw:q_${q}">${QUAL[q].n}</span>`:''}
        <div class="say">“${esc(vLine(k,q))}”</div>${i===keys.length-1?`<div class="fsd">${QUAL[q].txt}</div>`:''}</div>`}).join('')}
      <div class="fsb"><button class="btn pri" data-a="sdgo">${q==='ambush'?'Brace yourselves!':'Fight!'}</button></div></div>`}
  if(sd.result&&!sd.busy&&!sd.outro){const win=sd.result==='win',t=win?'escape':'taunt';
    const head=win?(sd.finale?'City saved!':'Victory!'):sd.result==='loss'?(sd.finale?'Blackharbor falls':'Defeat'):'Slipped away';
    return `<div id="fsplash" class="${still}" role="dialog" aria-modal="true" aria-label="${head}">${keys.map((k,i)=>{const d=VILLAINS[k];
      return `<div class="fs fsv-${k}" style="${vSty(k)}"><span class="fsem">${vIc(k)}</span><span class="fsfx" aria-hidden="true">${VSFX[k]||''}</span>${i===0?`<span class="fsx ${win?'':'bad'}">${head}</span>`:''}<small>${win?'Escaping':'Gloating'}</small><b class="fsn">${esc(d.name)}</b>
        <div class="say">“${esc(vLine(k,t))}”</div>${i===keys.length-1?`<div class="fsd">${win?(sd.finale?'The playbooks are empty and Blackharbor is safe, for now.':`${esc(d.short)} slips away in the chaos${d.intro?'. Something tells you he\'ll be back.':' and will be back a level stronger.'}`):'The team is carried out of the lair.'}</div>`:''}</div>`}).join('')}
      <div class="fsb"><button class="btn" data-a="sdlook">See the board</button><button class="btn pri" data-a="debrief">Debrief</button></div></div>`}
  return ''}
/* Version 134 (Tyler): hit feedback. Each render compares health and torn pages with the last render of the same fight and
   floats a damage number where something dropped. A hero losing 3+ health or a villain losing 2+ pages shakes the board. */
let HPS={sd:null,m:{}},SHK=0;
function hitTick(sd){const fresh=HPS.sd!==sd;if(fresh)HPS={sd,m:{}};const m=HPS.m;let big=false;
  const see=(key,val,cx,cy,k,bigAt)=>{const was=m[key];m[key]=val;if(fresh||was==null||val>=was)return;const d=was-val;fx(cx+.3,cy-.3,'−'+d,k);if(d>=bigAt)big=true};
  sd.units.forEach(o=>{const c=HC(o.x,o.y);see('h'+o.hid,heroOf(o).hp,c.cx,c.cy,'dmgh',3)});
  sd.hench.forEach(x=>{const c=HC(x.x,x.y);see('m'+x.id,x.hp,c.cx,c.cy,'dmg',9)});
  sd.vl.forEach((o,i)=>{const c=vCtr(o.v);see('v'+i,-(o.v.wounds||[]).length,c.cx,c.cy,'dmg',2)});
  if(big)SHK=Date.now()}
/* Version 141 (Tyler): subtle facing zones. Hexes up to two away in a villain's front arc get the lair's --zf tint and its
   blind spot gets --zr (sideOf decides). Hidden Nocturne shows none. Drawn above the floor, under every token. */
function vZones(W,H){const sd=S.sd;if(sd.result)return '';let s='';const wl=new Set((sd.walls||[]).map(w=>w.k));
  sd.vl.forEach(o=>{const v=o.v;if(v.down||v.hide)return;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!inB(x,y)||inV(v,x,y)||wl.has(x+','+y))continue;const d=dV({x,y},v);if(d<1||d>2)continue;const z=sideOf({x,y},v);if(z==='flank')continue;const h=HC(x,y);
      s+=`<polygon class="z${z==='front'?'f':'r'}${d>1?' z2':''}" points="${VHX(h.cx,h.cy,.97)}"/>`}});
  return s?`<svg class="zones" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`:''}

/* Compact mission telemetry: make the board/action hierarchy useful on every device. */
function bhCombatBrief(sd,def,h,v){
  const title=sd.patrol?'Subway patrol':sd.finale&&S.event?S.event.title:def.name;
  const quality=sd.patrol?'Patrol':QUAL[sd.quality]?QUAL[sd.quality].n:'Showdown';
  return `<header class="bh-combat-brief" aria-label="Current tactical situation">
    <div class="bh-combat-title">
      ${!sd.patrol?`<span class="vportrait-combat">${vPortrait(sd.vkey,'combat')}</span>`:''}
      <div class="bh-combat-title-copy"><span>${esc(quality)} · Round ${Math.max(1,sd.round)}</span>
        <h2>${esc(title)}</h2></div></div>
    <div class="bh-combat-metrics">
      ${!sd.patrol?`<div data-tip="kw:playbook"><b>${remainingPages(v)}</b><small>Pages left</small></div>`:''}
      <div data-tip="kw:henchman"><b>${sd.hench.filter(m=>m.hp>0).length}</b><small>Enemies</small></div>
      <div data-tip="kw:civilian"><b>${sd.civs.length}</b><small>Civilians</small></div>
      <div data-tip="kw:evac"><b>${sd.evac}</b><small>Evacuated</small></div>
      <div class="bh-combat-selected"><b>${h?esc(h.name):'Choose hero'}</b><small>${h?`HP ${h.hp}/${stat(h,'maxHp')} · COMP ${h.comp}/${stat(h,'maxComp')}`:'Tap a hero on the board'}</small></div>
    </div>
  </header>`;
}
function sdView(){const sd=S.sd,def=VILLAINS[sd.vkey],v=sd.v;
  const u=sd.sel!=null?sd.units[sd.sel]:null,h=u?heroOf(u):null;
  let reachM={},tg=new Set(),al=new Set();
  if(u&&!sd.busy){if(sd.mode==='move'&&mvOk(u)){reachM=heroReach(u,h);if(reMoveOk(u)){if(!blocked(u.mv.x,u.mv.y,{self:u}))reachM[u.mv.x+','+u.mv.y]=0;delete reachM[u.x+','+u.y]}}
    const rng=stat(h,'range');
    const vt=o=>vCells(o.v).forEach(({x,y})=>tg.add(x+','+y));
    if(sd.mode==='attack'||sd.mode==='arc'){sd.vl.forEach(o=>{if(!o.v.down&&dV(u,o.v)<=rng&&!shotVB(u,o.v))vt(o)});sd.hench.forEach(m=>{if(cheb(m,u)<=rng&&!shotBlocked(u,m))tg.add(m.x+','+m.y)})}
    if(sd.mode==='patch')live().forEach(o=>{if(cheb(o,u)<=3)al.add(o.x+','+o.y)});
    const sab=sd.abKey&&GEAR[sd.abKey]&&GEAR[sd.abKey].ab,sr=sab&&sab.r!=null?abV(sab.r,potOf(h)):0;
    if(sd.mode==='abally')live().forEach(o=>{if(cheb(o,u)<=sr&&allyAbilityOK(u,o,sab))al.add(o.x+','+o.y)});
    if(sd.mode==='abstrike')sd.vl.forEach(o=>{if(!o.v.down&&(!sab.rng||dV(u,o.v)<=sab.rng))vt(o)});
    if(sd.mode==='barricade')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},u)<=2&&!blocked(x,y))reachM[x+','+y]=1;
    if(sd.mode==='abblast')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},u)<=sr&&!shotBlocked(u,{x,y}))tg.add(x+','+y);
    if(sd.mode==='abtele'||sd.mode==='abcover')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(cheb({x,y},u)<=sr&&!blocked(x,y))reachM[x+','+y]=1}
  const W=BW(),H=BH(),P=(x,y)=>{const c=HC(x,y);return `left:${(c.cx-.5)*100/W}%;top:${(c.cy-HS)*100/H}%;width:${100/W}%;height:${2*HS*100/H}%`},D=(x,y)=>{const c=HC(x,y);return `data-cx="${c.cx}" data-cy="${c.cy}"`};
  const blindK=new Set(),frontK=new Set();sd.vl.forEach(o=>{if(o.v.down||o.v.hide)return;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p={x,y};if(inV(o.v,x,y)||dV(p,o.v)>3)continue;const sd2=sideOf(p,o.v);if(sd2==='rear')blindK.add(x+','+y);else if(sd2==='front')frontK.add(x+','+y)}});
  const blastK=new Set(),blast2K=new Set();(sd.bombs||[]).forEach(b=>hexesWithin(bombP(b),bombRadius(b)).forEach(p=>(b.fuse<=1?blastK:blast2K).add(p.x+','+p.y)));
  const litM=litMap();let cells='';for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=x+','+y;const c=['cell'];if(litM[k])c.push('beam');if(blindK.has(k))c.push('blind');else if(frontK.has(k))c.push('front');if((sd.exits||[]).includes(k))c.push('exit');if(sd.obs.includes(k))c.push('obs');if(sd.walls&&sd.walls.some(w=>w.k===k))c.push('wall');if(sd.pits&&sd.pits.includes(k))c.push('pit');if(sd.haz&&sd.haz.some(h=>h.k===k))c.push('haz');if(blastK.has(k))c.push('blast');else if(blast2K.has(k))c.push('blast2');if(bossMarked(k)||sd.vl.some(o=>o.v.charge&&o.v.charge.zone.includes(k)))c.push('tele');if(sd.firing&&sd.firing.includes(k))c.push('firing');if(k in reachM)c.push('reach');if(tg.has(k))c.push('tgt');if(al.has(k))c.push('ally');
    cells+=`<button class="${c.join(' ')}" data-cell="${k}" data-tip="cell:${x}:${y}" style="${P(x,y)}" aria-label="Hex ${x+1},${y+1}${(sd.exits||[]).includes(k)?', exit':''}${blindK.has(k)?', blind spot':frontK.has(k)?', front arc':''}${litM[k]?', lit beam':''}">${c.includes('wall')?wallArms(x,y):''}${bossMarked(k)?'<small aria-hidden="true">!</small>':''}</button>`}
  if((sd.beams||[]).length)cells+=`<svg class="beams" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${sd.beams.map(b=>{const[ax0,ay0]=b.k0.split(',').map(Number),[zx,zy]=b.ks[b.ks.length-1].split(',').map(Number),p=HC(ax0,ay0),z=HC(zx,zy),ln=(w,col,op)=>`<line x1="${p.cx}" y1="${p.cy}" x2="${z.cx}" y2="${z.cy}" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`;return ln(.42,'#FF2D55',b.ttl>1?.22:.14)+ln(.2,'#FF2D55',b.ttl>1?.6:.4)+ln(.07,'#FFE3EA',.95)+`<line class="flow" x1="${p.cx}" y1="${p.cy}" x2="${z.cx}" y2="${z.cy}" stroke="#fff" stroke-width=".05" opacity=".9"/><circle cx="${p.cx}" cy="${p.cy}" r=".13" fill="#FF2D55" stroke="#fff" stroke-width=".04"/>`}).join('')}</svg>`;
  const hurt=o=>o.hurtAt&&Date.now()-o.hurtAt<450?'hurt':'';
  const FR={one:1.3,tri:2.2,diamond:2.5,big:3.4,serpent:1.3,swarm:1.3};
  const VT=[];sd.vl.forEach((o,i)=>{const v=o.v;if(v.down)return;const fc=sd.vl.length>1&&i===sd.vi?'focus':'';
    if(v.sw){swBodies(v).forEach(b=>VT.push([b.y,`<div class="vtok ${hurt(v)} ${fc}" data-tid="v${i}${b.i?'s'+b.i:''}" ${D(b.x,b.y)} style="${P(b.x,b.y)};${vSty(b.k)}">${vStandee(b.k,[{x:b.x,y:b.y}],null,b.i?0:v.level,b.x,b.y,1)}<span class="face" style="left:50%;top:50%;width:130%;--fa:${FACE_DEG[b.f??5]}deg" data-tip="kw:swarm"><i></i></span></div>`]));return}
    const a=HC(v.x,v.y),cc=vCtr(v),cs=vCells(v);
    VT.push([Math.max(...cs.map(c=>c.y)),`<div class="vtok ${hurt(v)} ${v.charge?'charging':''} ${fc}" data-tid="v${i}" ${D(v.x,v.y)} style="${P(v.x,v.y)};${vSty(o.key)}">${vStandee(o.key,v.body?[cs[0]]:cs,v.body?cs.slice(1):null,v.level,v.x,v.y,0,v.hide)}<span class="face${v.hide?' hid':''}" style="left:${(cc.cx-a.cx)*100+50}%;top:${(cc.cy-a.cy)*100/(2*HS)+50}%;width:${(FR[v.shape]||1.3)*100}%;--fa:${v.hide?0:FACE_DEG[v.face??5]}deg" data-tip="kw:${v.hide?'vhide':'facing'}">${v.hide?'<em>?</em>':'<i></i>'}</span></div>`])});
  let toks='';
  sd.vl.forEach(o=>{const v=o.v;if(v.down||!v.warn||!v.planned||v.planned.uid!==v.warn)return;const cc=vCtr(v),lo=cc.cy<2.2,ext=(FR[v.shape]||1.3)/2;if(v.hush===v.warn)return;toks+=`<div class="shout ${lo?'below':''}" data-a="hush:${sd.vl.indexOf(o)}" role="button" aria-label="Dismiss shout" style="left:${cc.cx*100/W}%;top:${(cc.cy+(lo?ext:-.3))*100/H}%">“${esc(v.planned.shout)}”</div>`});
  (sd.exits||[]).forEach(k=>{const[x,y]=k.split(',').map(Number);if(sd.units.some(o=>!o.ko&&o.x===x&&o.y===y)||sd.civs.some(c=>c.x===x&&c.y===y))return;const h=HC(x,y);
    toks+=`<div class="tok exitt" ${D(x,y)} style="${P(x,y)}" data-tip="kw:exit">${miniSvg(x,y,MINI.exitA(h.cx,h.cy,y>=N-1?90:y===0?-90:x===0?180:0))}</div>`});
  if(sd.term){const p=termP(),h=HC(p.x,p.y);VT.push([p.y,`<div class="tok termt" ${D(p.x,p.y)} style="${P(p.x,p.y)}" data-tip="kw:terminal">${miniSvg(p.x,p.y,MINI.terminal(h.cx,h.cy))}</div>`])}
  (sd.bombs||[]).forEach(b=>{const p=bombP(b),h=HC(p.x,p.y);VT.push([p.y,`<div class="tok bombt" ${D(p.x,p.y)} style="${P(p.x,p.y)}">${miniSvg(p.x,p.y,MINI.bomb(h.cx,h.cy,b.fuse,b.fuse<=1))}</div>`])});
  sd.civs.forEach(c=>{const fu=c.f&&sd.units.find(o=>o.hid===c.f),held=civHeld(c),pz=!sd.busy&&!sd.result&&panicky(c),pn=c.panic&&Date.now()-c.panic<1200,h=HC(c.x,c.y);
    const ring=fu?BASE(heroOf(fu)).col:held?'#C92463':null,art=MINI.civArt(eyeHash(c.id),{panic:pz||held||pn});
    VT.push([c.y,`<div class="tok civt ${pn?'panic':''}" data-tid="c${c.id}" ${D(c.x,c.y)} style="${P(c.x,c.y)}" title="Civilian">${miniSvg(c.x,c.y,miniStand(h.cx,h.cy,art,'#F3CB4B',ring,.8,pz?miniBang:null,'crim'))}</div>`])});
  sd.hench.forEach(m=>{const h=HC(m.x,m.y),[b,a]=VART[m.owner]||VART.mole,art=(MINI.HF[m.owner]||MINI.HF.swarm)(b,a),el=m.elite;
    VT.push([m.y,`<div class="tok hmt ${hurt(m)}" data-tid="m${m.id}" title="${m.shadow?'Stolen shadow · 1 HP':m.infested?'Infested mite · next boss action':hName(m)}" ${el?'data-tip="kw:elite"':''} ${D(m.x,m.y)} style="${P(m.x,m.y)}">${miniSvg(m.x,m.y,miniStand(h.cx,h.cy,art,b,m.infested?'#aaff00':m.shadow?'#bb88ff':el?'#F3CB4B':null,el?.98:.86,miniNum(m.hp),'erim'))}</div>`])});
  (sd.dupes||[]).forEach(m=>{const h=HC(m.x,m.y),[b,a]=VART[m.owner]||VART.mole,art=(MINI.HF[m.owner]||MINI.HF.swarm)(b,a);
    VT.push([m.y,`<div class="tok hmt dupe" data-tid="d${m.id}" title="Shadow double · cannot be harmed · repeats her planned page" ${D(m.x,m.y)} style="${P(m.x,m.y)}">${miniSvg(m.x,m.y,miniStand(h.cx,h.cy,art,b,'#bb88ff',.86,miniNum('∞'),'erim'))}</div>`])});
  /* standees overlap the hex above, so heroes and villains are drawn top rows first (villains by their lowest row) */
  sd.units.forEach((o,i)=>{const hh=heroOf(o),b=BASE(hh);const done=o.moved&&o.acted;
    VT.push([o.y+.1,`<div class="tok hst ${o.ko?'ko':''} ${sd.sel===i?'sel':''} ${done?'done':''} ${hurt(o)}" data-tid="h${o.hid}" data-hero="${hh.cls}" ${D(o.x,o.y)} style="${P(o.x,o.y)}"><span class="st" title="${esc(hh.name)}">${standee(hh,o)}${o.guard?'<span class="gd"></span>':''}${hh.comp<=0&&!o.ko?'<span class="sh">!</span>':''}</span></div>`])});
  VT.sort((p,q)=>p[0]-q[0]).forEach(t=>toks+=t[1]);
  if(!FAST)hitTick(sd);const now=Date.now();(sd.fx||[]).forEach(f=>{const el=now-f.born;if(el>1600)return;
    toks+=`<div class="fx k-${f.k}" style="left:${f.cx*100/W}%;top:${f.cy*100/H}%;animation-delay:-${el}ms" aria-hidden="true"><div class="b"><span>${esc(f.t)}</span></div></div>`});
  const pipT=remainingPages(v)+v.wounds.length;
  const vbar=bossStatusView()+`<div class="pips" aria-label="Playbook" data-tip="kw:pips">${v.planned?'<span class="pip f" title="Charging"></span>':''}${v.deck.map(()=>'<span class="pip f"></span>').join('')}${v.discard.map(()=>'<span class="pip d"></span>').join('')}${v.wounds.map(()=>'<span class="pip w"></span>').join('')}</div>`;
  let ctrl,ctrlRest='';
  if(sd.result&&sd.patrol){ctrl=`<div class="cap"><b>Patrol cleared.</b> Both Diggers are down.</div><button class="btn pri" data-a="tut:hq">Head back to HQ</button>`}
  else if(sd.result){ctrl=`<div class="cap"><b>${sd.result==='win'?'Victory.':sd.result==='loss'?'Defeat.':'Escape.'}</b> Head back to HQ to count the cost.</div><button class="btn pri" data-a="debrief">Debrief</button>`}
  else if(sd.busy){ctrl=`<div class="cap">${sd.vturn?`${def.name} is acting…`:'Resolving…'}</div>`}
  else if(u&&h){const p=POWERS[BASE(h).power];const canAct=!u.acted&&!u.ko;const adjCiv=sd.civs.some(c=>c.f!==u.hid&&!civHeld(c)&&cheb(c,u)<=1),nFol=followers(u).length;
    const freeP=!!p.free;
    ctrl=`<div class="row between hrow"><div class="hwho">${eyesArt(h)}<div><h3>${esc(h.name)}</h3><div class="small muted hline"><span data-tip="kw:hp">${UI('hp')}${h.hp}/${stat(h,'maxHp')}</span> · <span data-tip="kw:comp">${UI('comp')}${h.comp}/${stat(h,'maxComp')}</span>${h.comp<=0?' · <b style="color:var(--magenta)" class="kwd" data-tip="kw:shaken">Shaken (−3 STR/ACC/EVA, −1 MOV)</b>':''}${u.dazed?' · <span class="kwd" data-tip="kw:dazed">Dazed</span>':''}</div></div></div>
      <span class="hst"><span class="${u.moved?'used':''}" title="${u.moved?'Moved':'Can move'}" aria-label="${u.moved?'Moved':'Can move'}">${UI('move')}</span><span class="${u.acted?'used':''}" title="${u.acted?'Acted':'Can act'}" aria-label="${u.acted?'Acted':'Can act'}">${UI('atk')}</span></span></div>
      <div class="row">
        <button class="btn sm sub ${sd.mode==='move'?'on':''}" data-a="mode:move" data-tip="act:move" ${mvOk(u)?'':'disabled'}>${UI('move')}Move<small>${reMoveOk(u)?'Adjust':`${stat(h,'move')+(u.boost||0)} hex${stat(h,'move')+(u.boost||0)===1?'':'es'}`}</small></button>
        <button class="btn sm sub ${sd.mode==='attack'?'on':''}" data-a="mode:attack" data-tip="act:attack" ${canAct?'':'disabled'}>${UI('atk')}Attack<small>Range ${stat(h,'range')}</small></button>
        ${endRoundBtn()}
        ${combatMenus(u,h)}
      </div>
      ${combatInfo(u,h)}
      ${combatTargetHelp(u,h)&&!(sd.combatPick&&sd.combatPick.armed&&sd.combatPick.hid===u.hid)?`<div class="cap combat-target-help">${esc(combatTargetHelp(u,h))}</div>`:''}`;
    ctrlRest=`
      <div class="resrow"><span class="r" style="--tc:var(--cyan)" data-tip="kw:comp">${UI('comp')} ${[...Array(stat(h,'maxComp'))].map((_,i)=>`<i class="${i<h.comp?'f':''}"></i>`).join('')} <b class="mono">${h.comp}/${stat(h,'maxComp')}</b></span></div>
      ${pwrMax(h)||arcMax(h)||potOf(h)?`<div class="resrow">${pwrMax(h)?`<span class="r t-tech" data-tip="res:tech">PWR ${[...Array(pwrMax(h))].map((_,i)=>`<i class="${i<u.res.tech?'f':''}"></i>`).join('')} <b class="mono">${u.res.tech}/${pwrMax(h)} · +${pwrRegen(h)}/rd</b></span>`:''}${arcMax(h)?`<span class="r t-magic" data-tip="res:magic">ARC ${[...Array(arcMax(h))].map((_,i)=>`<i class="${i<u.res.magic?'f':''}"></i>`).join('')} <b class="mono">${u.res.magic}/${arcMax(h)}</b></span>`:''}${potOf(h)?`<span class="r t-innate" data-tip="res:innate">POT <b class="mono">${potOf(h)}</b> · ${Math.max(0,innUses(h)-(u.innUsed||0))?'Innate ready':'Innate used'}</span>`:''}</div>`:''}
      ${bridgeRow(u,h)}
      ${u.reactionWard?'<div class="cap">Reaction Ward: immune to reaction damage this round.</div>':''}${(u.boost||u.buffDice||u.buffStr||u.ward||u.absorb||u.evaNext||u.buffAcc||u.buffBack||u.buffReap||u.dr||u.buffEva||u.avoidDamage||u.anchor)?`<div class="row">${u.boost?`<span class="tag g" data-tip="kw:boost">+${u.boost} next move${u.boostJump?' (jump)':''}</span>`:''}${u.buffDice?`<span class="tag g" data-tip="kw:buff">+${u.buffDice} dice next attack</span>`:''}${u.buffStr?`<span class="tag g" data-tip="kw:buff">${signedBonus(u.buffStr)} Strength next attack</span>`:''}${u.ward?'<span class="tag g" data-tip="kw:warded">Warded</span>':''}${u.absorb?`<span class="tag g" data-tip="kw:absorb">Shield: absorbs ${u.absorb}</span>`:''}${u.buffAcc?`<span class="tag g" data-tip="kw:buff">${signedBonus(u.buffAcc)} accuracy next attack</span>`:''}${u.buffBack?`<span class="tag g" data-tip="kw:buff">+${u.buffBack} dice on a melee attack from a side or the rear</span>`:''}${u.buffReap?`<span class="tag g" data-tip="kw:buff">Reap ${u.buffReap} per page</span>`:''}${u.dr?`<span class="tag g" data-tip="kw:guard">Guard −${u.dr} per hit</span>`:''}${u.buffEva?`<span class="tag g" data-tip="kw:guard">+${u.buffEva} evasion</span>`:''}${u.avoidDamage?`<span class="tag g" data-tip="kw:guard">Avoid Damage +${avoidEva(u)} evasion</span>`:''}${u.evaNext?`<span class="tag g" data-tip="kw:windward">Wind Ward +${u.evaNext} evasion</span>`:''}${u.anchor?'<span class="tag g" data-tip="kw:anchor">Anchored</span>':''}</div>`:''}
      ${auraTags(u)}${u.ripo||(gearHas(h,'relent')&&u.relN&&u.relKey===sd.vkey)?`<div class="row">${u.ripo?'<span class="tag g" data-tip="kw:riposte">Riposte ready</span>':''}${gearHas(h,'relent')&&u.relN&&u.relKey===sd.vkey?`<span class="tag g" data-tip="kw:relent">Relentless +${Math.min(1,u.relN)} vs ${VILLAINS[sd.vkey].short}</span>`:''}</div>`:''}
      ${sd.mode==='rallySpirit'&&canAct?`<div class="cap">Rally Spirit: tap yourself or an ally within ${lvlOf(h)} hexes to restore 3 composure. Uses your action.</div>`:''}
      ${(sd.mode==='attack'||sd.mode==='arc')&&canAct&&!tg.size?`<div class="cap">Nothing in range. ${esc(h.name)} reaches ${stat(h,'range')} hex${stat(h,'range')===1?'':'es'}${stat(h,'range')===1?', so they must stand next to the target':''}, and walls, rubble and other units block shots. Move first, then attack.</div>`:''}
      <div class="eyebrow">Character sheet</div>${heroCard(h,'fight')}`}
  else ctrl=`<div class="small muted">Tap a hero to select them. Each hero can move once and take one action per round. Until a hero acts, tap another blue hex to change where they end their move. Long-press any hex to see what is on it, or any button, stat or keyword for details.</div>`;
  const last=(v.last?`<div class="cap"><b>${esc(v.last.n)}.</b> ${esc(v.last.txt)}</div>`:'')+
    sd.vl.map(plannedView).join('')+
    sd.vl.filter(o=>o.v.charge&&!o.v.down).map(o=>`<div class="cap charge"><b>${VILLAINS[o.key].short}: ${esc(o.v.charge.n)}</b> Fires for ${o.v.charge.dmg} in the marked hexes next villain turn.</div>`).join('')+
    ((sd.bombs||[]).length?`<div class="cap charge" data-tip="kw:bomb"><b>${sd.bombs.length} lit bomb${sd.bombs.length>1?'s':''} on the board.</b> All bombs explode at the start of the next villain turn. Move outside every red-striped blast hex; advanced bombs may cover 19 hexes instead of 7.</div>`:'')+
    (v.repress?'<div class="cap">Next revealed hit reaction is repressed.</div>':'')+(v.marked?'<div class="small"><span class="disc t-innate" data-tip="kw:marked">Marked: +1 die on side and rear attacks this round</span></div>':'')+(v.cursed?'<div class="small"><span class="disc t-magic" data-tip="kw:cursed">Cursed: −2 damage this round</span></div>':'')+
    (sd.v.hex?'<div class="small"><span class="disc t-magic" data-tip="kw:hexed">Hexed: −${hexA(sd.v.hex)} evasion this round</span></div>':'')+(v.skip?'<div class="small"><span class="disc t-magic" data-tip="kw:frozen">Time Stop: loses its next turn</span></div>':'')+(v.blind?'<div class="small"><span class="disc t-tech" data-tip="kw:blinded">Blinded: −3 accuracy this round</span></div>':'')+(v.excise?'<div class="small"><span class="disc t-tech" data-tip="kw:excise">Find the Flaw: you pick the next page torn this round</span></div>':'')+(v.callout?`<div class="small"><span class="disc t-tech" data-tip="kw:callout">Called out: +${v.callout} dice on the next hero attack</span></div>`:'');
  return `<div class="sdl">${bhCombatBrief(sd,def,h,v)}<section class="panel sdp">
    <div class="bhd">    <div class="row between"><div>${sd.patrol?`<div class="eyebrow">Patrol · Round ${sd.round}</div><h2>Subway platform</h2>`:`<div class="eyebrow">${sd.finale?'Event comic':'Lair showdown'} · Round ${Math.max(1,sd.round)} · <span class="kwd" data-tip="kw:q_${sd.quality}">${QUAL[sd.quality].n}</span></div><h2>${sd.finale&&S.event?esc(S.event.title):def.name}</h2>`}</div>
    <span class="small mono" data-tip="kw:evac">Evac ${sd.evac} · Harmed ${sd.harmed}</span></div>
    ${sd.vl.length>1?`<div class="row vswitch"><span class="eyebrow">Target</span>${sd.vl.map((o,i)=>`<button class="btn sm ${i===sd.vi?'on':''}" data-a="focus:${i}" ${o.v.down?'disabled':''} style="${vSty(o.key)}">${vIc(o.key)}${VILLAINS[o.key].short} · ${o.v.down?'down':`${remainingPages(o.v)} pages`}</button>`).join('')}</div>`:''}
    ${sd.patrol?'':`<div class="row between small"><span>${sd.vl.length>1?`<b>${VILLAINS[sd.vkey].short}</b> · `:''}<span class="kwd" data-tip="kw:playbook">Playbook</span> <b class="mono">${v.deck.length}</b> · <span class="kwd" data-tip="kw:discard">Discard</span> <b class="mono">${v.discard.length}</b> · Charging <b>${v.planned?1:0}</b> · <span class="kwd" data-tip="kw:wound">Torn</span> <b class="mono">${v.wounds.length}</b> of ${pipT}</span><button class="btn sm" data-a="book:${sd.vkey}">Read playbook</button></div>
    ${vbar}${last}`}</div>
    <div class="bcol">
    ${coll('legend','<span class="eyebrow">Board key</span>',`<div class="legend"><span data-tip="kw:civilian"><span class="vic" style="--vc:var(--yellow)">${IC('civ')}</span>Civilian</span><span data-tip="kw:exit"><i class="sw" style="background:color-mix(in srgb,var(--good) 32%,var(--panel));border:1.5px solid var(--good)"></i>Exit</span><span data-tip="kw:henchman"><span class="vic" style="${vSty(sd.vkey)};border-radius:25%">${mIc(sd.vkey)}</span>Henchman (HP)</span><span data-tip="kw:rubble"><span class="vic" style="--vc:var(--line)">${IC('rubble')}</span>Rubble</span><span data-tip="kw:walls"><i class="sw" style="background:#7A5A48"></i>Wall</span><span data-tip="kw:pit"><i class="sw" style="background:radial-gradient(#030407 40%,#3A404D)"></i>Pit</span><span data-tip="kw:haz"><i class="sw" style="background:#F08A4B"></i>Molten</span><span data-tip="kw:charge"><i class="sw" style="background:repeating-linear-gradient(45deg,#F3CB4B 0 3px,transparent 3px 6px)"></i>Charge zone</span><span data-tip="kw:terminal"><span class="vic" style="--vc:var(--cyan)">${UI('intel')}</span>Evidence terminal</span><span data-tip="kw:bomb"><span class="vic" style="--vc:#FFD27A">${IC('bomb')}</span>Bomb (fuse)</span><span data-tip="kw:braced"><i class="sw" style="background:var(--yellow);transform:rotate(45deg);width:9px;height:9px"></i>Braced</span><span data-tip="kw:facing"><i class="sw" style="width:0;height:0;border:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:10px solid var(--yellow)"></i>Facing</span><span data-tip="kw:blind"><i class="sw" style="background:color-mix(in srgb,var(--ink) 18%,var(--panel))"></i>Blind spot</span><span data-tip="kw:facearc"><i class="sw" style="background:color-mix(in srgb,var(--magenta) 22%,var(--panel))"></i>Front arc</span></div>`,false,'nested')}
    <div class="boardwrap"><div class="board${lairCls()}${Date.now()-SHK<320?' shk':''}" style="aspect-ratio:${W}/${H};animation-delay:-${Math.min(320,Date.now()-SHK)}ms">${cells}${lairCls()?'<div class="amb"></div>':''}${vZones(W,H)}${toks}</div></div></div>
    <div class="bact">${ctrl}${!sd.result&&!sd.busy&&!(u&&h)?endRoundBtn():''}</div>
    <div class="brest">${ctrlRest}</div>
  </section>
  <section class="panel sdlog">${coll('sd-log','<div class="eyebrow">Combat log</div>',`<div class="log">${sd.log.slice().reverse().map(l=>`<p class="${l.k}">${esc(l.t)}</p>`).join('')}</div>`)}</section></div>`}
