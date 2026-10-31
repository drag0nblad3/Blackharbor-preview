/* ui/tooltips.js: Long-press / hover tips: tipFor, cellTip (board hexes), show/hide and pointer listeners. */
function tipFor(key){const[t,k,id]=key.split(':');
  if(t==='cell')return cellTip(+k,+id);
  if(t==='oopt'&&S.cre&&ORIGIN[k]){const c=S.cre,o=k==='training'?oTrainOpts(c).find(x=>x.id===id):k==='hq'?oHqOpts().find(x=>x.id===id):oOpt(k,id);if(o)return {title:o.n,eyebrow:ORIGIN[k].t,body:`${o.fl?o.fl+' ':''}${oMech(k,o,c)}`}}
  if(t==='ostat'&&S.cre&&k in O_TEMPLATE){const c=S.cre,r=oBuild(c),h=oHero(c),v=stat(h,k),lab=MODN[k]||k,w=r.why[k]||[],parts=[`Starting template: ${O_TEMPLATE[k]}`].concat(w.map(([s,d])=>`${s}: ${d>0?'+':''}${d}`));
    const fl=r.base[k]-O_TEMPLATE[k]-w.reduce((a,[,d])=>a+d,0);if(fl)parts.push(`Raised to the minimum of ${O_FLOOR[k]}: +${fl}`);const rest=v-r.base[k];if(rest)parts.push(`Ranks, upgrades, gear and ethos: ${rest>0?'+':''}${rest}`);
    return {title:`${lab[0].toUpperCase()+lab.slice(1)}: ${v}`,eyebrow:'Where this stat comes from',body:parts.join('. ')+'.'}}
  if(t==='qb'&&HERO_BASE[k]){const b=HERO_BASE[k];return {title:b.name,eyebrow:`Quick build · ${TRACKS[b.track].name} · ${b.role}`,body:`Health ${b.maxHp}, movement ${b.move}, ${b.speed} attack ${b.speed===1?'die':'dice'}, accuracy +${b.acc}, strength +${b.str}, evasion ${b.eva}, range ${b.range}, composure ${b.maxComp}. ${POWERS[b.power].name}: ${POWERS[b.power].txt}${b.field?` ${b.field.n}: ${b.field.txt}`:''} Starts with ${poolTxt(newHero(k))}, including the veteran bonus of ${POOL_BONUS_TXT[b.track]}.`}}
  if(t==='vpage'&&VILLAINS[k]){const c=pageOf(k,id);return {title:c.n,eyebrow:`${VILLAINS[k].name} · Playbook page`,body:c.txt}}
  if(t==='vrx'&&VILLAINS[k]&&rxOf(k,id)){const r=rxOf(k,id);return {title:r.n,eyebrow:`${VILLAINS[k].name} · Hit reaction`,body:rxTxt(r,vState(k)?vState(k).level:1)}}
  if(t==='kw'&&GLOSS[k])return {title:GLOSS[k][0],body:GLOSS[k][1]};
  if(GLOSS[key])return {title:GLOSS[key][0],body:GLOSS[key][1]};
  if(t==='res'&&GLOSS[key])return {title:GLOSS[key][0],body:GLOSS[key][1]};
  if(t==='pow'&&POWERS[k])return {title:POWERS[k].name,eyebrow:`Signature power · ${powCost(k)}`,body:POWERS[k].txt};
  if(t==='gear'&&GEAR[k]){const g=GEAR[k];return {title:g.name,eyebrow:g.cons?'Consumable · carried in the pouch':`Needs ${reqTxt(g)} · ${gearSlotN(g)}${g.pair?' · paired':''}`,body:`${g.cons?`Anyone can carry it, up to ${POUCH_MAX} per hero. One use, then it is gone.`:(modsTxt(g.mods)||'No passive bonus')+'.'}${gearPoolTxt(g)?` <b>Pool:</b> ${gearPoolTxt(g)}.`:''}${g.ab?` <b>${g.ab.n}</b> (${abCost(g)}${g.type==='innate'?', one Innate ability per round':''}): ${abTxt(g.ab)}`:''}${g.jumps?' <b>All your moves are jumps.</b>':''}${gearExtra(g).map(t=>' '+t).join('')}${g.field?` <b>Out of combat:</b> ${g.field.txt} Works only while the wearer is in the party.`:''}${g.set?` <span class="sn">${esc(VILLAINS[g.set].name)} set, ${SETS[g.set].n} (${SET_N} pieces):</span> ${SETS[g.set].txt}`:''} <span class="muted">Craft: ${costStr(g.cost)}.</span>`,html:true}}
  if(t==='fac'&&FAC[k])return {title:FAC[k].name,eyebrow:`Facility · ${costStr(FAC[k].cost)}`,body:FAC[k].txt};
  if(t==='upg'&&UPG[k])return {title:UPG[k].name,eyebrow:'Upgrade',body:`Permanently gives ${modsTxt(UPG[k].mods)}.`};
  if(t==='inj'&&INJ[k])return {title:INJ[k].name,eyebrow:'Lasting injury',body:`Permanently gives ${modsTxt(INJ[k].mods)}.`};
  return null}
/* Version 93: long-press any board hex for what is on it. Tokens ignore the pointer, so the hex underneath carries the tip. */
function cellTip(x,y){const sd=S.sd;if(!sd||S.phase!=='sd')return null;const k=x+','+y,G=(id,pre)=>({title:GLOSS[id][0],body:(pre||'')+GLOSS[id][1]});
  const su=sd.sel!=null?sd.units[sd.sel]:null,sh=su&&!su.ko?heroOf(su):null,need=n=>Math.min(20,Math.max(2,n)),pct=n=>Math.round(5*(21-need(n)));
  const o=sd.vl.find(o=>!o.v.down&&inV(o.v,x,y));
  if(o){const v=o.v,d=VILLAINS[o.key],L=v.level-1,eva=d.eva+L-hexA(v.hex)+diffStat('eva'),tough=d.tough+L+diffStat('tough'),acc=d.acc+vLvB('acc',v.level)-(v.blind?3:0)+diffStat('acc'),pg=remainingPages(v);
    let b=`Evasion ${eva}: an attack die plus accuracy must reach it to hit. Toughness ${tough}: a wound roll plus Strength must reach it to tear a page. Accuracy +${acc} against your heroes' evasion. ${pg} page${pg===1?'':'s'} left.`;
    if(sh){const hn=eva-stat(sh,'acc'),wn=tough-stat(sh,'str');b+=` ${sh.name} hits on ${need(hn)}+ (${pct(hn)}% per die) and wounds on ${need(wn)}+ (${pct(wn)}%), before hit cards and bonuses.`}
    b+=v.hide?' Its facing is hidden until you land a hit.':v.sw?' Each body has its own facing: attack from a side or behind for bonus dice.':' The yellow arrow is its facing. Attacks from the shaded blind spot behind it get +1 die.';
    return {title:d.name,eyebrow:`Villain · level ${v.level}`,body:b}}
  const m=sd.hench.find(m=>m.x===x&&m.y===y);
  if(m){const e=m.elite&&eliteOf(m.owner);return e?{title:e.name,eyebrow:`Special henchman · health ${m.hp}`,body:GLOSS.elite[1]}:{title:VILLAINS[m.owner].hench.name,eyebrow:`Henchman · health ${m.hp}`,body:GLOSS.henchman[1]}}
  const u=sd.units.find(o=>!o.ko&&o.x===x&&o.y===y);
  if(u){const h=heroOf(u);return {title:h.name,eyebrow:`Hero · health ${h.hp}/${stat(h,'maxHp')} · composure ${h.comp}/${stat(h,'maxComp')}`,body:`Move ${stat(h,'move')}, range ${stat(h,'range')}, ${stat(h,'speed')} attack ${stat(h,'speed')===1?'die':'dice'}, evasion ${stat(h,'eva')}. ${u.moved&&u.acted?'Done for this round.':u.moved?'Has moved, can still act.':u.acted?'Has acted, can still move.':'Can still move and act this round.'} Tap to select.`}}
  const c=sd.civs.find(c=>c.x===x&&c.y===y);
  if(c)return G('civilian',c.f?`Following ${heroOf(sd.units.find(o=>o.hid===c.f)).name}. `:civHeld(c)?'Grabbed by a henchman: knock it out to free them. ':'');
  const bm=(sd.bombs||[]).find(b=>b.k===k);if(bm){const radius=Math.max(1,Math.min(2,bm.radius||1));return G('bomb',`Explodes next villain turn. ${1+3*radius*(radius+1)}-hex blast (radius ${radius}). `)}
  if(sd.term&&sd.term.k===k)return G('terminal');
  const lit=litMap()[k];if(lit)return G('beam',`This hex deals ${lit}. `);
  if(sd.vl.some(o=>o.v.charge&&!o.v.down&&o.v.charge.zone.includes(k)))return G('charge');
  if((sd.exits||[]).includes(k))return G('exit');
  if(sd.obs.includes(k))return G('rubble');if(sd.walls&&sd.walls.some(w=>w.k===k))return G('walls');if(sd.pits&&sd.pits.includes(k))return G('pit');
  {const hz=sd.haz&&sd.haz.find(h=>h.k===k);if(hz)return G('haz')}
  for(const o of sd.vl){if(o.v.down||o.v.hide||dV({x,y},o.v)>3)continue;const sd2=sideOf({x,y},o.v);if(sd2==='rear')return G('blind');if(sd2==='front')return G('facearc')}
  return null}
let tipEl=null,lp=null,suppressClick=false;
function hideTip(){if(tipEl){tipEl.remove();tipEl=null}}
function showTip(el){const d=tipFor(el.dataset.tip);if(!d)return false;hideTip();
  tipEl=document.createElement('div');tipEl.id='tip';tipEl.setAttribute('role','tooltip');
  tipEl.innerHTML=`${d.eyebrow?`<div class="eyebrow">${esc(d.eyebrow)}</div>`:''}<h4>${esc(d.title)}</h4><div>${d.html?d.body:esc(d.body)}</div>`;
  document.body.appendChild(tipEl);const r=el.getBoundingClientRect(),t=tipEl.getBoundingClientRect();
  let x=r.left+r.width/2-t.width/2,y=r.top-t.height-10;x=Math.max(12,Math.min(innerWidth-t.width-12,x));if(y<12)y=Math.min(innerHeight-t.height-12,r.bottom+10);
  tipEl.style.left=x+'px';tipEl.style.top=y+'px';return true}
document.addEventListener('pointerdown',e=>{if(tipEl&&!e.target.closest('#tip')){hideTip()}
  const t=e.target.closest('[data-tip]');if(!t)return;
  lp={x:e.clientX,y:e.clientY,timer:setTimeout(()=>{lp=null;if(showTip(t)){suppressClick=true;tutLP(t);try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}}},430)}},{passive:true});
const cancelLP=()=>{if(lp){clearTimeout(lp.timer);lp=null}};
document.addEventListener('pointerup',cancelLP,{passive:true});document.addEventListener('pointercancel',cancelLP,{passive:true});
document.addEventListener('scroll',()=>{cancelLP();hideTip()},{passive:true,capture:true});
document.addEventListener('pointermove',e=>{if(lp&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>10)cancelLP()},{passive:true});
document.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-tip]'))e.preventDefault()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideTip();if(S.guide&&S.guide.pop){S.guide.pop=null;render()}else{const t=document.querySelector('#guide.tip1 [data-a^="tip:ok"]');if(t)t.click()}}});
