/* heroes/abilities.js: Gear ability text and costs (abTxt), rank perks, power engines, bridge perks, pool text. */
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
  if(f.moveEva)push('On activation, gain +1 Evasion for each hex already walked or jumped this hero round, until round end. Teleports and forced movement do not count.');
  if(f.allyEva)push(`They gain +${f.allyEva} Evasion until round end.`);
  if(f.pushAlly)push('Push another hero 1 hex away from you into a chosen safe empty hex.');
  if(f.pullAlly)push(`Pull another hero up to ${f.pullAlly} hexes toward you through chosen safe empty hexes.`);
  if(f.swapAlly)push('Exchange positions with another hero without spending either move.');
  if(f.reactionWard)push('Prevent all damage from hit reactions to the recipient until round end. Movement and other non-damage effects still apply.');
  if(f.repress)push('Repress the next revealed hit reaction against this villain. Roll to wound normally. Lasts until triggered; does not stack.');
  if(f.reactionPeek)push('Inspect the next hit reaction without consuming it.');
  if(f.revealFacing)push('Reveal the targeted villain’s facing.');
  if(a.mode==='blast')push(`Choose a visible hex within ${a.r}; deal ${f.blast[1]} damage to henchmen within ${f.blast[0]} of it.`);
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
  if(f.blind)push('The villain is blinded: −3 accuracy until the round ends.');
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
/* Capstones carry no stats (Tyler, 2026-10-30): Tech recharge, Innate unshakable + last stand, Magic tears stagger charges */
const RANK_PERK={tech:{5:{pwrRegen:1}},innate:{5:{unshake:1,lastStand:1}},magic:{5:{sigBreak:1}}};
const perkAt=(t,n)=>RANK_PERK[t][n]||{};
function rankMod(h,t,k){const own=t===BASE(h).track;let v=0;for(let n=own?2:1;n<=Math.min(h.ranks[t],RANK_MAX);n++)v+=perkAt(t,n)[k]||0;return v}
function perkTxt(t,n){const m=perkAt(t,n),s=[];for(const[k,v]of Object.entries(m)){if(k==='sigBreak')s.push('any page you tear staggers a charging Signature Move at once');else if(k==='unshake')s.push("can't be Shaken");else if(k==='lastStand')s.push('once per fight, survive a blow that would knock you out with 1 health');else if(k==='innUses')s.push('a second Innate ability once per fight, which comes back after any round in which you use no abilities');else if(k==='arcWound')s.push('+1 Arcana whenever an attack tears a page');else s.push(`${v>0?'+':''}${v} ${MODN[k]}`)}return s.join(', ')}

/* Version 22: signature powers run on the discipline engines instead of cooldowns */
const POW_ENG={arc:{d:'tech',c:2},patch:{d:'tech',c:3},barricade:{d:'tech',c:2},overclock:{d:'tech',c:3},drone:{d:'tech',c:2},emp:{d:'tech',c:3},
  brace:{d:'innate',min:1},mark:{d:'innate',min:1},quake:{d:'innate',min:1},regen:{d:'innate',min:1},berserk:{d:'innate',min:1},leap:{d:'innate',min:1},
  blur:{d:'magic',c:1},omen:{d:'magic',c:1},curse:{d:'magic',c:2},aegis:{d:'magic',c:2},drain:{d:'magic',c:2},serene:{d:'magic',c:1}};
const powCost=(pw,short)=>{const e=POW_ENG[pw];return e.d==='innate'?(short?`REQ INN ${e.min}`:`requires Innate rank ${e.min}+ and uses your Innate ability for the round`):`${e.c} ${short?TRACKS[e.d].abbr:TRACKS[e.d].res}`};
function powOk(u,h){const pw=BASE(h).power,e=POW_ENG[pw],P=POWERS[pw];if(!e||u.ko)return false;if(!P.free&&u.acted)return false;if(pw==='mark'&&u.markUsed)return false;if(pw==='curse'&&S.sd.v.repress)return false;
  if(e.d!=='innate'&&!bridgeOn(h,'paragon')&&(u.abUsed||[]).includes('pow'))return false;
  if(e.d==='innate')return potOf(h)>=e.min&&innOk(u,h);return (u.res[e.d]||0)>=(e.d==='magic'?arcCost(u,h,e.c):e.c)}
function payPow(u,h){const e=POW_ENG[BASE(h).power];if(!e)return;bossAbility(u,e.d==='tech'&&e.c>0);if(e.d!=='innate')(u.abUsed=u.abUsed||[]).push('pow');u.abRd=true;if(e.d==='magic'){payArc(u,h,e.c);return}if(e.d==='innate'){if(u.innUsed)u.capUsed=true;u.innUsed=(u.innUsed||0)+1}else u.res[e.d]=Math.max(0,(u.res[e.d]||0)-e.c)}
/* Hybrid bridge perks: rank BRIDGE_RANK+ in every listed discipline */
const BRIDGE_RANK=2;
const BRIDGE={techno:{n:'Technomancer',need:['tech','magic'],txt:'Once per round, as a free action, trade 3 Power for 1 Arcana or 1 Arcana for 3 Power.'},
  augment:{n:'Augmented',need:['tech','innate'],txt:'Once per round, when you take damage, gain that much Power (up to your max).'},
  primal:{n:'Primal',need:['innate','magic'],txt:'Turn on Blood Price in a fight: each Magic ability or power then costs 1 less Arcana and 1 composure.'},
  paragon:{n:'Paragon',need:['tech','innate','magic'],txt:'Your Tech and Magic abilities and powers have no once-per-round limit. You still pay their Power or Arcana each time.'}};
const bridgeOn=(h,k)=>BRIDGE[k].need.every(t=>(h.ranks[t]||0)>=BRIDGE_RANK);
const bridgesOf=h=>Object.keys(BRIDGE).filter(k=>bridgeOn(h,k));
const bridgeTxt=k=>`${BRIDGE[k].n} (${BRIDGE[k].need.map(t=>TRACKS[t].name+' '+BRIDGE_RANK).join(', ')}): ${BRIDGE[k].txt}`;
const arcCost=(u,h,c)=>u&&u.bloodPay&&c>0&&h.comp>=1&&bridgeOn(h,'primal')?c-1:c;
function payArc(u,h,c){const n=arcCost(u,h,c);if(n<c){h.comp-=1;log('hero',`Blood Price: ${h.name} pays 1 composure to save 1 Arcana.`)}u.res.magic=Math.max(0,(u.res.magic||0)-n)}
const engineTxt={tech:'+1 max Power',innate:'+1 Innate rank',magic:'+1 max Arcana'};
function poolTxt(h){const o=[];if(pwrMax(h))o.push(`${pwrMax(h)} Power (+${pwrRegen(h)}/round)`);if(arcMax(h))o.push(`${arcMax(h)} Arcana (per fight)`);if(potOf(h))o.push(`Innate rank ${potOf(h)}${innUses(h)>1?' (+1 Innate ability once per fight)':''}`);return o.join(' · ')||'none'}
const gainTxt=(h,t)=>{const c={...h,ranks:{...h.ranks,[t]:h.ranks[t]+1}},o=[],dp=pwrMax(c)-pwrMax(h),da=arcMax(c)-arcMax(h),dq=potOf(c)-potOf(h);if(dp)o.push(`+${dp} max Power`);if(da)o.push(`+${da} max Arcana`);if(dq)o.push(`+${dq} Innate rank`);return o.join(', ')};
