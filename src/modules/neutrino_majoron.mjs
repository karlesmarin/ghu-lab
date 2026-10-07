/* Canonically normalized massless Majoron in the U(1)^5 research ring.
 * Leading conserving basis, exact mixing; no radial-vacuum assumption is tested.
 * See docs/neutrino-majoron.md for the horizontal projection and Ward identity.
 */
export function njGeometry(fGeV,chiOverF=1,sigmaOverF=1) {
  for(const x of [fGeV,chiOverF,sigmaOverF])
    if(typeof x!=='number'||!Number.isFinite(x)||x<=0)throw new RangeError('Positive finite VEV scales required');
  const f=fGeV,w=f*chiOverF,s=f*sigmaOverF;
  const Fbeta=1/Math.sqrt(24/(5*f*f)+4/(w*w)+1/(s*s));
  const a0=4*Fbeta**2/w**2,b=Fbeta**2/(5*f*f);
  const a=[a0,a0+12*b,a0+24*b,a0+16*b,a0+8*b];
  const tangent=[6*Fbeta/(5*f*f),6*Fbeta/(5*f*f),...Array(3).fill(-4*Fbeta/(5*f*f)),2*Fbeta/w**2,Fbeta/s**2];
  // A common identity drops out of off-diagonal conserving-basis matrix elements.
  const left=[0,0,...a.map(x=>-x/(2*Fbeta))],right=[0,...a.map(x=>-x/(2*Fbeta))];
  return {FbetaGeV:Fbeta,FJGeV:2*Fbeta,phaseTangentGeVInv:tangent,
    kineticFractions:tangent.map((x,i)=>x*x*(i<5?f*f:i===5?w*w:s*s)),left,right};
}

export function njModel(ring,{chiOverF=1,sigmaOverF=1}={}) {
  const geometry=njGeometry(ring.used.fGeV,chiOverF,sigmaOverF);
  const {left,right,zero}=ring.conservingBasis;
  const element=(v,q,u)=>v.reduce((s,x,k)=>s+x*q[k]*u[k],0);
  const rows=ring.pairs.map((pair,i)=>{
    const M=pair.centerGeV;
    const lightCoupling=element(left[i],geometry.left,zero);
    const lightEV=lightCoupling**2*M**3/(32*Math.PI)*1e9;
    const cascades=ring.pairs.slice(0,i).map((p,j)=>{
      const qL=element(left[j],geometry.left,left[i]);
      const qR=element(right[j],geometry.right,right[i]);
      return {daughterPair:p.pair,daughterGeV:p.centerGeV,qLGeVInv:qL,qRGeVInv:qR,
        widthEV:(qL*qL+qR*qR)*(M*M-p.centerGeV**2)**3/(32*Math.PI*M**3)*1e9};
    });
    return {pair:pair.pair,lightEV,cascades,sumEV:lightEV+cascades.reduce((a,x)=>a+x.widthEV,0)};
  });
  return {geometry,rows,parameters:{chiOverF,sigmaOverF},
    scope:'Massless physical Majoron; per pair component, zeroth order in Majorana insertions; exact conserving mixing',
    assumptions:['Global symmetry exact at this order','Collective theta fixed at pi',
      'Changing scalar VEV ratios retunes Yukawas to hold the displayed fermion mass matrix fixed',
      'Heavy daughter pairs summed; intrapair Majoron emission vanishes at conserving order'],
    unknown:['Finite-Majorana corrections to these widths','Radial vacuum and scalar mixing','Other scalar and gauge decay channels']};
}
