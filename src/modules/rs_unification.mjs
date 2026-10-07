/* Planck-brane differential running, arXiv:2512.22094 eqs. (32),(33), Sec. 6.
 * b here follows d(alpha^-1)/d ln q = -b/(2 pi), opposite the paper's b.
 */
import {runCouplings,SM_B} from '../kernel/running.mjs';
export function ruValidate(input={}) {
  const p={content:1,irTeV:10,logUV:18,lambda21:0,lambda31:0,cPlus:.7,cMinus:-.7,mUV:0,...input};
  for(const [k,lo,hi] of [['content',1,2],['irTeV',1,100],['logUV',15,19],['lambda21',-3,3],['lambda31',-3,3],['cPlus',-.99,.99],['cMinus',-.99,.99],['mUV',0,1]])
    if(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw new RangeError(`${k} outside ${lo}…${hi}`);
  if(!Number.isInteger(p.content))throw new RangeError('Select C1 or C2');return p;
}
export function ruFermion(c,uvParity) {
  if(!Number.isFinite(c)||![1,-1].includes(uvParity))throw new RangeError('Finite bulk c and parity ±1 required');
  if(c===.5||c===-.5)return {chirality:null,status:'Marginal localization: use full logarithmic propagator; sharp localization approximation withheld'};
  const chirality=c>.5&&uvParity===1?'LH':c<-.5&&uvParity===-1?'RH':null;
  return {chirality,status:chirality?'One elementary Weyl contribution':'No elementary Weyl pole in the asymptotic Planck-brane correlator'};
}
export function ruModel(input={}) {
  const p=ruValidate(input),T=p.irTeV*1000,k=10**p.logUV,low=runCouplings(T);
  // C1 removes an entire third-generation 10; it changes only the common slope.
  // C2 removes t_R and adds the exotics completing it to a 10. Universal +1
  // is retained here but cancels identically from both displayed differences.
  const higgs=[.1,1/6,0],top=[8/15,0,1/3];
  const b=SM_B.map((x,i)=>x-higgs[i]+(p.content===1?-1:1-2*top[i]));
  const delta0=[low.inv[1]-low.inv[0],low.inv[2]-low.inv[0]],db=[b[1]-b[0],b[2]-b[0]];
  const at=q=>delta0.map((d,i)=>d-db[i]*Math.log(q/T)/(2*Math.PI));
  const endpoint=at(k),required=endpoint.map(x=>x/(4*Math.PI)),chosen=[p.lambda21,p.lambda31];
  const samples=Array.from({length:101},(_,i)=>{const logQ=Math.log10(T)+(p.logUV-Math.log10(T))*i/100;return {logQ,delta:at(10**logQ)};});
  const plus=ruFermion(p.cPlus,1),minus=ruFermion(p.cMinus,-1);
  const uvPair=plus.chirality==='LH'&&minus.chirality==='RH';
  const uvMassGeV=uvPair?k*p.mUV*Math.sqrt((1-2*p.cPlus)*(1+2*p.cMinus)):null;
  return {parameters:p,bRepresentative:b,deltaB:db,irGeV:T,uvGeV:k,endpoint,requiredDeltaLambda:required,
    residual:required.map((x,i)=>x-chosen[i]),maxRequired:Math.max(...required.map(Math.abs)),samples,
    matching:{approximation:'SM below T, continuous matching at T; finite IR thresholds omitted as in the paper Sec. 5',reference:low},
    uvFermionProbe:{plus,minus,uvMassGeV,contributesAsDirac:uvPair,
      scope:'Independent localization/UV-mass diagnostic; this probe is not added to the C1/C2 matter spectrum'},
    nda:1/(16*Math.PI**2),source:'https://arxiv.org/abs/2512.22094',
    scope:'One-loop differential Planck-brane correlator in T << q << k; extrapolation to k is a boundary diagnostic',
    unknown:['Finite IR matching and threshold corrections','Two-loop corrections','Absolute universal tree coupling and positivity of individual brane kinetic terms']};
}
