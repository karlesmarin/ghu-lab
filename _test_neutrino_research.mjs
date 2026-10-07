import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nfModel,nfDefaults} from './src/modules/neutrino_flavour.mjs';
import {NI_AXES,niDefaults,niValidate,niAxisValue,niLightMixing,niVacuumCC,niDeepCore,niModel} from './src/modules/neutrino_research.mjs';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const external=json('./data/neutrino_research_reference.json'),deep=json('./data/icecube_deepcore_reference.json');
let passed=0;const check=(name,condition)=>{assert.ok(condition,name);passed++;};
const close=(name,a,b,abs=1e-12,rel=1e-10)=>check(name,Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=abs+rel*Math.abs(b));
for(const c of external.cases){
  const r=nfModel(c.flavour,c.ring),N=niLightMixing(r);
  for(let i=0;i<3;i++){
    const source=c.copies[i],actual=r.copies[i];
    close('SVD reconstructed Dirac mass',actual.mDGeV,source.mDGeV);
    close('SVD null-vector Majorana coefficient',actual.muAkeV,source.muAkeV);
    close('SVD active deficit',actual.deficit,source.deficit,2e-14);
    for(let j=0;j<6;j++)for(const key of ['centerGeV','splitEV','activeWeight'])close('independent conserving spectrum '+key,actual.pairs[j][key],source.pairs[j][key],key==='activeWeight'?2e-14:1e-7,1e-8);
    for(let a=0;a<3;a++)for(let k=0;k<2;k++)close('light charged-current amplitude from SVD zero mode',N[a][i][k],c.lightMixing[a][i][k],1e-14);
  }
  for(const x of c.samples){const a=niVacuumCC(r,x.LoverE,x.fromFlavour,x.toFlavour,x.antineutrino);
    for(const key of ['ccKernel','nearNormalized'])close('independent complex-matrix response '+key,a[key],x[key],2e-14);
  }
}
for(const d of [0.000001,.0001,.001]){
  const r=nfModel({d1:d,d2:d,d3:d});
  for(const le of [0,111,500,1500])for(const [from,to] of [[1,0],[1,1],[0,2]]){
    const x=niVacuumCC(r,le,from,to);
    close('common suppression cancels after source normalization',x.nearNormalized,x.unitary,2e-14);
    close('raw common suppression remains',x.ccKernel,(1-d)**2*x.unitary,2e-14);
  }
}
const asym=nfModel({d1:.000001,d2:.0002,d3:.001});
const zero=niVacuumCC(asym,0,1,0),D=asym.activeDeficit[0][1];
close('zero-distance appearance from off-diagonal deficit',zero.ccKernel,D[0]**2+D[1]**2,1e-18);
check('unequal deficits produce finite zero-distance appearance',zero.ccKernel>1e-12);
const cp=nfModel({d1:1e-6,d2:.0002,d3:.001,delta:0});
close('CP conservation survives nonunitarity',niVacuumCC(cp,541).ccKernel,niVacuumCC(cp,541,1,0,true).ccKernel,1e-15);
const maj=nfModel({d1:1e-6,d2:.0002,d3:.001,alpha21:141,alpha31:279});
close('Majorana phases cancel from CC kernels',niVacuumCC(maj,541).ccKernel,niVacuumCC(asym,541).ccKernel,1e-15);
for(const [name,metadata] of Object.entries(deep.provenance.files)){
  const bytes=readFileSync(new URL('./data/icecube_deepcore_2018/'+name,import.meta.url));
  check('original table SHA '+name,createHash('sha256').update(bytes).digest('hex')===metadata.sha256);
}
for(const [order,key] of [[0,'NO'],[1,'IO']]){
  const m=deep.maps[key];check('complete official grid',m.rowCount===2601);
  // Visit a selection of original knots, including all four edges and the exact minimum.
  const knots=[[0,0],[50,50],[0,50],[50,0],[15,17],[24,30],[25,26]];
  for(const [j,i] of knots){const dm=m.dm32EV2[j],p={order,s23:m.s23[i],dm3:order===0?(dm+nfDefaults().dm21*1e-5)*1000:-dm*1000};
    const x=niDeepCore(deep,p);check('grid knot in domain',x.applicable);close('original grid value preserved',x.deltaChi2,m.deltaChi2[j][i],2e-11);
  }
  const j=20,i=21,dm=(m.dm32EV2[j]+m.dm32EV2[j+1])/2;
  const mid=niDeepCore(deep,{order,s23:(m.s23[i]+m.s23[i+1])/2,dm3:order===0?(dm+nfDefaults().dm21*1e-5)*1000:-dm*1000});
  close('bilinear midpoint average',mid.deltaChi2,(m.deltaChi2[j][i]+m.deltaChi2[j][i+1]+m.deltaChi2[j+1][i]+m.deltaChi2[j+1][i+1])/4,1e-10);
  check('outside-grid reference withheld',!niDeepCore(deep,{order,s23:.01}).applicable);
  check('ordering odds and ring exclusion withheld',mid.orderingComparison===null&&mid.ringExclusion===null&&mid.combinedNuFIT===null);
}
close('NO conversion uses dm32 rather than dm31',niDeepCore(deep).dm32EV2,.002511-.00007537,1e-16);
close('IO conversion has the signed dm32',niDeepCore(deep,{order:1,dm3:2.483}).dm32EV2,-.002483,1e-16);
const mu=niModel({}, {}, {},deep,8),scale=niModel({axis:1}, {}, {},deep,8),common=niModel({axis:5}, {}, {},deep,8);
check('muB changes heavy splitting',mu.summary.splitRangeEV[1]>mu.summary.splitRangeEV[0]);
close('muB leaves conserving mass fixed',mu.summary.massRangeGeV[0],mu.summary.massRangeGeV[1],1e-10);
check('scale changes mass at fixed light inputs',scale.summary.massRangeGeV[1]>5*scale.summary.massRangeGeV[0]);
for(const r of [mu,scale,common]){check('light reconstruction held fixed',r.summary.maxLightResidualEV<1e-12);check('PMNS held fixed',r.summary.maxMixingResidual===0);close('same standard reference cannot distinguish paths',r.deepcore.deltaChi2,mu.deepcore.deltaChi2);}
check('common deficit is invisible to normalized shape',common.rows.filter(x=>x.valid).every(x=>x.maxShapeDifference<1e-13));
const bounded=niModel({axis:1,position:1},{d1:.001,d2:.001,d3:.001},{},deep,8);
check('module-domain failures retained as explicit rows',bounded.rows.some(x=>!x.valid&&x.reason.includes('mDGeV')));
check('invalid selected point withdraws current curves',bounded.selected===null&&bounded.curves.length===0&&bounded.selectedFailure);
for(const axis of NI_AXES){check('exact lower endpoint remains in domain',niAxisValue(axis,0)===axis.lo);check('exact upper endpoint remains in domain',niAxisValue(axis,1)===axis.hi);}
check('common maximum-deficit preset evaluates',niModel({axis:5,position:1}).selected!==null);
for(const p of [{axis:9},{position:NaN},{pair:0},{from:3},{antineutrino:.5}]){assert.throws(()=>niValidate(p));passed++;}
assert.throws(()=>niModel({}, {}, {},deep,0));passed++;
assert.throws(()=>niVacuumCC(asym,-1));passed++;
console.log(`${passed} passed, 0 failed (independent SVD, CC normalization, fixed-input paths and official DeepCore grids)`);
