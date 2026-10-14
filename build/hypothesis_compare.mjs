/* Browser checks for the integrated card, shared export controls and existing demo engine. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/hypothesis-browser');mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'ghu-hypothesis-'));
const child=spawn(findChrome(),['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],events=[];let ws;
function check(name,passed,detail){checks.push({name,passed:!!passed,detail});if(!passed)throw Error(name+' '+JSON.stringify(detail));}
try{
 let port;for(let i=0;i<100;i++){try{port=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{}await pause(100);}
 const target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else events.push(m)};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const url=pathToFileURL(resolve(root,'app/index.html')).href;
 const navigate=async(lang='es')=>{await send('Page.navigate',{url:url+'?demoSpeed=0.001#s=samepot&lang='+lang});for(let i=0;i<100;i++){if(await ev("!!document.querySelector('#hcx_correlation [data-hcx-rho]')"))return;await pause(100);}throw Error('Card did not render '+JSON.stringify(events.filter(x=>x.method==='Runtime.exceptionThrown')));};
 const set=(key,value)=>ev(`(()=>{const e=document.querySelector('#rx_hypothesiscompare_controls [data-rx="${key}"]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 await navigate();
 check('Existing section contains four graphs and real data',await ev("document.querySelectorAll('#rx_hypothesiscompare svg').length===4 && document.querySelectorAll('[data-hcx-case]').length===9 && document.querySelectorAll('[data-hcx-bin]').length===15 && document.querySelectorAll('[data-hcx-rho]').length===225"));
 check('Existing demo button is mounted',await ev("!!document.querySelector('#rx_hypothesiscompare .cdm-btn')"));
 check('Spanish readings and controls',await ev("document.getElementById('hcx_theory_reading').textContent.includes('El caso 6') && document.getElementById('rx_hypothesiscompare_controls').textContent.includes('Caso GHU')"));
 check('Spanish overview is consistent',await ev("!document.getElementById('rx_hypothesiscompare_result').textContent.includes('What this tests') && document.getElementById('rx_hypothesiscompare_result').textContent.includes('Qué se comprueba')"));
 await set('case',4);check('Case updates graph and interpretation',await ev("document.querySelector('[data-hcx-potential]').dataset.hcxPotential==='4' && document.getElementById('hcx_theory_reading').textContent.includes('El caso 4')"));
 await set('region',1);await set('bin',14);await set('other',14);
 check('CMS self correlation and theory independence',await ev("hcxModel(RX_STATE.hypothesiscompare).selectedMeasurement.correlation===1 && RX_STATE.hypothesiscompare.case===4 && document.getElementById('hcx_data_reading').textContent.includes('por definición')"));
 await set('case',999);check('Invalid input retains validated state',await ev("RX_STATE.hypothesiscompare.case===4 && document.getElementById('rx_hypothesiscompare_error').textContent.length>0"));await set('case',4);
 await ev("document.querySelector('#rx_hypothesiscompare [data-pin]').click()");await set('case',6);
 check('Shared comparison retains earlier selection',await ev("RX_BASELINES.hypothesiscompare.parameters.case===4"));
 await ev("document.getElementById('hcx_certificates').open=true;globalThis.hcxBeforeLanguage=JSON.stringify({inputs:RX_STATE.hypothesiscompare,comparison:RX_BASELINES.hypothesiscompare,result:hcxModel(RX_STATE.hypothesiscompare)});document.querySelector('#rx_hypothesiscompare select[aria-label]').value='2'");
 for(const lang of ['en','es','en','es']){
  await ev(`document.querySelector('[data-guide-set-language="${lang}"]').click()`);
  check('Live language '+lang+' renders the selected model',await ev(`(()=>{const reading=hcxRead(hcxModel(RX_STATE.hypothesiscompare),'${lang}');return document.getElementById('hcx_theory_reading').textContent===reading.theory&&document.getElementById('hcx_data_reading').textContent===reading.data&&document.getElementById('rx_hypothesiscompare').lang==='${lang}';})()`));
  const kept=await ev("({same:hcxBeforeLanguage===JSON.stringify({inputs:RX_STATE.hypothesiscompare,comparison:RX_BASELINES.hypothesiscompare,result:hcxModel(RX_STATE.hypothesiscompare)}),open:document.getElementById('hcx_certificates').open,figure:document.querySelector('#rx_hypothesiscompare select[aria-label]').value})");
  check('Live language '+lang+' preserves inputs, comparison, results and open certificate',kept.same&&kept.open&&kept.figure==='2',kept);
  check('Live language '+lang+' translates figure labels',await ev(`document.querySelector('#hcx_correlation [data-axis="y"]').textContent===${JSON.stringify(lang==='es'?'Intervalo i':'Interval i')}`));
 }
 await ev("globalThis.hcxDownloads=[];globalThis.hcxOriginalDownload=rxDownload;rxDownload=(...args)=>hcxDownloads.push(args);document.getElementById('rx_hypothesiscompare_json').click();document.querySelector('#rx_hypothesiscompare [data-hcx-csv]').click()");
 check('Shared JSON exports scope and full covariance',await ev("(()=>{const d=JSON.parse(hcxDownloads[0][1]);return d.experiment==='hypothesiscompare'&&!d.result.observedFitReady&&d.result.cms.covariance.length===15&&d.comparison.parameters.case===4;})()"));
 check('CSV contains fifteen observed bins',await ev("hcxDownloads[1][1].split('\\n').length===16"));
 await ev("document.querySelector('[data-hcx-certificate]').click()");
 check('Certificates download records exact claims and pending scope',await ev("(()=>{const c=JSON.parse(hcxDownloads.at(-1)[1]);return c.lean.theorems===10&&c.covariance.dimension===15&&c.derivative_enclosures.length===3&&!c.full_potential_certified&&!c.numerical_diagnostic.rigorous_integral_error_bound;})()"));
 check('Shared JSON includes the same certificate',await ev("JSON.stringify(JSON.parse(hcxDownloads[0][1]).result.certificates)===JSON.stringify(JSON.parse(hcxDownloads.at(-1)[1]))"));
 for(let i=0;i<4;i++){
  await ev(`document.querySelector('#rx_hypothesiscompare select[aria-label]').value=${i};document.getElementById('rx_hypothesiscompare_svg').click()`);
  check('SVG '+i+' is independently styled and carries metadata',await ev(`hcxDownloads.at(-1)[1].includes('<metadata>')&&hcxDownloads.at(-1)[1].includes('font-family')&&!hcxDownloads.at(-1)[1].includes('var(--')`));
 }
 await ev("rxDownload=hcxOriginalDownload;document.getElementById('btnLink').click()");const saved=await ev('location.href');await send('Page.navigate',{url:saved});await pause(700);
 check('Shared link restores selected contexts',await ev("RX_STATE.hypothesiscompare.case===6&&RX_STATE.hypothesiscompare.region===1&&RX_STATE.hypothesiscompare.bin===14"));
 await ev("(()=>{const input=document.querySelector('[data-hcx-import]'),dt=new DataTransfer();dt.items.add(new File([JSON.stringify({schema:'ghu-lab-experiment-v1',experiment:'hypothesiscompare',parameters:{case:2,region:0,bin:3,other:4}})],'selection.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");await pause(100);
 check('Real file import restores a validated selection',await ev("RX_STATE.hypothesiscompare.case===2&&RX_STATE.hypothesiscompare.bin===3"));
 await ev("(()=>{const input=document.querySelector('[data-hcx-import]'),dt=new DataTransfer();dt.items.add(new File(['{}'],'invalid.json'));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");await pause(100);
 check('Invalid file is rejected without losing state',await ev("RX_STATE.hypothesiscompare.case===2&&document.querySelector('[data-hcx-import-status]').textContent.includes('rechazada')"));
 for(const width of [1380,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(300);
  await ev("document.getElementById('hcx_certificates').open=true");await pause(100);
  const issues=await ev(`(()=>{const bad=[];for(const s of document.querySelectorAll('#rx_hypothesiscompare svg')){const t=[...s.querySelectorAll('text')];for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){const a=t[i].getBoundingClientRect(),b=t[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)bad.push([t[i].textContent,t[j].textContent]);}}return bad;})()`);
  check('Labels do not overlap at '+width,issues.length===0,issues);
  check('Card does not overflow at '+width,await ev("(()=>{const c=document.getElementById('rx_hypothesiscompare');return c.scrollWidth<=c.clientWidth+2;})()"));
  await ev("document.getElementById('rx_hypothesiscompare').scrollIntoView({block:'start'})");const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,`card-${width}.png`),Buffer.from(shot.data,'base64'));
  await ev("(()=>{const e=document.getElementById('hcx_certificates');e.open=true;e.scrollIntoView({block:'start',behavior:'instant'});})()");await pause(500);
  check('Certificate table is expanded at '+width,await ev("document.getElementById('hcx_certificates').open && document.getElementById('hcx_certificates').getBoundingClientRect().height>300"));
  const proofShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,`certificates-${width}.png`),Buffer.from(proofShot.data,'base64'));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 for(const lang of ['es','en']){
  await navigate(lang);await ev("cdmRun('hypothesiscompare')");
  check('Existing demo completes in '+lang,await ev("CDM_STATE.lastFinished==='hypothesiscompare' && !CDM_STATE.lastError && RX_STATE.hypothesiscompare.case===6 && RX_STATE.hypothesiscompare.bin===14 && RX_STATE.hypothesiscompare.other===13"));
  check('Demo closing reading from the shared guide in '+lang,await ev(`document.getElementById('cdm_explain').textContent.includes(${JSON.stringify(lang==='es'?'Cómo leerlo':'How to read it')}) && document.getElementById('cdm_explain').textContent.includes(${JSON.stringify(lang==='es'?'Lee ejes':'Read axes')})`));
  check('Demo opens scoped certificates in '+lang,await ev("document.getElementById('hcx_certificates').open && document.getElementById('hcx_certificates').textContent.includes('15')"));
 }
 await ev("location.hash='s=collider'");await pause(300);await ev("location.hash='s=samepot'");await pause(300);
 check('Remount keeps the card functional',await ev("document.querySelectorAll('#rx_hypothesiscompare svg').length===4"));
 await ev("cdmHide(); CDM_URL.speed=0.05; cdmRun('hypothesiscompare'); true");
 for(let i=0;i<100;i++){if(await ev("!!document.getElementById('cdm_banner')"))break;await pause(10);}
 check('Demo has started before leaving',await ev("CDM_STATE.running==='hypothesiscompare' && !!document.getElementById('cdm_banner')"));
 await ev("location.hash='s=collider'");await pause(200);
 for(let i=0;i<40;i++){if(await ev("!CDM_STATE.running && !document.getElementById('cdm_banner')"))break;await pause(50);}
 check('Leaving the section stops its demo',await ev("!CDM_STATE.running && !document.getElementById('cdm_banner')"),await ev("({state:CDM_STATE,hash:location.hash,banner:document.getElementById('cdm_banner')?.textContent})"));
 check('No browser exceptions',events.filter(e=>e.method==='Runtime.exceptionThrown').length===0,events.filter(e=>e.method==='Runtime.exceptionThrown'));
 writeFileSync(resolve(out,'validation.json'),JSON.stringify({passed:true,count:checks.length,checks},null,2));console.log(`${checks.length} checks pass — integrated hypothesis card, imports, exports, responsive figures and shared EN/ES demos`);
}finally{ws?.close();child.kill();}
