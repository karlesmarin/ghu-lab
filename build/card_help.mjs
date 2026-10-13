/* Census every rendered card, including the three simulator modes. */
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/card-help');mkdirSync(out,{recursive:true});
const port=9519,pause=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;const rows=[],errors=[],checks=[];
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method)),60000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:pathToFileURL(resolve(root,'app/index.html')).href+'#s=quantization&lang=en'});
 for(let i=0;i<200;i++){if(await ev(`!!document.getElementById('gqClassResult')`))break;await pause(100);}
 const sections=await ev(`Array.from(document.querySelectorAll('#rail a')).map(a=>a.dataset.id).filter(Boolean)`);
 for(const section of sections){
  await ev(`document.querySelector('#rail a[data-id="${section}"]').click()`);await pause(80);
  const modes=section==='predict'?[0,1,2]:[null];
  for(const mode of modes){
   if(mode!==null){await ev(`location.hash='s=predict&predict.s=v:${mode}&lang=en'`);await pause(200);}
   rows.push(...await ev(`Array.from(document.querySelectorAll('#section .card')).map((c,index)=>{const own=s=>Array.from(c.querySelectorAll(s)).filter(x=>x.closest('.card')===c);const heading=own('h1,h2,h3,summary')[0];return {section:${JSON.stringify(section)},mode:${JSON.stringify(mode)},index,id:c.id,title:heading?.textContent.trim()||'',help:own('.ihelp').map(x=>x.dataset.help||x.dataset.cardGuide),text:own('p').map(x=>x.textContent.trim()).join(' ').slice(0,1600),classes:c.className,hidden:!!c.closest('[hidden]')};})`));
   if(!process.argv.includes('--audit')){
    checks.push(...await ev(`(()=>{const checks=[];for(const lang of ['en','es']){GUIDE_LANGUAGE=lang;for(const [index,card] of Array.from(document.querySelectorAll('#section .card')).entries()){const b=Array.from(card.querySelectorAll('.ihelp')).find(n=>n.closest('.card')===card);b?.click();const p=document.querySelector('.helppop');checks.push({section:${JSON.stringify(section)},mode:${JSON.stringify(mode)},index,lang,passed:!!p&&p.lang===lang&&p.textContent.length>50&&!!p.querySelector('a[href]')});document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));if(document.querySelector('.helppop'))throw Error('Help did not close');}}GUIDE_LANGUAGE='en';return checks;})()`));
   }
  }
 }
 if(errors.length)throw Error('Runtime exceptions: '+JSON.stringify(errors));
 const missing=rows.filter(r=>!r.help.length);
 writeFileSync(resolve(out,'inventory.json'),JSON.stringify({rows,missing,errors,checks},null,2)+'\n');
 console.log(`${rows.length} cards checked; ${missing.length} without information`);
 for(const r of missing)console.log(`${r.section}${r.mode===null?'':':'+r.mode} | ${r.id||r.index} | ${r.title}`);
 if(!process.argv.includes('--audit')&&missing.length)process.exitCode=1;
 const failed=checks.filter(c=>!c.passed);if(failed.length){console.error(failed);process.exitCode=1;}
 if(checks.length)console.log(`${checks.length-failed.length} passed, ${failed.length} failed (bilingual card information)`);
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();child.kill();}
