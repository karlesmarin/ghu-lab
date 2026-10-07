import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {thIntegrateHistory,thHubble,thActionAt,thHistoryModel,thSoundSpectrum} from './src/modules/thermal_history.mjs';
let count=0;
const check=(message,value)=>{assert.ok(value,message);count++;};
const close=(a,b,rel)=>Math.abs(a-b)<=rel*Math.max(Math.abs(b),1e-100);
const analyticSamples=[60,80,100,120].map(T=>({T,S:155}));
const g=106.75,v=.8,h=thHubble(1,g),rate=(155/(2*Math.PI))**1.5*Math.exp(-155);
const exact=thIntegrateHistory(analyticSamples,{gStar:g,wallSpeed:v,vacuumGeV4:0},2400);
for(const row of exact.rows.filter((_,i)=>i%300===0&&i>0)){
  const N=rate/(4*h**4)*(row.T**-4-120**-4);
  const I=Math.PI*v**3*rate/(3*h**4)*(1/row.T-1/120)**4;
  check('constant-action radiation N has the analytic normalization',close(row.N,N,1e-5));
  check('constant-action radiation I has the analytic growth kernel',close(row.I,I,1e-4));
}
const slow=thIntegrateHistory(analyticSamples,{gStar:g,wallSpeed:.4},2400);
check('percolation volume scales as vw cubed',close(slow.rows[300].I/exact.rows[300].I,.125,1e-12));
assert.throws(()=>thActionAt(analyticSamples,50),/extrapolation/);count++;
assert.throws(()=>thIntegrateHistory([{T:100,S:140},{T:100,S:141},{T:110,S:160},{T:120,S:180}]),/distinct/);count++;
assert.throws(()=>thIntegrateHistory(analyticSamples,{wallSpeed:0}),/wallSpeed/);count++;
for(const i of [1,2]){
  const e=JSON.parse(readFileSync(new URL(`./data/thermal_history_case${i}.json`,import.meta.url)));
  const r=thHistoryModel(e,e.parameters);
  check(`case ${i}: integrated milestones occur while cooling`,r.history.nucleation.temperatureGeV>r.history.percolation.temperatureGeV&&r.history.percolation.temperatureGeV>r.history.completion.temperatureGeV);
  check(`case ${i}: physical false-vacuum volume decreases`,r.history.percolation.physicalFalseVolumeSlope<0&&r.history.completion.physicalFalseVolumeSlope<0);
  check(`case ${i}: supplied upper action tail negligible`,r.history.topNegligible);
  check(`case ${i}: percolation quadrature converges`,Math.abs(r.convergence.percolationQuadratureRelativeShift)<1e-5);
  check(`case ${i}: separation quadrature converges`,Math.abs(r.convergence.separationQuadratureRelativeShift)<.02);
  check(`case ${i}: finite acoustic spectrum`,r.spectrum.points.every(s=>s.frequencyHz>0&&s.omegaH2>=0&&Number.isFinite(s.omegaH2)));
  check(`case ${i}: acoustic peak matches spectral maximum`,close(r.spectrum.peakOmegaH2,Math.max(...r.spectrum.points.map(s=>s.omegaH2)),1e-12));
  check(`case ${i}: positive finite lifetime suppression`,r.spectrum.lifetimeSuppression>0&&r.spectrum.lifetimeSuppression<1);
  const zero=thSoundSpectrum(r.history.percolation,r.thermodynamics.traceStrength,{efficiency:0});
  check(`case ${i}: zero fluid efficiency gives zero acoustic signal`,zero.peakOmegaH2===0&&zero.points.every(s=>s.omegaH2===0));
  check(`case ${i}: changed potential invalidates saved actions`,thHistoryModel(e,{...e.parameters,g4:e.parameters.g4+.1}).status==='pending');
  check(`case ${i}: slow-wall acoustic extrapolation withheld`,thHistoryModel(e,e.parameters,{wallSpeed:.2}).spectrum===null);
}
console.log(`${count} passed, 0 failed (integrated thermal history and conditional acoustic spectrum)`);
