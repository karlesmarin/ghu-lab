import assert from 'node:assert/strict';
import {ruModel,ruFermion,ruValidate} from './src/modules/rs_unification.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const one=ruModel(),two=ruModel({content:2});
check('C1 SM-minus-Higgs differential slopes',Math.abs(one.deltaB[0]+22/3)<1e-14&&Math.abs(one.deltaB[1]+11)<1e-14);
check('C2 additional top-complement differential slopes',Math.abs(two.deltaB[0]+94/15)<1e-14&&Math.abs(two.deltaB[1]+53/5)<1e-14);
check('C1 boundary terms of order one as published',one.maxRequired>1&&one.maxRequired<2);
check('C2 boundary terms of order one as published',two.maxRequired>.7&&two.maxRequired<1.8);
check('choosing required terms cancels boundary residual',ruModel({lambda21:one.requiredDeltaLambda[0],lambda31:one.requiredDeltaLambda[1]}).residual.every(x=>x===0));
for(const c of [-.8,-.3,0,.3,.8])for(const parity of [-1,1]){
  const r=ruFermion(c,parity);check('localization selection',!!r.chirality===(c*parity>.5));
}
for(const c of [-.5,.5])check('marginal bulk mass withheld',ruFermion(c,1).chirality===null&&ruFermion(c,1).status.includes('Marginal'));
const threshold=ruModel({cPlus:.75,cMinus:-.75,mUV:.01});
check('independent boundary mass formula',Math.abs(threshold.uvFermionProbe.uvMassGeV-5e15)<1);
check('IR localized field cannot enter UV Dirac threshold',ruModel({cPlus:0,mUV:1}).uvFermionProbe.uvMassGeV===null);
for(const p of [{content:1.5},{irTeV:0},{logUV:NaN}]){assert.throws(()=>ruValidate(p));passed++;}
console.log(`${passed} passed, 0 failed (RS correlator slopes, localization and thresholds)`);
