/* Real-browser gate for the 🎬 guided demos (src/view/card_demo.js + src/view/demo_scripts.mjs).
 * Every demo is run from a fresh load of its section, at high speed, exactly as a reader would start it: the button
 * must be where the demo says it lives, the demo must reach its closing panel, no step may fail (a missing control, a
 * value that does not persist, a control that stays busy), and the page must throw nothing.  The video recorder
 * demands the same of the same storyboard; this is that demand made on the page itself. */
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {findChrome} from './_chrome.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url))), out = resolve(root, '.tmp/demos-browser');
mkdirSync(out, {recursive: true});
const url = pathToFileURL(resolve(root, 'app/index.html')).href, port = 9497;
const {CDM_SCRIPTS} = await import(pathToFileURL(resolve(root, 'src/view/demo_scripts.mjs')).href);
const profile = resolve(root, '.tmp', `demos-${Date.now()}`); mkdirSync(profile, {recursive: true});
const child = spawn(findChrome(), ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], {stdio: 'ignore', windowsHide: true});
const pause = ms => new Promise(r => setTimeout(r, ms)); const checks = [], errors = []; let ws;
function check(name, passed) { checks.push({name, passed: !!passed}); if (!passed) throw Error(name); }
try {
  let target; for (let i = 0; i < 100; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); if (target) break; } catch {} await pause(100); }
  if (!target) throw Error('No isolated browser');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((r, j) => { const id = ++seq, timer = setTimeout(() => { pending.delete(id); j(Error(`Timeout ${method}`)); }, 120000); pending.set(id, m => { clearTimeout(timer); m.error ? j(Error(JSON.stringify(m.error))) : r(m.result); }); ws.send(JSON.stringify({id, method, params})); });
  const ev = async x => { const r = await send('Runtime.evaluate', {expression: x, returnByValue: true, awaitPromise: true}); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)); return r.result?.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false});
  const timings = [];
  for (const c of CDM_SCRIPTS.chapters) {
    const before = errors.length, t0 = Date.now();
    await send('Page.navigate', {url: 'about:blank'}); await send('Page.navigate', {url: url + '#s=' + c.host});
    let ready = false;
    for (let i = 0; i < 300 && !ready; i++) { await pause(100); ready = await ev(`document.querySelector('#rail a.on')?.dataset.id===${JSON.stringify(c.host)}&&${c.card ? `!!document.querySelector('#${c.card} h2 .cdm-btn')` : `!!document.querySelector('[data-cdm-section="${c.host}"]')`}`); }
    check(`${c.id}: its 🎬 button is in ${c.card ? '#' + c.card : 'the ' + c.host + ' how-to'}`, ready);
    await ev(`(()=>{CDM_URL.speed=0.02;CDM_URL.lang=${JSON.stringify(c.id.length % 2 ? 'es' : 'en')};cdmRun(${JSON.stringify(c.id)});})()`);
    let state = null;
    for (let i = 0; i < 1800; i++) { await pause(100); state = await ev(`({running:CDM_STATE.running,err:CDM_STATE.lastError,fin:CDM_STATE.lastFinished,panel:!!document.getElementById('cdm_explain')})`); if (!state.running) break; }
    check(`${c.id}: the demo finishes without a failed step${state.err ? ' — ' + state.err : ''}`, !state.running && !state.err && state.fin === c.id);
    check(`${c.id}: it ends on its "how to read it" panel`, state.panel);
    check(`${c.id}: no browser exception during the demo${errors.length > before ? ' — ' + errors.slice(before).join(' | ') : ''}`, errors.length === before);
    timings.push([c.id, Date.now() - t0]);
  }
  /* the section menu: a section with several demos offers them all */
  await send('Page.navigate', {url: 'about:blank'}); await send('Page.navigate', {url: url + '#s=predict'});
  for (let i = 0; i < 200 && !(await ev(`!!document.querySelector('[data-cdm-section="predict"]')`)); i++) await pause(100);
  await ev(`document.querySelector('[data-cdm-section="predict"]').click()`); await pause(200);
  const listed = CDM_SCRIPTS.chapters.filter(c => c.host === 'predict' && !c.card).length;
  check(`the Simulator 🎬 menu lists its ${listed} demos`, await ev(`document.querySelectorAll('.cdm-menu [data-cdm-run]').length===${listed}`));
  check('clicking the menu button does not fold the how-to', await ev(`!document.querySelector('#section > details.howto')?.open`));
  /* a link must start a demo by itself — for a section (hand-written) and for a card */
  for (const [hash, id] of [['#s=hierarchy&demo=hierarchy&demoSpeed=0.02', 'hierarchy'], ['#s=collider&demo=higgstools&demoSpeed=0.02', 'higgstools']]) {
    await send('Page.navigate', {url: 'about:blank'}); await send('Page.navigate', {url: url + hash});
    let s = null; for (let i = 0; i < 600; i++) { await pause(100); s = await ev(`({fin:CDM_STATE.lastFinished,err:CDM_STATE.lastError,panel:!!document.getElementById('cdm_explain')})`); if (s.fin || s.err) break; }
    check(`a link with demo=${id} starts it by itself and it finishes${s.err ? ' — ' + s.err : ''}`, s.fin === id && s.panel && !s.err);
  }
  /* negative controls: the gate must be able to fail.  A demo whose control is missing, or whose value does not
   * persist, has to stop with the reason on screen rather than "finish". */
  await ev(`document.querySelector('.cdm-menu')?.remove()`);
  const probe = async (mutate, label) => {
    await ev(`(()=>{const c=JSON.parse(JSON.stringify(CDM_SCRIPTS.chapters.find(x=>x.id==='predict')));c.id='__probe';${mutate};CDM_SCRIPTS.chapters.push(c);CDM_URL.speed=0.02;CDM_URL.lang='en';cdmRun('__probe');})()`);
    let s; for (let i = 0; i < 600; i++) { await pause(100); s = await ev(`({running:CDM_STATE.running,err:CDM_STATE.lastError,fin:CDM_STATE.lastFinished,banner:document.getElementById('cdm_banner')?.textContent||''})`); if (!s.running) break; }
    await ev(`CDM_SCRIPTS.chapters=CDM_SCRIPTS.chapters.filter(x=>x.id!=='__probe')`);
    check(`negative control: ${label} stops the demo with the reason on screen`, !s.running && s.err && s.fin !== '__probe' && s.banner.includes('stopped'));
  };
  await probe(`c.steps[1].actions=[{kind:'click',selector:'#no-such-control'}]`, 'a missing control');
  await probe(`c.steps[1].actions=[{kind:'set',selector:'#prModel',value:'no-such-mode'}]`, 'an option the control does not have');
  writeFileSync(resolve(out, 'demos.json'), JSON.stringify({passed: true, checks, timings}, null, 2) + '\n');
  console.log(`${checks.length} passed, 0 failed (demos browser: ${CDM_SCRIPTS.chapters.length} guided demos run to their panel)`);
} catch (e) {
  writeFileSync(resolve(out, 'demos.json'), JSON.stringify({passed: false, checks, errors, error: String(e)}, null, 2) + '\n');
  console.error('FAILED:', e.message); process.exitCode = 1;
} finally { ws?.close(); child.kill(); }
