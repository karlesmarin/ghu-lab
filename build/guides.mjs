/* Check guide links and language changes against real model state in Chromium. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/guides-browser');
mkdirSync(out,{recursive:true});
const catalogue=JSON.parse(readFileSync(resolve(root,'docs/user-guides.json'),'utf8'));
const url=pathToFileURL(resolve(root,'app/index.html')).href,port=9523;
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${resolve(out,'profile-'+Date.now())}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let ws;
function check(name,value){checks.push({name,passed:!!value});if(!value)throw Error(name);}
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.exception?.description||m);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);j(Error(method+' timed out'));},45000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const nav=async g=>{
  await send('Page.navigate',{url:url+'?guide-check='+encodeURIComponent(g.id)+'#'+g.route});
  for(let i=0;i<250;i++){if(await ev(`document.readyState==='complete'&&typeof GUIDE_TARGETS!=='undefined'&&!!document.querySelector('.howto [data-guide-id="${g.host}"]')`))return;await pause(100);}
  throw Error('Tool did not mount: '+g.id);
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 for(const g of catalogue.guides.filter(g=>g.kind==='section')){
  await nav(g);
  check(g.id+' section guide points to real page',await ev(`(()=>{const a=document.querySelector('.howto [data-guide-id="${g.id}"]');return a&&a.href.endsWith('/guide/${g.id}/index.html')&&a.target==='_blank'&&a.rel.includes('noopener');})()`));
 }
 await nav(catalogue.guides.find(g=>g.id==='simulator-neutrino'));
 await ev(`document.querySelector('.howto').open=true`);
 const before=await ev('location.hash');
 await ev(`document.querySelector('[data-guide-set-language="es"]').click()`);
 check('language choice does not change the model permalink',before===await ev('location.hash'));
 check('Spanish short help visible and English hidden',await ev(`!document.querySelector('[data-guide-language="es"]').hidden&&document.querySelector('[data-guide-language="en"]').hidden`));
 check('language updates the embedded experiment and decay links',await ev(`['flavour','identifiability','neutrino-decays'].every(id=>document.querySelector('[data-guide-id="'+id+'"]').href.includes('/guide/es/'+id+'/'))`));
 await ev(`document.querySelector('.ihelp').click()`);
 check('Spanish glossary popup and linked entry',await ev(`document.querySelector('.helppop')?.lang==='es'&&document.querySelector('.helppop a')?.href.includes('/guide/es/glossary/')`));
 await nav(catalogue.guides.find(g=>g.id==='hierarchy'));
 check('language survives navigation and reload',await ev(`GUIDE_LANGUAGE==='es'&&document.querySelector('.howto [data-guide-id="hierarchy"]').href.includes('/guide/es/hierarchy/')`));
 for(const g of catalogue.guides.filter(g=>['mode','experiment','analysis'].includes(g.kind))){
  await nav(g);await pause(100);
  check(g.id+' correct contextual guide',await ev(`!!document.querySelector('[data-guide-id="${g.id}"]')&&document.querySelector('[data-guide-id="${g.id}"]').href.includes('/guide/es/${g.id}/')`));
  if(g.mode)check(g.id+' selects correct model',await ev(`document.getElementById('prModel').value===${JSON.stringify(g.mode)}`));
  if(['experiment','analysis'].includes(g.kind))check(g.id+' focuses visible experiment',await ev(`document.activeElement.id===GUIDE_TARGETS[${JSON.stringify(g.id)}]&&!document.activeElement.closest('[hidden]')`));
 }
 for(const [label,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await nav(catalogue.guides.find(g=>g.id==='hierarchy'));
  await ev(`(()=>{const h=document.querySelector('.howto');h.open=true;h.style.scrollMarginTop=(document.getElementById('top').getBoundingClientRect().height+12)+'px';h.scrollIntoView({block:'start'});})()`);
  check(label+' help fits viewport',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,label+'.png'),Buffer.from(shot.data,'base64'));
  await nav(catalogue.guides.find(g=>g.id==='thermalhistory'));await pause(150);
  check(label+' linked experiment title is below the fixed header',await ev(`(()=>{const t=document.getElementById(GUIDE_TARGETS.thermalhistory).getBoundingClientRect(),h=document.getElementById('top').getBoundingClientRect();return t.top>=h.bottom+8&&t.top<innerHeight-30;})()`));
 }
 check('no runtime errors',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (guide browser)`);ws?.close();child.kill();}
