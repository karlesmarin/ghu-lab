import assert from 'node:assert/strict';
import {mnContext,mnMinimum,mnValidate,MN_ROWS} from './src/modules/su6_maru_nago.mjs';
import {sun5dV} from './src/modules/sun5d.mjs';
let passed=0;
const check=(n,c)=>{assert.ok(c,n);passed++;};
for(const [k3,Nad,printed,infinite] of MN_ROWS){
  const c=mnContext({k3,Nad,windings:1000}),r=mnMinimum(c);
  check(`independent polylog minimum k3=${k3}, Nad=${Nad}`,Math.abs(r.alpha-infinite)<1e-7);
  if(infinite>0)check('printed difference visible',Math.abs(r.alpha-printed)>2e-6);
  const A=4*Nad-3;
  for(const a of [.032,.103,.37,.62,.97]){
    let v=0;for(let n=1;n<=300;n++)v+=((2*A+48+(6*A+48)*(n%2?-1:1))*Math.cos(Math.PI*n*a)+(A+4*k3*(n%2?-1:1))*Math.cos(2*Math.PI*n*a))/n**5;
    check('paper coefficient identity',Math.abs(v-2*sun5dV(c.terms,[a],300))<1e-10);
  }
  check('spectator singlets retained',c.spectators.rightHandedSinglets===3);
}
for(const k3 of [0,1,2,3])check('no-adjoint endpoint',Math.abs(mnMinimum(mnContext({k3,Nad:0})).alpha-1)<1e-8);
for(const p of [{k3:4},{k3:.5},{Nad:-1},{windings:Infinity}]){assert.throws(()=>mnValidate(p));passed++;}
console.log(`${passed} passed, 0 failed (SU6 independent infinite sums and potential identity)`);
