/* Generate the in-app guided demos (🎬) from the same script the video guide is recorded from, so the demo and the
 * video say the same thing and run the same actions (one source: tools/video_guide/storyboard.json), and close each
 * demo with the "how to read it" of its user guide (docs/user-guides*.json).
 *   node tools/make_demo_scripts.mjs   -> src/view/demo_scripts.mjs
 * The narration is written for a synthetic voice ("G H U", "S U seven"); `cdmDisplay` turns it back into what a
 * reader expects on screen ("GHU", "SU(7)"), and the generator refuses to write if a spelled-out acronym survives.
 * build/demos.mjs runs every generated demo in a real browser. */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const raw = p => readFileSync(resolve(root, p)), J = p => JSON.parse(raw(p).toString('utf8'));
const sha = p => createHash('sha256').update(raw(p)).digest('hex');

const NUM = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10};
export function cdmDisplay(text) {
  let t = text.replace(/\bS U (one|two|three|four|five|six|seven|eight|nine|ten|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/g,
    (_, n) => `SU(${NUM[n]})`);
  // runs of single capital letters separated by spaces were spelled out for the voice: join them back
  t = t.replace(/\b[A-Z](?: [A-Z]\b)+/g, m => m.replace(/ /g, ''));
  // decimals spelled for the voice ("zero point seven", "cinco coma dos") are written as numbers again
  const D = {zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9};
  const w = Object.keys(D).join('|');
  t = t.replace(new RegExp(`\\b(${w}) (point|coma)((?: (?:${w}))+)\\b`, 'gi'),
    (_, a, sep, rest) => `${D[a.toLowerCase()]}${sep.toLowerCase() === 'point' ? '.' : ','}${rest.trim().split(' ').map(x => D[x.toLowerCase()]).join('')}`);
  return t;
}

/* writes only when run as a script: importing cdmDisplay (the harness does) must not rewrite the module it checks */
function main() {
const plan = J('tools/video_guide/storyboard.json');
const guides = {en: J('docs/user-guides.json').guides, es: J('docs/user-guides.es.json').guides};
const GUIDE_OF = {start: 'getting-started', 'higgs-production': 'simulator-higgsrate', 'neutrino-ring': 'simulator-neutrino',
  'cms-hnl': 'simulator-neutrino', decays: 'neutrino-decays', exports: 'getting-started'};
const guideFor = (id, lang) => guides[lang].find(g => g.id === (GUIDE_OF[id] || id)) || null;

// sentences that only make sense in the video (chapters, a recorded walkthrough) are rewritten for a demo;
// each original must exist, so a storyboard edit cannot silently bypass the rewrite
const REWRITE = [
  ['start', 0, 'en', 'This revised walkthrough covers every menu section, the three Simulator modes and the embedded research experiments.',
    'Every menu section, Simulator mode and experiment card has its own 🎬 Demo like this one.'],
  ['start', 0, 'en', ' Choose a chapter to revisit a topic.', ''],
  ['start', 0, 'es', 'Este recorrido actualizado muestra todas las secciones del menú, los tres modos del simulador y los experimentos integrados.',
    'Cada sección del menú, modo del simulador y tarjeta de experimento tiene su propia 🎬 Demo como esta.'],
  ['start', 0, 'es', ' Elige un capítulo para volver a un tema.', ''],
  ['exports', 2, 'en', 'Return to a chapter, vary one assumption,', 'Return to any section, vary one assumption,'],
  ['exports', 2, 'es', 'Vuelve al capítulo que necesites, modifica una hipótesis', 'Vuelve a la sección que necesites, modifica una hipótesis'],
  ['start', 0, 'en', ' Every section and card also has a Demo button that runs a guided simulation.', ''],
  ['start', 0, 'es', ' Cada sección y cada tarjeta tiene además un botón Demo con una simulación guiada.', ''],
  ['kkgluon', 1, 'en', 'Stop the demo and take over: load', 'Load'],
  ['kkgluon', 1, 'es', 'Para la demo y toma el control: carga', 'Carga'],
];
for (const [id, k, lang, from, to] of REWRITE) {
  const step = plan.chapters.find(c => c.id === id).steps[k], key = lang === 'es' ? 'textES' : 'text';
  if (!step[key].includes(from)) { console.error('rewrite target not found:', id, k, lang, from); process.exit(1); }
  step[key] = step[key].replace(from, to);
}
// the video starts a card's own 🎬 Demo and stops it; inside a demo those two actions would call the demo from itself,
// so the step that starts it is dropped and the stop is removed (after the rewrites, whose indices are the storyboard's)
const STARTS_DEMO = (a) => /\.cdm-btn\b/.test(a.selector || ''), STOPS_DEMO = (a) => /\[data-cdm-stop\]/.test(a.selector || '');
for (const c of plan.chapters)
  c.steps = c.steps.filter(s => !s.actions.some(STARTS_DEMO)).map(s => ({...s, actions: s.actions.filter(a => !STOPS_DEMO(a))}));

const chapters = plan.chapters.map(c => {
  const card = c.steps.some(s => (s.focus?.selector || '').startsWith(`#rx_${c.id}`)) ? `rx_${c.id}` : null;
  const close = {};
  for (const lang of ['en', 'es']) {
    const g = guideFor(c.id, lang);
    close[lang] = g ? {read: g.read, expect: g.example?.expect || null, guide: g.id} : null;
  }
  return {id: c.id, host: c.host, card, title: c.title, titleES: c.titleES, setup: c.setup || [],
    steps: c.steps.map(s => ({en: cdmDisplay(s.text), es: cdmDisplay(s.textES), actions: s.actions, focus: s.focus})), close};
});
// a spelled-out acronym that survived would be read on screen as "C M S": refuse
const leftovers = chapters.flatMap(c => c.steps.flatMap(s => [s.en, s.es])).filter(t => /\b[A-Z] [A-Z]\b/.test(t));
if (leftovers.length) { console.error('spelled-out capitals survive:', leftovers.slice(0, 3)); process.exit(1); }
const missingClose = chapters.filter(c => !c.close.en || !c.close.es).map(c => c.id);
const data = {source: {storyboard: 'tools/video_guide/storyboard.json', storyboardSha256: sha('tools/video_guide/storyboard.json'),
  guides: ['docs/user-guides.json', 'docs/user-guides.es.json'], guidesSha256: [sha('docs/user-guides.json'), sha('docs/user-guides.es.json')],
  revision: plan.revision}, chapters};
const head = `/* Generated by tools/make_demo_scripts.mjs — do not edit by hand. Guided demos from the video storyboard and the user guides.\n` +
  ` * Sources: tools/video_guide/storyboard.json sha256 ${data.source.storyboardSha256}; docs/user-guides(.es).json */\n`;
writeFileSync(resolve(root, 'src/view/demo_scripts.mjs'), head + `export const CDM_SCRIPTS=${JSON.stringify(data)};\n`);
console.log('demo scripts:', chapters.length, 'chapters,', chapters.filter(c => c.card).length, 'cards,',
  chapters.reduce((n, c) => n + c.steps.length, 0), 'steps; without a guide close:', missingClose.join(',') || 'none');
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
