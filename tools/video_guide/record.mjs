/* Real browser controls and screenshots; tutorial overlays never change scientific outputs. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from '../../build/_chrome.mjs';
const lab=fileURLToPath(new URL('../../',import.meta.url));
const out=resolve(process.argv[2]||'video-recording'), requested=process.argv.slice(3);
const plan=JSON.parse(readFileSync(new URL('storyboard.json',import.meta.url),'utf8'));
const chapters=plan.chapters.filter(c=>!requested.length||requested.includes(c.id));
mkdirSync(out,{recursive:true});mkdirSync(resolve(out,'downloads'),{recursive:true});
const port=9512,profile=resolve(out,`profile-${Date.now()}`);
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-gpu','--allow-file-access-from-files','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,send,ev;const errors=[],records=[];
try {
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('Browser did not start');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let sequence=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||JSON.stringify(m.params));};
 send=(method,params={})=>new Promise((r,j)=>{const id=++sequence,t=setTimeout(()=>{pending.delete(id);j(Error('Timeout '+method));},180000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:resolve(out,'downloads'),eventsEnabled:true});
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1.2,mobile:false});
 const elementExpr=a=>a.kind==='button'?`[...document.querySelectorAll('#section button')].find(e=>e.textContent.trim()===${JSON.stringify(a.text)})`:`document.querySelectorAll(${JSON.stringify(a.selector)})[${a.index||0}]`;
 const locate=async a=>ev(`(()=>{const e=${elementExpr(a)};if(!e)throw Error('Missing target '+${JSON.stringify(a.selector||a.text)});for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;return {tag:e.tagName,type:e.type,value:e.value,checked:e.checked,disabled:e.disabled,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):null};})()`);
 let frames=[],frameDir,frameIndex=0;
 const shot=async(duration=.18)=>{if(!frameDir)return;const s=await send('Page.captureScreenshot',{format:'png'}),name=`${String(frameIndex++).padStart(4,'0')}.png`;writeFileSync(resolve(frameDir,name),Buffer.from(s.data,'base64'));frames.push({file:name,duration});};
 const scrollTo=async a=>{await locate(a);const data=await ev(`(()=>{const e=${elementExpr(a)},r=e.getBoundingClientRect();return {from:scrollY,to:Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,scrollY+r.top-(r.height<500?(innerHeight-r.height)/2:110)))};})()`);if(Math.abs(data.to-data.from)>30){for(let i=1;i<=5;i++){const t=i/5,v=t*t*(3-2*t);await ev(`scrollTo(0,${data.from+(data.to-data.from)*v})`);await pause(30);await shot(.12);}}};
 const marker=async(a,label)=>{const p=await ev(`(()=>{const r=(${elementExpr(a)}).getBoundingClientRect();return {x:r.left+Math.min(r.width/2,200),y:r.top+r.height/2};})()`);await ev(`(()=>{const p=document.getElementById('videoPointer');p.style.left=${JSON.stringify(p.x+'px')};p.style.top=${JSON.stringify(p.y+'px')};p.style.opacity='1';document.getElementById('videoAction').textContent=${JSON.stringify(label)};})()`);await shot(.45);};
 const action=async a=>{
   if(a.kind==='demoStart'){a={kind:'click',selector:'#demoRun',pauseDemo:true};}
   const before=await locate(a);await scrollTo(a);
   if(a.kind==='scroll'){return {action:a,before};}
   const controlName=await ev(`(()=>{const e=${elementExpr(a)};return (e.innerText||e.getAttribute('aria-label')||e.title||'').trim().slice(0,90);})()`);
   const label=a.kind==='set'?`${before.type==='checkbox'?before.checked:before.value} → ${a.value}`:a.kind==='canvasClick'?'↔':controlName;
   await marker(a,label);
   if(a.kind==='set'){
     if(before.options&&!before.options.includes(String(a.value)))throw Error(`Invalid option ${a.value} for ${a.selector}: ${before.options}`);
     await ev(`(()=>{const e=${elementExpr(a)};if(e.type==='checkbox')e.checked=${JSON.stringify(a.value)};else e.value=${JSON.stringify(String(a.value))};e.dispatchEvent(new Event(e.tagName==='SELECT'||e.type==='checkbox'?'change':'input',{bubbles:true}));const n=${elementExpr(a)};if(n&&n.tagName!=='SELECT'&&n.type!=='checkbox')n.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   } else {
     const p=await ev(`(()=>{const r=(${elementExpr(a)}).getBoundingClientRect();return {x:r.left+r.width*${a.x||.5},y:r.top+r.height*${a.y||.5}};})()`);
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});
     if(a.pauseDemo)await ev(`clearTimeout(DEMO_S.timer);DEMO_S.timer=null;document.getElementById('demoBar')?.remove();`);
   }
   await pause(250);await shot(.35);
   for(let i=0;i<600;i++){const busy=await ev(`Boolean((${elementExpr(a)})?.disabled)`);if(!busy)break;if(i===599)throw Error('Control stayed busy');await pause(100);}
   await pause(250);await ev(`document.getElementById('videoPointer').style.opacity='0'`);await shot(.3);
   let after;try{after=await locate(a);}catch{after={navigated:true};}
   if(a.kind==='set'&&!after.navigated){const actual=after.type==='checkbox'?after.checked:after.value;if(String(actual)!==String(a.value)&&Number(actual)!==Number(a.value))throw Error(`Value did not persist: ${a.selector}, wanted ${a.value}, actual ${actual}`);}
   return {action:a,before,after};
 };
 for(const chapter of chapters){
   console.log('Recording '+chapter.number+' / '+plan.chapters.length+' '+chapter.id);
   await send('Page.navigate',{url:'about:blank'});await send('Page.navigate',{url:pathToFileURL(resolve(lab,'app/index.html')).href+'#s='+chapter.host});
   let ready=false;for(let i=0;i<600;i++){if(await ev(`document.querySelector('#rail a.on')?.dataset.id===${JSON.stringify(chapter.host)}`)){ready=true;break;}await pause(100);}if(!ready)throw Error('Section not ready '+chapter.host);await pause(350);
   await ev(`(()=>{const style=document.createElement('style');style.textContent='#videoBanner{position:fixed;left:0;right:0;top:0;z-index:9999;height:64px;background:#14232df5;color:#fff;display:flex;align-items:center;gap:18px;padding:0 30px;font:20px system-ui;box-shadow:0 2px 14px #0003}#videoBanner b{color:#7ed6df;font-size:16px;letter-spacing:1.4px}#videoBanner span{flex:1}#videoBanner small{font-size:14px;color:#cbd7dd}#videoAction{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9998;max-width:80vw;background:#14232def;color:white;border-radius:8px;padding:10px 18px;font:16px system-ui;pointer-events:none}#videoAction:empty{display:none}#videoPointer{position:fixed;z-index:9998;width:44px;height:44px;margin:-22px;border:3px solid #d38710;border-radius:50%;box-shadow:0 0 0 7px #f9c85038;pointer-events:none;opacity:0}body{padding-top:66px!important;padding-bottom:100px!important}';document.head.appendChild(style);const b=document.createElement('div');b.id='videoBanner';b.innerHTML='<b>GHU LAB · VIDEO GUIDE</b><span></span><small></small>';document.body.appendChild(b);b.querySelector('span').textContent=${JSON.stringify(chapter.title)};b.querySelector('small').textContent=${JSON.stringify(String(chapter.number).padStart(2,'0')+' / '+plan.chapters.length+' · EN')};for(const id of ['videoPointer','videoAction']){const e=document.createElement('div');e.id=id;document.body.appendChild(e);}})()`);
   frameDir=null;for(const a of chapter.setup||[])await action(a);
   for(const step of chapter.steps){
     frameDir=resolve(out,'frames',step.id);mkdirSync(frameDir,{recursive:true});frames=[];frameIndex=0;const actions=[];
     await ev(`document.getElementById('videoAction').textContent=''`);await shot(.6);
     for(const a of step.actions)actions.push(await action(a));
     if(step.focus)await scrollTo(step.focus);
     await ev(`document.getElementById('videoAction').textContent='';document.getElementById('videoPointer').style.opacity='0'`);await pause(150);await shot(1);
     const state=await ev(`({section:document.querySelector('#rail a.on')?.dataset.id,location:location.hash,scrollY,text:document.getElementById('section').innerText})`);
     const record={id:step.id,chapter:chapter.id,frames,actions,state};writeFileSync(resolve(frameDir,'record.json'),JSON.stringify(record,null,2)+'\n');records.push({id:step.id,frameCount:frames.length,actions:actions.length});
   }
   writeFileSync(resolve(out,'recording-progress.json'),JSON.stringify({records,errors},null,2)+'\n');
 }
 if(errors.length)throw Error('Browser exceptions: '+errors.join('\n'));
 console.log('Recorded '+records.length+' scenes; browser exceptions: '+errors.length);
}catch(e){console.error(e);process.exitCode=1;}finally{writeFileSync(resolve(out,'last-run.json'),JSON.stringify({records,errors},null,2)+'\n');if(ws)ws.close();child.kill();}
