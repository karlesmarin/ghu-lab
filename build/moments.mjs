/* Exercise certified approximation, edited-input invalidation and equal-moment witness. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/moments-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=pathToFileURL(app).href,port=9513;
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
 const nav=async id=>{await send('Page.navigate',{url:url+'#s='+id});for(let i=0;i<200;i++){if(await ev(`typeof MOMENT_DIAGNOSTICS!=='undefined'&&!!document.getElementById('${id==='hierarchy'?'mdBenchmark':'mmExample'}')`))break;await pause(100);}await pause(250);};
 const change=(sel,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 await nav('hierarchy');
 for(let i=0;i<10;i++){
  await change('#mdBenchmark',String(i));
  check('benchmark '+i+' matches live inputs',await ev(`document.getElementById('mdStatus').dataset.status==='certified-benchmark'&&document.getElementById('mdBenchmark').value==='${i}'&&!document.getElementById('mdSave').disabled`));
  check('benchmark '+i+' keeps three distinct experiments/channels',await ev(`document.querySelectorAll('#mdExperiment tbody tr').length===3&&document.getElementById('mdResults').textContent.includes('not a statistical exclusion')`));
 }
 check('export retains experimental references, bounds and sources',await ev(`(()=>{let s;const old=rxDownload;try{rxDownload=(n,t)=>s=JSON.parse(t);document.getElementById('mdSave').click();return s.record.residualProof.convexCover.length===16&&s.experimentalReferences.measurements.length===3&&s.massComparisons.length===3&&s.conventions.g4===.63;}finally{rxDownload=old;}})()`));
 // This renderer accepts model input from the shared shell. Exercise the boundary even though
 // the SU(7) shell currently fixes g4 and mW, so a future editor cannot leave a stale badge.
 await ev(`(()=>{const b=MOMENT_DIAGNOSTICS.benchmarks[0],s=SECTIONS.find(s=>s.id==='hierarchy');s._momentErrorView.render({bulk:b.bulk,conventions:{gauge_seed:b.seed,m_W:80.4,g4:.64}},DATA);})()`);
 check('changed coupling withdraws result and export',await ev(`document.getElementById('mdStatus').dataset.status==='different-mass-inputs'&&document.getElementById('mdSave').disabled&&!document.getElementById('mdResults').textContent`));
 await change('#mdBenchmark','0');
 for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(100);
  check(name+' error card no page overflow',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
  await ev(`document.getElementById('momentErrorCard').scrollIntoView()`);
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,'error_'+name+'.png'),Buffer.from(shot.data,'base64'));
 }
 await nav('samepot');await ev(`document.getElementById('mmExample').click()`);
 check('exact moments same but potentials differ',await ev(`document.getElementById('mmStatus').dataset.equalLocal==='true'&&document.getElementById('mmStatus').dataset.samePotential==='false'`));
 check('certified non-global local minimum',await ev(`document.getElementById('mmProof').dataset.certifiedLowerCompetitor==='true'&&document.getElementById('mmProof').textContent.includes('does not assert')`));
 await change('#mmScale','local');
 check('export reproduces local comparison',await ev(`(()=>{let s;const old=rxDownload;try{rxDownload=(n,t)=>s=JSON.parse(t);document.getElementById('mmSave').click();return s.equalLocal&&!s.samePotential&&s.curve.appA.every((v,i)=>v===s.curve.appB[i])&&s.plotRange==='local'&&s.matchedWitnessB.lowerEndpointCertified;}finally{rxDownload=old;}})()`));
 await ev(`document.querySelector('#spSlots button[data-d="1"]').click()`);
 check('edited B withdraws equal-moment and archived proof claims',await ev(`document.getElementById('mmStatus').dataset.equalLocal==='false'&&document.getElementById('mmProof').dataset.certifiedLowerCompetitor==='false'`));
 await ev(`document.getElementById('mmExample').click()`);
 for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(100);
  check(name+' pair card no page overflow',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
  await ev(`document.getElementById('momentPairCard').scrollIntoView()`);
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,'pair_'+name+'.png'),Buffer.from(shot.data,'base64'));
 }
 await ev(`document.querySelector('#rail a[href="#s=hierarchy"]')?.click()`);
 // Reload is also a remount: no data or listeners survive from an unrelated card.
 await nav('hierarchy');await change('#mdBenchmark','3');
 check('remounted benchmark selector remains operational',await ev(`document.getElementById('mdBenchmark').value==='3'&&document.getElementById('mdStatus').dataset.status==='certified-benchmark'`));
 await send('Page.navigate',{url:pathToFileURL(resolve(root,'docs/su7-certification.html')).href});await pause(300);
 check('English dossier includes proof, data and repository comparison',await ev(`document.documentElement.lang==='en'&&document.getElementById('moment-experiments')&&document.getElementById('lhc-comparison')&&document.getElementById('other-laboratories')`));
 check('dossier fits mobile viewport',await ev('document.documentElement.scrollWidth<=innerWidth+2'));
 check('no runtime errors',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({url,appSHA256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (moment browser)`);ws?.close();child.kill();}
