/* data/banter.js: short speech-bubble lines during fights. VBANTER per villain (sig: a Signature Move fires, half: playbook down to half);
   HBANTER per hero (ko: knocked out, big: tears 2+ pages in one attack, win: victory), with per-discipline fallbacks for origin heroes. Edit freely. */
const VBANTER={
  gallows:{sig:["Observe! The experiment's final stage!","Science demands a sacrifice. Yours."],half:["Interesting. The data is... unfavourable.","My notes! You are tearing my notes!"]},
  quarry:{sig:["The mountain moves. Kneel.","Feel the weight of ages!"],half:["Chip, chip. Stone has time.","You crack me. I crush you."]},
  cantor:{sig:["Now, everyone, sing!","The finale, darlings. On my cue."],half:["You are off-key, heroes.","Somebody will pay for this. Probably you."]},
  architect:{sig:["Every room I build is a cage.","Behold the blueprint of your end!"],half:["You are demolishing my masterpiece!","Load-bearing walls... failing."]},
  helios:{sig:["Look upon the sun and burn!","Noon has come for you."],half:["My light... flickers?","I am a star! Stars do not set!"]},
  serpent:{sig:["Sssswallowed whole...","The coils tighten. Forever."],half:["I shed this skin. I have more.","The tail always finds the head."]},
  lode:{sig:["Everything iron answers to me!","Feel the pull of the earth's core!"],half:["Your fists are not magnetic. Pity.","Polarity reversing... no!"]},
  noct:{sig:["Lights out.","You never see the blade."],half:["You can see me? Impossible.","The shadows are getting thin."]},
  swarm:{sig:["We are many. You are few.","Together. Now. Consume."],half:["We are fewer. We remember.","Scatter. Regroup. Return."]},
  bomber:{sig:["Fuse is lit! Count to three!","Special delivery, express!"],half:["Hey! I liked that page!","Okay, okay. Bigger boom it is."]},
  grid:{sig:["Every lane leads to me.","Grid locked. Have a nice night."],half:["Rerouting... rerouting...","Traffic jam detected. It is you."]},
  mole:{sig:["Dig dig DIG!","Surprise from below!"],half:["Hey, quit it!","My hard hat is cracking!"]}
};
const HBANTER={
  bulwark:{ko:["I held... long enough.","Shield's down..."],big:["Nothing gets past me!","Wall coming through!"],win:["Shields down. Harbor's safe.","Everyone still standing? Good."]},
  volt:{ko:["Circuit... broken...","Power failure..."],big:["Fully charged!","Ten thousand volts of nope!"],win:["Power's back on in Blackharbor.","Grid restored."]},
  wisp:{ko:["Too... slow...","Caught me..."],big:["Blink and you missed it!","Already hit you twice."],win:["Gone before the sirens.","Fastest fight of the night."]},
  cipher:{ko:["Backup plan... offline.","Rebooting..."],big:["Exploit found. Executing.","Weakness confirmed."],win:["Case closed. Logged.","Threat neutralised."]},
  rivet:{ko:["Need... a repair...","Bolts loose..."],big:["Built to break you!","Riveted!"],win:["Patch it up, ship it out.","Good as new. Mostly."]},
  lynx:{ko:["Lost the trail...","Not like this..."],big:["Got your scent!","Pounce!"],win:["Hunt's over.","Tracked and taken."]},
  goliath:{ko:["Big... fall...","Timber..."],big:["SMASH!","Too small!"],win:["Who's next?","That all you got?"]},
  sibyl:{ko:["I didn't see this one...","The vision fades..."],big:["I saw that coming.","Fate says: ouch."],win:["As foretold.","The cards were kind tonight."]},
  hexen:{ko:["The curse... bites back...","Spell broken..."],big:["Hexed and wrecked!","Feel that? That's a curse."],win:["Another spell well cast.","The night is ours."]},
  tech:{ko:["Systems failing...","Going offline..."],big:["Direct hit!","Calculated."],win:["Mission complete.","Blackharbor's safe tonight."]},
  innate:{ko:["Going down...","Can't... get up..."],big:["Take that!","Felt that one, didn't you?"],win:["Blackharbor's safe tonight.","Still standing."]},
  magic:{ko:["The light fades...","My power slips..."],big:["By the old words!","Unravelled!"],win:["The spell holds. The city is safe.","Darkness lifts, for now."]}
};
