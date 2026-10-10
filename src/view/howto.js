/* Help text is generated from docs/user-guides[.es].json at build time. */
/*__HOWTO__*/
let GUIDE_LANGUAGE='en';
try { if(localStorage.getItem('ghu-help-language')==='es')GUIDE_LANGUAGE='es'; } catch {}
const GUIDE_INITIAL_TARGET=typeof location==='undefined'?null:new URLSearchParams(location.hash.slice(1)).get('help');
function guideEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function guideHref(id,lang=GUIDE_LANGUAGE){
  const base=(typeof document==='undefined'?null:document.querySelector?.('[data-guide-base]'))?.dataset.guideBase||'https://karlesmarin.github.io/ghu-explorer/guide/';
  return base+(lang==='es'?'es/':'')+(id==='index'?'':id+'/')+'index.html';
}
function guideLink(id){
  return `<a class="guide-full-link" data-guide-id="${guideEscape(id)}" href="${guideHref(id)}" target="_blank" rel="noopener" lang="${GUIDE_LANGUAGE}">${GUIDE_LANGUAGE==='es'?'Guía completa ↗':'Full guide ↗'}</a>`;
}
function howToBlock(id){
  if(!HOWTO[id])return '';
  const demo=(typeof demoHas==='function'&&demoHas(id))?`<button class="ghost" id="demoRun" data-demo="${id}" style="float:right;width:auto;padding:2px 10px">▶ demo</button>`:'';
  const content=(h,lang)=>`<div data-guide-language="${lang}" lang="${lang}" ${GUIDE_LANGUAGE!==lang?'hidden':''}><p><b>${lang==='es'?'Qué responde.':'What it answers.'}</b> ${guideEscape(h.what)}</p><ol>${h.steps.map(s=>`<li>${guideEscape(s)}</li>`).join('')}</ol><p class="note"><b>${lang==='es'?'Cómo interpretarlo.':'Reading it.'}</b> ${guideEscape(h.read)}</p></div>`;
  return `<details class="card howto" style="margin-bottom:14px;padding:10px 14px"><summary style="cursor:pointer;font-weight:650"><span data-guide-summary lang="${GUIDE_LANGUAGE}">${GUIDE_LANGUAGE==='es'?'Cómo utilizar esta sección':'How to use this section'}</span>${demo}${typeof cdmSectionButton==='function'?cdmSectionButton(id):''}</summary><div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px"><span>Help / Ayuda:</span>${['en','es'].map(l=>`<button type="button" class="ghost" data-guide-set-language="${l}" aria-pressed="${GUIDE_LANGUAGE===l}" lang="${l}">${l==='en'?'English':'Español'}</button>`).join('')}</div>${content(HOWTO[id],'en')}${content(HOWTO_ES[id],'es')}<nav aria-label="User guides" style="display:flex;flex-wrap:wrap;gap:16px">${guideLink(id)}<a data-guide-id="getting-started" data-guide-label="start" href="${guideHref('getting-started')}" target="_blank" rel="noopener">${GUIDE_LANGUAGE==='es'?'Primeros pasos':'Getting started'}</a><a data-guide-id="index" data-guide-label="all" href="${guideHref('index')}" target="_blank" rel="noopener">${GUIDE_LANGUAGE==='es'?'Todas las guías':'All guides'}</a></nav></details>`;
}
function syncGuideLanguage(){
  if(typeof document==='undefined'||typeof document.querySelectorAll!=='function')return;
  document.querySelectorAll('[data-guide-id]').forEach(n=>{n.href=guideHref(n.dataset.guideId);n.lang=GUIDE_LANGUAGE;const es=GUIDE_LANGUAGE==='es';n.textContent=n.dataset.guideLabel==='start'?(es?'Primeros pasos':'Getting started'):n.dataset.guideLabel==='all'?(es?'Todas las guías':'All guides'):(es?'Guía completa ↗':'Full guide ↗');});
  document.querySelectorAll('[data-help]').forEach(n=>{const entry=(GUIDE_LANGUAGE==='es'?HELP_TERMS_ES:HELP_TERMS)[n.dataset.help];if(entry){n.title=entry.term;n.setAttribute('aria-label',(GUIDE_LANGUAGE==='es'?'Explicar: ':'Explain: ')+entry.term);}});
}
function mountGuideHelp(){
  if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;
  if(document.__guideHelpMounted)return;document.__guideHelpMounted=true;
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-guide-set-language]');if(!button)return;
    GUIDE_LANGUAGE=button.dataset.guideSetLanguage==='es'?'es':'en';
    try{localStorage.setItem('ghu-help-language',GUIDE_LANGUAGE);}catch{}
    document.querySelectorAll('[data-guide-language]').forEach(n=>{n.hidden=n.dataset.guideLanguage!==GUIDE_LANGUAGE;});
    document.querySelectorAll('[data-guide-set-language]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.guideSetLanguage===GUIDE_LANGUAGE)));
    document.querySelectorAll('[data-guide-summary]').forEach(n=>{n.lang=GUIDE_LANGUAGE;n.textContent=GUIDE_LANGUAGE==='es'?'Cómo utilizar esta sección':'How to use this section';});
    syncGuideLanguage();
  });
  if(GUIDE_INITIAL_TARGET&&Object.hasOwn(GUIDE_TARGETS,GUIDE_INITIAL_TARGET))requestAnimationFrame(()=>{
    const target=document.getElementById(GUIDE_TARGETS[GUIDE_INITIAL_TARGET]);if(!target||target.closest('[hidden]'))return;
    for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    const inset=document.getElementById('top')?.getBoundingClientRect().height||0;
    target.style.scrollMarginTop=`${inset+12}px`;
    target.tabIndex=-1;target.scrollIntoView({block:'start'});target.focus({preventScroll:true});
  });
}
