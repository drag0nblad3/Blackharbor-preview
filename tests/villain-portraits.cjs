#!/usr/bin/env node
/* Every canonical villain needs a unique, self-contained, correctly labeled portrait. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bh=require('../tools/bh');
const game=bh.load({seed:2026});
const get=expr=>game.get(expr),run=code=>game.run(code);
const names=Object.keys(get('VILLAINS'));
assert.equal(names.length,12,'All eleven campaign villains plus Mole Boy have portrait art');
const portraits=get('CHARACTER_PORTRAITS');
assert.equal(Object.keys(portraits).length,37,'All battle characters have portrait mappings');
for(const [key,[sheet,W,H,x,y,w,h]] of Object.entries(portraits)){
 assert(fs.existsSync(path.join(__dirname,'..','assets/isometric',sheet+'.webp')),key+' atlas exists');
 assert(x>=0&&y>=0&&x+w<=W&&y+h<=H,key+' face crop stays inside atlas');
 const svg=get('spritePortrait('+JSON.stringify(key)+',"Test")');
 assert(svg.includes('data-portrait="'+key+'"'),key+' keeps its identity');
 assert(svg.includes('assets/isometric/'+sheet+'.webp'),key+' uses its battle art');
 assert(!svg.includes('<use'),'portrait does not use a legacy silhouette');
}
const sample=names.map(key=>{
 const svg=get('vPortrait('+JSON.stringify(key)+')');
 assert(svg.includes('vportrait-card vportrait-'+key));
 assert(svg.includes(get('VILLAINS['+JSON.stringify(key)+'].name')+' portrait'));
 assert(svg.includes('sprite-portrait-crop'));
 assert(!svg.includes('villain-covers')&&!svg.includes('villain-portraits.avif'));
 return svg;
});
assert.equal(new Set(sample).size,12,'Every villain has a distinct portrait');
assert(!get("vPortrait('unknown')"),'Unknown keys do not invent a portrait');
for(const cls of Object.keys(get('HERO_BASE'))){
 const svg=get('heroPortrait({cls:'+JSON.stringify(cls)+',name:"Hero"})');
 assert(svg.includes('data-portrait="'+cls+'"'),cls+' roster portrait matches battle sprite');
 assert(get('eyesArt({cls:'+JSON.stringify(cls)+',name:"Hero"})').includes('data-portrait="'+cls+'"'),cls+' combat portrait matches');
}
run("newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.heroes=['volt','bulwark','wisp','lynx'].map(x=>newHero(x));S.party=S.heroes.map(h=>h.id);S.villains=[makeVillain('cantor',2)];S.pool=[];S.phase='hq';S.view='hq'");
const hq=get('hqView()');
assert.match(hq,/vportrait-thumb vportrait-cantor/,'HQ operations contains mugshot');
const files=get("hqView('villains')");
assert.match(files,/villain-dossier-art/,'Threat card gets major portrait');
assert.match(files,/vportrait-card vportrait-cantor/);
assert.match(files,/data-a="inv:cantor"/,'Portrait does not disconnect investigate');
assert.match(files,/data-a="book:cantor"/,'Portrait does not disconnect playbook');
run("startInv('cantor')");
const investigation=get('invView()');
assert.match(investigation,/vportrait-investigation vportrait-cantor/,'Investigation shows villain target');
assert.match(investigation,/data-a="invgo"/,'Investigation actions remain');
run("startShowdown();S.sd.intro=false;S.sd.sel=0;");
const battle=get('sdView()');
assert.match(battle,/vportrait-combat vportrait-cantor/,'Combat header shows villain portrait');
assert.match(battle,/class="board/,'Hex board still present');
assert.match(battle,/class="bact"/,'Action controls still present');
const home=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(home,'index.html'),'utf8');
assert.match(index,/href="css\/villain-portraits.css"/);
const css=fs.readFileSync(path.join(home,'css/villain-portraits.css'),'utf8');
assert.match(css,/\.villain-dossier-art/);
assert.match(css,/\.vportrait-combat/);
assert.match(css,/@media \(max-width:540px\)/);
console.log('PASS: all 37 sprite portraits, nine hero identities, 12 villains, crop bounds, matching UI routes and original actions.');

assert(!/id="i-[vm]-/.test(fs.readFileSync(path.join(__dirname,'..','src/art/sprite.js'),'utf8')),'Old villain and henchman symbols are removed from the loaded sprite bank');
for(const key of names)assert(get('vWm('+JSON.stringify(key)+')').includes('data-portrait="'+key+'"'),'Playbook art also uses the new portrait');
