/* Independent high-precision poles, eigenvector residuals and model-card scope. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nrDefaults,nrModel,nrEigen,nrScan,nrSensitivity,nrSummary,nrRecord } from './src/modules/neutrino_ring.mjs';
import { makeCard } from './src/kernel/card.mjs';
import { toLatex } from './src/kernel/latex.mjs';
import { val,STATUS } from './src/kernel/status.mjs';
import { nrCompare,nrLimitAt,nrLimitCurve } from './src/modules/neutrino_limits.mjs';
import limits from './data/neutrino_hnl_limits.json' with {type:'json'};
let pass=0;
function ok(condition,message){assert.ok(condition,message);pass++;}
function near(x,y,tol,message){ok(Math.abs(x-y)<=tol*Math.max(Math.abs(y),1e-30),`${message}: ${x} vs ${y}`);}
const ref=JSON.parse(readFileSync(new URL('./data/neutrino_ring_reference.json',import.meta.url)));
for(const [i,row] of ref.examples.entries()) {
  const p=row.input,f=p.fGeV;
  const r=nrModel({t:p.t,q:p.q,r:p.r,fGeV:f,muBkeV:p.muB*f*1e6,calibrate:true});
  near(r.used.mDGeV,p.m*f,1e-10,`Dirac calibration ${i}`);
  near(r.used.muAkeV,p.muA*f*1e6,1e-10,`Majorana calibration ${i}`);
  near(r.lightEV,Number(row.light_eV),1e-7,`full light pole ${i}`);
  near(r.deficit,Number(row.deficit),1e-7,`full active residue ${i}`);
  for(const k of ['KN','KS'])near(r[k],Number(row.leading[k]),1e-12,`${k} ${i}`);
  for(const [j,pair] of r.pairs.entries()) {
    const a=row.leading_pairs[j],full=row.pairs[j];
    near(pair.centerGeV,Number(a.center)*f,1e-10,`conserving centre ${i}/${j}`);
    near(pair.splitEV,Number(a.split)*f*1e9,1e-9,`leading split ${i}/${j}`);
    near(pair.splitEV,Number(full.split)*f*1e9,1e-4,`full split ${i}/${j}`);
    for(const k of ['weightA','weightB','activeWeight'])near(pair[k],Number(a[k]),1e-9,`${k} ${i}/${j}`);
  }
  near(r.activeWeightSum,r.deficit,1e-10,`mixing sum rule ${i}`);
}
// Residuals and orthogonality constrain the eigenvectors, not just their ordering.
const H=[[2,1,0],[1,4,.3],[0,.3,3]],e=nrEigen(H);
for(const a of e) {
  const residual=Math.hypot(...H.map((row,i)=>row.reduce((s,x,j)=>s+x*a.vector[j],0)-a.value*a.vector[i]));
  ok(residual<1e-12,'eigenvector residual');
  for(const b of e)near(a.vector.reduce((s,x,j)=>s+x*b.vector[j],0)+(a===b?0:1),1,1e-12,'orthonormal eigenvectors');
}
const zero=nrModel({calibrate:false,muAkeV:0,muBkeV:5000});
ok(zero.lightEV===0&&zero.pairs[0].splitEV>0,'muB splits heavy pairs while the exact chiral zero survives');
const unmixed=nrModel({calibrate:false,mDGeV:0});
ok(unmixed.lightEV===0&&unmixed.deficit===0,'decoupled active flavour');
const r=nrModel(),rows=nrScan(nrDefaults()),s=nrSensitivity(nrDefaults());
ok(rows.length===41&&rows.every(x=>x.lightEV===r.lightEV&&x.deficit===r.deficit),'scan holds light quantities at this order');
for(const row of [rows[0],rows[17],rows.at(-1)])near(row.splitEV,nrModel({muBkeV:row.muBkeV}).pairs[0].splitEV,1e-12,'shared scan agrees with direct calculation');
ok(s.scans[0].knob.kind==='model'&&s.scans[0].failed===0,'reuse sensitivity: model variation, not measurement error');
ok(s.scans[0].lo===rows[0].splitEV&&s.scans[0].hi===rows.at(-1).splitEV,'actual asymmetric endpoints are retained');
ok(nrSummary(r).text!==nrSummary(nrModel({muBkeV:5000})).text,'summary follows selection');
for(const p of [{fGeV:0},{t:NaN},{q:Infinity},{muBkeV:-1},{muAkeV:100001},{calibrate:'true'}]) {
  assert.throws(()=>nrModel(p));pass++;
}
for(const steps of [0,1.5,1001,Infinity]){assert.throws(()=>nrScan({},steps));pass++;}
const card=makeCard(nrRecord(r),{}, {kernelHash:'reference-test'});
ok(card.input.model.group==='tme-u1-ring','own model identity');
ok(card.input.model.parameters.muAkeV===r.used.muAkeV,'actual calibrated input travels with the card');
ok(card.input.model.requested_parameters.muAkeV===500,'requested input retained separately');
ok(card.input.model.conventions.m_W===null&&card.input.model.conventions.g4===null,'no borrowed SM scale or coupling');
ok(card.input.model.assumptions.unknown.includes('three-flavour fit'),'scope travels with the card');
for(const curve of limits.curves) {
  ok(nrLimitCurve(curve.flavour,curve.kind).doi===curve.doi,'exact dataset identity');
  const single=curve.rows.find(r=>curve.rows.filter(x=>x.massGeV===r.massGeV).length===1);
  near(nrLimitAt(curve,single.massGeV).observed,single.observed,1e-15,'published knot preserved');
  const a=curve.rows[0],b=curve.rows[1],mid=nrLimitAt(curve,(a.massGeV+b.massGeV)/2);
  near(mid.observed,Math.sqrt(a.observed*b.observed),1e-12,'declared log-linear interpolation');
  ok(nrLimitAt(curve,a.massGeV-1).status==='outside-domain'&&nrLimitAt(curve,curve.rows.at(-1).massGeV+1).status==='outside-domain','no extrapolation');
  for(const row of curve.rows.filter((r,i)=>i>0&&r.massGeV===curve.rows[i-1].massGeV))
    ok(nrLimitAt(curve,row.massGeV).status==='transition','duplicate mass knots are not silently merged');
}
ok(limits.curves.length===6&&limits.curves.reduce((s,c)=>s+c.rows.length,0)===190,'all six published tables, all 190 rows');
const dc=nrCompare(r,'muon','dirac'),mc=nrCompare(r,'muon','majorana');
near(dc.rows[0].referenceWeight,2*mc.rows[0].referenceWeight,1e-14,'pair versus single-component convention');
ok(dc.exclusion_status==='not-evaluated'&&dc.missing.length===4,'comparison never claims an unmatched model exclusion');
const tex=toLatex(makeCard(nrRecord(r),{structured:val({pairs:[{weightA:.2}],scope:'leading'},{status:STATUS.VERIFIED,source:'synthetic structured export regression'})},{kernelHash:'test'}));
ok(tex.includes('weightA')&&tex.includes('leading')&&!tex.includes('[object Object]'),'structured result survives LaTeX export');
console.log(`PASSED   ${pass} ok, 0 failed`);
