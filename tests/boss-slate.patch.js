// Headless-only experimental starting-boss switch. No production-rule changes.
// Bosses are assigned only when the fourth hero joins, as in normal campaigns.
const originalRevealStartingVillains=revealStartingVillains;
revealStartingVillains=function(){
 const requested=(process.env.BOSS_START||'').split(',').filter(Boolean);
 if(!requested.length)return originalRevealStartingVillains();
 if(S.villains.length||roster().length<4||S.issue!==1)return;
 if(requested.length!==3||new Set(requested).size!==3)throw Error('BOSS_START requires 3 unique bosses');
 if(requested.some(k=>!S.pool.includes(k)))throw Error('BOSS_START includes unavailable villain');
 for(const k of requested){
  S.pool.splice(S.pool.indexOf(k),1);
  S.villains.push(makeVillain(k,1));
 }
 S.villains[0].scheme=1;
};
