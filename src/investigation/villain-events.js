/* investigation/villain-events.js: Per-villain investigation events (VEVENTS) and board-prep leads. */
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
const BOARD_LEADS={gallows:['A maintenance access plan','cover'],quarry:['The quarry service road','route'],cantor:['A frightened getaway driver','evac'],architect:['Stolen construction drawings','route'],helios:['A fire crew on standby','cover'],serpent:['A subway evacuation map','evac'],lode:['A scrapyard crane operator','route'],noct:['The night watch route','evac'],swarm:['A drone delivery manifest','thin'],bomber:['A sapper supply run','thin'],grid:['An emitter maintenance schedule','cover']};
const BOARD_PREP_TEXT={cover:'Two barricades start near your entry line.',route:'Clear a two-hex-wide approach through rubble, walls, pits and molten floor.',evac:'Civilians start near the south exits instead of deep in the lair.',thin:'Remove one regular starting henchman (never an elite).'};
for(const [k,[title,kind]] of Object.entries(BOARD_LEADS))VEVENTS[k].push({id:k+'_board',title,txt:()=>`You find a way to change the battlefield before confronting ${VILLAINS[k].name}.`,opts:[
 {l:'Prepare the battlefield',h:BOARD_PREP_TEXT[kind]+' No clue gained.',run:i=>{i.boardPrep=kind;return BOARD_PREP_TEXT[kind];}},
 {l:'Trade the plan for evidence',h:'+2 clues; no board change.',run:i=>{i.clues+=2;return 'The plan yields two clues. The battlefield stays unchanged.'}},
 {l:'Prepare and investigate',h:'Spend 1 intel: board change and +1 clue.',ok:()=>S.intel>=1,run:i=>{S.intel--;i.clues++;i.boardPrep=kind;return BOARD_PREP_TEXT[kind]+' +1 clue.'}}
]});
