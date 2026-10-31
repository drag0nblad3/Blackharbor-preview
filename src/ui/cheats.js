/* ui/cheats.js: Playtest cheat panel. */
function cheatPanel(){const ph=S.phase,inSd=ph==='sd'&&S.sd&&!S.sd.result,god=S.cheat&&S.cheat.god;
  const b=(a,l,dis)=>`<button class="btn sm" data-a="cheat:${a}" ${dis?'disabled':''}>${l}</button>`;
  return `<section class="panel cheats">${coll('cheats','<div><div class="eyebrow">Playtest</div><h3>Cheat menu</h3></div>',
    `<div class="row">${b('res','Add all resources')}${b('xp','+6 XP to every hero')}${b('heal','Heal team')}${b('god',god?'Invincible: ON':'Invincible: off')}${b('tips','Show first-time tips again')}${b('wipe',wipeArmed()?'Tap again to erase your save':'Reset save (first-time player)')}</div>
    <div class="row">${b('unlock','Unlock all blueprints')}${b('build','Build all unlocked facilities')}${b('vlevel','Free villains +1 level')}</div>
    ${ph==='hq'?`<div class="row">${b('arcend',`Skip to end of Arc ${arcOf(S.issue)}`)}${b('finale','Skip to the event comic')}${b('xover','Allow a Crossover Issue now')}</div>`:''}
    ${ph==='inv'?`<div class="row">${b('clues','+3 clues')}</div>`:''}
    ${inSd?`<div class="row">${b('tear','Tear 3 pages from target')}${b('refresh','Refresh actions, powers and resources')}${b('win','Win this fight')}${b('lose','Lose this fight')}</div>`:''}`,false)}</section>`}
const wipeArmed=()=>!!(S.cheat&&S.cheat.wipe&&Date.now()-S.cheat.wipe<6000);
function cheat(a,p2){S.cheat=S.cheat||{};
  switch(a){
    case 'res':S.tech+=20;S.intel+=20;S.trust+=5;for(const k in S.salvage)S.salvage[k]+=6;break;
    case 'xp':roster().forEach(h=>{h.xp+=6;while(h.xp>=xpNeed(h)){h.xp-=xpNeed(h);h.pendingUp++}});break;
    case 'heal':roster().forEach(h=>{h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});if(S.sd)S.sd.units.forEach(u=>{if(u.ko){u.ko=false}});break;
    case 'god':S.cheat.god=!S.cheat.god;break;
    case 'tips':S.tips=[];S.tipsOff=false;S.tipAt=0;break;
    case 'xover':S.cheat.xover=true;break;
    case 'wipe':if(!wipeArmed()){S.cheat.wipe=Date.now();break}try{localStorage.removeItem(KEY)}catch(e){}newCampaign();scrollTo(0,0);break;
    case 'unlock':unlock(ALL_ITEMS);break;
    case 'build':Object.keys(FAC).forEach(k=>{if(isUnlocked('fac:'+k)&&!S.facilities.includes(k))S.facilities.push(k)});break;
    case 'vlevel':S.villains.forEach(v=>{if(v.status==='active')levelUpVillain(v)});break;
    case 'arcend':{S.issue=arcOf(S.issue)*ISSUES_PER_ARC;const k=(S.villains.find(v=>v.status==='active')||S.villains[0]).key;finishIssue(['Playtest skip: time jumps to the end of the arc.'],{hunted:null,headline:'Time skip',vkey:k});break}
    case 'finale':{S.issue=MAX_ISSUE;S.arcInfo=null;const k=(S.villains.find(v=>v.status==='active')||S.villains[0]).key;finishIssue(['Playtest skip: time jumps to the end of the volume.'],{hunted:null,headline:'Time skip',vkey:k});S.arcInfo=null;break}
    case 'clues':if(S.inv){S.inv.clues+=3;intelSync()}break;
    case 'tear':{const sd=S.sd;for(let i=0;i<3&&!sd.result;i++)woundV();break}
    case 'refresh':S.sd.units.forEach(u=>{const h=heroOf(u);u.moved=false;u.acted=false;h.cd=0;u.res={tech:pwrMax(h),magic:arcMax(h)};u.innUsed=0;u.abUsed=[]});break;
    case 'win':S.sd.vl.forEach(o=>o.v.down=true);endSd('win');break;
    case 'lose':S.sd.units.forEach(u=>{u.ko=true;heroOf(u).hp=0});endSd('loss');break;
  }}

/* button actions (data-a="name:p1:p2:p3"); return NO_RENDER to skip the render after it */
ACT.cheat=(p1,p2)=>{cheat(p1,p2)};
