/* Three-copy extension of the existing ring, diagonal sterile-copy ansatz.
 * The PMNS orientation is an input to the Yukawa reconstruction, not a prediction.
 */
import {nrModel} from './neutrino_ring.mjs';
export const NF_REFERENCE={
  source:'https://www.nu-fit.org/sites/default/files/v61.tbl-parameters.pdf',
  edition:'NuFIT 6.1 (November 2025), IC24 with SK atmospheric data',
  retrieval:'Official table indexed by web search on 2026-10-06; direct PDF server timed out',
  NO:{s12:[.3088,.2893,.3295],s23:[.470,.435,.584],s13:[.02248,.02064,.02418],delta:[212,125,365],dm21:[7.537,7.236,7.823],dm3:[2.511,2.450,2.576]},
  IO:{s12:[.3088,.2893,.3295],s23:[.550,.439,.584],s13:[.02262,.02093,.02441],delta:[274,203,335],dm21:[7.537,7.236,7.822],dm3:[2.483,2.421,2.547]},
  meaning:'Separate one-parameter 3σ ranges; neither a joint likelihood nor a test of nonunitarity'
};
export function nfDefaults(){return {order:0,lightEV:.001,s12:.3088,s23:.470,s13:.02248,delta:212,alpha21:0,alpha31:0,dm21:7.537,dm3:2.511,d1:.0001,d2:.0001,d3:.0001};}
export function nfValidate(input={}){
  const p={...nfDefaults(),...input};
  for(const [k,lo,hi] of [['order',0,1],['lightEV',0,.2],['s12',0,1],['s23',0,1],['s13',0,1],['delta',0,360],['alpha21',0,360],['alpha31',0,360],['dm21',1,15],['dm3',.5,5],['d1',1e-6,.001],['d2',1e-6,.001],['d3',1e-6,.001]])
    if(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw new RangeError(`${k} outside ${lo}…${hi}`);
  if(!Number.isInteger(p.order))throw new RangeError('Ordering must be normal or inverted');return p;
}
const nfAdd=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const nfMul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const nfConj=a=>[a[0],-a[1]];
const nfScale=(a,s)=>[a[0]*s,a[1]*s];
const nfAbs2=a=>a[0]*a[0]+a[1]*a[1];
export function nfPMNS(p){
  const s12=Math.sqrt(p.s12),c12=Math.sqrt(1-p.s12),s23=Math.sqrt(p.s23),c23=Math.sqrt(1-p.s23),s13=Math.sqrt(p.s13),c13=Math.sqrt(1-p.s13),d=p.delta*Math.PI/180;
  const e=[Math.cos(d),Math.sin(d)],z=x=>[x,0];
  const U=[[z(c12*c13),z(s12*c13),nfScale(nfConj(e),s13)],
    [nfAdd(z(-s12*c23),nfScale(e,-c12*s23*s13)),nfAdd(z(c12*c23),nfScale(e,-s12*s23*s13)),z(s23*c13)],
    [nfAdd(z(s12*s23),nfScale(e,-c12*c23*s13)),nfAdd(z(-c12*s23),nfScale(e,-s12*c23*s13)),z(c23*c13)]];
  return U.map(row=>row.map((v,j)=>{const a=[0,p.alpha21,p.alpha31][j]*Math.PI/360;return nfMul(v,[Math.cos(a),Math.sin(a)]);}));
}
export function nfVacuumProbability(U,masses,LoverE,from=1,to=0,antineutrino=false){
  if(!Number.isFinite(LoverE)||LoverE<0)throw new RangeError('Nonnegative finite L/E required');
  const first=masses[0]**2;
  const amp=masses.reduce((a,m,j)=>{
    const phase=-2*1.266932679*(m*m-first)*LoverE;
    let product=nfMul(U[to][j],nfConj(U[from][j]));if(antineutrino)product=nfConj(product);
    return nfAdd(a,nfMul(product,[Math.cos(phase),Math.sin(phase)]));
  },[0,0]);return nfAbs2(amp);
}
export function nfModel(input={},ringInput={}){
  const p=nfValidate(input),base=nrModel(ringInput),U=nfPMNS(p),m0=p.lightEV;
  const masses=p.order===0?[m0,Math.sqrt(m0*m0+p.dm21*1e-5),Math.sqrt(m0*m0+p.dm3*1e-3)]:
    [Math.sqrt(m0*m0+p.dm3*1e-3-p.dm21*1e-5),Math.sqrt(m0*m0+p.dm3*1e-3),m0];
  const deficits=[p.d1,p.d2,p.d3];
  const copies=deficits.map((d,i)=>{
    const mDGeV=Math.abs(base.SchurNSGeV)*Math.sqrt(d/((1-d)*base.KS));
    const prototype=nrModel({...base.input,calibrate:false,mDGeV,muAkeV:1});
    const muAkeV=masses[i]/prototype.lightEV;
    const model=nrModel({...base.input,calibrate:false,mDGeV,muAkeV});
    return {direction:i+1,mDGeV,muAkeV,lightEV:model.lightEV,deficit:model.deficit,expansionRatio:model.expansionRatio,
      insertionToSmallestGap:model.insertionToSmallestGap,pairs:model.pairs.map(pair=>({...pair,flavourWeights:U.map(row=>nfAbs2(row[i])*pair.activeWeight)}))};
  });
  const massMatrix=U.map((row,a)=>U.map((other,b)=>masses.reduce((sum,m,j)=>nfAdd(sum,nfScale(nfMul(nfConj(row[j]),nfConj(other[j])),m)),[0,0])));
  const activeDeficit=U.map((row,a)=>U.map(other=>deficits.reduce((sum,d,j)=>nfAdd(sum,nfScale(nfMul(row[j],nfConj(other[j])),d)),[0,0])));
  const yukawa=U.map(row=>row.map((x,i)=>nfScale(nfConj(x),Math.sqrt(2)*copies[i].mDGeV/246.22)));
  const jarlskog=nfMul(nfMul(U[0][0],U[1][1]),nfConj(nfMul(U[0][1],U[1][0])))[1];
  const mBeta=Math.sqrt(masses.reduce((s,m,j)=>s+nfAbs2(U[0][j])*m*m,0));
  const mBB=Math.sqrt(nfAbs2(masses.reduce((s,m,j)=>nfAdd(s,nfScale(nfMul(U[0][j],U[0][j]),m)),[0,0])));
  const ref=NF_REFERENCE[p.order===0?'NO':'IO'];
  const comparison=Object.entries(ref).map(([key,[best,lo,hi]])=>{
    const value=p[key],inside=key==='delta'?[value,value+360,value-360].some(x=>x>=lo&&x<=hi):value>=lo&&value<=hi;
    return {key,value,best,lo,hi,inside};
  });
  const samples=Array.from({length:161},(_,i)=>{const LoverE=2000*i/160;return {LoverE,nu:nfVacuumProbability(U,masses,LoverE),anti:nfVacuumProbability(U,masses,LoverE,1,0,true)};});
  return {parameters:p,ringParameters:base.used,U,massesEV:masses,rank:masses.filter(m=>m>0).length,copies,
    lightMassMatrixEV:massMatrix,activeDeficit,yukawaMatrix:yukawa,jarlskog,mBetaEV:mBeta,mBBEV:mBB,sumMassEV:masses.reduce((a,m)=>a+m,0),comparison,reference:NF_REFERENCE,samples,
    action:'Three sterile copies of the same charged ring; copy-diagonal hopping, Dirac sterile and Majorana matrices; active Yukawa columns aligned with conjugate PMNS columns',
    scope:'Tree-level inverse construction, leading Majorana order; 3 active directions, 18 heavy quasi-Dirac pairs. Angles and masses are inputs, not predictions.',
    unknown:['Copy-changing interactions set to zero by ansatz, not proved forbidden','Radiative stability of the flavour alignment','Vacuum re-minimization with three copies',
      'Matter effects, full nonunitary oscillation likelihood and detector event rates','Heavy-exchange contribution to neutrinoless double beta decay']};
}
