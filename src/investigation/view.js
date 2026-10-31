/* investigation/view.js: Investigation screens: case file shell, leads, intro, invView. */
/* Investigation comic-board presentation: all labels and counts are derived from the live case state. */
function invCaseKnowledge(i){
  const vs=vState(i.v),intel=VINTEL[i.v],known=(S.seen&&S.seen[i.v])||[],reactions=(S.seenR&&S.seenR[i.v])||[];
  const pages=[...new Set(vs.deck.map(e=>e.id))];
  return {pages:pages.filter(id=>known.includes(id)).length,totalPages:pages.length,
    reactions:intel.react.filter(r=>reactions.includes(r.id)).length,totalReactions:intel.react.length};
}
function invLeadTrail(i){
  return `<div class="inv-trail" aria-label="Three investigation leads">
    ${[0,1,2].map(n=>{
      const current=n===i.step&&!i.intro,complete=n<i.step||(current&&!!i.res),unlocked=!i.intro&&n<=i.step;
      const event=unlocked?evOf(i.events[n]):null;
      return `<div class="inv-trail-item ${complete?'complete':current?'current':'sealed'}">
        <span class="inv-trail-pin" aria-hidden="true">${complete?'✓':n+1}</span>
        <span class="inv-trail-copy"><small>Lead ${n+1} · ${complete?'Resolved':current?'In progress':'Unopened'}</small>
          <b>${event?esc(event.title):'Unknown lead'}</b></span>
      </div>`;
    }).join('')}
  </div>`;
}
function invCaseShell(i,content){
  const d=VILLAINS[i.v],vs=vState(i.v),I=VINTEL[i.v],k=invCaseKnowledge(i),q=invQuality(i.clues);
  const stage=i.intro?'Case opened':i.step>=3?'Lair located':i.res?'Lead resolved':`Lead ${i.step+1} of 3`;
  const cutoff=S.ethos.b==='public'?2:1;
  return `<section class="inv-ui" aria-label="Investigation: ${esc(d.name)}">
    <header class="inv-header">
      <div><div class="inv-kicker">Blackharbor · Issue #${S.issue} · Case file</div>
        <h2>Investigation <span class="inv-heading-sub">/ ${esc(d.name)}</span></h2></div>
      <div class="inv-summary">
        <span class="inv-label inv-issue">Vol. ${S.vol} · Level ${vs.level}</span>
        <span class="inv-label inv-clue-total" data-tip="kw:clues">${UI('clue')}<b>${i.clues}</b> clues</span>
        <span class="inv-label inv-phase">${stage}</span>
      </div>
    </header>
    <div class="inv-grid">
      <main class="inv-main">
        <div class="inv-board-head"><span class="inv-tape">THE CASEBOARD</span>
          <span class="inv-board-meta">${Math.min(i.step,3)} / 3 leads finished</span></div>
        ${invLeadTrail(i)}
        <div class="inv-action-stage">${content}</div>
      </main>
      <aside class="inv-villain-rail" aria-label="Target and team">
        <div class="inv-section-title">Target dossier</div>
        <div class="inv-villain-card" style="${vSty(i.v)}">
          <div class="inv-villain-visual">${vPortrait(i.v,'investigation')}</div>
          <div class="inv-villain-desc"><small>Active target · Level ${vs.level}</small>
          <h3>${esc(d.name)}</h3><span>${esc(d.tag)}</span></div>
        </div>
        <div class="inv-side-block"><div class="inv-small-head">Showdown outlook <span data-tip="kw:clues">ⓘ</span></div>
          <strong class="inv-outlook ${q}">${QUAL[q].n}</strong>
          <div class="inv-clue-track" aria-label="${i.clues} clues, prepared at 4">
            ${[0,1,2,3].map(n=>`<i class="${n<i.clues?'filled':''}"></i>`).join('')}
          </div>
          <p>${i.step>=3?QUAL[q].txt:'Current outlook. Final condition is determined after all three leads.'}</p>
          <small class="inv-threshold">0–${cutoff} Ambush · ${cutoff+1}–3 Standoff · 4+ Prepared</small>
        </div>
        <div class="inv-side-block"><div class="inv-small-head" data-tip="kw:hints">What the streets say</div>
          <ul class="inv-hints">${I.hints.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>
        </div>
        <div class="inv-side-block inv-party"><div class="inv-small-head">Field team <span>${party().length}/4</span></div>
          ${party().map(h=>`<div class="inv-hero-row">
            <span class="inv-hero-name">${esc(h.name)}</span>
            <span title="Health">${UI('hp')}${h.hp}/${stat(h,'maxHp')}</span>
            <span title="Composure">${UI('comp')}${h.comp}/${stat(h,'maxComp')}</span>
          </div>`).join('')}
        </div>
      </aside>
      <aside class="inv-intel-rail" aria-label="Investigation intelligence">
        <div class="inv-section-title">Intelligence file</div>
        <div class="inv-knowledge-row">
          <div data-tip="kw:playbook"><b>${k.pages}/${k.totalPages}</b><small>Pages known</small></div>
          <div data-tip="kw:reaction"><b>${k.reactions}/${k.totalReactions}</b><small>Reactions known</small></div>
        </div>
        <div class="inv-side-block"><div class="inv-small-head" data-tip="kw:intelfile">Uncovered this investigation <span>${i.found.length}</span></div>
          ${i.found.length?`<div class="inv-discoveries">${i.found.map(f=>intelTile(i.v,f,false)).join('')}</div>`:
            '<p class="inv-empty">Every clue uncovers an unseen playbook page or hit reaction.</p>'}
          <button class="btn sm inv-book-btn" data-a="book:${i.v}">Read known playbook</button>
        </div>
        ${(i.notes||[]).length?`<div class="inv-side-block"><div class="inv-small-head" data-tip="kw:field">Field advantages</div>
          <ul class="inv-notes">${i.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:''}
        ${i.ovf?`<div class="inv-overflow" data-tip="kw:overflow">+${i.ovf} Intel banked from excess clues</div>`:''}
        <div class="inv-rule-foot">Each clue uncovers intel. Clues past 4 also earn +1 Intel each.</div>
      </aside>
    </div>
  </section>`;
}
function introView(){
  const i=S.inv,d=VILLAINS[i.v],I=VINTEL[i.v];
  return invCaseShell(i,`<div class="inv-lead-frame inv-intro-frame">
    <div class="inv-lead-top"><span class="inv-stamp">CASE OPENED</span><span class="inv-lead-count">3 leads to pursue</span></div>
    <h3>${esc(d.name)}</h3>
    <p class="inv-story">${esc(I.intro)}</p>
    <div class="inv-start-facts">
      <span data-tip="kw:clues"><b>${i.clues}</b> starting clues</span>
      <span data-tip="kw:vsize"><b>${esc(SHAPE_N[d.shape])}</b> villain size</span>
      <span data-tip="kw:playbook"><b>${invCaseKnowledge(i).pages}</b> known pages</span>
    </div>
    ${i.found.length?`<div class="inv-new-intel"><div class="inv-small-head">Head start discoveries</div>
      <div class="intels">${i.found.map(f=>intelTile(i.v,f,true)).join('')}</div></div>`:''}
    <p class="inv-caption">Work three leads to uncover their playbook. Four or more clues lets your team enter prepared.</p>
    <button class="btn pri inv-primary" data-a="invgo">Hit the streets →</button>
  </div>`);
}
function invView(){
  const i=S.inv,d=VILLAINS[i.v];if(i.intro)return introView();
  const done=i.step>=3;
  let content;
  if(done){
    const q=invQuality(i.clues);
    content=`<div class="inv-lead-frame inv-finale">
      <div class="inv-lead-top"><span class="inv-stamp">LAIR LOCATED</span><span class="inv-lead-count">${i.clues} clues secured</span></div>
      <h3>${QUAL[q].n}!</h3>
      <p class="inv-story">${QUAL[q].txt}</p>${i.boardPrep?`<div class="cap">Battlefield preparation: ${BOARD_PREP_TEXT[i.boardPrep]}</div>`:''}
      ${q==='prepared'?coll('gearup',`<div><div class="eyebrow" data-tip="kw:gearup">Surprise advantage</div><h3>Adjust gear before the showdown</h3></div>`,
        `<p class="small">You caught the villain off guard. Swap gear between the party and armory before entering.</p>
          <div class="grid2">${party().map(h=>heroCard(h,'prep')).join('')}</div>`,true):''}
      <button class="btn pri inv-primary" data-a="lair">Enter the lair →</button>
    </div>`;
  }else{
    const e=evOf(i.events[i.step]),sig=VEVENTS[i.v]&&VEVENTS[i.v].includes(e);
    const newIntel=i.res&&i.fresh?i.found.slice(-i.fresh):[];
    content=`<div class="inv-lead-frame">
      <div class="inv-lead-top"><span class="inv-stamp">LEAD ${i.step+1} / 3</span>
        ${sig?`<span class="inv-lead-count" data-tip="kw:vlead">${esc(d.short)}'s trail</span>`:'<span class="inv-lead-count">New evidence</span>'}</div>
      <h3>${esc(e.title)}</h3><p class="inv-story">${esc(e.txt(d.name))}</p>
      ${i.res?`<div class="inv-result" aria-live="polite">
        <div class="inv-small-head">Investigation result</div>
        <p>${esc(i.res)}</p>
        ${newIntel.length?`<div class="inv-new-intel"><div class="inv-small-head">New intelligence</div><div class="intels">${newIntel.map(f=>intelTile(i.v,f,true)).join('')}</div></div>`:''}
        ${i.ovfFresh?`<p class="inv-overflow" data-tip="kw:overflow">+${i.ovfFresh} Intel from excess clues.</p>`:''}
        <button class="btn pri inv-primary" data-a="invnext">${i.step<2?'Next lead →':'Locate the lair →'}</button></div>`:
      `<div class="inv-choices" aria-label="Choose an approach">
        <div class="inv-small-head">Choose your approach</div>
        ${e.opts.map((o,n)=>`<button class="btn opt inv-choice" data-a="invopt:${n}" ${o.ok&&!o.ok()?'disabled':''}>
          <span><b>${n+1<10?'0':''}${n+1}</b> ${esc(o.l)}</span><small>${esc(o.h)}</small>
        </button>`).join('')}
      </div>`}
    </div>`;
  }
  return invCaseShell(i,content);
}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.inv=(p1)=>{startInv(p1)};
ACT.invopt=(p1)=>{const i=S.inv,ev=evOf(i.events[i.step]),o=ev.opts[+p1];lastInvRoll=null;i.res=o.run(i);
      {const r=lastInvRoll,m=/Roll (\d+)\+/.exec(o.h);if(r&&i.res.startsWith(`Rolled ${r.t}.`))i.res=`Rolled ${r.t}${r.b?` (d20 ${r.d} + ${r.b})`:''}${m?`, needed ${m[1]}+`:''}.`+i.res.slice(`Rolled ${r.t}.`.length)}
      intelSync();return;};
ACT.invnext=()=>{S.inv.step++;S.inv.res=null;S.inv.fresh=0};
ACT.invgo=()=>{S.inv.intro=false};
ACT.lair=()=>{startShowdown()};
