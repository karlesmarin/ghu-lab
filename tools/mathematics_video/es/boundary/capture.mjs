import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {session,pause} from '../../boundary/cdp.mjs';
import {brxModel} from '../../../../src/modules/boundary_research.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)),out=resolve(root,'lab');mkdirSync(out,{recursive:true});
const c=await session(root),records=[],crops=[];
const set=async(key,value)=>{await c.evaluate(`{let e=document.querySelector('#rx_boundaryresearch_controls [data-rx="${key}"]');e.value=${value};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}`);await pause(90);};
const snap=async(name,expression,scale=2)=>{await c.evaluate(`(${expression}).scrollIntoView({block:'center'})`);await c.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const box=await c.evaluate(`(()=>{const r=(${expression}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`);const r=await c.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,name+'-viewport.png'),Buffer.from(r.data,'base64'));crops.push({name,box,scale:2});};
try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:2,mobile:false});await c.call('Emulation.setLocaleOverride',{locale:'es_ES'});
 await c.call('Page.navigate',{url:'http://127.0.0.1:8875/app/index.html#s=anomalies&lang=es'});
 for(let i=0;i<100;i++){if(await c.evaluate('!!document.querySelector("#rx_boundaryresearch_controls")'))break;await pause(150);}
 await c.evaluate(`document.documentElement.lang='es-ES';[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Referencia de investigación')?.click()`);
 await set('theta',0);await set('viewMode',0);
 const spectrum=await c.evaluate(`[...document.querySelectorAll('#rx_boundaryresearch_result svg')].findIndex(e=>e.textContent.includes('Espectro plano'))`);
 if(spectrum<0)throw Error('Spanish spectrum not found');
 for(let i=0;i<=40;i++){
  await set('strength',i/10);
  await snap('curve-'+String(i).padStart(3,'0'),`document.querySelectorAll('#rx_boundaryresearch_result svg')[${spectrum}]`);
  await snap('control-'+String(i).padStart(3,'0'),`document.querySelector('#rx_boundaryresearch_controls [data-rx="strength"]').parentElement`);
  records.push({frame:i,strength:i/10,theta:0});
 }
 writeFileSync(resolve(out,'capture.json'),JSON.stringify({language:'es',source:'Actual Spanish GHU Lab interface',frames:records},null,2)+'\n');
 writeFileSync(resolve(out,'crops.json'),JSON.stringify(crops,null,2)+'\n');
 console.log('Captured 41 Spanish boundary states.');
}finally{c.close();}
