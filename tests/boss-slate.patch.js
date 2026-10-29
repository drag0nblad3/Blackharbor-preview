// Headless-only experimental boss slate switch. This does not alter production rules.
// Always preserve all 12 bosses and the seed-determined order of the remaining pool.
const originalNewCampaignForSlate=newCampaign;
newCampaign=function(...args){
 originalNewCampaignForSlate(...args);
 const requested=(process.env.BOSS_START||'').split(',').filter(Boolean);
 if(!requested.length)return;
 if(requested.length!==3||new Set(requested).size!==3)throw Error('BOSS_START requires three unique boss keys');
 const originalStates=S.villains;
 const order=[...originalStates.map(v=>v.key),...S.pool];
 if(requested.some(k=>!order.includes(k)))throw Error('Unknown initial boss key in '+requested.join(','));
 const map=new Map(originalStates.map(v=>[v.key,v]));
 S.villains=requested.map(k=>map.get(k)||makeVillain(k,1));
 S.villains.forEach(v=>{v.scheme=0});
 S.villains[0].scheme=1;
 S.pool=order.filter(k=>!requested.includes(k));
 if(S.villains.length!==3||S.pool.length!==order.length-3)throw Error('Boss slate incorrectly altered campaign roster');
};
