/* battle/pages.js: Villain page reveal, card views, wound animation, attack panel, broken pages, planned pages. */
function reveal(o){if(FAST)return Promise.resolve();
  return new Promise(res=>{
    const L=document.createElement('div');L.id='cards';if(o.vk){L.className='vth';L.setAttribute('style',vSty(o.vk))}L.setAttribute('role','dialog');L.setAttribute('aria-label',`${o.title}: ${o.text}`);
    const page=(cls,style='')=>`<div class="pg ${cls||''}${o.sig?' sig':''}" style="${style}"><div class="hd"><span>${o.vk?vIc(o.vk):''}${esc(o.deck)}</span><span>${esc(o.tag||'')}</span></div>${o.rib?`<div class="sigrib ${o.ribCls||''}">${esc(o.rib)}</div>`:''}
      <div class="art ${o.art||''}">${o.vk?vWm(o.vk):''}<span>${esc(o.sfx)}</span></div><h2>${esc(o.title)}</h2><div class="tx">${esc(o.text)}</div>
      ${o.foot?`<div class="tx small"><b>${esc(o.foot)}</b></div>`:''}<div class="ft">${o.mode==='tear'?'Tap to tear it out':'Tap to resolve'}</div></div>`;
    const tear=o.mode==='tear',art=o.vk&&typeof pbArt==='function'?pbArt(o.vk):'',artCls=art?' has-art':'';
    L.innerHTML=tear?`<div class="book tearbook${artCls}" style="${art}">${page('top',`clip-path:${tearTop}`)}${page('bot',`clip-path:${tearBot}`)}
        <svg class="tearline" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${TEAR.map(([x,y])=>`${x},${y}`).join(' ')}" vector-effect="non-scaling-stroke"/></svg><span class="woundstamp">Wound!</span></div>
        <button class="btn pri cardgo" type="button">Tear it out</button>`
      :`<div class="book${artCls}" style="${art}">${page()}<div class="cover ${o.coverCls||''}"><small>${esc(o.coverTop)}</small><b>${esc(o.coverTitle)}</b><small>${esc(o.coverFoot||'')}</small></div></div>
        <button class="btn pri cardgo" type="button">Resolve</button>`;
    document.body.appendChild(L);const ready=Date.now()+(tear||RM?250:850);
    const btn=L.querySelector('.cardgo');setTimeout(()=>btn.focus({preventScroll:true}),RM?0:800);
    const go=e=>{e.stopPropagation();if(Date.now()<ready)return;L.removeEventListener('click',go);L.classList.add('leaving');
      L.querySelector('.book').classList.add(tear?'torn':'out');setTimeout(()=>{L.remove();res()},RM?0:tear?700:280)};
    L.addEventListener('click',go)})}
function villainCardView(c){const sd=S.sd,def=VILLAINS[sd.vkey];return {vk:sd.vkey,mode:'open',deck:`${def.name} · Playbook`,tag:`Round ${Math.max(1,sd.round)}`,sfx:TYPE_SFX[c.t]||'!',title:c.n,text:c.txt,
  sig:!!c.sig,rib:c.sig?'★ Signature Move ★':'',art:'vil',coverCls:c.sig?'vil sig':'vil',coverTop:c.sig?'★ Signature move! ★':'Villain turn',coverTitle:def.name,coverFoot:`Issue #${S.issue} · ${remainingPages(sd.v)} pages left`}}
const ARCN={front:'front',flank:'side',rear:'rear'};const arcTxt=a=>a.map(x=>ARCN[x]).join(' and ')+(a.length>1?' arcs':' arc');
function tacticCardView(tc,h,side,inArc,why){return {mode:'open',deck:tc.sig?`${VILLAINS[tc.sig].short} · Hit reaction`:'Hit deck',tag:h.name,sfx:tc.sig?tc.sfx:TAC_SFX[tc.id]||'!',title:tc.n,text:tc.sig?rxTxt(tc,S.sd.v.level):tc.txt,
  rib:tc.sig?'Signature reaction':'',ribCls:'r',foot:[why||(tc.arc&&side?`${h.name} struck from the ${ARCN[side]} arc: ${inArc?'it triggers!':'wrong side, it does nothing.'}`:''),tc.sig&&tc.src?`Lost when ${VILLAINS[tc.sig].cards[tc.src].n} is torn from the playbook.`:''].filter(Boolean).join(' '),art:'tac',coverCls:'tac',coverTop:'Hit!',coverTitle:`${h.name} connects`,coverFoot:'Draw a hit card'}}
async function woundAnim(foot,q){const sd=S.sd,v=sd.v,k=sd.vkey;if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[];log('sys','The playbook is reshuffled.')}
  if(v.excise&&v.deck.length>1&&woundTarget(v)!==v.planned){const top=v.deck.slice(0,v.excise);v.excise=0;top.forEach(c=>markSeen(k,c.id));
    const i=await choose(`Find the Flaw · ${VILLAINS[k].short}`,'Choose the page this wound tears out.',top.map(c=>({l:`${c.sig?'★ ':''}${c.n}`,s:c.txt})));const p=top[i];v.deck.splice(v.deck.indexOf(p),1);v.deck.unshift(p);log('hero',`Find the Flaw: ${p.n} is the page that tears.`)}
  const c=woundTarget(v);if(c)markSeen(k,c.id);if(q)q.page=c;if(c&&!q)await reveal({vk:k,mode:'tear',deck:`${VILLAINS[k].name} · Playbook`,tag:`${Math.max(0,remainingPages(v)-1)} pages left`,sfx:TYPE_SFX[c.t]||'!',title:c.n,text:c.txt,foot,art:'vil',sig:!!c.sig,rib:c.sig?'★ Signature Move ★':''});
  const was=VINTEL[k].react.filter(r=>rxLive(v,r));
  v.hurtAt=Date.now();const end=woundV();log('hero',c?`${c.n} is torn from the playbook.`:`The last signature holds: ${v.turnDamage}/${chargeNeed(v)} wounds this round.`);
  const splash=(...a)=>q?q.splash.push(a):breakSplash(...a);
  if(c&&c.sig){log('hero',`${c.brk} ${c.n} is gone.`);await splash(c.brk,`${c.n} is torn from ${VILLAINS[k].name}'s playbook`,'Signature Move destroyed')}
  for(const r of was.filter(r=>!rxLive(v,r))){markSeenR(k,r.id);log('hero',`${r.brk} The ${r.n} reaction leaves the hit deck.`);await splash(r.brk,`${r.n} is gone from the hit deck`,'Signature reaction destroyed')}
  if(v.sw&&!v.down){const s=swSync(v);s.lost.forEach(b=>{log('hero',`The ${SWN[b].toLowerCase()} body falls out of the swarm.`);fxV('SPLAT!','hit')})}
  vWarn();render();return end}
/* one panel per attack: the attack roll and each hit's reaction card, then 100ms later the strength checks beside them */
function attackPanel(o){if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='atk';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${o.name} attacks: ${o.hits} hits, ${o.rows.filter(r=>r.ok).length} wounds`);
    const row=(r,dl)=>{const tc=r.tc,note=r.note?`<div class="note">${esc(r.note)}</div>`:'';
      const res=r.ok?'WOUND!':r.block?'BLOCKED!':'CLANG!',roll=r.block?esc(r.blockTxt):r.auto?`${tc.sig?esc(tc.n):'Weak point'}: the wound lands.`:`Strength roll <b>${r.r}</b> + ${r.str} = ${r.r+r.str} vs toughness ${r.tough}${r.r===20?' (natural 20)':r.r===1?' (natural 1)':''}`;
      return `<div class="arow"><div class="rx ${tc.sig?'sig':''} ${r.off?'off':''}">${dl}<span class="sfx">${esc(tc.sig?tc.sfx:TAC_SFX[tc.id]||'!')}</span><h4>${esc(tc.n)}</h4><div>${esc(tc.txt)}</div>${note}</div>
        <div class="st ${r.ok?'ok':''}"><span class="res">${res}</span><div>${roll}</div>${r.page?`<div class="torn">Torn out: ${r.page.sig?'★ ':''}${esc(r.page.n)}</div>`:''}</div></div>`};
    const isHit=d=>d===20||(d!==1&&d+o.acc>=o.eva),acc=(d,i)=>`<div class="dl"><span class="die ${isHit(d)?'hit':''}">${d}</span><small>Die ${i+1}: ${d} + ${o.acc} = ${d+o.acc} vs evasion ${o.eva}${d===20?' (natural 20)':d===1?' (natural 1)':''}</small></div>`;
    let k=0;const rows=o.rolls.map((d,i)=>{if(!isHit(d))return `<div class="arow"><div class="rx miss">${acc(d,i)}</div><div class="st"><span class="res">MISS</span><div>No hit card drawn.</div></div></div>`;
      const r=o.rows[k++];return r?row(r,acc(d,i)):`<div class="arow"><div class="rx">${acc(d,i)}</div><div class="st"><span class="res">—</span><div>The villain is already down.</div></div></div>`});
    L.innerHTML=`<div class="atkp"><div class="ah"><b>${esc(o.name)} attacks!</b><small>${o.rolls.length} ${o.rolls.length===1?'die':'dice'} · ${o.hits} hit${o.hits===1?'':'s'} · ${o.rows.filter(r=>r.ok).length} wound${o.rows.filter(r=>r.ok).length===1?'':'s'}</small></div>
      <div class="rows">${rows.join('')}</div></div><button class="btn pri cardgo" type="button">Continue</button>`;
    document.body.appendChild(L);const ready=Date.now()+(RM?150:450);const btn=L.querySelector('.cardgo');setTimeout(()=>btn.focus({preventScroll:true}),RM?0:300);
    const go=e=>{e.stopPropagation();if(Date.now()<ready)return;L.removeEventListener('click',go);L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:200)};
    L.addEventListener('click',go)})}
/* a signature reaction stays in the hit deck while the page that carries it is still in the playbook */
const rxLive=(v,r)=>!r.src||[...v.deck,...v.discard,...(v.planned?[v.planned]:[])].some(p=>p.id===r.src);
function breakSplash(title,sub,tag){if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='brk';L.setAttribute('role','alert');
    L.innerHTML=`<div class="burst"><div class="bt"><span>${esc(tag)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></div></div>`;document.body.appendChild(L);
    const t0=Date.now();let done=false;const go=()=>{if(done||Date.now()-t0<350)return;done=true;L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:240)};
    L.addEventListener('click',e=>{e.stopPropagation();go()});setTimeout(go,RM?1600:2600)})}
/* several breaks from one attack stack in one overlay, each bursting in shortly after the last; one tap clears them all */
function breakStack(list){if(!list.length)return Promise.resolve();if(list.length===1)return breakSplash(...list[0]);if(FAST)return Promise.resolve();
  return new Promise(res=>{const L=document.createElement('div');L.id='brk';L.className='stack';L.setAttribute('role','alert');const gap=RM?0:420;
    L.innerHTML=list.map(([title,sub,tag],i)=>`<div class="burst" style="animation-delay:${i*gap}ms"><div class="bt"><span>${esc(tag)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></div></div>`).join('');document.body.appendChild(L);
    const t0=Date.now(),all=(list.length-1)*gap;let done=false;const go=()=>{if(done||Date.now()-t0<all+350)return;done=true;L.classList.add('leaving');setTimeout(()=>{L.remove();res()},RM?0:240)};
    L.addEventListener('click',e=>{e.stopPropagation();go()});setTimeout(go,all+(RM?1600:2800))})}
/* a villain about to play a Signature Move shouts a hint; tearing that page first cancels it */
// A planned page belongs to a separate slot, never to the draw pile.
const remainingPages=v=>v.deck.length+v.discard.length+(v.planned?1:0);
const plannedKnown=(k,v)=>!!v.planned&&((S.seen&&S.seen[k])||[]).includes(v.planned.id);
function refillPages(v){if(!v.deck.length&&v.discard.length){v.deck=shuffle(v.discard);v.discard=[]}}
function planPage(o){const v=o.v;if(v.down||v.planned||v.planningDone||v.charge)return;
  refillPages(v);v.planned=v.deck.shift()||null;v.planningDone=true;v.turnDamage=v.turnDamage||0;}
function vWarn(){const sd=S.sd;if(!sd||sd.result)return;sd.vl.forEach(o=>{planPage(o);const v=o.v,c=v.planned;planDupes(v);
  if(v.down||!c||!c.sig){v.warn=null;return}if(v.warn===c.uid)return;
  v.warn=c.uid;log('vill',`${VILLAINS[o.key].short} shouts: “${c.shout}”`);})}
function plannedView(o){const v=o.v,c=v.planned;if(v.down)return '';
  if(!c)return v.planningDone?`<div class="cap warn"><b>${VILLAINS[o.key].short} · Charging slot empty.</b> Planned action interrupted.</div>`:'';
  const known=plannedKnown(o.key,v);
  return `<div class="cap ${c.sig?'warn':'charge'}" data-planned="${o.key}"><b>${VILLAINS[o.key].short} · Charging: ${known?esc(c.n):'Unrevealed action'}</b><p>${known?esc(c.txt):'Reveal this page to see its full rules.'}</p>${c.sig?`<small>${remainingPages(v)>1?`Signature: ${v.turnDamage||0}/${chargeNeed(v)} wounds this hero round. The threshold wound tears this card instead of the draw pile.`:'Last page: the next wound tears it.'}</small>`:'<small>Normal wounds tear from the draw pile.</small>'}</div>`;
}
function woundTarget(v){refillPages(v);
  if(v.planned&&v.planned.sig&&(v.turnDamage||0)+1>=chargeNeed(v))return v.planned;
  // Tyler (2026-10-30): the last page always tears, even a signature in the charging slot.
  return v.deck[0]||v.planned||null;
}
function cancelPlan(v){if(v.planned)v.discard.push(v.planned);v.planned=null;v.charge=null;v.warn=null;v.planningDone=true;}
// Old saves put an active charged page in discard. Move that exact page once.
function migratePlans(){if(S.sd)S.sd.vl.forEach(o=>restoreBorrowedBodies(o.v));if(!S.sd||S.sd.planVersion||S.sd.result)return;for(const o of S.sd.vl){const v=o.v;
  if(v.charge&&!v.planned){const c=v.last&&[...v.discard,...v.deck].reverse().find(p=>p.uid===v.last.uid||(p.id===v.last.id&&p.mk===v.last.mk));
    if(c){v.discard=v.discard.filter(p=>p!==c);v.deck=v.deck.filter(p=>p!==c);v.planned=c;v.planningDone=true;}}
  v.turnDamage=0;}S.sd.planVersion=1;S.sd.tdk={};vWarn();}
