// Fast, deterministic equipment balance benchmarks.
// Run manually: node tests/balance.cjs
// This measures normal d20 attack/wound probabilities, excluding special villain
// reaction cards, team auras, upgrades, rear-arc bonus and temporary effects.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const data=fs.readFileSync(path.join(__dirname,'..','data.js'),'utf8');
const {GEAR,HERO_BASE,VILLAINS}=vm.runInNewContext(data+'\n({GEAR,HERO_BASE,VILLAINS})',{}, {timeout:3000});
const chance=(stat,defense)=>{
  let successes=0;
  for(let roll=1;roll<=20;roll++)if(roll===20||(roll!==1&&roll+stat>=defense))successes++;
  return successes/20;
};
const expected=(dice,acc,str,v)=>dice*chance(acc,v.eva)*chance(str,v.tough);
// Gear benchmark is pinned to the pre-rebalance Gallows defense profile, so
// intentional villain changes do not look like unintended equipment changes.
const REFERENCE_GALLOWS={eva:11,tough:13,acc:4};
function outcome(id,hero,paired=false,flank=false,villain='gallows-reference'){
  const g=GEAR[id],h=HERO_BASE[hero],v=villain==='gallows-reference'?REFERENCE_GALLOWS:VILLAINS[villain];
  assert(g&&h&&v&&g.ab,'Unknown benchmark');
  const mod=g.mods||{},pairMod=paired?(g.pair?.mods||{}):{},f=g.ab.fx||{},pf=paired?(g.pair?.fx||{}):{};
  const m=(obj,k)=>Number(obj[k]||0);
  const n=paired?2:1;
  const dice=h.speed+n*m(mod,'speed')+m(pairMod,'speed');
  const acc=h.acc+n*m(mod,'acc')+m(pairMod,'acc');
  const str=h.str+n*m(mod,'str')+m(pairMod,'str');
  const activeDice=dice+m(f,'dice')+m(pf,'dice')+(flank?(m(f,'back')+m(pf,'back')):0);
  const activeAcc=acc+m(f,'acc')+m(pf,'acc');
  const activeStr=str+m(f,'str')+m(pf,'str');
  return {base:expected(dice,acc,str,v),active:expected(activeDice,activeAcc,activeStr,v),dice:activeDice,acc:activeAcc,str:activeStr};
}
const cases=[
  ['wraps','lynx',false,false,0.990],
  ['gaunt','volt',false,false,0.990],
  ['gaunt','volt',true,false,1.260],
  ['stinger','volt',false,false,0.825],
  ['blades','lynx',false,true,1.080],
  ['blades','lynx',true,true,1.800],
  ['claws','lynx',false,true,1.320],
  ['claws','lynx',true,true,1.750],
  ['lance','volt',false,false,1.980],
  ['soulreaver','hexen',false,false,1.690]
];
let matchupCount=0;
for(const [id,hero,pair,flank,target] of cases){
  const x=outcome(id,hero,pair,flank);
  assert(Math.abs(x.active-target)<0.001,`${id} ${pair?'paired':''} fixed Gallows reference benchmark changed: ${x.active} vs ${target}`);
  for(const villain of Object.keys(VILLAINS)){
    const s=outcome(id,hero,pair,flank,villain);
    assert(Number.isFinite(s.active)&&s.dice>=1,`${id} has invalid combat stats vs ${villain}`);
    assert(s.active+1e-9>=s.base,`${id} activation worsens expected wounds vs ${villain}`);
    matchupCount++;
  }
  console.log(`${id.padEnd(12)} ${pair?'paired':'single'} ${flank?'flank':'front'}: ${x.base.toFixed(3)} -> ${x.active.toFixed(3)} expected wounds vs fixed Gallows reference`);
}
// Guard against known problematic early/paired damage spikes without imposing
// a blanket cap on high-tier weapons or flank-specialist builds.
assert(outcome('wraps','lynx').active<=1.05,'Tier-1 Seismic Wrap damage spike');
assert(outcome('gaunt','volt',true).active<=1.40,'Paired Coil Gauntlets damage spike');
assert(outcome('blades','lynx',true,true).active<=1.95,'Paired Umbral Blade flank damage spike');
assert(outcome('claws','lynx',true,true).active<=1.90,'Paired Graft Claw flank damage spike');
assert(outcome('lance','volt').active<=2.10,'Plasma Lance damage spike');
assert.equal(GEAR.wraps.ab.fx.acc,-3);
assert.equal(GEAR.gaunt.ab.fx.acc,-2);
assert.equal(GEAR.stinger.ab.fx.acc,-2);
assert.equal(GEAR.blades.ab.fx.str,-2);
assert.equal(GEAR.claws.ab.fx.acc,-3);
assert.equal(GEAR.claws.pair.mods.speed,1,'Pairing grants exactly one attack die');
assert.equal(GEAR.claws.pair.mods.acc,-1,'Pairing reduces accuracy by one');
assert.equal(GEAR.claws.pair.mods.str||0,0,'Pairing gives no extra Strength beyond two claws');
assert.equal(GEAR.claws.pair.fx?.back||0,0,'Pairing gives no extra Frenzy die');
assert.equal(GEAR.lance.ab.fx.acc,-3);
assert.equal(GEAR.soulreaver.ab.fx.acc,-2);
// Passive avoidance baseline for a legal low-tier Wisp loadout.
const wispEva=HERO_BASE.wisp.eva+GEAR.shroud.mods.eva+GEAR.hood.mods.eva+GEAR.moonslip.mods.eva;
assert.equal(wispEva,16,'Low-tier passive Evasion stacking');
assert.equal(chance(VILLAINS.gallows.acc,wispEva),0.45);
console.log(`PASS: ${cases.length} gear configurations x ${Object.keys(VILLAINS).length} villains = ${matchupCount} attack matchups; early-tier Evasion benchmark.`);
console.log('Caution: flanking paired Graft Claws remain the highest-damage tested tier-3 combination.');
