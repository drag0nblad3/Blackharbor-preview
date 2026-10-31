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
const spriteFile=path.resolve(__dirname,'..','villain-portraits.avif');
const sprite=fs.readFileSync(spriteFile);
assert.equal(sprite.subarray(4,12).toString('latin1'),'ftypavif','approved portrait sprite has AVIF image header');
assert(sprite.length>12000 && sprite.length<90000,'portrait artwork is a lightweight real image');
const atlas={gallows:[0,0],quarry:[1,0],cantor:[2,0],architect:[3,0],
  helios:[0,1],serpent:[1,1],lode:[2,1],noct:[3,1],
  swarm:[0,2],bomber:[1,2],grid:[2,2],mole:[3,2]};
const sample=[];
for(const key of names){
  const svg=get('vPortrait('+JSON.stringify(key)+')');
  assert.match(svg,/class="vportrait vportrait-card vportrait-[a-z]+"/);
  assert.match(svg,/role="img"/);
  assert(svg.includes(get('VILLAINS['+JSON.stringify(key)+'].name')+' portrait'));
  assert.match(svg,/<svg x="22" y="-4"/,'canonical figure is included');
  const cover=get('VILLAIN_COVERS['+JSON.stringify(key)+']');
  assert(svg.includes('<image href="'+cover.cover+'"'),'dossier plate uses the full-size comic cover for '+key);
  assert(get('vPortrait('+JSON.stringify(key)+",'thumb')").includes('<image href="'+cover.thumb+'"'),'small plates use the cover thumb for '+key);
  assert.match(svg,/class="vportrait-crop vportrait-cover"/,'each portrait has a dedicated clipping viewport');
  const box=svg.match(/vportrait-cover"[^>]*viewBox="([^"]+)"/)[1].split(' ').map(Number);
  assert(box[0]>=0&&box[1]>=0&&box[0]+box[2]<=320.01&&box[1]+box[3]<=480.01,'cover crop stays inside the cover for '+key);
  assert(Math.abs(box[2]/box[3]-160/116)<0.01,'cover crop keeps the plate shape for '+key);
  assert.match(svg,/overflow="hidden"/,'cover crop cannot bleed outside the plate');
  assert.match(svg,/width="320" height="480"/,'cover is positioned in thumb coordinates');
  /* without villain-covers.js (portrait-gallery.html) the AVIF sheet tile is the fallback */
  const fb=get('(()=>{const c=vprCover;vprCover=()=>null;try{return vPortrait('+JSON.stringify(key)+')}finally{vprCover=c}})()');
  assert(fb.includes('viewBox="'+(atlas[key][0]*176+3)+' '+(atlas[key][1]*148+3)+' 169 140"'),'fallback crops exact source-sheet tile for '+key);
  assert.match(svg,/<path/,'pulp portrait is illustrated');
  assert.doesNotMatch(svg,/url\(#eyeglow\)|url\(#hlface\)/,'SVG IDs are isolated');
  sample.push(svg);
}
assert.equal(new Set(sample).size,names.length,'Each villain has distinct portrait artwork');
const again=get("vPortrait('gallows')");
assert.notEqual(sample[0],again,'Repeated portraits use independent resource IDs');
assert(!get("vPortrait('unknown')"),'Unknown keys do not invent a portrait');
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
console.log('PASS: '+names.length+' professionally illustrated villain portraits map to comic-cover crops (AVIF sheet fallback) in HQ, Villains, Investigation, and Combat with SVG fallback.');
