/* Official reference curves; conditional overlay, never a model exclusion. */
import NR_HNL_LIMITS from '../../data/neutrino_hnl_limits.json' with {type:'json'};
export function nrLimitCurve(flavour='electron',kind='dirac') {
  const curve=NR_HNL_LIMITS.curves.find(c=>c.flavour===flavour&&c.kind===kind);
  if(!curve)throw new RangeError('Unknown HNL reference hypothesis');
  return curve;
}
export function nrLimitAt(curve,massGeV) {
  if(!Number.isFinite(massGeV))throw new RangeError('Finite mass required');
  const rows=curve.rows,exact=rows.filter(r=>r.massGeV===massGeV);
  if(exact.length>1)return {status:'transition',massGeV,alternatives:exact};
  if(exact.length===1)return {status:'published-point',...exact[0],bracketGeV:[massGeV,massGeV]};
  if(massGeV<rows[0].massGeV||massGeV>rows.at(-1).massGeV)return {status:'outside-domain',massGeV};
  const j=rows.findIndex(r=>r.massGeV>massGeV),a=rows[j-1],b=rows[j],t=(massGeV-a.massGeV)/(b.massGeV-a.massGeV);
  const result={status:'interpolated',massGeV,bracketGeV:[a.massGeV,b.massGeV]};
  for(const key of ['observed','expected','expected68lo','expected68hi','expected95lo','expected95hi'])
    result[key]=Math.exp(Math.log(a[key])*(1-t)+Math.log(b[key])*t);
  return result;
}
export function nrCompare(result,flavour='electron',kind='dirac') {
  const curve=nrLimitCurve(flavour,kind),factor=kind==='dirac'?1:.5;
  return {analysis:NR_HNL_LIMITS.analysis,doi:curve.doi,source_sha256:curve.source_sha256,
    flavour,kind,confidence_level:.95,interpolation:NR_HNL_LIMITS.interpolation,
    mapping:kind==='dirac'?'Pair-summed active weight, assigned entirely to the selected flavour; single Dirac reference.':'Half the pair active weight per Majorana component, assigned entirely to the selected flavour; single-state reference only.',
    rows:result.pairs.map(p=>{const limit=nrLimitAt(curve,p.centerGeV),weight=factor*p.activeWeight;
      return {pair:p.pair,massGeV:p.centerGeV,pairActiveWeight:p.activeWeight,referenceWeight:weight,limit,
        ratioObserved:limit.observed?weight/limit.observed:null,ratioExpected:limit.expected?weight/limit.expected:null};}),
    exclusion_status:'not-evaluated',missing:NR_HNL_LIMITS.missing_for_model_exclusion,
    note:'A point below a reference limit does not establish viability of this model. Rates, lifetime, additional channels and interference have not been matched.'};
}
