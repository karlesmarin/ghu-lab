/* Boundary research tools v1.0.0 — pure functions, explicit scopes.
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Spin characters are unweighted diagnostics, not normalized local anomalies.
 * Robin spectra describe a flat uniform boundary coupling, not a GHU vacuum.
 * Literature: hep-ph/0209144 eq41-43, appD; 2012.11622 sec2.7;
 * hep-ph/0102010 eq3-4; 1609.01413 sec3.2. Independent Python references
 * and the ACTION research checkpoint document the derivations and limits.
 */
import { R, str } from '../kernel/charges.mjs';
import { nrEigen } from './neutrino_ring.mjs';

export const BRX_VERSION='1.0.0';
export const BRX_SOURCES=[
  {id:'orbifold-anomalies',url:'https://arxiv.org/html/hep-ph/0209144v1',locator:'eqs41-43,71-72; appendixD'},
  {id:'tensor-quantization',url:'https://arxiv.org/html/2012.11622v2',locator:'sections2.6-2.7,3.3'},
  {id:'identical-families',url:'https://arxiv.org/html/hep-ph/0102010v2',locator:'eqs3-4 and the two-family counterexample'},
  {id:'profile-ansatz',url:'https://arxiv.org/html/1609.01413v2',locator:'section3.2; footnote10 and Table3'}
];
function brxNumberRange(x,lo,hi,name,integer=false){
  if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))
    throw new RangeError(`${name}: expected ${integer?'integer ':''}in [${lo}, ${hi}]`);
  return x;
}

/* x=kL; a=kappa^2 L. Residual avoids the poles of tan(x).
 * The derivative of x tan x is positive in every positive branch.
 */
export function brxRobinRoots(a,count=6){
  brxNumberRange(a,0,100,'kappa^2 L');brxNumberRange(count,1,32,'root count',true);
  return Array.from({length:count},(_,j)=>{
    if(a===0)return {j,x:j*Math.PI,kR:j,residual:0,bracket:[j*Math.PI,j*Math.PI]};
    let lo=j*Math.PI,hi=(j+.5)*Math.PI;
    const f=x=>(j%2?-1:1)*(x*Math.sin(x)-a*Math.cos(x));
    for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;if(f(mid)>0)hi=mid;else lo=mid;}
    const x=(lo+hi)/2;
    return {j,x,kR:x/Math.PI,residual:Math.abs(x*Math.sin(x)-a*Math.cos(x))/(1+a+x),bracket:[lo,hi]};
  });
}

/* Exactly sum the 2^(rank-1) half-spin weights (+/-1/2).
 * Bounded integer Cartan probes keep every integer intermediate below 2^53.
 * mask inserts a product of selected signs; halfSpin=+1 is even minus parity.
 */
export function brxTwistedMoment(rank,mask,degree,cartan,halfSpin=1){
  brxNumberRange(rank,2,10,'Spin rank',true);brxNumberRange(mask,0,(1<<rank)-1,'insertion mask',true);
  brxNumberRange(degree,0,4,'moment degree',true);
  if(![1,-1].includes(halfSpin))throw new RangeError('halfSpin must be +1 or -1');
  if(!Array.isArray(cartan)||cartan.length!==rank)throw new RangeError('One Cartan probe per rank is required');
  cartan.forEach(x=>brxNumberRange(x,-4,4,'Cartan probe',true));
  let numerator=0;
  for(let bits=0;bits<(1<<rank);bits++){
    let chirality=1,insertion=1,dot=0;
    for(let i=0;i<rank;i++){const sign=(bits&(1<<i))?-1:1;chirality*=sign;if(mask&(1<<i))insertion*=sign;dot+=sign*cartan[i];}
    if(chirality===halfSpin)numerator+=insertion*dot**degree;
  }
  if(!Number.isSafeInteger(numerator))throw new RangeError('Exact integer range exceeded');
  return R(numerator,2**degree);
}

/* Numeric rank of a Hermitian Gram matrix using the shared real Jacobi engine.
 * Realification duplicates each eigenvalue; numerical rank includes a tolerance.
 */
export function brxGramSpectrum(real,imag,tolerance=1e-10){
  brxNumberRange(tolerance,1e-14,1e-3,'rank tolerance');
  const n=real?.length;
  if(!Number.isInteger(n)||n<1||n>32||!Array.isArray(imag)||imag.length!==n)throw new RangeError('Gram size must be 1..32');
  for(const matrix of [real,imag])for(const row of matrix)
    if(!Array.isArray(row)||row.length!==n||row.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw new RangeError('Gram entries must be finite numbers in square arrays');
  const scale=Math.max(1,...real.flat().map(Math.abs),...imag.flat().map(Math.abs));
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)
    if(Math.abs(real[i][j]-real[j][i])>1e-12*scale||Math.abs(imag[i][j]+imag[j][i])>1e-12*scale)
      throw new RangeError('Gram matrix must be Hermitian');
  const block=Array.from({length:2*n},(_,i)=>Array.from({length:2*n},(_,j)=>
    i<n?(j<n?real[i][j]:-imag[i][j-n]):(j<n?imag[i-n][j]:real[i-n][j-n])));
  const doubled=nrEigen(block).map(e=>e.value),values=Array.from({length:n},(_,i)=>(doubled[2*i]+doubled[2*i+1])/2);
  const threshold=tolerance*Math.max(1,...values.map(Math.abs));
  if(values[0]<-threshold)throw new RangeError('Matrix is not positive semidefinite at the stated tolerance');
  return {values,rank:values.filter(x=>x>threshold).length,threshold,tolerance,
    interpretation:'Numerical linear independence of these profiles; not a count of physical families or an operator-domain certificate.'};
}
export function brxProfileGram(mass=1,angles=[0,Math.PI/2,Math.PI]){
  brxNumberRange(mass,0,2,'profile mass M');
  if(!Array.isArray(angles)||angles.length<1||angles.length>12)throw new RangeError('Use 1..12 profile angles');
  angles.forEach(t=>brxNumberRange(t,-Math.PI*2,Math.PI*2,'profile angle'));
  const integral=x=>Math.abs(x)<1e-8?1+x/2+x*x/6+x*x*x/24:Math.expm1(x)/x;
  const real=angles.map(a=>angles.map(b=>(1+Math.cos(b-a))*integral(mass*(Math.cos(a)+Math.cos(b)))*integral(mass*(Math.sin(a)+Math.sin(b)))));
  const imag=angles.map(a=>angles.map(b=>Math.sin(b-a)*integral(mass*(Math.cos(a)+Math.cos(b)))*integral(mass*(Math.sin(a)+Math.sin(b)))));
  return {mass,angles:[...angles],lengths:[1,1],real,imag,...brxGramSpectrum(real,imag)};
}

/* For a standalone six-dimensional SU2 theory with complex Weyl doublets only.
 * No orbifold coefficient is inferred. Additional reps, inflow and global
 * quotients require an appropriately extended calculation.
 */
export function brxSU2TensorCondition(doubletExcess){
  brxNumberRange(doubletExcess,-100000,100000,'signed complex-doublet excess',true);
  return {complexDoubletExcess:doubletExcess,halfDoubletCoefficient:2*doubletExcess,
    residue:((doubletExcess%6)+6)%6,passes:doubletExcess%6===0,
    scope:'Restricted standalone 6D SU2 tensor condition. No verdict on the complete 8D orbifold, its inflow or its global quotient.'};
}
export function brxFamilyCondition(generations,leptonSign){
  brxNumberRange(generations,0,12,'identical 6D families',true);
  if(![-1,1].includes(leptonSign))throw new RangeError('Lepton chirality must be +1 or -1');
  return {...brxSU2TensorCondition(generations*(3+leptonSign)),generations,leptonSign,
    assumption:'All families share the same 6D chirality assignments; Q has positive chirality. This is not inferred from three 4D zero modes.'};
}
export function brxLandscape(maxStrength=4,steps=24){
  brxNumberRange(maxStrength,.001,100,'map maximum');brxNumberRange(steps,4,64,'map steps',true);
  const strengths=Array.from({length:steps+1},(_,i)=>maxStrength*i/steps);
  const theta=Array.from({length:steps+1},(_,j)=>Math.PI*j/steps);
  const roots=strengths.map(a=>brxRobinRoots(a,1)[0].kR);
  return {maxStrength,steps,strengths,theta,roots,masses:roots.map(k=>theta.map(t=>Math.hypot(k,t/(2*Math.PI)))),
    colorRange:[0,Math.SQRT1_2],scope:'Lightest paired periodic branch, dimensionless mR; sampled values, no fitted surface.'};
}
export function brxDefaults(){return {strength:1,theta:.2,profileMass:1,generations:3,leptonSign:-1,insertion:3,viewMode:0,viewAngle:35};}
export function brxValidate(input={}){
  const p={...brxDefaults(),...input};
  brxNumberRange(p.strength,0,100,'kappa^2 L');brxNumberRange(p.theta,0,Math.PI,'Wilson theta');
  brxNumberRange(p.profileMass,0,2,'profile mass M');brxFamilyCondition(p.generations,p.leptonSign);
  if(![3,31,991].includes(p.insertion))throw new RangeError('Unknown Spin20 insertion');
  if(![0,1].includes(p.viewMode))throw new RangeError('Choose 2D or 3D');
  brxNumberRange(p.viewAngle,15,75,'3D viewing angle');
  return p;
}
export function brxModel(input={}){
  const p=brxValidate(input),roots=brxRobinRoots(p.strength),gram=brxProfileGram(p.profileMass),family=brxFamilyCondition(p.generations,p.leptonSign);
  const cartan=[1,2,1,0,-1,1,0,1,-1,2];
  const moments=Array.from({length:5},(_,degree)=>({degree,value:brxTwistedMoment(10,p.insertion,degree,cartan)}));
  const curve=Array.from({length:81},(_,i)=>{const theta=Math.PI*i/80,q=theta/(2*Math.PI);return {theta,unpaired:q,paired:Math.hypot(roots[0].kR,q)};});
  return {schema:'ghu-boundary-research-v1',toolVersion:BRX_VERSION,parameters:p,roots,gram,family,moments,cartan,curve,
    landscape:brxLandscape(Math.max(4,p.strength)),
    atTheta:{unpaired:p.theta/(2*Math.PI),paired:Math.hypot(roots[0].kR,p.theta/(2*Math.PI))},
    values:{firstPairedRoot:{value:roots[0].kR,status:'verified',scope:'Numerical Robin root kR for L=pi R'},
      profileRank:{value:gram.rank,status:'verified',scope:gram.interpretation},
      fullAnomalyCancellation:{value:null,status:'unknown',scope:'Unweighted moments do not establish local or global cancellation.'}},
    assumptions:['Separate diagnostics, not a joint GHU fit.','Robin spectrum: flat metric, uniform coupling and orientations, common tangent gauge connection, no extra boundary kinetic terms; L5=L6=pi R and periodic transverse branch.',
      'Wilson theta is imposed; no potential minimum or experimental mass scale is determined.','Profile example: unit rectangle and three exponential solutions from a restricted ansatz; no full-domain or compactification claim.',
      'Spin20: positive half-spin weights, integer Cartan probe, product-of-sign insertion; no projector, cover, consistent-descent or inflow coefficients.'],
    liftAudit:{rawSquare:-1,representationSquare:1,phase:'Ua=-i ta',ordinaryEquivariantLift:'not_established',extendedAction:'not_checked'},
    unknown:['Normalized local anomaly distribution and 7D mirror parity anomaly','Global group quotients, charge lattice and inflow','Full tensor/axion spectrum, Higgs vacuum, flavour and neutrino masses'],sources:BRX_SOURCES};
}
