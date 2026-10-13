/* Exercise real controls, exports, language, navigation and the guided demo; capture the new film. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/quantization-browser');
const capture=process.argv.includes('--capture-video')?resolve(root,'tools/quantization_video/captures'):resolve(out,'captures');mkdirSync(out,{recursive:true});mkdirSync(capture,{recursive:true});
const url=pathToFileURL(resolve(root,'app/index.html')).href,port=9517;
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws;const checks=[],errors=[],shots=[];
function ck(name,value){checks.push({name,passed:!!value});if(!value)throw Error(name);}
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No isolated browser');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method)),60000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const click=selector=>ev(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const set=(k,v)=>ev(`(()=>{const e=document.getElementById('gq_'+${JSON.stringify(k)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:url+'#s=quantization&lang=en'});
 for(let i=0;i<200;i++){if(await ev(`!!document.getElementById('gqClassResult')`))break;await pause(100);}
 ck('new section mounts with scoped verdict',await ev(`document.getElementById('gqScope').textContent.includes('not checked')`));
 for(const [preset,uni,spin] of [['spin','fails','passes'],['cover','fails','fails'],['joint','passes','passes'],['quarter','fails','fails']]){
  await click('#gqPreset_'+preset);ck(preset+' exact verdict',await ev(`(()=>{const r=gqModel(GQ_STATE);return r.universal.status==='${uni}'&&r.spin.status==='${spin}';})()`));
 }
 await set('gamma','1/0');ck('invalid input retains last valid state',await ev(`GQ_STATE.gamma==='1/4'&&document.getElementById('gqError').textContent.includes('Invalid input')`));
 await set('p','900719925474099312345');ck('large integer is exact and obstruction persists',await ev(`GQ_STATE.p==='900719925474099312345'&&gqModel(GQ_STATE).tensor.status==='fails'`));
 await set('b1','5');ck('U2 negative control fails',await ev(`gqModel(GQ_STATE).u2.status==='fails'`));
 await set('b1','6');await set('K1','13');ck('axion negative control fails',await ev(`gqModel(GQ_STATE).axion.status==='fails'`));
 await ev(`globalThis.gqDownloads=[];globalThis.gqSaveDownload=rxDownload;rxDownload=(...x)=>gqDownloads.push(x)`);await click('#gqExport');
 ck('JSON includes exact inputs, certificate scope and lift distinction',await ev(`(()=>{const r=JSON.parse(gqDownloads[0][1]);return r.parameters.p==='900719925474099312345'&&r.fullModelConsistency==='not_checked'&&r.lift.rawSquares[1]===-1;})()`));
 await ev(`rxDownload=gqSaveDownload`);await click('#btnLink');const saved=await ev('location.href');
 await send('Page.navigate',{url:saved});await pause(650);
 ck('permalink restores rational and large integer inputs',await ev(`GQ_STATE.gamma==='1/4'&&GQ_STATE.p==='900719925474099312345'`));
 ck('LaTeX export includes separate scoped result',await ev(`QUANTIZATION_SECTION.texExport().body.includes('not checked')`));
  ck('header card and LaTeX serialize the same complete evidence',await ev(`(()=>{const x=QUANTIZATION_SECTION.texExport();return toText(x.card).includes('global-quantization')&&toLatex(x.card,x).includes('Global quantization')&&x.card.certificates.quantization.parameters.p==='900719925474099312345';})()`));
 await click('#gqReset');
 for(const lang of ['en','es']){
  await click(`[data-guide-set-language="${lang}"]`);
  ck(lang+' language renders without resetting inputs',await ev(`document.getElementById('gqRoot').lang==='${lang}'&&GQ_STATE.gamma==='1/2'`));
  const helpKeys=await ev(`Array.from(document.querySelectorAll('#gqRoot > .card')).map(c=>({id:c.id,key:c.querySelector('h2 > .ihelp')?.dataset.help}))`);
  ck(lang+' all eight cards have information buttons',helpKeys.length===8&&helpKeys.every(c=>c.key));
  for(const {id,key} of helpKeys){
   await click('#'+id+' .ihelp');
   ck(lang+' '+id+' opens the corresponding glossary explanation',await ev(`(()=>{const p=document.querySelector('.helppop'),e=(GUIDE_LANGUAGE==='es'?HELP_TERMS_ES:HELP_TERMS)[${JSON.stringify(key)}];return p?.lang===GUIDE_LANGUAGE&&p.querySelector('b').textContent===e.term&&p.querySelector('p').innerHTML===e.body&&p.querySelector('a').href.endsWith('#'+${JSON.stringify(key)});})()`));
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
   ck(lang+' '+id+' help closes with Escape',await ev(`!document.querySelector('.helppop')`));
  }
  await click('#gqPreset_joint');
  ck(lang+' controls refresh visible results after language change',await ev(`document.getElementById('gq_gamma').value==='7/12'&&document.getElementById('gqClassResult').textContent.includes('(1, 1, 0)')`));
  await set('b1','5');
  ck(lang+' invalid U2 criterion is rendered after editing',await ev(`document.getElementById('gqU2').textContent.includes(gqStatus('fails'))`));
  ck(lang+' plotted fractions equal all 81 exact cells',await ev(`gqModel(GQ_STATE).figures.cocharacters.every(c=>{const el=document.querySelector('[data-gq-cell="'+c.m+','+c.n+'"]');return el.querySelector('text').textContent===c.fractionalPart&&el.querySelector('title').textContent.includes('Q='+c.period+';');})`));
  await ev(`document.querySelector('[data-gq-cell="1,0"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);
  ck(lang+' keyboard selection reveals exact failing period',await ev(`document.getElementById('gqCellReadout').textContent.includes('Q=7/8')`));
  await ev(`document.querySelector('[data-gq-lattice="0;1/2"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
  ck(lang+' lattice selection updates exact inputs and verdict',await ev(`GQ_STATE.gamma==='5/6'&&gqModel(GQ_STATE).spin.status==='passes'&&document.getElementById('gq_gamma').value==='5/6'`));
  await set('alpha','1000');
  ck(lang+' off-window coordinates are explicitly reported',await ev(`document.getElementById('gqFigurePosition').textContent.includes(GUIDE_LANGUAGE==='es'?'fuera de la ventana':'outside the displayed window')`));
  await ev(`globalThis.gqSvgSave=rxDownload;globalThis.gqSvgArgs=null;rxDownload=(...x)=>gqSvgArgs=x`);await click('#gqSaveFigures');
  ck(lang+' exported SVG embeds the exact plotted inputs',await ev(`(()=>{const doc=new DOMParser().parseFromString(gqSvgArgs[1],'image/svg+xml');const data=JSON.parse(doc.querySelector('metadata').textContent);return !doc.querySelector('parsererror')&&data.parameters.alpha==='1000'&&data.figures.cocharacters.length===81;})()`));
  await ev(`rxDownload=gqSvgSave`);
  await click('#gqReset');
  for(const [id,preset,selector] of [['intro',null,'gqIntro'],['spin','spin','gqClass'],['lattice',null,'gqLatticeSvg'],['cover','cover','gqClass'],['joint','joint','gqClass'],['axion',null,'gqAxion'],['tensor',null,'gqTensor'],['u2',null,'gqU2'],['fingerprint',null,'gqCocharacterSvg'],['lift',null,'gqLift'],['evidence',null,'gqEvidence']]){
   if(id==='fingerprint')await set('b1','5');
   if(id==='lift')await set('b1','6');
   if(preset)await click('#gqPreset_'+preset);
   await ev(`document.getElementById('${selector}').scrollIntoView({block:'start'});window.scrollBy(0,-110)`);await pause(120);
   const shot=await send('Page.captureScreenshot',{format:'png'});const filename=lang+'-'+id+'.png';writeFileSync(resolve(capture,filename),Buffer.from(shot.data,'base64'));
   shots.push({lang,id,file:filename,result:await ev('gqModel(GQ_STATE)')});
   const box=await ev(`(()=>{const r=document.getElementById('${selector}').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
   const detail=await send('Page.captureScreenshot',{format:'png',clip:box,captureBeyondViewport:true});writeFileSync(resolve(capture,lang+'-'+id+'-card.png'),Buffer.from(detail.data,'base64'));
  }
  await ev(`CDM_URL.speed=.01;cdmRun('quantization')`);
  let state;for(let i=0;i<600;i++){await pause(100);state=await ev(`({running:CDM_STATE.running,error:CDM_STATE.lastError,finished:CDM_STATE.lastFinished})`);if(!state.running)break;}
  ck(lang+' guided demo completes: '+(state.error||'no error'),state.finished==='quantization'&&!state.error&&!state.running);
  ck(lang+' demo closing explanation',await ev(`!!document.getElementById('cdm_explain')`));
  await click('#gqReset');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await ev(`document.getElementById('gqClass').scrollIntoView({block:'start'})`);await pause(100);
 ck('mobile has no page overflow',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
 writeFileSync(resolve(out,'mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 ck('no runtime exceptions',errors.length===0);
 writeFileSync(resolve(capture,'provenance.json'),JSON.stringify({app_sha256:createHash('sha256').update(readFileSync(resolve(root,'app/index.html'))).digest('hex'),shots},null,2)+'\n');
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({passed:!process.exitCode,checks,errors},null,2)+'\n');console.log(`${checks.filter(x=>x.passed).length} passed, ${checks.filter(x=>!x.passed).length} failed (quantization browser)`);ws?.close();child.kill();}
