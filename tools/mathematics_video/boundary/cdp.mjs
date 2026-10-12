import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {findChrome} from '../../../build/_chrome.mjs';
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function session(root){
 const profile=resolve(root,'browser-'+process.pid);mkdirSync(profile,{recursive:true});
 const child=spawn(findChrome(),['--headless=new','--disable-gpu','--lang=en-US','--accept-lang=en-US','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
 let port,target,ws;
 try{
  for(let i=0;i<100;i++){try{if(existsSync(resolve(profile,'DevToolsActivePort'))){port=Number(readFileSync(resolve(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);if(port>0)break;}}catch{}await pause(100);}
  for(let i=0;i<100;i++){target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;await pause(100);}
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.j(Error(JSON.stringify(m.error))):p.r(m.result);}};
  const call=(method,params={})=>new Promise((r,j)=>{const id=++seq,timer=setTimeout(()=>j(Error('Timeout '+method)),30000);pending.set(id,{r,j,timer});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await call('Page.enable');await call('Runtime.enable');
  return {call,evaluate,close(){ws.close();child.kill();}};
 }catch(e){ws?.close();child.kill();throw e;}
}
