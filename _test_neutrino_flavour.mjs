import assert from 'node:assert/strict';
import {nfDefaults,nfModel,nfPMNS,nfValidate,nfVacuumProbability} from './src/modules/neutrino_flavour.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],conj=a=>[a[0],-a[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
for(const p of [{},{order:1,dm3:2.483},{delta:0},{delta:180,alpha21:117,alpha31:299},{s12:.1,s23:.9,s13:.3,delta:71,d1:.00002,d2:.00003,d3:.00004},{lightEV:0}]){
  const r=nfModel(p),U=r.U,M=r.lightMassMatrixEV;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const dot=U.reduce((s,row)=>add(s,mul(conj(row[i]),row[j])),[0,0]);
    check('PMNS columns orthonormal',Math.abs(dot[0]-(i===j?1:0))<1e-14&&Math.abs(dot[1])<1e-14);
    let pole=[0,0];for(let a=0;a<3;a++)for(let b=0;b<3;b++)pole=add(pole,mul(mul(U[a][i],M[a][b]),U[b][j]));
    check('Takagi matrix reproduces physical masses',Math.abs(pole[0]-(i===j?r.massesEV[i]:0))<1e-15&&Math.abs(pole[1])<1e-15);
  }
  for(const c of r.copies){check('ring eigenvalue reconstructed',Math.abs(c.lightEV-r.massesEV[c.direction-1])<1e-14);
    check('active residue reconstructed',Math.abs(c.deficit-r.parameters['d'+c.direction])<1e-14);
    for(const pair of c.pairs)check('heavy flavour weights sum to ring residue',Math.abs(pair.flavourWeights.reduce((a,x)=>a+x,0)-pair.activeWeight)<1e-15);
  }
  for(const le of [0,17,500,1000,1777]){
    const sum=[0,1,2].reduce((s,to)=>s+nfVacuumProbability(U,r.massesEV,le,1,to),0);
    check('vacuum unitary probability sum',Math.abs(sum-1)<1e-13);
  }
  check('18 heavy pairs',r.copies.reduce((s,c)=>s+c.pairs.length,0)===18);
}
const cp=nfModel({delta:180});check('CP-conserving reference equal nu and antinu',cp.samples.every(s=>Math.abs(s.nu-s.anti)<1e-15));
check('Majorana phases leave oscillations unchanged',nfModel({alpha21:120,alpha31:80}).samples.every((s,i)=>Math.abs(s.nu-nfModel().samples[i].nu)<1e-14));
check('zero lightest mass gives rank two',nfModel({lightEV:0}).rank===2);
check('default inside each separate NuFIT range',nfModel().comparison.every(c=>c.inside));
check('CP interval periodic wrap',nfModel({delta:3}).comparison.find(c=>c.key==='delta').inside);
check('outside interval exposed',!nfModel({s12:.5}).comparison.find(c=>c.key==='s12').inside);
for(const bad of [{s12:2},{delta:-1},{order:.5},{lightEV:-1}]){assert.throws(()=>nfValidate(bad));passed++;}
console.log(`${passed} passed, 0 failed (three-copy flavour, Takagi masses, residues and oscillations)`);
