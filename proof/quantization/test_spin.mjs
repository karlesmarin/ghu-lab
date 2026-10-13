import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkSMSpin4Periods,checkAxionQ6} from './spin_quantization.mjs';
const checks=[];
function ck(name,fn){fn();checks.push({name,passed:true});}
ck('Y^2/2 passes spin periods and fails universal integrality',()=>{
  const z=checkSMSpin4Periods({alpha:0,beta:0,gamma:'1/2'});
  assert.equal(z.status,'passes');assert.equal(z.universalClassStatus,'fails');
  assert.deepEqual(z.generatorPeriods,['0','0','1']);
});
ck('Y^2/4 is detected on the spin manifold S^2 x S^2',()=>{
  const z=checkSMSpin4Periods({alpha:0,beta:0,gamma:'1/4'});
  assert.equal(z.status,'fails');assert.equal(z.witness.manifold,'S^2 x S^2');
  assert.equal(z.witness.period,'1/2');
});
ck('Fractional SU(2) or SU(3) coefficients are detected on S^4',()=>{
  for(const c of [{alpha:'1/2',beta:0,gamma:'1/8'},{alpha:0,beta:'1/3',gamma:'1/9'}]){
    const z=checkSMSpin4Periods(c);assert.equal(z.status,'fails');assert.equal(z.witness.manifold,'S^4');
  }
});
ck('3625 integer couplings agree with the published q=6 congruences',()=>{
  for(let K2=-2;K2<=2;K2++)for(let K3=-2;K3<=2;K3++)for(let K1=-72;K1<=72;K1++){
    const expected=K1%6===0&&(24*K3+18*K2+K1)%36===0;
    assert.equal(checkAxionQ6({K2,K3,K1}).status,expected?'passes':'fails');
  }
});
ck('Known axion point K3=1,K2=0,K1=12 and pure abelian K1=36 pass',()=>{
  assert.equal(checkAxionQ6({K3:1,K2:0,K1:12}).status,'passes');
  const z=checkAxionQ6({K3:0,K2:0,K1:36});
  assert.equal(z.status,'passes');assert.equal(z.universalClassStatus,'fails');
});
ck('Very large signed couplings remain exact and invalid inputs are rejected',()=>{
  const n=900719925474099312345n;
  assert.equal(checkAxionQ6({K2:n,K3:-n,K1:6n*n}).status,'passes');
  for(const K1 of [0.5,9007199254740992,'1/2','1e3',null])
    assert.throws(()=>checkAxionQ6({K1,K2:0,K3:0}));
});
ck('Period quantization does not claim a global action or GHU identification',()=>{
  const z=checkAxionQ6({K2:0,K3:0,K1:0});
  assert.equal(z.differentialAction,'not_checked');
  assert.equal(z.fullModelConsistency,'not_checked');
  assert.equal(z.identificationWithGHUHiggs,'not_established');
});
const out={passed:true,count:checks.length,checks,scope:'Behavioral tests plus published congruences; universal arithmetic proved separately in Lean'};
const dest=new URL('./spin_lab_checks.json',import.meta.url);
if(process.argv.slice(2).join(' ')==='--check')assert.deepEqual(JSON.parse(fs.readFileSync(dest,'utf8')),out);
else if(process.argv.length===2)fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
else throw Error('Use no arguments or --check');
console.log(JSON.stringify({passed:true,checks:checks.length}));
