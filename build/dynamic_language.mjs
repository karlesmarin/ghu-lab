/* Inspect computed states throughout real demos, not just each section's initial markup. */
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/dynamic-language');mkdirSync(out,{recursive:true});
const {CDM_SCRIPTS}=await import(pathToFileURL(resolve(root,'src/view/demo_scripts.mjs')).href);
const port=9535,pause=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;const reports=[],errors=[],missing=new Map();
try{
 let tab;for(let i=0;i<100;i++){try{tab=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');if(tab)break;}catch{}await pause(100);}
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method)),60000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const only=process.argv.find(x=>x.startsWith('--only='))?.split('=')[1];
 for(const c of CDM_SCRIPTS.chapters.filter(c=>!only||c.id===only)){
  await send('Page.navigate',{url:'about:blank'});
  await send('Page.navigate',{url:(process.env.GHU_DYNAMIC_URL||pathToFileURL(resolve(root,'app/index.html')).href)+'#s='+c.host+'&lang=es'});
  for(let i=0;i<300;i++){if(await ev(`typeof cdmRun==='function'&&document.querySelector('#rail a.on')?.dataset.id===${JSON.stringify(c.host)}`))break;await pause(100);}
  await ev(`window.__dynamic={snapshots:[],missing:{}};window.__snapshot=()=>{
   const texts=[],walk=document.createTreeWalker(document.getElementById('section'),NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode,p=n.parentElement;if(!p||!p.getClientRects().length||p.closest('script,style,noscript,metadata,code,pre,textarea,.howto,.helppop,#gqRoot,#rx_boundaryresearch,#cdm_explain'))continue;
    // This summary is rendered natively in both languages and tested by diagnostics.mjs.
    if(p.closest('#hrSummary'))continue;
    const record=UI_TEXT.get(n),en=record&&n.nodeValue===record.translated?record.original:n.nodeValue,key=uiCanonical(en).key;
    if(en.trim().split(/\\s+/).length>=4&&/[a-z]{3}/.test(en)&&!Object.hasOwn(UI_ES,key))window.__dynamic.missing[key]={en:en.trim(),shown:n.nodeValue.trim(),parent:p.id||p.tagName};
    if(Object.hasOwn(UI_ES,key)&&n.nodeValue!==uiTranslate(en,'es'))window.__dynamic.missing[key]={en:en.trim(),shown:n.nodeValue.trim(),parent:p.id||p.tagName,reason:'translation not displayed'};
   }
   window.__dynamic.snapshots.push({summaries:Array.from(document.querySelectorAll('#section [id*=Summary],#section [id*=summary]')).map(e=>({id:e.id,text:e.textContent})),plots:['g4','mW','windings'].map(k=>({id:k,points:document.querySelectorAll('#hrPlot_'+k+' circle').length}))});
  };window.__snapshot();
  const banner=cdmBanner;cdmBanner=function(...args){const result=banner(...args);setTimeout(window.__snapshot,0);return result;};
  CDM_URL.speed=.02;CDM_URL.lang='es';cdmRun(${JSON.stringify(c.id)});`);
  let state;for(let i=0;i<1800;i++){await pause(100);state=await ev(`({running:CDM_STATE.running,error:CDM_STATE.lastError,finished:CDM_STATE.lastFinished})`);if(!state.running)break;}
  await ev('window.__snapshot()');const report=await ev('window.__dynamic');reports.push({id:c.id,state,...report});
  for(const [key,row] of Object.entries(report.missing)){if(!missing.has(key))missing.set(key,{...row,demos:[]});missing.get(key).demos.push(c.id);}
  if(state.error||state.finished!==c.id)throw Error(c.id+': '+JSON.stringify(state));
  console.log(c.id+': '+report.snapshots.length+' computed snapshots; '+Object.keys(report.missing).length+' unmatched phrases');
  if(c.id==='hierarchy'){
   await ev(`document.getElementById('hrSummary').scrollIntoView({block:'center'})`);
   writeFileSync(resolve(out,'hierarchy-summary.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
 }
 if(errors.length)throw Error('Browser exceptions: '+JSON.stringify(errors));
 if(missing.size&&!process.argv.includes('--audit'))process.exitCode=1;
}catch(e){console.error(e);process.exitCode=1;}
finally{
 writeFileSync(resolve(out,'missing.json'),JSON.stringify([...missing].map(([key,v])=>({key,...v})),null,2)+'\n');
 writeFileSync(resolve(out,'report.json'),JSON.stringify({passed:!process.exitCode,reports,errors},null,2)+'\n');
 console.log(reports.length+' demos; '+missing.size+' unmatched computed phrases');ws?.close();child.kill();
}
