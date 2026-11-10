/* audio/sfx.js: synthesized sound effects and harbor ambience (Web Audio, no sound files). sfx(name) plays one; prefs are per device. */
const SFX_PREF_KEY='blackharbor-audio';
let sfxPrefs={on:true,amb:true,vol:.7};
try{const p=JSON.parse(localStorage.getItem(SFX_PREF_KEY)||'null');if(p&&typeof p==='object')sfxPrefs={...sfxPrefs,...p}}catch(e){}
function sfxSave(){try{localStorage.setItem(SFX_PREF_KEY,JSON.stringify(sfxPrefs))}catch(e){}}
let sfxCtx=null,sfxOut=null,sfxNoiseBuf=null,sfxLast={},sfxAmb=null;
const SFX_HEADLESS=typeof navigator!=='undefined'&&/HeadlessChrome/.test(navigator.userAgent||'');
/* Browsers only allow audio after a tap, so the context starts on the first pointer press. */
function sfxInit(){if(sfxCtx||SFX_HEADLESS)return sfxCtx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{sfxCtx=new AC();sfxOut=sfxCtx.createGain();sfxOut.gain.value=sfxPrefs.vol;const comp=sfxCtx.createDynamicsCompressor();sfxOut.connect(comp);comp.connect(sfxCtx.destination);
    const n=sfxCtx.sampleRate*2;sfxNoiseBuf=sfxCtx.createBuffer(1,n,sfxCtx.sampleRate);const d=sfxNoiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}catch(e){sfxCtx=null}
  return sfxCtx}
if(typeof document!=='undefined')document.addEventListener('pointerdown',()=>{if(!sfxPrefs.on)return;const c=sfxInit();if(c&&c.state==='suspended')c.resume();sfxAmbTick()},true);

/* building blocks: a tone with a pitch sweep, and filtered noise */
function sfxTone(t0,{f=440,f2=f,dur=.2,type='sine',g=.3,a=.005,dest=sfxOut}={}){const c=sfxCtx,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(f2!==f)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+dur);
  v.gain.setValueAtTime(0.0001,t0);v.gain.exponentialRampToValueAtTime(g,t0+a);v.gain.exponentialRampToValueAtTime(0.0001,t0+dur);o.connect(v);v.connect(dest);o.start(t0);o.stop(t0+dur+.02)}
function sfxNoise(t0,{dur=.2,g=.3,type='bandpass',f=1200,f2=f,q=1,a=.003,dest=sfxOut}={}){const c=sfxCtx,s=c.createBufferSource(),fl=c.createBiquadFilter(),v=c.createGain();s.buffer=sfxNoiseBuf;s.loop=true;fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f,t0);if(f2!==f)fl.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t0+dur);
  v.gain.setValueAtTime(0.0001,t0);v.gain.exponentialRampToValueAtTime(g,t0+a);v.gain.exponentialRampToValueAtTime(0.0001,t0+dur);s.connect(fl);fl.connect(v);v.connect(dest);s.start(t0,Math.random()*1.5);s.stop(t0+dur+.02)}

const SFX={
  tick:t=>sfxTone(t,{f:1500,f2:900,dur:.05,type:'triangle',g:.07}),
  dice:t=>{for(let i=0;i<4;i++){const s=t+i*.055+Math.random()*.02;sfxNoise(s,{dur:.035,g:.22,f:2600+Math.random()*1800,q:4});sfxTone(s,{f:700+Math.random()*500,f2:400,dur:.04,type:'square',g:.03})}},
  hit:t=>{sfxTone(t,{f:150,f2:45,dur:.22,type:'sine',g:.6});sfxNoise(t,{dur:.12,g:.35,type:'lowpass',f:2500,f2:300})},
  bighit:t=>{sfxTone(t,{f:120,f2:32,dur:.45,type:'sine',g:.8});sfxTone(t,{f:240,f2:60,dur:.25,type:'sawtooth',g:.12});sfxNoise(t,{dur:.35,g:.45,type:'lowpass',f:3000,f2:150})},
  miss:t=>sfxNoise(t,{dur:.25,g:.18,f:600,f2:3200,q:2.5,a:.06}),
  hurt:t=>{sfxTone(t,{f:200,f2:70,dur:.25,type:'triangle',g:.4});sfxNoise(t,{dur:.15,g:.25,type:'lowpass',f:1400,f2:200})},
  tear:t=>{for(let i=0;i<7;i++)sfxNoise(t+i*.028,{dur:.05,g:.25-i*.02,f:3800-i*250,q:1.5});sfxNoise(t,{dur:.28,g:.1,type:'highpass',f:2500,f2:5000})},
  sig:t=>{[0,.11].forEach((d,i)=>{[110,138.6,164.8].forEach(f=>sfxTone(t+d,{f:f*(i?1.06:1),dur:.5,type:'sawtooth',g:.09,a:.02}))});sfxTone(t,{f:55,f2:40,dur:.7,type:'sine',g:.5})},
  sigbreak:t=>{SFX.tear(t);[523,659,784,1047].forEach((f,i)=>sfxTone(t+.12+i*.06,{f,dur:.3,type:'triangle',g:.16}))},
  turn:t=>{sfxTone(t,{f:98,dur:.9,type:'sine',g:.35,a:.01});sfxTone(t,{f:196,dur:.6,type:'triangle',g:.08,a:.01});sfxNoise(t,{dur:.5,g:.05,type:'lowpass',f:900})},
  ko:t=>{[392,330,262,196].forEach((f,i)=>sfxTone(t+i*.12,{f,f2:f*.97,dur:.22,type:'triangle',g:.22}));sfxTone(t+.45,{f:90,f2:40,dur:.5,g:.4})},
  good:t=>{sfxTone(t,{f:660,dur:.12,type:'triangle',g:.12});sfxTone(t+.07,{f:990,dur:.18,type:'triangle',g:.1})},
  win:t=>{[392,523,659,784].forEach((f,i)=>sfxTone(t+i*.11,{f,dur:i===3?.7:.18,type:'square',g:.08}));[523,659,784].forEach(f=>sfxTone(t+.44,{f,dur:.8,type:'triangle',g:.1}))},
  loss:t=>{[330,311,294,262].forEach((f,i)=>sfxTone(t+i*.28,{f,f2:f*.98,dur:.4,type:'sawtooth',g:.06}));sfxTone(t+1.1,{f:65,dur:1.2,g:.4})}
};
/* Minimum gap per sound so a burst of renders or fx does not stack the same effect. */
const SFX_GAP={tick:40,hit:90,bighit:200,hurt:120,tear:120,miss:150,good:150,dice:250};
function sfx(name){if(!sfxPrefs.on||FAST||SFX_HEADLESS||!SFX[name])return;const c=sfxInit();if(!c||c.state!=='running')return;
  const now=performance.now();if(now-(sfxLast[name]||0)<(SFX_GAP[name]||60))return;sfxLast[name]=now;
  try{SFX[name](c.currentTime+.01)}catch(e){}}

/* Harbor ambience between fights: slow surf (brown noise with a swell) and a far-off bell now and then. */
function sfxAmbWanted(){return sfxPrefs.on&&sfxPrefs.amb&&typeof S!=='undefined'&&S&&S.phase==='hq'&&!(typeof document!=='undefined'&&document.hidden)}
function sfxAmbTick(){const want=sfxAmbWanted();const c=want?sfxInit():sfxCtx;if(!c)return;
  if(want&&!sfxAmb&&c.state==='running'){const n=c.sampleRate*4,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;d[i]=l*3.2}
    const s=c.createBufferSource();s.buffer=b;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=520;const g=c.createGain();g.gain.value=0;
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.11;lg.gain.value=.05;lfo.connect(lg);lg.connect(g.gain);
    s.connect(f);f.connect(g);g.connect(sfxOut);s.start();lfo.start();g.gain.setTargetAtTime(.08,c.currentTime,1.5);
    const bell=setInterval(()=>{if(Math.random()<.35)[0,.9].forEach(dl=>sfxTone(c.currentTime+dl,{f:523*(dl?1:1.5)*.5,dur:2.4,type:'sine',g:.025,a:.02}))},9000);
    sfxAmb={s,lfo,g,bell}}
  else if(!want&&sfxAmb){const a=sfxAmb;sfxAmb=null;clearInterval(a.bell);try{a.g.gain.setTargetAtTime(0,sfxCtx.currentTime,.4);setTimeout(()=>{try{a.s.stop();a.lfo.stop()}catch(e){}},1500)}catch(e){}}}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',sfxAmbTick);

/* Menu toggles */
function sfxSet(k,v){sfxPrefs[k]=v;sfxSave();if(k==='on'&&v){const c=sfxInit();if(c&&c.state==='suspended')c.resume()}if(sfxOut)sfxOut.gain.value=sfxPrefs.vol;sfxAmbTick();if(k==='on'&&v)setTimeout(()=>sfx('good'),60)}
