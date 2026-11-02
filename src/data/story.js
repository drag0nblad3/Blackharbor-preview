/* data/story.js: Campaign storyline text (Tyler, 2026-11-02): story pages, street rumors, villain teases about the hidden mastermind,
   Mole Boy evidence lines, finale reveals and epilogues. Plain text; {name}-style tokens are filled in by src/campaign/story.js.
   The mastermind is a pool villain reserved at the start of each volume; Mole Boy thinks he runs the show but is being used. */
const STORY_PAGES={
  assemble:{kicker:'Issue #1',title:'Assemble!',art:'mole',
    caps:['Last month, a kid in a stolen mining helmet tried to dig the city\'s gold out from under the subway. Two heroes, Lynx and Volt, stopped Mole Boy cold and chased him back into his tunnels.',
      'Blackharbor cheered for a week. Then it noticed how many other shadows were moving.',
      'Two heroes are not enough. Tonight, the Blackharbor Guardians start recruiting.']},
  assembleKept:{kicker:'Issue #1',title:'Assemble!',art:'mole',
    caps:['Mole Boy is gone, back down his tunnels with a dented helmet and a grudge.',
      'Lynx and Volt know one lucky night does not make a city safe. Blackharbor needs a team.',
      'Tonight, the Blackharbor Guardians start recruiting.']},
  rumors:{kicker:'Word on the street',title:'First rumors',
    caps:['The team is barely unpacked when the police scanner lights up. Three stories keep coming back:'],
    after:'Three villains, all surfacing in the same month. The Guardians open a case file on each.'},
  arc2:{kicker:'Arc 2',title:'Tremors',
    caps:['Small quakes rattle the harbor district. Sinkholes swallow two parked cars on Main Street.',
      'Diggers in hard hats are seen near two different lairs on the same night.',
      'And the villains are spending money they should not have. Someone is paying.']},
  arc3:{kicker:'Arc 3',title:'The map',
    caps:['The Guardians pin every lair on one map. Every pin sits on an old subway line.',
      'Someone has dug a road between them all, and someone else has paid for every shovel.',
      'The trail is cold, but it leaves a scent: {clue}']},
  finaleTease:{kicker:'Event comic',title:'Lights out',
    caps:['The tunnels go quiet. The money stops moving. Every villain in the city seems to be holding their breath.',
      'Tonight, whoever has been pulling the strings comes up to collect.']},
  revealMole:{kicker:'Event comic',title:'Miss me?',art:'mole',sfx:'SHUNK-SHUNK!',
    caps:['The street cracks open. A dented mining helmet rises out of the hole, then a grin, then two very large shovel claws.',
      '"SURPRISE! It was ME all along! I dug the tunnels! I moved the money! I organized EVERYTHING!"']},
  revealMaster:{kicker:'Event comic',title:'The true mastermind',art:'mm',
    caps:['"Organized?" A cold voice answers from the dark behind him. "You dug where I told you, boy, and you spent what I gave you."',
      '{reveal}',
      'Mole Boy\'s grin slips. "...Wait. What?"']},
  epilogueWin:{kicker:'Epilogue',title:'City saved!',art:'mm',
    caps:['{mm} is dragged out of the rubble, the whole scheme in tatters. Mole Boy is still insisting it was his plan.',
      'Blackharbor sleeps easy for the first time in months. The tunnels are sealed, mostly.',
      'Somewhere far below, something keeps digging.']},
  epilogueLoss:{kicker:'Epilogue',title:'Blackharbor falls',art:'mm',
    caps:['{mm} walks away with the city in one hand and Mole Boy\'s helmet in the other.',
      'The tunnels stay open. The money keeps moving. The Guardians will have to start again.']}
};
/* one street rumor per villain, shown when the starting villains surface */
const STORY_RUMORS={
  gallows:'Power cuts along the east docks, and a lab coat seen running from a substation.',
  quarry:'A gravel pit swallowed a bulldozer. The crew swear the ground swallowed it on purpose.',
  cantor:'Half the bookies in town paid their debts early. Nobody can say who told them to.',
  architect:'A parking garage grew a floor overnight. The blueprints on file show no such floor.',
  helios:'The harbor froze in July and then boiled by morning. Weather service has no comment.',
  serpent:'Night-shift trains run late with fewer passengers than they left with.',
  lode:'Every car on Iron Street rolled uphill at midnight and parked itself in a pile.',
  noct:'Three bodyguards found asleep at their posts. None of them remember closing their eyes.',
  swarm:'A cloud of delivery drones skipped every delivery and flew in perfect circles over Old Town.',
  bomber:'Fireworks on the rooftops every night this week, but nobody ever sees a launch.',
  grid:'The crane district\'s laser fence switched itself back on, with a new owner\'s code.'
};
/* each villain teases the hidden backer once in Arc 2 and once in Arc 3 */
const STORY_TEASE={
  gallows:['Gallows, sneering: "Do you know what a proper lab costs? I do not have to know anymore."','Gallows: "My patron has excellent taste in experiments. You are about to be one."'],
  quarry:['Quarry\'s rumble shapes words: "THE ONE WHO PAYS... SAYS DIG."','Quarry: "WHEN THE BIG ONE COMES UP, THE CITY GOES DOWN."'],
  cantor:['The Cantor hums: "Even I pay my dues to someone, darling. That should frighten you."','The Cantor: "I have heard the voice that hired me. It does not sing."'],
  architect:['The Architect: "My budget tripled this season. I stopped asking where it came from."','The Architect: "These lairs are not mine. I am only furnishing them for the owner."'],
  helios:['Helios: "Fuel costs money, hero. I have never had so much."','Helios: "Even a sun has someone it orbits."'],
  serpent:['The cult chants of "the one who feeds the feeder," then scatters.','A cultist, dragged from the tunnels: "The Serpent eats. Someone else sets the table."'],
  lode:['Lodestone: "Brand-new scrap, still in the crates. Somebody likes me."','Lodestone: "When the boss calls in the debt, every girder in town answers. Not to me."'],
  noct:['A note pinned where Nocturne stood: "Paid in advance."','Nocturne, from the dark: "I know the client\'s voice. I would never tell you. I like breathing."'],
  swarm:['The drones flash a single word in formation: SPONSORED.','Murmur\'s three bodies speak as one: "We were assembled. We are owned. You will meet the owner."'],
  bomber:['Payload laughs: "First stunt in years where the insurance actually paid!"','Payload: "Big finale coming, sweetheart. Not mine. I\'m just the opening act."'],
  grid:['Gridlock: "New lenses, new lasers, no invoice. Someone wants you caged."','Gridlock: "Every grid has a control room. You have not found mine."']
};
/* the reserved mastermind: an Arc 3 clue and the line that reveals them at the finale */
const STORY_MM={
  gallows:{clue:'ozone, burnt copper and the hum of something that should not still be switched on.',reveal:'Dr. Gallows adjusts his goggles. "Every experiment needs a control group. You were mine."'},
  quarry:{clue:'fresh grit and crushed stone in every vault the money passed through.',reveal:'Mother Quarry rises behind the hole he dug. "The city is a quarry. I let you think you owned the shovel."'},
  cantor:{clue:'every debt in the city being bought up, quietly, by one voice.',reveal:'The Cantor smiles. "Everyone owes me something, little digger. You owed me everything."'},
  architect:{clue:'blueprints for tunnels drawn years before anyone started digging.',reveal:'The Architect unrolls a blueprint of the whole network. "I drew the map. You only dug the lines."'},
  helios:{clue:'scorch marks on every cash drop, as if the money had been carried by hand through fire.',reveal:'Helios Prime burns brighter. "A sun needs fuel. Your tunnels carried it to me."'},
  serpent:{clue:'shed scales in the bank vaults, and a cult that keeps praying to someone new.',reveal:'Ouroboros uncoils from the tunnel he dug. "You built my nest, child. Thank you."'},
  lode:{clue:'cash drops made by magnets, steel crates sliding through walls with no hands on them.',reveal:'Lodestone lifts every girder on the street. "You thought the steel in your tunnels held itself up?"'},
  noct:{clue:'nothing at all. Every witness who saw the paymaster has forgotten their face.',reveal:'Nocturne lets her shadow fall away. "Nobody sees me. That was the whole point of you."'},
  swarm:{clue:'drones flying the money in pieces, a thousand small payments that add up to a war chest.',reveal:'Murmur\'s cloud pours out of the tunnels. "We are many. You were one of our hands."'},
  bomber:{clue:'every hideout wired to blow, with the same signature on every fuse.',reveal:'Payload lands on the rooftop above. "Opening act\'s over, kid. This is MY finale."'},
  grid:{clue:'every vault laser-cut open from the inside, along perfect straight lines.',reveal:'Gridlock\'s beams snap on around them all. "Every grid has a control room. You were standing in it."'}
};
/* Mole Boy evidence after lair fights */
const STORY_EVIDENCE={
  tunnel:'As the dust settles, the team spots a fresh tunnel in the floor of {v}\'s lair. It is round, neat and just wide enough for a kid with shovel claws.',
  grit:'Bagging evidence in {v}\'s lair, the team finds Grit, Mole Boy\'s rock, packed into crates of brand-new gear. He is supplying them. But with whose money?'
};
const STORY_FINALE_CARD='A face in the dark. Nobody knows who it is yet.';
