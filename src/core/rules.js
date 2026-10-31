/* core/rules.js: Rule tables and gear helpers: upgrades, injuries, tracks, slots, stat names, set bonuses, requirement text, reactions lookup (rxOf). */
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
