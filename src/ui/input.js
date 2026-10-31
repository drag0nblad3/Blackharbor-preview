/* ui/input.js: Document click dispatch (runs ACT handlers, then render) and other page-wide listeners. */
document.addEventListener('click',e=>{
  {const c0=e.target.closest('[data-cell]'),e0=e.target.closest('[data-a]');if(tutBlock(c0&&S.phase==='sd'?'cell:'+c0.dataset.cell:e0&&!e0.disabled?e0.dataset.a:null))return}
  const cell=e.target.closest('[data-cell]');if(cell&&S.phase==='sd'){onCell(...cell.dataset.cell.split(',').map(Number));return}
  const el=e.target.closest('[data-a]');if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;const[a,p1,p2,p3]=el.dataset.a.split(':');
  switch(a){
    case 'view':S.view=p1;break;
    case 'rofocus':{
      const h=roster().find(h=>h.id===p1);if(!h)break;
      S.view='roster';S.ui=S.ui||{};S.ui['ro-party']=true;S.ui['ro-bench']=true;
      S.ui['h-'+h.id]=true;render();
      if(!FAST){const sheet=document.querySelector('[data-cid="h-'+h.id+'"]');
        if(sheet)sheet.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});}
      return;
    }
    case 'wsby':S.ui=S.ui||{};S.ui.wsBy=p1;break;
    case 'build':if(facOpen(p1)&&afford(FAC[p1].cost)){pay(FAC[p1].cost);S.facilities.push(p1)}break;
    case 'craft':case 'crafteq':if(GEAR[p1]&&afford(GEAR[p1].cost)&&anyAsk(GEAR[p1].cost)){pickAny(GEAR[p1]).then(pk=>{if(pk)doCraft(a,p1,p2,pk);render()});return}doCraft(a,p1,p2);break;
    case 'anyauto':S.anyAuto=p1==='1';break;
    case 'equip':{const h=S.heroes.find(x=>x.id===p1);slotPick=null;if(!h||!(S.phase==='hq'||prepGear()))break;equipHero(h,p2,p3);break}
    case 'wsfreset':{S.ui=S.ui||{};S.ui.wsf={};break}
    case 'effreset':{S.ui=S.ui||{};if(S.ui.ef)delete S.ui.ef[p1];break}
    case 'gearinspect':{if(slotPick&&slotFits(heroById(slotPick.h),slotPick.s).includes(p1))slotPick.g=p1;break}
    case 'slotpick':{slotPick=p1==='close'?null:{h:p1,s:p2};break}
    case 'guide':{const g=S.guide;if(!g)break;if(p1==='skip'){S.guide=null;break}if(p1==='go'){g.s=1;g.pop=null;break}if(p1==='close'){g.pop=null;break}
      if(p1==='next'){if(g.s===2){g.s=3;g.pop='gear'}else if(g.s===3){g.s=4;g.pop='roster'}break}
      if(p1==='open'){g.pop=null;S.ui=S.ui||{};if(p2==='roster'){S.view='roster';S.ui['ro-party']=S.ui['ro-bench']=true;roster().forEach(h=>S.ui['h-'+h.id]=true)}else{S.view=p2.startsWith('vl-')?'villains':'hq';S.ui[p2]=true}
        render();const t=p2==='roster'?null:document.querySelector(`[data-cid="${p2}"]`);if(t)t.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});else scrollTo(0,0);return}
      break}
    case 'unequip':{const h=S.heroes.find(x=>x.id===p1);if(!h||!(S.phase==='hq'||prepGear()))break;const g=h.gear[p2];if(g){delete h.gear[p2];S.armory.push(g);clampHero(h)}break}
    case 'track':{const h=S.heroes.find(x=>x.id===p1);if(!h||h.trackPick||!TRACKS[p2]||h.ranks[p2]>=RANK_MAX)break;const mh=stat(h,'maxHp'),mc=stat(h,'maxComp');h.ranks[p2]++;h.trackPick=p2;h.hp+=Math.max(0,stat(h,'maxHp')-mh);h.comp+=Math.max(0,stat(h,'maxComp')-mc);break}
    case 'up':{const h=S.heroes.find(x=>x.id===p1);h.upgrades.push(p2);h.pendingUp--;h.upChoices=null;h.trackPick=null;if(p2==='hp')h.hp+=3;if(p2==='comp')h.comp+=2;break}
    case 'combatMenu':combatMenu(p1);return;
    case 'combatPick':combatPick(p1,p2);return;
    case 'combatClear':combatClear();return;
    case 'combatUse':combatUse();return;
    case 'ab':useAb(p1);break;
    case 'bridge':bridgeAct(p1);break;
    case 'unpouch':{const h=S.heroes.find(x=>x.id===p1);if(!h||!(S.phase==='hq'||prepGear()))break;const p=pouchOf(h),g=p[+p2];if(g){p.splice(+p2,1);S.armory.push(g)}break}
    case 'book':openPlaybook(p1);return;
    case 'inv':startInv(p1);break;
    case 'invopt':{const i=S.inv,ev=evOf(i.events[i.step]),o=ev.opts[+p1];lastInvRoll=null;i.res=o.run(i);
      {const r=lastInvRoll,m=/Roll (\d+)\+/.exec(o.h);if(r&&i.res.startsWith(`Rolled ${r.t}.`))i.res=`Rolled ${r.t}${r.b?` (d20 ${r.d} + ${r.b})`:''}${m?`, needed ${m[1]}+`:''}.`+i.res.slice(`Rolled ${r.t}.`.length)}
      intelSync();break}
    case 'invnext':S.inv.step++;S.inv.res=null;S.inv.fresh=0;break;
    case 'invgo':S.inv.intro=false;break;
    case 'lair':startShowdown();break;
    case 'mode':S.sd.mode=S.sd.mode===p1?null:p1;S.sd.combatPick=null;break;
    case 'power':usePower();break;
    case 'avoidDamage':avoidDamage();return;
    case 'rallySpirit':rallySpirit();return;
    case 'escort':escort();return;
    case 'hack':hack();return;
    case 'letgo':{const u=S.sd&&S.sd.units[S.sd.sel];if(u)letGo(u,'lets the civilians go.');break}
    case 'endround':endRoundTap();return;
    case 'debrief':if(tutOn()){tutFinish();break}S.sd.finale?finaleDebrief():debrief();break;
    case 'tut':tutAct(p1);break;
    case 'sdgo':{const sd=S.sd;if(!sd||!sd.intro)break;sd.intro=false;if(sd.quality==='ambush'&&sd.round===0&&!sd.busy){render();setTimeout(villainPhase,500);return}break}
    case 'sdlook':if(S.sd)S.sd.outro=true;break;
    case 'ethos':S.ethos[p1]=p2;if(p1==='b'&&p2==='secret')roster().forEach(h=>h.comp=stat(h,'maxComp'));S.after.ethos=null;break;
    case 'next':S.after=null;if(S.over)S.phase='over';else if(S.arcInfo){S.phase='arc';S.view='mission'}else if(S.finalePending)setupEvent();else{S.phase='hq';S.view='hq'}break;
    case 'finale':startFinale(p1);break;
    case 'focus':focusV(+p1);break;
    case 'hush':{const o=S.sd&&S.sd.vl[+p1];if(o)o.v.hush=o.v.warn;break}
    case 'rd':research(p1==='free');break;
    case 'cheat':cheat(p1,p2);break;
    case 'tip':S.tips=S.tips||[];if(p1==='off')S.tipsOff=true;else if(p2&&!S.tips.includes(p2))S.tips.push(p2);S.tipAt=Date.now();break;
    case 'ostart':if(S.cre&&S.cre.mode===p1)S.view='create';else if(p1==='basic'||xoverOpen())oStart(p1);render();scrollTo(0,0);return;
    case 'opick':oPick(p1,p2);break;
    case 'oup':{const c=S.cre;if(c.ups.length<oLevel(c)-1&&c.ups.filter(u=>u===p1).length<2)c.ups.push(p1);break}
    case 'ounup':S.cre.ups.splice(+p1,1);break;
    case 'ogear':{const c=S.cre,i=c.gear.indexOf(p1);if(i>=0)c.gear.splice(i,1);else if(c.gear.length<oGearMax(c)&&!c.gear.some(g=>GEAR[g].slot===GEAR[p1].slot))c.gear.push(p1);break}
    case 'ohq':{const c=S.cre,i=c.hq.indexOf(p1);if(i>=0)c.hq.splice(i,1);else if(c.hq.length<oHqMax(c))c.hq.push(p1);break}
    case 'ocol':S.cre.col=p1;break;
    case 'orand':S.cre.sugg=oSuggest(S.cre);break;
    case 'osug':{const c=S.cre,n=c.sugg&&c.sugg[+p1];if(n)c.name=n;break}
    case 'odisc':{const c=S.cre,sp=oOpt('spark',c.picks.spark);c.disc=p1;if(sp&&sp.track!==p1){delete c.picks.spark;if(c.picks.gift&&!O_POW[p1].includes(c.picks.gift))delete c.picks.gift;delete c.picks.training;c.ups=[];c.gear=[]}break}
    case 'onext':{const c=S.cre,st=oSteps(c);if(oValid(c,st[c.step])&&c.step<st.length-1)c.step++;render();scrollTo(0,0);return}
    case 'oback':S.cre.step=Math.max(0,S.cre.step-1);render();scrollTo(0,0);return;
    case 'ocancel':S.cre=null;S.view='hq';break;
    case 'ofinish':oFinish();render();scrollTo(0,0);return;
    case 'qb':recruitQuick(p1);break;
    case 'bench':S.party=S.party.filter(id=>id!==p1);break;
    case 'join':if(S.party.length<4&&!S.party.includes(p1))S.party.push(p1);break;
    case 'swap':{const i=S.party.indexOf(p2);if(i>=0&&!S.party.includes(p1))S.party[i]=p1;break}
    case 'arcnext':S.arcInfo=null;S.phase='hq';S.view='hq';break;
    case 'restart':newCampaign(S);break;
  }render()});
document.addEventListener('input',e=>{if(e.target.id==='oname'&&S.cre){const v=oClean(e.target.value);if(v!==e.target.value)e.target.value=v;S.cre.name=v;save()}});

(function(){const pts=[];for(let i=0;i<28;i++){const a=Math.PI*2*i/28,r=i%2?32+((i*7)%5):50-((i*3)%4);pts.push(`${(50+r*Math.cos(a)).toFixed(1)}% ${(50+r*Math.sin(a)).toFixed(1)}%`)}
  const st=document.createElement('style');st.textContent=`.fx:not(.k-say) .b::before,.fx:not(.k-say) .b::after,#brk .burst::before,#brk .burst::after{clip-path:polygon(${pts.join(',')})}`;document.head.appendChild(st)})();
