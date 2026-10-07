/* Map conditional thermal conclusions without inventing a wall-friction model. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {thHistoryModel,thSoundSpectrum} from '../src/modules/thermal_history.mjs';
const out=resolve(process.argv[2]||'research/2026-10-07');mkdirSync(out,{recursive:true});
const rows=[];
for(const example of [1,2]){
 const external=JSON.parse(readFileSync(new URL(`../data/thermal_history_case${example}.json`,import.meta.url)));
 for(const background of [0,1])for(const wallSpeed of [.1,.3,.5,.7,.85,.9,.95,.99]){
  const result=thHistoryModel(external,external.parameters,{wallSpeed,vacuumBackground:background});
  for(const efficiency of [.05,.1,.3,.5,.9]){
   const spectrum=result.acousticDomain.evaluated?thSoundSpectrum(result.history.percolation,result.thermodynamics.traceStrength,{...result.parameters,efficiency}):null;
   rows.push({case:example,wallSpeed,efficiency,vacuumBackground:background,status:result.status,
    nucleationGeV:result.history.nucleation?.temperatureGeV??null,percolationGeV:result.history.percolation?.temperatureGeV??null,
    completionGeV:result.history.completion?.temperatureGeV??null,traceStrength:result.thermodynamics?.traceStrength??null,
    acousticEvaluated:result.acousticDomain.evaluated,acousticReason:result.acousticDomain.reason,
    peakHz:spectrum?.fPeakHz??null,peakOmegaH2:spectrum?.peakOmegaH2??null,
    meanSeparationGeVInverse:result.history.percolation?.separationGeVInverse??null});
  }
 }
}
for(const example of [1,2]){
 const r=rows.filter(x=>x.case===example&&x.acousticEvaluated);
 console.log(JSON.stringify({case:example,scenarios:rows.filter(x=>x.case===example).length,acousticCases:r.length,
  TpRange:[Math.min(...r.map(x=>x.percolationGeV)),Math.max(...r.map(x=>x.percolationGeV))],
  peakRange:[Math.min(...r.map(x=>x.peakOmegaH2)),Math.max(...r.map(x=>x.peakOmegaH2))]}));
}
writeFileSync(resolve(out,'thermal_assumptions.json'),JSON.stringify({schema:'ghu-thermal-assumptions-study-v1',rows,
 scope:'Finite sensitivity grid on the two stored SU(3) PhaseTracer benchmarks. Wall speed, fluid efficiency and expansion background are assumptions. Unsupported slow-wall acoustic spectra are omitted, not counted as zero. These are not measurements or GHU exclusion limits.'},null,2)+'\n');
