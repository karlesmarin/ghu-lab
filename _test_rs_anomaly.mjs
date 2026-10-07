import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {raBessel,raValidate,raGauge,raModel} from './src/modules/rs_anomaly.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const ref=JSON.parse(readFileSync(new URL('./data/extensions_independent_reference.json',import.meta.url))).rs,p=raValidate(),r=raModel();
for(let i=0;i<3;i++){
 check('RS root vs independent SciPy '+i,Math.abs(r.modes[i].x-ref[i].x)<1e-12);
 check('profile anomaly vs adaptive quadrature '+i,Math.abs(r.modes[i].F1/ref[i].F1-1)<3e-7);
}
const matrix=[[.9978,3.5367,.0111],[3.5367,26.760,.1383],[.0111,.1383,.0008]];
matrix.forEach((row,i)=>row.forEach((v,j)=>check('published baryon neutral matrix',Math.abs(r.baryonNeutral[i][j]-v)<.0005)));
check('complete generations cancel gauge anomaly',r.gaugeGammaGammaZ===0);
check('removing leptons breaks cancellation',raModel({leptonGen:0}).gaugeGammaGammaZ>1);
check('baryon anomaly remains for complete generation',r.baryon.normalizedBoundaryCoefficient<0&&r.baryon.protonLifetime===null);
for(const x of [1e-12,.03,1,2.4,3.8,6,9,12]){const b=raBessel(x);check('Bessel Wronskian',Math.abs((b.j1*b.y0-b.j0*b.y1)/(2/(Math.PI*x))-1)<3e-8);}
for(const theta of [.02,.5,Math.PI/2,2.5,3.12])for(const logZL of [6,15])for(let mode=0;mode<3;mode++){
 const g=raGauge({...p,theta,logZL},mode);check('allowed corner has finite normalized mode',Number.isFinite(g.F1)&&g.norm>0&&Math.abs(g.equationResidual)<1e-9);
}
for(const input of [{theta:0},{mode:3},{leptonGen:.5},{logZL:4}]){assert.throws(()=>raValidate(input));passed++;}
console.log(`${passed} passed, 0 failed (RS holographic anomalies, independent Bessels, group cancellation and boundaries)`);
