/* heroes/origin.js: Hero creation rules: origin story steps and options, name generator, quick recruits, recruit XP, newHero. */
const BASE=h=>h.base||HERO_BASE[h.cls];
const ROSTER_MAX=10;
/* new heroes come with nothing, so a fresh team gets a shared locker of level-1 items */
/* Version 101 (Tyler): nobody starts with villain set gear, so the starter locker holds only non-set items */
/* Version 102 (Tyler): no consumables in the locker, and three new non-set level-1 items fill the gaps: a Tech and an Innate weapon and a Head item */
/* Version 104 (Tyler): a level-1 Head item for Magic and for Innate too */
const STARTER_LOCKER=['baton','knuckles','runeblade','goggles','hood','headband','medkit','scanner','coin','hooks'];
/* Version 116 (Tyler): new heroes start at Strength 2 and evasion 8 (were 3 and 10) */
const O_TEMPLATE={maxHp:9,move:4,speed:2,acc:0,str:2,eva:8,range:1,maxComp:5};
const O_FLOOR={maxHp:6,move:2,speed:1,acc:0,str:1,eva:6,range:1,maxComp:3};
const O_GLOW={tech:'#3DB6DD',innate:'#F08A4B',magic:'#B48CF0'};
const O_COLS=['#C92463','#2F6FB5','#D08A12','#1F9C8A','#7A4FC0','#A0522D','#556B2F','#B0306A','#3F51B5','#5A6275'];
const O_NAME=[['Night','Iron','Static','Crimson','Silver','Ghost','Storm','Ember','Quiet','Neon','Hollow','Rook','Velvet','Cinder'],['hawk','line','fist','shade','wire','fall','jack','spark','veil','watch','bolt','fang','moth','tide']];
const FIELD_AB={
  senses:{id:'senses',n:'Keen Senses',txt:'While in the party, every die rolled during investigations gets +2. Two heroes with it do not stack.'},
  intercept:{id:'intercept',n:'Signal Intercept',txt:'While in the party, every investigation opens with 1 unseen playbook page already revealed. Two heroes with it do not stack.'},
  premonition:{id:'premonition',n:'Premonition',txt:"While in the party, at the start of each issue, reveal 2 unseen pages from active villains' playbooks and gain 1 intel. Two heroes with it do not stack."}};
const O_POW={tech:['arc','patch','barricade','overclock','drone','emp'],innate:['brace','mark','quake','regen','berserk','leap'],magic:['blur','omen','curse','aegis','drain','serene']};
const O_POWFL={arc:'Lightning answers when you call it.',patch:'Your gadgets fix people as well as machines.',barricade:'Ten seconds and some scrap metal, and you have a wall.',
  brace:'You plant your feet and nothing gets past.',mark:'Once you have their scent, they cannot hide.',quake:'You hit the ground and the ground hits back.',
  blur:'You move between the seconds.',omen:'You see the next blow before it lands.',curse:'One whispered word, and their strength rots.',
  overclock:'Redline every circuit for one perfect strike.',drone:'A little flying friend with a big stun gun.',emp:'One pulse and their tech goes dark.',
  regen:'Bullet holes close while you watch.',berserk:'Something wild takes the wheel.',leap:'Rooftop to rooftop in a single bound.',
  aegis:'A circle of light that takes the sting out of the next blow.',drain:'Their strength becomes yours.',serene:'Your calm spreads like a ripple on water.'};
const ORIGIN={
  life:{t:'Before the Mask',cap:'Every hero had a life before the costume. Who were you when nobody was watching?',opts:[
    {id:'cop',n:'Beat Detective',fl:'Ten years with a badge taught you how this city lies.',field:'senses'},
    {id:'hacker',n:'Night-Shift Hacker',fl:'You hear every police band and private line in town.',field:'intercept'},
    {id:'psychic',n:'Storefront Psychic',fl:'The visions were real all along. Nobody believed you.',field:'premonition'},
    {id:'soldier',n:'Ex-Soldier',fl:'Two tours. You know how to take a hit and keep moving.',mods:{maxHp:2}},
    {id:'athlete',n:'Pro Athlete',fl:'Fastest feet in the league, until the knee went. Then it came back.',mods:{move:1}},
    {id:'street',n:'Street Kid',fl:'You grew up dodging trouble in the alleys you now protect.',mods:{eva:2}}]},
  spark:{t:'The Incident',cap:'Then came the night everything changed. Where does your power come from?',opts:[
    {id:'garage',n:'Built It in a Garage',track:'tech',adj:'Gadget',fl:'Duct tape, stolen parts and a genius nobody would hire.',mods:{maxPwr:2}},
    {id:'proto',n:'Stole the Prototype',track:'tech',adj:'Armored',fl:'The suit was built for a war. You took it to the streets.',mods:{str:2}},
    {id:'cyborg',n:'Rebuilt in Chrome',track:'tech',adj:'Cyborg',fl:'They put you back together after the crash. Mostly metal now.',mods:{maxHp:2}},
    {id:'accident',n:'Lab Accident',track:'innate',adj:'Mutant',fl:'The vat exploded. You walked out changed.',mods:{maxHp:3}},
    {id:'born',n:'Born Different',track:'innate',adj:'Born',fl:'It was always in your blood. High school was a nightmare.',mods:{maxHp:2}},
    {id:'cosmic',n:'Cosmic Radiation',track:'innate',adj:'Cosmic',fl:'A meteor shower, a camping trip, and nothing was ever the same.',mods:{acc:2}},
    {id:'pact',n:'Made a Pact',track:'magic',adj:'Occult',fl:'Something old answered when you called. It will want a favor someday.',mods:{maxComp:2}},
    {id:'haunt',n:'Touched by a Ghost',track:'magic',adj:'Spectral',fl:'You died for ninety seconds. Something came back with you.',mods:{move:1}},
    {id:'grimoire',n:'The Forbidden Book',track:'magic',adj:'Arcane',fl:'You read the one book you were told never to open.',mods:{maxArc:2}}]},
  gift:{t:'The Power Awakens',cap:'Your power shows itself for the first time. What can you do that nobody else can?',opts:Object.keys(POWERS).map(id=>({id,n:POWERS[id].name,fl:O_POWFL[id],power:id}))},
  style:{t:'First Night Out',cap:'Your first patrol. A mugging in an alley, three thugs. How do you fight?',opts:[
    {id:'fists',n:'Fists First',role:'brawler',fl:'You learned to fight in parking lots and never stopped.',range:1,fx:'slash',mods:{str:2,maxHp:1}},
    {id:'hitrun',n:'Hit and Run',role:'skirmisher',fl:'In, out and gone before they turn around.',range:1,fx:'slash',mods:{move:1,eva:2}},
    {id:'flurry',n:'A Hundred Blows',role:'striker',fl:'Not hard hits. Just a lot of them.',range:1,fx:'slash',mods:{speed:1,str:-2}},
    {id:'blast',n:'Energy Blasts',role:'blaster',fl:'Point, glow, fire.',range:3,fx:'bolt',mods:{maxHp:-1}},
    {id:'trick',n:'Trick Shots',role:'marksman',fl:'Ricochets, bank shots and a coin off a gargoyle.',range:2,fx:'shot',mods:{acc:2}},
    {id:'roof',n:'From the Rooftops',role:'sniper',fl:'They never see where it came from.',range:4,fx:'shot',mods:{maxHp:-2,move:-1}}]},
  drive:{t:'Why You Keep Going',cap:'Blackharbor never thanks you. So what gets you back out there every night?',opts:[
    {id:'duty',n:'Somebody Has To',fl:'Nobody else was going to.',mods:{maxComp:2}},
    {id:'revenge',n:'They Took Everything',fl:'Every punch is for them.',mods:{str:2,maxComp:-1}},
    {id:'atone',n:'Making Up for Something',fl:'You did something terrible once. You are still paying.',mods:{maxHp:2}},
    {id:'rush',n:'For the Rush',fl:'Nothing else makes you feel this alive.',mods:{move:1,maxComp:-1}},
    {id:'legend',n:'Living Up to a Legend',fl:'Someone wore a mask before you. You will not let them down.',mods:{acc:2,maxComp:-1}}]},
  career:{t:'Their Own Series',cap:'This hero already has a book of their own. What kind of run has it been?',opts:[
    {id:'long',n:'Long-Running Title',fl:'Two hundred issues and counting.',lvl:1},
    {id:'mini',n:'Fan-Favorite Miniseries',fl:'Short, sharp and full of gadgets.',gear:1},
    {id:'team',n:'Team Book Mainstay',fl:'They have run a base before, and it shows.',hq:1}]},
  training:{t:'Years of Training',cap:'Their past issues shaped how their powers grew. Where did the extra training go?'},
  moves:{t:'Signature Moves',cap:'Every long-time reader knows their best tricks. Pick one upgrade for each level beyond the first.'},
  gear:{t:'What They Carry',cap:'They show up with their own kit. Pick from your unlocked blueprints. It is theirs to keep, free.'},
  hq:{t:'What They Bring to HQ',cap:'Joining the Blackharbor Guardians means bringing their resources too. What comes with them?'},
  mask:{t:'The Mask',cap:'Last panel. The costume, the name, the first time Blackharbor sees you.'},
  cover:{t:'Issue #1',cap:''}};
const oSteps=c=>c.mode==='xover'?['life','spark','gift','style','drive','career','training','moves','gear','hq','mask','cover']:['life','spark','gift','style','drive','mask','cover'];
const oOpt=(step,id)=>id&&ORIGIN[step].opts?ORIGIN[step].opts.find(o=>o.id===id):null;
const xArc=()=>arcOf(Math.min(S.issue,MAX_ISSUE));
const xoverUsed=()=>(S.xover||[]).includes(xArc());
const xoverOpen=()=>S.phase==='hq'&&((xArc()>=2&&!xoverUsed())||!!(S.cheat&&S.cheat.xover));
function oLevel(c){return c.mode==='xover'?xArc()+1+(c.picks.career==='long'?1:0):1}
const oGearMax=c=>c.picks.career==='mini'?2:1;
function oTrainOpts(c){const sp=oOpt('spark',c.picks.spark);if(!sp)return [];const m=sp.track,ex=oLevel(c)-1,others=Object.keys(TRACKS).filter(t=>t!==m);
  const o=[{id:'spec',n:`${TRACKS[m].name} Specialist`,fl:'Everything went into the power they started with.',split:{[m]:ex}}];
  others.forEach(t=>o.push({id:'x-'+t,n:`Cross-Trained in ${TRACKS[t].name}`,fl:`They picked up ${TRACKS[t].name.toLowerCase()} tricks along the way.`,split:{[m]:ex-Math.floor(ex/2),[t]:Math.floor(ex/2)}}));
  if(ex>=2)o.push({id:'all',n:'Jack of All Trades',fl:'A little of everything.',split:{[m]:ex-2,[others[0]]:1,[others[1]]:1}});return o}
function oRanks(c){const sp=oOpt('spark',c.picks.spark),r={tech:0,innate:0,magic:0};if(!sp){r.tech=1;return r}r[sp.track]=1;
  if(c.mode==='xover'){const t=oTrainOpts(c).find(o=>o.id===c.picks.training);if(t)for(const[k,n]of Object.entries(t.split))r[k]+=n}return r}
const canWearR=(r,g)=>Object.entries(GEAR[g].reqs).every(([t,n])=>r[t]>=n);
function oHqOpts(){const act=S.villains.filter(v=>v.status==='active').sort((a,b)=>b.level-a.level),top=act[0];
  const o=[{id:'tech',n:'Their Old Lair',fl:'Crates of salvaged hardware.',txt:'+4 tech.'},
    {id:'files',n:'Their Case Files',fl:'Years of notes on this city\'s worst.',txt:'+3 intel.'},
    {id:'fans',n:'A Loyal Fanbase',fl:'The city already loves them.',txt:'+2 public trust.'}];
  if(act.length)o.push({id:'trophy',n:'Trophy Room',fl:'Souvenirs from fights you never saw.',txt:`+2 salvage from each active villain (${act.map(v=>VILLAINS[v.key].salvage).join(', ')}).`});
  if(ALL_ITEMS.some(it=>!isUnlocked(it)))o.push({id:'notes',n:'Lab Notebooks',fl:'Designs nobody else has seen.',txt:'Unlock 2 random missing blueprints.'});
  Object.keys(FAC).filter(k=>isUnlocked('fac:'+k)&&!S.facilities.includes(k)).sort((a,b)=>Object.values(FAC[b].cost).reduce((x,y)=>x+y,0)-Object.values(FAC[a].cost).reduce((x,y)=>x+y,0)).slice(0,2)
    .forEach(k=>o.push({id:'pat-'+k,n:`A Patron Builds the ${FAC[k].name}`,fl:'Their billionaire backer wants in.',txt:`Builds the ${FAC[k].name} for free: ${FAC[k].txt}`}));
  return o}
const oHqMax=c=>Math.min(c.picks.career==='team'?2:1,oHqOpts().length);
function oBuild(c){const p=c.picks,why={},b={...O_TEMPLATE};
  const add=(src,mods)=>{for(const[k,v]of Object.entries(mods||{})){b[k]=(b[k]||0)+v;(why[k]=why[k]||[]).push([src,v])}};
  const life=oOpt('life',p.life),spark=oOpt('spark',p.spark),gift=oOpt('gift',p.gift),style=oOpt('style',p.style),drive=oOpt('drive',p.drive);
  [life,spark,style,drive].forEach(o=>o&&add(o.n,o.mods));
  if(style&&style.range>1)add(style.n,{range:style.range-1});
  for(const k in O_FLOOR)b[k]=Math.max(O_FLOOR[k],b[k]);
  const track=spark?spark.track:'tech',name=(c.name||'').trim()||'Unnamed hero';
  const role=spark&&style?`${spark.adj} ${style.role}`:style?style.role[0].toUpperCase()+style.role.slice(1):'Hero in the making';
  const base={name,role,track,col:c.col,fx:style?style.fx:'slash',glow:O_GLOW[track],...b,power:gift?gift.power:O_POW[track][0],succ:`${name} II`};
  if(life&&life.field)base.field=FIELD_AB[life.field];
  return {base,why,ranks:oRanks(c),level:oLevel(c)}}
function oValid(c,sid){const p=c.picks;
  if(['life','spark','gift','style','drive','career','training'].includes(sid))return !!p[sid];
  if(sid==='moves')return c.ups.length===oLevel(c)-1;
  if(sid==='hq')return c.hq.length===oHqMax(c);
  return true}
/* codenames: several patterns, with word pools flavored by the hero's discipline */
const O_NW={pre:['Night','Iron','Static','Crimson','Silver','Ghost','Storm','Ember','Quiet','Neon','Hollow','Rook','Velvet','Cinder','Black','Star','Moon','Thunder','Frost','Shadow','Steel','Wild','Red','Gold','Dusk','Dawn','Stone','Blood','Sky','Rust'],
  suf:['hawk','line','fist','shade','wire','fall','jack','spark','veil','watch','bolt','fang','moth','tide','wing','claw','strike','blade','fire','storm','light','wolf','heart','runner','breaker','sight','shot','fox','crow','lash'],
  title:['Captain','Doctor','Lady','Mister','Agent','Professor','Sister','Brother','Major','Kid','Madame','Sergeant'],
  noun:['Comet','Lantern','Sentinel','Raven','Phantom','Tempest','Vanguard','Paragon','Spectre','Nomad','Wraith','Harbinger','Gargoyle','Revenant','Beacon','Outrider','Monarch','Jackal','Viper','Cardinal'],
  adj:['Silent','Scarlet','Electric','Iron','Midnight','Atomic','Crimson','Golden','Hollow','Savage','Silver','Shattered','Burning','Masked','Wandering','Last'],
  solo:['Nocturne','Vesper','Quicksilver','Kestrel','Halcyon','Obsidian','Sable','Torrent','Bramble','Vex','Nightjar','Lodestar','Marrow','Echo','Riot','Gloam','Solstice','Paladin','Tinder','Mercury'],
  tech:{pre:['Volt','Circuit','Chrome','Gear','Pulse','Servo','Laser','Turbo','Nano','Static'],noun:['Mainframe','Gadget','Dynamo','Override','Glitch','Rocket','Firewall','Piston']},
  innate:{pre:['Feral','Titan','Primal','Granite','Savage','Brute','Swift','Hyper','Mega','Wild'],noun:['Juggernaut','Mantis','Grizzly','Colossus','Rhino','Panther','Hornet','Behemoth']},
  magic:{pre:['Hex','Rune','Wraith','Mystic','Spell','Grim','Astral','Soul','Witch','Omen'],noun:['Warlock','Sorceress','Oracle','Banshee','Conjurer','Hexer','Seer','Alchemist']}};
function oGenName(t){const W=O_NW,D=W[t]||{pre:[],noun:[]},pre=[...W.pre,...D.pre,...D.pre],noun=[...W.noun,...D.noun,...D.noun];
  switch(rnd(6)){case 1:case 2:return pick(pre)+pick(W.suf);case 3:return `${pick(W.title)} ${pick(noun)}`;case 4:return `The ${pick(noun)}`;case 5:return `${pick(W.adj)} ${pick(noun)}`;default:return pick(W.solo)}}
function oRandName(t){for(let i=0;i<60;i++){const n=oGenName(t);if(n.length<=18&&!S.heroes.some(h=>h.name===n))return n}return 'Nightwatcher'}
const oTrack=c=>{const sp=oOpt('spark',c.picks.spark);return sp?sp.track:null};
function oSuggest(c){const out=[];for(let i=0;i<40&&out.length<6;i++){const n=oRandName(oTrack(c));if(!out.includes(n))out.push(n)}return out}
const oClean=s=>String(s).replace(/[^A-Za-z0-9 .'\-]/g,'').slice(0,18);
function oStart(mode){S.cre={mode,step:0,picks:{},name:'',col:pick(O_COLS),ups:[],gear:[],hq:[]};S.view='create'}
function oPick(sid,id){const c=S.cre;c.picks[sid]=id;
  if(sid==='spark'){const sp=oOpt('spark',id);if(c.picks.gift&&!O_POW[sp.track].includes(c.picks.gift))delete c.picks.gift;delete c.picks.training;c.ups=[];c.gear=[]}
  if(sid==='career'){delete c.picks.training;c.ups=[];c.gear=[];c.hq=[]}
  if(sid==='training')c.gear=[];
  if(sid==='style')c.ups=c.ups.filter(u=>u!=='range'||(oOpt('style',id).range>1))}
function oFinish(){const c=S.cre;if(!c.name.trim())c.name=oRandName(oTrack(c));const r=oBuild(c),xo=c.mode==='xover',L=[];
  const h=newHero('custom',r.base.name,r.base);
  h.origin=['life','spark','style','drive'].map(s=>oOpt(s,c.picks[s]).n);
  if(xo){h.est=true;h.ranks=r.ranks;h.upgrades=c.ups.slice();c.gear.forEach(g=>putGear(h,g));
    for(const id of c.hq){
      if(id==='tech'){S.tech+=4;L.push('+4 tech')}
      else if(id==='files'){S.intel+=3;L.push('+3 intel')}
      else if(id==='fans'){S.trust+=2;L.push('+2 trust')}
      else if(id==='trophy'){S.villains.filter(v=>v.status==='active').forEach(v=>S.salvage[v.key]+=2);L.push('+2 salvage from each active villain')}
      else if(id==='notes'){const a=unlockRandom(),b=unlockRandom();L.push(`new blueprints: ${[a,b].filter(Boolean).join(', ')}`)}
      else if(id.startsWith('pat-')){const k=id.slice(4);if(!S.facilities.includes(k))S.facilities.push(k);L.push(`a free ${FAC[k].name}`)}}
    if(S.cheat&&S.cheat.xover)S.cheat.xover=false;else{S.xover=S.xover||[];S.xover.push(xArc())}}
  recruitXp(h);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp');S.heroes.push(h);if(S.party.length<4)S.party.push(h.id);revealStartingVillains();
  S.flash=`${h.name} joins the Blackharbor Guardians${xo?` at level ${lvlOf(h)}`:''}${L.length?`, bringing ${L.join('; ')}`:''}.${S.party.includes(h.id)?' Added to the party.':' Waiting on the bench.'}`;
  S.ui=S.ui||{};S.ui['h-'+h.id]=true;S.cre=null;S.view='hq'}
function recruitQuick(cls){if(roster().length>=ROSTER_MAX||roster().some(h=>h.cls===cls))return;const h=newHero(cls);recruitXp(h);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp');S.heroes.push(h);if(S.party.length<4)S.party.push(h.id);revealStartingVillains()}
/* recruits who join after issue #1 start with 1 XP per issue completed */
const recruitXpN=(x=0)=>Math.max(0,Math.min((S.issue||1)+x,MAX_ISSUE+1)-1);
const recruitXpTxt=()=>recruitXpN()?`<p class="small" style="margin:0" data-tip="kw:xp">Joins with <b>${recruitXpN()} XP</b>, 1 for each issue completed.</p>`:'';
function recruitXp(h,x=0){h.xp+=recruitXpN(x);while(h.xp>=xpNeed(h)){h.xp-=xpNeed(h);h.pendingUp++}}
function newHero(cls,name,base){const b=base||HERO_BASE[cls];const ranks={tech:0,innate:0,magic:0};ranks[b.track]=1;
  return {pouch:[],id:cls+Math.random().toString(36).slice(2,7),cls,name:name||b.name,hp:b.maxHp,comp:b.maxComp,xp:0,ranks,trackPick:null,pendingUp:0,upChoices:null,upgrades:[],gear:{},injuries:[],cd:0,retired:false,...(base?{base:{...base}}:{})}}
