/* Exercise the actual compiled app through Chromium, including real mouse input and exports. */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import { findChrome } from './_chrome.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)), out=resolve(root,'shots/gravitygauge');mkdirSync(out,{recursive:true});
const app=resolve(root,process.argv[2] || 'app/index.html').replaceAll('\\','/');
const chromePath=findChrome();
const port=9485, profile=mkdtempSync(resolve(tmpdir(),'ghu-gravitygauge-'));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
  '--no-first-run','--no-default-browser-check','--disable-gpu','--allow-file-access-from-files','about:blank'],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;const checks=[],events=[];
const ok=(name,passed,details={})=>{checks.push({name,passed:!!passed,...details});if(!passed)throw new Error(name);};
try{
  let target;
  for(let i=0;i<60;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await sleep(100);}
  if(!target)throw new Error('No debugging target');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let seq=0;const waiting=new Map();
  ws.onmessage=e=>{const x=JSON.parse(e.data);if(x.id){const cb=waiting.get(x.id);waiting.delete(x.id);cb?.(x);}else events.push(x);};
  const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;waiting.set(id,x=>x.error?j(new Error(JSON.stringify(x.error))):r(x.result));ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw new Error(x.exceptionDetails.exception?.description||JSON.stringify(x.exceptionDetails));return x.result?.value;};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1360,height:960,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'file:///'+app+'#s=gravitygauge'});await sleep(900);
  ok('rail_and_panel_open',await ev(`!!document.querySelector('#rail a[data-id="gravitygauge"]') && !!document.getElementById('ggSurface')`));
  ok('help_is_mounted',await ev(`document.getElementById('section').textContent.includes('Shift-drag always turns')`));
  const state=()=>ev(`({p:GG_S.p,eta:GG_S.eta,t:GG_S.t,rows:document.getElementById('ggResults').textContent,az:SECTIONS.find(s=>s.id==='gravitygauge')._view.az})`);
  const before=await state();
  async function click(selector){const box=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...box});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...box});await sleep(70);}
  await click('#ggMinus');let s=await state();ok('preset_changes_response_not_paired_mass',s.eta===-.9&&s.rows.includes('4.107141')&&s.rows.includes('0.665476'));
  await click('#ggPlus');s=await state();ok('second_preset_recomputes_live',s.eta===4&&s.rows.includes('0.100267'));
  await ev(`(()=>{const e=document.getElementById('ggEta');e.value='-1';e.dispatchEvent(new Event('change'));})()`);
  ok('singular_input_rejected',await ev(`GG_S.eta===4 && document.getElementById('ggInputNote').textContent.includes('last valid')`));
  await ev(`(()=>{const e=document.getElementById('ggT');e.value='.8';e.dispatchEvent(new Event('input'));})()`);
  ok('source_control_recomputes',Math.abs((await state()).t-.8)<1e-12);
  await ev(`(()=>{const e=document.getElementById('ggSurface');e.scrollIntoView({block:'center'});})()`);
  const center=await ev(`(()=>{const r=document.getElementById('ggSurface').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const az=(await state()).az;
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...center});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:center.x+55,y:center.y+15});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:center.x+55,y:center.y+15});await sleep(180);
  ok('3D_rotation_real_pointer',(await state()).az!==az);
  await click('#ggMode');
  const point=await ev(`(()=>{const s=SECTIONS.find(s=>s.id==='gravitygauge'),r=document.getElementById('ggSurface').getBoundingClientRect(),p=s._projector(.55,.4,s._field.height(.55,.4));return {x:r.x+p[0]*r.width/s._sw,y:r.y+p[1]};})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await sleep(120);
  s=await state();ok('surface_selection_updates_physical_parameters',Number.isFinite(s.eta)&&s.eta!==4&&s.t>=.12&&s.t<=.98,s);
  await ev(`(()=>{const e=document.getElementById('ggQuantity');e.value='kinetic';e.dispatchEvent(new Event('change'));})()`);
  ok('second_surface_quantity',await ev(`GG_S.quantity==='kinetic' && document.getElementById('ggSurfaceNote').textContent.includes('value=')`));
  // The existing header really sends this section's model, not the shell's SU(3).
  await ev(`(()=>{window.__ggDownloads=[];const real=URL.createObjectURL;URL.createObjectURL=function(b){b.text().then(t=>window.__ggDownloads.push({type:b.type,text:t}));return real.call(this,b);};const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)click.call(this);};})()`);
  await click('#btnCard');await sleep(650);
  const downloaded=await ev(`window.__ggDownloads.find(d=>d.type==='application/json')`);
  ok('header_JSON_download',!!downloaded);
  const card=JSON.parse(downloaded.text);
  ok('export_matches_selected_model',card.input.model.group==='warped-gauge-gravity'&&card.input.model.eta===s.eta&&card.input.model.source_t===s.t);
  ok('unknowns_exported_honestly',card.results.Higgs_mass.status==='unknown'&&card.results.collider_rate.status==='unknown');
  ok('no_unrelated_SM_defaults',card.input.defaults_applied.length===0&&card.input.model.conventions.m_W===null);
  await click('#btnTex');await sleep(650);ok('LaTeX_export_works',await ev(`window.__ggDownloads.some(d=>d.type==='text/x-tex'&&d.text.includes('H185'))`));
  const link=await ev('location.href');
  await send('Page.navigate',{url:link});await sleep(600);const restored=await state();
  ok('permalink_restores_inputs',restored.p===s.p&&Math.abs(restored.eta-s.eta)<1e-12&&restored.t===s.t);
  await ev(`document.querySelector('#rail a[data-id="hierarchy"]').click()`);await sleep(80);
  await ev(`document.querySelector('#rail a[data-id="gravitygauge"]').click()`);await sleep(80);
  ok('leave_and_return_retains_parameters',(await state()).eta===s.eta);
  await click('#ggReset');ok('reset_model',JSON.stringify([...(await ev('[GG_S.p,GG_S.eta,GG_S.t]'))])==='[1.1,0,0.5]');
  async function shot(name){await ev('window.scrollTo(0,0)');const m=await send('Page.getLayoutMetrics');const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:m.cssContentSize.width,height:m.cssContentSize.height,scale:1}});writeFileSync(resolve(out,name),Buffer.from(r.data,'base64'));}
  await shot('desktop.png');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(250);
  const layout=await ev(`({viewport:innerWidth,body:document.documentElement.scrollWidth,canvases:[...document.querySelectorAll('#ggSurface,#ggTower')].map(e=>({w:e.getBoundingClientRect().width,c:e.parentElement.clientWidth}))})`);
  ok('mobile_no_horizontal_page_overflow',layout.body<=layout.viewport+1,layout);
  ok('mobile_both_graphs_fit',layout.canvases.every(c=>c.w<=c.c));await shot('mobile.png');
  const errors=events.filter(e=>e.method==='Runtime.exceptionThrown');
  ok('no_browser_exceptions',errors.length===0,{errors});
  const report={checks,app,app_sha256:createHash('sha256').update(readFileSync(app)).digest('hex'),captured_card:card};
  writeFileSync(resolve(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:checks.length,passed:true,output:out}));
}catch(e){writeFileSync(resolve(out,'failure.json'),JSON.stringify({error:String(e),checks,events},null,2));throw e;}
finally{ws?.close();chrome.kill();}
