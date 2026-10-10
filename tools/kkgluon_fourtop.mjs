/* Offline study: the first KK gluon as a spin-1 colour octet in four-top production.
 * Question (open in arXiv:2609.39381: "a dedicated study of alternative spin ... for future work"):
 * where do the two GHU realisations of a vector colour octet sit relative to a four-top search?
 *   flat GHU  -- collider.mjs: quarks at the fixed point, every mode couples sqrt2*g_s, Gamma/M = 2 alpha_s (theorems).
 *   warped    -- src/modules/rs_fermions.mjs (same c convention as ruFermion: LH UV-localised for c > 1/2,
 *                RH UV-localised for c < -1/2), every number with its certificate.
 * Only ratios. The quark c values are ILLUSTRATIVE inputs (stated per row), not fitted to masses or EWPT.
 */
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {coloronOf} from '../src/modules/collider.mjs';
import {rfModel} from '../src/modules/rs_fermions.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const dest=resolve(root,process.argv[2]||'research/2026-10-10-kkgluon-fourtop');mkdirSync(dest,{recursive:true});
const sha=p=>createHash('sha256').update(Buffer.from(readFileSync(resolve(root,p)).toString('utf8').replace(/\r\n/g,'\n'))).digest('hex');

const MT=172.5,ps=(mq,M)=>{const r=4*mq*mq/(M*M);return r>=1?0:Math.sqrt(1-r)*(1+r/2);};
const cases=[];
for(const M of [2000,4000,6600]){
  const al=coloronOf(M).alphas,w=[...Array(5).fill(4),4*ps(MT,M)],tot=w.reduce((s,x)=>s+x,0);
  cases.push({realisation:'flat GHU (Part VII coloron)',M_GeV_for_running_and_phase_space:M,alphas:al,
    g_top_over_gs:Math.SQRT2,BR_tt:w[5]/tot,BR_4t_pair:(w[5]/tot)**2,GoverM:al/12*tot,
    status:{couplings:'theorem',width:'theorem x measured alpha_s',BR:'measured'},
    certificate:{claim:'universal sqrt2 g_s and Gamma/M = 2 alpha_s',check:'collider.mjs coloronOf; _test_collider.mjs'}});
}
for(const kL of [26.67,35])for(const cRt of [0,.3,.5])for(const M of [3000,5000]){
  const r=rfModel({kL,MGeV:M,cL:{light:.6,Q3:.3},cR:{light:-.6,tR:cRt,bR:-.6}});
  const v=Object.fromEntries(Object.entries(r.values).map(([k,x])=>[k,x.value===null?{unknown:x.reason}:{value:x.value,status:x.status}]));
  cases.push({realisation:'warped KK gluon',kL,c:r.parameters,M_GeV_for_running_and_phase_space:M,alphas:r.alphas,
    values:v,certificates:r.certificates,
    BR_tt:r.values.BR_tt.value,BR_4t_pair:r.values.BR_4t_pair.value,GoverM:r.values.GoverM.value,g_tR_over_gs:r.values.g_tR.value});
}
const record={schema:'ghu-kkgluon-fourtop-study-v2',date:'2026-10-10',
  question:'Where do the flat and warped GHU vector colour octets sit relative to a four-top search (open spin-1 question of arXiv:2609.39381)?',
  provenance:{sourceHashConvention:'UTF-8 with CRLF normalised to LF',files:Object.fromEntries(
    ['tools/kkgluon_fourtop.mjs','src/modules/rs_fermions.mjs','src/modules/collider.mjs','data/rs_fermions_reference.json'].map(p=>[p,sha(p)]))},
  cases,
  scope:'Leading-order partial widths to quark pairs only; no production cross section, no interference, no detector. Ratios only.',
  unknown:['production cross sections (planned: parton luminosities)','fit of c to quark masses','fermion KK towers'],
  interpretation:'Flat: democratic couplings, BR(tt) about 1/6, four tops by pair decay under 3%; the dijet bound applies. Warped: top-philic (BR(tt) above 0.8) and broad (Gamma/M 0.12-0.28). Known qualitatively in the RS literature; reproduced here with certified numerics.'};
writeFileSync(resolve(dest,'study.json'),JSON.stringify(record,null,2)+'\n');
console.log(cases.map(r=>[r.realisation,r.kL??'',r.c?.cR?.tR??'',r.M_GeV_for_running_and_phase_space,r.BR_tt.toFixed(3),r.BR_4t_pair.toFixed(3),r.GoverM.toFixed(3),(r.g_tR_over_gs??Math.SQRT2).toFixed(2)].join('  ')).join('\n'));
