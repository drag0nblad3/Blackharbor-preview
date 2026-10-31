/* hq/workshop.js: Workshop/armory filters and search, and Skunkworks research. */
/* Version 129 (Tyler): Workshop search. Text matches the item's name and details; the dropdowns default to craftable items that fill an empty slot on someone */
const WSF_OPTS={aff:[['craft','Can craft'],['cant',"Can't afford"],['any','Any cost']],eq:[['empty','Fills empty slot'],['can','Someone can equip'],['cannot','Nobody can equip'],['any','Anyone or nobody']],
  disc:[['all','All disciplines'],['tech','Tech'],['innate','Innate'],['magic','Magic']],slot:[['all','All slots'],...Object.entries(GSLOTS),['pouch','Pouch (consumables)']]};
/* Version 130 (Tyler): the same search on each hero's equip list in the roster, judged for that hero and without the cost filter */
const EF_OPTS={eq:[['empty','Fills empty slot'],['can','Can equip'],['cannot',"Can't equip"],['any','All armory items']],disc:WSF_OPTS.disc,slot:WSF_OPTS.slot};
const wsfOf=hid=>{S.ui=S.ui||{};const O=hid?EF_OPTS:WSF_OPTS,f=hid?((S.ui.ef=S.ui.ef||{})[hid]=S.ui.ef[hid]||{}):(S.ui.wsf=S.ui.wsf||{});for(const k in O)if(!O[k].some(([v])=>v===f[k]))f[k]=O[k][0][0];if(typeof f.q!=='string')f.q='';if(!hid&&(!f.hero||f.hero!=='all'&&!roster().some(h=>h.id===f.hero)))f.hero='all';return f};
const gearQ=(k,q)=>{if(!q)return true;const g=GEAR[k],t=tipFor('gear:'+k),txt=(g.name+' '+(t?t.eyebrow+' '+t.body:'')+' '+(g.set?VILLAINS[g.set].name+' set':'')).replace(/<[^>]+>/g,' ').toLowerCase();return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>txt.includes(w))};
const wsSel=(f,O,k,hid)=>`<select data-wsf="${k}" ${hid?`data-wsh="${hid}"`:''} aria-label="${k}">${O[k].map(([v,l])=>`<option value="${v}" ${f[k]===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
function eqFilter(h){const f=wsfOf(h.id),ks=[...new Set(S.armory)].filter(g=>{const G=GEAR[g];
    if(f.eq==='empty'&&!fillsEmpty(h,g)||f.eq==='can'&&!wearOK(h,g)||f.eq==='cannot'&&wearOK(h,g))return false;
    if(f.disc!=='all'&&G.type!==f.disc&&!(G.reqs&&G.reqs[f.disc]))return false;if(f.slot!=='all'&&G.slot!==f.slot)return false;return gearQ(g,f.q)}).sort((a,b)=>wearOK(h,b)-wearOK(h,a)||GEAR[a].name.localeCompare(GEAR[b].name));
  const dflt=Object.keys(EF_OPTS).every(k=>f[k]===EF_OPTS[k][0][0])&&!f.q;
  return {ks,bar:`<div class="wsf"><input class="wsq" data-wsh="${h.id}" type="search" autocomplete="off" placeholder="Search the armory" value="${esc(f.q)}">${Object.keys(EF_OPTS).map(k=>wsSel(f,EF_OPTS,k,h.id)).join('')}</div>
    <div class="row between small"><span class="muted">${ks.length} of ${new Set(S.armory).size} armory item${new Set(S.armory).size===1?'':'s'}</span>${dflt?'':`<button class="btn sm" data-a="effreset:${h.id}">Reset filters</button>`}</div>`}}
const fillsEmpty=(h,g)=>{const G=GEAR[g];if(!wearOK(h,g))return false;if(G.cons)return true;const ks=SLOT_KEYS[G.slot]||[G.slot];
  if(G.two)return !h.gear.arms&&!h.gear.arms2;return ks.some(s=>!h.gear[s]&&!(s==='arms2'&&h.gear.arms&&GEAR[h.gear.arms].two))};
/* Version 131 (Tyler): a hero dropdown narrows the equip filters to one hero */
function wsMatch(k,f,canMake){const g=GEAR[k],R=f.hero&&f.hero!=='all'?roster().filter(h=>h.id===f.hero):roster();if(!isUnlocked('gear:'+k))return false;
  if(f.aff==='craft'&&!canMake(k)||f.aff==='cant'&&canMake(k))return false;
  if(f.eq==='empty'&&!R.some(h=>fillsEmpty(h,k))||f.eq==='can'&&!R.some(h=>wearOK(h,k))||f.eq==='cannot'&&R.some(h=>canWear(h,k)))return false;
  if(f.disc!=='all'&&g.type!==f.disc&&!(g.reqs&&g.reqs[f.disc]))return false;
  if(f.slot!=='all'&&g.slot!==f.slot)return false;
  return gearQ(k,f.q)}
function wsFind(canMake,card){const f=wsfOf(),ks=Object.keys(GEAR).filter(k=>wsMatch(k,f,canMake)).sort((a,b)=>canMake(b)-canMake(a)||!!GEAR[a].cons-!!GEAR[b].cons||GEAR[a].req-GEAR[b].req||GEAR[a].name.localeCompare(GEAR[b].name));
  const hn=f.hero!=='all'&&roster().find(h=>h.id===f.hero),O=hn?{...WSF_OPTS,eq:[['empty',`Fills ${hn.name}'s empty slot`],['can',`${hn.name} can equip`],['cannot',`${hn.name} can't equip`],['any','Any']]}:WSF_OPTS,sel=k=>wsSel(f,O,k);
  const dflt=Object.keys(WSF_OPTS).every(k=>f[k]===WSF_OPTS[k][0][0])&&!f.q&&f.hero==='all';
  const heroSel=`<select data-wsf="hero" aria-label="hero"><option value="all">All heroes</option>${roster().map(h=>`<option value="${h.id}" ${f.hero===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select>`;
  return `<div class="eyebrow">Find gear</div><div class="wsf"><input id="wsq" class="wsq" type="search" autocomplete="off" placeholder="Search names and abilities" value="${esc(f.q)}">${Object.keys(WSF_OPTS).map(sel).join('')}${heroSel}</div>
    <div class="row between small"><span class="muted">${ks.length} match${ks.length===1?'':'es'}</span>${dflt?'':'<button class="btn sm" data-a="wsfreset">Reset filters</button>'}</div>
    ${ks.length?`<div class="grid2">${ks.slice(0,40).map(card).join('')}</div>${ks.length>40?`<div class="small muted">Showing the first 40. Narrow the search to see the rest.</div>`:''}`:`<div class="cap">Nothing matches. ${f.aff==='craft'&&f.eq==='empty'?'Nothing you can afford right now fills an empty slot. Try "Someone can equip" or "Can\'t afford".':'Try loosening a filter.'}</div>`}`}
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.wsf;if(!k)return;wsfOf(e.target.dataset.wsh)[k]=e.target.value;render()});
document.addEventListener('input',e=>{if(!e.target.classList||!e.target.classList.contains('wsq'))return;const hid=e.target.dataset.wsh,v=e.target.value,p=e.target.selectionStart;wsfOf(hid).q=v;render();const n=document.querySelector(hid?`.wsq[data-wsh="${hid}"]`:'#wsq');if(n){n.focus({preventScroll:true});try{n.setSelectionRange(p,p)}catch(_){}}});

function rushCost(){const n=S.rd&&S.rd.issue===S.issue?S.rd.rush:0;return {tech:2+n,intel:1+n}}
function research(free){S.rd=S.rd&&S.rd.issue===S.issue?S.rd:{issue:S.issue,rush:0,free:false,last:null};
  if(free){if(S.rd.free)return;S.rd.free=true}else{const c=rushCost();if(!afford(c))return;pay(c);S.rd.rush++}
  const locked=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k));
  if(!locked.length){S.rd.last='Every gear blueprint is already on file.';return}
  const top=Math.max(...roster().map(lvlOf));
  const wearNow=locked.filter(k=>roster().some(h=>canWear(h,k)));
  const soon=locked.filter(k=>GEAR[k].req<=top+1);
  const pool=wearNow.length?wearNow:soon.length?soon:locked;const k=pick(pool);unlock(['gear:'+k]);
  S.rd.last=`Blueprint discovered: ${GEAR[k].name} (${reqTxt(GEAR[k])}, ${gearSlotN(GEAR[k])}).`}
function skunkPanel(){if(!S.facilities.includes('skunk'))return '';const rd=S.rd&&S.rd.issue===S.issue?S.rd:{free:false,rush:0,last:null};const c=rushCost();
  const left=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k)).length;
  return `<section class="panel">${coll('hq-skunk',`<div><div class="eyebrow">Skunkworks</div><h2>Blueprint research</h2></div>`,
    `<p class="small muted" style="margin:0">One free discovery every issue. Research favors gear someone on the team can already wear. ${left} gear blueprint${left===1?'':'s'} still undiscovered.</p>
    <div class="row"><button class="btn pri" data-a="rd:free" ${rd.free||!left?'disabled':''}>${rd.free?'Free research used':'Research (free)'}</button>
    <button class="btn" data-a="rd:rush" ${afford(c)&&left?'':'disabled'}>Rush research · ${costStr(c)}</button></div>
    ${rd.last?`<div class="cap">${esc(rd.last)}</div>`:''}`)}</section>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.wsby=(p1)=>{S.ui=S.ui||{};S.ui.wsBy=p1};
ACT.craft=ACT.crafteq=(p1,p2,p3,a)=>{if(GEAR[p1]&&afford(GEAR[p1].cost)&&anyAsk(GEAR[p1].cost)){pickAny(GEAR[p1]).then(pk=>{if(pk)doCraft(a,p1,p2,pk);render()});return NO_RENDER;}doCraft(a,p1,p2)};
ACT.anyauto=(p1)=>{S.anyAuto=p1==='1'};
ACT.wsfreset=()=>{S.ui=S.ui||{};S.ui.wsf={}};
ACT.effreset=(p1)=>{S.ui=S.ui||{};if(S.ui.ef)delete S.ui.ef[p1]};
ACT.rd=(p1)=>{research(p1==='free')};
