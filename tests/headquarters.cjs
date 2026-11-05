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
// Every scale reference renders at the same pixels per metre, even for differently sized assets.
for(const k of get('Object.keys(HQ_SCALE)')){
 const [referencePixels,referenceMetres]=get(`HQ_SCALE['${k}']`),[x,y,w]=get(`HQ_SITES['${k}']`);
 const renderedReference=referencePixels*(w/100*1600)/512;
 assert(Math.abs(renderedReference/referenceMetres-1600/get('HQ_WORLD_WIDTH_M'))<1e-8,k+' shares the campus scale');
 assert(x-w/2>=0&&x+w/2<=100,k+' cell stays inside the waterfront horizontally');
 assert(y-.88*3*w>=0&&y+.12*3*w<=100,k+' cell stays inside the fixed 3:1 canvas vertically');
}
const mast=get("HQ_SITES.comms[2]*445/512"),clinicDoor=get("HQ_SITES.medbay[2]*77/512");
assert(Math.abs(mast/clinicDoor-22/2.1)<1e-8,'mast and personnel door preserve their real-world height ratio');
assert.match(fs.readFileSync(path.join(__dirname,'..','css/headquarters.css'),'utf8'),/aspect-ratio:3\/1/,'grounds keep their authored projection instead of stretching');
console.log('Headquarters: navigation, previews, costs, unlocks, duplicate guards, persistence, and 17 sprite mappings pass.');
