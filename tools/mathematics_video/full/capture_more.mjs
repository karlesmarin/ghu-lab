import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {session,pause} from '../boundary/cdp.mjs';
import {brxModel} from '../../../src/modules/boundary_research.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)),out=resolve(root,'lab');mkdirSync(out,{recursive:true});
const c=await session(root),records=[],crops=[];
const set=async(key,value)=>{await c.evaluate(`{let e=document.querySelector('#rx_boundaryresearch_controls [data-rx="${key}"]');e.value=${value};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}`);await pause(90);};
const snap=async(name,expression,scale=2)=>{await c.evaluate(`(${expression}).scrollIntoView({block:'center'})`);await c.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const box=await c.evaluate(`(()=>{const r=(${expression}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`);const r=await c.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,name+'-viewport.png'),Buffer.from(r.data,'base64'));crops.push({name,box,scale:2});};
try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:2,mobile:false});await c.call('Emulation.setLocaleOverride',{locale:'en_US'});
 await c.call('Page.navigate',{url:'http://127.0.0.1:8875/app/index.html#s=anomalies&lang=en'});
 for(let i=0;i<100;i++){if(await c.evaluate('!!document.querySelector("#rx_boundaryresearch_controls")'))break;await pause(150);}
 await c.evaluate(`document.documentElement.lang='en-US';[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Research baseline')?.click()`);
 for(let i=0;i<=20;i++){
  const mass=i/20;await set('profileMass',mass);
  await snap('gram-'+i,`document.querySelector('#brx_gram')`);
  await snap('mass-'+i,`document.querySelector('#rx_boundaryresearch_controls [data-rx="profileMass"]').parentElement`,3);
  records.push({kind:'gram',frame:i,input:mass,result:brxModel({profileMass:mass}).gram});
 }
 for(const mask of [3,31,991]){
  await set('insertion',mask);
  await c.evaluate(`{const e=document.querySelector('#brx_trace').nextElementSibling.nextElementSibling;e.open=true;const t=e.querySelector('table');t.style.width='660px';t.style.maxWidth='660px';for(const c of t.querySelectorAll('th,td')){c.style.fontSize='20px';c.style.lineHeight='1.5';}}`);
  await snap('trace-'+mask,`document.querySelector('#brx_trace').nextElementSibling.nextElementSibling.querySelector('table')`);
  await snap('insertion-'+mask,`document.querySelector('#rx_boundaryresearch_controls [data-rx="insertion"]').parentElement`,2);
  records.push({kind:'trace',input:mask,result:brxModel({insertion:mask}).moments});
 }
 for(let n=1;n<=6;n++){
  await set('generations',n);await set('leptonSign',-1);
  await c.evaluate(`{const e=document.querySelector('#brx_family').nextElementSibling;e.style.width='620px';e.style.maxWidth='620px';e.style.fontSize='22px';e.style.lineHeight='1.5';e.style.padding='12px';}`);
  await snap('family-'+n,`document.querySelector('#brx_family').nextElementSibling`,2);
  await snap('number-'+n,`document.querySelector('#rx_boundaryresearch_controls [data-rx="generations"]').parentElement`,3);
  records.push({kind:'family',input:n,result:brxModel({generations:n,leptonSign:-1}).family});
 }
 writeFileSync(resolve(out,'capture.json'),JSON.stringify({source:'Actual GHU Lab 0.2.1 browser controls and rendered outputs; trace details opened and trace/family typography enlarged for legibility, without changing values',records},null,2)+'\n');
 writeFileSync(resolve(out,'crops.json'),JSON.stringify(crops,null,2)+'\n');
 console.log('Captured 21 Gram states, 3 trace insertions and 6 family results.');
}finally{c.close();}
