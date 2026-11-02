/* campaign/campaign.js: Campaign flow: unlocks, Arcs/issues, tactics and ethos, boss selection, newCampaign, difficulty, arc transitions, finishIssue, starting gear, costs and crafting. */
/* unlocks */


/* Version 82 (Tyler): villains are never captured. Beating a villain in their lair unlocks their set blueprints instead. */


const itemName=it=>{const[t,k]=it.split(':');return t==='fac'?FAC[k].name:GEAR[k].name};
const isUnlocked=it=>S.unlocked.includes(it);
function unlock(items){const out=[];for(const it of items)if(!isUnlocked(it)){S.unlocked.push(it);out.push(itemName(it))}return out}
const facOpen=k=>arcOf(Math.min(S.issue,MAX_ISSUE))>=(FAC[k].arc||1);
function unlockRandom(kind){const pool=ALL_ITEMS.filter(it=>!isUnlocked(it)&&(!kind||it.startsWith(kind+':')));if(!pool.length)return null;return unlock([pick(pool)])[0]}
function unlockSources(it){const out=[];const arc=arcOf(S.issue);
  for(const a in ARC_UNLOCK)if(+a>arc&&ARC_UNLOCK[a].includes(it))out.push(`Arc ${a}`);if(MID_UNLOCK.includes(it)&&S.issue<TIER3_ISSUE)out.push(`issue ${TIER3_ISSUE}`);
  const inVol=[...S.villains.map(v=>v.key),...S.pool];for(const k of inVol)if(DEFEAT_UNLOCK[k].includes(it))out.push(`beating ${VILLAINS[k].name}`);
  out.push('Skunkworks research','special leads');return out.join(' · ')}
const ISSUES_PER_ARC=6,ARCS=3,MAX_ISSUE=ISSUES_PER_ARC*ARCS;
const arcOf=i=>Math.min(ARCS,Math.ceil(i/ISSUES_PER_ARC));
const schemeMax=()=>S.facilities.includes('bunker')?4:3;
const xpNeed=h=>2+lvlOf(h)+h.pendingUp;
const TACT = [
  ['weak','Weak Point','The wound lands automatically.'],['weak','Weak Point','The wound lands automatically.'],
  ['armor','Reinforced','+4 toughness for this wound.'],['armor','Reinforced','+4 toughness for this wound.'],
  ['over','Overextended','−4 toughness for this wound.'],['over','Overextended','−4 toughness for this wound.'],
  ['counter','Counterstrike','Reaction: the attacker takes 2 damage.'],['counter','Counterstrike','Reaction: the attacker takes 2 damage.'],
  ['mono','Monologue Opening','If this wounds, the hero regains 1 composure.'],
  ['shield','Human Shield','No wound if a civilian is within 2 of the villain.'],
  ['escape','Escape Plan','Reaction: the villain shifts 2 spaces away.'],
  ['glance','Clean Hit','Roll to wound as normal.'],['glance','Clean Hit','Roll to wound as normal.'],
].map(([id,n,txt])=>({id,n,txt}));
const ETHOS = {
  a:{q:'How far will the team go?',opts:[
    {id:'restraint',n:'Restraint',txt:'Every time you beat a villain in their lair, gain 1 extra salvage from them.'},
    {id:'force',n:'Overwhelming Force',txt:'Heroes gain +2 strength. Each civilian harmed costs 2 trust instead of 1.'}]},
  b:{q:'Do the heroes show their faces?',opts:[
    {id:'public',n:'Public Faces',txt:'+1 trust every issue. Investigations end in an ambush on 2 clues or fewer.'},
    {id:'secret',n:'Secret Identities',txt:'+1 max composure for every hero. Evacuations earn at most 1 trust per mission.'}]},
};
/* Pick a small, randomized shortlist of bosses whose unique salvage can supply
   gear suited to the current party. Ranks are considered cumulatively across all
   four party members; existing bosses reduce the need for more gear in the same
   hero's slot. Only boss-specific loot is scored (generic salvage works everywhere). */
function bossSelectionHeroes(){
  const active=party().filter(h=>!h.retired);
  return (active.length>=4?active:roster()).slice(0,4);
}
function bossGearFit(h,g){
  if(g.cons||!g.reqs)return 0;
  const reqs=Object.entries(g.reqs);
  if(!reqs.length||reqs.some(([t])=>!(h.ranks[t]||0)))return 0;
  const ready=Math.min(1,...reqs.map(([t,n])=>((h.ranks[t]||0)+1)/(n+0.5)));
  // Higher-rank gear still matters as the party levels, but near-term loot matters more.
  return ready/(1+0.3*(g.req-1))*(g.ab?1.15:1);
}
function bossLootGear(k){return Object.values(GEAR).filter(g=>!g.cons&&g.cost&&g.cost[k]);}
function bossSelectionScores(){
  const hs=bossSelectionHeroes(),supply={};
  for(const vs of S.villains)for(const g of bossLootGear(vs.key))
    for(const h of hs){const fit=bossGearFit(h,g);if(fit){const id=h.id+':'+g.slot;supply[id]=(supply[id]||0)+fit}}
  return S.pool.map(k=>{
    let value=0;
    for(const g of bossLootGear(k))for(const h of hs){
      const fit=bossGearFit(h,g);
      if(fit)value+=fit/(1+0.55*(supply[h.id+':'+g.slot]||0));
    }
    return {key:k,score:value};
  });
}
function chooseVillainFromPool(){
  if(!S.pool.length)return null;
  // A shuffled pool provides random ordering for score ties, then we randomly
  // select one of the four best-fit bosses instead of always taking the top.
  const shortlist=bossSelectionScores().sort((a,b)=>b.score-a.score).slice(0,4);
  const k=pick(shortlist).key;
  S.pool.splice(S.pool.indexOf(k),1);
  return k;
}
function revealStartingVillains(){
  // The first four recruits define the starting team; tutorial Mole Boy is
  // kept separate and the normal boss reveal happens after the tutorial.
  if(S.villains.length||roster().length<4||S.issue!==1)return;
  for(let i=0;i<3;i++){
    const k=chooseVillainFromPool();
    if(k)S.villains.push(makeVillain(k,1));
  }
  if(S.villains.length)pick(S.villains).scheme=1;
  pickMastermind();storyRumors();
}
function newCampaign(prev){
  const keys=shuffle(Object.keys(VILLAINS).filter(k=>!VILLAINS[k].intro));
  /* Bosses reveal only when four heroes have joined the new team. */
  S={vol:(prev&&prev.vol||0)+1,issue:1,trust:6,tech:3,intel:2,salvage:Object.fromEntries(Object.keys(VILLAINS).map(k=>[k,0])),facilities:['workshop'],armory:STARTER_LOCKER.slice(),ethos:{},
    heroes:[],fallen:[],xover:[],
    villains:[],pool:keys,unlocked:START_UNLOCK.slice(),
    phase:'hq',view:'hq',inv:null,sd:null,after:null,arcInfo:null,chronicle:[],over:null,seen:(prev&&prev.seen)||{},seenR:(prev&&prev.seenR)||{},tips:(prev&&prev.tips)||[],tipsOff:!!(prev&&prev.tipsOff),storyOff:!!(prev&&prev.storyOff),story:{q:[{id:'assemble'}],seen:{}},diff:diffClamp(prev&&prev.diff),mig3:true,d20:true,str1:true,deck3:true,deck2:true,disc5:true,v22:true,v59:true,v61:true,v62:true,v130:true};
  S.party=[];
  S.guide={s:0,pop:null};if(prev&&prev.tutDone)S.tutDone=true;else S.tut={b:0,dq:[]};S.ui=Object.fromEntries(['hq-base','hq-ws','hq-back','hq-skunk','ro-bench'].map(k=>[k,false]));
}
/* Difficulty (Tyler, 2026-10-31): chosen in the game menu and saved as S.diff (-1 Easy, 0 Normal, 1 Hard; older saves load as Normal).
   Easy: villains -3 accuracy, evasion and toughness, -1 damage (never below 1), 1 page torn per villain level at the start of
   each lair fight, +1 salvage per win. Hard: villains +3 accuracy, evasion and toughness, +1 damage, -1 salvage per win (never below 1). */
const DIFFS=[
  {d:-1,n:'Easy',stat:-3,dmg:-1,sal:1,torn:1,h:'Villains −3 accuracy, evasion and toughness and −1 damage (never below 1). They start each fight with 1 page torn per level. +1 salvage per win.'},
  {d:0,n:'Normal',stat:0,dmg:0,sal:0,torn:0,h:'The campaign as designed.'},
  {d:1,n:'Hard',stat:3,dmg:1,sal:-1,torn:0,h:'Villains +3 accuracy, evasion and toughness and +1 damage. −1 salvage per win.'}];
function diffClamp(x){x=Math.round(+x||0);return Math.max(-1,Math.min(1,x))}
function diffOf(){return DIFFS[diffClamp(S&&S.diff)+1]}
/* stat shift for a villain stat key at the current difficulty */
function diffStat(k){return ['acc','eva','tough'].includes(k)?diffOf().stat:0}
function introduceVillain(arc,L){if(!S.pool.length)return null;const k=chooseVillainFromPool();
  const hi=Math.max(0,...S.villains.filter(v=>v.status==='active').map(v=>v.level));
  const lvl=Math.min(VCAP,Math.max(2*arc,hi+1));const vs=makeVillain(k,lvl);S.villains.push(vs);
  L.push(`New threat: ${VILLAINS[k].name}, ${VILLAINS[k].tag.toLowerCase()}, arrives at level ${vs.level} with a ${vs.deck.length}-page playbook.`);return vs}
function arcTransition(newArc){const L=[];
  for(const vs of S.villains){if(vs.status!=='active')continue;const d=VILLAINS[vs.key];
    levelUpVillain(vs);upgradeVillain(vs,3);
    L.push(`${d.name} rises to level ${vs.level} and rewrites part of the playbook.`)}
  introduceVillain(newArc,L);
  const un=unlock(ARC_UNLOCK[newArc]||[]);if(un.length)L.push(`New blueprints: ${un.join(', ')}.`);
  L.push('Crossover Issue open: one Established Character can join from HQ this arc.');
  return {arc:newArc,lines:L}}
function finishIssue(L,{hunted,headline,vkey}){storyAfter(L,vkey);
  for(const o of S.villains){if(o.key===hunted||o.status!=='active')continue;o.scheme++;
    if(o.scheme>=schemeMax()){o.scheme=0;const was=o.level;levelUpVillain(o);S.trust-=2;L.push(`${VILLAINS[o.key].name}'s scheme hits the city while you were busy. −2 trust${o.level>was?`, and they rise to level ${o.level}`:''}.`)}}
  if(S.facilities.includes('press')){S.trust++;L.push('Press Office: +1 trust.')}
  if(S.ethos.b==='public'){S.trust++;L.push('Public Faces: +1 trust.')}
  {const n=fieldCount('scrap');if(n){S.tech+=n;L.push(`Scavenger's Satchel: +${n} tech.`)}}
  const ft=fieldCount('trust');if(ft){S.trust+=ft;L.push(`Spokesperson Mask: +${ft} trust.`)}
  S.chronicle.push(vkey?`#${S.issue}: ${VILLAINS[vkey].name}, ${headline.toLowerCase().replace('!','')}.`:`#${S.issue}: ${headline.toLowerCase()} while the team heals.`);
  const pend=(S.issue===1&&!S.ethos.a)?'a':(S.issue>=4&&!S.ethos.b)?'b':null;
  if(S.issue%ISSUES_PER_ARC===0){const n=Math.floor(Math.max(0,S.trust)/10);if(n){S.intel+=n;L.push(`Tip line: the city calls in what it saw this arc. +${n} intel (1 per 10 trust).`)}}
  const ended=S.issue;S.issue++;{const un=S.issue>=TIER3_ISSUE?unlock(MID_UNLOCK):[];if(un.length)L.push(`New blueprints: ${un.length} tier 3 items are now on file.`)}issueStart(L);
  S.after={headline,lines:L,vkey,ethos:pend};S.sd=null;S.inv=null;S.phase='after';S.view='mission';
  if(ended%ISSUES_PER_ARC===0&&ended<MAX_ISSUE)S.arcInfo=arcTransition(arcOf(ended)+1);
  if(!S.villains.some(v=>v.status==='active')){const extra=[];if(introduceVillain(arcOf(S.issue),extra))(S.arcInfo?S.arcInfo.lines:L).push(...extra)}
  if(S.trust<=0)S.over={win:false,txt:'Blackharbor has turned on its heroes. The Blackharbor Guardians disband mid-volume.'};
  else if((!S.villains.some(v=>v.status==='active')&&!S.pool.length)||S.issue>MAX_ISSUE){S.finalePending=true;S.arcInfo=null;(S.after.lines).push('The volume builds to its climax. The event comic begins.')}
}
/* Version 62 gear helpers */
/* Version 121 (Tyler): the two Hand slots are now a Main Hand (arms) and an Off Hand (arms2); two-handed weapons fill both.
   gear.hand: 'main' = offensive one-handers, 'off' = defensive or weaker one-handers, 'either' = Paired weapons, which sit at off-hand
   stat level and now count in full from both hands (stats and set count), plus their pair bonus. */
/* Version 123 (Tyler): defensive Off Hand gear (mostly max health, evasion rarely) with shield, reflect, ward, deck and debuff abilities,
   and crafting costs about 15% lower. fx.reflect: the first villain hit on you this round tears one of its own pages. */
/* Version 124 (Tyler): every villain set gets a tier 4 and a tier 5 piece and needs 4 pieces worn (SET_N); new non-set gear fills
   the tier 1 Legs and tier 2 one-handed Main Hand gaps; gear unlocks by tier (0-1 at the start, 2-3 in Arc 2, 4-5 in Arc 3) and no
   longer from beating villains; a stat pass trims the outliers (budget: max Power and max health a little cheaper, movement and damage
   reduction dearer, gear with an ability gets fewer stats); Innate scaling tops out at rank 5. */
/* Version 126 (Tyler): Magic items no longer carry +max Arcana (worn Magic ranks fill the pool now), except the Arcana pieces Mana Font,
   Rune Sash and Philosopher's Stone; tier 3 blueprints open halfway through Arc 2 (issue TIER3_ISSUE) instead of at its start;
   and non-set tier 4 Main Hand, Off Hand and Belt gear for each discipline, so Arc 3 has options outside the sets. */
const TIER3_ISSUE=ISSUES_PER_ARC+4,MID_UNLOCK=['gear:uplink','gear:wings','gear:serum','gear:mutagen','gear:compeyes','gear:sigil','gear:titan','gear:grimoire','gear:exo','gear:greaves','gear:claws','gear:helm','gear:familiar','gear:faraday','gear:staff','gear:halo','gear:mantle','gear:shadowpaw','gear:bloodstone','gear:hexfist','gear:crown','gear:paragon','gear:wand','gear:bandolier','gear:censer','gear:dynamo','gear:aegisgen','gear:ironbark','gear:sanctaegis'];
const START_GEAR={bulwark:'graft',volt:'visor',wisp:'cloak',cipher:'suit',rivet:'earpiece',lynx:'wraps',goliath:'medkit',sibyl:'coin',hexen:'monocle'};
function giveStart(h){const g=START_GEAR[h.cls];if(g&&!GEAR[g].set&&!h.gear[GEAR[g].slot])h.gear[GEAR[g].slot]=g;h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')}
function issueStart(L){const out=[];
  {const n=fieldCount('wiretap');if(n){S.intel+=n;out.push(`Wiretap Rig: +${n} intel.`)}}
  /* Version 107 (Tyler): Bomb Squad Bay hands out one free bomb consumable per issue */
  if(S.facilities.includes('bombsq')){const b=pick(['c_frag','c_flash','c_smoke','c_chaff']);S.armory.push(b);out.push(`Bomb Squad Bay: a free ${GEAR[b].name} is in the armory.`)}
  if(partyHas('premonition')){const sib=party().find(h=>BASE(h).field&&BASE(h).field.id==='premonition');
    const pool=[];S.villains.filter(v=>v.status==='active').forEach(v=>{const seen=(S.seen&&S.seen[v.key])||[];[...new Set(v.deck.map(e=>e.id))].filter(id=>!seen.includes(id)).forEach(id=>pool.push({k:v.key,id}))});
    const got=shuffle(pool).slice(0,2);got.forEach(p=>markSeen(p.k,p.id));S.intel++;
    out.push(`${sib.name}'s Premonition: +1 intel${got.length?`, and visions of ${got.map(p=>`${VILLAINS[p.k].cards[p.id].n} (${VILLAINS[p.k].short})`).join(' and ')}`:''}.`)}
  for(const h of bench()){h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp');h.xp++;while(h.xp>=xpNeed(h)){h.xp-=xpNeed(h);h.pendingUp++;out.push(`${h.name} trained on the bench and reached level ${lvlOf(h)+h.pendingUp}.`)}}
  L.push(...out)}
const vState=k=>S.villains.find(v=>v.key===k);
function afford(cost){const sv={...S.salvage};for(const[k,n]of Object.entries(cost)){if(k==='any')continue;if(k in sv){if(sv[k]<n)return false;sv[k]-=n}else if(S[k]<n)return false}
  return !cost.any||Object.values(sv).reduce((a,b)=>a+b,0)>=cost.any}
function pay(cost,pick){for(const[k,n]of Object.entries(cost)){if(k==='any')continue;if(k in S.salvage)S.salvage[k]-=n;else S[k]-=n}
  if(pick){for(const k in pick)S.salvage[k]-=pick[k];return}
  for(let i=0;i<(cost.any||0);i++){const k=Object.keys(S.salvage).sort((a,b)=>S.salvage[b]-S.salvage[a])[0];S.salvage[k]--}}
/* Version 89 (Tyler): "any salvage" costs let you choose which salvage pays, or just use the biggest pile. S.anyAuto skips the question. */
function anySplit(cost){const sv={...S.salvage};for(const[k,n]of Object.entries(cost))if(k!=='any'&&k in sv)sv[k]-=n;const out={};
  for(let i=0;i<(cost.any||0);i++){const k=Object.keys(sv).sort((a,b)=>sv[b]-sv[a])[0];sv[k]--;out[k]=(out[k]||0)+1}return {out,sv}}
const anyAsk=cost=>!FAST&&AUTO_CHOOSE==null&&!S.anyAuto&&cost.any>0&&Object.values(anySplit({...cost,any:0}).sv).filter(n=>n>0).length>1;
function pickAny(g){const cost=g.cost,{sv}=anySplit({...cost,any:0}),N=cost.any,ks=Object.keys(sv).filter(k=>sv[k]>0).sort((a,b)=>sv[b]-sv[a]),al=anySplit(cost).out;
  return new Promise(res=>{const L=document.createElement('div');L.id='choose';L.setAttribute('role','dialog');L.setAttribute('aria-label','Choose salvage');
    const draw=()=>{const t=ks.reduce((a,k)=>a+(al[k]||0),0);
      L.innerHTML=`<div class="chz"><div class="eyebrow">Pay with salvage</div><div class="small"><b>${esc(g.name)}</b> costs ${N} any salvage. Choose which salvage to spend.</div>
      ${ks.map(k=>`<div class="row between anyrow"><span>${resIc(k)} ${RES_NAME[k]} <span class="muted small">(${sv[k]} on hand)</span></span><span class="row"><button class="btn sm" type="button" data-p="${k}:-1" ${(al[k]||0)>0?'':'disabled'} aria-label="One less ${RES_NAME[k]}">−</button><b class="mono anyn">${al[k]||0}</b><button class="btn sm" type="button" data-p="${k}:1" ${(al[k]||0)<sv[k]&&t<N?'':'disabled'} aria-label="One more ${RES_NAME[k]}">+</button></span></div>`).join('')}
      <div class="small ${t===N?'muted':''}">${t}/${N} chosen</div>
      <button class="btn pri" type="button" data-r="ok" ${t===N?'':'disabled'}>Pay ${N} and craft</button>
      <button class="btn" type="button" data-r="auto">Use whatever I have the most of</button>
      <label class="small anyalw"><input type="checkbox" data-r="always"> Always use the biggest pile and don't ask (change this in the Workshop)</label>
      <button class="btn sm" type="button" data-r="no">Cancel</button></div>`};
    draw();document.body.appendChild(L);setTimeout(()=>{const b=L.querySelector('[data-r="ok"]');if(b)b.focus({preventScroll:true})},50);
    L.addEventListener('click',e=>{e.stopPropagation();const p=e.target.closest('[data-p]'),r=e.target.closest('[data-r]');
      if(p){const[k,d]=p.dataset.p.split(':');al[k]=Math.max(0,(al[k]||0)+ +d);draw();return}
      if(!r||r.dataset.r==='always')return;const al2=r.dataset.r==='auto'?anySplit(cost).out:al;
      if(r.dataset.r!=='no'&&L.querySelector('[data-r="always"]').checked)S.anyAuto=true;L.remove();res(r.dataset.r==='no'?null:al2)})})}
function doCraft(a,g,hid,pick){if(a==='craft'){if(afford(GEAR[g].cost)){pay(GEAR[g].cost,pick);S.armory.push(g);if(S.guide)S.guide.eq=true}return}
  const h=S.heroes.find(x=>x.id===hid);if(!h||S.phase!=='hq'||(!S.facilities.includes('workshop')&&!GEAR[g].cons)||!afford(GEAR[g].cost)||!wearOK(h,g))return;pay(GEAR[g].cost,pick);S.armory.push(g);equipHero(h,g)}
const costStr=c=>Object.entries(c).map(([k,n])=>`${n} ${RES_NAME[k]}`).join(' + ');
const costHtml=c=>`<span class="cost">${Object.entries(c).map(([k,n])=>`${resIc(k)}${n} ${RES_NAME[k]}`).join(' + ')}</span>`;
