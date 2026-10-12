import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {session,pause} from './cdp.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)),out=resolve(root,'lab');mkdirSync(out,{recursive:true});
const c=await session(root),records=[];
try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await c.call('Emulation.setLocaleOverride',{locale:'en_US'});
 await c.call('Page.navigate',{url:'http://127.0.0.1:8875/app/index.html#s=anomalies&lang=en'});
 for(let i=0;i<100;i++){if(await c.evaluate('!!document.querySelector("#rx_boundaryresearch_controls")'))break;await pause(150);}
 await c.evaluate('document.documentElement.lang="en-US"');
 await c.evaluate(`{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Research baseline');if(b)b.click();}`);
 for(const [key,value] of [['theta',0],['viewMode',0]])await c.evaluate(`{let e=document.querySelector('#rx_boundaryresearch_controls [data-rx="${key}"]');e.value=${value};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}`);
 const inspect=await c.evaluate(`({inputs:[...document.querySelectorAll('#rx_boundaryresearch_controls input')].map(e=>({key:e.dataset.rx,value:e.value})),svgs:[...document.querySelectorAll('#rx_boundaryresearch_result svg')].map((e,i)=>({i,title:e.querySelector('title')?.textContent,text:e.textContent.slice(0,120)}))})`);
 writeFileSync(resolve(out,'inspection.json'),JSON.stringify(inspect,null,2));
 const plotIndex=inspect.svgs.find(s=>s.text.includes('Flat boundary spectrum'))?.i;
 if(plotIndex===undefined)throw Error('Spectrum SVG not found: '+JSON.stringify(inspect.svgs));
 for(let i=0;i<=40;i++){
  const a=i/10;
  await c.evaluate(`{let e=document.querySelector('#rx_boundaryresearch_controls [data-rx="strength"]');e.value=${a};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}`);
  await pause(100);
  for(const [name,selector] of [['curve',`#rx_boundaryresearch_result svg`],['control','#rx_boundaryresearch_controls [data-rx="strength"]']]){
   const clip=await c.evaluate(`(()=>{let e=${name==='curve'?`document.querySelectorAll(${JSON.stringify(selector)})[${plotIndex}]`:`document.querySelector(${JSON.stringify(selector)}).parentElement`};const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
   clip.scale=name==='control'?3:2;
   const snap=await c.call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
   writeFileSync(resolve(out,`${name}-${String(i).padStart(3,'0')}.png`),Buffer.from(snap.data,'base64'));
  }
  records.push({frame:i,strength:a,theta:0});
 }
 writeFileSync(resolve(out,'capture.json'),JSON.stringify({source:'GHU Lab 0.2.1 actual browser controls and rendered spectrum; no plotted data redrawn',frames:records},null,2)+'\n');
 console.log('Captured 41 real laboratory input/result states.');
}finally{c.close();}
