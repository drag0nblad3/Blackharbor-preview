/* ui/playbook.js: Villain playbook browser. */
function markSeen(k,n){S.seen=S.seen||{};const a=S.seen[k]=S.seen[k]||[];if(!a.includes(n))a.push(n)}
let PB=null;
function openPlaybook(k){const def=VILLAINS[k],vs=vState(k),sd=(S.sd&&S.sd.vl&&S.sd.vl.find(o=>o.key===k))||null,lvl=sd?sd.v.level:vs.level,seen=(S.seen&&S.seen[k])||[];
  const known=c=>seen.includes(c.id);
  const remain=sd?[...sd.v.deck,...sd.v.discard,...(sd.v.planned?[sd.v.planned]:[])]:vs.deck.map(e=>buildCard(k,e,vs.level));
  const sorted=remain.slice().sort((a,b)=>(known(b)-known(a))||a.n.localeCompare(b.n));
  const torn=sd?sd.v.wounds:[];
  const all=remain.concat(torn);
  const sr=(S.seenR&&S.seenR[k])||[],rx=VINTEL[k].react;
  PB={k,lvl,inFight:!!sd,i:0,remainN:remain.length,tornN:torn.length,seenN:all.filter(known).length,total:all.length,status:vs.status,rxN:rx.filter(r=>sr.includes(r.id)).length,rxT:rx.length,
    pages:[{kind:'cover'},...sorted.map(c=>({kind:known(c)?'card':'unk',c})),...torn.map(c=>({kind:'torn',c,known:known(c)})),...rx.map(r=>({kind:sr.includes(r.id)?'rx':'rxunk',r}))]};
  const L=document.createElement('div');L.id='comic';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${def.name} playbook`);document.body.appendChild(L);
  L.addEventListener('click',e=>{const b=e.target.closest('[data-pb]');if(!b)return;const[a,n]=b.dataset.pb.split(':');
    if(a==='gallery')openCoverGallery();if(a==='art')openVillainCover(PB.k);
    if(a==='close')closePlaybook();if(a==='next')turnPB(1);if(a==='prev')turnPB(-1);if(a==='go')turnPB(+n-PB.i)});
  let sx=null;L.addEventListener('pointerdown',e=>{if(e.target.closest('.cstage'))sx=e.clientX});
  L.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;if(dx<-45)turnPB(1);else if(dx>45)turnPB(-1)});
  drawPB(0);L.querySelector('[data-pb="close"]').focus({preventScroll:true})}
function closePlaybook(){const L=document.getElementById('comic');if(L)L.remove();PB=null}
document.addEventListener('keydown',e=>{if(!PB||document.getElementById('cover-browser'))return;if(e.key==='Escape')closePlaybook();if(e.key==='ArrowRight')turnPB(1);if(e.key==='ArrowLeft')turnPB(-1)});
function turnPB(d){if(!PB||!d)return;const ni=PB.i+d;if(ni<0||ni>=PB.pages.length)return;
  const pg=document.querySelector('#comic .cstage .pg');if(pg&&!RM){pg.classList.add(d>0?'flipOutL':'flipOutR');setTimeout(()=>{PB.i=ni;drawPB(d)},170)}else{PB.i=ni;drawPB(d)}}
function pbPage(p,idx){const def=VILLAINS[PB.k],n=PB.pages.length-1;
  const hd=(r)=>`<div class="hd"><span>${vIc(PB.k)}${esc(def.name)} · Playbook</span><span>${r}</span></div>`;
  if(p.kind==='cover')return `<div class="pg pbcover">${villainCoverPreview(PB.k)}<small>${PB.inFight?'This fight':'Case file'} · Level ${PB.lvl}</small><b>${esc(def.name)}</b><span class="ctag">${esc(def.tag)}</span>
    <div class="cstats"><span><b>${PB.remainN}</b> pages left</span>${PB.inFight?`<span><b>${PB.tornN}</b> torn out</span>`:''}<span><b>${PB.seenN}/${PB.total}</b> seen</span><span><b>${PB.rxN}/${PB.rxT}</b> hit reactions known</span></div>
    <small>Swipe or tap Next to read</small></div>`;
  if(p.kind==='rx'||p.kind==='rxunk'){const show=p.kind==='rx',r=p.r;return `<div class="pg"><div class="hd"><span>${vIc(PB.k)}${esc(def.name)} · Hit reaction</span><span>Hit deck</span></div><div class="sigrib r">Signature reaction</div><div class="art tac ${show?'':'unk'}"><span>${show?esc(r.sfx):'???'}</span></div><h2>${show?esc(r.n):'???'}</h2><div class="tx ${show?'':'muted'}">${show?esc(rxTxt(r,PB.lvl)):`One of ${esc(def.short)}'s signature hit reactions. Uncover clues while investigating, or draw it in a fight, to learn it.`}</div><div class="ft">${show&&r.src?`Lost when ${esc(def.cards[r.src].n)} is torn`:show?'Shuffled into the hit deck':'Unknown reaction'}</div></div>`}
  if(p.kind==='unk')return `<div class="pg">${hd(`Page ${idx} of ${n}`)}<div class="art unk"><span>???</span></div><h2>???</h2><div class="tx muted">You haven't seen this page played yet. Uncover clues, fight ${esc(def.name)} or use Foresee to learn it.</div><div class="ft">Unknown page</div></div>`;
  const c=p.c,show=p.kind==='card'||p.known,sg=show&&c.sig;
  const body=`${hd(p.kind==='torn'?'Torn out':`Page ${idx} of ${n}`)}${sg?'<div class="sigrib">★ Signature Move ★</div>':''}<div class="art ${show?'':'unk'}">${show?vWm(PB.k):''}<span>${show?esc(TYPE_SFX[c.t]||'!'):'???'}</span></div><h2>${show?esc(c.n):'???'}</h2><div class="tx">${show?esc(c.txt):'Torn out before you could read it.'}</div><div class="ft">${p.kind==='torn'?'No longer in the playbook':`Page ${idx} of ${n}`}</div>`;
  if(p.kind==='torn')return `<div class="pg tornpg ${sg?'sig':''}" style="clip-path:${tearTop}">${body}</div><div class="tornlabel">Torn out this fight</div>`;
  return `<div class="pg ${sg?'sig':''}">${body}</div>`}
/* the villain's comic cover, faded behind every playbook page (villain-covers.css) */
function pbArt(k){const a=typeof VILLAIN_COVERS!=='undefined'&&VILLAIN_COVERS[k],f=typeof VPR_FACE!=='undefined'&&VPR_FACE[k]||[160,160];
  return a?`;--pbart:url('${a.cover}');--pbpos:${(f[0]/3.2).toFixed(1)}% ${(f[1]/4.8).toFixed(1)}%`:''}
function drawPB(d){const L=document.getElementById('comic');if(!L||!PB)return;const def=VILLAINS[PB.k],p=PB.pages[PB.i];
  L.innerHTML=`<div class="cbar"><div><div class="eyebrow">Villain playbook</div><h3>${esc(def.name)}</h3></div><button class="btn sm" data-pb="close" type="button">Close</button></div>
    <div class="cstage"><div class="book pbook vth ${p.kind==='cover'?'has-cover':''}${pbArt(PB.k)?' has-art':''}" style="${vSty(PB.k)}${pbArt(PB.k)}">${pbPage(p,PB.i)}</div></div>
    <div class="cnav"><button class="btn sm" data-pb="prev" type="button" ${PB.i?'':'disabled'}>Prev</button><span class="mono small">${PB.i?`${PB.i} / ${PB.pages.length-1}`:'Cover'}</span><button class="btn sm" data-pb="next" type="button" ${PB.i<PB.pages.length-1?'':'disabled'}>Next</button></div>
    <div class="cstrip">${PB.pages.map((q,i)=>`<button type="button" class="tile ${q.kind} ${q.kind==='card'&&q.c.sig?'sig':''} ${i===PB.i?'cur':''}" data-pb="go:${i}" aria-label="${q.kind==='cover'?'Cover':q.kind==='unk'?'Unknown page':q.kind==='torn'?'Torn page':q.kind==='rx'?esc(q.r.n):q.kind==='rxunk'?'Unknown hit reaction':esc(q.c.n)}"></button>`).join('')}</div>`;
  const pg=L.querySelector('.cstage .pg');if(pg&&d&&!RM)pg.classList.add(d>0?'flipInL':'flipInR')}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.book=(p1)=>{openPlaybook(p1);return NO_RENDER;};
