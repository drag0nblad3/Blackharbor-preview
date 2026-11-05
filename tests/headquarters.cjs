/* Construction integration: navigation, saved facilities, costs, blueprints, and sprite coverage. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const g=require('../tools/bh').load({seed:108});
const run=s=>g.run(s),get=s=>JSON.parse(JSON.stringify(g.get(s)));
run("const savedItems=new Map();localStorage={getItem:k=>savedItems.get(k)||null,setItem:(k,v)=>savedItems.set(k,v)};newCampaign();S.guide=null;S.tut=null;S.tutDone=true;S.phase='hq';S.view='construction';S.ui={};S.tech=50;S.intel=50;S.facilities=['workshop'];render=()=>{};");
assert.match(get('nav()'),/data-a="view:construction"/);
run('storyShowing=()=>false');assert.match(get('bodyMain()'),/hq-construction/,'screen switch opens the new page');
assert.equal(get('Object.keys(HQ_FAC_ART).sort()').join(),get('Object.keys(FAC).sort()').join(),'every facility has art');
assert.match(get('hqConstructionView()'),/hq-grounds/);
assert.match(get('hqGrounds("skunk")'),/is-built[^]*facselect:workshop/);
assert.doesNotMatch(get('hqGrounds("skunk")'),/facselect:sanctum/,'unbuilt facilities stay off grounds');
const before=get('[S.tech,S.intel,S.facilities.length]');
run("ACT.facselect('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),before,'selecting artwork does not build');
assert.equal(get('S.ui.hqFacility'),'medbay');
assert.match(get('hqConstructionView()'),/hqbuild:medbay/);
run("ACT.build('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2]);
assert.match(get('hqConstructionView()'),/Operational on your grounds/);
assert.match(get('hqGrounds("skunk")'),/facselect:medbay/);
run("ACT.build('medbay')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2],'double build cannot spend or duplicate');
run("ACT.build('sanctum');ACT.build('missing');ACT.build('constructor')");
assert.deepEqual(get('[S.tech,S.intel,S.facilities.length]'),[48,50,2],'unknown and locked plans cannot build');
run("S.tech=0;ACT.build('skunk')");assert(!get('S.facilities.includes("skunk")'));
run("S.tech=50;S.phase='sd';ACT.build('skunk')");assert(!get('S.facilities.includes("skunk")'));
run("S.phase='hq';S.ui.hqFacility='invalid';hqConstructionView();S.ui.hqFacility='constructor';hqConstructionView();");
run("S.ui.hqFacility='medbay';save();S.facilities=[];load()");assert(get('S.facilities.includes("medbay")'),'existing save path persists built facilities');
assert.match(get('hqFacilityArt("medbay")'),/style="background-image:url\('assets\/headquarters\//,'sprite URLs resolve from the game document');
for(const k of get('Object.keys(HQ_FAC_ART)')){
 const a=get(`HQ_FAC_ART['${k}']`);assert(fs.existsSync(path.join(__dirname,'..','assets/headquarters',`facilities-${a[0]}.webp`)));
 assert.equal(get(`HQ_SITES['${k}'].length`),3,'every sprite has an individually placed site and size');
}
const sites=get('Object.values(HQ_SITES)');assert(new Set(sites.map(x=>x[1])).size>10,'organic sites do not form three regular rows');
// Architectural references share a world scale, then recede together with their ground depth.
for(const k of get('Object.keys(HQ_SCALE)')){
 const [referencePixels,referenceMetres]=get(`HQ_SCALE['${k}']`),[x,y,w]=get(`HQ_SITES['${k}']`);
 const renderedReference=referencePixels*(w/100*1600)/512;
 assert(Math.abs(renderedReference/referenceMetres-1600/get('HQ_WORLD_WIDTH_M')*get(`hqDistanceScale(${y})`))<1e-8,k+' follows the campus distance scale');
 assert(x-w/2>=0&&x+w/2<=100,k+' cell stays inside the waterfront horizontally');
 assert(y-.88*3*w>=0&&y+.12*3*w<=100,k+' cell stays inside the fixed 3:1 canvas vertically');
}
assert(get('hqDistanceScale(HQ_SITES.hangar[1])')<get('hqDistanceScale(HQ_SITES.training[1])'),'rear hangar recedes behind the foreground training court');
assert(get('hqDistanceScale(42)')<get('hqDistanceScale(70)'),'rear doors render smaller with distance');
assert.match(fs.readFileSync(path.join(__dirname,'..','css/headquarters.css'),'utf8'),/aspect-ratio:3\/1/,'grounds keep their authored projection instead of stretching');
// The starting Workshop previews and then becomes one physically joined drawing with Skunkworks.
run("S.facilities=['workshop']");
assert.equal(get('hqWorkshopComplex("medbay")'),'','starting Workshop stays standalone');
assert.match(get('hqWorkshopComplex("skunk")'),/hq-complex is-preview/,'selecting Skunkworks previews the whole integrated addition');
assert.match(get('hqGrounds("skunk")'),/is-complex-part/,'preview replaces separate building art');
run("S.facilities.push('skunk')");
assert.match(get('hqWorkshopComplex("medbay")'),/data-hq-complex="workshop:skunk"/);
assert.doesNotMatch(get('hqWorkshopComplex("medbay")'),/is-preview/,'built complex is solid');
assert.match(get('hqConstructionView()'),/workshop-complex.webp/,'selected facility preview uses the integrated artwork');
assert.doesNotMatch(get('hqGrounds("skunk")'),/workshop-annex|hq-annex|hq-link-roof/,'no pasted connector remains');
assert(fs.existsSync(path.join(__dirname,'..','assets/headquarters/workshop-complex.webp')));
run("S.facilities=['skunk']");assert.equal(get('hqWorkshopComplex("skunk")'),'','legacy saves without Workshop keep the standalone Skunkworks');
// The shared renderer emits the illustrated masthead and HQ tab on every real-game entry page.
for(const name of fs.readdirSync(path.join(__dirname,'..')).filter(n=>n.endsWith('.html'))){
 const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 if(!html.includes('src/ui/render.js'))continue;
 assert(html.includes('css/headquarters.css'),name+' loads shared masthead sizing');
 assert(html.includes('src/hq/construction.js'),name+' loads its construction tab handler');
}
console.log('Headquarters: navigation, previews, costs, unlocks, duplicate guards, persistence, and 17 sprite mappings pass.');
