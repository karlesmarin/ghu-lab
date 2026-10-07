/* RS gauge profiles and holographic anomaly factors. arXiv:2606.01829 §5.
 * Bessel series are evaluated directly for the first three Z roots (x<9).
 */
export function raBessel(x){
  if(!Number.isFinite(x)||x<=0||x>12)throw new RangeError('Bessel-series domain is 0 < x ≤ 12');
  let term=1,j0=1,j1=0,h=0,ys=0,yd=0;
  const t=x*x/4;
  for(let k=1;k<100;k++){
    term*=-t/(k*k);h+=1/k;j0+=term;j1-=2*k*term/x;
    ys-=h*term;yd-=h*2*k*term/x;
    if(k>Math.max(8,x)&&Math.abs(term)<1e-19)break;
  }
  const log=Math.log(x/2)+.5772156649015328606;
  return {j0,j1,y0:2/Math.PI*(log*j0+ys),y1:2/Math.PI*(log*j1-j0/x-yd)};
}
export function raValidate(input={}){
  const p={theta:.1,logZL:Math.log10(3.83182e11),sin2:.230352,mkkTeV:13,mode:0,quarkGen:3,leptonGen:3,...input};
  for(const [key,lo,hi] of [['theta',.02,3.12],['logZL',6,15],['sin2',.1,.4],['mkkTeV',1,100],['mode',0,2],['quarkGen',0,3],['leptonGen',0,3]])
    if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)throw new RangeError(`${key} outside ${lo}…${hi}`);
  for(const key of ['mode','quarkGen','leptonGen'])if(!Number.isInteger(p[key]))throw new RangeError(`${key} must be an integer`);
  return p;
}
export function raGauge(p,mode=p.mode,steps=1200){
  const L=p.logZL*Math.LN10,zL=Math.exp(L),uv=1/zL,ch=Math.cos(p.theta),sh=Math.sin(p.theta),cw2=1-p.sin2;
  function basis(x,u){const v=raBessel(x),b=raBessel(x*u);
    return {C:Math.PI/2*x*u*(b.j1*v.y0-b.y1*v.j0),S:-Math.PI/2*x*u*(b.j1*v.y1-b.y1*v.j1),F00:b.j0*v.y0-b.y0*v.j0};}
  const equation=x=>{const b=basis(x,uv);return Math.PI*x*b.S*b.F00+sh*sh/cw2;};
  const roots=[];let lo=1e-9,flo=equation(lo);
  for(let hi=.012;hi<10&&roots.length<=mode;hi+=.012){const fhi=equation(hi);
    if(flo*fhi<0){let a=lo,b=hi,fa=flo;for(let i=0;i<48;i++){const mid=(a+b)/2,fm=equation(mid);if(fa*fm<=0)b=mid;else{a=mid;fa=fm;}}roots.push((a+b)/2);}
    lo=hi;flo=fhi;
  }
  if(roots.length<=mode)throw new Error('Requested Z root not bracketed');
  const x=roots[mode],atUV=basis(x,uv),ratio=atUV.C/atUV.S;
  let integral=0;
  for(let i=0;i<=steps;i++){
    const b=basis(x,Math.exp(L*(i/steps-1))),ss=ratio*b.S;
    const integrand=(2*cw2-sh*sh)*b.C*b.C+sh*sh*ss*ss;
    integral+=(i===0||i===steps?1:i%2?4:2)*integrand;
  }
  const r=integral*L/(3*steps),factor=Math.sqrt(L*cw2/(2*r));
  const boundary={UV:factor*atUV.C,IR:factor*ch};
  return {mode,x,massGeV:p.mkkTeV*1000*(1-uv)*x/Math.PI,norm:r,Cuv:atUV.C,
    F1:boundary.UV+boundary.IR,boundary,equationResidual:equation(x),steps};
}
export const RA_KK_REFERENCE={
  source:'https://arxiv.org/abs/2606.01829',theta:.1,mkkTeV:13,species:['u','d','e','t','b','tau'],
  zero:{infinite:.997649,rows:[[0,.997688,.997688,.997691,.997671,.997671,.997684],[6,.997659,.997659,.997661,.997653,.997653,.997657],[12,.997655,.997655,.997656,.997651,.997651,.997653],[18,.997653,.997653,.997654,.997651,.997651,.997652],[24,.997652,.997652,.997653,.997650,.997650,.997651]]},
  first:{infinite:3.53591,rows:[[0,5.56610,5.56610,5.74876,4.40691,4.41348,5.29107],[10,3.84398,3.84398,3.89273,3.63898,3.63901,3.78169],[20,3.70283,3.70283,3.73028,3.59060,3.59062,3.66819],[30,3.65039,3.65039,3.66949,3.57312,3.57315,3.62640],[40,3.62303,3.62303,3.63766,3.56411,3.56413,3.60468]]},
  scope:'Published finite-fermion-KK sums from Tables 3 and 5, fixed reference only; not recomputed for changed controls'
};
let raCacheKey='',raCache=null;
export function raModel(input={}){
  const p=raValidate(input),key=JSON.stringify(p);if(key===raCacheKey)return raCache;
  const modes=[0,1,2].map(i=>raGauge(p,i)),selected=modes[p.mode],fine=raGauge(p,p.mode,2400);
  const L=p.logZL*Math.LN10,cw2=1-p.sin2,ch=Math.cos(p.theta);
  const baryonNeutral=modes.map(a=>modes.map(b=>L*cw2/Math.sqrt(a.norm*b.norm)*(a.Cuv*b.Cuv+ch)));
  const difference=p.quarkGen-p.leptonGen;
  const groups={Q2T3:difference/2,QT3Squared:difference/4,sumQ:difference,sumT3:0,sumT3Cubed:0,ggT3:0};
  const gaugeGammaGammaZ=groups.Q2T3*selected.F1;
  const flow=Array.from({length:41},(_,i)=>{const theta=.02+(Math.PI-.04)*i/40;const r=raGauge({...p,theta},p.mode,600);return {theta,F1:r.F1,UV:r.boundary.UV,IR:r.boundary.IR};});
  const result={parameters:p,modes,selected,baryonNeutral,groups,gaugeGammaGammaZ,flow,
    integrationCheck:{doubledStepsF1:fine.F1,shift:fine.F1-selected.F1},kkReference:RA_KK_REFERENCE,
    baryon:{generations:p.quarkGen,normalizedBoundaryCoefficient:-p.quarkGen/(32*Math.PI**2),
      equation:'sqrt(-G) div J_B / g_A² = -Nf/(32π²) [delta_2L(y)+delta_2L(y-L)] sum_a(F_L^a Ftilde_L^a - F_R^a Ftilde_R^a)',
      source:'https://arxiv.org/abs/2609.29135',protonLifetime:null},
    scope:'RS Z-tower Bessel eigenmodes, normalized gauge boundary profiles and full-tower holographic anomaly factors',
    unknown:['Fermion KK sums for controls away from the published reference','Dark-sector anomaly cancellation for a newly chosen matter action','Sphaleron rate, baryogenesis and proton-decay lifetime']};
  raCacheKey=key;raCache=result;return result;
}
