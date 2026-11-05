/* Rejecting an unavailable build must never trap the campaign simulator in its facility loop. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const g=require('../tools/bh').load({seed:1});
g.run(fs.readFileSync(path.join(__dirname,'../tools/bot.js'),'utf8'),'bot.js');
const setup=phase=>g.run(`newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.phase='${phase}';S.facilities=[];S.unlocked=['fac:medbay'];S.heroes=[];S.party=[];S.tech=2;S.intel=0;`);
for(const phase of ['after','event']){
 setup(phase);vm.runInContext('spend()',g.ctx,{timeout:1000});
 assert.equal(g.get('S.tech'),2,phase+' does not buy facilities');assert.equal(g.get('S.facilities.length'),0);
}
setup('hq');vm.runInContext('spend()',g.ctx,{timeout:1000});
assert.equal(g.get('S.tech'),0);assert(g.get('S.facilities.includes("medbay")'));
setup('hq');g.run('ACT.build=()=>{}');vm.runInContext('spend()',g.ctx,{timeout:1000});
assert.equal(g.get('S.tech'),2,'a rejected click terminates the facility pass');
console.log('PASS: simulator spending terminates after missions, at the finale, and after rejected builds; HQ purchases still work.');
