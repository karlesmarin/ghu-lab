/* GHU reference experiment: top KK contribution only. No DOM and no model-builder matching. */
import {rggFromTopTower,mkkLowerBound,CARSON_OKADA_TOP_ROW} from '../kernel/higgsrate.mjs';

export function hdDefaults() {return {mKK:2000,mTop:173.34,modes:30,lower:.89,upper:1.19,custom:false};}
export const HD_LIMITS={mKK:[500,10000],mTop:[160,185],modes:[1,1000],lower:[.5,1.05],upper:[.6,1.5]};
export const HD_SCOPE='SU(3) x U(1) prime on S1/Z2; only top KK modes; leading heavy-mass expansion and low-energy theorem. No extra coloured multiplets, branching-ratio fit or matching to the SU(N) builder.';

export function hdModel(input={}) {
  const p={...hdDefaults(),...input};
  for(const [k,[lo,hi]] of Object.entries(HD_LIMITS))
    if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi||(k==='modes'&&!Number.isInteger(p[k])))throw new RangeError('Invalid '+k);
  if(typeof p.custom!=='boolean')throw new TypeError('custom must be boolean');
  const window=p.custom?[p.lower,p.upper]:[...CARSON_OKADA_TOP_ROW.rggWindow];
  if(window[0]>=window[1])throw new RangeError('Lower window edge must be smaller than upper edge');
  const x=p.mTop/p.mKK, domainMin=5*p.mTop, inDomain=x<=.2;
  const provenance=p.custom?'User-defined scenario; no experimental confidence level':'Historical ATLAS+CMS window used by Carson–Okada, Table 1; not a current fit';
  const rawBound=mkkLowerBound(window[0],p.mTop).bound;
  const domainFloor=rggFromTopTower(domainMin,p.mTop);
  const empty=window[0]>=1||window[1]<domainFloor;
  const interval=empty?{empty:true,lower:null,upper:null,upperUnbounded:false}:
    {empty:false,lower:Math.max(domainMin,rawBound??domainMin),
      upper:window[1]<1?mkkLowerBound(window[1],p.mTop).bound:null,upperUnbounded:window[1]>=1};
  const common={input:p,window,provenance,domainMin,interval,rawBound,expansionParameter:x*x,inDomain,
    scope:HD_SCOPE,domainPolicy:'mTop/MKK <= 0.2 is a laboratory domain policy, not a published error bound.'};
  if(!inDomain)return {...common,rgg:null,finiteRgg:null,letRgg:null,shift:null,rateTailBound:null,
    comparison:'not-evaluated',summary:'Outside the chosen heavy-tower domain. Increase MKK or reduce mTop; no rate or window verdict is quoted.'};
  let sum=0;
  for(let n=1;n<=p.modes;n++)sum+=1/(n*n);
  const shift=2*x*x*sum, fullShift=Math.PI**2/3*x*x;
  const finiteRgg=(1-shift)**2,rgg=rggFromTopTower(p.mKK,p.mTop);
  // Integral test: 0 < zeta(2)-sum_N < 1/N. Positive amplitudes in this domain.
  const amplitudeTailBound=2*x*x/p.modes;
  const rateTailBound=2*(1-shift)*amplitudeTailBound;
  // Determinant LET without the leading x^2 expansion: 1 - sum 2x^2/(n^2-x^2) = pi*x*cot(pi*x).
  // This is a diagnostic within the LET, not the full finite-mass loop result.
  const letAmplitude=Math.PI*x/Math.tan(Math.PI*x),letRgg=letAmplitude**2;
  const comparison=rgg<window[0]?'below-window':rgg>window[1]?'above-window':'inside-window';
  return {...common,shift:fullShift,rgg,finiteRgg,letRgg,amplitudeTailBound,rateTailBound,
    rateTail:finiteRgg-rgg,letDifference:letRgg-rgg,comparison,
    summary:`At MKK = ${(p.mKK/1000).toFixed(3)} TeV, the leading top-tower rate is ${rgg.toFixed(6)} times the SM reference (${(100*(rgg-1)).toFixed(3)}%). The point is ${comparison.replaceAll('-',' ')}. `+
      `${p.modes} KK levels leave a rate difference of ${(finiteRgg-rgg).toExponential(2)} from the analytic sum. `+
      (p.custom?'The window is a user scenario.':'The window is the historical paper benchmark.')};
}

export function hdCurve(input,steps=100) {
  const p={...hdDefaults(),...input},lo=Math.max(500,5*p.mTop);
  return Array.from({length:steps+1},(_,i)=>{const mKK=lo+(10000-lo)*i/steps;
    return {mKK,rgg:rggFromTopTower(mKK,p.mTop)};});
}
