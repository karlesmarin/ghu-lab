/* Census every rendered card, including the three simulator modes. */
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/interface-language');mkdirSync(out,{recursive:true});
const port=9521,pause=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;const rows=[],errors=[],checks=[],untranslated=new Map(),canvasMissing=new Map(),canvasChecks=[];
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method)),60000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__canvasDrawn=[];for(const name of ['fillText','strokeText']){const original=CanvasRenderingContext2D.prototype[name];CanvasRenderingContext2D.prototype[name]=function(text,...args){window.__canvasDrawn.push(String(text));return original.call(this,text,...args);};}`});
 await send('Page.navigate',{url:pathToFileURL(resolve(root,'app/index.html')).href+'#s=quantization&lang=en'});
 for(let i=0;i<200;i++){if(await ev(`!!document.getElementById('gqClassResult')`))break;await pause(100);}
 const sections=await ev(`Array.from(document.querySelectorAll('#rail a')).map(a=>a.dataset.id).filter(Boolean)`);
 for(const section of sections){
  await ev(`document.querySelector('#rail a[data-id="${section}"]').click()`);await pause(80);
  const modes=section==='predict'?[0,1,2]:[null];
  for(const mode of modes){
   if(mode!==null){await ev(`location.hash='s=predict&predict.s=v:${mode}&lang=en'`);await pause(200);}
   rows.push(...await ev(`Array.from(document.querySelectorAll('#section .card')).map((c,index)=>{const own=s=>Array.from(c.querySelectorAll(s)).filter(x=>x.closest('.card')===c);const heading=own('h1,h2,h3,summary')[0];return {section:${JSON.stringify(section)},mode:${JSON.stringify(mode)},index,id:c.id,title:heading?.textContent.trim()||'',help:own('.ihelp').map(x=>x.dataset.help||x.dataset.cardGuide),text:own('p').map(x=>x.textContent.trim()).join(' ').slice(0,1600),classes:c.className,hidden:!!c.closest('[hidden]')};})`));
   const result=await ev(`(()=>{
    const inputs=()=>Array.from(document.querySelectorAll('#section input,#section select')).map(e=>[e.id,e.value,e.checked]);
    const before=JSON.stringify(inputs());GUIDE_LANGUAGE='en';syncGuideLanguage();
    const nodes=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('script,style,noscript,metadata,code,pre,textarea,[data-guide-language],.helppop,#gqRoot,#rx_boundaryresearch,#rx_hypothesiscompare'))continue;nodes.push([node,node.nodeValue]);}
    GUIDE_LANGUAGE='es';syncGuideLanguage();
    const missing=[];for(const [node,en] of nodes){if(!node.parentElement||!node.parentElement.getClientRects().length)continue;const text=en.trim().replace(/\\s+/g,' ');const {key}=uiCanonical(text);if(text.split(/\\s+/).length>=4&&/[a-z]{3}/.test(text)&&!Object.hasOwn(UI_ES,key))missing.push(text);}
    const spanish=nodes.filter(([node,en])=>node.nodeValue!==en).length;
    const conserved=before===JSON.stringify(inputs());
    GUIDE_LANGUAGE='en';syncGuideLanguage();
    const restored=nodes.every(([node,en])=>node.nodeValue===en);
    return {missing,spanish,conserved,restored,htmlLanguage:document.documentElement.lang};
   })()`);
   checks.push({section,mode,passed:result.conserved&&result.restored&&result.htmlLanguage==='en'&&result.spanish>0});
   for(const text of result.missing){if(!untranslated.has(text))untranslated.set(text,[]);if(!untranslated.get(text).includes(section))untranslated.get(text).push(section);}
   const canvasInputs=await ev(`JSON.stringify(Array.from(document.querySelectorAll('#section input,#section select')).map(e=>[e.id,e.value,e.checked]))`);
   const draw={};
   for(const language of ['en','es']){
    await ev(`window.__canvasDrawn=[];document.querySelector('[data-guide-set-language="${language}"]').click()`);await pause(100);
    draw[language]=await ev(`Array.from(new Set(window.__canvasDrawn))`);
   }
   const translated=await ev(`(${JSON.stringify(draw.en)}).map(text=>({text,translated:uiTranslate(text,'es'),known:Object.hasOwn(UI_ES,uiCanonical(text).key)}))`);
   // The torus renderer selects a shorter instruction when translated text does
   // not fit. Both branches are maintained labels, measured before drawing.
   const shortTorus=await ev(`uiTranslate('drag: move α · shift: turn','es')`);
   const missed=translated.filter(r=>r.translated!==r.text&&!draw.es.includes(r.translated)&&!(r.text==='drag to move α · shift-drag to turn · wheel raises'&&draw.es.includes(shortTorus)));
   for(const r of translated)if(!r.known&&/[A-Za-z]{3}/.test(r.text)&&!/^[-+\d.e\s]*(?:GeV|TeV|MeV|keV|eV)$/.test(r.text)){
    if(!canvasMissing.has(r.text))canvasMissing.set(r.text,[]);canvasMissing.get(r.text).push(section);
   }
   const inputsKept=canvasInputs===await ev(`JSON.stringify(Array.from(document.querySelectorAll('#section input,#section select')).map(e=>[e.id,e.value,e.checked]))`);
   canvasChecks.push({section,mode,labels:draw.en.length,translated:translated.filter(r=>r.translated!==r.text).length,missed,inputsKept,passed:!missed.length&&inputsKept});
   await ev(`document.querySelector('[data-guide-set-language="en"]').click()`);await pause(50);
  }
 }
 if(errors.length)throw Error('Runtime exceptions: '+JSON.stringify(errors));
 writeFileSync(resolve(out,'untranslated.json'),JSON.stringify([...untranslated].map(([en,sections])=>({en,sections})),null,2)+'\n');
 writeFileSync(resolve(out,'canvas.json'),JSON.stringify({checks:canvasChecks,missing:[...canvasMissing].map(([en,sections])=>({en,sections}))},null,2)+'\n');
 console.log(untranslated.size+' unmatched visible prose fragments');
 const missing=rows.filter(r=>!r.help.length);
 writeFileSync(resolve(out,'inventory.json'),JSON.stringify({rows,missing,errors,checks},null,2)+'\n');
 console.log(`${rows.length} cards checked; ${missing.length} without information`);
 for(const r of missing)console.log(`${r.section}${r.mode===null?'':':'+r.mode} | ${r.id||r.index} | ${r.title}`);
 if(!process.argv.includes('--audit')&&missing.length)process.exitCode=1;
 const failed=checks.filter(c=>!c.passed);if(failed.length){console.error(failed);process.exitCode=1;}
 const canvasFailed=canvasChecks.filter(c=>!c.passed);if(canvasFailed.length){console.error(JSON.stringify(canvasFailed,null,2));process.exitCode=1;}
 console.log(`${canvasChecks.length-canvasFailed.length} canvas language checks passed; ${canvasMissing.size} unmatched labels`);
 if(untranslated.size||canvasMissing.size)process.exitCode=1;
 if(checks.length)console.log(`${checks.length-failed.length} passed, ${failed.length} failed (language round trip and input preservation)`);
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();child.kill();}
