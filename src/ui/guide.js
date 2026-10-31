/* ui/guide.js: New-volume guide bar and modal. */
function guideTick(){const g=S.guide;if(!g||S.tut)return;
  if(S.phase!=='hq'){S.guide=null;return}
  if(g.s===1&&party().length>=4){g.s=2;g.pop='base'}
  if(g.s===2&&S.facilities.some(k=>k!=='workshop')){g.s=3;g.pop='gear'}
  if(g.s===3&&g.eq){g.s=4;g.pop='roster'}
  if(g.pop==='roster'&&S.view==='roster')g.pop=null}
const G_STEPS=['Team','Base','Gear','Roster'];
function guideBar(){const g=S.guide;if(!g||!g.s||S.phase!=='hq')return '';const n=party().length;
  const msg=[,`<b>Recruit a team of four.</b> Every mission sends a party of 4 heroes, and investigations stay locked until all four spots are filled. Party ${n}/4.`,
    `<b>Build your base.</b> The Workshop is already running, so you can craft gear. Spend Tech and Intel on another facility under Base development.`,
    `<b>Gear up.</b> The armory has a starter locker. Use Equip to… in the Workshop panel, or craft something new.`,
    S.view==='villains'?`<b>Pick a villain.</b> Read each case file below, then tap <b>Investigate</b> on the one you want to hunt this issue.`:`<b>Check your roster.</b> Look over each hero's stats, power and gear. When you're happy, open the <b>Villains</b> tab and Investigate a villain under Case files.`][g.s];
  const btn=g.s===2?`<button class="btn sm" data-a="guide:open:hq-base">Base development</button><button class="btn sm" data-a="guide:next">Skip to gear</button>`
    :g.s===3?`<button class="btn sm" data-a="guide:open:hq-ws">Workshop</button><button class="btn sm" data-a="guide:next">Done gearing up</button>`
    :g.s===4?(S.view==='roster'?`<button class="btn sm pri" data-a="guide:open:vl-cases">Pick a villain</button>`:S.view==='villains'?'':`<button class="btn sm" data-a="guide:open:roster">Open roster</button>`):'';
  return `<div class="gbar" role="status"><div class="gsteps">${G_STEPS.map((t,i)=>`<span class="${i+1===g.s?'on':i+1<g.s?'done':''}">${i+1}. ${t}</span>`).join('')}</div>
    <div class="small">${msg}</div><div class="row">${btn}<button class="btn sm" data-a="guide:skip" style="margin-left:auto">Hide guide</button></div></div>`}
function guideModal(){const g=S.guide;if(!g||S.tut||S.phase!=='hq'||S.view==='create')return '';
  if(g.s===0)return `<div id="guide" role="dialog" aria-modal="true" aria-labelledby="gtitle"><div class="gbox"><div class="eyebrow">Volume ${S.vol} · How a volume plays</div><div><span class="sfxhead" id="gtitle">Welcome to Blackharbor!</span></div>
    <p class="small" style="margin:0">A volume is a full campaign: ${ARCS} arcs of ${ISSUES_PER_ARC} issues, then an event comic finale. Each issue goes like this:</p>
    <ol class="gflow"><li><span><b>Recruit four heroes.</b> Every mission sends a party of 4.</span></li><li><span><b>Build your base.</b> The Workshop is ready for crafting. Other facilities add healing, resources and new options.</span></li><li><span><b>Gear up.</b> Equip items from the armory, or craft new ones from villain salvage.</span></li><li><span><b>Check the roster.</b> Make sure the right four are in the party.</span></li><li><span><b>Investigate a villain</b> from the Villains tab. Clues decide how the fight starts and reveal their playbook.</span></li><li class="later"><span><b>Showdown in the lair</b>, then the aftermath: XP, salvage and injuries. Villains you leave alone keep scheming and grow stronger each arc.</span></li></ol>
    <p class="small muted" style="margin:0">Long-press any stat, item or keyword for details.</p>
    <div class="row"><button class="btn pri" data-a="guide:go">Recruit my team</button><button class="btn" data-a="guide:skip">I know how to play</button></div></div></div>`;
  const P={base:['Team assembled!','Your four heroes are ready. Your Workshop is already up and running for crafting gear. Next, build up the rest of your base: other facilities give you resources, healing and new options.','Go to base development','hq-base'],
    gear:['Base online!','Time to gear up. The armory has a starter locker: use Equip to… to hand items straight to a hero, or craft new gear in the Workshop.','Go to the workshop','hq-ws'],
    roster:['Suited up!','Before you investigate a villain, look over your roster. Check each hero\'s stats, power and gear, and make sure the right four are in the party.','Open the roster','roster']}[g.pop];
  if(!P)return '';
  return `<div id="guide" role="dialog" aria-modal="true" aria-labelledby="gtitle"><div class="gbox"><div class="eyebrow">Step ${g.s} of 4</div><div><span class="sfxhead" id="gtitle">${P[0]}</span></div>
    <p class="small" style="margin:0">${P[1]}</p><div class="row"><button class="btn pri" data-a="guide:open:${P[3]}">${P[2]}</button><button class="btn" data-a="guide:close">Not now</button></div></div></div>`}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.guide=(p1,p2)=>{const g=S.guide;if(!g)return;if(p1==='skip'){S.guide=null;return;}if(p1==='go'){g.s=1;g.pop=null;return;}if(p1==='close'){g.pop=null;return;}
      if(p1==='next'){if(g.s===2){g.s=3;g.pop='gear'}else if(g.s===3){g.s=4;g.pop='roster'}return;}
      if(p1==='open'){g.pop=null;S.ui=S.ui||{};if(p2==='roster'){S.view='roster';S.ui['ro-party']=S.ui['ro-bench']=true;roster().forEach(h=>S.ui['h-'+h.id]=true)}else{S.view=p2.startsWith('vl-')?'villains':'hq';S.ui[p2]=true}
        render();const t=p2==='roster'?null:document.querySelector(`[data-cid="${p2}"]`);if(t)t.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});else scrollTo(0,0);return NO_RENDER;}
      return;};
