import {CANDIDATE_BOUNDS} from './candidate_bounds_reference.mjs';
export function cbBoundStatus({mh,mW,g4,seed='candidate'}){
  const c=CANDIDATE_BOUNDS.conventions;
  if(!['candidate','published'].includes(seed))throw new RangeError('Unknown gauge seed');
  const applicable=Number.isFinite(mh)&&mh>=c.mhWindowGeV[0]&&mh<=c.mhWindowGeV[1]&&Math.abs(mW-c.mWGeV)<1e-12&&Math.abs(g4-c.g4)<1e-12;
  return {applicable,seed,conventions:c,rows:applicable?CANDIDATE_BOUNDS.seeds[seed].rows:[],
    status:applicable?'certified-within-small-angle-model':'outside-reference-conventions',
    fullPotentialCertified:false,globalTheoryFit:null,
    reason:applicable?'Interval dual certificate and analytic exclusion of the entire A4 tail for each listed rung.':'These certificates require mW=80.4 GeV, g4=0.63 and mh in [123,127] GeV; no rescaling is silently applied.',
    missing:CANDIDATE_BOUNDS.proof.missing,proof:CANDIDATE_BOUNDS.proof};
}
