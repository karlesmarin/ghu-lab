/* card_demo.js — a guided simulation of one experiment card: a "🎬 Demo" button in the card's heading presses the
 * card's own buttons and controls in order, a banner at the top says what each step does, and a closing panel says
 * how to read what just appeared.  The pattern of tafagent's demos (karlesmarin.github.io/tafagent).
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * NOTHING IS FAKED.  A step clicks the real preset button or writes the real input and fires the same change event a
 * reader's edit fires; the card recomputes for real, and the numbers quoted in the banner are read from the model at
 * that moment.  A demo that ends on a wrong number is a bug report, not a bad script.
 * IT CAN BE STOPPED.  The ✕ in the banner aborts at the next pause; what the reader sees afterwards is the card in
 * the state the demo left, editable like any other.
 * A LINK CAN START IT.  `#s=collider&demo=kkgluon` (or `?demo=kkgluon`) runs the demo once the card is mounted, so a
 * letter or a guide can hand someone the demonstration rather than instructions.  `lang=es` picks Spanish;
 * `demoSpeed` (tests only) scales every pause.
 * The demo-section engine (`demo.js`) drives a whole section from the how-to; this one drives one card.
 */
const CDM_URL = (() => {
  try { const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ''));
    return { demo: h.get('demo') || q.get('demo'), lang: h.get('lang') || q.get('lang'), speed: Number(h.get('demoSpeed') || q.get('demoSpeed')) || 1 };
  } catch { return { demo: null, lang: null, speed: 1 }; }
})();
const CDM_STATE = { running: false, cancel: false, autostarted: false };
const cdmLang = () => (CDM_URL.lang === 'es' || CDM_URL.lang === 'en') ? CDM_URL.lang
  : (typeof GUIDE_LANGUAGE !== 'undefined' && GUIDE_LANGUAGE === 'es' ? 'es' : 'en');
const cdmNum = (x, d = 2) => (x == null || !Number.isFinite(x)) ? '—' : Number(x).toFixed(d);

/* One entry per card: the steps (banner text in both languages, what to highlight, what to do) and the closing panel.
 * `v` is the card's current result, recomputed before each banner is written. */
const CDM_DEMOS = {
  kkgluon: {
    model: () => kkgModel(RX_STATE.kkgluon),
    steps: [
      { en: () => 'First KK gluon at the LHC: this card compares a Kaluza–Klein gluon with ATLAS and CMS data',
        es: () => 'Primer gluón KK en el LHC: esta tarjeta compara un gluón de Kaluza–Klein con datos de ATLAS y CMS',
        hl: '#rx_kkgluon h2' },
      { en: () => 'Load the published warped benchmark (Casagrande et al. 2008)',
        es: () => 'Carga el punto de referencia curvado publicado (Casagrande et al. 2008)',
        button: 'Published RS point (arXiv:0807.4937)' },
      { en: v => `At 3.75 TeV: Γ/M = ${cdmNum(v.here.GoverM)}, BR(tt̄) = ${cdmNum(v.here.BRtt)}, and r = σ×BR / ATLAS limit = ${cdmNum(v.values.r_tt_observed.value)} — at the edge (a comparison with ATLAS's 30%-width benchmark, not an exclusion)`,
        es: v => `A 3,75 TeV: Γ/M = ${cdmNum(v.here.GoverM)}, BR(tt̄) = ${cdmNum(v.here.BRtt)} y r = σ×BR / límite de ATLAS = ${cdmNum(v.values.r_tt_observed.value)}: en el borde (comparación con la plantilla del 30 % de ATLAS, no una exclusión)`,
        hl: '#rx_kkgluon_result > p' },
      { en: () => 'The tt̄ rate against the ATLAS observed limit, as the mass is scanned',
        es: () => 'La tasa tt̄ frente al límite observado de ATLAS, barriendo la masa',
        hl: '#rx_kkgluon_result svg', index: 0 },
      { en: v => `The m(tt̄) spectrum in the 15 CMS bins: the interference with the QCD gluon is ${v.values.interference_below_pole.value} below the pole (light-quark and top couplings of opposite sign)`,
        es: v => `El espectro m(tt̄) en los 15 intervalos de CMS: la interferencia con el gluón de QCD es ${v.values.interference_below_pole.value === 'constructive' ? 'constructiva' : 'destructiva'} bajo el polo (acoplos del quark ligero y del top de signo opuesto)`,
        hl: '#rx_kkgluon_result svg', index: 2 },
      { en: () => 'Now the flat GHU coloron at 4.5 TeV: every quark couples √2 g_s',
        es: () => 'Ahora el coloron de GHU plana a 4,5 TeV: todos los quarks acoplan √2 g_s',
        button: 'Flat GHU coloron · 4.5 TeV' },
      { en: v => `Same-sign couplings: the interference turns ${v.values.interference_below_pole.value} and the low bins go down (largest change ${cdmNum(100 * v.values.tt_spectrum_largest_shift.value, 1)}%)`,
        es: v => `Acoplos del mismo signo: la interferencia se vuelve ${v.values.interference_below_pole.value === 'destructive' ? 'destructiva' : 'constructiva'} y los intervalos bajos bajan (mayor cambio ${cdmNum(100 * v.values.tt_spectrum_largest_shift.value, 1)} %)`,
        hl: '#rx_kkgluon_result svg', index: 2 },
      { en: v => `Expected Δχ² against the CMS covariance with 10% SM-theory error: ${cdmNum(v.values.tt_spectrum_dchi2.value)}; it falls to 3.84 at ${cdmNum(v.values.tt_spectrum_reach_GeV.value / 1000)} TeV`,
        es: v => `Δχ² esperado frente a la covarianza de CMS con un 10 % de error teórico del SM: ${cdmNum(v.values.tt_spectrum_dchi2.value)}; baja a 3,84 a ${cdmNum(v.values.tt_spectrum_reach_GeV.value / 1000)} TeV`,
        hl: '#rx_kkgluon_result svg', index: 3 },
      { en: () => 'Set the SM theory uncertainty to zero…',
        es: () => 'Pon a cero la incertidumbre teórica del SM…',
        set: ['#rx_kkgluon_controls [data-rx="ttTheory"]', 0] },
      { en: v => `…and the reach moves to ${cdmNum(v.values.tt_spectrum_reach_GeV.value / 1000)} TeV: the comparison is only as good as the SM prediction it assumes`,
        es: v => `…y el alcance pasa a ${cdmNum(v.values.tt_spectrum_reach_GeV.value / 1000)} TeV: la comparación vale lo que vale la predicción del SM que supone`,
        hl: '#rx_kkgluon_result svg', index: 3 },
    ],
    explain: {
      en: { title: '📊 How to read this card',
        lines: ['<b>r = prediction / published limit</b>, in each experiment\'s own convention. r ≥ 1 means the leading-order rate exceeds that benchmark\'s limit — a comparison, not a validated exclusion at another width.',
          '<b>The m(tt̄) spectrum</b> includes the interference with QCD, whose sign below the pole is −sign(v<sub>q</sub>v<sub>t</sub>), v = (c<sub>L</sub>+c<sub>R</sub>)/2.',
          '<b>Δχ²</b> is the separation of SM and SM + KK gluon in units of the CMS covariance if the data equal the SM: a sensitivity, not a limit. It moves with the SM theory error you assume.',
          '<b>Certificates</b> (open the box below the tables): couplings against a 40-digit reference; ATLAS\'s and CMS\'s own theory curves reproduced; the spectrum against an independent Dirac-trace and LHAPDF computation, recomputed in this page.',
          '👉 <b>Now try your own point:</b> change the mass, kL or any c value above; every number recomputes.'] },
      es: { title: '📊 Cómo leer esta tarjeta',
        lines: ['<b>r = predicción / límite publicado</b>, en la convención de cada experimento. r ≥ 1 significa que la tasa a primer orden supera el límite de ese benchmark: una comparación, no una exclusión validada a otra anchura.',
          '<b>El espectro m(tt̄)</b> incluye la interferencia con QCD, cuyo signo bajo el polo es −signo(v<sub>q</sub>v<sub>t</sub>), v = (c<sub>L</sub>+c<sub>R</sub>)/2.',
          '<b>Δχ²</b> es la separación entre SM y SM + gluón KK en unidades de la covarianza de CMS si los datos son el SM: una sensibilidad, no un límite. Se mueve con el error teórico del SM que supongas.',
          '<b>Certificados</b> (abre la caja bajo las tablas): acoplos frente a una referencia de 40 dígitos; las curvas teóricas de ATLAS y CMS reproducidas; el espectro frente a un cálculo independiente con trazas de Dirac y LHAPDF, recalculado en esta página.',
          '👉 <b>Prueba ahora tu propio punto:</b> cambia la masa, kL o cualquier c arriba; todo se recalcula.'] },
    },
  },
};

function cdmSleep(ms) {
  return new Promise((resolve, reject) => setTimeout(() => CDM_STATE.cancel ? reject(new Error('demo stopped')) : resolve(), ms * CDM_URL.speed));
}
function cdmCss() {
  if (document.getElementById('cdm_css')) return;
  const s = document.createElement('style'); s.id = 'cdm_css';
  s.textContent = '.cdm-hl{outline:3px solid #34b3e0!important;outline-offset:3px;border-radius:6px;box-shadow:0 0 0 6px rgba(52,179,224,.25)!important;transition:all .3s}' +
    '#cdm_banner{position:fixed;top:0;left:0;right:0;z-index:100000;padding:12px 52px 12px 20px;font:600 16px/1.45 system-ui,sans-serif;color:#fff;text-align:center;background:linear-gradient(135deg,#0b5e7a,#2a9fc4);box-shadow:0 2px 14px rgba(0,0,0,.35);transition:opacity .3s}' +
    '#cdm_banner button{position:absolute;right:12px;top:8px;background:transparent;border:1px solid #fff8;color:#fff;border-radius:6px;padding:2px 9px;cursor:pointer;width:auto}' +
    '#cdm_explain{margin:16px 0;padding:14px 18px;border-radius:10px;border:1px solid var(--line,#cfd8de);background:var(--card,#fff);box-shadow:0 4px 16px rgba(0,0,0,.08);line-height:1.55}' +
    '#cdm_explain h3{margin:0 0 8px;color:#0b5e7a}#cdm_explain p{margin:6px 0}';
  document.head.appendChild(s);
}
function cdmBanner(html, step, total) {
  let el = document.getElementById('cdm_banner');
  if (!el) {
    el = document.createElement('div'); el.id = 'cdm_banner'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  const word = cdmLang() === 'es' ? 'Paso' : 'Step';
  el.innerHTML = (step ? `<span style="opacity:.8">${word} ${step}/${total} · </span>` : '') + html +
    `<button type="button" aria-label="${cdmLang() === 'es' ? 'Parar la demo' : 'Stop the demo'}">✕</button>`;
  el.querySelector('button').onclick = () => { CDM_STATE.cancel = true; cdmHide(); };
}
function cdmHide() { document.getElementById('cdm_banner')?.remove(); document.querySelectorAll('.cdm-hl').forEach(e => e.classList.remove('cdm-hl')); }
function cdmHighlight(selector, index = 0) {
  document.querySelectorAll('.cdm-hl').forEach(e => e.classList.remove('cdm-hl'));
  const el = document.querySelectorAll(selector)[index];
  if (el) { el.classList.add('cdm-hl'); el.scrollIntoView({ block: 'center', behavior: CDM_URL.speed < 1 ? 'auto' : 'smooth' }); }
  return el;
}
async function cdmRun(id) {
  const d = CDM_DEMOS[id];
  if (!d || CDM_STATE.running) return;
  CDM_STATE.running = true; CDM_STATE.cancel = false; cdmCss();
  document.getElementById('cdm_explain')?.remove();
  const lang = cdmLang(), total = d.steps.length;
  try {
    for (let i = 0; i < total; i++) {
      const s = d.steps[i];
      if (s.button) {
        const b = [...document.querySelectorAll(`#rx_${id} button`)].find(x => x.textContent.trim() === s.button);
        if (!b) throw new Error('demo: button not found: ' + s.button);
        cdmBanner(s[lang](d.model()), i + 1, total); cdmHighlight(`#rx_${id} button`, [...document.querySelectorAll(`#rx_${id} button`)].indexOf(b));
        await cdmSleep(1400); b.click(); await cdmSleep(900);
      } else if (s.set) {
        const [sel, value] = s.set, input = document.querySelector(sel);
        if (!input) throw new Error('demo: control not found: ' + sel);
        cdmBanner(s[lang](d.model()), i + 1, total); cdmHighlight(sel);
        await cdmSleep(1400); input.value = String(value); input.dispatchEvent(new Event('change', { bubbles: true })); await cdmSleep(900);
      } else {
        await cdmSleep(150);
        const v = d.model();
        cdmBanner(s[lang](v), i + 1, total); cdmHighlight(s.hl, s.index || 0);
        await cdmSleep(3600);
      }
    }
    cdmHide();
    const x = d.explain[lang], p = document.createElement('div'); p.id = 'cdm_explain';
    p.innerHTML = `<h3>${x.title}</h3>` + x.lines.map(l => `<p>${l}</p>`).join('');
    document.getElementById(`rx_${id}_result`)?.after(p);
    p.scrollIntoView({ block: 'center', behavior: CDM_URL.speed < 1 ? 'auto' : 'smooth' });
    cdmBanner(lang === 'es' ? '✓ Hecho. Lee la explicación de abajo y prueba tu propio punto.' : '✓ Done. Read the explanation below and try your own point.', 0, 0);
    setTimeout(() => { if (!CDM_STATE.running) cdmHide(); }, 12000 * CDM_URL.speed);
  } catch (e) {
    cdmHide();
    if (!CDM_STATE.cancel) console.warn('card demo failed:', e && e.message);
  } finally { CDM_STATE.running = false; }
}
/* Called by rxMount: a button in the card heading, and the one-shot autostart from the link. */
function cdmButton(id) {
  if (!CDM_DEMOS[id] || typeof document === 'undefined' || typeof document.querySelector !== 'function') return;   // Node smoke runs with a stub DOM
  const h = document.querySelector(`#rx_${id} h2`);
  if (h && !h.querySelector('.cdm-btn')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost cdm-btn';
    b.textContent = '🎬 Demo'; b.title = cdmLang() === 'es' ? 'Mira una simulación guiada de esta tarjeta' : 'Watch a guided simulation of this card';
    b.style.cssText = 'margin-left:10px;width:auto;padding:2px 10px;font-size:13px;vertical-align:middle';
    b.onclick = () => cdmRun(id); h.appendChild(b);
  }
  if (CDM_URL.demo === id && !CDM_STATE.autostarted) {
    CDM_STATE.autostarted = true;
    setTimeout(() => { document.getElementById(`rx_${id}`)?.scrollIntoView({ block: 'start' }); cdmRun(id); }, 900 * CDM_URL.speed);
  }
}
