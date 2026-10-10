/* Real-browser regression for literature extensions mounted in existing panels. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/extensions-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=pathToFileURL(app).href,port=9495;
const profile=resolve(root,'.tmp',`extensions-${Date.now()}`);mkdirSync(profile,{recursive:true});
const child=spawn(findChrome(),['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));const checks=[],events=[];let ws;
function check(name,passed){checks.push({name,passed:!!passed});if(!passed)throw Error(name);}
try{
  let target;for(let i=0;i<100;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
  if(!target)throw Error('No isolated browser');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let seq=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else events.push(m);};
  const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);j(Error(`Timeout ${method}`));},60000);pending.set(id,m=>{clearTimeout(timer);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
  const navigate=async(section,id)=>{await send('Page.navigate',{url:url+'#s='+section});for(let i=0;i<200;i++){if(await ev(`!!document.getElementById(${JSON.stringify(id)})`))return;await pause(100);}throw Error('Panel failed to mount: '+id);};
  const change=async(selector,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('papers','rx_su6mn_result');
  check('SU6 has finite potential figure',await ev(`!!document.querySelector('#rx_su6mn_result svg')&&!/NaN|Infinity/.test(document.getElementById('rx_su6mn_result').innerHTML)`));
  const first=await ev(`mnModel(RX_STATE.su6mn).minimum.alpha`);
  await change('#rx_su6mn_controls [data-rx="windings"]',10);
  check('Fourier control resolves published discrepancy',Math.abs((await ev('mnModel(RX_STATE.su6mn).minimum.alpha'))-.0305813974984)<1e-10&&first>.0326);
  await change('#rx_su6mn_controls [data-rx="k3"]',4);
  check('invalid content retains valid result',await ev(`RX_STATE.su6mn.k3===3&&document.getElementById('rx_su6mn_error').textContent.includes('Last valid')`));
  await change('#rx_su6mn_controls [data-rx="k3"]',2);
  check('SU6 change updates summary',await ev(`RX_STATE.su6mn.k3===2&&document.getElementById('rx_su6mn_result').textContent.includes('no stored')`));
  await ev(`document.getElementById('btnLink').click()`);const saved=await ev('location.href');
  await send('Page.navigate',{url:saved});await pause(500);
  check('SU6 permalink restores inputs',await ev(`RX_STATE.su6mn.k3===2&&RX_STATE.su6mn.windings===10`));
  check('SU6 global export contains extension',await ev(`PAP_SECTION.texExport().card.researchExtensions.su6mn.result.spectators.rightHandedSinglets===3`));
  await ev(`document.getElementById('rx_su6mn_load').click()`);
  check('SU6 transfers existing builder state',await ev(`SUN5D_S.blocks.nPP===3&&SUN5D_S.bulk['sym|-1|dirac']===2&&SUN5D_S.bulk['anti|-1|dirac']===1`));
  await navigate('blkt','rx_rsrunning_result');
  const c1=await ev('ruModel(RX_STATE.rsrunning).requiredDeltaLambda');
  await change('#rx_rsrunning_controls [data-rx="content"]',2);
  check('C2 changes differential running',JSON.stringify(c1)!==JSON.stringify(await ev('ruModel(RX_STATE.rsrunning).requiredDeltaLambda')));
  check('RS assumptions visible',await ev(`document.getElementById('rx_rsrunning_result').textContent.includes('finite IR thresholds')`));
  await navigate('predict','prModel');await change('#prModel','neutrino');
  const weak=await ev('ndModel(nrModel(NR_S),ND_S).selected.widthEV');
  await ev(`(()=>{const e=document.getElementById('ndMajoron');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  check('Majoron changes lifetime through real checkbox',(await ev('ndModel(nrModel(NR_S),ND_S).selected.widthEV'))>weak);
  check('computed Majoron status visible',await ev(`document.getElementById('ndMajoronSummary').textContent.includes('Included')`));
  await change('#ndPair',5);
  check('overlapping pair diagnostic visible',await ev(`document.getElementById('ndValidity').textContent.includes('multi-state')`));
  await change('#ndSigma',2);
  await ev(`document.getElementById('btnLink').click()`);const decayLink=await ev('location.href');
  await send('Page.navigate',{url:decayLink});await pause(500);
  check('Majoron state round trip',await ev('ND_S.majoron===1&&ND_S.sigmaOverF===2&&ND_S.pair===5'));
  check('flavour research question visible',await ev(`document.getElementById('rx_flavour_result').textContent.includes('What this tests')`));
  await ev(`document.querySelector('#rx_flavour [data-pin]').click()`);
  await change('#rx_flavour_controls [data-rx="lightEV"]',.02);
  check('pinned comparison survives a changed point',await ev(`RX_BASELINES.flavour.parameters.lightEV===.001&&document.getElementById('rx_flavour_result').textContent.includes('Δ ')`));
  await change('#rx_flavour_controls [data-rx="order"]',1);
  check('inverted ordering changes masses',await ev(`nfModel(RX_STATE.flavour,NR_S).massesEV[2]===.02`));
  await ev(`document.getElementById('btnLink').click()`);const flavourLink=await ev('location.href');
  await send('Page.navigate',{url:flavourLink});await pause(600);
  check('flavour and Majoron permalink coexist',await ev(`RX_STATE.flavour.order===1&&RX_STATE.flavour.lightEV===.02&&ND_S.majoron===1`));
  check('flavour result exported',await ev(`PRED_SECTION.texExport().card.researchExtensions.flavour.result.copies.length===3`));
  await change('#prModel','builder');
  check('thermal reference has real nucleation',await ev(`rxExternal(TH_PANEL,RX_STATE.thermal).nucleation.temperatureGeV>92`));
  check('flavour hidden for builder',await ev(`document.getElementById('rx_flavour').hidden`));
  await change('#rx_thermal_controls [data-rx="g4"]',2);
  check('thermal external result invalidated on input change',await ev(`rxExternal(TH_PANEL,RX_STATE.thermal)===null&&document.getElementById('rx_thermal_result').textContent.includes('pending')`));
  await ev(`document.querySelector('#rx_thermal [data-default]').click()`);
  check('thermal reference restored',await ev(`document.getElementById('rx_thermal_result').textContent.includes('92.88698')`));
  await navigate('anomalies','rx_rsanomaly_result');
  await change('#rx_rsanomaly_controls [data-rx="leptonGen"]',0);
  check('anomaly imbalance appears in reading',await ev(`document.getElementById('rx_rsanomaly_result').textContent.includes('needs completion')`));
  await navigate('collider','rx_higgstools_result');
  check('matching actual HiggsSignals visible',await ev(`document.getElementById('rx_higgstools_result').textContent.includes('159 observables')`));
  await change('#rx_higgstools_controls [data-rx="invWidthMeV"]',1);
  check('Higgs width changes, experimental result invalidated',await ev(`htModel(RX_STATE.higgstools).branching.directInv>.19&&rxExternal(HT_PANEL,RX_STATE.higgstools)===null`));
  const validation=JSON.parse(readFileSync(resolve(root,'data/higgstools_validation.json')));
  await ev(`RX_STATE.higgstools=${JSON.stringify(validation.parameters)};RX_EXTERNAL.higgstools=${JSON.stringify(validation)};`);
  await ev(`document.querySelector('#rx_higgstools [data-pin]').click()`);
  check('imported matching HiggsTools result accepted',await ev(`rxExternal(HT_PANEL,RX_STATE.higgstools).signals.deltaChisq>170`));
  check('corrupt external result rejected',await ev(`(()=>{const b=structuredClone(RX_EXTERNAL.higgstools);b.predictions.widthGeV*=2;return !rxMatchExternal('higgstools',RX_STATE.higgstools,b);})()`));
  if(process.argv.includes('--backend')){
    await change('#rx_higgstools_controls [data-rx="kg"]',.94);
    await ev(`document.querySelector('#rx_higgstools [data-run]').click()`);
    for(let i=0;i<120;i++){if(await ev(`!document.querySelector('#rx_higgstools [data-run]').disabled`))break;await pause(500);}
    check('real browser button obtains matching HiggsTools result',await ev(`!!rxExternal(HT_PANEL,RX_STATE.higgstools)&&RX_EXTERNAL.higgstools.parameters.kg===.94`));
  }
  /* First KK gluon at the LHC (kk_gluon_lhc.mjs): mounted in Collider, finite figures, live recomputation, the published
   * RS point at the ATLAS edge, honest wording, and cross-links that land on their sections. */
  await navigate('collider','rx_kkgluon_result');
  check('KK gluon card has two finite figures',await ev(`document.querySelectorAll('#rx_kkgluon_result svg').length>=2&&!/NaN|Infinity/.test(document.getElementById('rx_kkgluon_result').innerHTML)`));
  const kkFirst=await ev(`kkgModel(RX_STATE.kkgluon).here.GoverM`);
  await change('#rx_kkgluon_controls [data-rx="cTR"]',.5);
  check('raising c(t_R) widens the warped KK gluon',await ev(`kkgModel(RX_STATE.kkgluon).here.GoverM>${kkFirst}`));
  await ev(`[...document.querySelectorAll('#rx_kkgluon button')].find(b=>b.textContent.includes('Published RS point')).click()`);await pause(300);
  check('published RS point is at the ATLAS edge',await ev(`(()=>{const r=kkgModel(RX_STATE.kkgluon).values.r_tt_observed.value;return r>.85&&r<1.25;})()`));
  check('card says comparison, not validated exclusion',await ev(`document.getElementById('rx_kkgluon_result').textContent.includes('not a validated exclusion')`));
  check('KK gluon card shows the m(tt̄) spectrum figures (four finite plots)',await ev(`document.querySelectorAll('#rx_kkgluon_result svg').length>=4&&!/NaN|Infinity/.test(document.getElementById('rx_kkgluon_result').innerHTML)`));
  check('published RS point: interference constructive below the pole, Δχ² labelled a sensitivity',await ev(`(()=>{const t=document.getElementById('rx_kkgluon_result').textContent;return t.includes('below the pole is constructive')&&t.includes('a sensitivity, not an exclusion');})()`));
  check('the spectrum links to the CMS measurement and its covariance',await ev(`['hepdata.102956.v1/t37','hepdata.102956.v1/t38'].every(d=>document.querySelector('#rx_kkgluon a[href*="'+d+'"]'))`));
  await change('#rx_kkgluon_controls [data-rx="ttTheory"]',0);
  check('ttTheory = 0 gives the experimental-only Δχ²',await ev(`(()=>{const v=kkgModel(RX_STATE.kkgluon).values;return Math.abs(v.tt_spectrum_dchi2.value-v.tt_spectrum_dchi2_experimental.value)<1e-9;})()`));
  /* 🎬 guided simulation (card_demo.js): real clicks, a step banner, a closing explanation, and a link that starts it */
  check('the KK gluon card has a 🎬 Demo button',await ev(`!!document.querySelector('#rx_kkgluon h2 .cdm-btn')`));
  await ev(`(()=>{CDM_URL.speed=0.03;CDM_URL.lang='en';document.querySelector('#rx_kkgluon h2 .cdm-btn').click();})()`);
  for(let i=0;i<300&&!(await ev(`!!document.getElementById('cdm_explain')&&!CDM_STATE.running`));i++)await pause(100);
  check('the demo runs to its explanation panel through the real controls',await ev(`(()=>{const s=RX_STATE.kkgluon;return !!document.getElementById('cdm_explain')&&s.realisation===0&&s.MTeV===4.5&&s.ttTheory===0&&document.getElementById('cdm_explain').textContent.includes('How to read this card');})()`));
  check('the demo banner says it is done and can be closed',await ev(`(()=>{const b=document.getElementById('cdm_banner');return !!b&&b.textContent.includes('Done')&&!!b.querySelector('button');})()`));
  await ev(`document.querySelector('#cdm_banner button').click()`);
  check('closing the banner removes it and its highlights',await ev(`!document.getElementById('cdm_banner')&&!document.querySelector('.cdm-hl')`));
  await send('Page.navigate',{url:'about:blank'});await send('Page.navigate',{url:url+'#s=collider&demo=kkgluon&lang=es&demoSpeed=0.03'});
  for(let i=0;i<400&&!(await ev(`!!document.getElementById('cdm_explain')`));i++)await pause(100);
  check('a link with demo=kkgluon starts the demo by itself, in Spanish with lang=es',await ev(`!!document.getElementById('cdm_explain')&&document.getElementById('cdm_explain').textContent.includes('Cómo leer esta tarjeta')`));
  await navigate('collider','rx_kkgluon_result');await pause(300);
  check('the live independent-reference certificate holds in the page',await ev(`(()=>{const w=kkgModel(RX_STATE.kkgluon).certificates.tt_spectrum_reference.witness;return w.partonic<1e-9&&w.gg<1e-6&&w.sm<1e-3&&w.octet<1e-4;})()`));
  check('cross-links point to their sections',await ev(`(()=>{const hs=[...document.querySelectorAll('#rx_kkgluon_result a[href^="#s="]')].map(a=>a.getAttribute('href'));return ['#s=collider','#s=anomalies','#s=blkt','#s=predict'].every(h=>hs.includes(h));})()`));
  check('the dijet panel links to the KK gluon card',await ev(`(()=>{const a=document.querySelector('a[href="#rx_kkgluon"]');if(!a)return false;window.scrollTo(0,0);a.click();return true;})()`));
  await pause(800);
  check('the link brings the card into view',await ev(`(()=>{const r=document.getElementById('rx_kkgluon').getBoundingClientRect();return r.top<window.innerHeight&&r.bottom>0;})()`));
  await ev(`document.querySelector('#rx_kkgluon_result a[href="#s=anomalies"]').click()`);
  for(let i=0;i<100;i++){if(await ev(`!!document.getElementById('rx_rsanomaly_result')`))break;await pause(100);}
  check('the RS anomaly link opens the RS anomaly card',await ev(`!!document.getElementById('rx_rsanomaly_result')`));
  await navigate('screen','scComb');
  const combInk=()=>ev(`(()=>{const c=document.getElementById('scComb'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<240||d[i+1]<240||d[i+2]<240)n++;return n;})()`);
  check('published seed comb drawn',await combInk()>1000);
  await send('Page.navigate',{url:url+'#s=screen&su7_km25.seed=candidate'});await pause(500);
  check('candidate seed comb no longer blank',await combInk()>1000);
  check('candidate bounds do not establish attainability',await ev(`document.getElementById('scHits').textContent.includes('not proof of an attainable mass')`));
  check('candidate spacing uses its own even-rung certificates',await ev(`document.getElementById('scSpacing').rows.length===10&&SECTIONS.find(s=>s.id==='screen')._lastEvidence.rows.every(r=>r.k8D%2===0&&r.upperGeV!==null)`));
  await change('#sci_MKK',1000);
  check('low candidate masses have a valid conditional screen',await ev(`SECTIONS.find(s=>s.id==='screen')._lastEvidence.valid&&document.getElementById('scHits').textContent.includes('not a theory exclusion')`));
  await change('#sci_MKK',-1);
  check('invalid candidate explains why no calculation',await ev(`document.getElementById('scHits').textContent.includes('Input needs correction')`));
  for(const seed of ['published','candidate']){
    await send('Page.navigate',{url:url+'#s=census&su7_km25.seed='+seed});
    await pause(600);
    for(let i=0;i<120;i++){if(await ev(`typeof CEN_C!=='undefined'&&!!CEN_C&&CEN_SEED==='${seed}'&&document.getElementById('cnGo')?.disabled===false`))break;await pause(100);}
    check(`${seed} census draws automatically without a build click`,await ev(`(()=>{const c=document.getElementById('cnCurve'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=0;i<d.length;i+=4)if(d[i+3]&&(d[i]<240||d[i+1]<240||d[i+2]<240))ink++;return ink>1000&&document.getElementById('cnCurveNote').textContent.includes('Click the plot');})()`));
    check(`${seed} census has no invalid numerical output`,await ev(`!/NaN|Infinity/.test(document.getElementById('section').textContent)&&CEN_S.rec.failures===0&&CEN_S.rec.tested>1000`));
    if(seed==='candidate'){
      check('candidate census does not transfer published fibre',await ev(`document.getElementById('cnFibre').textContent.includes('other seed')&&document.getElementById('cnClasses').rows.length===0`));
      await ev(`(()=>{const e=document.getElementById('cnWide');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause(500);
      check('candidate extended range rebuilds automatically',await ev(`CEN_C.tMax===900&&!document.getElementById('cnGo').disabled&&document.getElementById('cnCurveNote').textContent.includes('half-integral')`));
    }
  }
  for(const [section,id] of [['papers','rx_su6mn'],['blkt','rx_rsrunning'],['predict','ndCard'],['predict','rx_flavour'],['predict','rx_thermal'],['anomalies','rx_rsanomaly'],['collider','rx_higgstools'],['collider','rx_kkgluon']]){
    await navigate(section,id);if(section==='predict')await change('#prModel','neutrino');
    if(id==='rx_thermal')await change('#prModel','builder');
    for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(150);
      check(`${id} ${name} no page overflow`,await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
      await ev(`document.getElementById('${id}').scrollIntoView()`);
      const rect=await ev(`(()=>{const b=document.getElementById('${id}').getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height,scale:1};})()`);
      const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:rect});writeFileSync(resolve(out,`${id}_${name}.png`),Buffer.from(shot.data,'base64'));
    }
  }
  check('no browser runtime errors',!events.some(e=>e.method==='Runtime.exceptionThrown'));
} catch(e){console.error(e);process.exitCode=1;}
finally{
  writeFileSync(resolve(out,'checks.json'),JSON.stringify({app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors:events.filter(e=>e.method==='Runtime.exceptionThrown')},null,2)+'\n');
  console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (extensions browser)`);
  if(ws)ws.close();child.kill();
}
