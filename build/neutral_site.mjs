/* Test the shipped narrated supplement, captions, seeking and demo links over local HTTP. */
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {findChrome} from './_chrome.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),site=resolve(root,'site'),out=resolve(root,'.tmp/neutral-site');mkdirSync(out,{recursive:true});
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
const browser=spawn(findChrome(),['--headless=new','--no-proxy-server','--remote-debugging-port=9519',`--user-data-dir=${out}/profile-${Date.now()}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),checks=[],errors=[];let ws;
function ck(name,value){checks.push({name,passed:!!value});if(!value)throw Error(name);}
try{
 let tab;for(let i=0;i<100;i++){try{tab=(await(await fetch('http://127.0.0.1:9519/json/list')).json()).find(x=>x.type==='page');if(tab)break;}catch{}await pause(100);}
 if(!tab)throw Error('No browser');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method+' timed out')),45000);pending.set(id,m=>{clearTimeout(t);m.error?j(Error(JSON.stringify(m.error))):r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'JS error');return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');
 const manifest=JSON.parse(readFileSync(resolve(site,'video/neutral/manifest.json')));
 for(const report of manifest.reports){
  const lang=report.language;await send('Page.navigate',{url:base+'/video/neutral/index'+(lang==='es'?'-es':'')+'.html'});
  let ready=false;for(let i=0;i<100;i++){ready=await ev(`!!document.getElementById('film')&&document.getElementById('film').readyState>=1`);if(ready)break;await pause(100);}
  ck(lang+' video metadata and duration',ready&&await ev(`Math.abs(document.getElementById('film').duration-${report.duration_seconds})<.2`));
  ck(lang+' document language and chapter count',await ev(`document.documentElement?.lang==='${lang}'&&document.querySelectorAll('[data-start]').length===${report.chapters}`));
  await ev(`document.getElementById('film').textTracks[0].mode='hidden'`);
  let cues=0;for(let i=0;i<50;i++){cues=await ev(`document.getElementById('film').textTracks[0].cues?.length||0`);if(cues)break;await pause(100);}
  ck(lang+' VTT captions loaded',cues===report.caption_cues);
  await ev(`document.querySelectorAll('[data-start]')[5].click()`);await pause(650);
  ck(lang+' chapter seeking and actual playback',await ev(`(()=>{const v=document.getElementById('film'),t=Number(document.querySelectorAll('[data-start]')[5].dataset.start);return !v.paused&&v.currentTime>=t&&v.currentTime<t+4;})()`));
  await ev(`document.getElementById('film').pause()`);
  const demo=await ev(`document.querySelector('a[href*="demo=boundaryresearch"]').href`);
  await send('Page.navigate',{url:demo+'&demoSpeed=.01'});
  let finished=false;for(let i=0;i<200;i++){finished=await ev(`typeof CDM_STATE!=='undefined'&&CDM_STATE.lastFinished==='boundaryresearch'&&!CDM_STATE.running`);if(finished)break;await pause(100);}
  ck(lang+' shipped Demo link auto-starts and completes',finished&&await ev(`CDM_STATE.autostarted&&!CDM_STATE.lastError&&GUIDE_LANGUAGE==='${lang}'`));
 }
 ck('no runtime exceptions',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;}
finally{writeFileSync(resolve(out,'checks.json'),JSON.stringify({passed:!process.exitCode,checks,errors},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length} passed, ${checks.filter(c=>!c.passed).length} failed (shipped video and demo)`);ws?.close();browser.kill();server.closeAllConnections();server.close();}
