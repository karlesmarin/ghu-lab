/* Test the shipped narrated supplement, captions, seeking and demo links over local HTTP. */
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),site=resolve(root,'site'),out=resolve(root,'.tmp/quantization-site');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.mp4':'video/mp4','.png':'image/png','.vtt':'text/vtt; charset=utf-8','.json':'application/json'};
const server=createServer((req,res)=>{
 if(req.url.endsWith('.html'))console.log('HTTP page',req.url);
 try{const p=resolve(site,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(site+'/')&&!p.startsWith(site+'\\'))throw Error('Outside site');
 const data=readFileSync(p),range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 res.setHeader('Content-Type',mime[extname(p)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));}
 else{res.writeHead(200,{'Content-Length':data.length});res.end(data);}
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
console.log('Checking served site at',base);
const browser=spawn(findChrome(),['--headless=new','--no-proxy-server','--remote-debugging-port=9518',`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let ws;
function ck(name,value){checks.push({name,passed:!!value});if(!value)throw Error(name);}
try{
 let tab;for(let i=0;i<100;i++){try{tab=(await(await fetch('http://127.0.0.1:9518/json/list')).json()).find(x=>x.type==='page');if(tab)break;}catch{}await pause(100);}
 if(!tab)throw Error('No browser');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method+' timed out')),45000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'JS error');return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');
 const manifest=JSON.parse(readFileSync(resolve(site,'video/quantization/manifest.json')));
 for(const report of manifest.reports){
  const lang=report.language;await send('Page.navigate',{url:base+'/video/quantization/index'+(lang==='es'?'-es':'')+'.html'});
  let ready=false;for(let i=0;i<100;i++){ready=await ev(`!!document.getElementById('film')&&document.getElementById('film').readyState>=1`);if(ready)break;await pause(100);}
  ck(lang+' video metadata and duration',ready&&await ev(`Math.abs(document.getElementById('film').duration-${report.duration_seconds})<.2`));
  ck(lang+' document language and chapter count',await ev(`document.documentElement.lang==='${lang}'&&document.querySelectorAll('[data-start]').length===${report.chapters}`));
  await ev(`document.getElementById('film').textTracks[0].mode='hidden'`);
  let cues=0;for(let i=0;i<50;i++){cues=await ev(`document.getElementById('film').textTracks[0].cues?.length||0`);if(cues)break;await pause(100);}
  ck(lang+' VTT captions loaded',cues===report.caption_cues);
  await ev(`document.querySelectorAll('[data-start]')[5].click()`);await pause(650);
  ck(lang+' chapter seeking and actual playback',await ev(`(()=>{const v=document.getElementById('film'),t=Number(document.querySelectorAll('[data-start]')[5].dataset.start);return !v.paused&&v.currentTime>=t&&v.currentTime<t+4;})()`));
  await ev(`document.getElementById('film').pause()`);
  const demo=await ev(`document.querySelector('a[href*="demo=quantization"]').href`);
  await send('Page.navigate',{url:demo+'&demoSpeed=.01'});
  let finished=false;for(let i=0;i<200;i++){finished=await ev(`typeof CDM_STATE!=='undefined'&&CDM_STATE.lastFinished==='quantization'&&!CDM_STATE.running`);if(finished)break;await pause(100);}
  ck(lang+' shipped Demo link auto-starts and completes',finished&&await ev(`CDM_STATE.autostarted&&!CDM_STATE.lastError&&GUIDE_LANGUAGE==='${lang}'`));
 }
 const revision=JSON.parse(readFileSync(resolve(root,'media/video/current.json'))).directory;
 const main=JSON.parse(readFileSync(resolve(root,'media/video',revision,'manifest.json')));
 for(const lang of ['en','es']){
  const ch=JSON.parse(readFileSync(resolve(root,'media/video',revision,'chapters-'+lang+'.json'))).at(-1);
  await send('Page.navigate',{url:base+'/video/index.html?lang='+lang+'#quantization'});
  let ready=false;for(let i=0;i<150;i++){ready=await ev(`document.documentElement.lang==='${lang}'&&document.getElementById('guideVideo')?.readyState>=1&&document.getElementById('chapterNow')?.textContent.startsWith('46')&&Math.abs(document.getElementById('guideVideo').currentTime-${ch.start})<1`);if(ready)break;await pause(100);}
  if(!ready)console.log('Primary player state',await ev(`(()=>{const v=document.getElementById('guideVideo');return {href:location.href,lang:document.documentElement.lang,time:v?.currentTime,duration:v?.duration,ready:v?.readyState,network:v?.networkState,error:v?.error?.message,title:document.getElementById('chapterNow')?.textContent,src:v?.currentSrc,chapters:document.querySelectorAll('.vg-chapter').length};})()`));
  ck(lang+' primary film chapter 46 opens from its link',ready&&await ev(`document.querySelectorAll('.vg-chapter').length===46&&Math.abs(document.getElementById('guideVideo').currentTime-${ch.start})<1`));
  ck(lang+' primary film duration and language',await ev(`document.documentElement.lang==='${lang}'&&Math.abs(document.getElementById('guideVideo').duration-${main.versions[lang].seconds})<.2`));
  ck(lang+' primary film points to matching laboratory section',await ev(`document.getElementById('openSection').href.endsWith('#s=quantization&lang=${lang}')`));
  await ev(`document.getElementById('guideVideo').play()`);await pause(500);
  ck(lang+' primary film actually plays the new chapter',await ev(`!document.getElementById('guideVideo').paused&&document.getElementById('guideVideo').currentTime>${ch.start}`));
  ck(lang+' primary film captions cover the added chapter',await ev(`Array.from(document.getElementById('guideVideo').textTracks).some(t=>Array.from(t.cues||[]).some(c=>c.startTime>${ch.start}+200))`));
  await ev(`document.getElementById('guideVideo').pause()`);
  const chapters=JSON.parse(readFileSync(resolve(root,'media/video',revision,'chapters-'+lang+'.json')));
  for(let index=0;index<chapters.length;index++){
   await ev(`document.querySelectorAll('.vg-chapter')[${index}].click()`);
   ck(lang+' index seeks chapter '+(index+1)+' and keeps it visible',await ev(`(()=>{const v=document.getElementById('guideVideo'),b=document.querySelector('.vg-chapter[aria-current="true"]'),list=document.getElementById('chapterList'),r=b?.getBoundingClientRect(),p=list.getBoundingClientRect();return Math.abs(v.currentTime-${chapters[index].start})<.002&&b?.dataset.index==='${index}'&&r.top>=p.top-1&&r.bottom<=p.bottom+1;})()`));
  }
  writeFileSync(resolve(out,'main-'+lang+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 const math=JSON.parse(readFileSync(resolve(site,'video/mathematics/render-manifest.json')));
 for(const report of math.reports){
  const lang=report.language,chapters=JSON.parse(readFileSync(resolve(site,'video/mathematics/chapters-'+lang+'.json')));
  await send('Page.navigate',{url:base+'/video/mathematics/index'+(lang==='es'?'-es':'')+'.html#q1'});
  let ready=false;for(let i=0;i<150;i++){ready=await ev(`document.getElementById('film')?.readyState>=1&&document.querySelectorAll('#chapters button').length===38&&Math.abs(document.getElementById('film').currentTime-${chapters[29].start})<.002`);if(ready)break;await pause(100);}
  ck(lang+' mathematical film 38 chapters and hash seek',ready);
  ck(lang+' mathematical film duration and language',await ev(`document.documentElement.lang==='${lang}'&&Math.abs(document.getElementById('film').duration-${report.seconds})<.2`));
  for(let i=0;i<chapters.length;i++){
   await ev(`document.querySelectorAll('#chapters button')[${i}].click()`);
   ck(lang+' mathematical index chapter '+(i+1),await ev(`Math.abs(document.getElementById('film').currentTime-${chapters[i].start})<.002&&document.querySelector('#chapters [aria-current="true"]').dataset.index==='${i}'`));
  }
  await ev(`document.getElementById('film').play()`);await pause(600);
  ck(lang+' mathematical film plays the experimental chapter',await ev(`!document.getElementById('film').paused&&document.getElementById('film').currentTime>${chapters[37].start}`));
  await ev(`document.getElementById('film').pause()`);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  ck(lang+' mathematical player mobile layout',await ev(`document.documentElement.scrollWidth<=window.innerWidth+1`));
  writeFileSync(resolve(out,'mathematics-'+lang+'-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await send('Emulation.clearDeviceMetricsOverride');
 }
 ck('no runtime exceptions',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({passed:!process.exitCode,checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (shipped video and demo)`);ws?.close();browser.kill();server.closeAllConnections();server.close();}
