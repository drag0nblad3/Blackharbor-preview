/* tutorial/script.js: Tutorial helpers and the scripted beats (TUT). */
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
    t:'Each round a hero can <b>move once</b> and take <b>one action</b>, like an attack. Selecting a hero opens Move, and the blue hexes are in reach. Lynx hits at range 1, so get next to a Digger: <b>tap the ringed hex</b>. A move isn\'t final until the hero acts, so you can always pick a different blue hex before attacking.'},
  {id:'p-atk',dq:[14,2],only:tutAtkOnly('lynx',()=>tutDig('tA')),ring:tutAtkRing('lynx',()=>tutDig('tA'),'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'Now hit it. Lynx rolls 2 dice. <b>Tap Attack</b>, then the ringed Digger.'},
  {id:'p-roll',only:[],done:()=>!S.sd.busy,t:'Each die is a <b>d20 plus accuracy</b>. Match or beat the target\'s evasion to hit. 14 + 4 = 18 beats evasion 7, but 2 + 4 = 6 falls short. One hit, one miss, and each hit does 1 damage to a henchman.'},
  {id:'p-end',dq:[9,1],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=2,
    t:'Lynx has moved and attacked. <b>End the round</b> and the bad guys take their turn. Tap End round, then tap it again to confirm.'},
  {id:'p-enemy',next:1,only:[],wait:()=>!S.sd.busy,t:'Henchmen roll too: a d20 + 2 against Lynx\'s evasion of 10. The first Digger rolled 9 and landed a hit for 1. The other rolled a <b>natural 1, which always misses</b>, whatever the bonus.'},
  {id:'p-lp',next:1,only:[],wait:()=>{const B=tutDig('tB');return !!B&&S.tut.lp===`${B.x},${B.y}`},ring:()=>{const B=tutDig('tB');return B?[B.x,B.y,'Hold']:null},
    t:'Round 2. Hold your finger on any hex (or hold the mouse button) to see what\'s on it and your odds. <b>Long-press the fresh Digger.</b>'},
  {id:'p-atk2',dq:[20,12],only:tutAtkOnly('lynx',()=>tutDig('tB')),ring:tutAtkRing('lynx',()=>tutDig('tB'),'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'Lynx is already in place, so no need to move. <b>Tap Lynx, then Attack, then the fresh Digger.</b>'},
  {id:'p-roll2',only:[],done:()=>!S.sd.busy,t:'A <b>natural 20 always hits</b>, whatever the evasion. Remember that against tough villains.'},
  {id:'p-end2',dq:[5],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=3,t:'One Digger left. <b>End the round</b> (tap it twice).'},
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
  {id:'b-pages',next:1,only:['book:mole'],lit:()=>'#app .pips, #app [data-a="book:mole"]',t:'Villains have no health bar. Their <b>playbook is their health</b>: every wound tears out a page. Mole Boy has 4 pages, so 4 wounds beat him. <b>Read playbook</b> opens his comic and every page you have seen.'},
  {id:'b-sig',next:1,only:[],lit:()=>'#app .cap.warn',t:'Big Dig is in the <b>charging slot</b>. Mole Boy is level 1, so one wound this round tears his planned Signature Move instead of the draw pile.'},
  {id:'b-arcs',next:1,only:[],lit:()=>'#app .boardwrap',t:'The yellow arrow shows where he faces, and the tinted hexes in front are his <b>front arc</b>. The shaded hexes behind him are his <b>blind spot</b>: attacks from there roll +1 die. Some hit reactions only trigger from one side.'},
  {id:'b-volt',only:()=>[tutCell(tutU('volt'))],ring:()=>{const u=tutU('volt');return [u.x,u.y,'Tap Volt']},done:()=>S.sd.sel===tutIdx('volt'),t:'Volt first. <b>Tap Volt.</b>'},
  {id:'b-stun',only:['combatMenu:abilities','combatPick:ability:baton','combatUse'],lit:()=>S.sd.combatPick&&S.sd.combatPick.key==='baton'?'#app [data-a="combatUse"]':S.sd.combatMenuOpen==='abilities'?'#app [data-a="combatPick:ability:baton"]':'#app .abilities-dropdown .combat-menu-toggle',done:()=>{const u=tutU('volt');return u.buffStr>=3&&!S.sd.busy},
    t:'Mole Boy\'s skull is thick. <b>Stun Charge</b> spends 2 Power for +3 Strength on Volt\'s next attack. <b>Open Abilities, select Stun Charge, read its details, then tap Activate ability.</b>'},
  {id:'b-vatk',dq:[17,1,6],only:tutAtkOnly('volt',tutMole),ring:tutAtkRing('volt',tutMole,'Attack'),lit:tutAtkLit('volt'),done:()=>tutU('volt').acted,
    t:'Volt can hit him from 4 hexes away. <b>Tap Attack, then Mole Boy.</b>'},
  {id:'b-vres',only:[],done:()=>!S.sd.busy,t:'Every hit draws a <b>hit reaction</b>, then rolls <b>d20 + Strength against toughness</b>. Hard Hat added +4 toughness because Volt hit him from the front, but Stun Charge got the wound through: 6 + 8 = 14 against 12. Without it, 6 + 5 = 11 would have bounced. And there goes Big Dig!'},
  {id:'b-lynx',only:()=>[tutCell(tutU('lynx'))],ring:()=>{const u=tutU('lynx');return [u.x,u.y,'Tap Lynx']},done:()=>S.sd.sel===tutIdx('lynx'),t:'Now Lynx. <b>Tap Lynx.</b>'},
  {id:'b-lmove',enter:()=>{const v=tutMole();tutAimDest('lynx',ps=>{const near=ps.filter(p=>dV(p,v)===1),u=tutU('lynx');return (near.filter(p=>sideOf(p,v)==='rear')[0]&&near.filter(p=>sideOf(p,v)==='rear').sort((a,b)=>cheb(a,u)-cheb(b,u))[0])||near.sort((a,b)=>cheb(a,u)-cheb(b,u))[0]})},
    only:()=>S.tut.dest?[`cell:${S.tut.dest.join(',')}`]:[],ring:()=>S.tut.dest?[...S.tut.dest,'Blind spot']:null,done:()=>tutU('lynx').moved,
    t:'Lynx moves 5. Swing around behind him: <b>tap the ringed hex</b> in his blind spot.'},
  {id:'b-latk',dq:[12,9,1,10,4],only:tutAtkOnly('lynx',tutMole),ring:tutAtkRing('lynx',tutMole,'Attack'),lit:tutAtkLit('lynx'),done:()=>tutU('lynx').acted,
    t:'From the blind spot Lynx rolls 3 dice instead of 2. <b>Tap Attack, then Mole Boy.</b>'},
  {id:'b-lres',only:[],done:()=>!S.sd.busy,t:'<b>Soft Belly</b> only triggers from the blind spot, so that wound landed for free. A hit doesn\'t always wound, though: the Clean Hit rolled 4 + 2 = 6, short of his toughness of 8.'},
  {id:'b-end',only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=2,t:'Both heroes have acted. <b>End the round</b> (tap it twice).'},
  {id:'b-vturn',next:1,only:[],wait:()=>!S.sd.busy,t:()=>S.sd.busy?'Mole Boy\'s turn. Watch what he does.':'Mole Boy did nothing: Volt tore out <b>Big Dig</b> while he was charging it, so he <b>lost his turn</b>. Every round a villain plays the page in his charging slot. Wound him as many times as his level in one round and you cancel it. He is already charging his next page.'},
  {id:'b-plan',next:1,only:[],lit:()=>'#app .cap',t:'Now he is charging <b>Tunnel Ambush</b>: he will burst up next to the hero farthest away. That is Volt. This round, let it through and see what a villain turn looks like.'},
  {id:'b-volt2',only:()=>[tutCell(tutU('volt'))],ring:()=>{const u=tutU('volt');return [u.x,u.y,'Tap Volt']},done:()=>S.sd.sel===tutIdx('volt'),t:'<b>Tap Volt.</b>'},
  {id:'b-avoid',only:['combatMenu:other','combatPick:other:avoidDamage','combatUse'],lit:()=>S.sd.combatPick&&S.sd.combatPick.key==='avoidDamage'?'#app [data-a="combatUse"]':S.sd.combatMenuOpen==='other'?'#app [data-a="combatPick:other:avoidDamage"]':'#app .other-actions .combat-menu-toggle',done:()=>{const u=tutU('volt');return !!u.avoidDamage&&!S.sd.busy},
    t:'<b>Other Actions</b> holds moves any hero can make. <b>Avoid Damage</b> spends Volt\'s action for +3 Evasion until next round, or +5 next to cover like walls, rubble or an ally. <b>Open Other Actions, select Avoid Damage, then tap Use action.</b> Selecting an entry only shows its details; Cancel backs out for free. Abilities that target the board skip that button: pick one, then tap the board.'},
  {id:'b-end2',dq:[7],only:['endround'],lit:()=>'#app [data-a="endround"]',done:()=>S.sd.busy||S.sd.round>=3,t:'Lynx holds back this round. <b>End the round</b> (tap it twice).'},
  {id:'b-vturn2',next:1,only:[],wait:()=>!S.sd.busy,t:()=>S.sd.busy?'Mole Boy\'s turn. Watch what he does.':'<b>Tunnel Ambush!</b> He rolled 7 + 2 = 9. That beats Volt\'s evasion of 8, but Avoid Damage raised it to 11, so he missed. Next to him in Other Actions is <b>Rally Spirit</b>: it spends your action to give an ally nearby up to 3 Composure back.'},
  {id:'b-free',next:1,nextL:'Play on',only:[],go:()=>{S.tut.dq=[];S.tips=[...new Set([...(S.tips||[]),...TUT_TIPS])]},
    t:'That\'s the end of the script. Mole Boy has 2 pages left. <b>Finish him off on your own</b>, with real dice. Long-press anything you\'re unsure about.'},
  {id:'free'},
  {id:'end'}];
