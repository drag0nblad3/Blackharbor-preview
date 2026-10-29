#!/usr/bin/env node
/* One CLI for campaign sims. Each campaign gets a fresh game with seed = --seed + run index, so results repeat exactly
   and a variant run with --vs plays the same seeds (paired comparison, less noise per fight).
   node tools/sim.js --runs 8 --abil [--vs 'GEAR.wings.mods.eva=1'] [--vs-sub 'const SET_N=4;=>const SET_N=3;'] [--patch file.js|code] [--sub 'old=>new']
     [--mode collect] [--env CONS=2] [--jobs 4] [--out raw.json] [--html other.html] [--vs-html other.html] [--json] */
const path=require('path'),fs=require('fs'),{Worker,isMainThread,parentPort,workerData}=require('worker_threads');
const bh=require('./bh');
const BOT=fs.readFileSync(path.join(__dirname,'bot.js'),'utf8');
const FIGHTS_PER_RUN=19,CAP=1000;

function runOne(o,seed){const g=bh.load({html:o.html,seed,env:o.env,patches:o.patches,subs:o.subs});g.run(BOT,'bot.js');
  return g.run('runCampaigns(1)').then(r=>{const x=r[0];x.seed=seed;x.hash=g.hash;return JSON.parse(JSON.stringify(x))})}

if(!isMainThread){(async()=>{const out=[];for(const s of workerData.seeds)out.push(await runOne(workerData.o,s));parentPort.postMessage(out)})();return}

function args(){const a=process.argv.slice(2),o={runs:4,seed:1,jobs:1,env:{},patches:[],subs:[],vsSubs:[],vs:null,out:null,html:null,force:false,json:false};
  for(let i=0;i<a.length;i++){const k=a[i],v=()=>a[++i];
    if(k==='--runs')o.runs=+v();else if(k==='--seed')o.seed=+v();else if(k==='--jobs')o.jobs=+v();
    else if(k==='--abil')o.env.ABIL='1';else if(k==='--mode')o.env.MODE=v();
    else if(k==='--env'){const[e,...r]=v().split('=');o.env[e]=r.join('=')}
    else if(k==='--patch')o.patches.push(v());else if(k==='--sub')o.subs.push(v());else if(k==='--vs-sub')o.vsSubs.push(v());else if(k==='--vs')(o.vs=o.vs||[]).push(v());
    else if(k==='--html')o.html=path.resolve(v());else if(k==='--vs-html')o.vsHtml=path.resolve(v());
    else if(k==='--out')o.out=v();else if(k==='--force')o.force=true;else if(k==='--json')o.json=true;
    else if(k==='-h'||k==='--help'){console.log(fs.readFileSync(__filename,'utf8').split('\n').slice(1,5).join('\n'));process.exit(0)}
    else{console.error('unknown flag '+k);process.exit(1)}}
  return o}

async function runSet(o){const seeds=[...Array(o.runs)].map((_,i)=>o.seed+i);
  if(o.jobs<=1){const out=[];for(const s of seeds)out.push(await runOne(o,s));return out}
  const parts=[...Array(o.jobs)].map((_,j)=>seeds.filter((_,i)=>i%o.jobs===j)).filter(p=>p.length);
  const res=await Promise.all(parts.map(p=>new Promise((ok,no)=>{const w=new Worker(__filename,{workerData:{o,seeds:p}});w.on('message',ok);w.on('error',no)})));
  return res.flat().sort((a,b)=>a.seed-b.seed)}

const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN,f1=x=>isNaN(x)?'-':x.toFixed(1),pc=x=>isNaN(x)?'-':(100*x).toFixed(0)+'%';
const PTS=[['Arc 1',r=>r.arc===1&&!r.fin],['Arc 2',r=>r.arc===2&&!r.fin],['Arc 3',r=>r.arc===3&&!r.fin],['Finale',r=>r.fin]];
function summary(R){const ok=R.filter(r=>!r.err),s={runs:R.length,errs:R.length-ok.length,err:(R.find(r=>r.err)||{}).err,fights:ok.reduce((a,r)=>a+r.rec.length,0),
    stalls:ok.reduce((a,r)=>a+r.stalls,0),finaleWins:ok.filter(r=>r.res.Fwin).length,pts:{},snaps:{}};
  for(const[n,f]of PTS){const rs=ok.flatMap(r=>r.rec.filter(f)),hs=rs.flatMap(r=>r.hs);
    s.pts[n]={n:rs.length,win:avg(rs.map(r=>r.res==='win'?1:0)),rounds:avg(rs.map(r=>r.rounds)),ko:avg(rs.map(r=>r.ko)),hpLost:avg(rs.map(r=>r.hpLost)),
      ab:avg(rs.map(r=>r.ab||0)),pw:avg(rs.map(r=>r.pw||0)),vlv:avg(rs.flatMap(r=>r.vs.map(v=>v.lv))),
      lv:avg(hs.map(h=>h.lv)),acc:avg(hs.map(h=>h.acc)),str:avg(hs.map(h=>h.str)),dice:avg(hs.map(h=>h.dice)),eva:avg(hs.map(h=>h.eva)),sets:avg(hs.map(h=>h.sets.length)),gear:avg(hs.map(h=>h.gear.length))}}
  for(const r of ok)for(const sn of r.snaps){const t=s.snaps[sn.label]=s.snaps[sn.label]||{fac:[],gear:[],salv:[],tech:[],intel:[]};t.fac.push(sn.facBuilt);t.gear.push(sn.gearOwned);t.salv.push(sn.salv);t.tech.push(sn.tech);t.intel.push(sn.intel)}
  for(const k in s.snaps)for(const m in s.snaps[k])s.snaps[k][m]=avg(s.snaps[k][m]);
  return s}
function print(name,s){console.log(`${name}: ${s.runs} runs, ${s.fights} fights, finale wins ${s.finaleWins}/${s.runs-s.errs}, stalls ${s.stalls}`+(s.errs?`, ERRORS ${s.errs}: ${String(s.err).slice(0,300)}`:''));
  console.log('  point    n  win  rnds  KO  hpLost ab/f pw/f  vLv | hLv  acc  str dice  eva sets gear');
  for(const n in s.pts){const p=s.pts[n];if(!p.n)continue;console.log(`  ${n.padEnd(7)}${String(p.n).padStart(3)} ${pc(p.win).padStart(4)} ${f1(p.rounds).padStart(5)} ${f1(p.ko).padStart(3)} ${f1(p.hpLost).padStart(6)} ${f1(p.ab).padStart(4)} ${f1(p.pw).padStart(4)} ${f1(p.vlv).padStart(4)} | ${[p.lv,p.acc,p.str,p.dice,p.eva,p.sets,p.gear].map(x=>f1(x).padStart(4)).join(' ')}`)}
  const sn=Object.entries(s.snaps);if(sn.length)console.log('  end of: '+sn.map(([k,t])=>`${k} fac ${f1(t.fac)} gear ${f1(t.gear)} salv ${f1(t.salv)} tech ${f1(t.tech)} intel ${f1(t.intel)}`).join(' | '))}

(async()=>{const o=args(),sets=[['A',o]];
  if(o.vs||o.vsHtml||o.vsSubs.length)sets.push(['B',{...o,patches:[...o.patches,...(o.vs||[])],subs:[...o.subs,...o.vsSubs],html:o.vsHtml||o.html}]);
  const est=o.runs*FIGHTS_PER_RUN*sets.length;
  if(est>CAP&&!o.force){console.error(`~${est} fights is over Tyler's ${CAP}-fight budget; lower --runs or pass --force`);process.exit(1)}
  const t0=Date.now(),all={};
  for(const[n,c]of sets){const R=await runSet(c);all[n]=R;const s=summary(R);
    if(o.json)console.log(JSON.stringify({set:n,patches:c.patches,...s}));else print(n+(c.patches.length||c.subs.length?' ['+[...c.subs,...c.patches].join(' ; ').slice(0,80)+']':'')+(c.html?' '+path.basename(c.html):''),s)}
  if(o.out)fs.writeFileSync(o.out,JSON.stringify(all));
  if(!o.json)console.log(`  seeds ${o.seed}-${o.seed+o.runs-1}, build ${(all.A[0]||{}).hash}, ${((Date.now()-t0)/1000).toFixed(0)}s`)})();
