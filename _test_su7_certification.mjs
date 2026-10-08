import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SU7_CERTIFICATION as c} from './src/modules/su7_certification_reference.mjs';
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const hash=p=>createHash('sha256').update(readFileSync(new URL(p,import.meta.url))).digest('hex');
ok(hash('./data/su7_km25.json')===c.inputSHA256,'certificate bound to exact model input');
ok(hash('./proof/su7/SU7Certificates.lean')===c.independentVerification.lean.sourceSHA256,'formal proof source matches verification');
ok(hash('./proof/su7/reconstruct.py')===c.globalProof.arithmetic_script_sha256,'global proof arithmetic version matches source');
ok(c.summary.formalTheorems===26&&c.independentVerification.lean.theorems.length===26,'twenty-six named Lean theorems');
ok(c.reconstruction.checks.every(x=>x.passed)&&c.independentVerification.sage.checks.every(x=>x.passed),'all recorded checks succeeded');
ok(!c.summary.noveltyEstablished,'proof does not assert scientific priority');
ok(c.reconstruction.coefficient_comparisons.length===8&&c.reconstruction.coefficient_comparisons.every(x=>x.matches_lab),'eight independent coefficient comparisons');
for(const row of c.reconstruction.rows){
 ok(row.derivative_over_rounding_box.every(x=>Number(x)<0),'complete published rounding box nonstationary');
 for(const seed of ['printed','candidate']){
  const local=row[seed+'_local_minimum'];
  ok(Number(local.left_derivative[1])<0&&Number(local.right_derivative[0])>0,'root endpoint signs');
  ok(Number(local.curvature_interval[0])>0,'root curvature positive');
 }
}
for(const proof of c.globalProof.rows){
 ok(proof.certified&&proof.domain.join(',')==='0,1','certified fundamental domain');
 ok(proof.cover.length===proof.cover_count&&proof.cover[0].interval[0]==='0'&&proof.cover.at(-1).interval[1]==='1','cover endpoints');
 for(let i=0;i<proof.cover.length;i++){
  const box=proof.cover[i];
  if(i)ok(proof.cover[i-1].interval[1]===box.interval[0],'no gap or overlap in rational cover');
  if(box.reason==='energy-above-reference')ok(Number(box.gap_lower)>0,'strict exterior energy separation');
  else ok(box.reason==='strictly-convex-basin','only the documented alternative proof rule');
 }
}
console.log(`${checks} checks pass`);
