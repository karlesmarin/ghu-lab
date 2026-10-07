/* Fixed-budget, offline study. Every row carries its inputs and unevaluated points. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {niModel,NI_AXES} from '../src/modules/neutrino_research.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const dest=resolve(root,process.argv[2]||'research/2026-10-07-neutrinos');mkdirSync(dest,{recursive:true});
const bytes=readFileSync(resolve(root,'data/icecube_deepcore_reference.json')),reference=JSON.parse(bytes);
const sha=p=>{const bytes=readFileSync(resolve(root,p));return createHash('sha256').update(p.endsWith('.mjs')?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')):bytes).digest('hex');};
const cases=[];
for(const order of [0,1])for(let axis=0;axis<NI_AXES.length;axis++){
  const r=niModel({axis,position:1},{order},{},reference,40);
  cases.push({id:(order===0?'NO':'IO')+'-'+r.axis.key,...r});
}
const summary=cases.map(r=>({id:r.id,...r.summary,deepcoreReferenceDeltaChi2:r.deepcore.deltaChi2,
  maxNormalizedShapeDifference:Math.max(...r.rows.filter(x=>x.valid).map(x=>x.maxShapeDifference))}));
const record={schema:'ghu-neutrino-identifiability-study-v1',date:'2026-10-07',
  question:'Which ring directions vary while reconstructing the same supplied light masses and PMNS orientation?',
  budget:{orderings:2,axes:9,pointsPerAxis:41,totalScanPoints:738,shapeSamplesPerPoint:81,LoverERange:[0,2000]},
  provenance:{sourceHashConvention:'UTF-8 JavaScript with CRLF normalized to LF; data JSON uses its original bytes.',files:Object.fromEntries(['tools/neutrino_identifiability.mjs','src/modules/neutrino_research.mjs','src/modules/neutrino_flavour.mjs','src/modules/neutrino_ring.mjs','data/icecube_deepcore_reference.json'].map(p=>[p,sha(p)])),dataset:reference.provenance},
  scope:cases[0].scope,interpretation:'Reconstruction identities test the implementation; they are not independent predictions or a proof of model identifiability. Sampled response does not certify global extrema. Different observables require the stated additional experimental modeling.',
  summary,cases};
writeFileSync(resolve(dest,'study.json'),JSON.stringify(record,null,2)+'\n');
writeFileSync(resolve(dest,'summary.json'),JSON.stringify({budget:record.budget,summary,scope:record.scope},null,2)+'\n');
console.log(JSON.stringify({points:738,evaluated:summary.reduce((a,r)=>a+r.valid,0),maxLightResidualEV:Math.max(...summary.map(r=>r.maxLightResidualEV)),normal:summary.filter(r=>r.id.startsWith('NO-'))},null,2));
