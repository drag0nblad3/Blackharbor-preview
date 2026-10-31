#!/usr/bin/env node
/* Visual geometry smoke: capture viewport screenshots and verify the structure at phone/desktop sizes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const shots=path.resolve('layout-shots');fs.mkdirSync(shots,{recursive:true});
 const errors=[];
 try{
  for(const size of [{name:'phone',width:390,height:844},{name:'desktop',width:1440,height:900}]){
   const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(size.name+': '+e.message));
   await page.goto('file://'+process.cwd()+'/index.html');
   const painting=await page.evaluate(async ()=>{
     const img=new Image();img.src='villain-portraits.avif';
     await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};
   });
   assert.deepEqual(painting,{width:704,height:444},'professionally illustrated sprite decodes in Chromium');
   assert.equal(await page.locator('link[href="css/pulp-details.css"]').count(),1,'pulp art layer is linked');
   await page.evaluate(()=>{
     newCampaign();recruitQuick('volt');recruitQuick('wisp');recruitQuick('bulwark');recruitQuick('lynx');
     S.tut=null;S.tutDone=true;S.guide=null;
     S.villains=[makeVillain('cantor',2)];S.pool=[];S.view='hq';S.phase='hq';render();
   });
   const checkPage=async(scene,main,aside)=>{
     await page.locator(main).waitFor();
     await page.locator(aside).waitFor();
     const measures=await page.evaluate(({main,aside})=>{
       const work=document.querySelector(main).getBoundingClientRect(),rail=document.querySelector(aside).getBoundingClientRect();
       return {work:{x:work.x,y:work.y,width:work.width},rail:{x:rail.x,y:rail.y,width:rail.width},
         viewport:window.innerWidth,bodyWidth:document.documentElement.scrollWidth};
     },{main,aside});
     assert(measures.work.width>175,scene+' main area needs usable width');
     assert(measures.rail.width>150,scene+' side rail needs usable width');
     if(size.width>=1024){
       assert(measures.rail.x<measures.work.x,scene+' rail should sit beside the working area');
       assert(Math.abs(measures.rail.y-measures.work.y)<14,scene+' columns should align');
     }else{
       assert(measures.work.width<=size.width,scene+' work surface fits phone');
     }
     assert(measures.bodyWidth<=size.width+24,scene+' horizontally overflows by '+(measures.bodyWidth-size.width)+'px');
     await page.screenshot({path:path.join(shots,size.name+'-'+scene+'.png'),animations:'disabled'});
   };
   // Suppress onboarding overlays for layout-only screenshots; they are tested separately.
   await page.addStyleTag({content:'#guide, #tutc {display:none !important}'});

   const assertStablePalette=async(scene,selectors)=>{
     const capture=()=>page.evaluate((selectors)=>{
       const root=getComputedStyle(document.documentElement);
       const fields=el=>{
         if(!el)return null;
         const c=getComputedStyle(el);
         return {background:c.backgroundColor,text:c.color,border:c.borderTopColor};
       };
       return {
         scheme:root.colorScheme,
         paper:root.getPropertyValue('--paper').trim(),
         panel:root.getPropertyValue('--panel').trim(),
         ink:root.getPropertyValue('--ink').trim(),
         elements:Object.fromEntries(selectors.map(q=>[q,fields(document.querySelector(q))]))
       };
     },selectors);
     await page.emulateMedia({colorScheme:'light'});
     const light=await capture();
     await page.emulateMedia({colorScheme:'dark'});
     const dark=await capture();
     assert.equal(light.scheme,'light','new UI uses a light color scheme for native controls');
     assert.deepEqual(dark,light,scene+': OS dark mode should not recolor game UI');
     await page.emulateMedia({colorScheme:'light'});
   };
   await assertStablePalette('HQ',['body','.mast','.nav .btn','.bh-pagehead','.bh-hq-rail','.hqcols .panel','.hqcols .card']);
   const heavyArt=await page.evaluate(()=>{
     const head=document.querySelector('.bh-pagehead');
     const hq=document.querySelector('.bh-hq-rail');
     return {
       loaded:[...document.styleSheets].some(x=>x.href&&x.href.endsWith('/pulp-details.css')),
       headingShadow:getComputedStyle(head).boxShadow,
       hqTexture:getComputedStyle(hq).backgroundImage
     };
   });
   assert(heavyArt.loaded,'heavy pulp stylesheet successfully loaded');
   assert(/rgb\(215, (?:68, 68|71, 69)\)/.test(heavyArt.headingShadow), 'comic page header has offset red ink shadow');
   assert(heavyArt.hqTexture.includes('repeating-linear-gradient'),'HQ blueprint line artwork rendered');

   await checkPage('hq','.bh-hq-layout .hqcols','.bh-hq-rail');
   assert(await page.locator('.bh-hq-rail svg.vportrait').count()>0,'HQ shows villain mugshots');
   await page.locator('.nav [data-a="view:roster"]').click();
   await checkPage('roster','.bh-roster-content','.bh-roster-rail');
   await assertStablePalette('Roster',['body','.mast','.nav .btn','.bh-roster-rail','.bh-roster-content .card']);
   const heroId=await page.evaluate(()=>S.party[0]);
   await page.locator('.bh-roster-pick').first().click();
   assert.equal(await page.locator('[data-cid="h-'+heroId+'"]').getAttribute('open'),'','Selecting a hero opens the actual full sheet');
   await page.locator('.nav [data-a="view:villains"]').click();
   await checkPage('villains','.bh-threat-content','.bh-threat-rail');
   const portrait=page.locator('.villain-dossier-art svg.vportrait').first();
   assert(await portrait.count()>0,'Villain dossier illustration exists');
   const portraitRect=await portrait.boundingBox();
   assert(portraitRect&&portraitRect.width>80&&portraitRect.height>70,'Villain illustration is visible');
   await assertStablePalette('Villains',['body','.mast','.nav .btn','.bh-threat-rail','.bh-threat-content .card']);
   await page.evaluate(()=>{
     S.inv={v:'cantor',clues:3};startShowdown();
     S.sd.intro=false;S.sd.sel=0;S.sd.busy=false;
     render();
   });
   await page.locator('.bh-combat-brief').waitFor();
   assert(await page.locator('.vportrait-combat svg.vportrait').count()>0,'Combat includes villain portrait');
   await assertStablePalette('Combat',['body','.mast','.nav .btn','.bh-combat-brief','.bcol','.bact','.brest','.board','.cell']);
   await page.locator('.sdp .bcol .board').waitFor();
   await page.locator('.sdp .bact').waitFor();
   const combat=await page.evaluate(()=>{
     const rect=s=>document.querySelector(s).getBoundingClientRect();
     const header=rect('.bh-combat-brief'),board=rect('.sdp .bcol'),controls=rect('.sdp .bact'),villain=rect('.sdp .bhd');
     return {header:header.y,board:board.y,controls:controls.y,villain:villain.y,
       width:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   if(size.width<1024){
     assert(combat.header<combat.board, 'phone: live status must appear above board');
     assert(combat.board<combat.controls,'phone: actions follow board');
     assert(combat.controls<combat.villain,'phone: in-depth villain status follows combat controls');
   }else{
     assert(combat.header<combat.board,'desktop: live status must appear above board');
   }
   assert(combat.width<=size.width+24,'combat horizontal overflow '+(combat.width-size.width)+'px');
   await page.screenshot({path:path.join(shots,size.name+'-combat.png'),animations:'disabled'});
   await page.evaluate(()=>{S.phase='hq';S.view='villains';startInv('cantor');render()});
   await page.locator('.inv-ui').waitFor();
   assert(await page.locator('.inv-villain-visual svg.vportrait').count()>0,'Investigation target portrait is present');
   await assertStablePalette('Investigation',['body','.mast','.nav .btn','.inv-ui','.inv-header','.inv-main','.inv-intel-rail','.inv-action-stage']);
   const boardTexture=await page.evaluate(()=>getComputedStyle(document.querySelector('.inv-main')).backgroundImage);
   assert(boardTexture.includes('repeating-linear-gradient'),'Investigation corkboard texture rendered');
   await page.screenshot({path:path.join(shots,size.name+'-investigation.png'),animations:'disabled'});

   await page.goto('file://'+process.cwd()+'/portrait-gallery.html');
   await page.locator('#gallery .gallery-card').first().waitFor();
   assert.equal(await page.locator('#gallery .gallery-card').count(),12,'Portrait gallery shows all canonical villains');
   assert.equal(await page.locator('#gallery svg.vportrait').count(),12,'Every gallery entry has generated art');
   const crops=await page.locator('#gallery svg.vportrait-crop').evaluateAll(nodes=>
     nodes.map(n=>n.getAttribute('viewBox')));
   assert.equal(crops.length,12,'All characters have isolated crop viewports');
   assert.equal(new Set(crops).size,12,'No two villains show the same source crop');
   assert(crops.every(v=>v.endsWith(' 169 140')),'Crop excludes source sheet dividers');

   const galleryWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert(galleryWidth<=size.width+24,'Gallery overflows viewport');
   await page.screenshot({path:path.join(shots,size.name+'-portrait-gallery.png'),animations:'disabled',fullPage:true});
   await page.close();
  }
  assert.deepEqual(errors,[],'Browser script errors');
  console.log('PASS: HQ, Roster, Villains, Combat and Investigation pulp art passes at mobile and desktop sizes; screenshots recorded.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
