/* Browser checks for conditional certificates and integrated transition history. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/closure-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=process.env.GHU_CLOSURE_URL||pathToFileURL(app).href,port=9497;
const profile=resolve(out,`profile-${Date.now()}`);mkdirSync(profile,{recursive:true});
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],events=[];let ws;
function check(name,passed){checks.push({name,passed:!!passed});if(!passed)throw Error(name);}
try{
 let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('No isolated browser');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else events.push(m);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);j(Error(`Timeout ${method}`));},60000);pending.set(id,m=>{clearTimeout(timer);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{
  // registry.js copies the section prototypes; inspect the mounted instances.
  expression=expression.replaceAll('PRED_SECTION.',"SECTIONS.find(s=>s.id==='predict').").replaceAll('SCREEN_SECTION.',"SECTIONS.find(s=>s.id==='screen').");
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;
 };
 const nav=async hash=>{await send('Page.navigate',{url:url+'#'+hash});for(let i=0;i<200;i++){if(await ev(`typeof TH_HISTORY_PANEL!=='undefined'&&!!document.getElementById('section')`))break;await pause(100);}await pause(350);};
 const change=async(selector,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
 const boundaryState=encodeURIComponent('b:1,0,0,2~u:fund|1|dirac!2');
 await nav('s=sun5d&sun5d.s='+boundaryState);
 check('builder endpoint breaks theta0 group',await ev(`document.getElementById('sunVac').textContent.includes('4 → 2 massless generators')&&document.getElementById('sunVac').textContent.includes('breaks generators')`));
 check('builder displayed energy equals the potential',await ev(`(()=>{const b=sun5dBlocks(SUN5D_S.blocks),t=sun5dTerms(b,{bulk:SUN5D_SECTION._content()});return document.getElementById('sunVac').textContent.includes('V/C = '+sun5dV(t,[1],600).toFixed(5));})()`));
 check('builder exported symmetry matches its verdict',await ev(`SUN5D_SECTION.texExport().card.results.vacuum_symmetry.value.includes('breaks')&&SUN5D_SECTION.texExport().card.results.at_domain_end.value===true`));
 await nav('s=spectrum5d&sun5d.s='+boundaryState);
 check('spectrum does not infer no breaking from boundary',await ev(`document.getElementById('spThetaNote').textContent.includes('some θ = 0 generators are broken')&&!document.getElementById('spThetaNote').textContent.includes('not a broken vacuum')`));
 await nav('s=predict&sun5d.s='+boundaryState);
 check('simulator separates endpoint breaking from W dictionary',await ev(`document.getElementById('prParamNote').textContent.includes('some θ = 0 generators are broken')&&PRED_SECTION._P.symmetry.broken&&!PRED_SECTION._P.located`));
 await ev(`(()=>{document.getElementById('prProbe').click();const e=document.getElementById('prTheta');e.value=.8;e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await ev(`(()=>{const e=document.getElementById('prG4');e.value=.8;e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 check('probe export records actual coupling and analytic Hessian',await ev(`(()=>{const c=PRED_SECTION.texExport().card,e=c.calculationEvidence;return e.evaluation==='probe'&&e.g4===.8&&e.g4Source==='user input'&&e.hessian.method==='analytic-fourier'&&c.results.higgs_mass_GeV.source.includes('user input')&&c.input.model.conventions.g4===e.g4&&c.input.model.conventions.m_W===EXPERIMENT.m_W.value&&JSON.stringify(c.input.model.evaluated_phase)===JSON.stringify(e.theta)&&Math.abs(PRED_SECTION._P.mHOverR-PRED_SECTION._P.mHGeV/PRED_SECTION._P.invRGeV)<1e-12;})()`));
 await nav('s=predict');await change('#prModel','builder');
 check('integrated case 1 percolation visible',await ev(`document.getElementById('rx_thermalhistory_result').textContent.includes('90.341')`));
 check('two history figures',await ev(`document.querySelectorAll('#rx_thermalhistory_result svg').length===2`));
 check('provenance includes actual action samples',await ev(`rxResult(TH_HISTORY_PANEL,RX_STATE.thermalhistory).actionProvenance.samples.length>80`));
 await change('#rx_thermalhistory_controls [data-rx="wallSpeed"]',.2);
 check('slow wall suppresses unsupported acoustic fit',await ev(`document.getElementById('rx_thermalhistory_result').textContent.includes('Acoustic spectrum not evaluated')&&rxResult(TH_HISTORY_PANEL,RX_STATE.thermalhistory).spectrum===null`));
 await ev(`document.querySelector('#rx_thermalhistory [data-default]').click()`);
 await change('#rx_thermalhistory_controls [data-rx="efficiency"]',0);
 check('zero efficiency has zero signal without invalid logs',await ev(`document.getElementById('rx_thermalhistory_result').textContent.includes('zero acoustic signal')&&!/NaN|Infinity/.test(document.getElementById('rx_thermalhistory_result').innerHTML)`));
 await change('#rx_thermalhistory_controls [data-rx="efficiency"]',.4);
 await ev(`document.getElementById('btnLink').click()`);const permalink=await ev('location.href');
 await send('Page.navigate',{url:permalink});await pause(600);
 check('history controls survive permalink',await ev(`RX_STATE.thermalhistory.efficiency===.4&&PRED_S.variant==='builder'`));
 check('global export retains both model and wall assumptions',await ev(`PRED_SECTION.texExport().card.researchExtensions.thermalhistory.result.thermalParameters.g4===3`));
 await change('#rx_thermal_controls [data-rx="g4"]',2);
 check('changed thermal model invalidates integrated history',await ev(`rxResult(TH_HISTORY_PANEL,RX_STATE.thermalhistory).status==='pending'&&document.getElementById('rx_thermalhistory_result').textContent.includes('pending')`));
 await ev(`Array.from(document.querySelectorAll('#rx_thermal button')).find(b=>b.textContent==='Thermal paper · case 2').click()`);
 check('case 2 uses its own refined action',await ev(`rxResult(TH_HISTORY_PANEL,RX_STATE.thermalhistory).history.percolation.temperatureGeV>25.14&&rxResult(TH_HISTORY_PANEL,RX_STATE.thermalhistory).history.percolation.temperatureGeV<25.16`));
 await ev(`document.querySelector('#rx_thermalhistory [data-pin]').click()`);
 await change('#rx_thermalhistory_controls [data-rx="wallSpeed"]',.9);
 check('history comparison captures independent snapshot',await ev(`RX_BASELINES.thermalhistory.parameters.wallSpeed===.95&&RX_STATE.thermalhistory.wallSpeed===.9`));
 await change('#prModel','neutrino');
 check('history hidden in neutrino-ring view',await ev(`document.getElementById('rx_thermalhistory').hidden`));
 for(const seed of ['published','candidate']){
  await nav('s=screen&su7_km25.seed='+seed);await change('#sci_mh',125.2);
  check(seed+' printed row residuals visible',await ev(`document.getElementById('scFiveNote').textContent.includes('192-bit')&&document.querySelectorAll('#scFive .chip.bad').length>=5`));
  check(seed+' certified benchmarks have explicit scope',await ev(`document.getElementById('scCertifiedSU7').textContent.includes('26 Lean algebraic theorems')&&document.getElementById('scCertifiedSU7').textContent.includes('not a certificate for an arbitrary edited model')&&document.querySelectorAll('#scCertifiedSU7 tbody tr').length===5`));
  check(seed+' downloadable certificate retains continuum proof and formal scope',await ev(`(()=>{let saved;const original=rxDownload;try{rxDownload=(name,text)=>saved=JSON.parse(text);document.getElementById('scCertifiedSU7JSON').click();return saved.globalProof.rows.length===10&&saved.globalProof.rows.every(p=>p.certified&&p.cover.length>0)&&saved.summary.formalTheorems===26&&!saved.summary.noveltyEstablished&&saved.independentVerification.sage.conditional_mass_intervals.length===10;}finally{rxDownload=original;}})()`));
  check(seed+' correct rung certificate',await ev(`document.getElementById('scConditionalBounds').textContent.includes('${seed} seed')&&document.querySelectorAll('#scConditionalBounds svg').length===1`));
  check(seed+' plotted comb and spacing share applicable bounds',await ev(`SCREEN_SECTION._lastEvidence.bounds.applicable&&SCREEN_SECTION._lastCombCertified&&!document.getElementById('scSpacing').textContent.includes('not evaluated')`));
  await change('#sci_MKK',9000);
  check(seed+' visible verdict uses shared evidence',await ev(`document.getElementById('scHits').textContent.includes(SCREEN_SECTION._lastEvidence.title)&&document.getElementById('scHits').textContent.includes('not a theory exclusion')`));
  check(seed+' export uses same comb evidence',await ev(`(()=>{let saved;const original=rxDownload;try{rxDownload=(name,text)=>saved=JSON.parse(text);document.getElementById('scBoundsJSON').click();return JSON.stringify(saved.comb)===JSON.stringify(SCREEN_SECTION._lastEvidence)&&saved.bounds.applicable===saved.comb.bounds.applicable;}finally{rxDownload=original;}})()`));
  if(seed==='candidate')check('false vacua visibly rejected',await ev(`document.getElementById('scConditionalBounds').textContent.includes('deeper minimum elsewhere')`));
  await change('#sci_mh',130);
  check(seed+' out-of-window certificates withdrawn',await ev(`!document.querySelector('#scConditionalBounds svg')&&document.getElementById('scConditionalBounds').textContent.includes('no rescaling')`));
  check(seed+' bounds withdrawn from actual comb and spacing',await ev(`!SCREEN_SECTION._lastCombCertified&&SCREEN_SECTION._lastEvidence.rows.every(r=>r.upperGeV===null)&&Array.from(document.querySelectorAll('#scSpacing tr')).every(r=>r.textContent.includes('not evaluated'))`));
  check(seed+' arithmetic-only verdict when mass window changes',await ev(`SCREEN_SECTION._lastEvidence.status==='arithmetic-only'&&document.getElementById('scHits').textContent.includes('bounds not applicable')`));
 }
 await change('#sci_mh',125.2);await ev(`document.getElementById('scBoundDetails').open=true`);
 await ev(`document.getElementById('scCertifiedSU7').closest('details').open=true`);
 for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(150);
  check('certificate '+name+' no page overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
  await ev(`document.getElementById('scBoundDetails').scrollIntoView()`);
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,`certificates_${name}.png`),Buffer.from(shot.data,'base64'));
 }
 await nav('s=predict');await change('#prModel','builder');
 for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(150);
  check('history '+name+' no page overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
  await ev(`document.getElementById('rx_thermalhistory').scrollIntoView()`);
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,`history_${name}.png`),Buffer.from(shot.data,'base64'));
 }
 check('no runtime errors',!events.some(e=>e.method==='Runtime.exceptionThrown'));
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({url,local_app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors:events.filter(e=>e.method==='Runtime.exceptionThrown')},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (closure browser)`);if(ws)ws.close();child.kill();}
