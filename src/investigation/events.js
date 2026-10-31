/* investigation/events.js: General investigation events (EVENTS). */
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
