/* Phone motion must change visible pixels, not merely have an enabled switch. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true}),shots=path.resolve('layout-shots');fs.mkdirSync(shots,{recursive:true});
 try{
  for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
   const record=viewport.width===390,errors=[];
   const page=await browser.newPage({viewport,isMobile:true,hasTouch:true,...(record?{recordVideo:{dir:path.join(shots,'motion-recording'),size:viewport}}:{})});
   page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'no-preference'});
   await page.goto('file://'+process.cwd()+'/index.html');
   await page.evaluate(()=>{newCampaign();S.tut=null;S.tutDone=true;S.guide=null;S.storyOff=true;S.phase='hq';S.view='construction';S.facilities=Object.keys(FAC);hqSetPref('motion','on');hqSetPref('lighting','day');render()});
   await page.addStyleTag({content:'#guide,#tutc{display:none!important}'});
   await page.evaluate(async()=>{const i=new Image();i.src=getComputedStyle(document.querySelector('[data-hq-harbor]')).backgroundImage.slice(5,-2);await i.decode()});
   const scene=page.locator('[data-hq-harbor]');await scene.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>!document.querySelector('[data-hq-harbor]').classList.contains('hq-motion-offscreen'));
   assert.equal(await page.locator('[data-hq-effect]').count(),17,'all built facilities have one effect');
   assert.equal(await page.locator('[data-hq-effect="medbay"] .hq-flicker-light').evaluate(el=>getComputedStyle(el).animationName),'hq-building-flicker','fallback lights actually animate on phones');
   assert.equal(await page.locator('[data-hq-effect="workshop"] .hq-flicker-light').count(),0,'custom animated buildings get no duplicate flicker');
   const button=await page.locator('.hq-motion-toggle').boundingBox();assert(button.height>=44,'motion switch has a phone-sized touch target');
   const sample=()=>page.locator('.hq-motion-layer').evaluate(el=>el.getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState})));
   const before=await sample();assert(before.length>=10,'multiple visible motion effects are active');
   await page.waitForTimeout(180);const after=await sample();assert(after.some((a,i)=>a.state==='running'&&a.time>before[i].time),'phone animation clock advances');
   const frame=async time=>{await page.locator('.hq-motion-layer').evaluate((el,time)=>{for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=time}},time);return scene.screenshot({animations:'allow'})};
   const first=await frame(0),second=await frame(1200);
   const changed=await page.evaluate(async({a,b})=>{
    const images=await Promise.all([a,b].map(async data=>{const i=new Image();i.src='data:image/png;base64,'+data;await i.decode();return i}));
    const canvas=document.createElement('canvas');canvas.width=images[0].width;canvas.height=images[0].height;const c=canvas.getContext('2d');
    c.drawImage(images[0],0,0);const x=c.getImageData(0,0,canvas.width,canvas.height).data;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(images[1],0,0);const y=c.getImageData(0,0,canvas.width,canvas.height).data;
    let changed=0;for(let i=0;i<x.length;i+=4)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>35)changed++;return changed;
   },{a:first.toString('base64'),b:second.toString('base64')});
   assert(changed>=30,viewport.width+'px phone shows meaningful moving pixels: '+changed);console.log(viewport.width+'×'+viewport.height+': '+changed+' visibly changed harbor pixels');
   await page.locator('.hq-motion-layer').evaluate(el=>{for(const a of el.getAnimations({subtree:true}))a.play()});
   if(record)await page.waitForTimeout(6500);
   await page.locator('.hq-light-picker').selectOption('night');
   await page.locator('.hq-motion-toggle').click();assert.equal(await page.locator('.hq-motion-layer').count(),0);
   assert.equal(await scene.evaluate(el=>el.getAnimations({subtree:true}).length),0,'off stops all harbor motion, including the beam');
   assert.equal(await page.locator('.hq-beacon-light').evaluate(el=>getComputedStyle(el).display),'block','night lighthouse remains steadily lit');
   await page.reload();await page.frameLocator('iframe[title="Blackharbor opening menu"]').locator('#continue-button').click();await page.addStyleTag({content:'#guide,#tutc{display:none!important}'});
   assert.equal(await page.locator('.hq-motion-toggle').getAttribute('aria-pressed'),'false','Off persists on phone');
   await page.locator('.hq-light-picker').selectOption('day');assert.equal(await page.locator('.hq-beacon-light').evaluate(el=>getComputedStyle(el).display),'none');
   await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{hqSetPref('motion','on');render()});
   assert.equal(await page.locator('.hq-motion-layer').count(),0);assert(await page.locator('.hq-motion-toggle').isDisabled(),'system reduced motion stays respected');
   assert.deepEqual(errors,[]);const video=page.video();await page.close();if(video){await video.saveAs(path.join(shots,'phone-harbor-animation.webm'));await video.delete()}
  }
  console.log('PASS: phone animation plays visibly, switches off, persists and respects reduced motion.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
