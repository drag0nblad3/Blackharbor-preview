#!/usr/bin/env node
/* Rebuilds the Rules Guide pictures in assets/guide/ from the real game (run from the repo root).
   Seeded dice, fixed heroes and villains, so the pictures stay the same between runs. */
const {chromium}=require('playwright');
const path=require('node:path');
const OUT=path.resolve('assets/guide');
(async()=>{
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+process.cwd()+'/index.html');
  await page.addStyleTag({content:'#guide,#tutc,.cheat{display:none!important} *{animation:none!important;transition:none!important}'});
  const shot=async(name,sel,opt={})=>{
    await page.waitForTimeout(350);
    const el=page.locator(sel).first();await el.waitFor();
    const box=await el.boundingBox();
    const clip={x:box.x,y:box.y,width:box.width,height:Math.min(box.height,opt.maxH||box.height)};
    await page.screenshot({path:path.join(OUT,name+'.jpg'),type:'jpeg',quality:72,clip,fullPage:true});
    console.log('wrote',name+'.jpg',Math.round(clip.width)+'x'+Math.round(clip.height));
  };
  await page.evaluate(()=>{
    let s=11;Math.random=()=>{s=(s*16807)%2147483647;return s/2147483647};
    newCampaign();S.tut=null;S.tutDone=true;S.guide=null;S.tipsOff=true;S.tips=[];
    ['volt','lynx','wisp','bulwark'].forEach(c=>recruitQuick(c));
    S.villains=[makeVillain('gallows',2),makeVillain('cantor',1),makeVillain('quarry',1)];S.villains[1].scheme=2;
    S.salvage.gallows=5;S.salvage.cantor=2;S.view='hq';render();
  });
  await shot('mast','header.mast');
  await shot('hq','.bh-hq-layout',{maxH:620});
  await page.evaluate(()=>{S.view='roster';render()});
  await page.locator('.bh-roster-content .card details.coll > summary').first().click();
  await shot('hero','.bh-roster-content .card',{maxH:360});
  await page.evaluate(()=>{S.view='villains';render()});
  await shot('villains','.bh-threat-content .grid2',{maxH:560});
  await page.evaluate(()=>{startInv('gallows');S.inv.intro=false;render()});
  await shot('investigation','.inv-main');
  await page.evaluate(()=>{S.inv.clues=2;startShowdown();S.sd.intro=false;render()});
  await page.evaluate(()=>{const sd=S.sd,u=sd.units[0],v=sd.v;u.x=v.x;u.y=Math.min(sd.N-1,v.y+3);
    sd.obs=sd.obs.filter(k=>k!==u.x+','+u.y);sd.sel=0;sd.mode='move';render()});
  await shot('board','.boardwrap');
  await shot('actions','.bact');
  await shot('charging','.bhd');
  await page.evaluate(()=>{S.sd.mode=null;S.sd.sel=null;render()});
  await page.evaluate(()=>{const d=S.sd.v;[...d.deck].slice(0,4).forEach(c=>markSeen('gallows',c.id));openPlaybook('gallows')});
  await page.waitForTimeout(350);await page.screenshot({path:path.join(OUT,'playbook.jpg'),type:'jpeg',quality:72,clip:{x:330,y:0,width:440,height:590}});console.log('wrote playbook.jpg');
  await page.evaluate(()=>{const c=document.getElementById('comic');if(c)c.remove()});
  await page.evaluate(()=>{S.sd.result='win';debrief();render()});
  await shot('aftermath','#app section.panel',{maxH:620});
  await page.evaluate(()=>{S.inv={v:'cantor',clues:2};startShowdown();S.sd.intro=false;render()});
  await page.locator('[data-save-open]').click();
  await shot('menu','#bh-save-dialog');
  if(errors.length){console.error(errors);process.exit(1)}
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
