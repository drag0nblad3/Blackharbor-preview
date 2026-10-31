/* heroes/origin-view.js: Hero creation screens (createView, previews, quick-build cards). */
const O_STATS=[['HP','maxHp'],['MOV','move'],['DICE','speed'],['ACC','acc'],['STR','str'],['EVA','eva'],['RNG','range'],['COMP','maxComp']];
const O_SK={maxHp:'hp',move:'move',speed:'speed',acc:'acc',str:'str',eva:'eva',range:'range',maxComp:'comp'};
const TRACK_HOW={tech:'Abilities spend Power, a pool of your Tech rank + 1 for each Tech item you wear that slowly recharges during a fight. Every Tech item has an ability.',
  innate:'Abilities spend nothing but require a minimum Innate rank (1 at the start), and you fire one per round. Many grow with your Innate rank.',
  magic:'Spells spend Arcana, a pool of your Magic rank + the Magic rank each item you wear requires that does not refill during a fight. Spells hit harder, and every Magic weapon carries one.'};
const trackTxt=t=>`${TRACKS[t].name} discipline: ${TRACK_HOW[t]} Ranks go up to ${RANK_MAX}, and rank ${RANK_MAX} is a capstone: ${perkTxt(t,RANK_MAX)}.`;
function oMech(sid,o,c){
  if(sid==='life')return o.field?`Field ability, ${FIELD_AB[o.field].n}: ${FIELD_AB[o.field].txt}`:`${modsTxt(o.mods)}.`;
  if(sid==='spark')return `${modsTxt(o.mods)}. ${trackTxt(o.track)}`;
  if(sid==='gift')return `Signature power, ${POW_ENG[o.power].d==='innate'?'':'costs '}${powCost(o.power)}. ${POWERS[o.power].txt}`;
  if(sid==='style')return `Range ${o.range} (${o.range>1?'attacks from a distance':'melee, must be adjacent'}). ${modsTxt(o.mods)}.`;
  if(sid==='drive')return `${modsTxt(o.mods)}.`;
  if(sid==='career'){const L=xArc()+1+(o.lvl||0);return `Arrives at level ${L}, with ${1+(o.gear||0)} gear pick${o.gear?'s':''} and ${1+(o.hq||0)} HQ bonus${o.hq?'es':''}.`}
  if(sid==='training'){const r=oRanks({...c,picks:{...c.picks,training:o.id}});return `Ends with ${Object.keys(TRACKS).filter(t=>r[t]).map(t=>`${TRACKS[t].name} ${r[t]}`).join(' · ')}. Every rank opens higher gear; rank 5 adds a capstone. Tech and Magic ranks add 2 to their pool, Innate ranks unlock and strengthen Innate abilities. Ranks cap at ${RANK_MAX}.`}
  if(sid==='hq')return o.txt;
  return ''}
function oHero(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover';const h={...newHero('custom',b.name,b),ranks:r.ranks,upgrades:xo?c.ups.slice():[],gear:{}};if(xo)c.gear.forEach(g=>putGear(h,g));return h}
function oPreview(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover',h=oHero(c);
  const st=O_STATS.map(([l,k])=>{const v=stat(h,k),d=v-O_TEMPLATE[k];return `<div class="stat ${d>0?'up':d<0?'dn':''}" data-tip="ostat:${k}"><b>${(k==='acc'||k==='str')&&v>=0?'+':''}${v}</b><span>${l}</span></div>`}).join('');
  const sp=oOpt('spark',c.picks.spark),gift=oOpt('gift',c.picks.gift);
  return `<aside class="card opv"><div class="eyebrow">The hero so far</div>
    <div class="row"><span class="sw" style="background:${c.col};border-radius:50%;width:16px;height:16px"></span><h3>${esc(b.name)}</h3><span class="lvl">LVL ${r.level}</span></div>
    <div class="small muted">${esc(b.role)}</div>
    ${sp?`<div class="row">${Object.keys(TRACKS).filter(t=>r.ranks[t]).map(t=>`<span class="disc fill t-${t}" data-tip="kw:${t}">${TRACKS[t].name} ${r.ranks[t]}</span>`).join('')}</div>`:''}
    ${sp?`<div class="small muted" data-tip="kw:engines">Engines: ${poolTxt(h)}</div>`:''}
    <div class="stats">${st}</div>
    ${gift?`<div class="small" data-tip="pow:${gift.power}"><b>${POWERS[gift.power].name}.</b> ${POWERS[gift.power].txt}</div>`:''}
    ${b.field?`<div class="small fieldab" data-tip="kw:field"><b>${b.field.n}</b> ${b.field.txt}</div>`:''}
    ${xo&&c.gear.length?`<div class="small"><b>Gear:</b> ${c.gear.map(g=>GEAR[g].name).join(', ')}</div>`:''}
    <p class="small muted" style="margin:0">Long-press a stat to see where it came from.</p></aside>`}
function createView(){const c=S.cre,steps=oSteps(c),sid=steps[c.step],pg=ORIGIN[sid],xo=c.mode==='xover',last=c.step===steps.length-1;
  const strip=`<div class="ostrip">${steps.map((s,i)=>`<span class="${i<c.step?'f':i===c.step?'cur':''}" title="${ORIGIN[s].t}"></span>`).join('')}</div>`;
  const head=`<div class="ohead ${xo?'xo':''}"><small>${xo?'Crossover Issue · Established Character':'Origin Story · Basic hero'} · Page ${c.step+1} of ${steps.length}</small>${strip}</div>`;
  const navb=`<div class="row between"><button class="btn" data-a="${c.step?'oback':'ocancel'}">${c.step?'Back':'Cancel'}</button>${last?'':`<button class="btn pri" data-a="onext" ${oValid(c,sid)?'':'disabled'}>${steps[c.step+1]==='cover'?'See the cover':'Next page'}</button>`}</div>`;
  if(sid==='cover')return `<section class="panel ocomic">${head}${oCover(c)}${navb}</section>`;
  const optBtn=(o,sel,mech,extra='')=>`<button class="btn opt oopt ${sel?'sel':''}" data-a="opick:${sid}:${o.id}" data-tip="oopt:${sid}:${o.id}" ${extra}><span class="on">${esc(o.n)}</span>${o.fl?`<i class="fl">“${esc(o.fl)}”</i>`:''}<small class="mech">${mech}</small></button>`;
  let inner='';
  if(sid==='spark'){const sp=oOpt('spark',c.picks.spark),d=c.disc||(sp&&sp.track);
    inner=`<div class="eyebrow">First, pick a discipline</div><div class="ogrid odisc">${Object.keys(TRACKS).map(t=>`<button class="btn opt oopt t-${t} ${d===t?'sel':''}" data-a="odisc:${t}" data-tip="kw:${t}"><span class="on" style="color:var(--tc)">${TRACKS[t].name}</span><small class="mech">${trackTxt(t)}</small><small>${O_POW[t].length} powers: ${O_POW[t].map(p=>POWERS[p].name).join(', ')}</small></button>`).join('')}</div>
    ${d?`<div class="eyebrow">Then, how it happened</div><div class="ogrid">${pg.opts.filter(o=>o.track===d).map(o=>optBtn(o,c.picks.spark===o.id,oMech(sid,o,c))).join('')}</div>`:''}`}
  else if(['life','style','drive','career'].includes(sid))inner=`<div class="ogrid">${pg.opts.map(o=>optBtn(o,c.picks[sid]===o.id,oMech(sid,o,c))).join('')}</div>`;
  else if(sid==='gift'){const sp=oOpt('spark',c.picks.spark);inner=`<p class="small muted" style="margin:0">These are the ${O_POW[sp.track].length} <b class="t-${sp.track}" style="color:var(--tc)">${TRACKS[sp.track].name}</b> powers. Go back a page to see another discipline's. Free powers don't use your action. Tech powers spend Power, Magic powers spend Arcana, and Innate powers require Innate rank and use the hero's one Innate ability for the round.</p><div class="ogrid">${O_POW[sp.track].map(id=>optBtn(oOpt('gift',id),c.picks.gift===id,oMech('gift',oOpt('gift',id),c))).join('')}</div>`}
  else if(sid==='training'){const ex=oLevel(c)-1;inner=`<p class="small muted" style="margin:0">They arrive at level ${oLevel(c)}: ${ex} rank${ex===1?'':'s'} beyond the first.</p><div class="ogrid">${oTrainOpts(c).map(o=>optBtn(o,c.picks.training===o.id,oMech('training',o,c))).join('')}</div>`}
  else if(sid==='moves'){const need=oLevel(c)-1,rng=oOpt('style',c.picks.style).range>1;
    inner=`<div class="row"><span class="chip"><b>Picked</b>${c.ups.length}/${need}</span>${c.ups.map((u,i)=>`<button class="btn sm" data-a="ounup:${i}" title="Remove">${UPG[u].name} ✕</button>`).join('')}</div>
    <div class="ogrid">${Object.keys(UPG).filter(k=>k!=='range'||rng).map(k=>{const n=c.ups.filter(u=>u===k).length;return `<button class="btn opt oopt ${n?'sel':''}" data-a="oup:${k}" data-tip="upg:${k}" ${c.ups.length>=need||n>=2?'disabled':''}><span class="on">${UPG[k].name}${n?` ×${n}`:''}</span><small class="mech">Permanently gives ${modsTxt(UPG[k].mods)}. Up to 2 times.</small></button>`}).join('')}</div>`}
  else if(sid==='gear'){const r=oRanks(c),max=oGearMax(c),ks=Object.keys(GEAR).filter(k=>isUnlocked('gear:'+k)&&!GEAR[k].cons&&!GEAR[k].set&&canWearR(r,k)).sort((a,b)=>GEAR[b].req-GEAR[a].req);
    inner=`<div class="row"><span class="chip"><b>Picked</b>${c.gear.length}/${max}</span><span class="small muted">One item per slot. Only blueprints you have unlocked and they can wear are shown.</span></div>
    ${ks.length?`<div class="ogrid">${ks.map(k=>{const sel=c.gear.includes(k),clash=!sel&&c.gear.some(g=>GEAR[g].slot===GEAR[k].slot);return `<button class="btn opt oopt t-${GEAR[k].type} ${sel?'sel':''}" data-a="ogear:${k}" data-tip="gear:${k}" ${!sel&&(c.gear.length>=max||clash)?'disabled':''}>${gearInfo(k)}</button>`}).join('')}</div>`:'<div class="cap">No unlocked blueprint fits them yet. They arrive empty-handed.</div>'}`}
  else if(sid==='hq'){const max=oHqMax(c);inner=`<div class="row"><span class="chip"><b>Picked</b>${c.hq.length}/${max}</span></div><div class="ogrid">${oHqOpts().map(o=>{const sel=c.hq.includes(o.id);return optBtn(o,sel,o.txt,!sel&&c.hq.length>=max?'disabled':'').replace(`data-a="opick:hq:${o.id}"`,`data-a="ohq:${o.id}"`)}).join('')}</div>`}
  else if(sid==='mask')inner=`<label class="oname"><span class="eyebrow">Codename</span><input id="oname" maxlength="18" autocomplete="off" value="${esc(c.name)}" placeholder="Type or pick a name"></label>
    <div class="row"><button class="btn sm" data-a="orand">${c.sugg?'More ideas':'Suggest codenames'}</button>${(c.sugg||[]).map((n,i)=>`<button class="btn sm ${c.name===n?'on':''}" data-a="osug:${i}">${esc(n)}</button>`).join('')}</div>
    <div class="eyebrow">Costume color</div><div class="row">${O_COLS.map(col=>`<button class="oswatch ${c.col===col?'sel':''}" data-a="ocol:${col}" style="background:${col}" aria-label="Color ${col}"></button>`).join('')}</div>`;
  return `<section class="panel ocomic">${head}<div><span class="sfxhead osfx">${pg.t}</span></div>${pg.cap?`<div class="cap tilt">${pg.cap}</div>`:''}
    <div class="obody"><div class="ocol">${inner}</div>${oPreview(c)}</div>${navb}</section>`}
function oCover(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover',gift=POWERS[b.power];
  const h=oHero(c);
  const st=O_STATS.map(([l,k])=>`<div><b>${(k==='acc'||k==='str')&&stat(h,k)>=0?'+':''}${stat(h,k)}</b><span>${l}</span></div>`).join('');
  const story=['life','spark','gift','style','drive'].concat(xo?['career','training']:[]).map(s=>{const o=s==='training'?oTrainOpts(c).find(x=>x.id===c.picks.training):oOpt(s,c.picks[s]);return o?`<li><b>${ORIGIN[s].t}:</b> ${esc(o.n)}. <span class="muted">${oMech(s,o,c)}</span></li>`:''}).join('');
  return `<div class="ocover" style="--hc:${c.col}"><small>${xo?'Special crossover issue':'Blackharbor presents'} · Issue #1</small><b>${esc(b.name)}</b><span class="ctag">${esc(b.role)}</span>
    <div class="ocstats">${st}</div><div class="small"><b>${gift.name}:</b> ${gift.txt}</div>${b.field?`<div class="small"><b>${b.field.n}:</b> ${b.field.txt}</div>`:''}
    <div class="row">${Object.keys(TRACKS).filter(t=>r.ranks[t]).map(t=>`<span class="disc fill t-${t}">${TRACKS[t].name} ${r.ranks[t]}</span>`).join('')}<span class="lvl">LVL ${r.level}</span></div></div>
    ${coll('o-story','<span class="eyebrow">The story so far</span>',`<ul class="lines small">${story}</ul>`)}
    ${xo?`<div class="card"><div class="small"><b>Signature moves:</b> ${c.ups.map(u=>UPG[u].name).join(', ')||'none'}</div><div class="small"><b>Gear:</b> ${c.gear.map(g=>GEAR[g].name).join(', ')||'none'}</div><div class="small"><b>Brings to HQ:</b> ${c.hq.map(id=>(oHqOpts().find(o=>o.id===id)||{n:id}).n).join(', ')}</div></div>`
      :'<p class="small muted" style="margin:0">Basic heroes are free. They start at level 1 with no gear and change nothing at HQ.</p>'}
    ${recruitXpTxt()}<button class="btn pri obig" data-a="ofinish">Print it! ${esc(b.name)} joins the team</button>`}
function qbCard(k){const b=HERO_BASE[k];return `<div class="card" data-tip="qb:${k}"><div class="row between"><h3>${b.name}</h3><span class="disc fill t-${b.track}">${TRACKS[b.track].name}</span></div>
  <div class="small muted">${b.role} · ${POWERS[b.power].name}${b.field?` · ${b.field.n}`:''}</div>
  <div class="small" data-tip="kw:engines">${poolTxt(newHero(k))} <span class="muted">(veteran: ${POOL_BONUS_TXT[b.track]})</span></div>
  <div class="small mono">HP ${b.maxHp} · MOV ${b.move} · DICE ${b.speed} · ACC +${b.acc} · STR +${b.str} · EVA ${b.eva} · RNG ${b.range}</div>${recruitXpTxt()}
  <button class="btn sm" data-a="qb:${k}" ${roster().length>=ROSTER_MAX?'disabled':''}>Recruit ${b.name}</button></div>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.ostart=(p1)=>{if(S.cre&&S.cre.mode===p1)S.view='create';else if(p1==='basic'||xoverOpen())oStart(p1);render();scrollTo(0,0);return NO_RENDER;};
ACT.opick=(p1,p2)=>{oPick(p1,p2)};
ACT.oup=(p1)=>{const c=S.cre;if(c.ups.length<oLevel(c)-1&&c.ups.filter(u=>u===p1).length<2)c.ups.push(p1)};
ACT.ounup=(p1)=>{S.cre.ups.splice(+p1,1)};
ACT.ogear=(p1)=>{const c=S.cre,i=c.gear.indexOf(p1);if(i>=0)c.gear.splice(i,1);else if(c.gear.length<oGearMax(c)&&!c.gear.some(g=>GEAR[g].slot===GEAR[p1].slot))c.gear.push(p1)};
ACT.ohq=(p1)=>{const c=S.cre,i=c.hq.indexOf(p1);if(i>=0)c.hq.splice(i,1);else if(c.hq.length<oHqMax(c))c.hq.push(p1)};
ACT.ocol=(p1)=>{S.cre.col=p1};
ACT.orand=()=>{S.cre.sugg=oSuggest(S.cre)};
ACT.osug=(p1)=>{const c=S.cre,n=c.sugg&&c.sugg[+p1];if(n)c.name=n};
ACT.odisc=(p1)=>{const c=S.cre,sp=oOpt('spark',c.picks.spark);c.disc=p1;if(sp&&sp.track!==p1){delete c.picks.spark;if(c.picks.gift&&!O_POW[p1].includes(c.picks.gift))delete c.picks.gift;delete c.picks.training;c.ups=[];c.gear=[]}};
ACT.onext=()=>{const c=S.cre,st=oSteps(c);if(oValid(c,st[c.step])&&c.step<st.length-1)c.step++;render();scrollTo(0,0);return NO_RENDER;};
ACT.oback=()=>{S.cre.step=Math.max(0,S.cre.step-1);render();scrollTo(0,0);return NO_RENDER;};
ACT.ocancel=()=>{S.cre=null;S.view='hq'};
ACT.ofinish=()=>{oFinish();render();scrollTo(0,0);return NO_RENDER;};
