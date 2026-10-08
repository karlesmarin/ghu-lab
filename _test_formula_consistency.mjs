import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FORMULA_CONSISTENCY} from './src/modules/formula_consistency_reference.mjs';
import {sun5dBlocks,sun5dTerms,sun5dMinimum,sun5dMinimumRestarts,sun5dV,sun5dTermTable} from './src/modules/sun5d.mjs';
import {vac5Symmetry,vac5Matrices,vac5RepMatrix,vac5Rank} from './src/modules/vacuum5d.mjs';
import {predictHessian,predictHessianFiniteDifference} from './src/modules/predict.mjs';
import {F,F1minusF0,stabilityW,Z3,Z5} from './src/kernel/potential.mjs';
import {cbCombEvidence} from './src/modules/candidate_bounds.mjs';
import {screenK} from './src/kernel/screens.mjs';
let checks=0;
const ok=(x,m)=>{assert.ok(x,m);checks++;};
const close=(a,b,eps,m)=>ok(Math.abs(a-b)<=eps,m+': '+a+' vs '+b);
const B=(a)=>sun5dBlocks({nPP:a[0],nPM:a[1],nMP:a[2],nMM:a[3]});
const b=B([1,0,0,2]);
const currentData=readFileSync(new URL('./data/su7_km25.json',import.meta.url),'utf8').replace(/\r\n/g,'\n');
ok(createHash('sha256').update(currentData).digest('hex')===FORMULA_CONSISTENCY.inputSHA256,'interval certificate matches current potential transcription');
ok(FORMULA_CONSISTENCY.checks.every(c=>c.passed)&&FORMULA_CONSISTENCY.su7.every(r=>r.Fprime_enclosure.every(x=>Number(x)<0)),'Sage intervals exclude stationarity in all five rounded rows');
for(const nf of [0,1,2]){
 const terms=sun5dTerms(b,{gauge:true,bulk:[{rep:'fund',eta:1,kind:'dirac',multiplicity:nf}]});
 const minimum=sun5dMinimum(terms,1,{grid:120,windings:600});
 close(minimum.V,sun5dV(terms,minimum.theta,600),1e-13,'minimum uses V/C without a second half');
 close(minimum.symmetric,sun5dV(terms,[0],600),1e-13,'theta0 normalization');
 close(minimum.other,sun5dV(terms,[1],600),1e-13,'theta1 normalization');
 const tt=sun5dTermTable(terms,{phases:1});
 for(const a of [0,.13,.6,1])close(F(tt,a),sun5dV(terms,[a]),1e-10,'term-table bridge includes half already');
 close(F1minusF0(stabilityW(tt)),minimum.other-minimum.symmetric,1e-9,'endpoint identity in identical units');
 const restart=sun5dMinimumRestarts(terms,1,{restarts:4,windings:600});
 close(restart.V,sun5dV(terms,restart.theta,600),1e-13,'restart normalization');
 for(const m of restart.minima)close(m.V,sun5dV(terms,m.theta,600),1e-13,'each restart depth normalization');
 ok(minimum.certified===false&&restart.certified===false,'numerical searches do not certify global optimality');
 if(nf===1)close(minimum.V,-2.5*Z5,1e-10,'independent KLY Nf1 analytic depth');
 if(nf===2){const s=vac5Symmetry(b,minimum.theta);ok(minimum.atEdge&&s.broken&&s.generatorsBefore===4&&s.generatorsAfter===2,'KLY Nf2 breaks SU2 at the endpoint');}
}
// Independent dense intersection of the three invariant matrix spaces; includes
// symmetry rearrangement with equal dimensions, B-pairs and a boundary face.
for(const blocks of [[1,0,0,2],[2,1,0,1],[2,0,0,2],[0,2,2,0],[1,1,1,1]]){
 const b=B(blocks),zero=vac5Matrices(b,[]);
 for(const theta of [Array(b.phases).fill(0),Array(b.phases).fill(1),Array(b.phases).fill(.37),Array.from({length:b.phases},(_,i)=>i===0?0:.37)]){
  const s=vac5Symmetry(b,theta),M=vac5Matrices(b,theta),d=b.N**2;
  const equations=[zero.P0,zero.P1,M.P1].flatMap(P=>vac5RepMatrix(P,'adj').map((r,i)=>Array.from(r,(v,j)=>v-(i===j?1:0))));
  const preserved=d-vac5Rank(equations)-1;
  ok(s.broken===(preserved<s.generatorsBefore),'commutant classifier agrees with dense three-parity intersection');
 }
}
const rearranged=vac5Symmetry(B([2,1,0,1]),[1]);
ok(rearranged.broken&&rearranged.generatorsBefore===rearranged.generatorsAfter,'equal dimensions cannot rule out breaking');
const pair=B([2,0,0,2]),terms=sun5dTerms(pair,{gauge:true,bulk:[]}),theta=[.21,.37];
const h=predictHessian(terms,theta,{windings:600}),fd=predictHessianFiniteDifference(terms,theta,{windings:600,h:1e-4});
const fine=predictHessian(terms,theta,{windings:1200});
for(let i=0;i<2;i++)for(let j=0;j<2;j++){
 close(h.H[i][j],fd.H[i][j],2e-4,'analytic Hessian agrees with independent differences');
 ok(Math.abs(h.H[i][j]-fine.H[i][j])<=h.truncationErrorBound[i][j]+1e-10,'Hessian refinement is enclosed by analytic tail');
}
const single=predictHessian([{m:2,v:[1],d:0}],[0],{windings:600});
close(single.H[0][0],-(Math.PI**2)*Z3,single.truncationErrorBound[0][0]+1e-12,'analytic Hessian at zero from zeta3');
ok(h.method==='analytic-fourier'&&!h.roundingCertified,'derivative method and certification scope explicit');
for(const seed of ['published','candidate'])for(const tweak of [{},{mh:130},{mW:80.38},{g4:.65},{mh:null}]){
 const e=cbCombEvidence({mh:125.2,mW:80.4,g4:.63,seed,MKK:9000,...tweak});
 ok(e.rows.every(r=>(r.upperGeV!==null)===e.bounds.applicable),'same applicability gate for all comb rows');
 ok(e.rows.every(r=>r.k8D%2===(seed==='published'?1:0)),'seed parity preserved');
 for(const h of e.hits)ok(h.withinConditionalBound===(e.bounds.applicable?h.M<=h.upperGeV:null),'match verdict uses only its own applicable certificate');
 ok(!e.attainmentEstablished&&!e.fullPotentialCertified&&e.globalTheoryFit===null,'no promotion of an upper bound to attainability');
 ok(e.reason.includes('not a theory exclusion')||!e.valid,'screen does not turn limited tooth sampling into exclusion');
}
const k=screenK({alpha:.1,mh:125,F2:2,mW:80.4}),scaled=screenK({alpha:.1,mh:125,F2:8,mW:80.4});
close(scaled.K,k.K/2,1e-13,'fixed input Higgs mass makes K depend on potential normalization');
console.log(`${checks} checks pass`);
