/* Maru–Nago JHEP 11 (2024) 035, eq. (4.3), Types 2/3 with k1=0. */
import {sun5dBlocks,sun5dTerms,sun5dV} from './sun5d.mjs';
export const MN_ROWS=[
  [1,1,.104072,.10320378496813378],[1,2,.171499,.17163752450594276],
  [2,2,0,0],[2,3,.0443208,.04523404118675046],[2,4,.103231,.10305893441893061],
  [3,4,0,0],[3,5,.0305824,.03262232983327023],[3,6,.0785057,.07835804855471781]
];
export function mnValidate(input={}) {
  const p={k3:3,Nad:5,windings:240,...input};
  for(const [k,lo,hi] of [['k3',0,3],['Nad',0,60],['windings',5,2400]])
    if(!Number.isInteger(p[k])||p[k]<lo||p[k]>hi)throw new RangeError(`${k}: integer ${lo}…${hi} required`);
  return p;
}
export function mnContext(input={}) {
  const p=mnValidate(input),blocks={nPP:3,nPM:2,nMP:1,nMM:0};
  const bulk={'anti|1|dirac':3,'anti|-1|dirac':3-p.k3,'sym|-1|dirac':p.k3,'adj|1|dirac':p.Nad};
  const b=sun5dBlocks(blocks),content={bulk:Object.entries(bulk).filter(([,n])=>n).map(([key,multiplicity])=>{
    const [rep,eta,kind]=key.split('|');return {rep,eta:+eta,kind,multiplicity};})};
  return {parameters:p,blocks,bulk,b,terms:sun5dTerms(b,content),
    spectators:{rightHandedSinglets:3},parities:{P:[1,1,1,1,1,-1],Pp:[1,1,1,-1,-1,1],
      fifteen:[1,1],fifteenPrimeOrTwentyOne:[1,-1],adjoint:[1,1]},
    source:'https://doi.org/10.1007/JHEP11(2024)035'};
}
export function mnMinimum(ctx,windings=ctx.parameters.windings) {
  const A=4*ctx.parameters.Nad-3,k3=ctx.parameters.k3;
  const deriv=a=>{let s=0;for(let n=1;n<=windings;n++){
    const parity=n%2?-1:1,x=Math.PI*n*a;
    s-=Math.PI*((2*A+48+(6*A+48)*parity)*Math.sin(x)+2*(A+4*k3*parity)*Math.sin(2*x))/n**4;
  }return s;};
  const candidates=[0,1];let a=1e-9,da=deriv(a);
  for(let i=1;i<=600;i++){
    const b=i/600,db=deriv(b===1?1-1e-9:b);
    if(da<0&&db>0){let lo=a,hi=b;for(let j=0;j<48;j++){const mid=(lo+hi)/2;if(deriv(mid)>0)hi=mid;else lo=mid;}candidates.push((lo+hi)/2);}
    a=b;da=db;
  }
  const values=candidates.map(alpha=>({alpha,potential:2*sun5dV(ctx.terms,[alpha],windings)}));
  values.sort((a,b)=>a.potential-b.potential);
  return values[0];
}
let mnCacheKey='',mnCacheValue=null;
export function mnModel(input={}) {
  const ctx=mnContext(input),key=JSON.stringify(ctx.parameters);
  if(key===mnCacheKey)return mnCacheValue;
  const convergence=[10,30,100,300,1000].map(windings=>({windings,...mnMinimum(ctx,windings)}));
  const minimum=mnMinimum(ctx),published=MN_ROWS.find(r=>r[0]===ctx.parameters.k3&&r[1]===ctx.parameters.Nad);
  const curve=Array.from({length:151},(_,i)=>{const alpha=i/150;return {alpha,potential:2*(sun5dV(ctx.terms,[alpha],ctx.parameters.windings)-sun5dV(ctx.terms,[0],ctx.parameters.windings))};});
  const zoomMax=Math.min(1,Math.max(.06,minimum.alpha*2.2));
  const zoom=Array.from({length:151},(_,i)=>{const alpha=zoomMax*i/150;return {alpha,potential:2*(sun5dV(ctx.terms,[alpha],ctx.parameters.windings)-sun5dV(ctx.terms,[0],ctx.parameters.windings))};});
  const result={...ctx,minimum,convergence,curve,zoom,published:published?{table:2,alpha:published[2],infiniteAlpha:published[3]}:null,
    normalization:'V/C_paper = 2 V/C_HabaYamashita; phase-independent terms subtracted in the plot',
    scope:'Flat SU(6) Wilson potential for k1=0, k2=3-k3; three spectator singlets retained in the record',
    unknown:['Brane masses lifting adjoint exotic zero modes','Full flavour and local-anomaly consistency',
      'Mass normalization and Higgs-mass reproduction are not certified by this potential comparison']};
  mnCacheKey=key;mnCacheValue=result;return result;
}
