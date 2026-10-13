import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {R,str} from './src/kernel/charges.mjs';
import {gqDefaults,gqModel,gqFigureData,gqLatticePreset,GQ_API,SP_API} from './src/modules/quantization.mjs';
import {checkSMQuantization,checkStandardTensorTransfer} from './proof/quantization/global_quantization.mjs';
import {checkSMSpin4Periods} from './proof/quantization/spin_quantization.mjs';
let count=0;
for(const a of ['-1','0','1/2','1','900719925474099312345'])for(const b of ['0','1','1/3'])for(const c of ['0','1/2','7/12','1/36']){
 const p={alpha:a,beta:b,gamma:c};assert.deepEqual(GQ_API.checkSMQuantization(p),checkSMQuantization(p));assert.deepEqual(SP_API.checkSMSpin4Periods(p),checkSMSpin4Periods(p));count+=2;
}
assert.equal(gqModel().universal.status,'fails');assert.equal(gqModel().spin.status,'passes');
assert.equal(gqModel().u2.status,'passes');assert.equal(gqModel({b1:'5'}).u2.status,'fails');count+=4;
for(const p of ['-99','0','1','99999999999999999999']){assert.deepEqual(gqModel({p}).tensor,checkStandardTensorTransfer({p,q:0,r:0}));count++;}
for(const p of [{p:'1/2'},{alpha:'NaN'},{K1:'1.5'},{b0:'1/2'},{gamma:'1/0'},{alpha:'1'.repeat(161)}]){assert.throws(()=>gqModel(p));count++;}
const html=readFileSync(new URL('./app/index.html',import.meta.url),'utf8');
assert.ok(html.includes('gqModel'));assert.ok(html.includes('gqClassResult'));count+=2;
assert.equal(gqModel().fullModelConsistency,'not_checked');assert.equal(gqModel().lift.leanCertified,false);count+=2;
for(const b0 of ['-1','0','1','900719925474099312345'])for(const b1 of ['-6','2','5','6']){
 const r=gqModel({b0,b1});assert.equal(r.figures.cocharacters.length,81);count++;
 for(const c of r.figures.cocharacters){
  const swap=r.figures.cocharacters.find(v=>v.m===c.n&&v.n===c.m);assert.equal(c.period,swap.period);count++;
  if(c.m===c.n){assert.equal(c.period,str(R(Number(b1)*c.m*c.m,2)));count++;}
 }
 assert.equal(r.figures.cocharacters.every(c=>c.integral),r.u2.status==='passes');count++;
}
const positive=gqFigureData(),negative=gqFigureData({b1:'5'});
assert.equal(positive.cocharacters.find(c=>c.m===1&&c.n===0).period,'1');
assert.equal(negative.cocharacters.find(c=>c.m===1&&c.n===0).period,'7/8');count+=2;
assert.equal(gqFigureData({beta:'1/3'}).lattice.length,0);count++;
for(const beta of ['-2','0','1'])for(const a of ['-3','0','2'])for(const delta of ['-1/2','0','3/2']){
 const p=gqLatticePreset(a,delta,beta),r=gqModel(p);assert.deepEqual(r.universal.coefficients,[a,beta,delta]);assert.equal(r.spin.status,'passes');count+=2;
}
console.log(`${count} checks pass (quantization, exact figure values, engine parity and invalid inputs)`);
