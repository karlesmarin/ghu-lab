import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cvThermalComparison,cvUncertaintyBudget} from './src/modules/crossvalidation.mjs';
import {THERMAL_CROSSVALIDATION as thermal,UNCERTAINTY_BUDGET as budget} from './src/modules/crossvalidation_reference.mjs';
import {MOMENT_DIAGNOSTICS as moments} from './src/modules/moment_diagnostics_reference.mjs';
import {mdRational as q} from './src/modules/moment_diagnostics.mjs';
import {EXPERIMENT} from './src/kernel/experiment.mjs';
let count=0;const ok=(v,label)=>{assert.ok(v,label);count++;};
const read=p=>readFileSync(new URL(p,import.meta.url));
const hash=p=>createHash('sha256').update(read(p)).digest('hex');
const near=(a,b,tol=1e-12)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
for(const [name,ref] of [['thermal_crossvalidation',thermal],['uncertainty_budget',budget]]){
 ok(JSON.stringify(JSON.parse(read('./data/'+name+'.json')))===JSON.stringify(ref),'offline '+name+' matches source JSON');
 for(const [path,digest] of Object.entries(ref.inputs))ok(hash('./'+path)===digest,'evidence source unchanged: '+path);
}
ok(thermal.mode==='full'&&thermal.cases.length===2,'two complete thermal cases');
ok(thermal.backend.cosmoTransitions==='2.0.7','pinned CosmoTransitions release');
ok(thermal.methodScope.includes('shared shooting-method ancestry'),'shared algorithm ancestry disclosed');
for(const c of thermal.cases){
 ok(hash('./'+c.source)===c.sourceSHA256,'same archived PhaseTracer input');
 ok(cvThermalComparison(c.parameters,thermal)?.record===c,'matching parameters select correct case');
 for(const key of Object.keys(c.parameters))ok(cvThermalComparison({...c.parameters,[key]:c.parameters[key]+.1},thermal)===null,'edited '+key+' invalidates archived evidence');
 ok(cvThermalComparison({...c.parameters,extra:0},thermal)===null,'unknown parameter invalidates archive');
 ok(c.samples.length===9&&c.crossings.length===4,'nine action samples and four cutoff crossings');
 for(const s of c.samples){
  ok(near(s.relativeDifference,s.cosmoTransitionsTight.S3overT/s.phaseTracerTight.S3overT-1),'actual action difference retained');
  ok(near(s.phaseTracer.S3overT,s.archivedPhaseTracer,1e-9),'current C++ run reproduces archived loose-tolerance action');
  ok(s.cosmoTransitionsTight.virialRelative<thermal.targets.virialRelative,'O(3) virial check');
  ok(s.cosmoTransitionsTight.actionIntegralRelative<1e-10,'canonical action normalization');
 }
 for(const x of c.crossings){
  ok(near(x.relativeDifference,x.cosmoTransitions.RT/x.phaseTracer.RT-1),'computed temperature comparison');
  ok(Math.abs(x.cosmoTransitions.S3overT-140)<.001&&Math.abs(x.phaseTracer.S3overT-140)<.001,'actual action residual at crossing is small');
  ok(x.windings===c.parameters.windings*x.multiplier&&x.thermalTerms===c.parameters.thermalTerms*x.multiplier,'same spatial and thermal cutoffs');
 }
 const d=c.diagnostics,t=thermal.targets;
 const passed=d.maxActionRelative<=t.actionRelative&&d.maxCrossingRelative<=t.crossingRelative&&d.maxVirialRelative<=t.virialRelative&&Math.max(d.maxPhaseToleranceShift,d.maxCosmoToleranceShift)<=t.toleranceShiftRelative;
 ok(c.withinDeclaredTargets===passed,'status reflects declared targets');
 ok(d.maxActionRelative<1e-6,'regression: implementations closely agree');
 ok(Math.max(d.maxPhaseToleranceShift,d.maxCosmoToleranceShift)>100*d.maxActionRelative,'tolerance drift is not hidden by agreement between programs');
}
ok(cvThermalComparison(thermal.cases[0].parameters,{...thermal,mode:'pilot'})===null,'pilot cannot provide archived evidence');
ok(budget.checks.every(c=>c.passed)&&budget.passed===budget.checks.length,'Arb budget checks passed');
ok(q(budget.measuredW.value)===EXPERIMENT.m_W.value&&q(budget.measuredW.sigma)===EXPERIMENT.m_W.error,'same pinned W input as laboratory');
for(const r of moments.benchmarks){
 const b=cvUncertaintyBudget(r,budget)?.record;
 ok(!!b,'all ten certificates have a budget');
 ok(cvUncertaintyBudget({...r,full:{...r.full,higgsGeV:['0','1']}},budget)===null,'changed certificate cannot inherit old budget');
 ok(b.totalPhysicalUncertaintyGeV===null&&b.theoryUncertainty.massGeV===null,'unknown physics remains unknown');
 const mass=r.full.higgsGeV.map(q),scale=r.full.compactificationGeV.map(q);
 for(const [key,baseline] of [['higgsGeV',mass],['compactificationGeV',scale]]){
  const w=b.measuredW[key],factor=EXPERIMENT.m_W.value/80.4,sigma=EXPERIMENT.m_W.error/80.4;
  ok(near(q(w.atMeasuredCentral[0]),baseline[0]*factor)&&near(q(w.atMeasuredCentral[1]),baseline[1]*factor),'exact central W rescaling '+key);
  ok(near(q(w.propagatedOneSigma[0]),baseline[0]*sigma)&&near(q(w.propagatedOneSigma[1]),baseline[1]*sigma),'linear measured W propagation '+key);
  ok(q(w.centralShift[1])<0,'central update retained separately '+key);
 }
 const n=b.numerical;
 ok(q(n.curvatureFloor)>0,'positive curvature supports the error bound');
 ok(q(n.rootPlusTailMassUpperGeV)>=q(n.rootLocationMassUpperGeV)+q(n.fourierTailMassUpperGeV)-1e-15,'combined bound includes root and tail');
 ok(q(n.fourierTailMassUpperGeV)>0&&q(n.fourierTailMassUpperGeV)<.001,'nonzero sub-MeV Fourier bound for these benchmarks');
 ok(near(q(b.couplingScenario.massHalfSpanGeV[0]),mass[0]*.1),'chosen coupling scenario uses linear dependence');
 ok(b.couplingScenario.scaleChangeGeV.every(x=>q(x)===0),'g4 does not move the compactification scale at fixed geometry');
}
ok(cvUncertaintyBudget(null,budget)===null,'unmatched model gets no budget');
console.log(`${count} checks pass`);
