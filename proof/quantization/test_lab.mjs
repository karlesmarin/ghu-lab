import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkSMQuantization,evaluateSMClass,checkParentMixedGravity,checkStandardTensorTransfer} from './global_quantization.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const checks=[];
function ck(name,fn){fn();checks.push({name,passed:true});}
ck('Related fractional factors reconstruct integral A+B',()=>{
  const z=checkSMQuantization({alpha:'1',beta:'1',gamma:'7/12'});
  assert.equal(z.status,'passes');assert.deepEqual(z.coefficients,['1','1','0']);
});
ck('Cover-only test can miss a forbidden quotient period',()=>{
  const q={alpha:'0',beta:'0',gamma:'1/36'};
  assert.equal(evaluateSMClass(q,[-3,-3,2,2,2]),'1');
  const z=checkSMQuantization(q);assert.equal(z.status,'fails');assert.equal(z.witness.period,'1/36');
});
ck('Each coefficient has a detecting cocharacter',()=>{
  for(const c of [{alpha:'1/2',beta:'0',gamma:'1/8'},{alpha:'0',beta:'1/3',gamma:'1/9'},{alpha:'0',beta:'0',gamma:'1/2'}]){
    const z=checkSMQuantization(c);assert.equal(z.status,'fails');
    assert.equal(evaluateSMClass(c,z.witness.cocharacter),z.witness.period);
    assert.match(z.witness.period,/\//);
  }
});
ck('BigInt preserves integers beyond the floating-point range',()=>{
  const k='900719925474099312345';
  const z=checkSMQuantization({alpha:k,beta:'0',gamma:BigInt(k).toString()+'/4'});
  assert.equal(z.status,'passes');assert.equal(z.coefficients[0],k);
});
ck('Malformed and unsafe inputs cannot generate a pass',()=>{
  for(const bad of ['1/0','NaN','1.2',9007199254740992])
    assert.throws(()=>checkSMQuantization({alpha:bad,beta:0,gamma:0}));
  assert.throws(()=>evaluateSMClass({alpha:0,beta:0,gamma:0},[1,0,0,0,0]));
  assert.throws(()=>checkStandardTensorTransfer({p:'16/3',q:0,r:0}));
});
ck('Known parent invariant passes only its polynomial image gate',()=>{
  const z=checkParentMixedGravity({a:-2,b:0,c:1});
  assert.equal(z.status,'passes');assert.deepEqual(z.parentCoefficients,['1','0']);
  assert.equal(z.quantizedParentLevel,'not_checked');
});
ck('A alone lies outside the parent image',()=>assert.equal(checkParentMixedGravity({a:1,b:0,c:0}).status,'fails'));
ck('All 729 sampled integral tensor pairings retain the certified obstruction',()=>{
  for(let p=-4;p<=4;p++)for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++)
    assert.equal(checkStandardTensorTransfer({p,q,r}).status,'fails');
});
ck('Passing a quantization gate never certifies full physics',()=>{
  assert.equal(checkSMQuantization({alpha:0,beta:0,gamma:1}).fullModelConsistency,'not_checked');
});
const fixtures=JSON.parse(fs.readFileSync(path.join(here,'sage_fixtures.json'),'utf8'));
ck('81 cases and 405 periods agree with independent Sage centered-root calculations',()=>{
  for(const row of fixtures.cases){
    assert.equal(checkSMQuantization(row.coefficients).status,row.status);
    assert.deepEqual(fixtures.weights.map(w=>evaluateSMClass(row.coefficients,w)),row.periods);
  }
});
const result={passed:true,count:checks.length,checks,scope:'Behavioral tests of private JS diagnostics; universal arithmetic is proved separately in Lean'};
const out=path.join(here,'lab_checks.json');
if(process.argv.slice(2).join(' ')==='--check')assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')),result);
else if(process.argv.length===2)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
else throw Error('Use no arguments or --check');
console.log(JSON.stringify({passed:true,checks:checks.length}));

