/* core/villain-deck.js: Villain decks: footprint sizes, reaction sources, card text (cardText), building cards, making/levelling villains, encounter decks. */
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
const TGN={nearest:'nearest',weakest:'most injured',farthest:'farthest',lowcomp:'least composed'};
/* Version 119 (Tyler): every charge covers more ground or more heroes, and staggering one takes as many torn pages as the villain's level */
const ZONEN={blast:'every hex within 2 of the nearest hero',blast2:'the three nearest heroes and every hex around them',line:'straight lines of hexes through the two farthest heroes',nova:'every hex within 3 of the villain',mark:'the two most injured heroes and every hex around them',hero:'the most injured hero',focus:'the most injured hero, every hex around them, and every hex in a straight line with them in all 6 directions'};
const chargeNeed=v=>tutOn()?Math.max(1,v.level):Math.ceil((v.level||1)/2)+1; // Successful wounds in one hero round (Tyler, 2026-10-30: half level plus 1, rounded up; the scripted tutorial keeps 1 wound so Big Dig can be torn).
/* Tyler (2026-10-30): upgraded pages (II, III, IV) never add damage or composure loss; those come from the villain's level.
   Each mark instead adds the next step of its page type's ladder in UPS, on top of the move, range, reach and count growth. */
const UPFX={acc:c=>{c.accUp=(c.accUp||0)+2},daze:c=>{c.daze=1},knock:c=>{c.knock=(c.knock||0)+1},ring:c=>{c.zr=(c.zr||0)+1},
  wide:c=>{c.r=(c.r||0)+1},bigger:c=>{c.radUp=1},more:c=>{c.cnt=(c.cnt||1)+1},longer:c=>{c.ttl=(c.ttl||1)+1},
  beam:c=>{if(c.pat==='aim'||c.pat==='sweep')c.cnt=(c.cnt||(c.pat==='sweep'?4:1))+1;else c.ttl=(c.ttl||1)+1},
  shakeDaze:c=>{c.shakeDaze=1},eva:c=>{c.evaUp=(c.evaUp||0)+2},twin:c=>{c.twin=1},drag:c=>{c.pull=(c.pull||0)+1},two:c=>{c.tgts=2},
  rush:c=>{c.rush=1},reach:c=>{c.emv=(c.emv||2)+1;c.ereach=(c.ereach||3)+1}};
const UP_HIT=['acc','daze','knock'];
const UPS={strike:UP_HIT,multi:UP_HIT,sweep:UP_HIT,rampage:UP_HIT,swallow:UP_HIT,converge:UP_HIT,scatter:UP_HIT,double:UP_HIT,shadow:UP_HIT,burrow:UP_HIT,shrapnel:UP_HIT,
  pull:['acc','daze','wide'],repel:['daze','wide','wide'],charge:['ring','daze','ring'],airburst:['ring','daze','ring'],
  bomb:['bigger','daze','more'],leap:['bigger','daze','more'],swapbomb:['bigger','daze'],beam:['longer','daze','beam'],hazard:['more','wide','longer'],
  taunt:['wide','shakeDaze','wide'],fade:['eva','twin'],puppet:['drag','two','drag'],summon:[null,'rush'],endanger:['reach','daze','reach']};
function applyMk(c,mk){c={...c};if(!mk)return c;
  if(c.k!=null)c.k+=Math.ceil(mk/2);if(c.mv)c.mv+=mk;if(c.rng>1)c.rng+=mk;
  if(c.r!=null&&(c.t!=='hazard'||c.grow))c.r+=Math.floor(mk/2);if(c.len)c.len+=mk;if(c.ttl)c.ttl+=Math.floor(mk/2);if(c.cnt)c.cnt+=Math.floor(mk/2);
  if(c.t==='reanimate')c.heal=1+Math.floor(mk/2);
  (UPS[c.t]||[]).slice(0,mk).forEach(u=>{if(u)UPFX[u](c)});return c}
/* extra lines for upgrade riders, shown on the page */
function upText(c){const o=[],hit=c.zone==='hero'?'Marked heroes':['charge','airburst'].includes(c.t)?'Heroes caught':['bomb','leap','swapbomb'].includes(c.t)?'Heroes caught in a blast':c.t==='beam'?'Heroes a beam hits':'Heroes it hits';
  if(c.accUp)o.push(`Its attacks get +${c.accUp} accuracy.`);
  if(c.daze)o.push(c.t==='endanger'?'The hero who takes the blow can\'t move next round.':c.t==='repel'?'A hero who slams into something can\'t move next round.':`${hit} can't move next round.`);
  if(c.knock)o.push(`${hit} are knocked back ${c.knock} hex${c.knock>1?'es':''}.`);
  if(c.shakeDaze)o.push('Shaken heroes it reaches can\'t move next round.');
  if(c.twin)o.push('A second double steps out beside the hero with the least composure.');
  if(c.rush)o.push('They attack as soon as they arrive.');
  if(c.zr&&c.zone!=='hero')o.push(`The marked area reaches ${c.zr} hex${c.zr>1?'es':''} further.`);
  return o.length?' '+o.join(' '):''}
/* hit reaction text with the level bonus to composure loss (reactions drain comp + compBonus) */
const rxTxt=(r,lv)=>{const b=r&&r.comp?compBonus(lv):0;return b?r.txt.replace(/loses (\d+) ([Cc]omposure)/,(m,n,w)=>`loses ${+n+b} ${w}`):r.txt};
function cardText(c,vk){const hn=VILLAINS[vk].hench.name.toLowerCase(),D=n=>(n||0)+(c.lvd||0); /* Tyler (2026-10-30): pages show damage with the level bonus (dmgScale) */
  const area=(c.radius||1)>1?`${1+3*c.radius*(c.radius+1)} hexes (radius ${c.radius})`:'7 hexes (radius 1)';
  switch(c.t){
    case 'circuit':return 'Links the two nearest heroes until the next boss action. Power-costing abilities drain 1 Composure from the other hero. Separate by 4 hexes to break the link permanently.';
    case 'heave':return 'Marks a three-hex line through the nearest hero. Before the next boss action, it rises into permanent rubble. Occupants are pushed to the nearest open hex; trapped heroes take 2 damage. Occupied hexes cannot become rubble.';
    case 'collection':return 'Each hired gun moves up to 2 hexes toward a civilian and takes custody when adjacent. Guards already holding a civilian drag them up to 2 hexes toward the board edge. Captives remain on the board; defeat their guard to free them.';
    case 'renovate':return 'Marks the nearest hero and the surrounding six hexes. Before the next boss action, rubble and temporary walls inside disappear; empty perimeter hexes become walls for 2 hero rounds. Occupants leave doorways.';
    case 'solar':return 'Until the next boss action, abilities used within 2 hexes add 1 Heat (maximum 4). Then heroes within 2 take damage equal to Heat. At 3 or 4 Heat, Helios also tears one draw-pile page.';
    case 'satellites':return 'Turns up to two rubble hexes within 3 into satellites (maximum two). Each absorbs one successful attack wound, then falls beside Lodestone toward the attacker. An adjacent hero may spend an action to pull one down reliably.';
    case 'double':return `A shadow double steps out beside the hero with the least composure within ${c.rng} and strikes them for ${D(c.dmg)}. The double cannot be harmed. It stays, locks in a copy of her next planned page and plays it from where it stands even if her own page is torn, then dissipates.`;
    case 'shadow':return 'Marks the nearest hero. Their next change of position leaves a 1-HP shadow at the old hex if clear. Before Nocturne’s next action she swaps with it; destroy it to prevent the swap. An unmoved mark expires.'+(c.knife?` She also throws a knife at that hero from up to ${c.rng} away for ${D(c.knife)}, and they lose ${c.comp} composure.`:'');
    case 'borrow':return 'Infests up to two regular mites, replacing up to two secondary swarm-body origins for the next action. Destroying a carrier removes that origin for that action. No extra attacks; infestation expires after that action.';
    case 'strike':return (c.mv?`Moves ${c.mv} toward the ${TGN[c.tgt]} hero, then hits at range ${c.rng} for ${D(c.dmg)}.`:`Hits the ${TGN[c.tgt]} hero from up to ${c.rng} away for ${D(c.dmg)}.`)+(c.col?' Civilians next to the target are harmed.':'')+(c.comp?` The target loses ${c.comp} composure.`:'')+(c.dupeLow?' If the target has half their composure or less, an untouchable shadow double steps out beside them; it locks in a copy of her next planned page and plays it even if her own page is torn, then dissipates.':'');
    case 'burrow':return `Dives underground and bursts up next to the farthest hero, then hits them for ${D(c.dmg)}. Leaves rubble where it went down.`;
    case 'multi':return `Hits up to ${c.cnt} heroes within ${c.rng} for ${D(c.dmg)} each.`;
    case 'sweep':return `Everything within ${c.r} takes ${D(c.dmg)}. Civilians caught are harmed.`;
    case 'rampage':return `Moves ${c.mv} toward the nearest hero, then everything adjacent takes ${D(c.dmg)}.`;
    case 'summon':return `${c.k} ${hn}s join the fight.`;
    case 'endanger':return `Moves ${c.emv||2} toward the nearest civilian and harms them from up to ${c.ereach||3} away. A hero next to them ${c.comp?`loses ${c.comp} Composure`:`takes ${D(c.dmg)} damage`} instead.`;
    case 'taunt':return `Heroes within ${c.r} lose ${c.amt} composure.`+(c.shakenDmg?` Shaken heroes (no composure left) also take ${c.shakenDmg} damage.`:'');
    case 'henchvolley':return 'Every hired gun already within range 2 of a hero immediately fires one extra shot without moving. Elite henchmen do not join the volley.';
    case 'vanish':return 'Disappears and reappears far from the heroes.';
    case 'reanimate':{const n=c.heal||1;return `${n} torn page${n>1?'s return':' returns'} to the playbook.`+(c.dupe?' An untouchable shadow double steps out beside the hero with the least composure within 5; it locks in a copy of her next planned page and plays it even if her own page is torn, then dissipates.':'')}
    case 'puppet':return `${(c.tgts||1)>1?`The ${c.tgts} heroes with the least composure each lose`:'The hero with the least composure loses'} ${c.amt||1} more${c.pull?`, ${(c.tgts||1)>1?'are':'is'} dragged up to ${c.pull} hex${c.pull>1?'es':''} toward it,`:''} and cannot move next round.`;
    case 'walls':return `${c.retreat?`Backs ${c.retreat} hexes away from the nearest hero, then r`:'R'}aises ${c.lines>1?`${c.lines} walls`:'a wall'} of ${c.len} hexes between itself and the heroes. Walls crumble after ${c.ttl} rounds.`;
    case 'hazard':if(c.grow){const who=c.cnt>1?`each of the ${c.cnt} nearest heroes`:'the nearest hero';return `${c.r?'The floor caves in under':'A one-hex sinkhole opens under'} ${who}${c.r?` and every hex within ${c.r} of them`:''} for ${c.ttl} villain turns. Anyone standing in one when the villain acts takes ${D(c.dmg)}.`}return `The floor ${c.r>1?`within ${c.r} of`:'around'} ${c.cnt>1?`the ${c.cnt} nearest heroes`:'the nearest hero'} turns molten for ${c.ttl} villain turns. Anyone standing on it when the villain acts takes ${D(c.dmg)}.`;
    case 'cage':return `Fills every open hex around the nearest hero with walls for ${c.ttl} rounds.`;
    case 'shrapnel':return `Detonates every wall and rubble pile within ${c.r}. Heroes next to one take ${D(c.dmg)}. Walls are destroyed.`;
    case 'fortify':return `Rings itself with walls for ${c.ttl} rounds and recovers 1 torn page.`;
    case 'swallow':return `Slithers up to ${c.mv} after prey${c.cnt>1?`, ${c.cnt} times`:''}: a civilian first, then a hero, then the weakest ${hn}. A swallowed civilian or ${hn} makes it one hex longer for the rest of the fight. A hero is bitten for ${D(c.dmg)}, and a hero next to the civilian takes the bite instead.`;
    case 'pull':return `Drags every hero within ${c.r} up to ${c.mv} hexes toward itself, then everything adjacent takes ${D(c.dmg)}.`;
    case 'repel':return `Flings every hero within ${c.r} up to ${c.mv} hexes away. A hero who slams into a wall, rubble, the edge or another hero before flying the full distance takes ${D(c.dmg)}.`;
    case 'fade':return `Melts into the shadows and reappears a few hexes from the nearest hero. Her facing is hidden again.${c.evaUp?` She has +${c.evaUp} evasion until her next action.`:''}${c.amt?` The lights die and every hero loses ${c.amt} composure${c.shakenDmg?`; Shaken heroes also take ${c.shakenDmg} damage`:''}.`:''} An untouchable shadow double stays where she stood, locks in a copy of her next planned page and plays it even if her own page is torn, then dissipates.`;
    case 'converge':return `Every body of the swarm flies up to ${c.mv} hexes toward the nearest hero. That hero takes ${D(c.dmg)} for each body next to them.`;
    case 'scatter':return `The swarm bursts apart. Each body reappears next to a different hero and strikes them for ${D(c.dmg)}.`;
    case 'leap':return `Vaults over ${c.cnt>1?`up to ${c.cnt} heroes, one after another,`:'the nearest hero'} within ${c.mv}, sailing over anything in between, and lands on the far side facing away.${c.fuse?` Leaves a bomb on ${c.cnt>1?'each':'that'} hero's hex: ${D(c.dmg)} damage over ${area}, exploding at the start of the next villain turn.`:''} A hero with no open hex behind them can't be jumped.`;
    case 'bomb':return `Throws ${c.cnt>1?`${c.cnt} bombs, one at each of the ${c.cnt} ${TGN[c.tgt]} heroes`:`a bomb at the ${TGN[c.tgt]} hero`} within ${c.rng}. ${c.cnt>1?'Each':'It'} explodes at the start of the next villain turn for ${D(c.dmg)} damage across ${area}.`;
    case 'swapbomb':return `Swaps hexes with one of her henchmen, leaving a bomb over ${area} where she stood. The bomb deals ${D(c.dmg)} damage at the start of the next villain turn. No henchman, no swap.`;
    case 'airburst':return `Leaps to the middle of the room and charges up. On her next turn she fires instead of playing a page: ${D(c.dmg)} damage to every hero and civilian within 3 of her. Deal wounds equal to half her level plus 1 (rounded up) in one hero round to tear the charging page instead.`;
    case 'beam':{const tail=` Each beam runs to the edge, stops at the first hero it hits and knocks them back ${D(c.dmg)} hex${D(c.dmg)>1?'es':''}.`+(c.ttl>1?` The beams stay lit for ${c.ttl} turns.`:'');
      switch(c.pat){case 'star':return `Fires a beam in all 6 directions for ${D(c.dmg)}.`+tail;
        case 'fan':return `Turns to the nearest hero and fires 3 beams from its front for ${D(c.dmg)}.`+tail;
        case 'aim':return `Turns and fires a beam at ${c.cnt>1?`each of the ${c.cnt} ${TGN[c.tgt]} heroes`:`the ${TGN[c.tgt]} hero`} for ${D(c.dmg)}. A hero who isn't in a straight line with it may be missed.`+tail;
        case 'sweep':return `Fires a beam ahead, then turns and fires again, ${c.cnt} times in all, for ${D(c.dmg)} each.`+tail;
        case 'prism':return `Every ${hn} fires a beam at its nearest hero for ${D(c.dmg)}.`+tail}return ''}
    case 'charge':if(c.zone==='hero'){const n=1+(c.zr||0);return `Charges up and marks ${n>1?`the ${n} most injured heroes`:'the most injured hero'}. The mark follows ${n>1?'them':'that hero'} wherever they move. On its next turn it fires instead of playing a page: ${D(c.dmg)} damage to each marked hero, and nobody else. Deal wounds equal to half its level plus 1 (rounded up) in one hero round to tear the charging page instead.`}
      return `Charges up and marks ${ZONEN[c.zone]}. On its next turn it fires instead of playing a page: ${D(c.dmg)} damage to every hero and civilian in the marked hexes. Deal wounds equal to half its level plus 1 (rounded up) in one hero round to tear the charging page instead.`;
  }return ''}
/* the villain's own movement runs one hex further than the table says (Tyler, V76); pull/repel distances are how far heroes are dragged, so they stay */
const MV_UP=['strike','rampage','swallow','converge','leap'];
const compBonus=level=>Math.floor(Math.min(level||1,VCAP)/3);
function buildCard(vk,e,level=1){const base=VILLAINS[vk].cards[e.id],c=applyMk(base,e.mk||0);c.lvd=Math.floor((level||1)/2);c.id=e.id;c.mk=e.mk||0;c.n=base.n+(c.mk?' '+ROMAN[c.mk]:'');
  if(vk==='bomber'&&['leap','bomb','swapbomb'].includes(c.t)){c.fuse=c.fuse?1:0;c.radius=Math.min(2,(c.bigAt&&level>=c.bigAt?2:1)+(c.radUp||0))}
  /* Tyler (2026-10-30): composure loss grows by 1 at villain levels 3 and 6 */
  {const b=compBonus(level);if(b){if(c.amt!=null&&['taunt','fade','puppet'].includes(c.t))c.amt+=b;if(c.comp)c.comp+=b}}
  if(c.mv>0&&MV_UP.includes(c.t)&&!VILLAINS[vk].rooted)c.mv++;c.txt=cardText(c,vk)+upText(c);
  if(VILLAINS[vk].shape==='serpent'&&(c.t==='sweep'||c.t==='rampage'))c.txt+=' Reaches out from every hex of its body.';
  if(VILLAINS[vk].shape==='swarm'&&(c.t==='sweep'||c.t==='taunt'||c.t==='multi'))c.txt+=' Reaches out from every body of the swarm.';
  if(c.bombx)c.txt+=' Heroes standing within 1 of a bomb lose 1 more.';
  if(c.zone==='mark'||c.zone==='hero')c.txt+=' Her facing is revealed while she lines up the kill.'+(c.follow&&c.zone==='mark'?' The marks follow their targets as they move.':'');
  if((c.t==='strike'||c.t==='rampage')&&c.mv&&(VILLAINS[vk].shape==='serpent'||(SHAPES[VILLAINS[vk].shape]||[0]).length>1))c.txt+=c.crush?` Heroes in its path are shoved aside and take ${c.crush}.`:' Heroes in its path are shoved aside.';
  c.uid=Math.random().toString(36).slice(2,9);return c}
const VCAP=8;
function makeVillain(k,level){const vs={key:k,level:1,scheme:0,status:'active',deck:VILLAINS[k].base.map(id=>({id,mk:0})),advIdx:0,beaten:0};
  addAdv(vs,3+(VILLAINS[k].deckBonus||0));for(let l=1;l<Math.min(level,VCAP);l++)levelUpVillain(vs,true);return vs}
/* playbook size a villain should own at its level */
const deckSize=vs=>VILLAINS[vs.key].base.length+3+(VILLAINS[vs.key].deckBonus||0)+3*(Math.min(vs.level,VCAP)-1); /* Version 123 (Tyler): +3 pages per level again */
function addAdv(vs,n){const adv=VILLAINS[vs.key].adv,out=[];for(let i=0;i<n;i++){const id=adv[vs.advIdx%adv.length],mk=Math.floor(vs.advIdx/adv.length);vs.deck.push({id,mk});vs.advIdx++;out.push(buildCard(vs.key,{id,mk}).n)}return out}
/* Tyler, 2026-10-30: no villain level-ups from the last Arc 3 issue, so the finale meets them as Arc 3 ended. */
function levelUpVillain(vs,force){if(vs.level>=VCAP||(S.issue>=MAX_ISSUE&&!force))return [];vs.level++;return addAdv(vs,3)}
function upgradeVillain(vs,n=3){const idx=vs.deck.map((e,i)=>i).sort((a,b)=>vs.deck[a].mk-vs.deck[b].mk||a-b).slice(0,n);
  return idx.map(i=>{const before=buildCard(vs.key,vs.deck[i]).n;vs.deck[i].mk++;return `${before} → ${buildCard(vs.key,vs.deck[i]).n}`})}
// Preserve deck size and upgrade budget; sample once when an investigation begins.
function selectEncounterDeck(vs){if(VILLAINS[vs.key].intro)return;
  const def=VILLAINS[vs.key],size=vs.deck.length,marks=vs.deck.map(e=>e.mk||0).sort((a,b)=>a-b);
  const anchors=[...new Set(VINTEL[vs.key].react.map(r=>r.src).filter(Boolean))];
  const ids=Object.keys(def.cards),chosen=anchors.slice(0,size);let bag=[];
  while(chosen.length<size){if(!bag.length)bag=shuffle(ids.filter(id=>chosen.length>=ids.length||!chosen.includes(id)));if(!bag.length)bag=shuffle(ids.slice());chosen.push(bag.pop());}
  vs.deck=chosen.map((id,i)=>({id,mk:marks[i]||0}));vs.encounterIssue=S.issue;
}
