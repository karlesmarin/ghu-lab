import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nrModel} from './src/modules/neutrino_ring.mjs';
import {njGeometry,njModel} from './src/modules/neutrino_majoron.mjs';
import {ndModel,ndValidate} from './src/modules/neutrino_decay.mjs';
let passed=0;
const check=(s,c)=>{assert.ok(c,s);passed++;};
const near=(s,a,b,t=1e-9)=>check(s,Math.abs(a-Number(b))<=t*Math.max(1e-25,Math.abs(Number(b))));
const ref=JSON.parse(readFileSync('data/neutrino_majoron_reference.json','utf8'));
for(const test of ref.cases){
  const p=test.input;
  const ring=nrModel({fGeV:p.fGeV,t:p.t,q:p.q,r:p.r,mDGeV:p.m*p.fGeV,muAkeV:p.muA*p.fGeV*1e6,muBkeV:p.muB*p.fGeV*1e6,calibrate:false});
  const result=njModel(ring,test);
  near('independent metric projection '+test.label,result.geometry.FbetaGeV,test.FbetaGeV,2e-15);
  near('unit scalar kinetic norm '+test.label,result.geometry.kineticFractions.reduce((a,x)=>a+x,0),1,2e-15);
  for(const [i,r] of result.rows.entries()){
    const expected=test.rows[i];
    near('13-Weyl pole reference total '+test.label+i,r.sumEV,Number(expected.leadingGeV)*1e9);
    near('light residue projection '+test.label+i,r.lightEV,Number(expected.lightGeV)*1e9);
    for(const c of r.cascades)near('heavy cascade '+test.label+i+'/'+c.daughterPair,c.widthEV,Number(expected.toPairsGeV[c.daughterPair-1])*1e9);
  }
}
const ring=nrModel(),base=ndModel(ring),on=ndModel(ring,{majoron:1});
check('reference width unchanged when omitted',base.selected.widthEV===base.selected.weak.sumEV);
check('lifetime responds to calculated width',on.selected.flight.ctauMM<base.selected.flight.ctauMM);
check('splitting unchanged by inclusion',on.rows.every((p,i)=>p.splitEV===base.rows[i].splitEV));
check('cascade overlap exposed',on.rows.some(r=>r.widthOverNearestGap>.1&&r.issues.some(s=>s.includes('multi-state'))));
const decoupled=njModel(nrModel({calibrate:false,mDGeV:0,muAkeV:0,muBkeV:0}));
check('zero active Yukawa closes light channel',decoupled.rows.every(r=>r.lightEV===0));
check('heavy cascades survive conserving limit',decoupled.rows.slice(1).some(r=>r.sumEV>0));
check('fractions normalized with Majoron',on.rows.every(r=>Math.abs(Object.values(r.channelFractions).reduce((a,x)=>a+x,0)-1)<1e-14));
for(const bad of [{majoron:.5},{chiOverF:0},{sigmaOverF:5}]){assert.throws(()=>ndValidate(bad));passed++;}
for(const bad of [0,-1,Infinity,NaN]){assert.throws(()=>njGeometry(bad));passed++;}
console.log(`${passed} passed, 0 failed (Majoron independent references and decay integration)`);
