// Free repositioning: a moved hero can re-pick their end hex in the same move area until they act,
// or until the round ends if they acted first.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('file://'+process.cwd()+'/index.html');
    const r=await page.evaluate(async()=>{
      const out={};
      newCampaign();Object.keys(HERO_BASE).slice(0,4).forEach(recruitQuick);S.tut=null;S.tutDone=true;S.guide=null;S.tipsOff=true;
      const key=S.villains.find(v=>v.status==='active')?.key||S.pool[0];S.inv={v:key,clues:2};startShowdown();S.sd.intro=false;S.sd.busy=false;
      S.sd.beams=[];render();
      const sd=S.sd,tap=(x,y)=>document.querySelector(`.board [data-cell="${x},${y}"]`).click();
      const blue=()=>[...document.querySelectorAll('.board .cell.reach')].map(e=>e.dataset.cell);
      const u=sd.units[0],h=heroOf(u),start={x:u.x,y:u.y};
      tap(u.x,u.y);
      const r0=reachH(u,stat(h,'move'));const ks=Object.keys(r0).filter(k=>!sd.civs.some(c=>c.x+','+c.y===k));
      const far=ks.filter(k=>r0[k]===Math.max(...ks.map(k=>r0[k])));
      const A=far[0].split(',').map(Number),B=far[far.length-1].split(',').map(Number);
      tap(...A);
      out.movedA=u.x===A[0]&&u.y===A[1]&&u.moved&&sd.mode==='move';
      out.areaFromStart=blue().includes(start.x+','+start.y)&&blue().includes(far[far.length-1])&&!blue().includes(A.join(','));
      out.buttonSaysAdjust=/Adjust/.test(document.querySelector('[data-a="mode:move"]').textContent);
      tap(...B);
      out.rePicked=u.x===B[0]&&u.y===B[1]&&u.hexesMoved===r0[far[far.length-1]];
      tap(start.x,start.y);
      out.tookBack=u.x===start.x&&u.y===start.y&&!u.moved&&!u.mv&&u.hexesMoved===0;
      // move, then act: the move is locked
      tap(...A);sd.sel=0;await avoidDamage();
      out.lockedAfterAct=u.acted&&!mvOk(u);
      sd.sel=0;sd.mode='move';onCell(B[0],B[1]);
      out.stayedAfterAct=u.x===A[0]&&u.y===A[1];
      // act first, then move: free until the round ends
      const v=sd.units[1],hv=heroOf(v),s1={x:v.x,y:v.y};
      tap(v.x,v.y);await avoidDamage();
      tap(v.x,v.y);
      const r1=reachH(v,stat(hv,'move'));const k1=Object.keys(r1).filter(k=>!sd.civs.some(c=>c.x+','+c.y===k)&&!sd.units.some(o=>o.x+','+o.y===k));
      const C=k1[0].split(',').map(Number),D=k1[k1.length-1].split(',').map(Number);
      out.actFirstMoveMode=sd.mode==='move';
      tap(...C);tap(...D);
      out.actFirstAdjust=v.x===D[0]&&v.y===D[1]&&reMoveOk(v);
      // selecting another hero and coming back keeps the adjust open
      tap(u.x,u.y);tap(v.x,v.y);
      out.reselect=sd.mode==='move'&&reMoveOk(v);
      tap(...C);
      out.actFirstAgain=v.x===C[0]&&v.y===C[1];
      return out;
    });
    console.log(JSON.stringify(r));
    for(const[k,v]of Object.entries(r))assert.ok(v,'free move check failed: '+k);
    assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
    console.log('PASS: heroes can re-pick their move until they act, or until round end if they acted first');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
