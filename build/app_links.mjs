/* Audit links actually rendered by all menu sections and simulator modes. */
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),site=resolve(root,'site');
const out=resolve(root,'.tmp/link-audit');mkdirSync(out,{recursive:true});
const port=9533,pause=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;const links=[],errors=[],broken=[],external=new Set();
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method)),60000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:pathToFileURL(resolve(site,'app/index.html')).href+'#s=quantization&lang=en'});
 for(let i=0;i<200;i++){if(await ev(`!!document.getElementById('gqClassResult')`))break;await pause(100);}
 const sections=await ev(`Array.from(document.querySelectorAll('#rail a')).map(a=>a.dataset.id).filter(Boolean)`);
 let states=0;
 for(const section of sections){
  await ev(`document.querySelector('#rail a[data-id="${section}"]').click()`);await pause(80);
  for(const mode of section==='predict'?[0,1,2]:[null]){
   if(mode!==null){await ev(`location.hash='s=predict&predict.s=v:${mode}&lang=en'`);await pause(200);}
   for(const lang of ['en','es']){
    await ev(`GUIDE_LANGUAGE='${lang}';syncGuideLanguage()`);await pause(30);states++;
    const found=await ev(`Array.from(document.querySelectorAll('a[href],img[src],video[src],source[src]')).map(e=>({url:e.href||e.src,label:(e.textContent||e.alt||'').trim().slice(0,100)}))`);
    for(const entry of found)links.push({section,mode,lang,...entry});
   }
  }
 }
 const canonical='https://karlesmarin.github.io/ghu-explorer/';
 const seen=new Set();let checked=0;
 for(const entry of links){
  if(seen.has(entry.url))continue;seen.add(entry.url);
  let url=new URL(entry.url);
  if(entry.url.startsWith(canonical))url=new URL(entry.url.slice(canonical.length),pathToFileURL(site+'/'));
  if(['http:','https:'].includes(url.protocol)){external.add(url.href.split('#')[0]);continue;}
  if(url.protocol!=='file:')continue;
  let path=fileURLToPath(url);if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.html');
  if(!existsSync(path)){broken.push({...entry,reason:'missing local target',path});continue;}
  checked++;
  const fragment=decodeURIComponent(url.hash.slice(1));
  if(!fragment)continue;
  if(path.endsWith('app\\index.html')||path.endsWith('app/index.html')){
   const params=new URLSearchParams(fragment),section=params.get('s');
   if(section&&!sections.includes(section))broken.push({...entry,reason:'unknown app section',target:section});
   continue;
  }
  if(!path.endsWith('.html'))continue;
  const html=readFileSync(path,'utf8');
  const ids=new Set([...html.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)].map(x=>x[1]));
  if(!ids.has(fragment)&&!html.includes('"id":"'+fragment+'"')&&!html.includes('"id": "'+fragment+'"'))broken.push({...entry,reason:'missing anchor',path:relative(site,path)});
 }
 const report={appSha256:createHash('sha256').update(readFileSync(resolve(site,'app/index.html'))).digest('hex'),states,renderedLinks:links.length,distinct:seen.size,checkedLocal:checked,broken,errors,external:[...external].sort()};
 writeFileSync(resolve(out,'app.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`${states} rendered states; ${seen.size} distinct links; ${checked} local targets; ${broken.length} broken; ${errors.length} runtime errors`);
 if(broken.length||errors.length){console.error(JSON.stringify({broken,errors},null,2));process.exitCode=1;}
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();child.kill();}
