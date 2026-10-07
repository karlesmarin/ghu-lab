/* Conditional two-body decay diagnostic for the existing neutrino ring.
 * It does not compute the full ring width or reinterpret collider limits.
 */
import { njModel } from './neutrino_majoron.mjs';
import { EXPERIMENT } from '../kernel/experiment.mjs';

export const ND_CONSTANTS = {
  GF:1.1663785e-5,
  hbarGeVs:6.62607015e-34/(2*Math.PI*1.602176634e-10),
  cMMs:299792458000,
  electronGeV:.00051099895069,
  source:'PDG 2025 physical constants; h, e and c exact SI definitions',
  url:'https://pdg.lbl.gov/2025/reviews/rpp2025-rev-phys-constants.pdf',
  read:'2026-10-06'
};
export const ND_LIMITS = {pair:[1,6],extraEV:[0,1e9],boost:[.1,100],lminMM:[0,1e6],lmaxMM:[1e-12,1e6],majoron:[0,1],chiOverF:[.25,4],sigmaOverF:[.25,4]};
export function ndDefaults(){return {pair:1,extraEV:0,boost:1,lminMM:0,lmaxMM:1,majoron:0,chiOverF:1,sigmaOverF:1};}
export function ndValidate(input={}) {
  const p={...ndDefaults(),...input};
  for(const [k,[lo,hi]] of Object.entries(ND_LIMITS))
    if(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)
      throw new RangeError(`${k} must be between ${lo} and ${hi}`);
  if(!Number.isInteger(p.majoron))throw new RangeError('Majoron inclusion must be zero or one');
  if(!Number.isInteger(p.pair))throw new RangeError('Select an integer pair from 1 to 6');
  if(p.lmaxMM<=p.lminMM)throw new RangeError('The outer flight distance must exceed the inner distance');
  return p;
}
export function ndWeakWidths(massGeV,activeWeight,lightActiveWeight=1,flavour='electron') {
  if(!Number.isFinite(massGeV)||massGeV<=0||!Number.isFinite(activeWeight)||activeWeight<0||activeWeight>1||
     !Number.isFinite(lightActiveWeight)||lightActiveWeight<0||lightActiveWeight>1)
    throw new RangeError('Positive mass and mixing weights between zero and one required');
  const leptons={electron:ND_CONSTANTS.electronGeV,muon:EXPERIMENT.m_mu.value,tau:EXPERIMENT.m_tau.value};
  if(!Object.hasOwn(leptons,flavour))throw new RangeError('Unknown charged-lepton flavour');
  const mw=EXPERIMENT.m_W.value,mz=EXPERIMENT.m_Z.value,mh=EXPERIMENT.m_h.value,ml=leptons[flavour];
  const a=ND_CONSTANTS.GF*massGeV**3*activeWeight/(8*Math.sqrt(2)*Math.PI)*1e9;
  const x=(mw/massGeV)**2,y=(ml/massGeV)**2;
  const w=massGeV>mw+ml?Math.sqrt(Math.max(0,(1-x-y)**2-4*x*y))*((1-y)**2+x*(1+y)-2*x*x):0;
  const vector=m=>massGeV>m?(1-(m/massGeV)**2)**2*(1+2*(m/massGeV)**2):0;
  const scalar=m=>massGeV>m?(1-(m/massGeV)**2)**2:0;
  const channelsEV={W:Math.max(0,a*w),Z:a*.5*lightActiveWeight*vector(mz),h:a*.5*lightActiveWeight*scalar(mh)};
  return {channelsEV,sumEV:channelsEV.W+channelsEV.Z+channelsEV.h,
    thresholdsGeV:{W:mw+ml,Z:mz,h:mh},flavour,
    normalization:'Per quasi-Dirac component: U_component² = U_pair²/2; W includes both lepton charges',
    scope:'On-shell W/Z and unmixed SM Higgs, light neutrino mass neglected; exact charged-lepton mass and conserving light residue'};
}
export function ndCoherence(splitEV,widthEV) {
  if(!Number.isFinite(splitEV)||splitEV<0||!Number.isFinite(widthEV)||widthEV<0)throw new RangeError('Nonnegative finite splitting and width required');
  if(widthEV===0)return {deltaOverGamma:null,ssOverOS:null,ssFraction:null,status:'No positive scenario width; decay ratios undefined'};
  const scale=Math.max(splitEV,widthEV),d=splitEV/scale,g=widthEV/scale;
  const ratio=d*d/(2*g*g+d*d);
  const quotient=splitEV/widthEV;
  return {deltaOverGamma:Number.isFinite(quotient)?quotient:null,ssOverOS:ratio,ssFraction:ratio/(1+ratio),
    status:'Ideal isolated coherent pair, equal widths, CP conservation, all proper decay times; no detector selection'+
      (Number.isFinite(quotient)?'':'; Delta m / Gamma exceeds the floating-point range')};
}
export function ndFlight(widthEV,boost=1,lminMM=0,lmaxMM=1) {
  ndValidate({boost,lminMM,lmaxMM});
  if(!Number.isFinite(widthEV)||widthEV<0)throw new RangeError('Nonnegative finite width required');
  if(widthEV===0)return {tauSeconds:null,ctauMM:null,meanFlightMM:null,windowProbability:null,status:'Undefined; zero included width does not establish stability'};
  const hbarEVs=ND_CONSTANTS.hbarGeVs*1e9,tauSeconds=hbarEVs/widthEV,ctauMM=ND_CONSTANTS.cMMs*hbarEVs/widthEV,meanFlightMM=boost*ctauMM;
  // expm1 retains narrow windows and very long lifetimes without cancellation.
  const inverseLength=widthEV/(ND_CONSTANTS.cMMs*hbarEVs*boost);
  const windowProbability=Math.exp(-lminMM*inverseLength)*(-Math.expm1(-(lmaxMM-lminMM)*inverseLength));
  const finite=x=>Number.isFinite(x)?x:null;
  return {tauSeconds:finite(tauSeconds),ctauMM:finite(ctauMM),meanFlightMM:finite(meanFlightMM),windowProbability,
    status:'Straight-line flight distance at fixed beta*gamma; probability only, not detector efficiency'+
      (Number.isFinite(meanFlightMM)?'':'; Flight length exceeds the floating-point range')};
}
export function ndModel(ring,input={},flavour='electron') {
  const settings=ndValidate(input),lightActiveWeight=1-ring.deficit;
  const majoron=njModel(ring,settings);
  const rows=ring.pairs.map(pair=>{
    const weak=ndWeakWidths(pair.centerGeV,pair.activeWeight,lightActiveWeight,flavour),majoronRow=majoron.rows[pair.pair-1],majoronEV=settings.majoron?majoronRow.sumEV:0,
      widthEV=weak.sumEV+majoronEV+settings.extraEV;
    const channelsEV={...weak.channelsEV,...(settings.majoron?{J:majoronEV}:{}),extra:settings.extraEV};
    const channelFractions=Object.fromEntries(Object.entries(channelsEV).map(([k,v])=>[k,widthEV>0?v/widthEV:null]));
    const issues=[];
    if(pair.centerGeV<1.1*EXPERIMENT.m_W.value)issues.push('Near/below W threshold: off-shell weak decays are missing');
    if(pair.activeWeight===0)issues.push('No active-current production in this conserving slice');
    if(ring.expansionRatio>.01||ring.insertionToSmallestGap>.01)issues.push('Majorana insertion/gap diagnostic exceeds 1%; not an error estimate');
    if(widthEV*1e-9/pair.centerGeV>.01)issues.push('Scenario width/mass exceeds 1%; narrow-state diagnostic is strained');
    const gap=Math.min(...ring.pairs.filter(p=>p.pair!==pair.pair).map(p=>Math.abs(p.centerGeV-pair.centerGeV)));
    const widthOverNearestGap=widthEV*1e-9/gap;
    if(widthOverNearestGap>.1)issues.push('Width exceeds 10% of nearest pair separation; isolated-pair coherence needs a multi-state treatment');
    const weakCascades=ring.pairs.filter(p=>p.pair<pair.pair).map(p=>({pair:p.pair,
      Zopen:pair.centerGeV>p.centerGeV+EXPERIMENT.m_Z.value,hopen:pair.centerGeV>p.centerGeV+EXPERIMENT.m_h.value}));
    const flight=ndFlight(widthEV,settings.boost,settings.lminMM,settings.lmaxMM);
    if(widthEV>0&&flight.meanFlightMM===null)issues.push('Flight length exceeds the floating-point range');
    return {...pair,weak,majoron:majoronRow,widthOverNearestGap,channelsEV,channelFractions,widthEV,
      coherence:ndCoherence(pair.splitEV,widthEV),flight,
      widthOverMass:widthEV*1e-9/pair.centerGeV,weakCascades,issues};
  });
  return {settings,flavour,majoron,rows,selected:rows[settings.pair-1],lightActiveWeight,
    status:'Conditional decay scenario; full model width and model exclusion not evaluated',
    extraWidthMeaning:'Same nonnegative added width per component of each pair, chosen by the user; not derived from the ring action',
    missing:['Off-shell weak final states and radiative corrections','Heavy-to-heavy weak cascades',
      ...(settings.majoron?[]:['Majoron widths computed separately but not included in this scenario']),
      'Collective-phase scalar, radial-scalar and new-gauge channels; masses/couplings/mixing require calculation',
      'Three-flavour production, detector response and inter-pair coherence'],
    sources:{weak:'https://arxiv.org/abs/0901.3589',coherence:'https://arxiv.org/abs/1607.05641',constants:ND_CONSTANTS,
      masses:{W:EXPERIMENT.m_W,Z:EXPERIMENT.m_Z,h:EXPERIMENT.m_h,muon:EXPERIMENT.m_mu,tau:EXPERIMENT.m_tau}}};
}
export function ndSummary(model) {
  const p=model.selected,f=x=>Number.isFinite(x)?x.toExponential(3):'outside numerical range';
  if(p.widthEV===0)return `Pair ${p.pair}: the included channels have zero width. Lifetime and decay ratios are undefined in this incomplete scenario; this does not establish a stable particle.`;
  return `Pair ${p.pair}: the W/Z/h two-body sum is ${f(p.weak.sumEV)} eV; the calculated Majoron sum is ${f(p.majoron.sumEV)} eV (${model.settings.majoron?"included":"excluded"}); the chosen extra width is ${f(model.settings.extraEV)} eV. `+
    `The scenario gives cτ = ${f(p.flight.ctauMM)} mm and Δm/Γ = ${f(p.coherence.deltaOverGamma)}. `+
    `The ideal all-time SS/OS ratio is ${f(p.coherence.ssOverOS)}. `+
    `${(100*p.flight.windowProbability).toPrecision(4)}% decay between the selected flight distances at βγ = ${model.settings.boost}; this is not an efficiency or a CMS event prediction.`;
}
