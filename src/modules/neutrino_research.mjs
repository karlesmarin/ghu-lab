/* Fixed-light-input identifiability in the copy-diagonal ring.
 * CC kernels follow Blennow et al., 1609.08637, eqs. (5),(7), in vacuum.
 * Near normalization is a stated hypothetical protocol, not an IceCube prediction.
 */
import {nfModel,nfValidate,nfVacuumProbability} from './neutrino_flavour.mjs';
export const NI_AXES=[
  {key:'muBkeV',label:'Majorana μB [keV]',lo:0,hi:5000,log:false,target:'ring',reading:'Heavy-pair splitting can change while leading light masses, mixing and active residues stay fixed. Resolving it needs lepton-number-sensitive observables and a decay/interference calculation.'},
  {key:'fGeV',label:'Sterile scale f [GeV]',lo:500,hi:5000,log:false,target:'ring',reading:'The heavy mass scale changes while the light inputs and active deficits are reconstructed. Direct heavy-state production or other mass-sensitive observables could distinguish these points.'},
  {key:'t',label:'Ring hopping t',lo:.4,hi:1.2,log:false,target:'ring',reading:'The ring geometry changes the heavy spectrum and the couplings required to reconstruct the same light inputs.'},
  {key:'q',label:'Ring link q',lo:.1,hi:.4,log:false,target:'ring',reading:'The ring geometry changes the heavy spectrum and the couplings required to reconstruct the same light inputs.'},
  {key:'r',label:'Ring link r',lo:.2,hi:.5,log:false,target:'ring',reading:'The ring geometry changes the heavy spectrum and the couplings required to reconstruct the same light inputs.'},
  {key:'common',label:'Common deficit d₁=d₂=d₃',lo:1e-6,hi:1e-3,log:true,target:'flavour',reading:'For equal deficits, N=√(1−d)U. The raw vacuum CC kernel scales by (1−d)²; the displayed near-normalized factor cancels this common suppression exactly. Absolute normalization needs a specified weak-input and detector analysis.'},
  ...[1,2,3].map(i=>({key:'d'+i,label:'Active deficit direction '+i,lo:1e-6,hi:1e-3,log:true,target:'flavour',reading:'Unequal deficits can change flavour-dependent current strengths and the normalized vacuum shape. Those responses need a fit allowing nonunitarity before they become experimental limits.'}))
];
export function niDefaults(){return {axis:0,position:.1,copy:0,pair:1,from:1,to:0,antineutrino:0};}
export function niValidate(input={}){
  const p={...niDefaults(),...input};
  for(const [k,lo,hi] of [['axis',0,8],['position',0,1],['copy',0,2],['pair',1,6],['from',0,2],['to',0,2],['antineutrino',0,1]])
    if(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi||(k!=='position'&&!Number.isInteger(p[k])))throw new RangeError(k+' outside the research control domain');
  return p;
}
export function niAxisValue(axis,fraction){
  if(!NI_AXES.includes(axis)||!Number.isFinite(fraction)||fraction<0||fraction>1)throw new RangeError('Invalid sweep coordinate');
  if(fraction===0)return axis.lo;
  if(fraction===1)return axis.hi;
  return axis.log?Math.exp(Math.log(axis.lo)+(Math.log(axis.hi)-Math.log(axis.lo))*fraction):axis.lo+(axis.hi-axis.lo)*fraction;
}
export function niLightMixing(result){return result.U.map(row=>row.map((z,i)=>z.map(x=>x*Math.sqrt(1-result.parameters['d'+(i+1)]))));}
export function niVacuumCC(result,LoverE,from=1,to=0,anti=false){
  if(!Number.isFinite(LoverE)||LoverE<0||![from,to].every(x=>Number.isInteger(x)&&x>=0&&x<=2)||typeof anti!=='boolean')throw new RangeError('Invalid vacuum channel or L/E');
  const N=niLightMixing(result),z=N.map(row=>row.reduce((s,c)=>s+c[0]**2+c[1]**2,0));
  let re=0,im=0;
  for(let i=0;i<3;i++){
    const a=N[to][i],b=N[from][i],real=a[0]*b[0]+a[1]*b[1],imag=(anti?-1:1)*(a[1]*b[0]-a[0]*b[1]);
    const phase=-2*1.266932679*(result.massesEV[i]**2-result.massesEV[0]**2)*LoverE;
    re+=real*Math.cos(phase)-imag*Math.sin(phase);im+=real*Math.sin(phase)+imag*Math.cos(phase);
  }
  const ccKernel=re*re+im*im;
  return {ccKernel,nearNormalized:ccKernel/(z[from]*z[from]),sourceStrength:z[from],detectionStrength:z[to],
    unitary:nfVacuumProbability(result.U,result.massesEV,LoverE,from,to,anti)};
}
function niBracket(axis,value){
  if(value<axis[0]||value>axis.at(-1))return null;
  if(value===axis.at(-1))return [axis.length-2,1];
  let lo=0,hi=axis.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(axis[mid]<=value)lo=mid;else hi=mid;}
  return [lo,(value-axis[lo])/(axis[lo+1]-axis[lo])];
}
export function niDeepCore(reference,input={}){
  const p=nfValidate(input),order=p.order===0?'NO':'IO';
  const dm32EV2=p.order===0?p.dm3*1e-3-p.dm21*1e-5:-p.dm3*1e-3;
  const map=reference.maps[order],mx=niBracket(map.s23,p.s23),my=niBracket(map.dm32EV2,dm32EV2);
  const result={order,s23:p.s23,dm32EV2,edition:reference.edition,doi:reference.doi,scope:reference.scope,
    domain:{s23:[map.s23[0],map.s23.at(-1)],dm32EV2:[map.dm32EV2[0],map.dm32EV2.at(-1)]},
    tabulatedMinimum:map.tabulatedMinimum,applicable:false,deltaChi2:null,orderingComparison:null,ringExclusion:null,combinedNuFIT:null};
  if(!mx||!my)return {...result,reason:'Outside the archived grid; no extrapolated reference is assigned.'};
  const [i,x]=mx,[j,y]=my,a=map.deltaChi2[j],b=map.deltaChi2[j+1];
  return {...result,applicable:true,deltaChi2:(1-y)*((1-x)*a[i]+x*a[i+1])+y*((1-x)*b[i]+x*b[i+1]),
    cell:{i,j,x,y},reason:'Interpolated published standard-three-neutrino reference; not a fit of the nonunitary ring.'};
}
function niPoint(axis,value,flavour,ring){
  const f={...flavour},r={...ring};
  if(axis.target==='ring')r[axis.key]=value;
  else if(axis.key==='common')for(const key of ['d1','d2','d3'])f[key]=value;
  else f[axis.key]=value;
  try{return {valid:true,result:nfModel(f,r)};}
  catch(error){if(error instanceof RangeError)return {valid:false,reason:error.message,flavour:f,ring:r};throw error;}
}
function niMeasure(r,base,p){
  const c=r.copies[p.copy],pair=c.pairs[p.pair-1],z=niVacuumCC(r,0,p.from,p.to,!!p.antineutrino);
  let maxShape=0;
  for(let i=0;i<=80;i++){const a=niVacuumCC(r,25*i,p.from,p.to,!!p.antineutrino);maxShape=Math.max(maxShape,Math.abs(a.nearNormalized-a.unitary));}
  return {massGeV:pair.centerGeV,splitEV:pair.splitEV,activeWeight:pair.activeWeight,muAkeV:c.muAkeV,mDGeV:c.mDGeV,
    lightResidualEV:Math.max(...r.copies.map((x,i)=>Math.abs(x.lightEV-base.massesEV[i]))),
    mixingResidual:Math.max(...r.U.flatMap((row,a)=>row.flatMap((v,i)=>v.map((x,k)=>Math.abs(x-base.U[a][i][k]))))),
    maxShapeDifference:maxShape,sourceStrength:z.sourceStrength,zeroDistanceCC:z.ccKernel,zeroDistanceNear:z.nearNormalized,
    maxInsertionRatio:Math.max(...r.copies.map(x=>x.expansionRatio)),maxInsertionToGap:Math.max(...r.copies.map(x=>x.insertionToSmallestGap))};
}
export function niModel(input={},flavour={},ring={},reference=null,steps=24){
  const p=niValidate(input),f=nfValidate(flavour),base=nfModel(f,ring),axis=NI_AXES[p.axis];
  if(!Number.isInteger(steps)||steps<4||steps>160)throw new RangeError('Sweep needs 4–160 intervals');
  const selectedValue=niAxisValue(axis,p.position),point=niPoint(axis,selectedValue,f,ring);
  const rows=Array.from({length:steps+1},(_,i)=>{
    const value=niAxisValue(axis,i/steps),item=niPoint(axis,value,f,ring);
    return item.valid?{value,x:axis.log?Math.log10(value):value,valid:true,...niMeasure(item.result,base,p)}:{value,x:axis.log?Math.log10(value):value,valid:false,reason:item.reason};
  });
  const good=rows.filter(x=>x.valid),selected=point.valid?{...niMeasure(point.result,base,p),flavour:point.result.parameters,
    ring:point.result.ringParameters,lightMixing:niLightMixing(point.result),activeDeficit:point.result.activeDeficit,
    massesEV:point.result.massesEV,copies:point.result.copies}:null;
  const curves=point.valid?Array.from({length:161},(_,i)=>({LoverE:12.5*i,...niVacuumCC(point.result,12.5*i,p.from,p.to,!!p.antineutrino)})):[];
  return {parameters:p,flavourInputs:f,ringInputs:base.ringParameters,axis,selectedValue,selected,selectedFailure:point.valid?null:point.reason,rows,curves,
    referencePoint:niMeasure(base,base,p),lightTargetsEV:base.massesEV,unitaryInputs:base.U,
    summary:{valid:good.length,invalid:rows.length-good.length,total:rows.length,
      maxLightResidualEV:good.length?Math.max(...good.map(x=>x.lightResidualEV)):null,
      maxMixingResidual:good.length?Math.max(...good.map(x=>x.mixingResidual)):null,
      maxInsertionToGap:good.length?Math.max(...good.map(x=>x.maxInsertionToGap)):null,
      massRangeGeV:good.length?[Math.min(...good.map(x=>x.massGeV)),Math.max(...good.map(x=>x.massGeV))]:null,
      splitRangeEV:good.length?[Math.min(...good.map(x=>x.splitEV)),Math.max(...good.map(x=>x.splitEV))]:null},
    deepcore:reference?niDeepCore(reference,f):null,
    scope:'Fixed light masses and PMNS inputs are reconstructed at tree level, leading Majorana order. Vacuum CC kernels assume inaccessible heavy states. Near normalization divides by the source current strength squared under the stated hypothetical protocol; it is not the IceCube response. Matter, fluxes, cross sections, weak-input refits and detector likelihoods are not included.',
    reading:axis.reading,
    sources:['https://arxiv.org/abs/1609.08637','docs/neutrino-ring.md','docs/neutrino-identifiability.md'],
    unknown:['Nonunitary experimental likelihood and detector rates','Radiative and full-vacuum constraints on the reconstructed path','Exclusion of the ring by DeepCore','Combined NuFIT plus IceCube likelihood']};
}
