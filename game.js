
/* ============ DATA ============ */
let N = 9;


const UPG = {
  hp:{name:'+2 Max Health',mods:{maxHp:2}}, acc:{name:'+2 Accuracy',mods:{acc:2}}, str:{name:'+2 Strength',mods:{str:2}},
  speed:{name:'+1 Attack Die',mods:{speed:1}}, move:{name:'+1 Movement',mods:{move:1}}, eva:{name:'+2 Evasion',mods:{eva:2}},
  comp:{name:'+2 Max Composure',mods:{maxComp:2}}, range:{name:'+1 Range',mods:{range:1}},
};
const INJ = {
  knee:{name:'Wrecked Knee',mods:{move:-1}}, eye:{name:'Damaged Eye',mods:{acc:-2}}, ribs:{name:'Cracked Ribs',mods:{maxHp:-2}},
  nerve:{name:'Nerve Damage',mods:{eva:-2}}, rattled:{name:'Rattled',mods:{maxComp:-1}},
};

const TRACKS = {
  tech:{name:'Tech',res:'Power',abbr:'PWR',perk:'+2 accuracy',mods:{acc:2}},
  innate:{name:'Innate',res:'Innate rank',abbr:'INN',perk:'+2 max health',mods:{maxHp:2}},
  magic:{name:'Magic',res:'Arcana',abbr:'ARC',perk:'+1 max composure',mods:{maxComp:1}},
};
const SLOTS = {head:'Head',body:'Body',arms:'Arms',legs:'Legs',acc:'Accessory'};
const MODN = {acc:'accuracy',str:'strength',eva:'evasion',move:'movement',speed:'attack die',maxHp:'max health',maxComp:'max composure',range:'range'};
/* ab.act = uses the hero's action; ab.mode = needs a target on the board */
/* Version 127 (Tyler): GEAR, VILLAINS, SETS, START_UNLOCK, ARC_UNLOCK, DEFEAT_UNLOCK, ALL_ITEMS and MID_UNLOCK now hold their final values where they are declared.
   They used to be built up by about 140 patch statements spread through this script; the Version comments that explained those patches are kept where they were.
   Change the data in place rather than adding new patch blocks. tools/q.js prints any of it (see tools/README.md). */

/* Hybrid and capstone gear: every discipline mix up to 3 total ranks has items for at least 2 slots.
   Since v20 (ranks cap at 5) every discipline also has gear at rank 4 in at least 3 slots and at rank 5 in at least 2. */
/* Ouroboros gear, crafted from Scales */
/* Lodestone gear (Lodestones), Nocturne gear (Umbra), Murmur gear (Chitin) */
/* Payload gear (Fuses) */
/* Gridlock gear (Lenses) */
/* balance pass: lift items that were weak for their requirement, trim the outliers */
/* Discipline rework (v20). The three disciplines run on different engines, and each caps at rank 5.
   Tech: abilities spend Power. Max Power = Tech rank + 1 per Tech item worn + bonuses (Version 124); it starts full and slowly recharges, 1 per round (+ recharge bonuses).
   Magic: spells spend Arcana. Max Arcana = Magic rank + the Magic rank each worn item requires + bonuses (Version 125); it starts full each fight and does not refill on its own.
   Innate: abilities are free but require Innate rank (Innate rank + bonuses) of at least ab.min, and a hero fires only one per round.
   ab.c = cost (Tech/Magic), ab.min = Innate rank required (Innate). ab.fx holds the effects. A value can be [a,b] = a + floor(b × Innate rank).
   ab.mode: 'ally' (pick yourself or an ally within r), 'tele' (move to an empty hex within r, then fx), 'strike' (an attack at range).
   Every Tech item has an ability. Every Magic weapon (Weapon slot) has a spell; other Magic items mostly carry passives instead. */
SLOTS.arms='Weapon';
Object.assign(MODN,{maxPwr:'max Power',pwrRegen:'Power recharge',maxArc:'max Arcana',pot:'Innate rank',arcWound:'Arcana when an attack tears a page',innUses:'Innate ability per round'});
/* Version 22: sixth slot (Belt), out-of-combat gear and one-use consumables carried in a 2-item pouch */
SLOTS.belt='Belt';
const POUCH_MAX=2;
const NEW_GEAR_V22=['grapbelt','wiretap','bandolier','satchel','trophy','champ','journal','sash','censer','c_smoke','c_flash','c_frag','c_batt','c_stim','c_salts','c_adren','c_charm','c_vial'];
const slotN=s=>GSLOTS[s]||SLOTS[s]||(s==='pouch'?'Pouch':s);
const pouchOf=h=>h.pouch||(h.pouch=[]);
const wearOK=(h,g)=>canWear(h,g)&&(!GEAR[g].cons||pouchOf(h).length<POUCH_MAX);
/* Version 59 movement pass (Tyler): only a few second moves and second actions remain, most move powers add bonus movement instead,
   Magic owns most teleports (Tech keeps two), Tech and Innate have the leaps, and some Innate gear trades its ability for stronger stats.
   fx.boost = bonus movement on the hero's next move (u.boost), fx.jump makes that move a jump; gear.jumps = every move is a jump. */
/* Version 61 (Tyler): every villain set has 5 pieces */
const NEW_GEAR_V61=['rebarbelt','sunamulet','magbuckle','owlpend','compeyes','detcord','focuscrystal'];
const NEW_GEAR_V59=['surveyor','stilts','corona','flaregaunt','serpeye'];
/* Version 62 (Tyler): two Hand slots and two Accessory slots. Two-handed weapons (gear.two) fill both hands. Paired Tech and Innate
   weapons (gear.pair) get a bonus when both hands hold the same one. New effects: Pain into Power (gear.pain), Relentless (gear.relent),
   Lifeline rescue refunds (gear.rescue), Riposte (gear.riposte or fx.riposte), auras (gear.aura), Blind, deck tricks (Scry, Bury, Excise,
   Scramble), deployable cover (mode 'cover') and bonus salvage (field 'strip'). Abilities that copied each other were reworked. */
for(const k of Object.keys(SLOTS))delete SLOTS[k];
Object.assign(SLOTS,{head:'Head',body:'Body',arms:'Main Hand',arms2:'Off Hand',legs:'Legs',acc:'Accessory',acc2:'Accessory',belt:'Belt'});
const GSLOTS={head:'Head',body:'Body',arms:'Weapon',legs:'Legs',acc:'Accessory',belt:'Belt'};
const SLOT_KEYS={arms:['arms','arms2'],acc:['acc','acc2']};
const NEW_GEAR_V62=['oracle','shotgun','maul','quakehammer','martyr','dynamo','bloodhound','locket','hooks','c_chaff'];
/* paired weapons are single pieces now, so their names lose the plural */
/* Version 99 (Tyler): Lock-on and Callout cost 2 Power; the strongest Tech abilities cost 1 more */
const NEW_GEAR_V20=['cell','fusion','lance','gravboots','cmdvisor','arccore','hide','meteor','senses','apex','quakelegs','runeblade','wand','soulreaver','starfall','font','robes','circlet','stone'];
/* Magic non-weapons lose their old abilities and carry Arcana passives instead */
/* Version 59 balance pass. Innate gear that lost its ability gets stronger stats. Items that need two or three disciplines rise to match
   their wider requirements, and Magic passives rise to match Tech and Innate items of the same rank. */
/* the classic lineup each gets +1 to their discipline's engine */
const POOL_MOD={tech:'maxPwr',innate:'maxHp',magic:'maxArc'},POOL_BONUS_TXT={tech:'+1 max Power',innate:'+2 max health',magic:'+1 max Arcana'};
for(const k in HERO_BASE){const b=HERO_BASE[k],m=POOL_MOD[b.track];b[m]=(b[m]||0)+(m==='maxHp'?2:1)}
/* Version 61 (Tyler): gear costs only salvage, and higher ranks cost more. Set pieces cost their villain's salvage, everything else any salvage.
   Consumables are skipped here; Version 62 below (CONS_COST) prices them at 1 or 2 any salvage. */
/* Version 62 stat pass (Tyler): attack stats (accuracy, Strength, dice, range) live mostly on weapons. Weapon and Body gear is the
   strongest and costs the most, Head and Legs come next, then Accessories and Belts (a hero now wears two Accessories).
   Two-handed weapons are about 1.6 times a one-handed weapon of the same rank. */
/* Paired: both hands hold the same weapon. fx adds to the weapon's ability, mods add once on top of the two copies' own stats */
/* Version 100 (Tyler): the second copy of a Paired weapon adds only the pair bonus, not its own stats or set count, so pair bonuses are bigger */
/* Version 77 (Tyler): bonus dice are rare. Only a few signature abilities add a die (never more than +1), the rest add Strength or accuracy,
   strikes roll 4 dice, and anything that adds a die to several attacks is conditional and once per fight. */
/* auras help the wearer and allies within 1 hex (Version 63: the wearer counts too, and some auras do more than stats) */
/* Version 65 (Tyler): auras reach 2 hexes, and each effect aura only works under a condition */
const AURA_R=2;
const AURA_FX={mend:{n:'Mending Light',txt:'at the start of each round, regain 1 health while at half health or less'},calm:{n:'Calming Smoke',txt:'at the start of each round, regain 1 composure while at half composure or less'},
  charge:{n:'Power Relay',txt:'recharge 1 more Power each round while at 1 Power or less'},brace:{n:'Shield Wall',txt:'take 1 less damage from any hit of 3 or more'},
  luck:{n:'Fortune',txt:'the first henchman attack on you each round rolls twice and keeps the lower die (villains are not affected)'}};
/* Version 115 (Tyler's gear pass) */
/* cost by slot tier and total rank; consumables cost any salvage too */
const slotTier=g=>g.two?'two':g.slot==='arms'||g.slot==='body'?'A':g.slot==='head'||g.slot==='legs'?'B':'C';
/* Version 59 villain sets: gear crafted from one villain's salvage forms a set. Wearing SET_N or more pieces turns on its bonus.
   mods add to stat(); the rest is wired in at round start (cantor, serpent, helios, lode), damageHero (architect), heroAttack (noct),
   henchAct (swarm), blowBombs (bomber), fireBeams and beamStep (grid). */
const SET_N=4; /* Version 124 (Tyler): 4 pieces, each set has 7 */

const setCount=(h,k)=>wornGear(h).filter(g=>GEAR[g]&&GEAR[g].set===k).length;
const setsOn=h=>{const c={};for(const g of wornGear(h)){const s=GEAR[g]&&GEAR[g].set;if(s)c[s]=(c[s]||0)+1}return Object.keys(c).filter(k=>c[k]>=SET_N)};
const setOn=(h,k)=>!!h&&setCount(h,k)>=SET_N;
const jumpsAll=h=>!!h&&Object.values(h.gear).some(g=>GEAR[g]&&GEAR[g].jumps);
const reqTxt=g=>Object.entries(g.reqs).map(([t,n])=>`${TRACKS[t].name} ${n}`).join(' + ');
const reqChips=g=>Object.entries(g.reqs).map(([t,n])=>`<span class="disc t-${t}">${TRACKS[t].name} ${n}</span>`).join('');
const isHybrid=g=>Object.keys(g.reqs).length>1;
const modsTxt=m=>Object.entries(m).map(([k,v])=>`${v>0?'+':''}${v} ${MODN[k]}`).join(', ');
const signedBonus=n=>n<0?'−'+(-n):'+'+n;
const RES_NAME = {any:'any salvage',tech:'Tech',intel:'Intel',gallows:'Coils',quarry:'Shards',cantor:'Ledgers',architect:'Rebar',helios:'Sunstone',serpent:'Scales',lode:'Lodestones',noct:'Umbra',swarm:'Chitin',bomber:'Fuses',grid:'Lenses',mole:'Grit'};
/* Each villain: 6 base pages plus an ordered list of advanced pages. A level-L villain owns the base pages
   plus 2L+1 advanced ones (plus deckBonus, a per-villain difficulty knob); each level-up adds the next 2.
   Between arcs, the 3 oldest lowest-mark pages are upgraded. */

/* Intel: intro splash, style hints and signature hit reactions shuffled into each villain's hit deck */

const rxOf=(k,id)=>VINTEL[k].react.find(r=>r.id===id);
/* Signature Moves: the big, dangerous pages. [shout before it is played, splash when it is torn out] */
/* crush: damage dealt to heroes a large villain shoves out of its path while moving */
/* footprints on the hex board */
const SHAPE_N={one:'Size 1 · Human-sized · 1 hex',tri:'Size 2 · Large · 3 hexes',diamond:'Size 3 · Large · 4 hexes',big:'Size 4 · Huge · 7 hexes',serpent:'Size 4 · Serpent · 5 hexes and growing',swarm:'Size 1 · Swarm · three 1-hex bodies'};
/* size class for effects that care how big a villain is (Ground Quake): steps up with hex count */
const VSIZE={one:1,swarm:1,tri:2,diamond:3,serpent:4,big:4};
/* Signature reactions live on a playbook page: tearing that page removes the reaction from the hit deck. [page, splash] */
const RXSRC={gallows:{cap:['field','You overloaded his capacitor bank!'],bdrone:['drones','You smashed the drone bay!'],proto:['lash','You ripped the plating off his Tesla rig!']},
  quarry:{skin:['roar','You shattered her granite carapace!'],shrug:['wreck','You knocked the loose rubble off her shoulders!'],crumble:['slam','You split her crumbling hide wide open!']},
  cantor:{gaze:['whisper','You broke his mesmer gaze!'],bodyg:['guns','You scattered his bodyguards!'],smoke:['van','You confiscated his smoke bombs!']},
  architect:{plate:['walls','You knocked out her load-bearing plates!'],trap:['rivet','You jammed her spring traps!'],scaff:['cons','You toppled her scaffolding rig!']},
  helios:{corona:['corona','You smothered his corona!'],glare:['blind','You shattered his focusing lens!'],shell:['heat','You cracked his plasma shell!']},
  serpent:{venom:['bite','You drained its venom sacs!'],tail:['coil','You pinned its tail to the floor!'],gorged:['gulp','You cut open its gorged belly!']},
  lode:{yank:['attract','You shorted out his magnetic core!'],plate:['spike','You stripped off his iron plating!'],repulse:['field','You smashed his repulsor coils!']},
  noct:{riposte:['knife','You disarmed her!'],veil:['fade','You pinned her shadow to the floor!'],feint:['stars','You read every one of her feints!']},
  swarm:{hive:['brood','You crushed the queen!'],sting:['sting','You swatted the stinger!'],shell:['bite','You cracked the shell open!']},
  bomber:{upover:['over','She has nowhere left to spring from!'],bando:['lit','You cut the bombs off her sides!'],short:['tick','You stopped her stopwatch!']},
  grid:{mirror:['red','You smashed his reflector visor!'],lens:['sight','You cracked his lens array!'],flash:['lattice','You burned out his afterimage capacitors!']}};
for(const k in RXSRC)for(const id in RXSRC[k]){const r=rxOf(k,id);[r.src,r.brk]=RXSRC[k][id]}
const ROMAN=['','II','III','IV','V','VI','VII'];
const TGN={nearest:'nearest',weakest:'most injured',farthest:'farthest'};
/* Version 119 (Tyler): every charge covers more ground or more heroes, and staggering one takes as many torn pages as the villain's level */
const ZONEN={blast:'every hex within 2 of the nearest hero',blast2:'the three nearest heroes and every hex around them',line:'straight lines of hexes through the two farthest heroes',nova:'every hex within 3 of the villain',mark:'the two most injured heroes and every hex around them',focus:'the most injured hero, every hex around them, and every hex in a straight line with them in all 6 directions'};
const chargeNeed=v=>v.level+1; /* Version 120 (Tyler): level + 1 pages to stagger */
function applyMk(c,mk){c={...c};if(!mk)return c;
  if(c.dmg!=null)c.dmg+=mk;if(c.amt!=null)c.amt+=mk;if(c.k!=null)c.k+=Math.ceil(mk/2);if(c.mv)c.mv+=mk;if(c.rng>1)c.rng+=mk;
  if(c.r!=null&&(c.t!=='hazard'||c.grow))c.r+=Math.floor(mk/2);if(c.len)c.len+=mk;if(c.ttl)c.ttl+=Math.floor(mk/2);if(c.cnt)c.cnt+=Math.floor(mk/2);
  if(c.t==='reanimate')c.heal=1+Math.floor(mk/2);return c}
function cardText(c,vk){const hn=VILLAINS[vk].hench.name.toLowerCase();
  const area=(c.radius||1)>1?`${1+3*c.radius*(c.radius+1)} hexes (radius ${c.radius})`:'7 hexes (radius 1)';
  switch(c.t){
    case 'strike':return (c.mv?`Moves ${c.mv} toward the ${TGN[c.tgt]} hero, then hits at range ${c.rng} for ${c.dmg}.`:`Hits the ${TGN[c.tgt]} hero from up to ${c.rng} away for ${c.dmg}.`)+(c.col?' Civilians next to the target are harmed.':'')+(c.comp?` The target loses ${c.comp} composure.`:'');
    case 'burrow':return `Dives underground and bursts up next to the farthest hero, then hits them for ${c.dmg}. Leaves rubble where it went down.`;
    case 'multi':return `Hits up to ${c.cnt} heroes within ${c.rng} for ${c.dmg} each.`;
    case 'sweep':return `Everything within ${c.r} takes ${c.dmg}. Civilians caught are harmed.`;
    case 'rampage':return `Moves ${c.mv} toward the nearest hero, then everything adjacent takes ${c.dmg}.`;
    case 'summon':return `${c.k} ${hn}s join the fight.`;
    case 'endanger':return `Moves 2 toward the nearest civilian and harms them from up to 3 away. A hero next to them ${c.comp?`loses ${c.comp} Composure`:`takes ${c.dmg} damage`} instead.`;
    case 'taunt':return `Heroes within ${c.r} lose ${c.amt} composure.`;
    case 'henchvolley':return 'Every hired gun already within range 2 of a hero immediately fires one extra shot without moving. Elite henchmen do not join the volley.';
    case 'vanish':return 'Disappears and reappears far from the heroes.';
    case 'reanimate':{const n=c.heal||1;return `${n} torn page${n>1?'s return':' returns'} to the playbook.`}
    case 'puppet':return `The hero with the least composure loses ${c.amt||1} more and cannot move next round.`;
    case 'walls':return `${c.retreat?`Backs ${c.retreat} hexes away from the nearest hero, then r`:'R'}aises ${c.lines>1?`${c.lines} walls`:'a wall'} of ${c.len} hexes between itself and the heroes. Walls crumble after ${c.ttl} rounds.`;
    case 'hazard':if(c.grow){const who=c.cnt>1?`each of the ${c.cnt} nearest heroes`:'the nearest hero';return `${c.r?'The floor caves in under':'A one-hex sinkhole opens under'} ${who}${c.r?` and every hex within ${c.r} of them`:''} for ${c.ttl} villain turns. Anyone standing in one when the villain acts takes ${c.dmg}.`}return `The floor around ${c.cnt>1?`the ${c.cnt} nearest heroes`:'the nearest hero'} turns molten for ${c.ttl} villain turns. Anyone standing on it when the villain acts takes ${c.dmg}.`;
    case 'cage':return `Fills every open hex around the nearest hero with walls for ${c.ttl} rounds.`;
    case 'shrapnel':return `Detonates every wall and rubble pile within ${c.r}. Heroes next to one take ${c.dmg}. Walls are destroyed.`;
    case 'fortify':return `Rings itself with walls for ${c.ttl} rounds and recovers 1 torn page.`;
    case 'swallow':return `Slithers ${c.mv} toward the nearest civilian or ${hn} and swallows ${c.cnt>1?`up to ${c.cnt}`:'one'} whole, growing one hex longer for the rest of the fight. A hero next to a civilian takes ${c.dmg} instead. With nothing to eat, it bites the nearest hero for ${c.dmg}.`;
    case 'pull':return `Drags every hero within ${c.r} up to ${c.mv} hexes toward itself, then everything adjacent takes ${c.dmg}.`;
    case 'repel':return `Flings every hero within ${c.r} up to ${c.mv} hexes away. A hero who slams into a wall, rubble, the edge or another hero before flying the full distance takes ${c.dmg}.`;
    case 'fade':return `Melts into the shadows and reappears a few hexes from the nearest hero. Her facing is hidden again.${c.amt?` The lights die and every hero loses ${c.amt} composure.`:''}`;
    case 'converge':return `Every body of the swarm flies up to ${c.mv} hexes toward the nearest hero. That hero takes ${c.dmg} for each body next to them.`;
    case 'scatter':return `The swarm bursts apart. Each body reappears next to a different hero and strikes them for ${c.dmg}.`;
    case 'leap':return `Vaults over ${c.cnt>1?`up to ${c.cnt} heroes, one after another,`:'the nearest hero'} within ${c.mv}, sailing over anything in between, and lands on the far side facing away.${c.fuse?` Leaves a bomb on ${c.cnt>1?'each':'that'} hero's hex: ${c.dmg} damage over ${area}, exploding at the start of the next villain turn.`:''} A hero with no open hex behind them can't be jumped.`;
    case 'bomb':return `Throws ${c.cnt>1?`${c.cnt} bombs, one at each of the ${c.cnt} ${TGN[c.tgt]} heroes`:`a bomb at the ${TGN[c.tgt]} hero`} within ${c.rng}. ${c.cnt>1?'Each':'It'} explodes at the start of the next villain turn for ${c.dmg} damage across ${area}.`;
    case 'swapbomb':return `Swaps hexes with one of her henchmen, leaving a 7-hex bomb (radius 1) where she stood. The bomb deals ${c.dmg} damage at the start of the next villain turn. No henchman, no swap.`;
    case 'airburst':return `Leaps to the middle of the room and charges up. On her next turn she fires instead of playing a page: ${c.dmg} damage to every hero and civilian within 3 of her. Tear pages equal to her level + 1 before then to stagger it.`;
    case 'beam':{const tail=` Each beam runs to the edge, stops at the first hero it hits and knocks them back ${c.dmg} hex${c.dmg>1?'es':''}.`+(c.ttl>1?` The beams stay lit for ${c.ttl} turns.`:'');
      switch(c.pat){case 'star':return `Fires a beam in all 6 directions for ${c.dmg}.`+tail;
        case 'fan':return `Turns to the nearest hero and fires 3 beams from its front for ${c.dmg}.`+tail;
        case 'aim':return `Turns and fires a beam at ${c.cnt>1?`each of the ${c.cnt} ${TGN[c.tgt]} heroes`:`the ${TGN[c.tgt]} hero`} for ${c.dmg}. A hero who isn't in a straight line with it may be missed.`+tail;
        case 'sweep':return `Fires a beam ahead, then turns and fires again, ${c.cnt} times in all, for ${c.dmg} each.`+tail;
        case 'prism':return `Every ${hn} fires a beam at its nearest hero for ${c.dmg}.`+tail}return ''}
    case 'charge':return `Charges up and marks ${ZONEN[c.zone]}. On its next turn it fires instead of playing a page: ${c.dmg} damage to every hero and civilian in the marked hexes. Tear pages equal to its level + 1 before then to stagger it.`;
  }return ''}
/* the villain's own movement runs one hex further than the table says (Tyler, V76); pull/repel distances are how far heroes are dragged, so they stay */
const MV_UP=['strike','rampage','swallow','converge','leap'];
function buildCard(vk,e,level=1){const base=VILLAINS[vk].cards[e.id],c=applyMk(base,e.mk||0);c.id=e.id;c.mk=e.mk||0;c.n=base.n+(c.mk?' '+ROMAN[c.mk]:'');
  if(vk==='bomber'&&['leap','bomb','swapbomb'].includes(c.t)){c.fuse=c.fuse?1:0;c.radius=c.bigAt&&level>=c.bigAt?2:1}
  if(c.mv>0&&MV_UP.includes(c.t)&&!VILLAINS[vk].rooted)c.mv++;c.txt=cardText(c,vk);
  if(VILLAINS[vk].shape==='serpent'&&(c.t==='sweep'||c.t==='rampage'))c.txt+=' Reaches out from every hex of its body.';
  if(VILLAINS[vk].shape==='swarm'&&(c.t==='sweep'||c.t==='taunt'||c.t==='multi'))c.txt+=' Reaches out from every body of the swarm.';
  if(c.bombx)c.txt+=' Heroes standing within 1 of a bomb lose 1 more.';
  if(c.zone==='mark')c.txt+=' Her facing is revealed while she lines up the kill.';
  if((c.t==='strike'||c.t==='rampage')&&c.mv&&(VILLAINS[vk].shape==='serpent'||(SHAPES[VILLAINS[vk].shape]||[0]).length>1))c.txt+=c.crush?` Heroes in its path are shoved aside and take ${c.crush}.`:' Heroes in its path are shoved aside.';
  c.uid=Math.random().toString(36).slice(2,9);return c}
const VCAP=8;
function makeVillain(k,level){const vs={key:k,level:1,scheme:0,status:'active',deck:VILLAINS[k].base.map(id=>({id,mk:0})),advIdx:0,beaten:0};
  addAdv(vs,3+(VILLAINS[k].deckBonus||0));for(let l=1;l<Math.min(level,VCAP);l++)levelUpVillain(vs);return vs}
/* playbook size a villain should own at its level */
const deckSize=vs=>VILLAINS[vs.key].base.length+3+(VILLAINS[vs.key].deckBonus||0)+3*(Math.min(vs.level,VCAP)-1); /* Version 123 (Tyler): +3 pages per level again */
function addAdv(vs,n){const adv=VILLAINS[vs.key].adv,out=[];for(let i=0;i<n;i++){const id=adv[vs.advIdx%adv.length],mk=Math.floor(vs.advIdx/adv.length);vs.deck.push({id,mk});vs.advIdx++;out.push(buildCard(vs.key,{id,mk}).n)}return out}
function levelUpVillain(vs){if(vs.level>=VCAP)return [];vs.level++;return addAdv(vs,3)}
function upgradeVillain(vs,n=3){const idx=vs.deck.map((e,i)=>i).sort((a,b)=>vs.deck[a].mk-vs.deck[b].mk||a-b).slice(0,n);
  return idx.map(i=>{const before=buildCard(vs.key,vs.deck[i]).n;vs.deck[i].mk++;return `${before} → ${buildCard(vs.key,vs.deck[i]).n}`})}
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

/* ============ HELPERS ============ */
const rnd=n=>1+Math.floor(Math.random()*n), d20=()=>{const q=typeof S!=='undefined'&&S&&S.tut&&S.tut.dq;return q&&q.length?q.shift():rnd(20)}; /* Version 133: scripted tutorial rolls come first */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='blackharbor-preview-v4';
let S;

/* ============ ORIGIN STORIES (hero creation) ============ */
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
  premonition:{id:'premonition',n:'Premonition',txt:"While in the party, at the start of each issue, reveal 2 unseen pages from free villains' playbooks and gain 1 intel. Two heroes with it do not stack."}};
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
  if(act.length)o.push({id:'trophy',n:'Trophy Room',fl:'Souvenirs from fights you never saw.',txt:`+2 salvage from each free villain (${act.map(v=>VILLAINS[v.key].salvage).join(', ')}).`});
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
      else if(id==='trophy'){S.villains.filter(v=>v.status==='active').forEach(v=>S.salvage[v.key]+=2);L.push('+2 salvage from each free villain')}
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
const lvlOf=h=>h.ranks.tech+h.ranks.innate+h.ranks.magic;
const RANK_MAX=5;
const reactorOn=()=>!!(S&&S.facilities&&S.facilities.includes('reactor'));
/* Version 124 (Tyler): no level bonus. Max Power = Tech rank + 1 per Tech item worn + bonuses; max Arcana = Magic rank + the Magic rank each worn item requires + bonuses (Tyler, Version 125) */
const gearPoolTxt=g=>{if(g.cons)return '';const o=[];if(g.type==='tech')o.push('+1 max Power');if(g.reqs&&g.reqs.magic)o.push(`+${g.reqs.magic} max Arcana`);return o.length?o.join(' and ')+' while worn':''};
const techGearN=h=>wornGear(h).filter(g=>GEAR[g]&&GEAR[g].type==='tech').length;
const magicGearA=h=>wornGear(h).reduce((s,g)=>s+((GEAR[g]&&GEAR[g].reqs&&GEAR[g].reqs.magic)||0),0);
const pwrMax=h=>h.ranks.tech?h.ranks.tech+techGearN(h)+stat(h,'maxPwr')+(reactorOn()?3:0):0;
const arcMax=h=>h.ranks.magic?h.ranks.magic+magicGearA(h)+stat(h,'maxArc')+(reactorOn()?1:0):0;
const pwrRegen=h=>1+stat(h,'pwrRegen');
/* Version 123 (Tyler): Innate rank is gone; Innate abilities use the Innate rank itself */
const potOf=h=>h.ranks.innate||0;
const innUses=h=>1+stat(h,'innUses');
const resMax=(h,t)=>t==='tech'?pwrMax(h):t==='magic'?arcMax(h):0;
const canWear=(h,g)=>Object.entries(GEAR[g].reqs).every(([t,n])=>h.ranks[t]>=n);
/* a value is a number, or [a,b,c] = a + floor(b × Innate rank + c); c is optional, so [0,0.5,0.5] is half Innate rank rounded up */
const abV=(x,P)=>Array.isArray(x)?Math.max(0,x[0]+Math.floor(x[1]*Math.min(RANK_MAX,P||0)+(x[2]||0)+1e-9)):x;
function abF(x,P,min){if(!Array.isArray(x))return String(x);if(P!=null)return String(abV(x,P));const[a,b]=x;
  if(Number.isInteger(b))return b<0?`${a} − Innate rank`:`${a?a+' + ':''}${b===1?'':b+' × '}Innate rank`;
  return String(abV(x,min||1))}
/* for values that only step up at some Innate rank levels: "2 at Innate rank 4+, 3 at 6+" */
function abSteps(x,min){if(!Array.isArray(x)||Number.isInteger(x[1]))return '';const o=[];let prev=abV(x,min||1);
  for(let p=(min||1)+1;p<=RANK_MAX;p++){const v=abV(x,p);if(v!==prev){o.push(o.length?`${v} at ${p}+`:`${v} at Innate rank ${p}+`);prev=v}}return o.join(', ')}
const abCost=(g,short)=>g.cons?(short?'ONCE':'single use, free action'):g.type==='innate'?(short?`REQ INN ${g.ab.min}`:`requires Innate rank ${g.ab.min}+`):`${g.ab.c} ${short?TRACKS[g.type].abbr:TRACKS[g.type].res}`;
function abTxt(a,P){const f=a.fx||{},L=[];let sx=[];
  const v=x=>{if(P==null){const st=abSteps(x,a.min);if(st)sx.push(st)}return abF(x,P,a.min)};
  const pl=(x,o,m)=>{const t=v(x);return `${t} ${t==='1'?o:m}`};
  const push=t=>{L.push(t.replace(/\.$/,'')+(sx.length?` (${sx.join('; ')})`:'')+'.');sx=[]};
  if(a.act)push('Uses your action.');
  if(a.mode==='ally')push(`Pick yourself or an ally within ${a.r===1?'1 hex':`range ${v(a.r)}`}.`);
  if(a.mode==='tele')push(`${a.leap?'Leap':'Teleport'} to an empty hex within ${v(a.r)} hexes.`);
  if(a.mode==='cover')push(`Raise a wall on an empty hex within ${v(a.r)}. It blocks movement and crumbles at the end of the next round.`);
  if(a.mode==='strike')push(`Attack a villain ${a.rng?`within ${a.rng} hexes`:'at any range'} with ${a.dice?`${a.dice} dice`:`your dice +${a.plus}`}${a.str?` and +${a.str} Strength`:''}.${a.splash?` Every henchman within 2 of it takes ${a.splash} damage.`:''}`);
  if(f.evaNext)push(`${a.mode==='ally'?'They get':'Get'} +${v(f.evaNext)} evasion against the next attack on ${a.mode==='ally'?'them':'you'}.`);
  if(f.ward)push(a.mode==='ally'?'They ignore the next hit against them.':'Ignore the next hit against you.');
  if(f.heal)push(`${a.mode==='ally'?'They regain':'Regain'} ${v(f.heal)} health.`);
  if(f.comp)push(`Regain ${v(f.comp)} composure.`);
  if(f.absorb)push(`${a.mode==='ally'?'They gain':'Gain'} a shield that absorbs ${v(f.absorb)} damage. It lasts until used up.`);
  if(f.dr)push(`Take ${v(f.dr)} less damage from each hit (never below 1), subject to the Guard limit, until the round ends.`);
  if(f.drAll)push(`You and adjacent allies take ${v(f.drAll)} less damage from each hit (never below 1), subject to each hero's Guard limit, until the round ends.`);
  if(f.eva)push(`+${v(f.eva)} evasion until the round ends.`);
  if(f.anchor)push('You cannot be shoved or dragged until the round ends.');
  if(f.breach)push('Smash every wall and rubble pile next to you.');
  if(f.shove)push(`Shove each adjacent villain 1 hex away if its size is no more than ${P==null?'your Innate rank':P}.`);
  const nx=[];if(f.dice)nx.push(`+${pl(f.dice,'die','dice')}`);if(f.acc)nx.push(`${signedBonus(v(f.acc))} accuracy`);if(f.str)nx.push(`${signedBonus(v(f.str))} Strength`);
  if(!nx.length&&f.back)push(`Your next attack this round gets +${pl(f.back,'die','dice')} if it is a melee attack from a side arc or the blind spot.`);
  if(nx.length)push(`Your next attack this round: ${nx.length>1?nx.slice(0,-1).join(', ')+' and '+nx[nx.length-1]:nx[0]}${f.back?`, plus ${pl(f.back,'die','dice')} more on a melee attack from a side arc or the blind spot`:''}.`);
  if(f.reap)push(`It heals you ${v(f.reap)} for every page it tears.`);
  if(f.rally)push(`You and allies within 2 regain ${v(f.rally)} composure.`);
  if(f.callout)push(`The next hero attack on the villain this round gets +${pl(f.callout,'die','dice')}.`);
  if(f.mark)push('Once per fight. Until the round ends, every hero attack on the villain from a side arc or the blind spot gets +1 die.');
  if(f.hex)push(`The villain has −${f.hexAmt||4} evasion until the round ends.`);
  if(f.blind)push('The villain is blinded: −4 accuracy until the round ends.');
  if(f.vsplash)push(`Every henchman within 2 of the villain takes ${v(f.vsplash)} damage.`);
  if(f.reflect)push('Until the round ends, the first time the villain hits you, it tears one of its own pages.');
  if(f.riposte)push('Until the round ends, the first time the villain misses you, strike back with a free 1-die attack if it is within your range.');
  if(f.scry)push(`Look at the villain's next ${f.scry} pages and choose which one it plays first.`);
  if(f.bury)push("Look at the villain's next page. You may bury it at the bottom of the playbook.");
  if(f.excise)push(`Until the round ends, the next page torn from the villain is the one you choose from its next ${f.excise}.`);
  if(f.scramble)push("Shuffle the villain's playbook. Anything foreseen is lost.");
  if(f.curse)push('The villain deals 2 less damage (never below 1) until the round ends.');
  if(f.face)push('The villain turns to face you, showing its blind spot to your allies.');
  if(f.foresee)push("Reveal the villain's next page.");
  if(f.eclipse)push("Cancel the villain's charged attack.");
  if(f.shock)push(`Every henchman within ${f.shock[0]} of ${a.mode==='tele'?'where you land':'you'} takes ${f.shock[1]} damage.`);
  if(f.gain)push(`Regain ${v(f.gain)} Arcana.`);if(f.gainP)push(`Regain ${v(f.gainP)} Power.`);
  if(f.tear)push(`Tear ${f.tear===1?'a page':f.tear+' pages'} from the villain's playbook. Hit reactions don't trigger.`);
  if(f.stasis)push("You and allies within 1 hex take no damage from anything until your next turn.");
  if(f.skip)push("The villain's next turn is lost: its next page (or charged attack) is thrown away unplayed.");
  if(f.boost){push(`Your next move goes ${pl(f.boost,'hex','hexes')} farther${f.jump?', and that move is a jump':''}`);push('It lasts until you move')}
  if(f.move)push('Move again.');
  if(f.again)push('Take a second action this round.');
  if(f.hpCost)push(`Then lose ${v(f.hpCost)} health (never below 1).`);
  return L.join(' ')}
/* rank perks: ranks 2-3 (or a first rank outside the origin) give the old perk; ranks 4 and 5 are masteries */
/* Version 22: ranks give no stats on their own; only rank 5 grants a capstone */
const RANK_PERK={tech:{5:{acc:2,pwrRegen:1}},innate:{5:{maxHp:4,innUses:1}},magic:{5:{maxComp:2,arcWound:1}}};
const perkAt=(t,n)=>RANK_PERK[t][n]||{};
function rankMod(h,t,k){const own=t===BASE(h).track;let v=0;for(let n=own?2:1;n<=Math.min(h.ranks[t],RANK_MAX);n++)v+=perkAt(t,n)[k]||0;return v}
function perkTxt(t,n){const m=perkAt(t,n),s=[];for(const[k,v]of Object.entries(m)){if(k==='innUses')s.push('a second Innate ability once per fight, which comes back after any round in which you use no abilities');else if(k==='arcWound')s.push('+1 Arcana whenever an attack tears a page');else s.push(`${v>0?'+':''}${v} ${MODN[k]}`)}return s.join(', ')}

/* Version 22: signature powers run on the discipline engines instead of cooldowns */
const POW_ENG={arc:{d:'tech',c:2},patch:{d:'tech',c:3},barricade:{d:'tech',c:2},overclock:{d:'tech',c:3},drone:{d:'tech',c:2},emp:{d:'tech',c:3},
  brace:{d:'innate',min:1},mark:{d:'innate',min:1},quake:{d:'innate',min:1},regen:{d:'innate',min:1},berserk:{d:'innate',min:1},leap:{d:'innate',min:1},
  blur:{d:'magic',c:1},omen:{d:'magic',c:1},curse:{d:'magic',c:2},aegis:{d:'magic',c:2},drain:{d:'magic',c:2},serene:{d:'magic',c:1}};
const powCost=(pw,short)=>{const e=POW_ENG[pw];return e.d==='innate'?(short?`REQ INN ${e.min}`:`requires Innate rank ${e.min}+ and uses your Innate ability for the round`):`${e.c} ${short?TRACKS[e.d].abbr:TRACKS[e.d].res}`};
function powOk(u,h){const pw=BASE(h).power,e=POW_ENG[pw],P=POWERS[pw];if(!e||u.ko)return false;if(!P.free&&u.acted)return false;if(pw==='mark'&&u.markUsed)return false;
  if(e.d!=='innate'&&(u.abUsed||[]).includes('pow'))return false;
  if(e.d==='innate')return potOf(h)>=e.min&&innOk(u,h);return (u.res[e.d]||0)>=e.c}
function payPow(u,h){const e=POW_ENG[BASE(h).power];if(!e)return;if(e.d!=='innate')(u.abUsed=u.abUsed||[]).push('pow');u.abRd=true;if(e.d==='innate'){if(u.innUsed)u.capUsed=true;u.innUsed=(u.innUsed||0)+1}else u.res[e.d]=Math.max(0,(u.res[e.d]||0)-e.c)}
const engineTxt={tech:'+1 max Power',innate:'+1 Innate rank',magic:'+1 max Arcana'};
function poolTxt(h){const o=[];if(pwrMax(h))o.push(`${pwrMax(h)} Power (+${pwrRegen(h)}/round)`);if(arcMax(h))o.push(`${arcMax(h)} Arcana (per fight)`);if(potOf(h))o.push(`Innate rank ${potOf(h)}${innUses(h)>1?' (+1 Innate ability once per fight)':''}`);return o.join(' · ')||'none'}
const gainTxt=(h,t)=>{const c={...h,ranks:{...h.ranks,[t]:h.ranks[t]+1}},o=[],dp=pwrMax(c)-pwrMax(h),da=arcMax(c)-arcMax(h),dq=potOf(c)-potOf(h);if(dp)o.push(`+${dp} max Power`);if(da)o.push(`+${da} max Arcana`);if(dq)o.push(`+${dq} Innate rank`);return o.join(', ')};
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
  // select one of the three best-fit bosses instead of always taking the top.
  const shortlist=bossSelectionScores().sort((a,b)=>b.score-a.score).slice(0,3);
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
}
function newCampaign(prev){
  const keys=shuffle(Object.keys(VILLAINS).filter(k=>!VILLAINS[k].intro));
  /* Bosses reveal only when four heroes have joined the new team. */
  S={vol:(prev&&prev.vol||0)+1,issue:1,trust:6,tech:3,intel:2,salvage:Object.fromEntries(Object.keys(VILLAINS).map(k=>[k,0])),facilities:['workshop'],armory:STARTER_LOCKER.slice(),ethos:{},
    heroes:[],fallen:[],xover:[],
    villains:[],pool:keys,unlocked:START_UNLOCK.slice(),
    phase:'hq',view:'hq',inv:null,sd:null,after:null,arcInfo:null,chronicle:[],over:null,seen:(prev&&prev.seen)||{},seenR:(prev&&prev.seenR)||{},tips:(prev&&prev.tips)||[],tipsOff:!!(prev&&prev.tipsOff),mig3:true,d20:true,str1:true,deck3:true,deck2:true,disc5:true,v22:true,v59:true,v61:true,v62:true,v130:true};
  S.party=[];
  S.guide={s:0,pop:null};if(prev&&prev.tutDone)S.tutDone=true;else S.tut={b:0,dq:[]};S.ui=Object.fromEntries(['hq-base','hq-ws','hq-back','hq-skunk','ro-bench'].map(k=>[k,false]));
}
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
function finishIssue(L,{hunted,headline,vkey}){
  for(const o of S.villains){if(o.key===hunted||o.status!=='active')continue;o.scheme++;
    if(o.scheme>=schemeMax()){o.scheme=0;levelUpVillain(o);S.trust-=2;L.push(`${VILLAINS[o.key].name}'s scheme hits the city while you were busy. −2 trust, and they rise to level ${o.level}.`)}}
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
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{const t=localStorage.getItem(KEY);if(t){S=JSON.parse(t);if(S.sd){S.sd.busy=false;S.sd.vturn=false;if(!S.sd.vl){S.sd.v.charge=S.sd.charge;S.sd.v.hex=S.sd.hex;S.sd.vl=[{key:S.sd.vkey,v:S.sd.v}];S.sd.vi=0}S.sd.v=S.sd.vl[S.sd.vi||0].v;N=S.sd.N||9}S.seen=S.seen||{};S.seenR=S.seenR||{};if(S.sd&&!S.sd.bombs)S.sd.bombs=[];if(S.sd&&!S.sd.beams)S.sd.beams=[];if(S.salvage&&S.salvage.serpent==null)S.salvage.serpent=0;if(S.salvage&&S.pool&&S.villains){const have=new Set([...S.pool,...S.villains.map(v=>v.key)]);['lode','noct','swarm','bomber','grid'].forEach(k=>{if(S.salvage[k]==null)S.salvage[k]=0;if(!have.has(k))S.pool.splice(rnd(S.pool.length+1)-1,0,k)})}if(S.sd&&!S.sd.hexv){try{migrateSd()}catch(e){}}if(S.sd&&!S.sd.exits)S.sd.exits=mkExits(S.sd.N||9,!!S.sd.finale);S.xover=S.xover||[];if(S.cre&&S.phase!=='hq'){S.cre=null;if(S.view==='create')S.view='mission'}if(S.inv){if(S.inv.peak==null)S.inv.peak=S.inv.clues;S.inv.found=S.inv.found||[]}if(!S.party){const had=roster();S.party=had.slice(0,4).map(h=>h.id);Object.keys(HERO_BASE).forEach(c=>{if(!S.heroes.some(h=>h.cls===c)){const n=newHero(c);giveStart(n);S.heroes.push(n)}})}if(!S.d20){S.heroes.forEach(h=>{if(h.base){h.base={...h.base};for(const k of ['acc','str','eva'])h.base[k]=(h.base[k]||0)*2}});S.d20=true}if(!S.str1){S.heroes.forEach(h=>{if(h.base){h.base={...h.base};h.base.str=(h.base.str||0)-1}});S.str1=true}if(!S.deck3){(S.villains||[]).forEach(v=>{if(v.level>1)addAdv(v,v.level-1)});S.deck3=true}if(!S.deck2){(S.villains||[]).forEach(v=>{const d=deckSize(v)-v.deck.length,nb=VILLAINS[v.key].base.length;if(d>0)addAdv(v,d);for(let i=d;i<0&&v.deck.length>nb;i++){v.deck.pop();v.advIdx=Math.max(0,v.advIdx-1)}});S.deck2=true}if(!S.mig3){S.heroes.forEach(h=>{const r=h.ranks;if(h.cls==='volt')[r.tech,r.magic]=[r.magic,r.tech];if(h.cls==='wisp')[r.magic,r.innate]=[r.innate,r.magic]});S.mig3=true}if(!S.disc5)migrateDisc5();if(!S.v22)migrateV22();if(!S.v59)migrateV59();
/* Version 61: new set pieces unlock for arcs already reached and villains already beaten */
if(!S.v61){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V61.map(k=>'gear:'+k)),add=it=>{if(fresh.has(it)&&!S.unlocked.includes(it))S.unlocked.push(it)};
  for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);(S.villains||[]).filter(v=>v.status==='captured'||v.beaten).forEach(v=>(DEFEAT_UNLOCK[v.key]||[]).forEach(add));S.v61=true}
/* Version 62: new blueprints follow the arcs already reached; stats moved between slots, so clamp health and composure */
if(!S.v62){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V62.map(k=>'gear:'+k)),add=it=>{if(fresh.has(it)&&!S.unlocked.includes(it))S.unlocked.push(it)};
  START_UNLOCK.forEach(add);for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);S.heroes.forEach(clampHero);S.v62=true}if(!S.v82)migrateV82();if(!S.v121)migrateV121();if(!S.v123)migrateV123();if(!S.v124)migrateV124();if(!S.v126)migrateV126();if(!S.v130)migrateV130();/* Version 132 (Tyler): heroes no longer sit out an issue after a knockout */if(!S.v132){(S.heroes||[]).forEach(h=>delete h.rest);S.v132=true}if(!S.v133)migrateV133();
  /* Version 102: the new starter blueprints */['gear:baton','gear:knuckles','gear:goggles','gear:hood','gear:headband'].forEach(it=>{if(S.unlocked&&!S.unlocked.includes(it))S.unlocked.push(it)});return true}}catch(e){}return false}
/* Version 82: capture, interrogation, leads and the clue consumables are gone. Captured villains go free again (they keep their blueprints),
   a built Containment Cell is refunded, and Informant's Tips and Search Warrants are sold back for intel. */
/* Version 121: Main Hand / Off Hand. A main-only weapon in the off hand (or off-only in the main hand) moves over if that hand is free, else goes back to the armory */
/* Version 123: unlock the new Off Hand gear for arcs already reached, and top villain playbooks up to the +3 per level size */
/* Version 124: open gear blueprints by tier for the Arc already reached */
/* Version 126: tier 3 blueprints for saves already past issue 10 */
/* Version 130: lasting injuries from the old injury roll are healed (Rattled stays). Heroes who already retired stay retired */
/* Balance pass: unequip new rank-3 items on earlier heroes while preserving their ownership. */
function migrateV133(){const moved=new Set(['mutagen','compeyes']);S.armory=S.armory||[];
  (S.heroes||[]).forEach(h=>{for(const slot of ['head','legs']){const k=h.gear&&h.gear[slot];if(k&&moved.has(k)&&!canWear(h,k)){S.armory.push(k);delete h.gear[slot]}}clampHero(h)});
  if((S.issue||1)<TIER3_ISSUE)S.unlocked=(S.unlocked||[]).filter(it=>!moved.has(it.slice(5)));
  else for(const k of moved)if(!S.unlocked.includes('gear:'+k))S.unlocked.push('gear:'+k);
  if(S.sd&&S.sd.units)S.sd.units.forEach(u=>{const h=heroOf(u);if(h&&u.res){u.res.tech=Math.min(u.res.tech,pwrMax(h));u.res.magic=Math.min(u.res.magic,arcMax(h))}});
  S.v133=true}
function migrateV130(){(S.heroes||[]).forEach(h=>{if(h.injuries&&h.injuries.some(k=>k!=='rattled')){h.injuries=h.injuries.filter(k=>k==='rattled');clampHero(h)}});S.v130=true}
function migrateV126(){const add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};if((S.issue||1)>=TIER3_ISSUE)MID_UNLOCK.forEach(add);if(arcOf(Math.min(S.issue||1,MAX_ISSUE))>=3)ARC_UNLOCK[3].forEach(add);S.v126=true}
function migrateV124(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};
  START_UNLOCK.forEach(add);for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).forEach(add);S.v124=true}
function migrateV123(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),add=it=>{if(!S.unlocked.includes(it))S.unlocked.push(it)};
  ['gear:riotshield','gear:bonebuckler','gear:wardtome'].forEach(add);if(arc>=2)['gear:kinbuckler','gear:scramblepad','gear:quillguard','gear:veillantern'].forEach(add);if(arc>=3)['gear:aegisgen','gear:ironbark','gear:sanctaegis'].forEach(add);
  (S.villains||[]).forEach(vs=>{const n=deckSize(vs)-vs.deck.length;if(n>0)addAdv(vs,n)});S.v123=true}
function migrateV121(){(S.heroes||[]).forEach(h=>{const g=h.gear||{};
  const bad=(s,x)=>x&&GEAR[x]&&!GEAR[x].two&&GEAR[x].hand===(s==='arms'?'off':'main');
  if(bad('arms',g.arms)&&bad('arms2',g.arms2))[g.arms,g.arms2]=[g.arms2,g.arms];
  for(const s of ['arms','arms2']){const x=g[s];if(!bad(s,x))continue;const o=s==='arms'?'arms2':'arms';delete g[s];if(!g[o])g[o]=x;else S.armory.push(x)}
  clampHero(h)});S.v121=true}
function migrateV82(){const gone=['c_tip','c_warrant'];let sold=0;const keep=g=>{if(gone.includes(g)){sold+=g==='c_warrant'?2:1;return false}return true};
  (S.villains||[]).forEach(v=>{if(v.status==='captured'){v.status='active';v.scheme=0;v.beaten=(v.beaten||0)+1}delete v.interrogated});
  if((S.facilities||[]).includes('cell')){S.facilities=S.facilities.filter(f=>f!=='cell');S.tech+=5;S.intel+=3}
  S.unlocked=(S.unlocked||[]).filter(it=>it!=='fac:cell'&&!gone.some(g=>it==='gear:'+g));
  S.armory=(S.armory||[]).filter(keep);(S.heroes||[]).forEach(h=>{if(h.pouch)h.pouch=h.pouch.filter(keep)});S.intel+=sold;
  delete S.leads;if(S.phase==='intg'){S.phase='hq';S.view='hq'}delete S.intg;S.v82=true}
/* v20: ranks cap at 5 (extra ranks move to the lowest other discipline), fights in progress get the new pools, and campaigns already in Arc 2 or 3 get the new blueprints */

/* Version 22 saves: stats drop with the per-rank perks, heroes get a pouch, and the new blueprints follow the arcs already reached */
function migrateV22(){S.heroes.forEach(h=>{h.pouch=h.pouch||[];h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});
  const arc=arcOf(Math.min(S.issue,MAX_ISSUE)),add=['gear:grapbelt','gear:satchel','gear:journal','gear:c_smoke','gear:c_flash','gear:c_stim','gear:c_salts','gear:c_charm'];
  if(arc>=2)add.push('gear:wiretap','gear:trophy','gear:sash','gear:c_frag','gear:c_batt','gear:c_vial','gear:c_adren');
  if(arc>=3)add.push('gear:bandolier','gear:champ','gear:censer');unlock(add);
  if(S.sd)S.sd.units.forEach(u=>{u.innUsed=u.innUsed||0});S.v22=true}
/* Version 59: new set items unlock for arcs already reached; stats moved, so clamp health and composure */
function migrateV59(){const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V59.map(k=>'gear:'+k));
  for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).filter(it=>fresh.has(it)&&!S.unlocked.includes(it)).forEach(it=>S.unlocked.push(it));
  S.heroes.forEach(h=>{h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});S.v59=true}
function migrateDisc5(){S.heroes.forEach(h=>{const r=h.ranks;for(const t in r)while(r[t]>RANK_MAX){r[t]--;const o=Object.keys(r).filter(x=>r[x]<RANK_MAX).sort((a,b)=>r[a]-r[b])[0];if(o)r[o]++}h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))});
  if(S.sd&&S.sd.units)S.sd.units.forEach(u=>{const h=heroOf(u);if(!h)return;const t0=u.res&&u.res.tech!=null?u.res.tech:pwrMax(h);u.res={tech:Math.min(pwrMax(h),t0),magic:arcMax(h)};u.innUsed=0});
  const arc=arcOf(Math.min(S.issue||1,MAX_ISSUE)),fresh=new Set(NEW_GEAR_V20.map(k=>'gear:'+k));for(let a=2;a<=arc;a++)(ARC_UNLOCK[a]||[]).filter(it=>fresh.has(it)&&!S.unlocked.includes(it)).forEach(it=>S.unlocked.push(it));
  if(!S.unlocked.includes('gear:runeblade'))S.unlocked.push('gear:runeblade');S.disc5=true}

/* a fight saved on the old square board keeps its positions as hex offsets; villains get their footprint and refreshed pages */
function migrateSd(){const sd=S.sd;sd.walls=sd.walls||[];sd.pits=sd.pits||[];sd.vl.forEach((o,i)=>{const v=o.v;v.shape=VILLAINS[o.key].shape;if(v.face==null)v.face=5;
    ['deck','discard','wounds'].forEach(f=>v[f]=(v[f]||[]).map(c=>buildCard(o.key,{id:c.id,mk:c.mk||0},v.level)));if(v.last)v.last=buildCard(o.key,{id:v.last.id,mk:v.last.mk||0},v.level);
    focusV(i);if(!vFits(v.x,v.y)){let best=null,bd=1e9;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!vFits(x,y))continue;const d=cheb({x,y},v);if(d<bd){bd=d;best={x,y}}}if(best){v.x=best.x;v.y=best.y}}
    if(vBig(v))shoveOut(5)});focusV(sd.vi||0);sd.hexv=1}
/* Shaken: a hero at 0 composure in a fight */
const SHAKEN={str:2,acc:2,eva:2,move:1};
function stat(h,k,raw){const b=BASE(h);let v=b[k]??0;
  for(const u of h.upgrades)v+=UPG[u].mods[k]||0;
  for(const g of wornGear(h))v+=GEAR[g].mods[k]||0;
  {const pk=pairOf(h);if(pk&&GEAR[pk].pair.mods)v+=GEAR[pk].pair.mods[k]||0}
  v+=auraMod(h,k);
  for(const s of setsOn(h))v+=SETS[s].mods[k]||0;
  for(const t in TRACKS)v+=rankMod(h,t,k);
  for(const i of h.injuries)v+=INJ[i].mods[k]||0;
  if(k==='str'&&S.ethos.a==='force')v+=2;
  if(k==='maxComp'&&S.ethos.b==='secret')v+=1;
  if(S.sd&&h.comp<=0&&SHAKEN[k])v-=SHAKEN[k];
  /* Version 108 (Tyler): Optics Bench scope rails, +1 range and +1 accuracy in showdowns for heroes with range 2+ */
  if(!raw&&S.sd&&(k==='range'||k==='acc')&&S.facilities.includes('optics')&&(k==='range'?v:stat(h,'range',1))>=2)v+=1;
  if(k==='move'||k==='maxComp'||k==='speed')v=Math.max(1,v);
  return v}
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
/* Version 124: the Innate capstone's extra Innate ability is once per fight, and comes back after a round in which the hero used no abilities */
const innOk=(u,h)=>(u.innUsed||0)<1+(stat(h,'innUses')>0&&!u.capUsed?1:0);
const handN=g=>g.two?'Two hands':g.hand==='main'?'Main Hand':g.hand==='off'?'Off Hand':'Either Hand';
const gearSlotN=g=>g.slot==='arms'?handN(g):slotN(g.slot);
const pairOf=h=>{const a=h.gear.arms;return a&&a===h.gear.arms2&&GEAR[a]&&GEAR[a].pair?a:null};
/* gear that counts for stats and sets: since Version 121 both copies of a Paired weapon count in full */
function wornGear(h){return Object.values(h.gear)}
const gearHas=(h,p)=>Object.values(h.gear).some(g=>GEAR[g]&&GEAR[g][p]);
/* auras: the wearer and each ally within 1 hex add the gear's aura bonus */
/* an effect aura reaches u if u or a standing ally within 1 hex wears it */
function auraOn(u,id){const sd=S.sd;if(!sd||!u||u.ko)return false;return sd.units.some(o=>!o.ko&&cheb(o,u)<=AURA_R&&Object.values(heroOf(o).gear).some(g=>GEAR[g]&&GEAR[g].auraFx===id))}
/* Fortune works on the first attack against each hero per round */
function luckUp(u){if(!auraOn(u,'luck')||u.luckRd===S.sd.round)return false;u.luckRd=S.sd.round;return true}
function auraTags(u){const L=Object.keys(AURA_FX).filter(id=>auraOn(u,id));return L.length?`<div class="row">${L.map(id=>`<span class="tag g" data-tip="kw:aura">${AURA_FX[id].n}</span>`).join('')}</div>`:''}
function auraMod(h,k){const sd=S&&S.sd;if(!sd||!sd.units)return 0;const u=sd.units.find(o=>o.hid===h.id);if(!u||u.ko)return 0;let v=0;
  for(const o of sd.units){if(o.ko||cheb(o,u)>AURA_R)continue;const t=heroOf(o);if(!t)continue;for(const g of new Set(Object.values(t.gear))){const a=GEAR[g]&&GEAR[g].aura;if(a)v+=a[k]||0}}return v}
/* where an item goes: the slot it fills and the slots it clears (a two-handed weapon clears both hands) */
function eqPlan(h,g,pref){const G=GEAR[g],ks=SLOT_KEYS[G.slot]||[G.slot];
  if(G.slot==='arms'){const a=h.gear.arms,b=h.gear.arms2,tw=a&&GEAR[a].two;
    const s=G.two||G.hand==='main'?'arms':G.hand==='off'?'arms2':pref==='arms'||pref==='arms2'?pref:!a?'arms':a===g?'arms2':b===g?'arms':!b?'arms2':'arms2';
    const clear=G.two||tw?['arms','arms2']:[s];return {s,clear,out:clear.map(x=>h.gear[x]).filter(Boolean)}}
  const clear=[ks.find(s=>!h.gear[s])||ks[0]];
  return {s:clear[0],clear,out:clear.map(s=>h.gear[s]).filter(Boolean)}}
function putGear(h,g,pref){const p=eqPlan(h,g,pref);p.clear.forEach(s=>delete h.gear[s]);h.gear[p.s]=g;return p.out}
const roster=()=>S.heroes.filter(h=>!h.retired);
const heroById=id=>S.heroes.find(h=>h.id===id);
const party=()=>(S.party||[]).map(heroById).filter(h=>h&&!h.retired);
const bench=()=>roster().filter(h=>!(S.party||[]).includes(h.id));
const partyHas=fid=>party().some(h=>BASE(h).field&&BASE(h).field.id===fid);
const fieldGear=fid=>party().flatMap(h=>Object.values(h.gear).filter(g=>GEAR[g].field&&GEAR[g].field.id===fid).map(g=>({h,g})));
const fieldCount=fid=>fieldGear(fid).length;
/* Version 93: the last investigation roll is kept so the result can show the die, the bonus and the target */
let lastInvRoll=null;
/* Version 95 (Tyler): Keen Senses gives +2, down from +4 */
function invRoll(){const d=d20(),b=(partyHas('senses')?2:0)+2*fieldCount('roll');lastInvRoll={d,b,t:d+b};return d+b}
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
function clampHero(h){h.hp=Math.min(h.hp,stat(h,'maxHp'));h.comp=Math.min(h.comp,stat(h,'maxComp'))}

/* ============ INVESTIGATION ============ */
function hurtRandom(n){const h=pick(party().length?party():roster());h.hp=Math.max(1,h.hp-n);return h.name}
const EVENTS=[
  {id:'witness',title:'A shaken witness',txt:v=>`Someone saw ${v}'s people loading a van downtown. They're terrified.`,opts:[
    {l:'Reassure them',h:'Roll 9+ for a clue',run:i=>{const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. They calm down and give you a plate number. +1 clue.`}return `Rolled ${r}. They clam up and leave.`}},
    {l:'Press hard',h:'+1 clue, −1 trust',run:i=>{i.clues++;S.trust--;return 'You get the address. The story of heroes shouting at a witness gets around. +1 clue, −1 trust.'}}]},
  {id:'signal',title:'Encrypted transmission',txt:v=>`A burst signal on a frequency ${v} has used before.`,opts:[
    {l:'Decrypt in the lab',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The lab cracks it in an hour: a schedule and a location. +2 clues. '+hx+' takes 1 damage on the long night.'}},
    {l:'Trace it on foot',h:'Roll 11+ for a clue, else a hero takes 2',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. You triangulate the source. +1 clue.`}return `Rolled ${r}. The relay was booby-trapped. ${hurtRandom(2)} takes 2 damage.`}},
    {l:'Bag the evidence',h:'+1 intel',run:()=>{S.intel++;return 'You record the burst and file it. The analysts will crack it eventually. +1 intel.'}}]},
  {id:'crime',title:'Robbery in progress',txt:()=>'A bank alarm is going off across town, nowhere near your lead.',opts:[
    {l:'Stop the robbery',h:'+1 trust',run:()=>{S.trust++;return 'The city sees you save the day. +1 trust.'}},
    {l:'Stay on the trail',h:'+1 clue, −1 trust',run:i=>{i.clues++;S.trust--;return 'You keep the pressure on. The news asks where the heroes were. +1 clue, −1 trust.'}}]},
  {id:'safehouse',title:'Henchman safehouse',txt:v=>`You've found where ${v}'s crew sleeps.`,opts:[
    {l:'Raid it',h:'+1 clue, +1 salvage, a hero takes 2',run:i=>{i.clues++;S.salvage[i.v]++;return `You kick in the door. +1 clue and 1 ${VILLAINS[i.v].salvage}. ${hurtRandom(2)} takes 2 damage.`}},
    {l:'Stake it out',h:'Roll 14+ for 2 clues',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. A lieutenant leads you right to the lair. +2 clues.`}return `Rolled ${r}. A long cold night with nothing to show.`}},
    {l:'Bag the evidence',h:'+1 intel',run:()=>{S.intel++;return 'You sweep the place for ledgers, phones and maps while the crew is out. +1 intel.'}}]},
  {id:'archive',title:'Old case files',txt:v=>`Police archives mention ${v} years before the costume.`,opts:[
    {l:'Read them',h:'+1 clue',run:i=>{i.clues++;return 'An old address and a known associate. +1 clue.'}},
    {l:'Cross-reference intel',h:'Costs 1 intel. +2 clues, a hero takes 1',ok:()=>S.intel>=1,run:i=>{const hx=hurtRandom(1);S.intel--;i.clues+=2;return 'Your intel lines up with the files perfectly. +2 clues. '+hx+' takes 1 damage on the long night.'}},
    {l:'Bag the evidence',h:'+1 intel',run:()=>{S.intel++;return 'You copy the whole box for HQ. Nothing points to the lair yet, but it will all be useful. +1 intel.'}}]},
  {id:'press',title:'A reporter corners the team',txt:()=>'She has questions, and maybe a source of her own.',opts:[
    {l:'Give a statement',h:'+1 trust',run:()=>{S.trust++;return 'A calm, reassuring quote runs on the front page. +1 trust.'}},
    {l:'Ask what she knows',h:'Roll 11+ for a clue',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. She trades a tip for an exclusive later. +1 clue.`}return `Rolled ${r}. She knows less than you do.`}}]},
  {id:'informant',title:'An informant wants paying',txt:v=>`A small-time fence says he knows where ${v} is hiding.`,opts:[
    {l:'Pay him',h:'Costs 1 tech. +2 clues, a hero takes 1',ok:()=>S.tech>=1,run:i=>{const hx=hurtRandom(1);S.tech--;i.clues+=2;return 'He sells you blueprints of the lair. +2 clues. '+hx+' takes 1 damage on the long night.'}},
    {l:'Lean on him',h:'+1 clue, −1 trust',run:i=>{i.clues++;S.trust--;return 'He talks. He also talks to the papers. +1 clue, −1 trust.'}}]},
  {id:'decoy',title:'A lead that smells wrong',txt:v=>`An anonymous tip points straight to ${v}. Too easy?`,opts:[
    {l:'Follow it',h:'Roll 12+ for 2 clues, else lose 1',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. It's real. +2 clues.`}i.clues=Math.max(0,i.clues-1);return `Rolled ${r}. A setup. They know you're coming. −1 clue.`}},
    {l:'Ignore it',h:'No effect',run:()=> 'You stick to your own leads.'}]},
  {id:'vault',cond:()=>ALL_ITEMS.some(it=>it.startsWith('fac:')&&!isUnlocked(it)),title:"A retired hero's vault",txt:v=>`Chasing ${v} leads you to a sealed vault left behind by a hero team from decades ago.`,opts:[
    {l:'Crack it open',h:'Unlock a facility blueprint',run:()=>{const n=unlockRandom('fac');return n?`Inside: plans for a ${n}. Blueprint unlocked.`:'Empty, except for dust.'}},
    {l:'Leave it sealed',h:'+1 trust',run:()=>{S.trust++;return 'Word gets out that you respected their legacy. +1 trust.'}}]},
  {id:'abandoned',cond:()=>ALL_ITEMS.some(it=>it.startsWith('gear:')&&!isUnlocked(it)),title:'An abandoned research lab',txt:v=>`One of ${v}'s old supply runs ends at a lab nobody has opened in years.`,opts:[
    {l:'Recover the schematics',h:'Unlock a gear blueprint',run:()=>{const n=unlockRandom('gear');return n?`The schematics survived. Blueprint unlocked: ${n}.`:'The files are corrupted beyond use.'}},
    {l:'Strip it for parts',h:'+2 tech',run:()=>{S.tech+=2;return 'You haul out crates of usable hardware. +2 tech.'}}]},
  {id:'rooftop',title:'A chase across the rooftops',txt:v=>`One of ${v}'s lookouts spots you and bolts for the fire escape.`,opts:[
    {l:'Run him down',h:'Roll 11+ for a clue, else a hero takes 1',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. You pin him on a water tower and he talks. +1 clue.`}return `Rolled ${r}. He jumps a gap you shouldn't have tried. ${hurtRandom(1)} takes 1 damage.`}},
    {l:'Let him run and tail him',h:'Roll 16+ for 2 clues',run:i=>{const r=invRoll();if(r>=16){i.clues+=2;return `Rolled ${r}. He runs straight home to report. +2 clues.`}return `Rolled ${r}. You lose him in the crowd.`}}]},
  {id:'hospital',title:'Victims in the ER',txt:v=>`Three people came in tonight with injuries only ${v} could cause.`,opts:[
    {l:'Sit with the families',h:'+1 trust',run:()=>{S.trust++;return 'Somebody films you staying until dawn. +1 trust.'}},
    {l:'Study the injuries',h:'Roll 9+ for a clue',run:i=>{const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. The wounds tell you where they were standing. +1 clue.`}return `Rolled ${r}. The doctors can't tell you anything new.`}}]},
  {id:'blackout',title:'Rolling blackout',txt:v=>`The power grid is failing block by block, and the pattern circles somewhere ${v} would hide.`,opts:[
    {l:'Get the lights back on',h:'Costs 1 tech. +1 clue, +1 trust',ok:()=>S.tech>=1,run:i=>{S.tech--;i.clues++;S.trust++;return 'You reroute the grid and see exactly which line was tapped. +1 clue, +1 trust.'}},
    {l:'Map the outages',h:'Roll 11+ for a clue',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. The dark blocks point at one substation. +1 clue.`}return `Rolled ${r}. The pattern is just a bad grid.`}}]},
  {id:'rival',title:'A vigilante on the same case',txt:v=>`A masked loner has been hunting ${v} for months and doesn't want company.`,opts:[
    {l:'Trade notes',h:'Costs 1 intel. +2 clues, a hero takes 1',ok:()=>S.intel>=1,run:i=>{const hx=hurtRandom(1);S.intel--;i.clues+=2;return 'Your files fill the holes in theirs. +2 clues. '+hx+' takes 1 damage on the long night.'}},
    {l:'Tell them to stand down',h:'+1 trust',run:()=>{S.trust++;return 'The city likes its heroes licensed. +1 trust.'}}]},
  {id:'locker',title:'The evidence locker',txt:v=>`A precinct is holding gear seized from ${v}'s crew last year.`,opts:[
    {l:'Ask for it properly',h:'+1 clue',run:i=>{i.clues++;return 'Three forms later, a serial number leads somewhere useful. +1 clue.'}},
    {l:'Borrow it overnight',h:'+1 clue, +1 salvage, −1 trust',run:i=>{i.clues++;S.salvage[i.v]++;S.trust--;return `You keep a piece. +1 clue and 1 ${VILLAINS[i.v].salvage}. Internal affairs is not happy. −1 trust.`}},
    {l:'Bag the evidence',h:'+1 intel',run:()=>{S.intel++;return 'You photograph every seized item and log the serial numbers. +1 intel.'}}]},
  {id:'dive',title:'A bar full of henchmen',txt:v=>`${v}'s crew drinks at the same dive every night after a job.`,opts:[
    {l:'Go in undercover',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. Nobody notices the new regular. +2 clues.`}return `Rolled ${r}. Your cover lasts one drink. ${hurtRandom(2)} takes 2 damage in the brawl.`}},
    {l:'Clear the bar',h:'+1 clue, a hero takes 1',run:i=>{i.clues++;return `The last one standing talks. +1 clue. ${hurtRandom(1)} takes 1 damage.`}}]},
  {id:'cameras',title:'Eye in the sky',txt:v=>`Traffic cameras caught part of the route ${v}'s people drive every night.`,opts:[
    {l:'Pull the footage',h:'Needs Comms Array. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('comms'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The array stitches every camera together into one route. +2 clues. '+hx+' takes 1 damage on the long night.'}},
    {l:'Ask the traffic cops',h:'Roll 11+ for a clue',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. One officer remembers the van. +1 clue.`}return `Rolled ${r}. The footage was wiped hours ago.`}},
    {l:'Bag the evidence',h:'+1 intel',run:()=>{S.intel++;return 'You download a month of footage for the files back home. +1 intel.'}}]},
  {id:'fire',title:'A building on fire',txt:v=>`A tenement on ${v}'s escape route is burning, and people are still inside.`,opts:[
    {l:'Get everyone out',h:'+2 trust, a hero takes 2',run:()=>{S.trust+=2;return `Every family walks out. +2 trust. ${hurtRandom(2)} takes 2 damage from the smoke.`}},
    {l:'Leave it to the fire crews',h:'+1 clue, −1 trust',run:i=>{i.clues++;S.trust--;return 'You stay on the trail. The photos of the fire run without you in them. +1 clue, −1 trust.'}}]},
];
/* each villain's own leads: the third lead of every investigation is always one of these */
const VEVENTS={
  gallows:[
    {id:'gal_lab',title:"Gallows's sealed lab",txt:()=>'The university sealed Dr. Gallows\'s lab after the accident. The locks on the door are new.',opts:[
      {l:'Search his notes',h:'Roll 12+ for 2 clues, else 1',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. His latest equations name a building. +2 clues.`}i.clues++;return `Rolled ${r}. Most of it is gibberish, but not all. +1 clue.`}},
      {l:"Trip the dead man's switch",h:'+1 clue, +1 Coils, a hero takes 2',run:i=>{i.clues++;S.salvage.gallows++;return `The lab fries itself, but a coil survives with his address etched inside. +1 clue and 1 Coils. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'gal_drone',title:'A downed drone',txt:()=>'One of Gallows\'s drones crashed in a park and is still twitching.',opts:[
      {l:'Take it apart',h:'+1 clue, +1 tech',run:i=>{i.clues++;S.tech++;return 'Its flight log ends at his workshop, and the parts are worth keeping. +1 clue, +1 tech.'}},
      {l:'Fix it and follow it home',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. It limps straight back to its master. +2 clues.`}return `Rolled ${r}. It self-destructs mid-flight. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'gal_subjects',title:'Unwilling test subjects',txt:()=>'People are vanishing from a shelter on the east side and coming back wrong.',opts:[
      {l:'Guard the shelter',h:'+2 trust',run:()=>{S.trust+=2;return 'Nobody vanishes on your watch. +2 trust.'}},
      {l:'Scan the survivors',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The implants share a manufacturer\'s mark and a shipping address. +2 clues. '+hx+' takes 1 damage on the long night.'}}]}],
  quarry:[
    {id:'qua_tremor',title:'Tremors under the street',txt:()=>'Seismographs show something huge moving through the bedrock beneath downtown.',opts:[
      {l:'Read the seismographs',h:'Costs 1 tech. +2 clues, a hero takes 1',ok:()=>S.tech>=1,run:i=>{const hx=hurtRandom(1);S.tech--;i.clues+=2;return 'You plot her path through the stone. +2 clues. '+hx+' takes 1 damage on the long night.'}},
      {l:'Climb down the sinkhole',h:'Roll 12+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. Fresh tunnels lead toward her den. +2 clues.`}return `Rolled ${r}. The sinkhole collapses behind you. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'qua_miners',title:'The survivors of the collapse',txt:()=>'The miners who lived through the collapse that made Mother Quarry still meet every week. Some of them still visit her.',opts:[
      {l:'Listen to their stories',h:'Roll 9+ for a clue, +1 trust',run:i=>{S.trust++;const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. One of them knows where she rests. +1 clue, +1 trust.`}return `Rolled ${r}. They don't trust you yet, but they appreciate the visit. +1 trust.`}},
      {l:'Follow them at night',h:'+2 clues, −2 trust',run:i=>{i.clues+=2;S.trust-=2;return 'They lead you right to her. They saw you following. +2 clues, −2 trust.'}}]},
    {id:'qua_rubble',title:'A block turned to rubble',txt:()=>'Mother Quarry passed through here an hour ago. The whole block is gone.',opts:[
      {l:'Dig out survivors',h:'+2 trust, a hero takes 1',run:()=>{S.trust+=2;return `You pull out everyone who's still breathing. +2 trust. ${hurtRandom(1)} takes 1 damage.`}},
      {l:'Gather her shards',h:'+1 clue, +1 Shards',run:i=>{i.clues++;S.salvage.quarry++;return 'The broken stone still points the way she went. +1 clue and 1 Shards.'}}]}],
  cantor:[
    {id:'can_ledger',title:'The missing ledger',txt:()=>'One of The Cantor\'s bookkeepers ran off with a ledger. His hired guns are already looking for her.',opts:[
      {l:'Find her first',h:'Roll 12+ for 2 clues and 1 Ledgers',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;S.salvage.cantor++;return `Rolled ${r}. She hands over the book for a ride out of town. +2 clues and 1 Ledgers.`}return `Rolled ${r}. His people got there first.`}},
      {l:'Offer her protection',h:'+1 clue, +1 trust',run:i=>{i.clues++;S.trust++;return 'She keeps the ledger but tells you what\'s in it. +1 clue, +1 trust.'}}]},
    {id:'can_song',title:'A song on every radio',txt:()=>'At midnight every radio in the club district plays the same tune, and people walk out of their homes still asleep.',opts:[
      {l:'Jam the signal',h:'Costs 1 tech. +1 clue, +1 trust',ok:()=>S.tech>=1,run:i=>{S.tech--;i.clues++;S.trust++;return 'The sleepers wake up confused but safe, and the jammer shows where the signal came from. +1 clue, +1 trust.'}},
      {l:'Follow the sleepwalkers',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. They lead you to his stage. +2 clues.`}return `Rolled ${r}. The song gets into your head too. ${hurtRandom(2)} takes 2 damage before you snap out of it.`}}]},
    {id:'can_debt',title:'Collection night',txt:()=>'A shop owner owes The Cantor. The collectors come tonight.',opts:[
      {l:'Be there when they arrive',h:'+1 clue, +1 trust, a hero takes 2',run:i=>{i.clues++;S.trust++;return `The collectors fold and talk. +1 clue, +1 trust. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Follow the money',h:'Roll 12+ for 2 clues, −1 trust',run:i=>{S.trust--;const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. The cash goes straight up the ladder. +2 clues. The shop owner won't forgive you. −1 trust.`}return `Rolled ${r}. The money vanishes into a laundromat, and the shop owner saw you watching. −1 trust.`}}]}],
  architect:[
    {id:'arc_plans',title:'Plans at city hall',txt:()=>'Every building The Architect designed was filed with the city. Some floors are missing from the plans.',opts:[
      {l:'Compare plans to the skyline',h:'Costs 1 intel. +2 clues, a hero takes 1',ok:()=>S.intel>=1,run:i=>{const hx=hurtRandom(1);S.intel--;i.clues+=2;return 'One tower is two floors taller than its drawings. +2 clues. '+hx+' takes 1 damage on the long night.'}},
      {l:'Pull the permits',h:'Roll 11+ for a clue',run:i=>{const r=invRoll();if(r>=11){i.clues++;return `Rolled ${r}. A shell company signed for all of them. +1 clue.`}return `Rolled ${r}. A paper maze, built on purpose.`}}]},
    {id:'arc_shift',title:'A building that moved',txt:()=>'An office tower shifted three feet overnight. Nobody inside noticed.',opts:[
      {l:'Walk the halls',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. You find the hinge, and where its control line runs. +2 clues.`}return `Rolled ${r}. A corridor folds shut on you. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Evacuate the tower',h:'+2 trust',run:()=>{S.trust+=2;return 'Everyone is out before it moves again. +2 trust.'}}]},
    {id:'arc_site',title:'A night shift nobody ordered',txt:()=>'Constructs are pouring concrete at a site that closed months ago.',opts:[
      {l:'Smash a construct',h:'+1 clue, +1 Rebar, a hero takes 1',run:i=>{i.clues++;S.salvage.architect++;return `Its work orders are stamped inside its chest. +1 clue and 1 Rebar. ${hurtRandom(1)} takes 1 damage.`}},
      {l:'Watch what they build',h:'Roll 9+ for a clue',run:i=>{const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. It's a copy of her lair's entrance. +1 clue.`}return `Rolled ${r}. Just a wall. For now.`}}]}],
  helios:[
    {id:'hel_heat',title:'A heatwave at midnight',txt:()=>'It is 104°F at 2 a.m. in one neighborhood, and climbing.',opts:[
      {l:'Map the hot spots',h:'Roll 9+ for a clue',run:i=>{const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. The heat radiates from one rooftop. +1 clue.`}return `Rolled ${r}. The readings swim in the haze.`}},
      {l:'Open cooling centers',h:'Costs 1 tech. +2 trust',ok:()=>S.tech>=1,run:()=>{S.tech--;S.trust+=2;return 'Nobody dies tonight. +2 trust.'}}]},
    {id:'hel_reactor',title:'The reactor that made him',txt:()=>'The fusion lab\'s logs were wiped, but the reactor core remembers where its energy went.',opts:[
      {l:'Read the core',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The decay pattern points to where he recharges. +2 clues. '+hx+' takes 1 damage on the long night.'}},
      {l:'Go into containment',h:'Roll 14+ for 2 clues, else a hero takes 3',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. Scorched footprints lead out a maintenance door. +2 clues.`}return `Rolled ${r}. The radiation is worse than the meters said. ${hurtRandom(3)} takes 3 damage.`}}]},
    {id:'hel_sprite',title:'A stray Sunsprite',txt:()=>'A sunsprite has drifted from the swarm and is setting rooftops alight.',opts:[
      {l:'Capture it',h:'+1 clue, +1 Sunstone, a hero takes 2',run:i=>{i.clues++;S.salvage.helios++;return `It burns out in your hands and leaves a sunstone behind, still warm and tugging toward home. +1 clue and 1 Sunstone. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Let it lead you home',h:'Roll 12+ for 2 clues',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. It rejoins the swarm right over his lair. +2 clues.`}return `Rolled ${r}. It flickers out over the river.`}}]}],
  serpent:[
    {id:'ser_skin',title:'Shed skin in the subway',txt:()=>'A molted skin as long as a train lies in a tunnel nobody has used since the seventies.',opts:[
      {l:'Collect it',h:'+1 clue, +1 Scales',run:i=>{i.clues++;S.salvage.serpent++;return 'The scales are fresh and the skin points deeper. +1 clue and 1 Scales.'}},
      {l:'Follow the trail deeper',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. You hear it breathing below. +2 clues.`}return `Rolled ${r}. Cultists wait in the dark. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'ser_cult',title:'A cult recruiter',txt:()=>'Flyers promising "rebirth" are taped to every station pillar on the night line.',opts:[
      {l:'Go to a meeting',h:'Roll 12+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. They take the new believers down to see it. +2 clues.`}return `Rolled ${r}. They know a hero when they see one. ${hurtRandom(2)} takes 2 damage getting out.`}},
      {l:'Break up the meeting',h:'+1 clue, +1 trust',run:i=>{i.clues++;S.trust++;return 'The recruits go home. One of the robed ones drops a station map. +1 clue, +1 trust.'}}]},
    {id:'ser_crew',title:'The missing track crew',txt:()=>'A track crew went down at midnight and never came up.',opts:[
      {l:'Search for survivors',h:'+2 trust, a hero takes 2',run:()=>{S.trust+=2;return `You find two of them alive in a side tunnel. +2 trust. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Check the work logs',h:'Costs 1 intel. +2 clues, a hero takes 1',ok:()=>S.intel>=1,run:i=>{const hx=hurtRandom(1);S.intel--;i.clues+=2;return 'Every missing crew was sent to the same junction. +2 clues. '+hx+' takes 1 damage on the long night.'}}]}],
  lode:[
    {id:'lod_yard',title:'A scrapyard that moved',txt:()=>'Every wreck in an east-side scrapyard slid fifty feet north overnight, all in one perfect line.',opts:[
      {l:'Follow the line',h:'Roll 12+ for 2 clues',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. The line points straight at a steel mill that closed years ago. +2 clues.`}return `Rolled ${r}. The line runs into the river and stops.`}},
      {l:'Pry loose a magnetized part',h:'+1 clue, +1 Lodestones',run:i=>{i.clues++;S.salvage.lode++;return 'The bumper is still humming, and it tugs in one direction. +1 clue and 1 Lodestones.'}}]},
    {id:'lod_comp',title:'Compasses gone wrong',txt:()=>'Every compass in the harbor points at the same building, and it is not north.',opts:[
      {l:'Triangulate the pull',h:'Costs 1 tech. +2 clues, a hero takes 1',ok:()=>S.tech>=1,run:i=>{const hx=hurtRandom(1);S.tech--;i.clues+=2;return 'Three readings cross over one rooftop. +2 clues. '+hx+' takes 1 damage on the long night.'}},
      {l:'Ask the harbor master',h:'Roll 9+ for a clue',run:i=>{const r=invRoll();if(r>=9){i.clues++;return `Rolled ${r}. Ships keep drifting toward the same pier. +1 clue.`}return `Rolled ${r}. She thinks you are from the insurance company.`}}]},
    {id:'lod_train',title:'A derailed freight train',txt:()=>'A freight train was dragged off its rails, and every ton of its steel cargo is missing.',opts:[
      {l:'Help the crew',h:'+2 trust, a hero takes 2',run:()=>{S.trust+=2;return `You lift the cab off the driver. +2 trust. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Track the cargo',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. Gouges in the road lead to his yard. +2 clues.`}return `Rolled ${r}. A girder flies at you out of the dark. ${hurtRandom(2)} takes 2 damage.`}}]}],
  noct:[
    {id:'noc_card',title:'A name on a black card',txt:()=>'A city councilman found a black card on his pillow with his name on it. Her last three targets got the same card.',opts:[
      {l:'Guard him tonight',h:'+1 clue, +1 trust, a hero takes 2',run:i=>{i.clues++;S.trust++;return `She comes, finds you waiting, and leaves. Her blade leaves a mark. +1 clue, +1 trust. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Study the card',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The ink is printed at one shop in the old town. +2 clues. '+hx+' takes 1 damage on the long night.'}}]},
    {id:'noc_dark',title:'The blackout block',txt:()=>'Every streetlight on one block went dark, and nobody can get them back on.',opts:[
      {l:'Walk the block',h:'Roll 14+ for 2 clues, else a hero takes 3',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. You spot a Shade slipping down a drain. +2 clues.`}return `Rolled ${r}. Something in the dark cuts you before you see it. ${hurtRandom(3)} takes 3 damage.`}},
      {l:'Bring floodlights',h:'Costs 1 tech. +1 clue, +1 trust',ok:()=>S.tech>=1,run:i=>{S.tech--;i.clues++;S.trust++;return 'The block lights up and the shadows give up a footprint. +1 clue, +1 trust.'}}]},
    {id:'noc_shade',title:'A captured Shade',txt:()=>'Police caught one of her Shades. It has not said a word, and its shadow keeps moving on its own.',opts:[
      {l:'Question it',h:'Roll 12+ for 2 clues',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. Its shadow points at the door it came from. +2 clues.`}return `Rolled ${r}. It melts away in the interview room.`}},
      {l:'Bottle its shadow',h:'+1 clue, +1 Umbra',run:i=>{i.clues++;S.salvage.noct++;return 'The jar is ice cold and the shadow inside keeps pointing one way. +1 clue and 1 Umbra.'}}]}],
  swarm:[
    {id:'swm_hive',title:'A hive in the subway',txt:()=>'Commuters report a humming nest of drones the size of a bus under the night line.',opts:[
      {l:'Clear it out',h:'+1 clue, +1 Chitin, a hero takes 1',run:i=>{i.clues++;S.salvage.swarm++;return `The nest comes down in pieces, and one still has its homing chip. +1 clue and 1 Chitin. ${hurtRandom(1)} takes 1 damage.`}},
      {l:'Watch where they fly',h:'Roll 12+ for 2 clues',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. At dawn the whole nest lifts off and flies home. +2 clues.`}return `Rolled ${r}. They scatter in a hundred directions.`}}]},
    {id:'swm_hum',title:'Dead air',txt:()=>'At midnight every phone in the market district buzzes with the same droning hum.',opts:[
      {l:'Jam the frequency',h:'Costs 1 tech. +1 clue, +1 trust',ok:()=>S.tech>=1,run:i=>{S.tech--;i.clues++;S.trust++;return 'The hum stops, and the jammer logs where it was coming from. +1 clue, +1 trust.'}},
      {l:'Trace the signal',h:'Roll 14+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. The signal comes from a rooftop relay. +2 clues.`}return `Rolled ${r}. The swarm notices you listening. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'swm_lab',title:'The robotics lab',txt:()=>'A university robotics lab lost its whole drone fleet. A week later, the fleet came back and took the lab.',opts:[
      {l:'Evacuate the campus',h:'+2 trust',run:()=>{S.trust+=2;return 'Every student is out before the doors seal. +2 trust.'}},
      {l:'Search the lab',h:'Costs 1 intel. +2 clues, a hero takes 1',ok:()=>S.intel>=1,run:i=>{const hx=hurtRandom(1);S.intel--;i.clues+=2;return 'The fleet\'s original flight logs show where it roosts. +2 clues. '+hx+' takes 1 damage on the long night.'}}]}],
  bomber:[
    {id:'bom_roof',title:'Scorched rooftops',txt:()=>'Scorch marks run across the rooftops downtown, each one a little farther apart than anyone should be able to jump.',opts:[
      {l:'Follow the marks',h:'Roll 12+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. The trail of burns ends at a shuttered stunt arena. +2 clues.`}return `Rolled ${r}. A rigged skylight gives way under you. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Measure the jumps',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'Custom spring boots, and only one shop in the city sells coils that strong. +2 clues. '+hx+' takes 1 damage on the long night.'}}]},
    {id:'bom_fire',title:'The fireworks warehouse',txt:()=>'A fireworks warehouse by the docks was cleaned out overnight. The alarm never went off, and the lock was blown from the inside.',opts:[
      {l:'Sift the wreckage',h:'+1 clue, +1 Fuses',run:i=>{i.clues++;S.salvage.bomber++;return 'Half-burned fuse cord, cut to the same length every time. +1 clue and 1 Fuses.'}},
      {l:'Stake out the docks',h:'+1 clue, a hero takes 1',run:i=>{i.clues++;return `She comes back for the last crate and leaves a present for whoever is watching. +1 clue. ${hurtRandom(1)} takes 1 damage.`}}]},
    {id:'bom_squad',title:'The bomb squad',txt:()=>'The city bomb squad has found eleven of her devices this month. Their sergeant thinks she wanted them found.',opts:[
      {l:'Hear him out',h:'+1 clue, +1 trust',run:i=>{i.clues++;S.trust++;return 'Every bomb was built to be found. She is putting on a show for someone. +1 clue, +1 trust.'}},
      {l:'Study a live device',h:'Costs 1 tech. Roll 14+ for 2 clues, else a hero takes 2',ok:()=>S.tech>=1,run:i=>{S.tech--;const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. The circuit board has a return address etched on it. +2 clues.`}return `Rolled ${r}. It was never meant to be taken apart. ${hurtRandom(2)} takes 2 damage.`}}]}],
  grid:[
    {id:'grd_lights',title:'Every light is red',txt:()=>'At 2 a.m. every traffic signal downtown turned red at once and stayed that way. The control center says nobody is logged in.',opts:[
      {l:'Trace the override',h:'Needs Forensics Lab. +2 clues, a hero takes 1',ok:()=>S.facilities.includes('lab'),run:i=>{const hx=hurtRandom(1);i.clues+=2;return 'The override bounces off survey towers across the city and ends at one rooftop. +2 clues. '+hx+' takes 1 damage on the long night.'}},
      {l:'Walk the intersections',h:'Roll 12+ for 2 clues, else a hero takes 2',run:i=>{const r=invRoll();if(r>=12){i.clues+=2;return `Rolled ${r}. Every camera at every junction has been turned to face the same building. +2 clues.`}return `Rolled ${r}. The laser across the last corner was not a survey beam. ${hurtRandom(2)} takes 2 damage.`}}]},
    {id:'grd_club',title:'The laser show',txt:()=>'A waterfront nightclub bought a laser rig far too precise for a dance floor. The buyer paid cash and took the lenses back out the next day.',opts:[
      {l:'Strip the rig',h:'+1 clue, +1 Lenses',run:i=>{i.clues++;S.salvage.grid++;return 'One lens was left behind, ground to a military spec. +1 clue and 1 Lenses.'}},
      {l:'Talk to the bouncer',h:'+1 clue, +1 trust',run:i=>{i.clues++;S.trust++;return 'He remembers the van, and the city surveyor logo on its side. +1 clue, +1 trust.'}}]},
    {id:'grd_van',title:"The surveyor's van",txt:()=>'A city survey van has been parked outside the same warehouse for a week. The back is full of tripods, and the windows are painted over.',opts:[
      {l:'Pick the lock',h:'Costs 1 tech. Roll 14+ for 2 clues, else a hero takes 2',ok:()=>S.tech>=1,run:i=>{S.tech--;const r=invRoll();if(r>=14){i.clues+=2;return `Rolled ${r}. Inside is a hand-drawn map of the warehouse floor, ruled into lanes. +2 clues.`}return `Rolled ${r}. The van was wired to a beam emitter. ${hurtRandom(2)} takes 2 damage.`}},
      {l:'Watch the van',h:'+1 clue',run:i=>{i.clues++;return 'At dusk a man in a hard hat carries a crate of mirrors inside. +1 clue.'}}]}],
};
function evOf(id){return EVENTS.find(e=>e.id===id)||Object.values(VEVENTS).flat().find(e=>e.id===id)}
function invQuality(c){const amb=S.ethos.b==='public'?2:1;return c<=amb?'ambush':c>=4?'prepared':'normal'}
const QUAL={ambush:{n:'Ambush',txt:'The villain acts first, with an extra henchman, and your heroes start scattered.'},
  normal:{n:'Standoff',txt:'Your heroes enter from the south edge. You act first.'},
  prepared:{n:'Prepared',txt:'You catch them by surprise: change gear before going in, you act first, and the villain starts with 1 wound. +1 salvage on a win.'}};
function invEvents(k){const g=shuffle(EVENTS.filter(e=>!e.cond||e.cond()).map(e=>e.id)),own=VEVENTS[k];return own?g.slice(0,2).concat(pick(own).id):g.slice(0,3)}
/* Version 82 (Tyler): clues at the start come from the Comms Array, one clue gear in the party (extra copies don't stack) and a hero field */
/* Version 87 (Tyler): each starting-clue source only comes through 70% of the time */
const START_CLUE_P=.7;
function startInv(k){const notes=[];let c0=0;
  if(S.facilities.includes('comms')){if(Math.random()<START_CLUE_P){c0++;notes.push('Comms Array: +1 clue')}else notes.push('Comms Array: nothing')}
  {const fg=fieldGear('clue')[0];if(fg){if(Math.random()<START_CLUE_P){c0++;notes.push(`${GEAR[fg.g].name}: +1 clue`)}else notes.push(`${GEAR[fg.g].name}: nothing`)}}
  if(partyHas('senses'))notes.push('Keen Senses: +2 to rolls');fieldGear('roll').forEach(({g})=>notes.push(`${GEAR[g].name}: +2 to rolls`));
  S.inv={v:k,step:0,notes,clues:c0,events:invEvents(k),res:null,intro:true,peak:0,found:[],fresh:0};S.phase='inv';S.view='mission';intelSync();
  /* Version 84 (Tyler): Signal Intercept reveals a page instead of giving a clue */
  if(partyHas('intercept')){const pg=intelPool(k).filter(f=>f.kind==='page');if(pg.length){const f=pick(pg);markSeen(k,f.id);S.inv.found.push(f);S.inv.notes.push(`${party().find(h=>BASE(h).field&&BASE(h).field.id==='intercept').name}: 1 page revealed`)}}}
/* every new clue (peak count, so lost clues are not re-earned) opens one unseen playbook page or hit reaction */
function intelPool(k){const vs=vState(k),seen=(S.seen&&S.seen[k])||[],sr=(S.seenR&&S.seenR[k])||[];
  return [...[...new Set(vs.deck.map(e=>e.id))].filter(id=>!seen.includes(id)).map(id=>({kind:'page',id})),...VINTEL[k].react.filter(r=>!sr.includes(r.id)).map(r=>({kind:'rx',id:r.id}))]}
/* Version 79 (Tyler): overflow clues are the ones past the 4 needed for Prepared; each gives +1 intel (by peak, so lost clues are not re-earned) */
const PREP_CLUES=4;
function intelSync(){const i=S.inv;if(!i)return 0;let n=0;i.ovfFresh=0;
  while(i.clues>i.peak){i.peak++;if(i.peak>PREP_CLUES){S.intel++;i.ovf=(i.ovf||0)+1;i.ovfFresh++}const pool=intelPool(i.v);if(!pool.length)continue;const f=pick(pool);if(f.kind==='page')markSeen(i.v,f.id);else markSeenR(i.v,f.id);i.found.push(f);n++}
  i.fresh=n;return n}
function markSeenR(k,id){S.seenR=S.seenR||{};const a=S.seenR[k]=S.seenR[k]||[];if(!a.includes(id))a.push(id)}
function pageOf(k,id){const vs=vState(k),e=vs.deck.filter(x=>x.id===id).sort((a,b)=>b.mk-a.mk)[0]||{id,mk:0};return buildCard(k,e,vs.level)}
function intelTile(k,f,isNew){if(f.kind==='page'){const c=pageOf(k,f.id);return `<button type="button" class="intel pg-i ${c.sig?'sigi':''} ${isNew?'new':''}" data-a="book:${k}" data-tip="vpage:${k}:${f.id}"><span class="isfx">${esc(TYPE_SFX[c.t]||'!')}</span><span><small>${c.sig?'Signature Move':'Playbook page'}</small><b>${esc(c.n)}</b></span></button>`}
  const r=rxOf(k,f.id);return `<button type="button" class="intel rx-i ${isNew?'new':''}" data-a="book:${k}" data-tip="vrx:${k}:${f.id}"><span class="isfx">${esc(r.sfx)}</span><span><small>Hit reaction</small><b>${esc(r.n)}</b></span></button>`}
const prepGear=()=>S.phase==='inv'&&S.inv&&S.inv.step>=3&&invQuality(S.inv.clues)==='prepared';

/* icon helpers (used by every screen; battle code lives in battle.js) */
const SWN={hive:'Queen',sting:'Stinger',shell:'Shell'};
const IC=(id,c='')=>`<svg class="ic${c?' '+c:''}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const VART={gallows:['#4E8F2A','#D7FF5C'],quarry:['#86684C','#FFB347'],cantor:['#6A2C91','#F1C02C'],architect:['#2F5D9E','#9FD3FF'],helios:['#E08A12','#FFF3B0'],serpent:['#1E7F6C','#F3CB4B'],lode:['#55606E','#E23B3B'],noct:['#2A2D52','#8CF0FF'],swarm:['#B07A0B','#FFE066'],bomber:['#C9402A','#FFD27A'],grid:['#1590B2','#FF2D55'],mole:['#7A4E2A','#F1C02C'],hive:['#B07A0B','#FFE066'],sting:['#B0306A','#FFE066'],shell:['#7A5AA8','#FFE066']};
const vArt=k=>VART[k]||['var(--magenta)','#F3CB4B'],vSty=k=>`--vc:${vArt(k)[0]};--ac:${vArt(k)[1]}`;
const UI=id=>IC('u-'+id,'u'),resIc=k=>k==='tech'||k==='intel'?UI(k):VART[k]?`<span class="vic" style="${vSty(k)}">${vIc(k)}</span>`:UI('salv');
const vKey=k=>k==='swarm'?'hive':k,vIc=k=>IC(VART[k]?'v-'+vKey(k):'v-any'),mIc=k=>IC(VART[k]?'m-'+k:'m-any'),pIc=p=>IC(POWERS[p]?'p-'+p:'p-any'),vWm=k=>IC(VART[k]?'v-'+vKey(k):'v-any','wm');
/* FAST: running headless (sims), RM: player asked for reduced motion. Both are read while the page loads, so they live here, not in battle.js. */
const FAST=typeof window==='undefined';
const RM=!FAST&&window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ RENDER ============ */
let lastPos={};const noFlip=new Set();
/* Version 117 (Tyler): tap an empty gear slot on a hero card to pick an armory item for it */
let slotPick=null;
const handFits=(s,G)=>G.slot!=='arms'||G.two||G.hand==='either'||G.hand===(s==='arms'?'main':'off');
const slotFits=(h,s)=>{const base=s.replace(/2$/,'');return [...new Set(S.armory)].filter(g=>GEAR[g]&&!GEAR[g].cons&&GEAR[g].slot===base&&handFits(s,GEAR[g])).sort((a,b)=>wearOK(h,b)-wearOK(h,a)||GEAR[a].req-GEAR[b].req)};
function slotPickView(){if(!slotPick)return '';const h=S.heroes.find(x=>x.id===slotPick.h);if(!h||!(S.phase==='hq'||prepGear())){slotPick=null;return ''}
  const ks=slotFits(h,slotPick.s);
  return `<div id="slotpick" role="dialog" aria-modal="true" aria-label="Equip ${esc(h.name)}"><div class="gbox"><div class="eyebrow">${esc(h.name)} · ${SLOTS[slotPick.s]} slot</div><h3 style="margin:0">Equip from the armory</h3>
    ${ks.length?ks.map(g=>{const G=GEAR[g],ok=wearOK(h,g),pl=eqPlan(h,g,slotPick.s),n=S.armory.filter(x=>x===g).length;return `<button class="btn opt t-${G.type}" data-a="equip:${h.id}:${g}:${slotPick.s}" data-tip="gear:${g}" ${ok?'':'disabled'}><span>${esc(G.name)}${n>1?` ×${n}`:''}</span><small>${ok?[modsTxt(G.mods),G.ab?G.ab.n:'',pl.out.length?`swaps out ${[...new Set(pl.out)].map(o=>GEAR[o].name).join(' and ')}`:'',G.two?'two hands':''].filter(Boolean).join(' · '):`Needs ${reqTxt(G)}`}</small></button>`}).join('')
      :`<div class="cap">Nothing in the armory fits this slot. Craft one in the Workshop on the HQ tab.</div>`}
    <div class="small muted">Long-press an item for full details.</div><button class="btn" data-a="slotpick:close">Cancel</button></div></div>`}
document.addEventListener('click',e=>{if(slotPick&&e.target.id==='slotpick'){slotPick=null;render()}});
document.addEventListener('keydown',e=>{if(slotPick&&e.key==='Escape'){slotPick=null;render()}});
function render(){tutTick();guideTick();visitTick();const app=document.getElementById('app');app.className='wrap v-'+(S.phase==='hq'&&!tutOn()?'hq-'+(S.view||'hq'):S.phase);app.innerHTML=mast()+nav()+body()+slotPickView();if(!FAST){fixDisabled(app);flip();tutPaint()}save()}
function flip(){const b=document.querySelector('.board');if(!b){lastPos={};return}const c=(b.getBoundingClientRect().width-5)/BW(),now={};
  b.querySelectorAll('[data-tid]').forEach(e=>{const id=e.dataset.tid,x=+e.dataset.cx,y=+e.dataset.cy;now[id]=[x,y];const p=lastPos[id];
    if(p&&(p[0]!==x||p[1]!==y)&&!noFlip.has(id)&&!RM){const d=Math.hypot(p[0]-x,p[1]-y);
      e.animate([{transform:`translate(${(p[0]-x)*c}px,${(p[1]-y)*c}px)`},{transform:`translate(${(p[0]-x)*c*.5}px,${(p[1]-y)*c*.5-c*.18}px)`,offset:.5},{transform:'none'}],{duration:Math.min(520,180+90*d),easing:'ease-in-out'})}});
  noFlip.clear();lastPos=now}
function mast(){return `<header class="mast"><div><small>A campaign of capes and consequences</small><h1>Blackharbor</h1></div>
  <div class="row"><span class="issue" data-tip="kw:volume">Vol. ${S.vol} · Arc ${arcOf(Math.min(S.issue,MAX_ISSUE))} · #${Math.min(S.issue,MAX_ISSUE)}</span></div>
  <div class="res" style="flex-basis:100%">
    <span class="chip trust" data-tip="kw:trust" aria-label="Trust" title="Trust">${UI('trust')}${S.trust}</span><span class="chip" data-tip="kw:techres" aria-label="Tech" title="Tech">${UI('tech')}${S.tech}</span><span class="chip" data-tip="kw:intel" aria-label="Intel" title="Intel">${UI('intel')}${S.intel}</span>
    ${Object.keys(S.salvage).filter(k=>S.salvage[k]>0||S.villains.some(v=>v.key===k)).map(k=>`<span class="chip" data-tip="kw:salvage" aria-label="${RES_NAME[k]}" title="${RES_NAME[k]} (${VILLAINS[k]?VILLAINS[k].short:''} salvage)">${resIc(k)}${S.salvage[k]}</span>`).join('')}
  </div></header>`}
function nav(){const m=S.phase!=='hq'&&S.phase!=='over';const v=S.view;
  const pend=roster().some(h=>h.pendingUp>0);
  const g=m?{}:navGlow();
  return `<nav class="nav">${m?`<button class="btn ${v==='mission'?'on':''}" data-a="view:mission">${UI('target')}Mission</button>`:`<button class="btn ${v==='hq'||v==='create'?'on':''} ${g.hq?'glow':''}" data-a="view:hq">${UI('hq')}HQ</button>`}
  <button class="btn ${v==='roster'?'on':''} ${g.roster?'glow':''}" data-a="view:roster">${UI('roster')}Roster${pend?' ★':''}</button>${m?'':`<button class="btn ${v==='villains'?'on':''} ${g.villains?'glow':''}" data-a="view:villains">${UI('mask')}Villains</button>`}</nav>`}
/* tab glow: HQ while something there can be used, Roster while there is new armory gear or a pending choice, Villains once HQ and Roster have both been opened this issue */
function visitTick(){if(S.phase!=='hq')return;if(!S.visit||S.visit.issue!==S.issue)S.visit={issue:S.issue};const v=S.view==='create'?'hq':S.view;
  if(v==='hq'||v==='roster'||v==='villains')S.visit[v]=true;if(v==='roster')S.armSeen=S.armory.slice()}
function newArmory(){const seen=(S.armSeen||[]).slice();return S.armory.some(g=>{const i=seen.indexOf(g);if(i<0)return true;seen.splice(i,1);return false})}
function hqUse(){const R=roster(),full=R.length>=ROSTER_MAX;
  if(!full&&(party().length<4||xoverOpen()))return true;
  if(Object.keys(FAC).some(k=>isUnlocked('fac:'+k)&&!S.facilities.includes(k)&&facOpen(k)&&afford(FAC[k].cost)))return true;
  if(S.facilities.includes('skunk')&&!(S.rd&&S.rd.issue===S.issue&&S.rd.free)&&Object.keys(GEAR).some(k=>!isUnlocked('gear:'+k)))return true;
  const ws=S.facilities.includes('workshop'),own=new Set([...S.armory,...R.flatMap(h=>Object.values(h.gear))]);
  return Object.keys(GEAR).some(k=>{const g=GEAR[k];if(!isUnlocked('gear:'+k)||!(ws||g.cons)||!afford(g.cost))return false;
    return g.cons?R.some(h=>wearOK(h,k)):(!own.has(k)||(g.pair&&[...S.armory,...R.flatMap(h=>Object.values(h.gear))].filter(x=>x===k).length<2))&&R.some(h=>wearOK(h,k))})}
function navGlow(){if(S.phase!=='hq'||S.view==='create')return {};const vi=S.visit&&S.visit.issue===S.issue?S.visit:{};
  return {hq:S.view!=='hq'&&hqUse(),roster:S.view!=='roster'&&(newArmory()||roster().some(h=>h.pendingUp>0)),villains:S.view!=='villains'&&!!vi.hq&&!!vi.roster&&!vi.villains}}
function body(){return bodyMain()+fsplashView()+cheatPanel()+guideModal()+tipModal()+tutModal()}
function bodyMain(){if(S.phase==='tutend')return tutEndView();if(S.over&&S.phase!=='after')return overView();if(S.view==='create'&&S.cre&&S.phase==='hq')return createView();if(S.view==='roster')return rosterView();if(S.phase==='event')return eventView();if(S.phase==='arc')return arcView();
  if(S.phase==='hq')return hqView(S.view==='villains'?'villains':null);if(S.phase==='inv')return invView();if(S.phase==='sd')return sdView();if(S.phase==='after')return afterView();return ''}

function hqView(only){if(tutOn())return tutHq(only);const arc=arcOf(S.issue),iia=(S.issue-1)%ISSUES_PER_ARC+1;
  const act=S.villains.filter(o=>o.status==='active');
  const vcard=o=>{const d=VILLAINS[o.key],seen=((S.seen&&S.seen[o.key])||[]).length;
    return `<div class="card">
    <div class="row between"><div class="row" style="flex-wrap:nowrap;gap:8px"><span class="vbadge" style="${vSty(o.key)}">${vIc(o.key)}</span><h3>${d.name}</h3></div><span class="lvl" data-tip="kw:vlevel">LVL ${o.level}</span></div>
    <div class="small muted">${d.tag}. Drops <span class="cost">${resIc(o.key)}</span>${d.salvage}. <span class="kwd" data-tip="kw:playbook">${o.deck.length}-page playbook</span>.</div>
    <button class="btn sm" data-a="book:${o.key}" style="align-self:flex-start">Read playbook · ${seen} seen</button>
    <div class="row small"><span class="eyebrow" data-tip="kw:scheme">Scheme</span><span class="meter">${[...Array(schemeMax())].map((_,i)=>`<i class="${i<o.scheme?'f':''}"></i>`).join('')}</span></div>
      ${S.guide&&party().length<4?`<button class="btn pri" data-a="inv:${o.key}" data-tip="kw:party" disabled>Needs 4 heroes · ${party().length}/4</button>`:`<button class="btn pri" data-a="inv:${o.key}" ${party().length?'':'disabled'}>Investigate</button>`}</div>`};
  const facCard=k=>{const f=FAC[k],b=S.facilities.includes(k),soon=!facOpen(k);return `<div class="card ${b?'built':''}" data-tip="fac:${k}">
    <div class="row between"><h3>${f.name}</h3>${b?'<span class="tag g">Built</span>':''}</div><div class="small">${f.txt}</div>
    ${b?'':`<div class="row between"><span class="small mono">${costHtml(f.cost)}</span><button class="btn sm" data-a="build:${k}" ${afford(f.cost)&&!soon?'':'disabled'}>${soon?`Opens in Arc ${f.arc}`:'Build'}</button></div>`}</div>`};
  const lockedCard=it=>`<div class="card locked" data-tip="${it}"><div class="row between"><h3>${itemName(it)}</h3><span class="tag" data-tip="kw:blueprint">No blueprint</span></div>${it.startsWith('gear:')?`<div class="row">${reqChips(GEAR[it.slice(5)])}<span class="small muted">${gearSlotN(GEAR[it.slice(5)])}</span></div>`:''}<div class="small muted">Unlocks from: ${unlockSources(it)}</div></div>`;
  const facNow=k=>facOpen(k)&&afford(FAC[k].cost);
  const facU=Object.keys(FAC).filter(k=>isUnlocked('fac:'+k)&&!S.facilities.includes(k)).sort((a,b)=>facNow(b)-facNow(a)),facB=Object.keys(FAC).filter(k=>S.facilities.includes(k)),facL=Object.keys(FAC).filter(k=>!isUnlocked('fac:'+k));
  const ws=S.facilities.includes('workshop');
  const canMake=k=>(ws||GEAR[k].cons)&&afford(GEAR[k].cost),wsBy=(S.ui&&S.ui.wsBy)||'vil',VK=Object.keys(VILLAINS).filter(k=>k in S.salvage),vil=g=>VK.some(v=>g.cost[v]);
  const consG={id:'cons',label:'<span class="disc fill hyb" data-tip="kw:pouch">Consumables</span>',f:g=>!!g.cons};
  const groups=wsBy==='slot'?[...Object.keys(GSLOTS).map(s=>({id:'slot-'+s,label:`<b>${GSLOTS[s]}</b>`,f:g=>g.slot===s})),consG]
    :wsBy==='disc'?[...Object.keys(TRACKS).map(t=>({id:t,label:`<span class="disc fill t-${t}" data-tip="kw:${t}">${TRACKS[t].name}</span>`,f:g=>!g.cons&&!isHybrid(g)&&g.reqs[t]})),consG,{id:'hybrid',sub:1,label:'<span class="disc fill hyb" data-tip="kw:hybrid">Hybrid</span>',f:g=>!g.cons&&isHybrid(g)}]
    :[...VK.map(v=>({id:'vil-'+v,label:`<b>${VILLAINS[v].name}</b><span class="small">${RES_NAME[v]} · ${S.salvage[v]} on hand</span>`,f:g=>!g.cons&&!!g.cost[v]})),
      {id:'vil-any',sub:1,label:'<b>Any salvage</b>',f:g=>!g.cons&&!!g.cost.any&&!vil(g)},{id:'vil-none',label:'<b>Tech &amp; Intel only</b>',f:g=>!g.cons&&!g.cost.any&&!vil(g)},consG];
  /* Version 103 (Tyler): craft cards list copies already owned, in the armory and on heroes */
  const ownedTxt=k=>{const inA=S.armory.filter(x=>x===k).length,on=roster().map(h=>[h,Object.values(h.gear).filter(x=>x===k).length+pouchOf(h).filter(x=>x===k).length]).filter(([,n])=>n);const tot=inA+on.reduce((a,[,n])=>a+n,0);
    return tot?`<div class="small owned"><b>Owned ${tot}:</b> ${[inA?`${inA} in the armory`:'',...on.map(([h,n])=>`${GEAR[k].cons?'carried':'worn'} by ${esc(h.name)}${n>1?` ×${n}`:''}`)].filter(Boolean).join(' · ')}</div>`:''};
  const craftCard=k=>{const g=GEAR[k];return `<div class="card" data-tip="gear:${k}">${gearInfo(k)}${ownedTxt(k)}
    <div class="row between"><span class="small mono">${costHtml(g.cost)}</span><button class="btn sm" data-a="craft:${k}" ${canMake(k)?'':'disabled'}>Craft</button></div>${canMake(k)?eqTo(k,true):''}</div>`};
  const wsGroup=(gr,ks)=>{ks=ks.slice().sort((a,b)=>canMake(b)-canMake(a)||GEAR[a].req-GEAR[b].req);if(!ks.length)return '';const rdy=ks.filter(canMake).length;
    const inner=gr.sub&&ks.length>8?Object.keys(GSLOTS).map(sl=>wsGroup({id:gr.id+'-'+sl,label:`<b>${GSLOTS[sl]}</b>`},ks.filter(k=>GEAR[k].slot===sl))).join(''):`<div class="grid2">${ks.map(craftCard).join('')}</div>`;
    return coll('ws-'+gr.id,`${gr.label}<span class="small muted">${ks.length} blueprint${ks.length===1?'':'s'}</span>${rdy?`<span class="tag g">${rdy} ready</span>`:''}`,inner,rdy>0&&(gr.id!=='hybrid'||ks.length<5),'nested')};
  /* Version 128 (Tyler): groups list only what you can craft now; unaffordable blueprints share one collapsed header near the bottom, above the missing blueprints */
  const gear=groups.map(gr=>wsGroup(gr,Object.keys(GEAR).filter(k=>gr.f(GEAR[k])&&isUnlocked('gear:'+k)&&canMake(k)))).join('');
  const cantK=Object.keys(GEAR).filter(k=>isUnlocked('gear:'+k)&&!canMake(k)&&groups.some(gr=>gr.f(GEAR[k])));
  const cant=cantK.length?wsGroup({id:'cant',sub:1,label:`<span class="eyebrow">Can't afford yet</span>`},cantK):'';
  const armK=[...new Set(S.armory)],armOK=g=>roster().some(h=>wearOK(h,g));
  const armG=[...Object.keys(GSLOTS),'pouch'].map(sl=>{const ks=armK.filter(g=>GEAR[g].slot===sl).sort((a,b)=>armOK(b)-armOK(a));if(!ks.length)return '';const n=S.armory.filter(g=>GEAR[g].slot===sl).length,rdy=ks.filter(armOK).length;
    return coll('arm-'+sl,`<span class="eyebrow">${slotN(sl)} · ${n}</span>${rdy?`<span class="tag g">${rdy} wearable</span>`:''}`,`<div class="grid2">${ks.map(g=>{const n=S.armory.filter(x=>x===g).length;return `<div class="card" data-tip="gear:${g}">${gearInfo(g)}<span class="small muted">${n>1?`${n} in stock`:'Ready to equip'}${armOK(g)?'':' · nobody can use it yet'}</span>${eqTo(g,false)}</div>`}).join('')}</div>`,true,'nested')}).join('');
  const wsTabs=`<div class="row small"><span class="eyebrow">Craft new gear · group by</span>${[['vil','Villain salvage'],['disc','Discipline'],['slot','Slot']].map(([k,l])=>`<button class="btn sm ${wsBy===k?'pri':''}" data-a="wsby:${k}">${l}</button>`).join('')}</div>
    <div class="row small"><span class="eyebrow">Paying any salvage</span>${[['0','Ask me which'],['1','Use my biggest pile']].map(([k,l])=>`<button class="btn sm ${(S.anyAuto?'1':'0')===k?'pri':''}" data-a="anyauto:${k}">${l}</button>`).join('')}</div>`;
  const gearL=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k)).sort((a,b)=>GEAR[a].req-GEAR[b].req);
  const rTop=!roster().length||(S.guide&&S.guide.s<=1);
  if(only==='villains')return `${guideBar()}<section class="panel">${coll('vl-cases',`<div><div class="eyebrow">Volume ${S.vol} · Arc ${arc} of ${ARCS} · Issue ${iia} of ${ISSUES_PER_ARC}</div><h2>Case files</h2></div>`,
    `<div class="steps" data-tip="kw:arc">${[...Array(ISSUES_PER_ARC)].map((_,i)=>`<span class="${i<iia-1?'f':''}"></span>`).join('')}</div>
    <div class="cap tilt">${arc<ARCS?`When this arc ends, every free villain levels up and rewrites part of their playbook, and a new villain arrives.`:'Final arc. When it ends, two villains team up for the event comic finale.'} Villains you don't hunt keep scheming. Long-press any stat, item or keyword for details.</div>
    <div class="row small"><span class="eyebrow" data-tip="kw:party">Party</span>${party().map(h=>`<span class="tag g">${esc(h.name)}</span>`).join('')||'<span class="tag">Empty</span>'}<button class="btn sm" data-a="view:roster">Change party</button></div>
    <div class="grid2">${act.map(vcard).join('')}</div>
    ${!S.villains.length?'<p class="cap">Recruit four heroes to reveal the three opening villains. The threats will match your team’s disciplines.</p>':''}
    ${S.villains.length&&S.pool.length?`<p class="small muted" style="margin:0">${S.pool.length} more villain${S.pool.length>1?'s':''} will surface later in this volume.</p>`:''}`)}</section>
  `;
  const fl=S.flash;S.flash=null;
  return `${guideBar()}${fl?`<div class="cap tilt"><b>Fresh off the press!</b> ${esc(fl)}</div>`:''}<div class="hqcols"><div class="hqa">${recruitPanel()}
  ${skunkPanel()}
  <section class="panel">${coll('hq-base',`<div><div class="eyebrow">Headquarters · ${S.facilities.length} built</div><h2>Base development</h2></div>`,
    `${facU.length?`<div class="grid2">${facU.map(facCard).join('')}</div>`:'<p class="small muted" style="margin:0">Every facility blueprint on file is built.</p>'}
    ${facB.length?coll('hq-facb',`<span class="eyebrow">Built · ${facB.length}</span>`,`<div class="grid2">${facB.map(facCard).join('')}</div>`,false,'nested'):''}
    ${facL.length?coll('hq-facl',`<span class="eyebrow" data-tip="kw:blueprint">Missing facility blueprints · ${facL.length}</span>`,`<div class="grid2">${facL.map(k=>lockedCard('fac:'+k)).join('')}</div>`,false,'nested'):''}`)}</section>
  ${S.chronicle.length?`<section class="panel">${coll('hq-back',`<div class="eyebrow">Back issues · ${S.chronicle.length}</div>`,`<ul class="lines small">${S.chronicle.slice().reverse().map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`,false)}</section>`:''}</div><div class="hqb">
  <section class="panel">${coll('hq-ws',`<div><div class="eyebrow">Workshop</div><h2>Gear from salvage</h2></div>`,
    `${ws?'':'<p class="small muted" style="margin:0">Build the Workshop to craft gear. Consumables can be bought without it.</p>'}
    <p class="small muted" style="margin:0">Each item fills one body slot and needs the listed discipline ranks to equip. Gear costs only salvage, and higher-rank gear costs more. Tech abilities spend Power, Magic spells spend Arcana, and Innate abilities require Innate rank. Hybrid gear needs ranks in more than one discipline. "Any salvage" can be paid from any villain's salvage.</p>
    ${wsFind(canMake,craftCard)}
    ${coll('ws-browse',`<span class="eyebrow">Browse the armory and every blueprint</span>`,`${S.armory.length?coll('ws-arm',`<span class="eyebrow">In the armory · ${S.armory.length}</span>`,armG,true,'nested'):''}
    ${wsTabs}${gear||'<p class="small muted" style="margin:0">Nothing you can afford to craft right now.</p>'}${cant}
    ${gearL.length?coll('hq-gearl',`<span class="eyebrow" data-tip="kw:blueprint">Missing gear blueprints · ${gearL.length}</span>`,`<div class="grid2">${gearL.map(k=>lockedCard('gear:'+k)).join('')}</div>`,false,'nested'):''}`,false,'nested')}`)}</section>
  </div></div>`}
function arcView(){const a=S.arcInfo;return `<section class="panel"><div class="eyebrow">Volume ${S.vol}</div><div><span class="sfxhead">Arc ${a.arc} begins!</span></div>
  <div class="cap tilt">Time passes. The villains still at large grow stronger and rewrite their playbooks.</div>
  ${coll('arc-lines','<span class="eyebrow">What changed · '+a.lines.length+'</span>',`<ul class="lines">${a.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`)}<button class="btn pri" data-a="arcnext">Begin issue #${S.issue}</button></section>`}
function rosterView(){const p=party(),b=bench(),atHQ=S.phase==='hq',fl=S.flash;S.flash=null;
  return `${guideBar()}${fl?`<div class="cap tilt"><b>Fresh off the press!</b> ${esc(fl)}</div>`:''}<section class="panel">${coll('ro-party',`<div><div class="eyebrow" data-tip="kw:party">Active party · ${p.length}/4</div><h2>Party</h2></div>`,
    `<p class="small muted" style="margin:0">${prepGear()?'You caught the villain by surprise: gear can be changed before entering the lair.':atHQ?'Only the party goes on missions and investigations. Benched heroes train and recover: full health and +1 XP every issue.':'The party can be changed at HQ between issues.'}</p>
    ${p.length?`<div class="grid2">${p.map(h=>heroCard(h,'party')).join('')}</div>`:'<div class="cap">The party is empty. Add heroes from the bench before the next mission.</div>'}`)}</section>
  <section class="panel">${coll('ro-bench',`<div><div class="eyebrow">Reserves · ${b.length}</div><h2>Bench</h2></div>`,`${b.length?'':'<p class="small muted" style="margin:0">Nobody on the bench.</p>'}<div class="grid2">${b.map(h=>heroCard(h,'bench')).join('')}</div>${atHQ&&roster().length<ROSTER_MAX?'<div class="row"><button class="btn sm" data-a="view:hq">Recruit more heroes at HQ</button></div>':''}`)}</section>
  ${S.fallen.length?`<p class="small muted" style="margin:0">Retired: ${S.fallen.map(esc).join(', ')}</p>`:''}`}
/* passive gear effects, one line each */
function gearExtra(g){const o=[];if(g.two)o.push('<b>Two-handed:</b> fills both the Main Hand and the Off Hand.');else if(g.hand==='main')o.push('<b>Main Hand</b> weapon.');else if(g.hand==='off')o.push('<b>Off Hand</b> item.');
  if(g.pair)o.push(`<b>Paired:</b> goes in either hand. Hold one in each hand and both count in full${g.pair.fx||Object.values(g.pair.mods||{}).some(Boolean)?`, plus ${g.pair.txt}`:''}.`);
  if(g.pain)o.push(`<b>Pain into ${TRACKS[g.pain].res}:</b> regain 1 ${TRACKS[g.pain].res} whenever you take damage.`);
  if(g.relent)o.push('<b>Relentless:</b> +1 die on attacks against a villain you also attacked last round.');
  if(g.riposte)o.push('<b>Riposte:</b> once per round, when the villain misses you and is within your range, strike back with a free 1-die attack.');
  if(g.rescue)o.push('<b>Lifeline:</b> each civilian you get out through an exit restores 1 Power or 1 Arcana, or 2 health if neither is missing.');
  if(g.aura)o.push(`<b>Aura:</b> you and allies within ${AURA_R} hexes get ${modsTxt(g.aura)}.`);if(g.auraFx)o.push(`<b>Aura, ${AURA_FX[g.auraFx].n}:</b> you and allies within ${AURA_R} hexes ${AURA_FX[g.auraFx].txt}.`);return o}
function gearInfo(k){const g=GEAR[k];return `${g.set?`<span class="settag" data-tip="kw:set">${esc(VILLAINS[g.set].name)} set</span>`:''}<div class="row between"><h3>${g.name}</h3><span class="row" style="gap:4px">${reqChips(g)}</span></div>
  <div class="small"><span class="eyebrow">${gearSlotN(g)}${g.pair?' · paired':''}</span> · ${g.cons?'Consumable · one use, then it is gone':(modsTxt(g.mods)||'No passive bonus')+(gearPoolTxt(g)?' · '+gearPoolTxt(g):'')}</div>
  ${g.ab?`<div class="small t-${g.type}"><b style="color:var(--tc)">${g.ab.n} · ${abCost(g)}.</b> ${abTxt(g.ab)}</div>`:''}
  ${g.jumps?'<div class="small" data-tip="kw:jumps"><b>All your moves are jumps.</b></div>':''}${gearExtra(g).map(t=>`<div class="small">${t}</div>`).join('')}
  ${g.field?`<div class="small"><span class="disc t-${g.type}" data-tip="kw:fieldgear">Out of combat</span> ${g.field.txt}</div>`:''}${g.set?setFoot(g.set):''}`}
/* set footer on a set item: the bonus, and how many pieces each hero on the roster wears */
function setFoot(k){const w=roster().map(h=>[h,setCount(h,k)]).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  return `<div class="small setfoot"><b class="sn">${SETS[k].n}</b> <span class="muted">(${SET_N} pieces)</span> ${SETS[k].txt}<br><span class="muted">${w.length?'Wearing: '+w.map(([h,n])=>`${esc(h.name)} ${n}/${SET_N}${n>=SET_N?' ✓':''}`).join(', '):'Nobody is wearing this set yet.'}</span></div>`}
function setRows(h){const ks=[...new Set(Object.values(h.gear).map(g=>GEAR[g]&&GEAR[g].set).filter(Boolean))];if(!ks.length)return '';
  return `<div class="setrows">${ks.map(k=>{const n=setCount(h,k),on=n>=SET_N,id=`set-${h.id}-${k}`,left=SET_N-n;
    return `<details class="setp ${on?'on':''}" data-cid="${id}" ${uiOpen(id,false)?'open':''}><summary><span class="settag">${esc(VILLAINS[k].name)}</span><span class="sn">${SETS[k].n}</span><span class="setpips">${[...Array(Math.max(SET_N,n))].map((_,i)=>`<i class="${i<n?'f':''}"></i>`).join('')}</span><span class="mono small">${n}/${SET_N}</span>${on?'<span class="small sn">Active</span>':''}</summary><div class="small">${on?'':`Wear ${left} more piece${left>1?'s':''} to unlock: `}${SETS[k].txt}</div></details>`}).join('')}</div>`}
function heroCard(h,where){const b=BASE(h),mx=stat(h,'maxHp'),mc=stat(h,'maxComp'),p=POWERS[b.power];
  if(h.pendingUp>0&&h.trackPick&&!h.upChoices){h.upChoices=shuffle(Object.keys(UPG).filter(k=>k!=='range'||stat(h,'range')>1)).slice(0,3)}
  const ranks=Object.keys(TRACKS).map(t=>`<span class="disc t-${t} ${h.ranks[t]?'fill':''}" data-tip="kw:${t}">${TRACKS[t].name} ${h.ranks[t]}</span>`).join('');
  const res=poolTxt(h);if(h.pendingUp>0&&!h.trackPick&&Object.keys(TRACKS).every(t=>h.ranks[t]>=RANK_MAX))h.trackPick='none';
  const atHQ=S.phase==='hq',gearOK=atHQ||prepGear();
  const slots=Object.keys(SLOTS).map(s=>{const g=h.gear[s],tw=s==='arms2'&&h.gear.arms&&GEAR[h.gear.arms].two;if(tw)return `<div class="slot has t-${GEAR[h.gear.arms].type}" data-tip="gear:${h.gear.arms}"><span class="sl">${SLOTS[s]}</span><span class="muted">${GEAR[h.gear.arms].name} (two hands)</span></div>`;return g?`<div class="slot has t-${GEAR[g].type}" data-tip="gear:${g}"><span class="sl">${SLOTS[s]}</span><span>${GEAR[g].name}</span>${gearOK?`<button class="btn sm" data-a="unequip:${h.id}:${s}">Remove</button>`:''}</div>`
    :gearOK?(()=>{const n=slotFits(h,s).filter(g=>wearOK(h,g)).length;return `<button type="button" class="slot pick" data-a="slotpick:${h.id}:${s}"><span class="sl">${SLOTS[s]}</span><span class="muted">Empty · ${n?`tap to equip (${n} fit${n===1?'s':''})`:'nothing fits yet'}</span></button>`})()
    :`<div class="slot"><span class="sl">${SLOTS[s]}</span><span class="muted">Empty</span></div>`}).join('');
  const efr=gearOK&&S.armory.length?eqFilter(h):null,avail=efr?efr.ks:[];
  const lvlUp=h.pendingUp>0?(!h.trackPick?`<div class="cap"><b>Level up!</b> Which discipline does ${esc(h.name)} grow into?</div>
    <div class="grid2">${Object.entries(TRACKS).map(([t,d])=>{const n=h.ranks[t],mx=n>=RANK_MAX,nx=n+1,pk=nx===1&&t===b.track?'':perkTxt(t,nx),gn=gainTxt(h,t);return `<button class="btn opt t-${t}" data-a="track:${h.id}:${t}" data-tip="kw:${t}" style="border-color:var(--tc)" ${mx?'disabled':''}><span style="color:var(--tc)">${d.name} ${n} → ${mx?'mastered':nx}${nx===RANK_MAX?' · Capstone':''}</span><small>${mx?`Already at the rank ${RANK_MAX} cap.`:[pk&&`Capstone: ${pk}`,gn&&`Engine: ${gn}`,`Opens ${d.name} ${nx} gear`].filter(Boolean).join('. ')+'.'}</small></button>`}).join('')}</div>`
    :`<div class="cap"><b>${TRACKS[h.trackPick]?`${TRACKS[h.trackPick].name} rank gained.`:'Every discipline is mastered.'}</b> Now choose one upgrade:</div><div class="row">${h.upChoices.map(k=>`<button class="btn sm pri" data-a="up:${h.id}:${k}" data-tip="upg:${k}">${UPG[k].name}</button>`).join('')}</div>`):'';
  const SK={HP:'hp',MOV:'move',DICE:'speed',ACC:'acc',STR:'str',EVA:'eva',RNG:'range',COMP:'comp'},SI={HP:'hp',MOV:'move',DICE:'dice',ACC:'acc',STR:'str',EVA:'eva',RNG:'rng',COMP:'comp'};
  const st=[['HP',`${h.hp}/${mx}`],['MOV',stat(h,'move')],['DICE',stat(h,'speed')],['ACC',(stat(h,'acc')<0?'':'+')+stat(h,'acc')],['STR',(stat(h,'str')<0?'':'+')+stat(h,'str')],['EVA',stat(h,'eva')],['RNG',stat(h,'range')],['COMP',mc]];
  return `<div class="card"><details class="coll" data-cid="h-${h.id}" ${uiOpen('h-'+h.id,true)?'open':''}><summary><div class="row"><span class="vic" style="--vc:${b.col}">${pIc(b.power)}</span><h3>${esc(h.name)}</h3><span class="lvl" data-tip="kw:xp">LVL ${lvlOf(h)}</span>${h.est?'<span class="tag" data-tip="kw:established">Established</span>':''}<span class="small mono muted" data-tip="kw:hp">HP ${h.hp}/${mx}</span>${b.field?'<span class="tag g" data-tip="kw:field">Field</span>':''}${h.pendingUp?'<span class="tag" data-tip="kw:levelup">Level up!</span>':''}</div></summary><div class="cbody">
  ${atHQ&&where==='party'?`<div class="row"><button class="btn sm" data-a="bench:${h.id}">Move to bench</button></div>`:''}${atHQ&&where==='bench'?(party().length<4?`<div class="row"><button class="btn sm pri" data-a="join:${h.id}">Join the party</button></div>`:`<div class="row"><span class="eyebrow">Swap in for</span>${party().map(o=>`<button class="btn sm" data-a="swap:${h.id}:${o.id}">${esc(o.name)}</button>`).join('')}</div>`):''}
  <div class="small muted">${esc(b.role)}${h.name!==b.name?` · carries the ${esc(b.name)} mantle`:''}</div>${h.origin?`<div class="small muted" data-tip="kw:origin">Origin: ${esc(h.origin.join(' · '))}</div>`:''}
  <div class="row">${ranks}</div>
  <div class="small muted" data-tip="kw:engines">Combat engines: ${res}</div>
  <div class="bar" data-tip="kw:hp"><i style="width:${100*h.hp/mx}%"></i></div><div class="bar c" data-tip="kw:comp"><i style="width:${100*h.comp/mc}%"></i></div>
  <div class="stats ico">${st.map(([k,v])=>`<div class="stat" data-tip="kw:${SK[k]}" title="${k}" aria-label="${k} ${v}">${UI(SI[k])}<b>${v}</b></div>`).join('')}</div>
  <div class="small" data-tip="pow:${b.power}"><b>${p.name}.</b> ${p.txt}</div>
  ${b.field?`<div class="small fieldab" data-tip="kw:field"><b>${b.field.n}</b> <span class="disc t-${b.track}">Field</span> ${b.field.txt}</div>`:''}
  <div class="row small"><span class="eyebrow" data-tip="kw:xp">XP</span><span class="meter">${[...Array(xpNeed(h))].map((_,i)=>`<i class="${i<h.xp?'f':''}"></i>`).join('')}</span><span class="mono">${h.xp}/${xpNeed(h)}</span></div>
  ${h.injuries.length?`<div class="row">${h.injuries.map(i=>`<span class="tag" data-tip="inj:${i}">${INJ[i].name}</span>`).join('')}</div>`:''}
  <div class="eyebrow" data-tip="kw:slot">Gear</div><div class="slots">${slots}</div>${pairOf(h)?`<div class="small" data-tip="kw:paired"><b>Paired ${GEAR[pairOf(h)].name}s:</b> ${GEAR[pairOf(h)].pair.txt}. Both weapons' own stats count in full.</div>`:''}${setRows(h)}
  <div class="row small"><span class="eyebrow" data-tip="kw:pouch">Pouch ${pouchOf(h).length}/${POUCH_MAX}</span>${pouchOf(h).map((g,i)=>`<span class="tag g" data-tip="gear:${g}">${GEAR[g].name}</span>${gearOK?`<button class="btn sm" data-a="unpouch:${h.id}:${i}">Remove</button>`:''}`).join('')||'<span class="muted">Empty. Consumables from the armory go here.</span>'}</div>
  ${efr?`<div class="eyebrow">Equip from the armory</div>${efr.bar}`:''}${avail.length?`<div class="row">${avail.map(g=>{const ok=wearOK(h,g),G=GEAR[g];return `<button class="btn sm" data-a="equip:${h.id}:${g}" data-tip="gear:${g}" ${ok?'':'disabled'} title="${ok?'':`Needs ${reqTxt(G)}`}">+ ${G.name} <span class="muted">(${G.cons?`pouch ${pouchOf(h).length}/${POUCH_MAX}`:gearSlotN(G)}${ok?'':G.cons?', full':`, needs ${reqTxt(G)}`})</span></button>`}).join('')}</div>`:''}
  ${lvlUp}
  </div></details></div>`}


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
          <div class="inv-villain-emblem">${vIc(i.v)}</div>
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
      <p class="inv-story">${QUAL[q].txt}</p>
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

/* ============ ORIGIN STORY VIEWS ============ */
const O_STATS=[['HP','maxHp'],['MOV','move'],['DICE','speed'],['ACC','acc'],['STR','str'],['EVA','eva'],['RNG','range'],['COMP','maxComp']];
const O_SK={maxHp:'hp',move:'move',speed:'speed',acc:'acc',str:'str',eva:'eva',range:'range',maxComp:'comp'};
const TRACK_HOW={tech:'Abilities spend Power, a pool of your Tech rank + 1 for each Tech item you wear that slowly recharges during a fight. Every Tech item has an ability.',
  innate:'Abilities spend nothing but require a minimum Innate rank (1 at the start), and you fire one per round. Many grow with your Innate rank.',
  magic:'Spells spend Arcana, a pool of your Magic rank + the Magic rank each item you wear requires that does not refill during a fight. Spells hit harder, and every Magic weapon carries one.'};
const trackTxt=t=>`${TRACKS[t].name} discipline: ${TRACK_HOW[t]} Ranks go up to ${RANK_MAX}, and rank ${RANK_MAX} is a capstone: ${perkTxt(t,RANK_MAX)}.`;
function oMech(sid,o,c){
  if(sid==='life')return o.field?`Field ability, ${FIELD_AB[o.field].n}: ${FIELD_AB[o.field].txt}`:`${modsTxt(o.mods)}.`;
  if(sid==='spark')return `${modsTxt(o.mods)}. ${trackTxt(o.track)}`;
  if(sid==='gift')return `Signature power, ${POW_ENG[o.power].d==='innate'?'':'costs '}${powCost(o.power)}. ${POWERS[o.power].txt}`;
  if(sid==='style')return `Range ${o.range} (${o.range>1?'attacks from a distance':'melee, must be adjacent'}). ${modsTxt(o.mods)}.`;
  if(sid==='drive')return `${modsTxt(o.mods)}.`;
  if(sid==='career'){const L=xArc()+1+(o.lvl||0);return `Arrives at level ${L}, with ${1+(o.gear||0)} gear pick${o.gear?'s':''} and ${1+(o.hq||0)} HQ bonus${o.hq?'es':''}.`}
  if(sid==='training'){const r=oRanks({...c,picks:{...c.picks,training:o.id}});return `Ends with ${Object.keys(TRACKS).filter(t=>r[t]).map(t=>`${TRACKS[t].name} ${r[t]}`).join(' · ')}. Every rank opens higher gear; rank 5 adds a capstone. Tech and Magic ranks add 2 to their pool, Innate ranks unlock and strengthen Innate abilities. Ranks cap at ${RANK_MAX}.`}
  if(sid==='hq')return o.txt;
  return ''}
function oHero(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover';const h={...newHero('custom',b.name,b),ranks:r.ranks,upgrades:xo?c.ups.slice():[],gear:{}};if(xo)c.gear.forEach(g=>putGear(h,g));return h}
function oPreview(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover',h=oHero(c);
  const st=O_STATS.map(([l,k])=>{const v=stat(h,k),d=v-O_TEMPLATE[k];return `<div class="stat ${d>0?'up':d<0?'dn':''}" data-tip="ostat:${k}"><b>${(k==='acc'||k==='str')&&v>=0?'+':''}${v}</b><span>${l}</span></div>`}).join('');
  const sp=oOpt('spark',c.picks.spark),gift=oOpt('gift',c.picks.gift);
  return `<aside class="card opv"><div class="eyebrow">The hero so far</div>
    <div class="row"><span class="sw" style="background:${c.col};border-radius:50%;width:16px;height:16px"></span><h3>${esc(b.name)}</h3><span class="lvl">LVL ${r.level}</span></div>
    <div class="small muted">${esc(b.role)}</div>
    ${sp?`<div class="row">${Object.keys(TRACKS).filter(t=>r.ranks[t]).map(t=>`<span class="disc fill t-${t}" data-tip="kw:${t}">${TRACKS[t].name} ${r.ranks[t]}</span>`).join('')}</div>`:''}
    ${sp?`<div class="small muted" data-tip="kw:engines">Engines: ${poolTxt(h)}</div>`:''}
    <div class="stats">${st}</div>
    ${gift?`<div class="small" data-tip="pow:${gift.power}"><b>${POWERS[gift.power].name}.</b> ${POWERS[gift.power].txt}</div>`:''}
    ${b.field?`<div class="small fieldab" data-tip="kw:field"><b>${b.field.n}</b> ${b.field.txt}</div>`:''}
    ${xo&&c.gear.length?`<div class="small"><b>Gear:</b> ${c.gear.map(g=>GEAR[g].name).join(', ')}</div>`:''}
    <p class="small muted" style="margin:0">Long-press a stat to see where it came from.</p></aside>`}
function createView(){const c=S.cre,steps=oSteps(c),sid=steps[c.step],pg=ORIGIN[sid],xo=c.mode==='xover',last=c.step===steps.length-1;
  const strip=`<div class="ostrip">${steps.map((s,i)=>`<span class="${i<c.step?'f':i===c.step?'cur':''}" title="${ORIGIN[s].t}"></span>`).join('')}</div>`;
  const head=`<div class="ohead ${xo?'xo':''}"><small>${xo?'Crossover Issue · Established Character':'Origin Story · Basic hero'} · Page ${c.step+1} of ${steps.length}</small>${strip}</div>`;
  const navb=`<div class="row between"><button class="btn" data-a="${c.step?'oback':'ocancel'}">${c.step?'Back':'Cancel'}</button>${last?'':`<button class="btn pri" data-a="onext" ${oValid(c,sid)?'':'disabled'}>${steps[c.step+1]==='cover'?'See the cover':'Next page'}</button>`}</div>`;
  if(sid==='cover')return `<section class="panel ocomic">${head}${oCover(c)}${navb}</section>`;
  const optBtn=(o,sel,mech,extra='')=>`<button class="btn opt oopt ${sel?'sel':''}" data-a="opick:${sid}:${o.id}" data-tip="oopt:${sid}:${o.id}" ${extra}><span class="on">${esc(o.n)}</span>${o.fl?`<i class="fl">“${esc(o.fl)}”</i>`:''}<small class="mech">${mech}</small></button>`;
  let inner='';
  if(sid==='spark'){const sp=oOpt('spark',c.picks.spark),d=c.disc||(sp&&sp.track);
    inner=`<div class="eyebrow">First, pick a discipline</div><div class="ogrid odisc">${Object.keys(TRACKS).map(t=>`<button class="btn opt oopt t-${t} ${d===t?'sel':''}" data-a="odisc:${t}" data-tip="kw:${t}"><span class="on" style="color:var(--tc)">${TRACKS[t].name}</span><small class="mech">${trackTxt(t)}</small><small>${O_POW[t].length} powers: ${O_POW[t].map(p=>POWERS[p].name).join(', ')}</small></button>`).join('')}</div>
    ${d?`<div class="eyebrow">Then, how it happened</div><div class="ogrid">${pg.opts.filter(o=>o.track===d).map(o=>optBtn(o,c.picks.spark===o.id,oMech(sid,o,c))).join('')}</div>`:''}`}
  else if(['life','style','drive','career'].includes(sid))inner=`<div class="ogrid">${pg.opts.map(o=>optBtn(o,c.picks[sid]===o.id,oMech(sid,o,c))).join('')}</div>`;
  else if(sid==='gift'){const sp=oOpt('spark',c.picks.spark);inner=`<p class="small muted" style="margin:0">These are the ${O_POW[sp.track].length} <b class="t-${sp.track}" style="color:var(--tc)">${TRACKS[sp.track].name}</b> powers. Go back a page to see another discipline's. Free powers don't use your action. Tech powers spend Power, Magic powers spend Arcana, and Innate powers require Innate rank and use the hero's one Innate ability for the round.</p><div class="ogrid">${O_POW[sp.track].map(id=>optBtn(oOpt('gift',id),c.picks.gift===id,oMech('gift',oOpt('gift',id),c))).join('')}</div>`}
  else if(sid==='training'){const ex=oLevel(c)-1;inner=`<p class="small muted" style="margin:0">They arrive at level ${oLevel(c)}: ${ex} rank${ex===1?'':'s'} beyond the first.</p><div class="ogrid">${oTrainOpts(c).map(o=>optBtn(o,c.picks.training===o.id,oMech('training',o,c))).join('')}</div>`}
  else if(sid==='moves'){const need=oLevel(c)-1,rng=oOpt('style',c.picks.style).range>1;
    inner=`<div class="row"><span class="chip"><b>Picked</b>${c.ups.length}/${need}</span>${c.ups.map((u,i)=>`<button class="btn sm" data-a="ounup:${i}" title="Remove">${UPG[u].name} ✕</button>`).join('')}</div>
    <div class="ogrid">${Object.keys(UPG).filter(k=>k!=='range'||rng).map(k=>{const n=c.ups.filter(u=>u===k).length;return `<button class="btn opt oopt ${n?'sel':''}" data-a="oup:${k}" data-tip="upg:${k}" ${c.ups.length>=need||n>=2?'disabled':''}><span class="on">${UPG[k].name}${n?` ×${n}`:''}</span><small class="mech">Permanently gives ${modsTxt(UPG[k].mods)}. Up to 2 times.</small></button>`}).join('')}</div>`}
  else if(sid==='gear'){const r=oRanks(c),max=oGearMax(c),ks=Object.keys(GEAR).filter(k=>isUnlocked('gear:'+k)&&!GEAR[k].cons&&!GEAR[k].set&&canWearR(r,k)).sort((a,b)=>GEAR[b].req-GEAR[a].req);
    inner=`<div class="row"><span class="chip"><b>Picked</b>${c.gear.length}/${max}</span><span class="small muted">One item per slot. Only blueprints you have unlocked and they can wear are shown.</span></div>
    ${ks.length?`<div class="ogrid">${ks.map(k=>{const sel=c.gear.includes(k),clash=!sel&&c.gear.some(g=>GEAR[g].slot===GEAR[k].slot);return `<button class="btn opt oopt t-${GEAR[k].type} ${sel?'sel':''}" data-a="ogear:${k}" data-tip="gear:${k}" ${!sel&&(c.gear.length>=max||clash)?'disabled':''}>${gearInfo(k)}</button>`}).join('')}</div>`:'<div class="cap">No unlocked blueprint fits them yet. They arrive empty-handed.</div>'}`}
  else if(sid==='hq'){const max=oHqMax(c);inner=`<div class="row"><span class="chip"><b>Picked</b>${c.hq.length}/${max}</span></div><div class="ogrid">${oHqOpts().map(o=>{const sel=c.hq.includes(o.id);return optBtn(o,sel,o.txt,!sel&&c.hq.length>=max?'disabled':'').replace(`data-a="opick:hq:${o.id}"`,`data-a="ohq:${o.id}"`)}).join('')}</div>`}
  else if(sid==='mask')inner=`<label class="oname"><span class="eyebrow">Codename</span><input id="oname" maxlength="18" autocomplete="off" value="${esc(c.name)}" placeholder="Type or pick a name"></label>
    <div class="row"><button class="btn sm" data-a="orand">${c.sugg?'More ideas':'Suggest codenames'}</button>${(c.sugg||[]).map((n,i)=>`<button class="btn sm ${c.name===n?'on':''}" data-a="osug:${i}">${esc(n)}</button>`).join('')}</div>
    <div class="eyebrow">Costume color</div><div class="row">${O_COLS.map(col=>`<button class="oswatch ${c.col===col?'sel':''}" data-a="ocol:${col}" style="background:${col}" aria-label="Color ${col}"></button>`).join('')}</div>`;
  return `<section class="panel ocomic">${head}<div><span class="sfxhead osfx">${pg.t}</span></div>${pg.cap?`<div class="cap tilt">${pg.cap}</div>`:''}
    <div class="obody"><div class="ocol">${inner}</div>${oPreview(c)}</div>${navb}</section>`}
function oCover(c){const r=oBuild(c),b=r.base,xo=c.mode==='xover',gift=POWERS[b.power];
  const h=oHero(c);
  const st=O_STATS.map(([l,k])=>`<div><b>${(k==='acc'||k==='str')&&stat(h,k)>=0?'+':''}${stat(h,k)}</b><span>${l}</span></div>`).join('');
  const story=['life','spark','gift','style','drive'].concat(xo?['career','training']:[]).map(s=>{const o=s==='training'?oTrainOpts(c).find(x=>x.id===c.picks.training):oOpt(s,c.picks[s]);return o?`<li><b>${ORIGIN[s].t}:</b> ${esc(o.n)}. <span class="muted">${oMech(s,o,c)}</span></li>`:''}).join('');
  return `<div class="ocover" style="--hc:${c.col}"><small>${xo?'Special crossover issue':'Blackharbor presents'} · Issue #1</small><b>${esc(b.name)}</b><span class="ctag">${esc(b.role)}</span>
    <div class="ocstats">${st}</div><div class="small"><b>${gift.name}:</b> ${gift.txt}</div>${b.field?`<div class="small"><b>${b.field.n}:</b> ${b.field.txt}</div>`:''}
    <div class="row">${Object.keys(TRACKS).filter(t=>r.ranks[t]).map(t=>`<span class="disc fill t-${t}">${TRACKS[t].name} ${r.ranks[t]}</span>`).join('')}<span class="lvl">LVL ${r.level}</span></div></div>
    ${coll('o-story','<span class="eyebrow">The story so far</span>',`<ul class="lines small">${story}</ul>`)}
    ${xo?`<div class="card"><div class="small"><b>Signature moves:</b> ${c.ups.map(u=>UPG[u].name).join(', ')||'none'}</div><div class="small"><b>Gear:</b> ${c.gear.map(g=>GEAR[g].name).join(', ')||'none'}</div><div class="small"><b>Brings to HQ:</b> ${c.hq.map(id=>(oHqOpts().find(o=>o.id===id)||{n:id}).n).join(', ')}</div></div>`
      :'<p class="small muted" style="margin:0">Basic heroes are free. They start at level 1 with no gear and change nothing at HQ.</p>'}
    ${recruitXpTxt()}<button class="btn pri obig" data-a="ofinish">Print it! ${esc(b.name)} joins the team</button>`}
function qbCard(k){const b=HERO_BASE[k];return `<div class="card" data-tip="qb:${k}"><div class="row between"><h3>${b.name}</h3><span class="disc fill t-${b.track}">${TRACKS[b.track].name}</span></div>
  <div class="small muted">${b.role} · ${POWERS[b.power].name}${b.field?` · ${b.field.n}`:''}</div>
  <div class="small" data-tip="kw:engines">${poolTxt(newHero(k))} <span class="muted">(veteran: ${POOL_BONUS_TXT[b.track]})</span></div>
  <div class="small mono">HP ${b.maxHp} · MOV ${b.move} · DICE ${b.speed} · ACC +${b.acc} · STR +${b.str} · EVA ${b.eva} · RNG ${b.range}</div>${recruitXpTxt()}
  <button class="btn sm" data-a="qb:${k}" ${roster().length>=ROSTER_MAX?'disabled':''}>Recruit ${b.name}</button></div>`}
/* ============ NEW-VOLUME GUIDE ============ */
/* S.guide only exists on volumes started after this update: s 0 splash, 1 team, 2 base, 3 gear, 4 roster. pop names the step a pop-up is suggesting. */
function equipHero(h,g,pref){const i=S.armory.indexOf(g),G=GEAR[g];if(i<0||!wearOK(h,g))return false;
  if(G.cons){S.armory.splice(i,1);pouchOf(h).push(g);if(S.guide)S.guide.eq=true;return true}
  S.armory.splice(i,1);putGear(h,g,pref).forEach(o=>S.armory.push(o));if(G.mods.maxHp)h.hp+=G.mods.maxHp;clampHero(h);if(S.guide)S.guide.eq=true;return true}
function eqTo(g,craft){const G=GEAR[g],hs=[...party(),...bench()];if(!hs.length)return '<button class="btn sm" disabled title="Recruit a hero first">Equip to…</button>';
  return `<details class="eqto"><summary class="btn sm">${craft?'Craft &amp; equip to…':'Equip to…'}</summary><div class="eqmenu">${hs.map(h=>{const ok=wearOK(h,g),pl=G.cons?null:eqPlan(h,g);
    return `<button class="btn sm" data-a="${craft?`crafteq:${g}:${h.id}`:`equip:${h.id}:${g}`}" ${ok?'':'disabled'}>${esc(h.name)}${S.party.includes(h.id)?'':' <span class="muted">(bench)</span>'} <span class="muted">${ok?(pl&&pl.out.length?`swaps out ${[...new Set(pl.out)].map(o=>GEAR[o].name).join(' and ')}`:G.cons?`pouch ${pouchOf(h).length}/${POUCH_MAX}`:`${SLOTS[pl.s]} empty`):G.cons?'pouch full':`needs ${reqTxt(G)}`}</span></button>`}).join('')}</div></details>`}
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
/* ============ FIRST-TIME TIPS ============ */
/* one pop-up the first time each mechanic shows up; ids seen live in S.tips and carry into the next volume */
const inSd=()=>S.phase==='sd'&&S.sd&&!S.sd.result&&!S.sd.busy&&!S.sd.intro,sdV=f=>inSd()&&S.sd.vl.some(o=>!o.v.down&&f(o)),selH=()=>{const u=inSd()&&S.sd.sel!=null&&S.sd.units[S.sd.sel];return u?heroOf(u):null};
const atHQ=()=>S.phase==='hq'&&S.view!=='create'&&!S.guide;
const TIPS=[
  {id:'inv',when:()=>S.phase==='inv'&&S.inv&&S.inv.intro,t:'Investigation',b:()=>`Each issue, your party tracks one villain through 3 leads. <b>Every clue opens one unseen page</b> of the villain's playbook or one of their hit reactions, and the clue total decides how the fight starts: 0–1 an ambush, 2–3 a standoff, 4 or more prepared. The street hints tell you how this villain fights, so read them before you go.`},
  {id:'lead',when:()=>S.phase==='inv'&&S.inv&&!S.inv.intro&&S.inv.step<3&&!S.inv.res,t:'Working a lead',b:()=>`Pick how to work each lead. Options that roll use <b>a d20 plus bonuses</b> from field abilities and gear, and show the number you need. Risky options can hurt a hero or cost trust. The third lead is always the villain's own trail, built around how they operate.`},
  {id:'lair',when:()=>S.phase==='inv'&&S.inv&&S.inv.step>=3,t:'Finding the lair',b:()=>`Your clues set the showdown. <b>Ambush:</b> the villain acts first with an extra henchman and your heroes start scattered. <b>Standoff:</b> you enter from the south edge and act first. <b>Prepared:</b> change gear now, act first, and the villain starts with 1 page torn out.`},
  {id:'sd',when:()=>inSd(),t:'The showdown',b:()=>`Tap a hero to select them. Each round, every hero can <b>move once and take one action</b>. Then press End round and the villain plays the top page of its playbook. <b>The playbook is also its health:</b> every wound tears out a page, and when none are left it's beaten. There is no time limit: when it runs out of pages to play, its untorn pages are shuffled back in. <b>Escort</b> civilians to a green exit hex for trust, because harmed civilians cost trust. Civilians left alone panic and run on the villain's turn, and henchmen drag them off.`},
  {id:'combatmenus',when:()=>inSd()&&S.sd.sel!=null,t:'Combat menus and action icons',b:()=>`<b>Abilities</b> contains primary and equipped powers. <b>Other Actions</b> contains Escort, Hack, Rally Spirit and Avoid Damage. The icon beside each option marks whether it uses an action, a move, or is free. <b>Choosing a menu item only previews its details below the controls</b>; tap Activate to commit or Cancel to back out.`},
  {id:'rallytip',when:()=>inSd()&&S.sd.sel!=null,t:'Rally Spirit',b:()=>`Choose <b>Other Actions → Rally Spirit → Activate</b>, then target yourself or an ally within your <b>total discipline levels</b> in hexes. Restore up to <b>3 Composure</b> without exceeding the maximum. This spends the hero's action.`},
  {id:'avoidt',when:()=>inSd()&&S.sd.sel!=null,t:'Avoid Damage',b:()=>`Choose <b>Other Actions → Avoid Damage → Activate</b> to spend an action for <b>+3 Evasion</b>, or <b>+5</b> beside cover such as walls, debris, another hero, a civilian or a terminal. On a miss, a valid cover target in the attack path may take the hit instead. Dangerous hazard tiles do not count as cover.`},
  {id:'attack',when:()=>inSd()&&S.sd.mode==='attack',t:'Attacking',b:()=>`Roll one d20 per attack die and add accuracy. <b>Each die that reaches the target's evasion is a hit.</b> A natural 20 always hits and a 1 always misses. Each hit on a villain draws a card from the hit deck, then rolls <b>d20 + strength against its toughness</b>. A success tears a page. Long-press a hero's stats to see their numbers.`},
  {id:'arcs',when:()=>!!selH(),t:'Facing and blind spots',b:()=>`The yellow arrow shows where the villain faces. The tinted hexes in front are its <b>front arc</b>. The shaded hexes behind are its <b>blind spot</b>, and attacks from there get +1 die. It turns toward whatever it moves to or attacks. Some signature hit reactions only trigger from certain sides, so read the playbook to learn which angle is safe.`},
  {id:'engines',when:()=>{const h=selH();return !!h&&!!(pwrMax(h)||arcMax(h)||potOf(h))},t:'Power, Arcana and Innate rank',b:()=>`Gear abilities and signature powers run on a hero's disciplines. <b>Tech</b> abilities spend Power, which slowly recharges. <b>Magic</b> spells spend Arcana: one pool per fight that doesn't refill on its own, so save it for big moments. <b>Innate</b> abilities spend nothing but require enough Innate rank, and each hero can fire one per round. The bars under the action buttons show what this hero has.`},
  {id:'multi',when:()=>inSd()&&S.sd.vl.length>1,t:'Two villains',b:()=>`More than one villain is on the board, and they act one after the other each round. Use the <b>Target</b> buttons, or tap a villain, to choose whose playbook you're tearing.`},
  {id:'sig',when:()=>sdV(o=>o.v.warn&&o.v.deck[0]&&o.v.deck[0].uid===o.v.warn),t:'Signature Move!',b:()=>`The villain just shouted a warning: its next page is a <b>Signature Move</b>, one of its most dangerous attacks. Every wound tears the <b>top</b> page, so land a wound before you end the round to rip it out before it fires.`},
  {id:'charge',when:()=>sdV(o=>o.v.charge),t:'Charged attack',b:()=>`The villain is winding up. On its next turn the <b>striped hexes</b> get hit instead of it playing a new page. Move out of them, or tear pages equal to the villain's level + 1 before then to stagger it.`},
  {id:'haz',when:()=>inSd()&&S.sd.haz&&S.sd.haz.length,t:'Hazard hexes',b:()=>`Orange hexes are a hazard. <b>Any hero standing on one when the villain's turn starts takes damage</b>, so step off before you end the round.`},
  {id:'walls',when:()=>inSd()&&S.sd.walls&&S.sd.walls.length,t:'Walls',b:()=>`Walls block movement and beams like rubble. Walls built into the lair stay all fight; walls the villain raises crumble after a few rounds. <b>Villains bigger than one hex smash straight through walls and rubble</b>, so cover won't stop them.`},
  {id:'pit',when:()=>inSd()&&S.sd.pits&&S.sd.pits.length,t:'Pits',b:()=>`Dark hexes are pits. <b>Nobody can walk into one, but shots and beams pass over.</b> A jumping hero can clear one pit hex for 2 movement, and villains bigger than one hex stride across.`},
  {id:'serpent',when:()=>sdV(o=>VILLAINS[o.key].shape==='serpent'),t:'A serpent villain',b:()=>`Ouroboros fills a chain of hexes and <b>its body follows its head</b>. Every civilian or henchman it swallows makes it one hex longer. Keep bystanders away from its mouth.`},
  {id:'swarm',when:()=>sdV(o=>VILLAINS[o.key].shape==='swarm'),t:'A swarm villain',b:()=>`Murmur is <b>three separate bodies</b>: a queen, a stinger and a shell. Each has its own facing, and you strike the body you aim at. A body with another body right beside it gets +2 toughness, so split them up.`},
  {id:'bomber',when:()=>sdV(o=>o.key==='bomber'),t:'A leaping bomber',b:()=>`Payload <b>vaults over heroes</b> and plants bombs that explode at the start of the next villain turn. Most cover <b>7 hexes</b>, but Double Toss (level 4), Cluster Drop (level 5) and Carpet Bombing (level 6) expand to <b>19 hexes</b>. Watch the striped blast zone. <b>Her henchmen are bomb-immune</b>: the Bombardier fires from range and throws its own bombs. Bait and Switch swaps Payload with a henchman and plants a 7-hex bomb. A wall, rubble or the board edge behind a hero blocks her vault.`},
  {id:'cantorGuns',when:()=>sdV(o=>o.key==='cantor'),t:'Cantor: hired guns and leverage',b:()=>`Cantor's <b>hired guns have only 1 HP</b> and fire from up to <b>2 hexes</b>. <b>Crowd Control</b> orders every gun already in shooting range to fire immediately, without moving. <b>Leverage</b> threatens civilians and drains <b>2 Composure</b> from a nearby defending hero, not HP. Keep gun numbers low and your heroes steady.`},
  {id:'grid',when:()=>sdV(o=>o.key==='grid'),t:'A beam turret',b:()=>`Gridlock is <b>bolted to the floor</b>: he turns but never moves, and nothing can shove him. His beams run in straight hex lines to the edge of the board, and each one <b>stops at the first hero it hits and knocks them back</b> as many hexes as the damage. Walls and rubble block beams, so use them as cover. His Prisms split any beam that passes through them.`},
  {id:'beams',when:()=>inSd()&&S.sd.beams&&S.sd.beams.length,t:'Lit beams',b:()=>`Red lines are lit beams. They stay until the villain's next turn. <b>Stepping into a lit hex costs ${BEAM_HOT} damage and ends your move</b>, and a normal move can't cross one. Only a hero who is <b>jumping</b> (the move after Mighty Leap, Jet or Piston Leap, a Solar Dive, or any move in Gravity Boots or Earthshaker Greaves) can clear a single lit hex for 2 movement. Leaping abilities that land on a chosen hex fly over beams too. A hero who starts their turn in a beam can step out freely.`},
  {id:'hide',when:()=>sdV(o=>o.v.hide),t:'Hidden facing',b:()=>`Nocturne hides which way she faces. Her arrow shows a question mark and her arcs aren't shaded, but <b>they still count</b>. Every hit you land reveals her facing until she fades again.`},
  {id:'shaken',when:()=>inSd()&&S.sd.units.some(u=>!u.ko&&heroOf(u).comp<=0),t:'Shaken',b:()=>`A hero's composure (the blue bar) hit 0. They're <b>Shaken: −2 Strength, −2 accuracy, −2 evasion and −1 movement</b> until it's restored. Ending a fight at 0 composure leaves a lasting Rattled injury.`},
  {id:'ko',when:()=>inSd()&&S.sd.units.some(u=>u.ko),t:'Hero down',b:()=>`A knocked-out hero is out of this fight. After the mission they're back on their feet at half health, ready for the next issue. Nobody's career ends.`},
  {id:'after',when:()=>S.phase==='after'&&S.after&&!S.after.ethos,t:'Aftermath',b:()=>`Every hero on the mission earns XP, more if they landed 2 or more wounds. A win brings salvage for crafting. Villains you beat always <b>escape and come back a level stronger</b>, and beating one unlocks their facility blueprints. Every villain you didn't hunt moved its scheme forward.`},
  {id:'arc',when:()=>S.phase==='arc',t:'A new arc',b:()=>`Every free villain gains a level, adds new pages and upgrades old ones, and a new villain arrives. Once per arc a <b>Crossover Issue</b> lets an experienced hero join from HQ.`},
  {id:'tabs',when:()=>atHQ()&&roster().length>0,t:'HQ, Roster and Villains',b:()=>`Between missions there are three tabs. <b>HQ</b> is for recruiting, building the base and crafting gear. <b>Roster</b> is for the party, equipment and level-ups. <b>Villains</b> holds the case files, where you pick who to investigate. A tab <b>glows</b> when it needs you: HQ while you have resources or options to use, Roster when there is new gear or a hero has a choice to make, and Villains once you have checked the other two this issue.`},
  {id:'levelup',when:()=>atHQ()&&roster().some(h=>h.pendingUp>0),t:'Level up',b:()=>`A hero has enough XP to level up. Open the <b>Roster</b> and find the ★: pick which discipline they grow into (up to rank 5), then choose one upgrade. Benched heroes also earn 1 XP every issue.`},
  {id:'pouch',when:()=>atHQ()&&S.armory.some(g=>GEAR[g]&&GEAR[g].cons),t:'Consumables',b:()=>`The armory has <b>consumables</b>: cheap one-use items like Stim Shots and Smoke Pellets. Each hero carries up to ${POUCH_MAX} in a pouch, separate from their gear slots. Use them in a fight as a free action, or during investigations for the ones that give clues. Buy more in the Workshop panel, even before the Workshop is built.`},
  {id:'scheme',when:()=>atHQ()&&S.issue>=2&&S.villains.some(v=>v.status==='active'&&v.scheme>0),t:'Schemes',b:()=>`Every issue you don't hunt a villain, <b>its scheme meter fills</b> by one. When it's full, the villain strikes the city: −2 trust and it gains a level. You can only chase one villain per issue, so keep an eye on the meters on the <b>Villains</b> tab.`},
  {id:'sets',when:()=>atHQ()&&roster().some(h=>Object.values(h.gear).some(g=>GEAR[g]&&GEAR[g].set)),t:'Villain sets',b:()=>`Gear crafted from one villain's salvage belongs to that villain's <b>set</b> (the green tag on top of the item). <b>Wear ${SET_N} pieces of the same set</b> on one hero to turn on a set bonus themed on that villain. The hero card shows each set you're wearing just below the gear, and it glows once the bonus is on.`},
  {id:'salvage',when:()=>atHQ()&&Object.values(S.salvage).some(n=>n>0),t:'Salvage',b:()=>`You've got villain salvage. Spend it in the <b>Workshop</b> (Base development) to craft gear from your blueprints, then use Equip to… to hand it to a hero. "Any salvage" costs can be paid from any villain's salvage.`},
  {id:'event',when:()=>S.phase==='event',t:'The event comic',b:()=>`The volume's finale: <b>two villains attack together</b> on a bigger board, acting one after the other each round. Choose a preparation, then beat both to end the volume in triumph.`},
];
function tipNow(){if(S.tipsOff||FAST)return null;if(S.tut&&!(TUT[S.tut.b]&&TUT[S.tut.b].id==='free'))return null;const g=S.guide;if(g&&(g.s===0||g.pop))return null;if(S.view==='roster'&&S.phase==='hq')return null;
  if(S.tipAt&&Date.now()-S.tipAt<4000)return null;const seen=S.tips||[];return TIPS.find(t=>!seen.includes(t.id)&&t.when())||null}
function tipModal(){const t=tipNow();if(!t)return '';
  return `<div id="guide" class="tip1" role="dialog" aria-modal="true" aria-labelledby="gtitle"><div class="gbox"><div class="eyebrow">New mechanic</div><div><span class="sfxhead" id="gtitle">${t.t}</span></div>
    <p class="small" style="margin:0">${t.b()}</p><div class="row"><button class="btn pri" data-a="tip:ok:${t.id}">Got it</button><button class="btn" data-a="tip:off">Turn off tips</button></div></div></div>`}
function recruitPanel(){const n=roster().length,full=n>=ROSTER_MAX,arc=xArc(),xo=xoverOpen(),qb=Object.keys(HERO_BASE).filter(k=>!roster().some(h=>h.cls===k));
  const xl=xo?'Start a Crossover':arc<2?'Opens in Arc 2':arc<ARCS?`Used. Next one in Arc ${arc+1}`:'Used this arc';
  return `<section class="panel">${coll('hq-recruit',`<div><div class="eyebrow">Recruitment · ${n}/${ROSTER_MAX} heroes</div><h2>New heroes</h2></div>`,
    `${!n?'<div class="cap tilt"><b>The Blackharbor Guardians need four heroes.</b> Write an origin story for each hero, or grab a quick build to skip ahead. Every mission sends a party of 4, so fill all four spots before you investigate. The armory holds a starter locker of ten items to hand out once the team is set.</div>':''}
    ${full?'<p class="small muted" style="margin:0">The roster is full.</p>':''}
    <div class="grid2"><div class="card orec"><h3>Origin Story</h3><div class="small">Create a basic hero over six comic pages. Every choice shows what it does to them. Free: level 1, no gear, no HQ changes.</div><button class="btn pri" data-a="ostart:basic" data-tip="kw:origin" ${full?'disabled':''}>Write an origin</button></div>
      <div class="card orec xo"><h3>Crossover Issue</h3><div class="small">Recruit an Established Character from their own series. They arrive at level ${Math.max(2,arc)+1} or higher, with gear and HQ bonuses you choose. One per arc, from Arc 2.</div><button class="btn ${xo?'pri':''}" data-a="ostart:xover" data-tip="kw:crossover" ${xo&&!full?'':'disabled'}>${xl}</button></div></div>
    ${qb.length?coll('hq-qb',`<span class="eyebrow" data-tip="kw:quickbuild">Quick builds · ${qb.length}</span>`,`<p class="small muted" style="margin:0">The classic Guardians lineup, ready to go. Same rules as a basic hero: level 1 and no gear.</p><div class="grid2">${qb.map(qbCard).join('')}</div>`,!n,'nested'):''}`)}</section>`}

/* ============ GLOSSARY + LONG-PRESS DETAILS ============ */

function tipFor(key){const[t,k,id]=key.split(':');
  if(t==='cell')return cellTip(+k,+id);
  if(t==='oopt'&&S.cre&&ORIGIN[k]){const c=S.cre,o=k==='training'?oTrainOpts(c).find(x=>x.id===id):k==='hq'?oHqOpts().find(x=>x.id===id):oOpt(k,id);if(o)return {title:o.n,eyebrow:ORIGIN[k].t,body:`${o.fl?o.fl+' ':''}${oMech(k,o,c)}`}}
  if(t==='ostat'&&S.cre&&k in O_TEMPLATE){const c=S.cre,r=oBuild(c),h=oHero(c),v=stat(h,k),lab=MODN[k]||k,w=r.why[k]||[],parts=[`Starting template: ${O_TEMPLATE[k]}`].concat(w.map(([s,d])=>`${s}: ${d>0?'+':''}${d}`));
    const fl=r.base[k]-O_TEMPLATE[k]-w.reduce((a,[,d])=>a+d,0);if(fl)parts.push(`Raised to the minimum of ${O_FLOOR[k]}: +${fl}`);const rest=v-r.base[k];if(rest)parts.push(`Ranks, upgrades, gear and ethos: ${rest>0?'+':''}${rest}`);
    return {title:`${lab[0].toUpperCase()+lab.slice(1)}: ${v}`,eyebrow:'Where this stat comes from',body:parts.join('. ')+'.'}}
  if(t==='qb'&&HERO_BASE[k]){const b=HERO_BASE[k];return {title:b.name,eyebrow:`Quick build · ${TRACKS[b.track].name} · ${b.role}`,body:`Health ${b.maxHp}, movement ${b.move}, ${b.speed} attack ${b.speed===1?'die':'dice'}, accuracy +${b.acc}, strength +${b.str}, evasion ${b.eva}, range ${b.range}, composure ${b.maxComp}. ${POWERS[b.power].name}: ${POWERS[b.power].txt}${b.field?` ${b.field.n}: ${b.field.txt}`:''} Starts with ${poolTxt(newHero(k))}, including the veteran bonus of ${POOL_BONUS_TXT[b.track]}.`}}
  if(t==='vpage'&&VILLAINS[k]){const c=pageOf(k,id);return {title:c.n,eyebrow:`${VILLAINS[k].name} · Playbook page`,body:c.txt}}
  if(t==='vrx'&&VILLAINS[k]&&rxOf(k,id)){const r=rxOf(k,id);return {title:r.n,eyebrow:`${VILLAINS[k].name} · Hit reaction`,body:r.txt}}
  if(t==='kw'&&GLOSS[k])return {title:GLOSS[k][0],body:GLOSS[k][1]};
  if(GLOSS[key])return {title:GLOSS[key][0],body:GLOSS[key][1]};
  if(t==='res'&&GLOSS[key])return {title:GLOSS[key][0],body:GLOSS[key][1]};
  if(t==='pow'&&POWERS[k])return {title:POWERS[k].name,eyebrow:`Signature power · ${powCost(k)}`,body:POWERS[k].txt};
  if(t==='gear'&&GEAR[k]){const g=GEAR[k];return {title:g.name,eyebrow:g.cons?'Consumable · carried in the pouch':`Needs ${reqTxt(g)} · ${gearSlotN(g)}${g.pair?' · paired':''}`,body:`${g.cons?`Anyone can carry it, up to ${POUCH_MAX} per hero. One use, then it is gone.`:(modsTxt(g.mods)||'No passive bonus')+'.'}${gearPoolTxt(g)?` <b>Pool:</b> ${gearPoolTxt(g)}.`:''}${g.ab?` <b>${g.ab.n}</b> (${abCost(g)}${g.type==='innate'?', one Innate ability per round':''}): ${abTxt(g.ab)}`:''}${g.jumps?' <b>All your moves are jumps.</b>':''}${gearExtra(g).map(t=>' '+t).join('')}${g.field?` <b>Out of combat:</b> ${g.field.txt} Works only while the wearer is in the party.`:''}${g.set?` <span class="sn">${esc(VILLAINS[g.set].name)} set, ${SETS[g.set].n} (${SET_N} pieces):</span> ${SETS[g.set].txt}`:''} <span class="muted">Craft: ${costStr(g.cost)}.</span>`,html:true}}
  if(t==='fac'&&FAC[k])return {title:FAC[k].name,eyebrow:`Facility · ${costStr(FAC[k].cost)}`,body:FAC[k].txt};
  if(t==='upg'&&UPG[k])return {title:UPG[k].name,eyebrow:'Upgrade',body:`Permanently gives ${modsTxt(UPG[k].mods)}.`};
  if(t==='inj'&&INJ[k])return {title:INJ[k].name,eyebrow:'Lasting injury',body:`Permanently gives ${modsTxt(INJ[k].mods)}.`};
  return null}
/* Version 93: long-press any board hex for what is on it. Tokens ignore the pointer, so the hex underneath carries the tip. */
function cellTip(x,y){const sd=S.sd;if(!sd||S.phase!=='sd')return null;const k=x+','+y,G=(id,pre)=>({title:GLOSS[id][0],body:(pre||'')+GLOSS[id][1]});
  const su=sd.sel!=null?sd.units[sd.sel]:null,sh=su&&!su.ko?heroOf(su):null,need=n=>Math.min(20,Math.max(2,n)),pct=n=>Math.round(5*(21-need(n)));
  const o=sd.vl.find(o=>!o.v.down&&inV(o.v,x,y));
  if(o){const v=o.v,d=VILLAINS[o.key],L=v.level-1,eva=d.eva+L-hexA(v.hex),tough=d.tough+L,acc=d.acc+vLvB('acc',v.level)-(v.blind?4:0),pg=v.deck.length+v.discard.length;
    let b=`Evasion ${eva}: an attack die plus accuracy must reach it to hit. Toughness ${tough}: a wound roll plus Strength must reach it to tear a page. Accuracy +${acc} against your heroes' evasion. ${pg} page${pg===1?'':'s'} left.`;
    if(sh){const hn=eva-stat(sh,'acc'),wn=tough-stat(sh,'str');b+=` ${sh.name} hits on ${need(hn)}+ (${pct(hn)}% per die) and wounds on ${need(wn)}+ (${pct(wn)}%), before hit cards and bonuses.`}
    b+=v.hide?' Its facing is hidden until you land a hit.':v.sw?' Each body has its own facing: attack from a side or behind for bonus dice.':' The yellow arrow is its facing. Attacks from the shaded blind spot behind it get +1 die.';
    return {title:d.name,eyebrow:`Villain · level ${v.level}`,body:b}}
  const m=sd.hench.find(m=>m.x===x&&m.y===y);
  if(m){const e=m.elite&&eliteOf(m.owner);return e?{title:e.name,eyebrow:`Special henchman · health ${m.hp}`,body:GLOSS.elite[1]}:{title:VILLAINS[m.owner].hench.name,eyebrow:`Henchman · health ${m.hp}`,body:GLOSS.henchman[1]}}
  const u=sd.units.find(o=>!o.ko&&o.x===x&&o.y===y);
  if(u){const h=heroOf(u);return {title:h.name,eyebrow:`Hero · health ${h.hp}/${stat(h,'maxHp')} · composure ${h.comp}/${stat(h,'maxComp')}`,body:`Move ${stat(h,'move')}, range ${stat(h,'range')}, ${stat(h,'speed')} attack ${stat(h,'speed')===1?'die':'dice'}, evasion ${stat(h,'eva')}. ${u.moved&&u.acted?'Done for this round.':u.moved?'Has moved, can still act.':u.acted?'Has acted, can still move.':'Can still move and act this round.'} Tap to select.`}}
  const c=sd.civs.find(c=>c.x===x&&c.y===y);
  if(c)return G('civilian',c.f?`Following ${heroOf(sd.units.find(o=>o.hid===c.f)).name}. `:civHeld(c)?'Grabbed by a henchman: knock it out to free them. ':'');
  const bm=(sd.bombs||[]).find(b=>b.k===k);if(bm){const radius=Math.max(1,Math.min(2,bm.radius||1));return G('bomb',`Explodes next villain turn. ${1+3*radius*(radius+1)}-hex blast (radius ${radius}). `)}
  if(sd.term&&sd.term.k===k)return G('terminal');
  const lit=litMap()[k];if(lit)return G('beam',`This hex deals ${lit}. `);
  if(sd.vl.some(o=>o.v.charge&&!o.v.down&&o.v.charge.zone.includes(k)))return G('charge');
  if((sd.exits||[]).includes(k))return G('exit');
  if(sd.obs.includes(k))return G('rubble');if(sd.walls&&sd.walls.some(w=>w.k===k))return G('walls');if(sd.pits&&sd.pits.includes(k))return G('pit');
  {const hz=sd.haz&&sd.haz.find(h=>h.k===k);if(hz)return G('haz')}
  for(const o of sd.vl){if(o.v.down||o.v.hide||dV({x,y},o.v)>3)continue;const sd2=sideOf({x,y},o.v);if(sd2==='rear')return G('blind');if(sd2==='front')return G('facearc')}
  return null}
let tipEl=null,lp=null,suppressClick=false;
function hideTip(){if(tipEl){tipEl.remove();tipEl=null}}
function showTip(el){const d=tipFor(el.dataset.tip);if(!d)return false;hideTip();
  tipEl=document.createElement('div');tipEl.id='tip';tipEl.setAttribute('role','tooltip');
  tipEl.innerHTML=`${d.eyebrow?`<div class="eyebrow">${esc(d.eyebrow)}</div>`:''}<h4>${esc(d.title)}</h4><div>${d.html?d.body:esc(d.body)}</div>`;
  document.body.appendChild(tipEl);const r=el.getBoundingClientRect(),t=tipEl.getBoundingClientRect();
  let x=r.left+r.width/2-t.width/2,y=r.top-t.height-10;x=Math.max(12,Math.min(innerWidth-t.width-12,x));if(y<12)y=Math.min(innerHeight-t.height-12,r.bottom+10);
  tipEl.style.left=x+'px';tipEl.style.top=y+'px';return true}
document.addEventListener('pointerdown',e=>{if(tipEl&&!e.target.closest('#tip')){hideTip()}
  const t=e.target.closest('[data-tip]');if(!t)return;
  lp={x:e.clientX,y:e.clientY,timer:setTimeout(()=>{lp=null;if(showTip(t)){suppressClick=true;tutLP(t);try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}}},430)}},{passive:true});
const cancelLP=()=>{if(lp){clearTimeout(lp.timer);lp=null}};
document.addEventListener('pointerup',cancelLP,{passive:true});document.addEventListener('pointercancel',cancelLP,{passive:true});
document.addEventListener('scroll',()=>{cancelLP();hideTip()},{passive:true,capture:true});
document.addEventListener('pointermove',e=>{if(lp&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>10)cancelLP()},{passive:true});
document.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-tip]'))e.preventDefault()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideTip();if(S.guide&&S.guide.pop){S.guide.pop=null;render()}else{const t=document.querySelector('#guide.tip1 [data-a^="tip:ok"]');if(t)t.click()}}});
/* disabled buttons swallow pointer events, so buttons with details use aria-disabled instead */
function fixDisabled(root){root.querySelectorAll('button[disabled][data-tip]').forEach(b=>{b.removeAttribute('disabled');b.setAttribute('aria-disabled','true')})}

/* ============ PLAYBOOK BROWSER ============ */
function markSeen(k,n){S.seen=S.seen||{};const a=S.seen[k]=S.seen[k]||[];if(!a.includes(n))a.push(n)}
let PB=null;
function openPlaybook(k){const def=VILLAINS[k],vs=vState(k),sd=(S.sd&&S.sd.vl&&S.sd.vl.find(o=>o.key===k))||null,lvl=sd?sd.v.level:vs.level,seen=(S.seen&&S.seen[k])||[];
  const known=c=>seen.includes(c.id);
  const remain=sd?[...sd.v.deck,...sd.v.discard]:vs.deck.map(e=>buildCard(k,e,vs.level));
  const sorted=remain.slice().sort((a,b)=>(known(b)-known(a))||a.n.localeCompare(b.n));
  const torn=sd?sd.v.wounds:[];
  const all=remain.concat(torn);
  const sr=(S.seenR&&S.seenR[k])||[],rx=VINTEL[k].react;
  PB={k,lvl,inFight:!!sd,i:0,remainN:remain.length,tornN:torn.length,seenN:all.filter(known).length,total:all.length,status:vs.status,rxN:rx.filter(r=>sr.includes(r.id)).length,rxT:rx.length,
    pages:[{kind:'cover'},...sorted.map(c=>({kind:known(c)?'card':'unk',c})),...torn.map(c=>({kind:'torn',c,known:known(c)})),...rx.map(r=>({kind:sr.includes(r.id)?'rx':'rxunk',r}))]};
  const L=document.createElement('div');L.id='comic';L.setAttribute('role','dialog');L.setAttribute('aria-label',`${def.name} playbook`);document.body.appendChild(L);
  L.addEventListener('click',e=>{const b=e.target.closest('[data-pb]');if(!b)return;const[a,n]=b.dataset.pb.split(':');
    if(a==='close')closePlaybook();if(a==='next')turnPB(1);if(a==='prev')turnPB(-1);if(a==='go')turnPB(+n-PB.i)});
  let sx=null;L.addEventListener('pointerdown',e=>{if(e.target.closest('.cstage'))sx=e.clientX});
  L.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;if(dx<-45)turnPB(1);else if(dx>45)turnPB(-1)});
  drawPB(0);L.querySelector('[data-pb="close"]').focus({preventScroll:true})}
function closePlaybook(){const L=document.getElementById('comic');if(L)L.remove();PB=null}
document.addEventListener('keydown',e=>{if(!PB)return;if(e.key==='Escape')closePlaybook();if(e.key==='ArrowRight')turnPB(1);if(e.key==='ArrowLeft')turnPB(-1)});
function turnPB(d){if(!PB||!d)return;const ni=PB.i+d;if(ni<0||ni>=PB.pages.length)return;
  const pg=document.querySelector('#comic .cstage .pg');if(pg&&!RM){pg.classList.add(d>0?'flipOutL':'flipOutR');setTimeout(()=>{PB.i=ni;drawPB(d)},170)}else{PB.i=ni;drawPB(d)}}
function pbPage(p,idx){const def=VILLAINS[PB.k],n=PB.pages.length-1;
  const hd=(r)=>`<div class="hd"><span>${vIc(PB.k)}${esc(def.name)} · Playbook</span><span>${r}</span></div>`;
  if(p.kind==='cover')return `<div class="pg pbcover">${vWm(PB.k)}<small>${PB.inFight?'This fight':'Case file'} · Level ${PB.lvl}</small><b>${esc(def.name)}</b><span class="ctag">${esc(def.tag)}</span>
    <div class="cstats"><span><b>${PB.remainN}</b> pages left</span>${PB.inFight?`<span><b>${PB.tornN}</b> torn out</span>`:''}<span><b>${PB.seenN}/${PB.total}</b> seen</span><span><b>${PB.rxN}/${PB.rxT}</b> hit reactions known</span></div>
    <small>Swipe or tap Next to read</small></div>`;
  if(p.kind==='rx'||p.kind==='rxunk'){const show=p.kind==='rx',r=p.r;return `<div class="pg"><div class="hd"><span>${vIc(PB.k)}${esc(def.name)} · Hit reaction</span><span>Hit deck</span></div><div class="sigrib r">Signature reaction</div><div class="art tac ${show?'':'unk'}"><span>${show?esc(r.sfx):'???'}</span></div><h2>${show?esc(r.n):'???'}</h2><div class="tx ${show?'':'muted'}">${show?esc(r.txt):`One of ${esc(def.short)}'s signature hit reactions. Uncover clues while investigating, or draw it in a fight, to learn it.`}</div><div class="ft">${show&&r.src?`Lost when ${esc(def.cards[r.src].n)} is torn`:show?'Shuffled into the hit deck':'Unknown reaction'}</div></div>`}
  if(p.kind==='unk')return `<div class="pg">${hd(`Page ${idx} of ${n}`)}<div class="art unk"><span>???</span></div><h2>???</h2><div class="tx muted">You haven't seen this page played yet. Uncover clues, fight ${esc(def.name)} or use Foresee to learn it.</div><div class="ft">Unknown page</div></div>`;
  const c=p.c,show=p.kind==='card'||p.known,sg=show&&c.sig;
  const body=`${hd(p.kind==='torn'?'Torn out':`Page ${idx} of ${n}`)}${sg?'<div class="sigrib">★ Signature Move ★</div>':''}<div class="art ${show?'':'unk'}">${show?vWm(PB.k):''}<span>${show?esc(TYPE_SFX[c.t]||'!'):'???'}</span></div><h2>${show?esc(c.n):'???'}</h2><div class="tx">${show?esc(c.txt):'Torn out before you could read it.'}</div><div class="ft">${p.kind==='torn'?'No longer in the playbook':`Page ${idx} of ${n}`}</div>`;
  if(p.kind==='torn')return `<div class="pg tornpg ${sg?'sig':''}" style="clip-path:${tearTop}">${body}</div><div class="tornlabel">Torn out this fight</div>`;
  return `<div class="pg ${sg?'sig':''}">${body}</div>`}
function drawPB(d){const L=document.getElementById('comic');if(!L||!PB)return;const def=VILLAINS[PB.k],p=PB.pages[PB.i];
  L.innerHTML=`<div class="cbar"><div><div class="eyebrow">Villain playbook</div><h3>${esc(def.name)}</h3></div><button class="btn sm" data-pb="close" type="button">Close</button></div>
    <div class="cstage"><div class="book pbook vth" style="${vSty(PB.k)}">${pbPage(p,PB.i)}</div></div>
    <div class="cnav"><button class="btn sm" data-pb="prev" type="button" ${PB.i?'':'disabled'}>Prev</button><span class="mono small">${PB.i?`${PB.i} / ${PB.pages.length-1}`:'Cover'}</span><button class="btn sm" data-pb="next" type="button" ${PB.i<PB.pages.length-1?'':'disabled'}>Next</button></div>
    <div class="cstrip">${PB.pages.map((q,i)=>`<button type="button" class="tile ${q.kind} ${q.kind==='card'&&q.c.sig?'sig':''} ${i===PB.i?'cur':''}" data-pb="go:${i}" aria-label="${q.kind==='cover'?'Cover':q.kind==='unk'?'Unknown page':q.kind==='torn'?'Torn page':q.kind==='rx'?esc(q.r.n):q.kind==='rxunk'?'Unknown hit reaction':esc(q.c.n)}"></button>`).join('')}</div>`;
  const pg=L.querySelector('.cstage .pg');if(pg&&d&&!RM)pg.classList.add(d>0?'flipInL':'flipInR')}

/* ============ COLLAPSIBLES ============ */
const uiOpen=(id,def)=>S.ui&&id in S.ui?S.ui[id]:def;
/* Version 129 (Tyler): Workshop search. Text matches the item's name and details; the dropdowns default to craftable items that fill an empty slot on someone */
const WSF_OPTS={aff:[['craft','Can craft'],['cant',"Can't afford"],['any','Any cost']],eq:[['empty','Fills empty slot'],['can','Someone can equip'],['cannot','Nobody can equip'],['any','Anyone or nobody']],
  disc:[['all','All disciplines'],['tech','Tech'],['innate','Innate'],['magic','Magic']],slot:[['all','All slots'],...Object.entries(GSLOTS),['pouch','Pouch (consumables)']]};
/* Version 130 (Tyler): the same search on each hero's equip list in the roster, judged for that hero and without the cost filter */
const EF_OPTS={eq:[['empty','Fills empty slot'],['can','Can equip'],['cannot',"Can't equip"],['any','All armory items']],disc:WSF_OPTS.disc,slot:WSF_OPTS.slot};
const wsfOf=hid=>{S.ui=S.ui||{};const O=hid?EF_OPTS:WSF_OPTS,f=hid?((S.ui.ef=S.ui.ef||{})[hid]=S.ui.ef[hid]||{}):(S.ui.wsf=S.ui.wsf||{});for(const k in O)if(!O[k].some(([v])=>v===f[k]))f[k]=O[k][0][0];if(typeof f.q!=='string')f.q='';if(!hid&&(!f.hero||f.hero!=='all'&&!roster().some(h=>h.id===f.hero)))f.hero='all';return f};
const gearQ=(k,q)=>{if(!q)return true;const g=GEAR[k],t=tipFor('gear:'+k),txt=(g.name+' '+(t?t.eyebrow+' '+t.body:'')+' '+(g.set?VILLAINS[g.set].name+' set':'')).replace(/<[^>]+>/g,' ').toLowerCase();return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>txt.includes(w))};
const wsSel=(f,O,k,hid)=>`<select data-wsf="${k}" ${hid?`data-wsh="${hid}"`:''} aria-label="${k}">${O[k].map(([v,l])=>`<option value="${v}" ${f[k]===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
function eqFilter(h){const f=wsfOf(h.id),ks=[...new Set(S.armory)].filter(g=>{const G=GEAR[g];
    if(f.eq==='empty'&&!fillsEmpty(h,g)||f.eq==='can'&&!wearOK(h,g)||f.eq==='cannot'&&wearOK(h,g))return false;
    if(f.disc!=='all'&&G.type!==f.disc&&!(G.reqs&&G.reqs[f.disc]))return false;if(f.slot!=='all'&&G.slot!==f.slot)return false;return gearQ(g,f.q)}).sort((a,b)=>wearOK(h,b)-wearOK(h,a)||GEAR[a].name.localeCompare(GEAR[b].name));
  const dflt=Object.keys(EF_OPTS).every(k=>f[k]===EF_OPTS[k][0][0])&&!f.q;
  return {ks,bar:`<div class="wsf"><input class="wsq" data-wsh="${h.id}" type="search" autocomplete="off" placeholder="Search the armory" value="${esc(f.q)}">${Object.keys(EF_OPTS).map(k=>wsSel(f,EF_OPTS,k,h.id)).join('')}</div>
    <div class="row between small"><span class="muted">${ks.length} of ${new Set(S.armory).size} armory item${new Set(S.armory).size===1?'':'s'}</span>${dflt?'':`<button class="btn sm" data-a="effreset:${h.id}">Reset filters</button>`}</div>`}}
const fillsEmpty=(h,g)=>{const G=GEAR[g];if(!wearOK(h,g))return false;if(G.cons)return true;const ks=SLOT_KEYS[G.slot]||[G.slot];
  if(G.two)return !h.gear.arms&&!h.gear.arms2;return ks.some(s=>!h.gear[s]&&!(s==='arms2'&&h.gear.arms&&GEAR[h.gear.arms].two))};
/* Version 131 (Tyler): a hero dropdown narrows the equip filters to one hero */
function wsMatch(k,f,canMake){const g=GEAR[k],R=f.hero&&f.hero!=='all'?roster().filter(h=>h.id===f.hero):roster();if(!isUnlocked('gear:'+k))return false;
  if(f.aff==='craft'&&!canMake(k)||f.aff==='cant'&&canMake(k))return false;
  if(f.eq==='empty'&&!R.some(h=>fillsEmpty(h,k))||f.eq==='can'&&!R.some(h=>wearOK(h,k))||f.eq==='cannot'&&R.some(h=>canWear(h,k)))return false;
  if(f.disc!=='all'&&g.type!==f.disc&&!(g.reqs&&g.reqs[f.disc]))return false;
  if(f.slot!=='all'&&g.slot!==f.slot)return false;
  return gearQ(k,f.q)}
function wsFind(canMake,card){const f=wsfOf(),ks=Object.keys(GEAR).filter(k=>wsMatch(k,f,canMake)).sort((a,b)=>canMake(b)-canMake(a)||!!GEAR[a].cons-!!GEAR[b].cons||GEAR[a].req-GEAR[b].req||GEAR[a].name.localeCompare(GEAR[b].name));
  const hn=f.hero!=='all'&&roster().find(h=>h.id===f.hero),O=hn?{...WSF_OPTS,eq:[['empty',`Fills ${hn.name}'s empty slot`],['can',`${hn.name} can equip`],['cannot',`${hn.name} can't equip`],['any','Any']]}:WSF_OPTS,sel=k=>wsSel(f,O,k);
  const dflt=Object.keys(WSF_OPTS).every(k=>f[k]===WSF_OPTS[k][0][0])&&!f.q&&f.hero==='all';
  const heroSel=`<select data-wsf="hero" aria-label="hero"><option value="all">All heroes</option>${roster().map(h=>`<option value="${h.id}" ${f.hero===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select>`;
  return `<div class="eyebrow">Find gear</div><div class="wsf"><input id="wsq" class="wsq" type="search" autocomplete="off" placeholder="Search names and abilities" value="${esc(f.q)}">${Object.keys(WSF_OPTS).map(sel).join('')}${heroSel}</div>
    <div class="row between small"><span class="muted">${ks.length} match${ks.length===1?'':'es'}</span>${dflt?'':'<button class="btn sm" data-a="wsfreset">Reset filters</button>'}</div>
    ${ks.length?`<div class="grid2">${ks.slice(0,40).map(card).join('')}</div>${ks.length>40?`<div class="small muted">Showing the first 40. Narrow the search to see the rest.</div>`:''}`:`<div class="cap">Nothing matches. ${f.aff==='craft'&&f.eq==='empty'?'Nothing you can afford right now fills an empty slot. Try "Someone can equip" or "Can\'t afford".':'Try loosening a filter.'}</div>`}`}
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.wsf;if(!k)return;wsfOf(e.target.dataset.wsh)[k]=e.target.value;render()});
document.addEventListener('input',e=>{if(!e.target.classList||!e.target.classList.contains('wsq'))return;const hid=e.target.dataset.wsh,v=e.target.value,p=e.target.selectionStart;wsfOf(hid).q=v;render();const n=document.querySelector(hid?`.wsq[data-wsh="${hid}"]`:'#wsq');if(n){n.focus({preventScroll:true});try{n.setSelectionRange(p,p)}catch(_){}}});
function coll(id,head,inner,def=true,cls=''){return `<details class="coll ${cls}" data-cid="${id}" ${uiOpen(id,def)?'open':''}><summary>${head}</summary><div class="cbody">${inner}</div></details>`}
if(!FAST)document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.cid){S.ui=S.ui||{};S.ui[d.dataset.cid]=d.open;save()}},true);

/* ============ SKUNKWORKS ============ */
function rushCost(){const n=S.rd&&S.rd.issue===S.issue?S.rd.rush:0;return {tech:2+n,intel:1+n}}
function research(free){S.rd=S.rd&&S.rd.issue===S.issue?S.rd:{issue:S.issue,rush:0,free:false,last:null};
  if(free){if(S.rd.free)return;S.rd.free=true}else{const c=rushCost();if(!afford(c))return;pay(c);S.rd.rush++}
  const locked=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k));
  if(!locked.length){S.rd.last='Every gear blueprint is already on file.';return}
  const top=Math.max(...roster().map(lvlOf));
  const wearNow=locked.filter(k=>roster().some(h=>canWear(h,k)));
  const soon=locked.filter(k=>GEAR[k].req<=top+1);
  const pool=wearNow.length?wearNow:soon.length?soon:locked;const k=pick(pool);unlock(['gear:'+k]);
  S.rd.last=`Blueprint discovered: ${GEAR[k].name} (${reqTxt(GEAR[k])}, ${gearSlotN(GEAR[k])}).`}
function skunkPanel(){if(!S.facilities.includes('skunk'))return '';const rd=S.rd&&S.rd.issue===S.issue?S.rd:{free:false,rush:0,last:null};const c=rushCost();
  const left=Object.keys(GEAR).filter(k=>!isUnlocked('gear:'+k)).length;
  return `<section class="panel">${coll('hq-skunk',`<div><div class="eyebrow">Skunkworks</div><h2>Blueprint research</h2></div>`,
    `<p class="small muted" style="margin:0">One free discovery every issue. Research favors gear someone on the team can already wear. ${left} gear blueprint${left===1?'':'s'} still undiscovered.</p>
    <div class="row"><button class="btn pri" data-a="rd:free" ${rd.free||!left?'disabled':''}>${rd.free?'Free research used':'Research (free)'}</button>
    <button class="btn" data-a="rd:rush" ${afford(c)&&left?'':'disabled'}>Rush research · ${costStr(c)}</button></div>
    ${rd.last?`<div class="cap">${esc(rd.last)}</div>`:''}`)}</section>`}

/* ============ EVENT COMIC FINALE ============ */
const EVENT_TITLES=['Night of Two Masters','Total Breakout','The Long Eclipse','City Under Siege','Twilight of Heroes'];
function setupEvent(){const free=S.villains.filter(v=>v.status==='active').sort((a,b)=>b.level-a.level);const keys=free.slice(0,2).map(v=>v.key);
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
  const beatN=S.villains.filter(v=>v.beaten).length+(sd.result==='win'?S.event.keys.filter(k=>!vState(k).beaten).length:0),total=S.villains.length;
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

/* ============ PLAYTEST CHEATS ============ */
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

/* ============ TUTORIAL ============ */
/* Version 133 (Tyler): a first volume offers a guided first night. Lynx alone against two Diggers, a trip to HQ to recruit Volt and
   craft and equip a Shock Baton, then Mole Boy. The Diggers fight and Mole Boy's first round run on rails: only the highlighted control
   works and each scripted roll comes from S.tut.dq (see d20). After that round the fight plays out with real dice. Losing costs nothing
   beyond his taunt. At the end the player keeps Lynx and Volt or starts an all-new team.
   S.tut={b,dq,...}: b is the beat in TUT (0 = the offer pop-up). S.tutStash holds the real villains, pool and armory meanwhile. */
const TUT_TIPS=['sd','attack','arcs','engines','sig','tabs','salvage'];
const tutOn=()=>!!(S&&S.tut&&S.tut.b);
const tutBeat=()=>tutOn()?TUT[S.tut.b]:null;
const tutH=k=>roster().find(h=>h.cls===k);
const tutIdx=k=>S.sd?S.sd.units.findIndex(u=>{const h=heroOf(u);return !!h&&h.cls===k}):-1;
const tutU=k=>S.sd&&S.sd.units[tutIdx(k)];
const tutCell=p=>p?`cell:${p.x},${p.y}`:'';
const tutDig=id=>S.sd&&S.sd.hench.find(m=>m.id===id);
const tutMole=()=>S.sd&&S.sd.vl[0]&&S.sd.vl[0].v;
const moleState=()=>({key:'mole',level:1,scheme:0,status:'active',deck:VILLAINS.mole.base.map(id=>({id,mk:0})),advIdx:0,beaten:0});
/* select the hero, open Attack, then tap the target */
const tutAtkOnly=(k,tg)=>()=>{const sd=S.sd,i=tutIdx(k),t=tg();if(!t)return [];if(sd.sel!==i)return [tutCell(sd.units[i])];if(sd.mode!=='attack')return ['mode:attack'];return [tutCell(t)]};
const tutAtkRing=(k,tg,lbl)=>()=>{const sd=S.sd,i=tutIdx(k),t=tg();if(sd.sel!==i)return [sd.units[i].x,sd.units[i].y,'Tap '+heroOf(sd.units[i]).name];return sd.mode==='attack'&&t?[t.x,t.y,lbl]:null};
const tutAtkLit=k=>()=>S.sd.sel===tutIdx(k)&&S.sd.mode!=='attack'?'#app [data-a="mode:attack"]':null;
const tutAimDest=(k,pick)=>{const sd=S.sd,u=tutU(k),r=reachH(u,stat(heroOf(u),'move'));const c=pick(Object.keys(r).map(s=>{const[x,y]=s.split(',').map(Number);return {x,y}}));S.tut.dest=c?[c.x,c.y]:null};
const TUT=[
  {id:'offer'},
  {id:'meet',next:1,nextL:'To the subway',only:[],t:'This is <b>Lynx</b>, a tracker who fights up close. Diggers are breaking into the subway on 9th Street. Every number on this card gets explained the first time it matters, so don\'t try to memorise anything.',
    extra:()=>{const h=tutH('lynx');if(!h)return '';const st=[['hp','Health',stat(h,'maxHp')],['move','Move',stat(h,'move')],['dice','Dice',stat(h,'speed')],['acc','Accuracy','+'+stat(h,'acc')],['str','Strength','+'+stat(h,'str')],['eva','Evasion',stat(h,'eva')],['rng','Range',stat(h,'range')],['comp','Composure',stat(h,'maxComp')]];
      return `<div class="tutst">${st.map(([i,l,v])=>`<span>${UI(i)}<b>${v}</b><small>${l}</small></span>`).join('')}</div>`},
    go:()=>tutPatrol()},
  /* the Diggers */
  {id:'p-sel',only:()=>[tutCell(tutU('lynx'))],ring:()=>{const u=tutU('lynx');return [u.x,u.y,'Tap Lynx']},done:()=>S.sd.sel===tutIdx('lynx'),
    t:'Two Diggers, and they\'ve spotted you. <b>Tap Lynx</b> to take control.'},
  {id:'p-move',enter:()=>{const B=tutDig('tB'),A=tutDig('tA');tutAimDest('lynx',ps=>ps.filter(p=>cheb(p,A)===1&&cheb(p,B)>=2).sort((p,q)=>cheb(p,B)-cheb(q,B)||cheb(p,tutU('lynx'))-cheb(q,tutU('lynx')))[0])},
    only:()=>S.tut.dest?[`cell:${S.tut.dest.join(',')}`]:[],ring:()=>S.tut.dest?[...S.tut.dest,'Move here']:null,done:()=>tutU('lynx').moved,
    t:'Each round a hero can <b>move once</b> and take <b>one action</b>, like an attack. Selecting a hero opens Move, and the blue hexes are in reach. Lynx hits at range 1, so get next to a Digger: <b>tap the ringed hex</b>.'},
  {id:'p-atk',dq:[14,2],only:tutAtkOnly('lynx',()=>tutDig('tA')),ring:tutAtkRing('lynx',()=>tutDig('tA'),'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'Now hit it. Lynx rolls 2 dice. <b>Tap Attack</b>, then the ringed Digger.'},
  {id:'p-roll',only:[],done:()=>!S.sd.busy,t:'Each die is a <b>d20 plus accuracy</b>. Match or beat the target\'s evasion to hit. 14 + 4 = 18 beats evasion 7, but 2 + 4 = 6 falls short. One hit, one miss, and each hit does 1 damage to a henchman.'},
  {id:'p-end',dq:[9,1],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=2,
    t:'Lynx has moved and attacked. <b>End the round</b> and the bad guys take their turn.'},
  {id:'p-enemy',next:1,only:[],wait:()=>!S.sd.busy,t:'Henchmen roll too: a d20 + 2 against Lynx\'s evasion of 10. The first Digger rolled 9 and landed a hit for 1. The other rolled a <b>natural 1, which always misses</b>, whatever the bonus.'},
  {id:'p-lp',next:1,only:[],wait:()=>{const B=tutDig('tB');return !!B&&S.tut.lp===`${B.x},${B.y}`},ring:()=>{const B=tutDig('tB');return B?[B.x,B.y,'Hold']:null},
    t:'Round 2. Hold your finger on any hex (or hold the mouse button) to see what\'s on it and your odds. <b>Long-press the fresh Digger.</b>'},
  {id:'p-atk2',dq:[20,12],only:tutAtkOnly('lynx',()=>tutDig('tB')),ring:tutAtkRing('lynx',()=>tutDig('tB'),'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'Lynx is already in place, so no need to move. <b>Tap Lynx, then Attack, then the fresh Digger.</b>'},
  {id:'p-roll2',only:[],done:()=>!S.sd.busy,t:'A <b>natural 20 always hits</b>, whatever the evasion. Remember that against tough villains.'},
  {id:'p-end2',dq:[5],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=3,t:'One Digger left. <b>End the round.</b>'},
  {id:'p-atk3',dq:[16,8],only:tutAtkOnly('lynx',()=>tutDig('tA')),ring:tutAtkRing('lynx',()=>tutDig('tA'),'Attack'),lit:tutAtkLit('lynx'),done:()=>!!S.sd.result,
    t:'It missed. Finish the job: <b>Lynx, Attack, Digger.</b>'},
  {id:'p-won',only:['tut:hq'],lit:()=>'#app [data-a="tut:hq"]',done:()=>S.phase==='hq',t:'Subway safe! These Diggers work for a villain called Mole Boy, and they dropped his <b>salvage</b>, called Grit. <b>Head back to HQ.</b>'},
  /* HQ */
  {id:'h-grit',next:1,only:[],lit:()=>'.mast .chip[aria-label="Grit"]',t:'Your 2 Grit sits in the masthead with your other resources. Every villain drops their own kind of salvage, and the Workshop turns it into gear.'},
  {id:'h-recruit',only:['qb:volt'],lit:()=>'#app [data-a="qb:volt"]',done:()=>!!tutH('volt'),t:'Lynx fights up close. Volt hits from 4 hexes away. Heroes who fight differently cover each other. <b>Recruit Volt.</b>'},
  {id:'h-craft',only:['craft:baton'],lit:()=>'#app [data-a="craft:baton"]',done:()=>S.armory.includes('baton')||(tutH('volt')&&tutH('volt').gear.arms==='baton'),
    t:'Crafting spends salvage and puts the item in your armory. Volt has a rank in Tech, so a Tech weapon fits. <b>Craft the Shock Baton.</b>'},
  {id:'h-roster',enter:()=>{const V=tutH('volt');S.ui=S.ui||{};S.ui['ro-party']=true;if(V)S.ui['h-'+V.id]=true},only:['view:roster'],lit:()=>'#app [data-a="view:roster"]',done:()=>S.view==='roster',
    t:'The baton is in the armory. <b>Open the Roster tab</b> to hand it to Volt.'},
  {id:'h-slot',only:()=>{const V=tutH('volt');return [`slotpick:${V.id}:arms`]},lit:()=>`#app [data-a="slotpick:${tutH('volt').id}:arms"]`,done:()=>!!slotPick&&slotPick.h===tutH('volt').id,
    t:'Empty gear slots are buttons. <b>Tap Volt\'s Main Hand slot</b> to see what fits it.'},
  {id:'h-equip',only:()=>{const V=tutH('volt');return [`equip:${V.id}:baton:arms`,`slotpick:${V.id}:arms`]},lit:()=>{const V=tutH('volt');return slotPick?`#slotpick [data-a="equip:${V.id}:baton:arms"]`:`#app [data-a="slotpick:${V.id}:arms"]`},
    done:()=>tutH('volt').gear.arms==='baton',t:'<b>Tap the Shock Baton</b> to equip it.'},
  {id:'h-stats',next:1,only:[],lit:()=>`[data-cid="h-${tutH('volt').id}"] .stats`,t:'Volt\'s accuracy and Strength went up. The baton also gives Volt a new fight button, <b>Stun Charge</b>: it spends Power for +3 Strength on the next attack.'},
  {id:'h-vil',only:['view:villains'],lit:()=>'#app [data-a="view:villains"]',done:()=>S.view==='villains',t:'A case file just landed on your desk. <b>Open the Villains tab.</b>'},
  {id:'h-go',only:['tut:fight'],lit:()=>'#app [data-a="tut:fight"]',done:()=>S.phase==='sd',
    t:'Normally you investigate a villain first to learn their tricks. Tonight there\'s no time: Mole Boy is tunnelling under the bank right now. <b>Confront him.</b>'},
  /* Mole Boy, round 1 */
  {id:'b-splash',only:['sdgo'],lit:()=>'[data-a="sdgo"]',done:()=>!S.sd.intro,t:'Every fight opens with the villain\'s splash page. <b>Fight!</b>'},
  {id:'b-pages',next:1,only:[],lit:()=>'#app .pips',t:'Villains have no health bar. Their <b>playbook is their health</b>: every wound tears out a page. Mole Boy has 4 pages, so 4 wounds beat him.'},
  {id:'b-sig',next:1,only:[],lit:()=>'#app .cap.warn',t:'Wounds always tear out the <b>top</b> page, and his top page is a Signature Move, Big Dig. Wound him this round and it never happens.'},
  {id:'b-arcs',next:1,only:[],lit:()=>'#app .boardwrap',t:'The yellow arrow shows where he faces, and the tinted hexes in front are his <b>front arc</b>. The shaded hexes behind him are his <b>blind spot</b>: attacks from there roll +1 die. Some hit reactions only trigger from one side.'},
  {id:'b-volt',only:()=>[tutCell(tutU('volt'))],ring:()=>{const u=tutU('volt');return [u.x,u.y,'Tap Volt']},done:()=>S.sd.sel===tutIdx('volt'),t:'Volt first. <b>Tap Volt.</b>'},
  {id:'b-stun',only:['combatMenu:abilities','combatPick:ability:baton','combatUse'],lit:()=>S.sd.combatPick&&S.sd.combatPick.key==='baton'?'#app [data-a="combatUse"]' :'#app .abilities-dropdown .combat-menu-toggle',done:()=>{const u=tutU('volt');return u.buffStr>=3&&!S.sd.busy},
    t:'Mole Boy\'s skull is thick. <b>Stun Charge</b> spends 2 Power for +3 Strength on Volt\'s next attack. <b>Open Abilities, select Stun Charge, read its details, then tap Activate ability.</b>'},
  {id:'b-vatk',dq:[17,1,6],only:tutAtkOnly('volt',tutMole),ring:tutAtkRing('volt',tutMole,'Attack'),lit:tutAtkLit('volt'),done:()=>tutU('volt').acted,
    t:'Volt can hit him from 4 hexes away. <b>Tap Attack, then Mole Boy.</b>'},
  {id:'b-vres',only:[],done:()=>!S.sd.busy,t:'Every hit draws a <b>hit reaction</b>, then rolls <b>d20 + Strength against toughness</b>. Hard Hat added +4 toughness because Volt hit him from the front, but Stun Charge got the wound through: 6 + 7 = 13 against 12. Without it, 6 + 4 = 10 would have bounced. And there goes Big Dig!'},
  {id:'b-lynx',only:()=>[tutCell(tutU('lynx'))],ring:()=>{const u=tutU('lynx');return [u.x,u.y,'Tap Lynx']},done:()=>S.sd.sel===tutIdx('lynx'),t:'Now Lynx. <b>Tap Lynx.</b>'},
  {id:'b-lmove',enter:()=>{const v=tutMole();tutAimDest('lynx',ps=>{const near=ps.filter(p=>dV(p,v)===1),u=tutU('lynx');return (near.filter(p=>sideOf(p,v)==='rear')[0]&&near.filter(p=>sideOf(p,v)==='rear').sort((a,b)=>cheb(a,u)-cheb(b,u))[0])||near.sort((a,b)=>cheb(a,u)-cheb(b,u))[0]})},
    only:()=>S.tut.dest?[`cell:${S.tut.dest.join(',')}`]:[],ring:()=>S.tut.dest?[...S.tut.dest,'Blind spot']:null,done:()=>tutU('lynx').moved,
    t:'Lynx moves 5. Swing around behind him: <b>tap the ringed hex</b> in his blind spot.'},
  {id:'b-latk',dq:[12,9,1,10,4],only:tutAtkOnly('lynx',tutMole),ring:tutAtkRing('lynx',tutMole,'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'From the blind spot Lynx rolls 3 dice instead of 2. <b>Tap Attack, then Mole Boy.</b>'},
  {id:'b-lres',only:[],done:()=>!S.sd.busy,t:'<b>Soft Belly</b> only triggers from the blind spot, so that wound landed for free. A hit doesn\'t always wound, though: the Clean Hit rolled 4 + 2 = 6, short of his toughness of 8.'},
  {id:'b-end',dq:[13],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=2,t:'Both heroes have acted. <b>End the round.</b>'},
  {id:'b-vturn',next:1,only:[],wait:()=>!S.sd.busy,t:'Every round the villain plays the top page of its playbook. <b>Tunnel Ambush:</b> he dug under the floor and burst up next to the hero farthest away, leaving rubble where he went down.'},
  {id:'b-actions',next:1,only:[],t:'<b>Combat menus:</b> Abilities holds your hero\'s primary power and equipment abilities. Other Actions holds Escort, Hack, Rally Spirit, and Avoid Damage. Icons show whether a choice uses your action, movement, or is free. <b>Selecting an entry only shows its details below the controls.</b> Tap Activate to use it; Cancel backs out without spending anything.'},
  {id:'b-rally',next:1,only:[],t:'<b>Rally Spirit:</b> In Other Actions, select Rally Spirit and tap Activate, then target yourself or an ally within a number of hexes equal to your <b>total discipline ranks</b>. Restore up to <b>3 Composure</b>, never above the target\'s maximum. Rally Spirit costs your action, so plan before ending the round.'},
  {id:'b-avoid',next:1,only:[],t:'<b>Avoid Damage:</b> In Other Actions, select Avoid Damage and tap Activate to spend your action for <b>+3 Evasion</b> against incoming attacks, or <b>+5</b> if next to valid cover such as walls, rubble, allies, civilians, or a terminal. A missed attack can strike cover in its path if that cover is a valid target. Hazards do not count as safe cover.'},
  {id:'b-free',next:1,nextL:'Play on',only:[],go:()=>{S.tut.dq=[];S.tips=[...new Set([...(S.tips||[]),...TUT_TIPS])]},
    t:'That\'s the end of the script. Mole Boy has 2 pages left. <b>Finish him off on your own</b>, with real dice. Long-press anything you\'re unsure about.'},
  {id:'free'},
  {id:'end'}];
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
  faceTo(sd.units[1]);sd.intro=!FAST;S.phase='sd';S.view='mission';vWarn();
  log('sys','Issue #1: Mole Boy\'s tunnel under the First City Bank. Standoff.');log('sys','Round 1. Tap a hero to act.')}
function tutFinish(){const sd=S.sd,t=S.tut,win=sd.result==='win',L=[];
  if(win){S.salvage.mole+=3;L.push('Salvaged 3 Grit from the tunnel.')}else L.push('The team is dragged out of the tunnel, a little dusty. No harm done.');
  const xp=[];sd.units.forEach(u=>{const h=heroOf(u);h.xp+=1;xp.push(`${h.name} +1`);h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});L.push(`XP earned: ${xp.join(', ')}.`);
  if(win)L.push('Mole Boy escapes into his tunnels. Something tells you he\'ll be back.');
  t.won=win;t.lines=L;S.sd=null;N=9;S.phase='tutend';S.view='mission';tutGo(TUT.findIndex(b=>b.id==='end'))}
function tutSkip(){const t=S.tut;S.sd=null;N=9;slotPick=null;t.skip=true;t.lines=null;S.phase='tutend';S.view='mission';tutGo(TUT.findIndex(b=>b.id==='end'))}
function tutClose(){S.tips=[...new Set([...(S.tips||[]),...TUT_TIPS])];S.tut=null;S.tutDone=true;S.tutStash=null;S.sd=null;N=9;S.phase='hq';S.view='hq'}
function tutKeep(){const st=S.tutStash||{};S.villains=(st.villains||S.villains).filter(v=>v.key!=='mole');S.pool=st.pool||S.pool;S.armory=[...(st.armory||[]),...S.armory];
  roster().forEach(h=>{h.hp=stat(h,'maxHp');h.comp=stat(h,'maxComp')});tutClose();revealStartingVillains();S.guide={s:1,pop:null}}
function tutFresh(){const keep={tips:S.tips,seen:S.seen,seenR:S.seenR,tipsOff:S.tipsOff};newCampaign();Object.assign(S,keep);tutClose()}
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

/* ============ INPUT ============ */
document.addEventListener('click',e=>{
  {const c0=e.target.closest('[data-cell]'),e0=e.target.closest('[data-a]');if(tutBlock(c0&&S.phase==='sd'?'cell:'+c0.dataset.cell:e0&&!e0.disabled?e0.dataset.a:null))return}
  const cell=e.target.closest('[data-cell]');if(cell&&S.phase==='sd'){onCell(...cell.dataset.cell.split(',').map(Number));return}
  const el=e.target.closest('[data-a]');if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;const[a,p1,p2,p3]=el.dataset.a.split(':');
  switch(a){
    case 'view':S.view=p1;break;
    case 'wsby':S.ui=S.ui||{};S.ui.wsBy=p1;break;
    case 'build':if(facOpen(p1)&&afford(FAC[p1].cost)){pay(FAC[p1].cost);S.facilities.push(p1)}break;
    case 'craft':case 'crafteq':if(GEAR[p1]&&afford(GEAR[p1].cost)&&anyAsk(GEAR[p1].cost)){pickAny(GEAR[p1]).then(pk=>{if(pk)doCraft(a,p1,p2,pk);render()});return}doCraft(a,p1,p2);break;
    case 'anyauto':S.anyAuto=p1==='1';break;
    case 'equip':{const h=S.heroes.find(x=>x.id===p1);slotPick=null;if(!h||!(S.phase==='hq'||prepGear()))break;equipHero(h,p2,p3);break}
    case 'wsfreset':{S.ui=S.ui||{};S.ui.wsf={};break}
    case 'effreset':{S.ui=S.ui||{};if(S.ui.ef)delete S.ui.ef[p1];break}
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
    case 'endround':villainPhase();return;
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
