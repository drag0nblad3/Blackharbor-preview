/* tutorial/tutorial.js: Tutorial flow, scripted fights, HQ tour and overlay painting. */
function tutGo(i){const t=S.tut;t.b=i;const B=TUT[i];if(B&&B.dq)t.dq=B.dq.slice();if(B&&B.enter)B.enter()}
function tutTick(){if(!tutOn())return;const sd=S.sd;
  if(sd&&sd.patrol&&!sd.result&&!sd.busy&&!sd.hench.length){sd.result='win';sd.sel=null;sd.mode=null;log('sys','Patrol cleared. The subway is safe.')}
  for(let g=0;g<6;g++){const B=TUT[S.tut.b];if(!B||!B.done||!B.done())break;tutGo(S.tut.b+1)}}
/* a scripted beat accepts only its own taps; tutorial buttons and the playtest cheats always work */
function tutBlock(a){const B=tutBeat();if(!B||!B.only||!a)return false;if(a.startsWith('tut:')||a.startsWith('cheat:'))return false;
  const o=typeof B.only==='function'?B.only():B.only;if(o.includes(a))return false;
  const c=document.getElementById('tutc');if(c){c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake')}return true}
function tutLP(el){if(!tutOn())return;const d=el.dataset.tip||'';if(d.startsWith('cell:')){S.tut.lp=d.slice(5).replace(':',',');save();setTimeout(tutPaint,0)}}
function tutBoard(n){N=n;lastPos={};const sd=S.sd={N:n,finale:false,vkey:'mole',quality:'normal',round:1,obs:[],units:[],hench:[],civs:[],vl:[],vi:0,tdk:{},walls:[],pits:[],haz:[],bombs:[],beams:[],
  sel:null,mode:null,busy:false,log:[],evac:0,harmed:0,woundsBy:{},result:null,fx:[],intro:false,hexv:1};sd.exits=mkExits(n,false);return sd}
function tutHero(sd,k,x,y){const h=tutH(k);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp');h.cd=0;sd.units.push(mkUnit(h,x,y))}
function tutStart(){S.tutStash={villains:S.villains,pool:S.pool,armory:S.armory};S.villains=[moleState()];S.pool=[];S.armory=[];S.guide=null;
  recruitQuick('lynx');S.tut={b:0,dq:[]};tutGo(TUT.findIndex(b=>b.id==='meet'));S.phase='hq';S.view='hq'}
function tutPatrol(){const sd=tutBoard(7);sd.patrol=true;
  sd.vl.push({key:'mole',v:{x:0,y:0,shape:'one',face:5,level:1,deck:[],discard:[],wounds:[],last:null,down:true}});focusV(0);
  tutHero(sd,'lynx',3,6);sd.hench.push({id:'tA',owner:'mole',x:2,y:2,hp:2},{id:'tB',owner:'mole',x:5,y:1,hp:2});sd.obs.push('0,2','6,4');
  S.phase='sd';S.view='mission';log('sys','Patrol: Diggers on the 9th Street subway platform.');log('sys','Round 1. Tap a hero to act.')}
function tutPatrolEnd(){const h=tutH('lynx');S.salvage.mole=(S.salvage.mole||0)+2;h.xp+=1;h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp');S.sd=null;N=9;S.phase='hq';S.view='hq'}
function tutBoss(){if(!tutH('volt'))return;const sd=tutBoard(7),vs=vState('mole');
  sd.vl.push({key:'mole',v:{x:3,y:2,shape:'one',face:5,level:vs.level,deck:['dig','claw','tunnel','kick'].map(id=>buildCard('mole',{id,mk:0})),discard:[],wounds:[],last:null}});focusV(0);
  sd.obs.push('0,2','6,3');tutHero(sd,'lynx',1,6);tutHero(sd,'volt',5,6);
  sd.tdk.mole=[{...rxOf('mole','hardhat'),sig:'mole'},{...rxOf('mole','belly'),sig:'mole'},...TACT.filter(t=>t.id==='glance')];
  faceTo(sd.units[1]);S.seen=S.seen||{};S.seen.mole=[...new Set([...(S.seen.mole||[]),'dig','tunnel'])];sd.intro=!FAST;S.phase='sd';S.view='mission';vWarn();
  log('sys','Issue #1: Mole Boy\'s tunnel under the First City Bank. Standoff.');log('sys','Round 1. Tap a hero to act.')}
function tutFinish(){const sd=S.sd,t=S.tut,win=sd.result==='win',L=[];
  if(win){S.salvage.mole+=3;L.push('Salvaged 3 Grit from the tunnel.')}else L.push('The team is dragged out of the tunnel, a little dusty. No harm done.');
  const xp=[];sd.units.forEach(u=>{const h=heroOf(u);h.xp+=1;xp.push(`${h.name} +1`);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});L.push(`XP earned: ${xp.join(', ')}.`);
  if(win)L.push('Mole Boy escapes into his tunnels. Something tells you he\'ll be back.');
  t.won=win;t.lines=L;S.sd=null;N=9;S.phase='tutend';S.view='mission';tutGo(TUT.findIndex(b=>b.id==='end'))}
function tutSkip(){const t=S.tut;S.sd=null;N=9;slotPick=null;t.skip=true;t.lines=null;S.phase='tutend';S.view='mission';tutGo(TUT.findIndex(b=>b.id==='end'))}
function tutClose(){S.tips=[...new Set([...(S.tips||[]),...TUT_TIPS])];S.tut=null;S.tutDone=true;S.tutStash=null;S.sd=null;N=9;S.phase='hq';S.view='hq'}
function tutKeep(){const st=S.tutStash||{};S.villains=(st.villains||S.villains).filter(v=>v.key!=='mole');S.pool=st.pool||S.pool;S.armory=[...(st.armory||[]),...S.armory];
  roster().forEach(h=>{h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});if(S.story)S.story.kept=true;tutClose();revealStartingVillains();S.guide={s:1,pop:null}}
function tutFresh(){const keep={tips:S.tips,seen:S.seen,seenR:S.seenR,tipsOff:S.tipsOff,storyOff:S.storyOff};newCampaign();Object.assign(S,keep);tutClose()}
function tutAct(p){switch(p){
  case 'start':tutStart();scrollTo(0,0);break;
  case 'no':S.tut=null;S.tutDone=true;break;
  case 'next':{const B=tutBeat();if(!B||!B.next||(B.wait&&!B.wait()))break;if(B.go)B.go();tutGo(S.tut.b+1);break}
  case 'skip':if(tutOn())tutSkip();break;
  case 'hq':if(S.sd&&S.sd.patrol&&S.sd.result)tutPatrolEnd();scrollTo(0,0);break;
  case 'fight':tutBoss();scrollTo(0,0);break;
  case 'keep':if(S.phase==='tutend')tutKeep();scrollTo(0,0);break;
  case 'fresh':if(S.phase==='tutend')tutFresh();scrollTo(0,0);break}}
function tutModal(){if(FAST||!S.tut||S.tut.b||S.phase!=='hq')return '';
  return `<div id="guide" role="dialog" aria-modal="true" aria-labelledby="gtitle"><div class="gbox"><div class="eyebrow">Volume ${S.vol} · New to Blackharbor?</div><div><span class="sfxhead" id="gtitle">Your first night on patrol</span></div>
    <p class="small" style="margin:0">Learn the ropes in about 6 minutes: a scuffle with two henchmen, a trip to HQ to recruit a hero and craft them a weapon, and a small villain to beat. Afterwards you can keep those heroes or start an all-new team.</p>
    <div class="row"><button class="btn pri" data-a="tut:start">Start the tutorial</button><button class="btn" data-a="tut:no">Skip, I know how to play</button></div></div></div>`}
/* HQ during the tutorial: only the one thing the player needs next */
function tutHq(only){const V=tutH('volt'),d=VILLAINS.mole;
  if(only==='villains')return `<section class="panel"><div><div class="eyebrow">Case files · 1 open</div><h2>Case files</h2></div>
    <div class="card"><div class="row between"><div class="row" style="flex-wrap:nowrap;gap:8px"><span class="vbadge" style="${vSty('mole')}">${vIc('mole')}</span><h3>${d.name}</h3></div><span class="lvl" data-tip="kw:vlevel">LVL 1</span></div>
    <div class="small muted">${d.tag}. Drops <span class="cost">${resIc('mole')}</span>${d.salvage}. <span class="kwd" data-tip="kw:playbook">4-page playbook</span>.</div>
    <p class="small" style="margin:0">${esc(VINTEL.mole.intro)}</p><button class="btn pri" data-a="tut:fight">Confront Mole Boy</button></div></section>`;
  const baton=V||S.armory.includes('baton');
  return `<section class="panel"><div><div class="eyebrow">Recruitment · ${roster().length}/${ROSTER_MAX} heroes</div><h2>New heroes</h2></div>
    ${V?'<p class="small muted" style="margin:0">Volt has joined the team. The rest of the recruiting desk opens after tonight.</p>':`<div class="grid2">${qbCard('volt')}</div>`}</section>
  ${baton?`<section class="panel"><div><div class="eyebrow">Workshop</div><h2>Gear from salvage</h2></div>
    <p class="small muted" style="margin:0">Each item fills one body slot and needs the listed discipline rank to equip. "Any salvage" can be paid from any villain's salvage.</p>
    <div class="grid2"><div class="card" data-tip="gear:baton">${gearInfo('baton')}<div class="row between"><span class="small mono">${costHtml(GEAR.baton.cost)}</span>${S.armory.includes('baton')||(V&&V.gear.arms==='baton')?'<span class="tag g">Crafted</span>':`<button class="btn sm" data-a="craft:baton" ${afford(GEAR.baton.cost)?'':'disabled'}>Craft</button>`}</div></div></div></section>`:''}`}
function tutEndView(){const t=S.tut||{},ns=roster().map(h=>h.name),gear=roster().some(h=>h.gear.arms==='baton')?', the Shock Baton':'';
  const head=t.skip?'Tutorial skipped':t.won?'Mole Boy dug away!':'Mole Boy got away';
  return `<section class="panel"><div class="eyebrow">Tutorial complete</div><div><span class="sfxhead ${t.won===false?'bad':''}">${head}</span></div>
    ${t.lines?`<ul class="lines">${t.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}
    <p style="margin:0">Eleven villains are loose in Blackharbor. Who answers the call?</p>
    <p class="small muted" style="margin:0">The game saves on this device as you play. <b>Save / Load</b> at the top makes a code you can keep as a backup or use on another device.</p>
    <div class="grid2"><button class="btn opt" data-a="tut:keep"><span>Keep ${esc(ns.join(' and ')||'the team')}</span><small>They join Volume ${S.vol}${gear}${S.salvage.mole?` and your ${S.salvage.mole} Grit`:''} come with them. Recruit more heroes to fill a party of four.</small></button>
      <button class="btn opt" data-a="tut:fresh"><span>Start an all-new team</span><small>A fresh Volume ${S.vol} with an empty roster and the starter locker. Write your own heroes or pick quick builds.</small></button></div></section>`}
let tutSeenB=-1;
function tutPaint(){let c=document.getElementById('tutc');const B=tutBeat();document.querySelectorAll('.tutlit').forEach(e=>e.classList.remove('tutlit'));document.querySelectorAll('.tutring').forEach(e=>e.remove());
  if(!B||!B.t){if(c)c.remove();document.body.classList.remove('tutpad');tutSeenB=-1;return}
  if(!c){c=document.createElement('div');c.id='tutc';c.setAttribute('role','status');document.body.appendChild(c)}
  const ready=!B.wait||B.wait(),txt=typeof B.t==='function'?B.t():B.t;
  const html=`<div class="tc"><b>Dispatch</b><p>${txt}</p>${B.extra?B.extra():''}<div class="row">${B.next?`<button class="btn sm pri" data-a="tut:next" ${ready?'':'disabled'}>${B.nextL||'Next'}</button>`:''}<button class="btn sm" data-a="tut:skip" style="margin-left:auto">Skip tutorial</button></div></div>`;
  if(c.dataset.h!==html){c.innerHTML=html;c.dataset.h=html}c.classList.toggle('top',!!document.querySelector('#atk,#cards,#brk'));
  document.body.classList.add('tutpad');document.body.style.setProperty('--tutpad',(c.offsetHeight+20)+'px');
  let tgt=null;const sel=B.lit&&B.lit();if(sel)document.querySelectorAll(sel).forEach(e=>{e.classList.add('tutlit');tgt=tgt||e});
  const r=B.ring&&B.ring();if(r){const cell=document.querySelector(`.board [data-cell="${r[0]},${r[1]}"]`);if(cell){const d=document.createElement('div');d.className='tutring';d.setAttribute('style',cell.getAttribute('style'));
    d.innerHTML=`<svg viewBox="0 0 100 115.5" preserveAspectRatio="none" aria-hidden="true"><polygon points="50,3 97,30 97,85.5 50,112.5 3,85.5 3,30"/></svg>${r[2]?`<span>${esc(r[2])}</span>`:''}`;cell.parentNode.appendChild(d);tgt=tgt||d}}
  /* scroll the target into view whenever it changes, clear of the caption at the bottom */
  const key=S.tut.b+'|'+sel+'|'+(r||'');if(key!==tutSeenB){tutSeenB=key;if(tgt&&!document.getElementById('atk')&&!document.getElementById('cards'))setTimeout(()=>{if(!tgt.isConnected)return;const R=tgt.getBoundingClientRect(),top=c.getBoundingClientRect().top;
    if(R.top<8||R.bottom>top-8)scrollBy({top:R.top+R.height/2-Math.min(innerHeight/2,(top-8)/2),behavior:RM?'auto':'smooth'})},60)}}

/* while an attack panel, playbook page or break splash is up, the caption moves to the top and lets taps through to it */
if(!FAST&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{const c=document.getElementById('tutc');if(c)c.classList.toggle('top',!!document.querySelector('#atk,#cards,#brk'))}).observe(document.body,{childList:true});

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.tut=(p1)=>{tutAct(p1)};
