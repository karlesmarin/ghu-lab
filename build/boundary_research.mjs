/* Real-browser regression for literature extensions mounted in existing panels. */
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),out=resolve(root,'.tmp/boundary-browser');
mkdirSync(out,{recursive:true});
const app=resolve(root,'app/index.html'),url=pathToFileURL(app).href,port=9497;
const profile=resolve(root,'.tmp',`boundary-${Date.now()}`);mkdirSync(profile,{recursive:true});
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

  await navigate('anomalies','rx_boundaryresearch_result');
  const set=async(key,value)=>change('#rx_boundaryresearch_controls [data-rx="'+key+'"]',value);
  const value=()=>ev('brxModel(RX_STATE.boundaryresearch)');
  check('four distinct diagnoses and three figures',await ev(`document.querySelectorAll('#rx_boundaryresearch_result svg').length===3&&document.getElementById('rx_boundaryresearch_result').textContent.includes('Full anomaly cancellation: unknown')`));
  await set('strength',0);check('uncoupled normal zero root',(await value()).roots[0].kR===0);
  await set('strength',1);check('coupling opens normal gap',Math.abs((await value()).roots[0].kR-.273852686800851)<1e-12);
  await set('profileMass',0);check('rank two for massless example',(await value()).gram.rank===2);
  await set('profileMass',1);check('rank three for massive example',(await value()).gram.rank===3);
  const moments=(await value()).moments;await set('insertion',991);check('parity changes exact moments',JSON.stringify(moments)!==JSON.stringify((await value()).moments));
  await set('generations',1);check('one family fails restricted condition',!(await value()).family.passes);
  await set('generations',3);check('three families pass only restricted condition',(await value()).family.passes&&(await value()).values.fullAnomalyCancellation.status==='unknown');
  await set('strength',-1);check('invalid input preserves last valid state',await ev(`RX_STATE.boundaryresearch.strength===1&&document.getElementById('rx_boundaryresearch_error').textContent.includes('Last valid')`));
  await set('strength',1);
  await ev(`document.querySelector('#rx_boundaryresearch [data-pin]').click()`);await set('strength',2);
  check('comparison retains prior inputs',await ev(`RX_BASELINES.boundaryresearch.parameters.strength===1`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-clear]').click()`);
  await ev(`document.querySelector('[data-brx-map]').scrollIntoView({block:'center'})`);
  const screen=await ev(`(()=>{const s=document.querySelector('[data-brx-map]'),p=s.createSVGPoint();p.x=90+460*.75;p.y=280-215*.5;const q=p.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y};})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...screen});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...screen});
  check('2D selection updates physical inputs',Math.abs((await value()).parameters.strength-3)<1e-5&&Math.abs((await value()).parameters.theta-Math.PI/2)<1e-5);
  await ev(`document.querySelector('[data-brx-map]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  check('keyboard graph selection increments coupling',(await value()).parameters.strength>3.1);
  await set('viewMode',1);await set('viewAngle',65);
  check('3D renders finite sampled geometry',await ev(`document.querySelector('[data-brx-map]').getAttribute('aria-label').includes('3D')&&!/NaN|Infinity/.test(document.querySelector('[data-brx-map]').outerHTML)`));
  await ev(`document.querySelector('[data-brx-map]').scrollIntoView({block:'center'})`);
  const screen3=await ev(`(()=>{const r=brxModel(RX_STATE.boundaryresearch),g=r.landscape,s=document.querySelector('[data-brx-map]'),xy=brxProject(1,.5,g.masses[g.steps][g.steps/2],r.parameters.viewAngle),p=s.createSVGPoint();p.x=xy[0];p.y=xy[1];const q=p.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y};})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...screen3});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...screen3});
  check('3D node selection updates numeric inputs',Math.abs((await value()).parameters.strength-4)<1e-5&&Math.abs((await value()).parameters.theta-Math.PI/2)<1e-5);
  await ev(`document.getElementById('btnLink').click()`);const saved=await ev('location.href');
  await send('Page.navigate',{url:saved});await pause(600);
  check('saved link restores view and physics',await ev(`RX_STATE.boundaryresearch.viewMode===1&&RX_STATE.boundaryresearch.viewAngle===65&&RX_STATE.boundaryresearch.strength===4`));
  await ev(`globalThis.brxDownloads=[];globalThis.brxSavedDownload=rxDownload;rxDownload=(...x)=>brxDownloads.push(x);document.getElementById('rx_boundaryresearch_json').click();`);
  check('JSON download includes provenance and unknown status',await ev(`(()=>{const d=JSON.parse(brxDownloads[0][1]);return d.result.sources.length===4&&d.result.values.fullAnomalyCancellation.status==='unknown'&&d.parameters.viewAngle===65;})()`));
  await ev(`document.querySelector('#rx_boundaryresearch select[aria-label="Figure to save"]').value=0;document.getElementById('rx_boundaryresearch_svg').click();rxDownload=brxSavedDownload;`);
  check('SVG download preserves plotted grid',await ev(`brxDownloads[1][1].includes('colour')||brxDownloads[1][1].includes('colorRange')`));
  const languageState=JSON.stringify(await value());
  const metadata=await ev(`document.querySelector('#rx_boundaryresearch svg metadata').textContent`);
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="es"]').click()`);
  check('Spanish controls, results and graph labels agree',await ev(`(()=>{const c=document.getElementById('rx_boundaryresearch'),t=c.textContent;return c.lang==='es'&&t.includes('Acoplamiento de frontera')&&t.includes('Primera raíz normal')&&t.includes('Cancelación completa de anomalías: desconocida.')&&c.querySelector('svg').getAttribute('aria-label').includes('Superficie 3D')&&!/What this tests|First normal root|Sources:|Numerical details|independent directions|First paired|Half-doublet/.test(t);})()`));
  check('language switch preserves numerical result and SVG metadata',JSON.stringify(await value())===languageState&&await ev(`document.querySelector('#rx_boundaryresearch svg metadata').textContent`)===metadata);
  await set('strength',-1);
  check('invalid input is explained in Spanish without changing state',await ev(`document.getElementById('rx_boundaryresearch_error').textContent.includes('Se conservan los últimos resultados válidos')&&RX_STATE.boundaryresearch.strength===4`));
  await set('strength',4);
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="en"]').click()`);
  check('English can be restored exactly without losing inputs',await ev(`document.getElementById('rx_boundaryresearch_result').textContent.includes('First normal root')&&!document.getElementById('rx_boundaryresearch_result').textContent.includes('Primera raíz normal')&&RX_STATE.boundaryresearch.strength===4`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="es"]').click()`);
  for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(150);
    check(name+' no page overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
    for(const mode of [0,1]){
      await set('viewMode',mode);await ev(`document.getElementById('brx_landscape').scrollIntoView({block:'center'})`);
      const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,`${name}_${mode}d.png`),Buffer.from(shot.data,'base64'));
    }
  }
  await send('Page.navigate',{url:'about:blank'});
  await send('Page.navigate',{url:url+'#s=anomalies&demo=boundaryresearch&lang=es&demoSpeed=0.01'});
  for(let i=0;i<600;i++){if(await ev(`typeof CDM_STATE!=='undefined'&&(CDM_STATE.lastFinished==='boundaryresearch'||CDM_STATE.lastError)`))break;await pause(100);}
  const spanishDemo=await ev(`({state:CDM_STATE,language:GUIDE_LANGUAGE,result:document.getElementById('rx_boundaryresearch_result').textContent.includes('Cancelación completa de anomalías: desconocida.'),close:document.getElementById('cdm_explain')?.textContent.slice(0,220)})`);
  if(spanishDemo.state.lastFinished!=='boundaryresearch'||spanishDemo.state.lastError||!spanishDemo.result)console.error(JSON.stringify(spanishDemo));
  check('direct Spanish demo completes with Spanish results',spanishDemo.state.lastFinished==='boundaryresearch'&&!spanishDemo.state.lastError&&spanishDemo.language==='es'&&spanishDemo.result&&!!spanishDemo.close);
  check('Spanish demo reaches the restored finite stratum and explains its limit',await ev(`RX_STATE.boundaryresearch.neutralBranch===1&&brxModel(RX_STATE.boundaryresearch).neutralComplex.quotient===1&&document.getElementById('cdm_explain').textContent.includes('masa del Higgs')`));
  await send('Page.navigate',{url:'about:blank'});
  await send('Page.navigate',{url:url+'#s=anomalies&demo=boundaryresearch&lang=en&demoSpeed=0.01'});
  for(let i=0;i<600;i++){if(await ev(`typeof CDM_STATE!=='undefined'&&(CDM_STATE.lastFinished==='boundaryresearch'||CDM_STATE.lastError)`))break;await pause(100);}
  check('English demo reaches section six and completes with its finite scope',await ev(`CDM_STATE.lastFinished==='boundaryresearch'&&!CDM_STATE.lastError&&GUIDE_LANGUAGE==='en'&&RX_STATE.boundaryresearch.neutralBranch===1&&document.getElementById('cdm_explain').textContent.includes('Higgs mass')`));

  // Only replayed certificates are selectable; no unverified computation path.
  await send('Page.navigate',{url:'about:blank'});
  await navigate('anomalies','gmr_panel');
  await ev(`document.getElementById('gmr_panel').open=true`);
  check('certified reference separated',await ev(`gmrCurrent().result.status==='separated_conditional'&&document.querySelector('[data-gmr-result]').textContent.includes('0.000260')`));
  check('uncertified inputs and imports absent',await ev(`!document.querySelector('[data-gmr-input],[data-gmr-run],[data-gmr-import]')`));
  await set('matchedProbe',1);
  check('second certified query selectable',await ev(`gmrCurrent().parameters.t==='1/2'&&gmrCurrent().result.status==='separated_conditional'`));
  await ev(`globalThis.gmrDownloads=[];globalThis.gmrSavedDownload=rxDownload;rxDownload=(...args)=>gmrDownloads.push(args);document.querySelector('[data-gmr-export]').click();document.querySelector('[data-gmr-certificate]').click();rxDownload=gmrSavedDownload;`);
  check('result links exact certificate',await ev(`JSON.parse(gmrDownloads[0][1]).certificate.sha256===GMR_CERTIFICATE.sha256`));
  check('certificate downloads as ZIP',await ev(`gmrDownloads[1][0].endsWith('.zip')&&gmrDownloads[1][1][0]===80&&gmrDownloads[1][1][1]===75&&gmrDownloads[1][2]==='application/zip'`));
  await ev(`document.getElementById('btnLink').click()`);const matchedLink=await ev('location.href');
  await send('Page.navigate',{url:matchedLink});await pause(500);
  check('saved link restores certified query',await ev(`RX_STATE.boundaryresearch.matchedProbe===1&&gmrCurrent().parameters.t==='1/2'`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="es"]').click()`);
  check('certification scope translates into Spanish',await ev(`document.getElementById('gmr_panel').textContent.includes('¿Siguen distinguiéndose')&&document.getElementById('gmr_panel').textContent.includes('Demostración escrita')`));
  await ev(`document.getElementById('gmr_panel').open=true;document.getElementById('gmr_panel').scrollIntoView({block:'start'})`);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(100);
  check('certificate panel no mobile overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
  writeFileSync(resolve(out,'matched_profiles_mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);
  writeFileSync(resolve(out,'matched_profiles_desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));

  await set('neutralBranch',1);
  check('exact restored stratum displays one quotient class',await ev(`RX_STATE.boundaryresearch.neutralBranch===1&&brxModel(RX_STATE.boundaryresearch).neutralComplex.quotient===1&&document.getElementById('ncx_panel').textContent.includes('queda una clase')`));
  await set('theta',0.00000000000001);
  check('numeric Wilson changes do not alter exact stratum',await ev(`brxModel(RX_STATE.boundaryresearch).neutralComplex.quotient===1`));
  await ev(`globalThis.ncxDownloads=[];globalThis.ncxSavedDownload=rxDownload;rxDownload=(...args)=>ncxDownloads.push(args);document.querySelector('[data-ncx-export]').click();document.querySelector('[data-ncx-certificate]').click();rxDownload=ncxSavedDownload;`);
  check('finite result and certificate downloads agree',await ev(`JSON.parse(ncxDownloads[0][1]).certificateSha256===NCX_REFERENCE.sha256&&JSON.parse(ncxDownloads[0][1]).quotient===1&&ncxDownloads[1][1][0]===80&&ncxDownloads[1][1][1]===75`));
  await ev(`document.getElementById('btnLink').click()`);const neutralLink=await ev('location.href');
  await send('Page.navigate',{url:neutralLink});await pause(500);
  check('saved link restores exact stratum',await ev(`RX_STATE.boundaryresearch.neutralBranch===1&&brxModel(RX_STATE.boundaryresearch).neutralComplex.quotient===1`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="en"]').click()`);
  check('finite scope and control restore English',await ev(`document.getElementById('ncx_panel').textContent.includes('one closed class remains')&&document.querySelector('[data-rx="neutralBranch"]').textContent.includes('Restored')`));
  await set('neutralBranch',0);
  check('generic stratum displays exact zero quotient',await ev(`brxModel(RX_STATE.boundaryresearch).neutralComplex.quotient===0&&document.getElementById('ncx_panel').textContent.includes('all five closed directions are gauge')`));
  await set('neutralBranch',1);
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="es"]').click()`);
  for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await ev(`document.getElementById('ncx_panel').scrollIntoView({block:'start'})`);await pause(100);
    check('finite panel '+name+' has no page overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
    writeFileSync(resolve(out,'neutral_'+name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  for(const [point,theta] of [[0,'1/10'],[1,'1/5'],[2,'1/4']]){
    await set('neutralPoint',point);
    check('continuous query '+theta,(await value()).neutralIsolation.theta===theta);
    check('continuous enclosure rendered '+theta,await ev(`document.getElementById('zis_panel').textContent.includes(${JSON.stringify(theta)})&&document.getElementById('zis_panel').textContent.includes('sin certificar')`));
  }
  await set('theta',0);await set('strength',0);
  check('unrelated controls cannot change certified model',(await value()).neutralIsolation.theta==='1/4'&&(await value()).neutralIsolation.model.muOmega==='1');
  await ev(`window.zisDownloads=[];rxDownload=(...args)=>zisDownloads.push(args);document.querySelector('[data-zis-export]').click();document.querySelector('[data-zis-certificate]').click()`);
  check('continuous result and proof downloaded',await ev(`JSON.parse(zisDownloads[0][1]).theta==='1/4'&&JSON.parse(zisDownloads[0][1]).derivative_status==='not_certified'&&zisDownloads[1][1][0]===80&&zisDownloads[1][1][1]===75`));
  await ev(`document.getElementById('btnLink').click()`);const zisLink=await ev('location.href');
  await send('Page.navigate',{url:zisLink});await pause(500);
  check('link restores neutral query',await ev(`RX_STATE.boundaryresearch.neutralPoint===2&&brxModel(RX_STATE.boundaryresearch).neutralIsolation.lambda_lower==='1/28'`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="en"]').click()`);
  check('continuous scope restores English',await ev(`document.getElementById('zis_panel').textContent.includes('not certified')&&document.querySelector('[data-rx="neutralPoint"]').value==='2'`));
  await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="es"]').click()`);
  for(const [name,width,height,mobile] of [['desktop',1380,1000,false],['mobile',390,844,true]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await ev(`document.getElementById('zis_panel').scrollIntoView({block:'start'})`);await pause(100);
    check('continuous panel '+name+' has no page overflow',await ev('document.documentElement.scrollWidth<=window.innerWidth+2'));
    writeFileSync(resolve(out,'z_isolation_'+name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  if(process.argv.includes('--capture-video')){
    const target=resolve(root,'tools/neutral_video/captures');mkdirSync(target,{recursive:true});const provenance=[];
    await send('Emulation.setDeviceMetricsOverride',{width:1380,height:1800,deviceScaleFactor:1,mobile:false});
    for(const lang of ['en','es']){
      await ev(`document.querySelector('#rx_boundaryresearch [data-guide-set-language="${lang}"]').click()`);
      for(const [id,panel,key,v] of [['finite','ncx_panel','neutralBranch',0],['restored','ncx_panel','neutralBranch',1],['central','zis_panel','neutralPoint',1],['angle','zis_panel','neutralPoint',2],['proof','zis_panel','neutralPoint',1],['limits','zis_panel','neutralPoint',1]]){
        await set(key,v);await pause(600);await ev(`document.getElementById('${panel}').scrollIntoView({block:'start'})`);
        await ev(`document.querySelector('#${panel} table').closest('details').open=true`);await pause(250);
        check(lang+' '+id+' table visible',await ev(`document.querySelector('#${panel} table').closest('details').open&&document.querySelector('#${panel} table').getBoundingClientRect().height>50`));
        const clip=await ev(`(()=>{const b=document.getElementById('${panel}').getBoundingClientRect();return {x:b.x+scrollX,y:Math.max(0,b.y+scrollY-22),width:b.width,height:b.height+44,scale:1};})()`);
        const raw=Buffer.from((await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:false})).data,'base64');
        writeFileSync(resolve(target,lang+'-'+id+'-card.png'),raw);
        provenance.push({language:lang,id,panel,inputs:await ev('RX_STATE.boundaryresearch'),result:await value(),sha256:createHash('sha256').update(raw).digest('hex')});
      }
    }
    writeFileSync(resolve(target,'provenance.json'),JSON.stringify({app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),captures:provenance},null,2)+'\n');
  }
  check('no runtime errors',!events.some(e=>e.method==='Runtime.exceptionThrown'));
} catch(e){console.error(e);process.exitCode=1;}
finally{
  writeFileSync(resolve(out,'checks.json'),JSON.stringify({app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),checks,errors:events.filter(e=>e.method==='Runtime.exceptionThrown')},null,2)+'\n');
  console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (boundary research browser)`);
  if(ws)ws.close();child.kill();
}
