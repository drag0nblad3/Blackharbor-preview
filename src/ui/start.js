/* ui/start.js: Opening screen and campaign setup before entering gameplay. */
let bhOpeningFrame;
let bhOpeningBusy=false;
/* Opened from disk (file://), origins are opaque or 'file://', so messages go to '*'; the source-window check still guards them. */
function bhOpeningLocal(){return location.protocol==='file:'||location.origin==='null'}
function bhOpeningClose(){
  if(bhOpeningFrame){bhOpeningFrame.remove();bhOpeningFrame=null;document.body.style.overflow='';}
}
function bhOpeningMount(){
  const frame=document.createElement('iframe');
  frame.title='Blackharbor opening menu';
  frame.src='opening.html';
  frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#10182e';
  bhOpeningFrame=frame;
  document.body.style.overflow='hidden';
  document.body.append(frame);
}
function bhOpeningHasSave(){
  try{return !!bhSaveValidate(JSON.parse(localStorage.getItem(KEY)));}catch(_){return false;}
}
function bhOpeningState(error){
  if(bhOpeningFrame)bhOpeningFrame.contentWindow.postMessage({type:'blackharbor-start-state',hasSave:bhOpeningHasSave(),error:error||''},bhOpeningLocal()?'*':location.origin);
}
function bhOpeningDismissOffers(){
  if(S.tut&&S.tut.b===0){S.tut=null;S.tutDone=true;}
  if(S.guide&&S.guide.s===0)S.guide=S.tipsOff?null:{s:1,pop:null};
}
if(typeof window!=='undefined')window.addEventListener('message',async event=>{
  if(!bhOpeningFrame||event.source!==bhOpeningFrame.contentWindow||(!bhOpeningLocal()&&event.origin!==location.origin)||event.data?.type!=='blackharbor-start')return;
  const request=event.data;
  if(request.action==='ready'){bhOpeningState();return;}
  if(bhOpeningBusy)return;
  bhOpeningBusy=true;
  try{
    if(request.action==='continue'){
      if(!load())throw new Error('The saved campaign could not be loaded. Paste a save code or start a new game.');
      bhOpeningDismissOffers();
    }else if(request.action==='new'){
      const previous=localStorage.getItem(KEY);
      if(previous!==null)localStorage.setItem(KEY+BH_SAVE_BACKUP_SUFFIX,previous);
      newCampaign();
      S.diff=diffClamp(request.difficulty);
      S.tipsOff=!request.tips;
      S.guide=request.tips?{s:1,pop:null}:null;
      S.tut=null;S.tutDone=!request.tutorial;
      if(request.tutorial)tutStart();
    }else if(request.action==='import'){
      const decoded=await bhSaveDecode(request.code);
      const previous=localStorage.getItem(KEY);
      localStorage.setItem(KEY,JSON.stringify(decoded.state));
      if(!load()){
        if(previous===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,previous);
        throw new Error('This campaign could not be loaded.');
      }
      bhOpeningDismissOffers();
    }else return;
    render();
  }catch(error){bhOpeningState(error.message||'Unable to start the game.');}
  finally{bhOpeningBusy=false;}
});

function bhOpeningReload(){sessionStorage.setItem(KEY+'-resume','1');location.reload();}
function bhOpeningBoot(){
  const resume=sessionStorage.getItem(KEY+'-resume');sessionStorage.removeItem(KEY+'-resume');
  if(resume&&load()){bhOpeningDismissOffers();render();}else bhOpeningMount();
}
