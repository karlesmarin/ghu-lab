/* Controls, scientific meaning, exports and actual desktop/mobile figure captures. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/neutrino-research-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=pathToFileURL(app).href,port=9497;
const profile=resolve(root,'.tmp',`neutrino-research-${Date.now()}`);mkdirSync(profile,{recursive:true});
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
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
  const change=async(selector,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const control=async(key,value,card='identifiability')=>change(`#rx_${card}_controls [data-rx="${key}"]`,value);
  const result=expression=>ev(`(()=>{const r=NI_PANEL.compute(RX_STATE.identifiability);return ${expression};})()`);
  const shot=async(selector,name,index=0)=>{
    const clip=await ev(`(()=>{const b=document.querySelectorAll(${JSON.stringify(selector)})[${index}].getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height,scale:1};})()`);
    const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});writeFileSync(resolve(out,name+'.png'),Buffer.from(s.data,'base64'));
  };
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:url+'#s=predict'});
  for(let i=0;i<200;i++){if(await ev("!!document.getElementById('prModel')"))break;await pause(100);}
  await change('#prModel','neutrino');
  check('five descriptive figures mount',await ev("document.querySelectorAll('#rx_identifiability_result svg').length===5&&document.querySelectorAll('#rx_identifiability_result figcaption').length===5"));
  check('figures carry title description and provenance',await ev("[...document.querySelectorAll('#rx_identifiability_result svg')].every(s=>s.querySelector('title')&&s.querySelector('desc')&&JSON.parse(s.querySelector('metadata').textContent).provenance)"));
  check('light inputs visibly fixed',await ev("document.querySelector('#rx_identifiability_result .ni-fixed').textContent.includes('Light masses')"));
  const baseline=await result('({mass:r.selected.massGeV,split:r.selected.splitEV,light:r.lightTargetsEV,chi:r.deepcore.deltaChi2})');
  await ev("document.querySelector('#rx_identifiability [data-pin]').click()");await control('position',.8);
  check('muB changes splitting while holding light and centre',await result(`r.selected.splitEV!==${baseline.split}&&r.selected.massGeV===${baseline.mass}&&JSON.stringify(r.lightTargetsEV)===${JSON.stringify(JSON.stringify(baseline.light))}`));
  check('experimental map unchanged across ring path',await result(`r.deepcore.deltaChi2===${baseline.chi}&&r.deepcore.ringExclusion===null&&r.deepcore.combinedNuFIT===null`));
  check('comparison snapshot survives sweep change',await ev("RX_BASELINES.identifiability.parameters.position===.1&&document.getElementById('rx_identifiability_result').textContent.includes('Reference:')"));
  await shot('#rx_identifiability_result .ni-grid','heavy_path_desktop');
  await control('axis',5);await control('position',1);
  check('common suppression cancellation is described',await ev("document.getElementById('rx_identifiability_result').textContent.includes('coincide to numerical precision')"));
  check('common deficits retain raw attenuation',await result('Math.max(...r.curves.map(x=>Math.abs(x.ccKernel-x.unitary)))>1e-5&&r.selected.maxShapeDifference<1e-12'));
  await shot('#rx_identifiability_result .ni-grid','common_shape_desktop',1);
  await control('axis',8);
  check('unequal deficits make signed difference visible',await result('r.selected.maxShapeDifference>1e-6'));
  check('display explicitly distinguishes effect from percent',await ev("document.getElementById('rx_identifiability_result').textContent.includes('not a percentage')"));
  // Every figure can be exported with its sampled data; inspect actual click handlers.
  await ev("window.__niDownloads=[];window.__niOriginal=rxDownload;rxDownload=(name,text,type)=>window.__niDownloads.push({name,text,type});document.getElementById('rx_identifiability_json').click()");
  check('JSON includes all shared inputs and saved comparison',await ev("(()=>{const x=JSON.parse(__niDownloads[0].text);return x.result.flavourInputs.d3===.0001&&x.result.selected.flavour.d3>.00099&&x.result.ringInputs.fGeV===1000&&x.comparison.parameters.position===.1&&x.result.provenance.dataset.archiveSHA256.length===64;})()"));
  for(let i=0;i<5;i++){
    await change('#rx_identifiability select[aria-label="Figure to save"]',i);
    await ev("document.getElementById('rx_identifiability_svg').click()");
    const data=await ev('__niDownloads.at(-1)');writeFileSync(resolve(out,`figure_${i+1}.svg`),data.text);
    check(`figure ${i+1} actual SVG download is self-contained`,data.type==='image/svg+xml'&&data.text.includes('<metadata>')&&data.text.includes('<desc>')&&!data.text.includes('<script'));
  }
  await ev('rxDownload=__niOriginal');
  check('global result export includes experiment',await ev('PRED_SECTION.texExport().card.researchExtensions.identifiability.result.rows.length===25'));
  await ev("document.getElementById('btnLink').click()");const link=await ev('location.href');
  await send('Page.navigate',{url:link});await pause(700);
  check('permalink restores research and neutrino mode',await ev("RX_STATE.identifiability.axis===8&&RX_STATE.identifiability.position===1&&PRED_S.variant==='neutrino'"));
  for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(100);
    check(`${name} no page overflow`,await ev('document.documentElement.scrollWidth<=innerWidth+2'));
    check(`${name} captions and figures fit their cards`,await ev("[...document.querySelectorAll('#rx_identifiability .ni-figure')].every(f=>f.scrollWidth<=f.clientWidth+2)"));
    await shot('#rx_identifiability',`all_${name}`);
    // Individual figures retain natural resolution for human visual inspection.
    for(let i=0;i<5;i++)await shot('#rx_identifiability .ni-figure',`figure_${i+1}_${name}`,i);
  }
  await control('order',1,'flavour');
  check('shared inverted-ordering control updates reference sign',await result("r.deepcore.order==='IO'&&r.deepcore.dm32EV2<0"));
  check('IO map does not borrow NO confidence contour',await ev("document.getElementById('rx_identifiability_result').textContent.includes('No supplied 90% FC contour for IO')"));
  await control('s23',.1,'flavour');
  check('out-of-grid light inputs withdraw chi-square',await result('!r.deepcore.applicable&&r.deepcore.deltaChi2===null'));
  check('out-of-grid status visible',await ev("document.getElementById('rx_identifiability_result').textContent.includes('Outside the grid')"));
  await control('s23',.47,'flavour');await control('order',0,'flavour');
  for(const k of ['d1','d2','d3'])await control(k,.001,'flavour');
  await control('axis',1);await control('position',1);
  check('invalid sweep point withdraws current-factor plots',await result('r.selected===null&&r.summary.invalid>0'));
  check('invalid point is labelled and not drawn through',await ev("document.getElementById('rx_identifiability_result').textContent.includes('Selected point not evaluated')&&document.querySelectorAll('#rx_identifiability_result svg').length===3"));
  await control('position',2);
  check('invalid control retains valid selection with explicit error',await ev("RX_STATE.identifiability.position===1&&document.getElementById('rx_identifiability_error').textContent.includes('Last valid')"));
  await change('#prModel','builder');check('research hidden in builder mode',await ev("document.getElementById('rx_identifiability').hidden"));
  check('no browser runtime exceptions',!events.some(e=>e.method==='Runtime.exceptionThrown'));
}catch(e){console.error(e);process.exitCode=1;}
finally{
  writeFileSync(resolve(out,'checks.json'),JSON.stringify({app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors:events.filter(e=>e.method==='Runtime.exceptionThrown')},null,2)+'\n');
  console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (neutrino research browser)`);
  if(ws)ws.close();child.kill();
}
