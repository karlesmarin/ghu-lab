import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CDM_SCRIPTS} from './src/view/demo_scripts.mjs';
import {cdmDisplay} from './tools/make_demo_scripts.mjs';
let passed = 0; const check = (s, c) => { assert.ok(c, s); passed++; };
const raw = p => readFileSync(new URL(p, import.meta.url)), sha = p => createHash('sha256').update(raw(p)).digest('hex');
const plan = JSON.parse(raw('./tools/video_guide/storyboard.json'));

/* the demos are generated from the video storyboard and the guides: a change to either without regenerating fails */
check('demo scripts were generated from the current storyboard (run node tools/make_demo_scripts.mjs)', CDM_SCRIPTS.source.storyboardSha256 === sha('./tools/video_guide/storyboard.json'));
check('demo scripts were generated from the current guides', CDM_SCRIPTS.source.guidesSha256[0] === sha('./docs/user-guides.json') && CDM_SCRIPTS.source.guidesSha256[1] === sha('./docs/user-guides.es.json'));
check(`one demo per storyboard chapter (${plan.chapters.length})`, CDM_SCRIPTS.chapters.length === plan.chapters.length);
for (const [i, c] of plan.chapters.entries()) {
  const d = CDM_SCRIPTS.chapters[i];
  check(`${c.id}: same host and actions as the video`, d.id === c.id && d.host === c.host && JSON.stringify(d.steps.map(s => s.actions)) === JSON.stringify(c.steps.map(s => s.actions)) && JSON.stringify(d.setup) === JSON.stringify(c.setup || []));
  check(`${c.id}: a closing "how to read it" in both languages`, !!(d.close.en?.read && d.close.es?.read));
}
/* the display transform: what the voice needed is not what a reader should see */
check('spelled acronyms are joined', cdmDisplay('the C M S limit and G H U Lab') === 'the CMS limit and GHU Lab');
check('SU(n) is restored in both languages', cdmDisplay('the S U seven model') === 'the SU(7) model' && cdmDisplay('el modelo S U siete') === 'el modelo SU(7)');
check('spelled decimals become numbers', cdmDisplay('set it to zero point seven') === 'set it to 0.7' && cdmDisplay('a cinco coma dos') === 'a 5,2');
check('ordinary prose is untouched', cdmDisplay('A point of view, one coma later.') === 'A point of view, one coma later.');
check('no spelled-out acronym survives in any demo', !CDM_SCRIPTS.chapters.some(c => c.steps.some(s => /\b[A-Z] [A-Z]\b/.test(s.en + ' ' + s.es))));
check('no video-only wording ("choose a chapter") survives', !CDM_SCRIPTS.chapters.some(c => c.steps.some(s => /choose a chapter|elige un capítulo|walkthrough|recorrido actualizado/i.test(s.en + ' ' + s.es))));
console.log(`${passed} passed, 0 failed (demo scripts = video storyboard + guides, display transform, staleness)`);
