/* Rules Guide (Tyler, 2026-10-31): opened from the game menu. Pictures live in assets/guide/ and are
   rebuilt from the real game by tools/guide-shots.cjs. Keep the text in step with GLOSS in data.js. */
const BH_GUIDE=[
  {id:'start',t:'The campaign',img:'mast',alt:'The masthead: volume, arc and issue, resources and the Menu button',b:`
<p>You run the <b>Blackharbor Guardians</b>, a team of heroes protecting the city. A campaign is one <b>Volume</b>: three <b>Arcs</b> of six <b>Issues</b> each, then an event-comic <b>finale</b> where two villains strike together.</p>
<p>Every issue follows the same loop:</p>
<ol><li><b>HQ:</b> build, craft gear, and pick your team of up to 4 heroes.</li>
<li><b>Investigate</b> one villain to gather clues.</li>
<li><b>Fight</b> that villain in their lair.</li>
<li><b>Aftermath:</b> collect salvage and XP. Every villain you did not hunt moves their scheme forward.</li></ol>
<p><b>Trust</b> is the city's faith in you. Saving civilians raises it. Harmed civilians, lost fights and villain schemes lower it. If it hits 0 the team disbands and the campaign is lost.</p>
<p class="bh-guide-tip">Tip: hold your finger (or the mouse button) on almost anything, such as a stat, a hex or a keyword, to see what it does.</p>`},
  {id:'hq',t:'Headquarters',img:'hq',alt:'The HQ screen with the operations desk and base development',b:`
<p>The masthead shows your resources:</p>
<ul><li><b>Trust:</b> see above.</li>
<li><b>Tech</b> and <b>Intel:</b> spent on facilities and research. Intel also pays for some investigation options.</li>
<li><b>Salvage:</b> each villain drops their own kind (Coils from Dr. Gallows, Ledgers from The Cantor and so on). Win lair fights to earn it.</li></ul>
<p><b>Facilities</b> are built once and help for the rest of the volume: the Med Bay heals, the Training Room adds XP, and so on. The <b>Workshop</b> turns salvage into gear for your armory.</p>
<p><b>Blueprints</b> unlock over time. Tier 0 and 1 gear is open from the start, tier 2 in Arc 2, tier 3 halfway through Arc 2, and tier 4 and 5 in Arc 3. Some facilities open only after you beat a particular villain in their lair.</p>`},
  {id:'heroes',t:'Your heroes',img:'hero',alt:'A hero card with disciplines, stats and the gear loadout',b:`
<p>Recruit heroes on the HQ tab, either as ready-made quick builds or through an <b>Origin Story</b>. From Arc 2, a <b>Crossover Issue</b> lets one higher-level Established Character join each arc. Up to <b>4 heroes</b> go on each mission. Benched heroes recover fully and still gain 1 XP each issue.</p>
<p>The stat row, in order: <b>Health</b>, <b>Movement</b>, <b>Attack dice</b>, <b>Accuracy</b>, <b>Strength</b>, <b>Evasion</b>, <b>Range</b> and <b>Composure</b>. Composure is the hero's nerve. Taunts drain it, and at 0 the hero is <b>Shaken</b> (−3 Strength, accuracy and evasion, −1 movement).</p>
<p>Heroes grow in three <b>disciplines</b>, each with its own engine:</p>
<ul><li><b>Tech</b> spends <b>Power</b>, which recharges a little every round.</li>
<li><b>Magic</b> spends <b>Arcana</b>, one pool per fight with bigger spells.</li>
<li><b>Innate</b> abilities are free but need a minimum Innate rank, and each hero can use only one per round.</li></ul>
<p><b>Gear</b> fills 8 slots: Head, Body, Main Hand, Off Hand, Legs, two Accessories and a Belt, plus a pouch of 2 consumables. Tap an empty slot to see what fits. Wear 4 pieces from one villain's <b>set</b> to switch on its set bonus.</p>
<p><b>XP</b> comes from missions (+1, +1 more for landing 2 or more wounds). Each level costs one more XP than the last. On level-up, open the hero in the Roster to pick a discipline and an upgrade.</p>`},
  {id:'villains',t:'Villains',img:'villains',alt:'Villain case files with level, scheme track and playbook buttons',b:`
<p>The <b>Villains</b> tab holds a case file for every active villain: their level, their scheme track, what the streets say about how they fight, and their <b>playbook</b>.</p>
<p>A villain has no health bar. <b>The playbook is its health:</b> every wound tears out a page, and when no pages remain it is beaten. Each level adds new, stronger pages and +1 evasion, toughness and accuracy.</p>
<p><b>Schemes:</b> each issue you hunt someone else, a villain's scheme advances. When the track fills, they strike the city: −2 trust and they gain a level.</p>
<p>A villain beaten in their lair always escapes and comes back <b>one level higher</b>. At the end of every arc, active villains level up and rewrite part of their playbook, and a new villain arrives.</p>`},
  {id:'investigate',t:'Investigations',img:'investigation',alt:'An investigation lead with two approaches to choose from',b:`
<p>Before a fight you work three <b>leads</b>. Each one offers a choice: roll for a clue, or pay trust, intel or health for a sure thing. A roll is a d20 plus any bonuses (shown as "Roll 9+").</p>
<p>Your clue total sets how the fight starts:</p>
<ul><li><b>0–1 clues: Ambush.</b> The villain acts first with an extra henchman, and your heroes start scattered.</li>
<li><b>2–3 clues: Standoff.</b> You enter from the south edge and act first.</li>
<li><b>4+ clues: Prepared.</b> You can change gear first, the villain starts with 1 page torn out, and you get +1 salvage on a win. Every clue past 4 also gives +1 intel.</li></ul>
<p>Every clue also reveals one playbook page or hit reaction you had not seen. What you learn stays known.</p>`},
  {id:'fight',t:'Fights: your turn',img:'board',alt:'The lair board with heroes at the bottom, the villain, henchmen and civilians',b:`
<p>The lair is a hex board. Your heroes start at the bottom. The villain, its henchmen, civilians and an evidence terminal are spread above.</p>
<p>Tap a hero to act. Each round every hero can:</p>
<ul><li><b>Move</b> once, up to their movement. The blue hexes are in reach. The move isn't final until the hero takes their action: tap any other blue hex to change where they end up, or their starting hex to take the move back. A hero who acted first can keep adjusting until the round ends. Stepping into a beam ends the move for good.</li>
<li>Take <b>one action</b>: Attack, use an ability, or an Other Action such as Avoid Damage (+3 evasion, +5 beside cover), Escort or Hack.</li>
<li>Use pouch consumables, which are free.</li></ul>
<p>When everyone is done, tap <b>End round</b> twice. Then the villain and its henchmen take their turn.</p>`},
  {id:'attack',t:'Attacking',img:'actions',alt:'The selected hero with Move, Attack, Abilities and Other Actions',b:`
<p>An attack rolls the hero's <b>attack dice</b>, each a d20 plus <b>accuracy</b>. Every die that reaches the target's <b>evasion</b> is a hit. A natural 20 always hits and a natural 1 always misses.</p>
<p>Each hit on a villain draws a <b>hit reaction</b> (armor, a weak point, a counterattack…), then rolls to <b>wound</b>: a d20 plus <b>Strength</b> must reach the villain's <b>toughness</b>. Every wound tears a page from its playbook. Henchmen just lose 1 health per hit.</p>
<p><b>Facing:</b> the yellow arrow shows where the villain faces. The shaded cone behind it is its <b>blind spot</b>: attacks from there roll +1 die. Some hit reactions only trigger from certain sides.</p>`},
  {id:'villainturn',t:'Fights: the villain\'s turn',img:'charging',alt:'The villain panel with the charging page and the playbook pips',b:`
<p>Every round the villain plays the page sitting in its <b>charging slot</b>, then charges the next one. Its <b>Signature Moves</b> are the most dangerous pages, and it shouts a hint when one is coming.</p>
<p>Land wounds equal to <b>half the villain's level + 1</b> (rounded up) in one hero round and the threshold wound tears the charging page instead, so the villain loses that move. Telegraphed <b>charged attacks</b> mark the hexes they will hit: step out of them.</p>
<p><b>Henchmen</b> move up to 3 hexes and attack. From level 3 some villains bring a tougher <b>special henchman</b>, worth 1 salvage when taken down.</p>
<p>A hero at 0 health is knocked out of the fight. They are back at half health after the mission. If every hero is down, the fight is lost.</p>`},
  {id:'civilians',t:'Civilians, exits and the terminal',img:'playbook',alt:'The playbook pop-up showing pages left, pages torn and pages seen',b:`
<p><b>Civilians</b> are caught in the fight. Use <b>Escort</b> beside them and they follow you. Step on a green <b>exit</b> to get them out for <b>+1 trust</b> each. Every civilian the villain or its henchmen hurt costs 1 trust. Civilians left on the board at the end cost nothing.</p>
<p>Most lairs keep an <b>evidence terminal</b> at the far edge. A hero on or beside it can <b>Hack</b> it with their action for +2 intel.</p>
<p><b>Read playbook</b> (pictured) shows how many pages are left and torn, and every page and hit reaction you have seen so far.</p>`},
  {id:'after',t:'Aftermath and the finale',img:'aftermath',alt:'The aftermath screen listing salvage, XP and what happened',b:`
<p>After the fight you see what it earned or cost:</p>
<ul><li><b>Win:</b> 3 of the villain's salvage plus 1 tech (+1 if Prepared, +1 on Easy, −1 on Hard). The villain escapes and returns one level higher.</li>
<li><b>Loss:</b> −2 trust, and the villain gains a level.</li>
<li><b>Escape:</b> −1 trust, 1 salvage.</li></ul>
<p>Every hero who fought gains XP, and knocked-out heroes recover. Then the next issue starts. Early on you also make <b>defining moments</b>, permanent choices about what kind of team you are.</p>
<p>After the last issue of Arc 3 comes the <b>event comic</b>: two villains fight you at once on a bigger board. Win it to save Blackharbor.</p>`},
  {id:'menu',t:'The menu and difficulty',img:'menu',alt:'The game menu with fight options, the difficulty slider and new campaign',b:`
<p>The <b>☰ Menu</b> button in the masthead holds:</p>
<ul><li><b>Restart fight</b> and <b>Abandon fight</b> (only during a fight). Restart puts the fight back to how it was set up. Abandon counts as a loss. Both need a second tap.</li>
<li><b>Difficulty</b>, which you can change at any time:
<table class="bh-guide-table"><tr><th></th><th>Villain stats</th><th>Villain damage</th><th>Salvage per win</th></tr>
<tr><td><b>Easy</b></td><td>−3 accuracy, evasion and toughness</td><td>−1 (never below 1)</td><td>+1</td></tr>
<tr><td><b>Normal</b></td><td>as designed</td><td>as designed</td><td>as designed</td></tr>
<tr><td><b>Hard</b></td><td>+3 accuracy, evasion and toughness</td><td>+1</td><td>−1</td></tr></table>
On Easy, villains also start every lair fight with <b>1 page torn per level</b>.</li>
<li><b>Start a new campaign</b> (two taps). The old one is kept as a backup under Load.</li>
<li><b>Save</b> and <b>Load:</b> the game autosaves in your browser. A save code backs up your campaign or moves it to another device.</li></ul>`}
];
function bhGuideOpen(at){
  if(document.getElementById('bh-guide-dialog'))return;
  const last=document.activeElement;
  const d=document.createElement('dialog');
  d.id='bh-guide-dialog';d.className='bh-save-dialog bh-guide';
  d.setAttribute('aria-labelledby','bh-guide-title');
  d.innerHTML='<div class="bh-guide-top"><div class="bh-save-heading"><div><div class="eyebrow">Blackharbor</div><h2 id="bh-guide-title">Rules guide</h2></div>'+
    '<button class="btn sm" type="button" data-bh-guide-close aria-label="Close rules guide">✕</button></div>'+
    '<nav class="bh-guide-toc" aria-label="Guide sections">'+BH_GUIDE.map((s,i)=>'<button type="button" class="btn sm" data-bh-guide-go="'+s.id+'">'+(i+1)+'. '+s.t+'</button>').join('')+'</nav></div>'+
    '<div class="bh-guide-body">'+BH_GUIDE.map((s,i)=>'<section id="bh-guide-'+s.id+'" class="bh-guide-sec"><h3>'+(i+1)+'. '+s.t+'</h3>'+
      '<figure><img src="assets/guide/'+s.img+'.jpg" alt="'+s.alt+'" loading="lazy" decoding="async"></figure>'+s.b+'</section>').join('')+'</div>';
  document.body.appendChild(d);
  d.addEventListener('close',()=>{d.remove();if(last&&last.isConnected)last.focus({preventScroll:true})});
  d.addEventListener('click',e=>{
    if(e.target===d){d.close();return}
    const go=e.target.closest('[data-bh-guide-go]');
    if(go){const t=document.getElementById('bh-guide-'+go.dataset.bhGuideGo);if(t)t.scrollIntoView({block:'start',behavior:'smooth'});return}
    if(e.target.closest('[data-bh-guide-close]'))d.close();
  });
  d.showModal();
  if(at){const t=document.getElementById('bh-guide-'+at);if(t)t.scrollIntoView({block:'start'})}
}
