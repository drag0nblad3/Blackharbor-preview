/* campaign/screens.js: After-fight and game-over screens, and the finale event (Mole Boy + last villain). */
function afterView(){const a=S.after,d=VILLAINS[a.vkey];
  const eth=a.ethos?ETHOS[a.ethos]:null;
  const bad=/Defeat|Slipped/.test(a.headline);
  return `<section class="panel"><div class="eyebrow">Aftermath · ${d?d.name:'Headquarters'}</div><div><span class="sfxhead ${bad?'bad':''}">${a.headline}</span></div>
  ${a.lines.length>3?coll('after-lines','<span class="eyebrow">What happened · '+a.lines.length+'</span>',`<ul class="lines">${a.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`):`<ul class="lines">${a.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`}
  ${eth?`<div class="cap"><b>A defining moment.</b> ${eth.q} This choice is permanent.</div><div class="grid2">${eth.opts.map(o=>`<button class="btn opt" data-a="ethos:${a.ethos}:${o.id}"><span>${o.n}</span><small>${o.txt}</small></button>`).join('')}</div>`
    :`<button class="btn pri" data-a="next">${S.over?'See how the volume ends':S.arcInfo?`Arc ${S.arcInfo.arc} begins`:S.finalePending?'Open the event comic':`Begin issue #${S.issue}`}</button>`}</section>`}
function overView(){const o=S.over;return `<section class="panel"><div class="eyebrow">Volume ${S.vol}</div><div><span class="sfxhead ${o.win?'':'bad'}">${o.win?'The End':'Cancelled!'}</span></div>
  <p style="margin:0">${o.txt}</p>${coll('over-chron','<span class="eyebrow">Back issues · '+S.chronicle.length+'</span>',`<ul class="lines small">${S.chronicle.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`,false)}
  <button class="btn pri" data-a="restart">Start Volume ${S.vol+1}</button><p class="small muted" style="margin:0">A new volume starts a fresh team and three random villains. What you learned about villain playbooks carries over.</p></section>`}

const EVENT_TITLES=['Night of Two Masters','Total Breakout','The Long Eclipse','City Under Siege','Twilight of Heroes'];
/* Tyler, 2026-10-30: the finale is a villain never revealed this volume at level 8, teamed with a level 8 Mole Boy.
   Mole Boy's playbook is his four pages repeated up to the level-8 size, upgraded evenly from I to III. */
function finaleMole(){const ids=VILLAINS.mole.base,vs={...moleState(),level:VCAP,deck:[]},n=deckSize(vs);
  for(let i=0;i<n;i++)vs.deck.push({id:ids[i%ids.length],mk:Math.floor(i*4/n)});return vs}
function setupEvent(){let k=chooseVillainFromPool(),fresh=!!k;
  if(!k)k=S.villains.filter(v=>v.status==='active').sort((a,b)=>b.level-a.level)[0].key;   // pool empty: the strongest active villain
  if(fresh)S.villains.push(makeVillain(k,VCAP));else{const vs=vState(k);while(vs.level<VCAP)levelUpVillain(vs,true)}
  S.villains=S.villains.filter(v=>v.key!=='mole');S.villains.push(finaleMole());const keys=[k,'mole'];
  S.event={keys,title:pick(EVENT_TITLES),prep:null};S.finalePending=false;S.phase='event';S.view='mission'}
const PREP={scout:{n:'Coordinated recon',txt:'Both villains start with 1 page already torn out.'},
  evac:{n:'Evacuate the district',txt:'Only 2 civilians remain on the battlefield instead of 4, and the city thanks you: +2 trust.'},
  rally:{n:'Rally the team',txt:'Heroes start at full health and composure, and every hero\'s first attack gets +1 die.'}};
function startFinale(p){S.event.prep=p;if(p==='evac')S.trust+=2;
  if(p==='rally')party().forEach(h=>{h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});
  startShowdown({finale:true,keys:S.event.keys,quality:p==='scout'?'prepared':'normal',civs:p==='evac'?2:4});
  if(p==='rally')S.sd.units.forEach(u=>u.buffDice=1)}
function eliteSalvage(L){const sd=S.sd;for(const k of sd.elites||[])if(!sd.hench.some(m=>m.elite&&m.owner===k)){S.salvage[k]=(S.salvage[k]||0)+1;L.push(`${eliteOf(k).name} was taken down: +1 ${VILLAINS[k].salvage}.`)}}
function finaleDebrief(){const sd=S.sd,L=[],names=S.event.keys.map(k=>VILLAINS[k].name).join(' and ');
  eliteSalvage(L);const evT=sd.evac,per=S.ethos.a==='force'?2:1;S.trust+=evT-sd.harmed*per;L.push(`${sd.evac} civilians evacuated, ${sd.harmed} harmed.`);
  let headline;
  if(sd.result==='win'){headline='City saved!';S.trust+=3;L.push(`${names} are beaten together and the city is safe again. +3 trust.`)}
  else{headline=sd.result==='loss'?'Blackharbor falls':'They got away';L.push(sd.result==='loss'?`${names} overwhelm the team.`:`${names} slip away before the dust settles.`)}
  const beatN=S.villains.filter(v=>v.beaten).length+(sd.result==='win'?S.event.keys.filter(k=>!VILLAINS[k].intro&&!vState(k).beaten).length:0),total=S.villains.filter(v=>!VILLAINS[v.key].intro).length;
  S.chronicle.push(`Event comic, "${S.event.title}": ${headline.toLowerCase().replace('!','')}.`);
  const win=sd.result==='win'&&S.trust>0;
  S.over={win,txt:win?`"${S.event.title}" ends in victory. Volume ${S.vol} closes with ${beatN} of ${total} villains beaten in their lairs.`:`"${S.event.title}" ends in defeat. Volume ${S.vol} closes with ${beatN} of ${total} villains beaten in their lairs, and the city remembers who failed it.`};
  S.after={headline,lines:L,vkey:S.event.keys[0],ethos:null};S.sd=null;N=9;S.phase='after';S.view='mission'}
function eventView(){const e=S.event;
  return `<section class="panel eventsplash"><div class="eyebrow">Volume ${S.vol} · Event comic</div><div><span class="sfxhead">${esc(e.title)}!</span></div>
    <div class="cap tilt">Two villains join forces for one last strike on Blackharbor. They act one after the other every round, on a bigger 11×11 battlefield. Beat both to end the volume in triumph.</div>
    <div class="grid2">${e.keys.map(k=>{const v=vState(k),d=VILLAINS[k];return `<div class="card"><div class="row between"><h3>${d.name}</h3><span class="lvl">LVL ${v.level}</span></div><div class="small muted">${d.tag}. ${v.deck.length}-page playbook.</div><button class="btn sm" data-a="book:${k}" style="align-self:flex-start">Read playbook</button></div>`}).join('')}</div>
    <div class="eyebrow">Choose your preparation</div>
    <div class="grid2">${Object.entries(PREP).map(([k,p])=>`<button class="btn opt" data-a="finale:${k}"><span>${p.n}</span><small>${p.txt}</small></button>`).join('')}</div></section>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.ethos=(p1,p2)=>{S.ethos[p1]=p2;if(p1==='b'&&p2==='secret')roster().forEach(h=>h.comp=stat(h,'maxComp'));S.after.ethos=null};
ACT.next=()=>{S.after=null;if(S.over)S.phase='over';else if(S.arcInfo){S.phase='arc';S.view='mission'}else if(S.finalePending)setupEvent();else{S.phase='hq';S.view='hq'}};
ACT.finale=(p1)=>{startFinale(p1)};
ACT.arcnext=()=>{S.arcInfo=null;S.phase='hq';S.view='hq'};
ACT.restart=()=>{newCampaign(S)};
