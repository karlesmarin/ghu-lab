import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {brxRobinRoots,brxProfileGram,brxGramSpectrum,brxTwistedMoment,brxSU2TensorCondition,brxFamilyCondition,brxModel} from './src/modules/boundary_research.mjs';
const ref=JSON.parse(readFileSync(new URL('./data/boundary_research_reference.json',import.meta.url)));
let passed=0;const check=(name,ok)=>{assert.ok(ok,name);passed++;};
for(const r of ref.robin){const out=brxRobinRoots(r.strength);out.forEach((v,i)=>check(`Robin ${r.strength}, ${i}`,Math.abs(v.x-r.x[i])<2e-12&&v.residual<2e-14));}
for(const r of ref.grams){const out=brxProfileGram(r.mass);out.values.forEach((v,i)=>check(`Gram ${r.mass}, ${i}`,Math.abs(v-r.values[i])<1e-10*Math.max(1,Math.abs(v))));}
for(const r of ref.moments)r.values.forEach(([n,d],degree)=>{const v=brxTwistedMoment(r.rank,r.mask,degree,r.cartan,r.halfSpin);check(`trace ${r.rank}/${r.mask}/${r.halfSpin}/${degree}`,v.n===n&&v.d===d);});
check('zero coupling retains zero root',brxRobinRoots(0)[0].x===0);
check('positive coupling removes normal zero root',brxRobinRoots(.001)[0].x>0);
check('large coupling approaches Dirichlet value from below',brxRobinRoots(100)[0].kR<.5&&brxRobinRoots(100)[0].kR>.49);
check('massless profile example has rank two',brxProfileGram(0).rank===2);
check('massive profiles have rank three despite overlap',brxProfileGram(1).rank===3&&Math.abs(brxProfileGram(1).real[0][1])>0);
check('duplicate angles do not create independent profiles',brxProfileGram(1,[0,0,Math.PI]).rank===2);
check('three identical families meet the restricted condition',brxFamilyCondition(3,-1).passes&&brxFamilyCondition(3,1).passes);
check('one identical family fails that condition',!brxFamilyCondition(1,-1).passes&&!brxFamilyCondition(1,1).passes);
check('mixed six-dimensional assignments permit two families',brxSU2TensorCondition(2+4).passes);
check('global cancellation remains unknown',brxModel().values.fullAnomalyCancellation.value===null&&brxModel().values.fullAnomalyCancellation.status==='unknown');
for(const f of [()=>brxRobinRoots(-1),()=>brxRobinRoots(NaN),()=>brxRobinRoots(1,0),()=>brxTwistedMoment(11,3,2,[]),()=>brxTwistedMoment(4,3,5,[1,1,1,1]),()=>brxTwistedMoment(4,3,2,[1.5,0,0,0]),()=>brxFamilyCondition(3,0),()=>brxSU2TensorCondition(.5),()=>brxModel({theta:Infinity}),()=>brxGramSpectrum([[1,2],[0,1]],[[0,0],[0,0]]),()=>brxGramSpectrum([[-1]],[[0]])]){assert.throws(f);passed++;}

const landscape=brxModel().landscape;
check('map zero-coupling edge is the Wilson-only branch',landscape.masses[0].every((v,j)=>Math.abs(v-landscape.theta[j]/(2*Math.PI))<1e-14));
check('map independently tabulated roots remain below half a unit',landscape.roots.every(k=>k>=0&&k<.5));
check('map mass increases with coupling',landscape.masses.every((row,i)=>!i||row.every((v,j)=>v>=landscape.masses[i-1][j])));
check('map mass increases with imposed angle',landscape.masses.every(row=>row.every((v,j)=>!j||v>=row[j-1])));
check('view controls leave scientific outputs invariant',JSON.stringify(brxModel({viewMode:1,viewAngle:65}).atTheta)===JSON.stringify(brxModel().atTheta));
check('high coupling remains in displayed domain',brxModel({strength:100}).landscape.maxStrength===100);
const generic=brxModel().neutralComplex, restored=brxModel({neutralBranch:1}).neutralComplex;
check('finite strata separate gauge rank and quotient',generic.rankM===5&&generic.quotient===0&&restored.rankM===4&&restored.quotient===1&&restored.kernelM===1);
check('numeric angle cannot silently select the exact stratum',brxModel({theta:0}).neutralComplex.quotient===0&&brxModel({theta:1e-14,neutralBranch:1}).neutralComplex.quotient===1);
check('finite result retains certificate and scope',/^[0-9a-f]{64}$/.test(restored.certificateSha256)&&restored.scope.includes('continuous-domain'));
for(const neutralBranch of [-1,2,1e-14,'0',NaN]){assert.throws(()=>brxModel({neutralBranch}));passed++;}
console.log(`${passed} passed, 0 failed (boundary tools; independent numeric and rational references, invalid inputs, scope)`);
