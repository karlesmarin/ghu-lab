/* Static/no-script readability, language navigation, search and mobile guide layout. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/guide-pages-browser');
mkdirSync(out,{recursive:true});
const data=JSON.parse(readFileSync(resolve(root,'docs/user-guides.json'),'utf8'));
const base=process.env.GHU_GUIDE_SITE_URL||pathToFileURL(resolve(root,'site')).href+'/',port=9524;
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${resolve(out,'profile-'+Date.now())}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let ws;
function check(name,value){checks.push({name,passed:!!value});if(!value)throw Error(name);}
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);j(Error(method+' timed out'));},45000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const waitFor=async expression=>{for(let i=0;i<200;i++){if(await ev(expression))return;await pause(50);}throw Error('Page not ready: '+expression);};
 const nav=async rel=>{await send('Page.navigate',{url:base+rel});await waitFor(`location.href===${JSON.stringify(base+rel)}&&document.readyState==='complete'&&!!document.querySelector('.guide-content')`);};
 const rel=(id,lang)=>'guide/'+(lang==='es'?'es/':'')+(id==='index'?'':id+'/')+'index.html';
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setScriptExecutionDisabled',{value:true});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const lang of ['en','es']){
  for(const id of ['index','glossary',...data.guides.map(g=>g.id)]){
   await nav(rel(id,lang));
   check(lang+'/'+id+' readable without scripts',await ev(`document.documentElement.lang===${JSON.stringify(lang)}&&document.querySelector('.guide-content').innerText.length>500`));
   check(lang+'/'+id+' fits mobile viewport',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
  }
 }
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 for(const lang of ['en','es']){
  await nav(rel('index',lang));
  check(lang+' index includes all guides',await ev(`document.querySelectorAll('[data-guide-search]').length===${data.guides.length}`));
  const query=lang==='es'?'jerarquia':'thermal';
  await ev(`(()=>{const e=document.getElementById('guide-search');e.value=${JSON.stringify(query)};e.dispatchEvent(new Event('input'));})()`);
  check(lang+' search has relevant results',await ev(`(()=>{const cards=[...document.querySelectorAll('[data-guide-search]')].filter(c=>!c.hidden);return cards.length>0&&cards.length<${data.guides.length};})()`));
  await ev(`(()=>{const e=document.getElementById('guide-search');e.value='zzznomatchzzz';e.dispatchEvent(new Event('input'));})()`);
  check(lang+' no results message visible',await ev(`![...document.querySelectorAll('[data-guide-search]')].some(c=>!c.hidden)&&document.getElementById('guide-status').textContent===document.getElementById('guide-status').dataset.none`));
  await ev(`document.getElementById('guide-clear').click()`);
  check(lang+' clear restores all guides and keyboard focus',await ev(`[...document.querySelectorAll('[data-guide-search]')].every(c=>!c.hidden)&&document.activeElement.id==='guide-search'`));
  const other=lang==='es'?'en':'es';await ev(`document.querySelector('.guide-switch a[lang="${other}"]').click()`);
  await waitFor(`document.documentElement.lang==='${other}'&&!!document.getElementById('guide-search')`);
  check(lang+' index language switch retains index',await ev(`location.href===${JSON.stringify(base+rel('index',other))}`));
  await nav(rel('neutrino-decays',lang));await ev(`document.querySelector('.guide-switch a[lang="${other}"]').click()`);
  await waitFor(`document.documentElement.lang==='${other}'&&!!document.getElementById('formulas')`);
  check(lang+' detail language switch retains guide',await ev(`location.href===${JSON.stringify(base+rel('neutrino-decays',other))}`));
 }
 for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  for(const lang of ['en','es']){
   await nav(rel('index',lang));const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,lang+'-'+name+'.png'),Buffer.from(shot.data,'base64'));
  }
 }
 await send('Page.navigate',{url:base+'app/index.html#s=hierarchy'});
 await waitFor(`typeof GUIDE_TARGETS!=='undefined'&&!!document.querySelector('.howto [data-guide-id="hierarchy"]')`);
 check('site app guide points to this complete local/site build',await ev(`document.querySelector('.howto [data-guide-id="hierarchy"]').href.startsWith(${JSON.stringify(base+'guide/')})`));
 check('no runtime errors',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({base,checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (guide pages browser)`);ws?.close();child.kill();}
