import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {thDefaults,thCoefficients,thValue,thModel,thValidate} from './src/modules/thermal_ghu.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const one=thModel(),two=thModel({...thDefaults(),nfPlus:0,nfMinus:8,adjPlus:2,scalarPlus:4,scalarMinus:2,RT:0,g4:1});
const independent=JSON.parse(readFileSync(new URL('./data/extensions_independent_reference.json',import.meta.url))).thermal;
check('case 1 independent doubled-cutoff Tc',Math.abs(one.critical.RT-independent.case1RTc)<3e-8);
check('case 2 independent doubled-cutoff Tc',Math.abs(two.critical.RT-independent.case2RTc)<3e-6);
check('case 1 broken endpoint',one.critical.aBroken===1);
check('case 2 published zero-T minimum .058',Math.abs(two.minima[0].a-.058)<.002);
check('case 2 published RTc .0254',Math.abs(two.critical.RT-.0254)<.0005);
for(const p of [thDefaults(),two.parameters]){
  const c=thCoefficients(p,0),tiny=thCoefficients(p,1e-6),finite=thCoefficients(p,.05);
  for(const a of [.031,.271,.639]){
    check('zero-temperature limit',Math.abs(thValue(c,a)-thValue(tiny,a))<1e-12);
    check('periodic Wilson potential',Math.abs(thValue(finite,a)-thValue(finite,a+2))<1e-12);
    const h=1e-5,d=(thValue(finite,a+h)-thValue(finite,a-h))/(2*h);
    check('analytic force vs finite difference',Math.abs(d-thValue(finite,a,1))<1e-5);
  }
}
const scaled=thModel({invRGeV:2000});check('critical temperature scales as inverse R',Math.abs(scaled.critical.temperatureGeV/one.critical.temperatureGeV-2)<1e-12);
check('potential has mass dimension four',scaled.normalization.C4GeV4/one.normalization.C4GeV4===16);
check('no invented nucleation or GW',one.nucleation===null&&one.gravitationalWaves===null);
for(const bad of [{nfPlus:.5},{RT:-1},{g4:0},{windings:0}]){assert.throws(()=>thValidate(bad));passed++;}
console.log(`${passed} passed, 0 failed (thermal GHU published critical points, derivatives and scaling)`);
