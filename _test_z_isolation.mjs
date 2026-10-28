import assert from 'node:assert/strict';
import {brxModel} from './src/modules/boundary_research.mjs';
import {zisModel} from './src/modules/z_isolation.mjs';
let passed=0;const check=(ok)=>{assert.ok(ok);passed++;};
for(const [point,theta] of ['1/10','1/5','1/4'].entries()){
 const r=brxModel({neutralPoint:point}).neutralIsolation;
 check(r.theta===theta&&r.derivative_status==='not_certified');
 check(r.model.eta==='0'&&r.model.L6==='1'&&r.model.omitted_exact_zero_directions===3);
 check(/^[0-9a-f]{64}$/.test(r.certificateSha256));
}
check(zisModel().lambda_lower==='244/8425'&&zisModel().lambda_upper==='4/125');
check(zisModel().gap_lower==='337/4000');
check(zisModel(2).lambda_lower==='1/28');
check(JSON.stringify(brxModel({theta:0,strength:100,neutralBranch:1}).neutralIsolation)===JSON.stringify(brxModel().neutralIsolation));
for(const neutralPoint of [-1,3,.2,'1',null,NaN,Infinity]){
 assert.throws(()=>brxModel({neutralPoint}));passed++;
}
const modified=zisModel();modified.model.L6='9';modified.lambda_lower='100';
check(zisModel().model.L6==='1'&&zisModel().lambda_lower==='244/8425');
console.log(`${passed} passed, 0 failed (neutral angle selection, isolation from unrelated controls, invalid inputs)`);
