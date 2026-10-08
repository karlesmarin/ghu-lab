import {CANDIDATE_BOUNDS} from './candidate_bounds_reference.mjs';
import {combMatch} from '../kernel/screens.mjs';
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

/* One evidence object for the plotted comb, spacing table and JSON. A certified
 * upper bound is not an attained mass, a full-potential bound or a theory fit. */
export function cbCombEvidence({mh,mW,g4,seed='candidate',MKK=null,tol=50}){
  const bounds=cbBoundStatus({mh,mW,g4,seed}), odd=seed==='published';
  const rows=Array.from({length:odd?11:10},(_,i)=>{
    const k=2*i+(odd?1:2), certificate=bounds.rows.find(r=>r.k8D===k);
    return {k8D:k,upperGeV:certificate?.upperGeV??null};
  });
  const valid=[mh,mW,g4].every(x=>Number.isFinite(x)&&x>0)&&Number.isFinite(tol)&&tol>=0&&
    (MKK===null||(Number.isFinite(MKK)&&MKK>0));
  const hits=valid&&MKK!==null?combMatch({MKK,tolGeV:tol,mh,mW,g4,kmax:21,parity:odd?'odd':'even'}).map(h=>{
    const bound=rows.find(r=>r.k8D===h.k).upperGeV;
    return {...h,upperGeV:bound,withinConditionalBound:bound===null?null:h.M<=bound};
  }):[];
  const retained=hits.filter(h=>h.withinConditionalBound!==false);
  const status=!valid?'invalid-input':MKK===null?'no-candidate':bounds.applicable?'conditional-bound-screen':'arithmetic-only';
  const title=!valid?'Input needs correction':MKK===null?'Type a candidate M_KK to inspect nearby teeth':
    bounds.applicable?`${retained.length} nearby matches not ruled out by the conditional bounds`:`${hits.length} nearby arithmetic matches; bounds not applicable`;
  const reason=!valid?'Positive finite masses and couplings, and a nonnegative finite tolerance, are required.':
    `${bounds.reason} Only listed rungs k ≤ 21 and the three nearest teeth per rung are sampled. A surviving tooth is not proof of an attainable mass; absence of a sampled match is not a theory exclusion. Full-potential certification and a global theory fit remain unavailable.`;
  return {status,valid,inputs:{mh,mW,g4,seed,MKK,tol},bounds,rows,hits,retained,title,reason,
    attainmentEstablished:false,fullPotentialCertified:false,globalTheoryFit:null};
}
