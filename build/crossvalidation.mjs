/* Exercise evidence matching, exports and layout in the actual offline application. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/crossvalidation-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=pathToFileURL(app).href,port=9524;
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${resolve(out,'profile-'+Date.now())}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let ws;
function check(name,passed){checks.push({name,passed:!!passed});if(!passed)throw Error(name);}
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No browser');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);j(Error(method+' timed out'));},45000);pending.set(id,m=>{clearTimeout(timer);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 const nav=async(id,element)=>{await send('Page.navigate',{url:url+'#s='+id});for(let i=0;i<200;i++){if(await ev(`!!document.getElementById('${element}')`))return;await pause(100);}throw Error('Missing '+element);};
 const change=(sel,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const shots=async(id,name)=>{
  for(const [device,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(150);
   check(name+' '+device+' no page overflow',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
   await ev(`document.getElementById('${id}').scrollIntoView()`);
   const clip=await ev(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()`);
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});writeFileSync(resolve(out,name+'_'+device+'.png'),Buffer.from(shot.data,'base64'));
  }
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 await nav('hierarchy','mdBenchmark');
 for(let i=0;i<10;i++){
  await change('#mdBenchmark',String(i));
  check('budget '+i+' visible with physical unknowns',await ev(`!!document.getElementById('cvBudget')&&document.getElementById('cvBudget').textContent.includes('Not quantified')`));
 }
 check('budget export retains bounds, W input and null total',await ev(`(()=>{let s;const old=rxDownload;try{rxDownload=(n,t)=>s=JSON.parse(t);document.getElementById('mdSave').click();const b=s.uncertaintyBudget;return b.measuredW.value==='200923/2500'&&b.record.totalPhysicalUncertaintyGeV===null&&b.record.numerical.fourierTerms===2048&&!!b.inputs;}finally{rxDownload=old;}})()`));
 await shots('cvBudget','budget');
 await ev(`(()=>{const b=MOMENT_DIAGNOSTICS.benchmarks[0],s=SECTIONS.find(s=>s.id==='hierarchy');s._momentErrorView.render({bulk:b.bulk,conventions:{gauge_seed:b.seed,m_W:80.4,g4:.64}},DATA);})()`);
 check('changed mass convention withdraws budget',await ev(`!document.getElementById('cvBudget')&&document.getElementById('mdSave').disabled`));
 await nav('predict','prModel');await change('#prModel','builder');
 for(const c of [1,2]){
  await ev(`Array.from(document.querySelectorAll('#rx_thermal button')).find(b=>b.textContent==='Thermal paper · case ${c}').click()`);
  check('thermal case '+c+' matches',await ev(`document.getElementById('cvThermal').dataset.matched==='true'&&rxResult(TH_PANEL,RX_STATE.thermal).crossValidation.record.case===${c}`));
  check('case '+c+' export retains shared ancestry and four cutoffs',await ev(`(()=>{let s;const old=rxDownload;try{rxDownload=(n,t)=>s=JSON.parse(t);document.getElementById('rx_thermal_json').click();const v=s.result.crossValidation;return v.record.crossings.length===4&&v.methodScope.includes('shared shooting-method ancestry')&&v.record.withinDeclaredTargets&&v.backend.cosmoTransitions==='2.0.7';}finally{rxDownload=old;}})()`));
 }
 await shots('cvThermal','thermal');
 await change('#rx_thermal_controls [data-rx="g4"]',1.1);
 check('changed thermal coupling withdraws evidence',await ev(`document.getElementById('cvThermal').dataset.matched==='false'&&rxResult(TH_PANEL,RX_STATE.thermal).crossValidation===null`));
 check('edited-point export cannot keep stale comparison',await ev(`(()=>{let s;const old=rxDownload;try{rxDownload=(n,t)=>s=JSON.parse(t);document.getElementById('rx_thermal_json').click();return s.result.crossValidation===null;}finally{rxDownload=old;}})()`));
 await ev(`document.querySelector('#rx_thermal [data-default]').click()`);
 check('restoring reference restores comparison',await ev(`document.getElementById('cvThermal').dataset.matched==='true'`));
 await nav('hierarchy','mdBenchmark');await change('#mdBenchmark','0');
 check('remount retains operational evidence controls',await ev(`!!document.getElementById('cvBudget')`));
 await send('Page.navigate',{url:pathToFileURL(resolve(root,'docs/su7-certification.html')).href});await pause(300);
 check('English dossier includes uncertainty budget',await ev(`document.documentElement.lang==='en'&&!!document.getElementById('uncertainty-budget')`));
 check('no runtime errors',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({appSHA256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (crossvalidation browser)`);ws?.close();child.kill();}
