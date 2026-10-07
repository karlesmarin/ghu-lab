/* Flat SU(3) finite-temperature Wilson potential, Hirose–Shibuya eqs. (2.30),(2.33).
 * C4=3/(64*pi^6*R^4), a=g4*R*phi; no high-temperature polynomial substituted.
 */
export function thDefaults(){return {nfPlus:3,nfMinus:0,adjPlus:0,adjMinus:0,scalarPlus:0,scalarMinus:0,invRGeV:1000,g4:3,RT:.093,windings:100,thermalTerms:120};}
export function thValidate(input={}){
  const p={...thDefaults(),...input};
  for(const key of ['nfPlus','nfMinus','adjPlus','adjMinus','scalarPlus','scalarMinus'])
    if(!Number.isInteger(p[key])||p[key]<0||p[key]>20)throw new RangeError(`${key}: integer 0…20 required`);
  for(const [key,lo,hi] of [['invRGeV',100,1e6],['g4',.3,6],['RT',0,.6],['windings',20,300],['thermalTerms',20,400]])
    if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)throw new RangeError(`${key} outside ${lo}…${hi}`);
  if(!Number.isInteger(p.windings)||!Number.isInteger(p.thermalTerms))throw new RangeError('Truncations must be integers');return p;
}
export function thCoefficients(p,RT=p.RT,N=p.windings,L=p.thermalTerms){
  const c1=[],c2=[];
  for(let n=1;n<=N;n++){
    let wb=1/n**5,wf=wb;
    if(RT>0)for(let l=1;l<=L;l++){const term=2/(n*n+(l/(2*Math.PI*RT))**2)**2.5;wb+=term;wf+=(l%2?-1:1)*term;}
    const e=n%2?-1:1;
    c1.push((-6-2*p.scalarPlus-2*p.scalarMinus*e)*wb+(4*p.nfPlus+8*p.adjPlus+(4*p.nfMinus+8*p.adjMinus)*e)*wf);
    c2.push(-3*wb+(4*p.adjPlus+4*p.adjMinus*e)*wf);
  }return {c1,c2,RT,N,L};
}
export function thValue(c,a,derivative=0){
  let s=0;for(let j=0;j<c.c1.length;j++){
    const k=Math.PI*(j+1),x=k*a;
    if(derivative===0)s+=c.c1[j]*(-2*Math.sin(x/2)**2)+c.c2[j]*(-2*Math.sin(x)**2);
    else if(derivative===1)s-=k*(c.c1[j]*Math.sin(x)+2*c.c2[j]*Math.sin(2*x));
    else if(derivative===2)s-=k*k*(c.c1[j]*Math.cos(x)+4*c.c2[j]*Math.cos(2*x));
    else throw new RangeError('Derivative order 0, 1 or 2 required');
  }return s;
}
export function thMinima(c){
  const candidates=[];
  if(thValue(c,0,2)>=0)candidates.push({a:0,v:0,curvature:thValue(c,0,2)});
  if(thValue(c,1,2)>=0)candidates.push({a:1,v:thValue(c,1),curvature:thValue(c,1,2)});
  let a=1e-8,da=thValue(c,a,1);
  for(let i=1;i<=320;i++){
    const b=i/320,db=thValue(c,b===1?1-1e-8:b,1);
    if(da<0&&db>0){let lo=a,hi=b;for(let j=0;j<36;j++){const m=(lo+hi)/2;if(thValue(c,m,1)>0)hi=m;else lo=m;}
      const x=(lo+hi)/2;candidates.push({a:x,v:thValue(c,x),curvature:thValue(c,x,2)});}
    a=b;da=db;
  }
  return candidates.sort((a,b)=>a.v-b.v);
}
function thBroken(c){return thMinima(c).filter(x=>x.a>1e-5).sort((a,b)=>a.v-b.v)[0]||null;}
let thPhaseCacheKey='',thPhaseCache=null;
export function thPhases(p){
  const key=JSON.stringify([p.nfPlus,p.nfMinus,p.adjPlus,p.adjMinus,p.scalarPlus,p.scalarMinus,p.windings,p.thermalTerms]);
  if(key===thPhaseCacheKey)return thPhaseCache;
  const flow=[];let bracket=null,last=null;
  for(let i=0;i<=60;i++){
    const RT=i*.01,c=thCoefficients(p,RT),minima=thMinima(c),broken=minima.find(x=>x.a>1e-5);
    flow.push({RT,minima});
    if(!bracket&&last?.broken?.v<0&&(!broken||broken.v>=0))bracket=[last.RT,RT];
    last={RT,broken};
  }
  let critical=null;
  if(bracket){let [lo,hi]=bracket;
    for(let i=0;i<35;i++){const mid=(lo+hi)/2,b=thBroken(thCoefficients(p,mid));if(b&&b.v<0)lo=mid;else hi=mid;}
    const RT=(lo+hi)/2,c=thCoefficients(p,RT),broken=thBroken(c);
    if(broken&&thValue(c,0,2)>0&&broken.a>1e-4&&Math.abs(broken.v)<1e-6){
      const barrier=Math.max(...Array.from({length:201},(_,i)=>thValue(c,broken.a*i/200)));
      critical={RT,aBroken:broken.a,degeneracyResidual:broken.v,barrierOverC:barrier,order:'First-order coexistence candidate in the truncated one-loop potential'};
    }
  }
  thPhaseCacheKey=key;thPhaseCache={flow,critical};return thPhaseCache;
}
let thCacheKey='',thCache=null;
export function thModel(input={}){
  const p=thValidate(input),key=JSON.stringify(p);if(key===thCacheKey)return thCache;
  const c=thCoefficients(p),fine=thCoefficients(p,p.RT,2*p.windings,2*p.thermalTerms),minima=thMinima(c),fineMinima=thMinima(fine);
  const scale=3*p.invRGeV**4/(64*Math.PI**6),phases=thPhases(p),critical=phases.critical;
  const xmax=Math.min(1,Math.max(.12,(minima[0]?.a||critical?.aBroken||1)*1.35));
  const curve=Array.from({length:161},(_,i)=>{const a=xmax*i/160;return {a,phiGeV:a*p.invRGeV/p.g4,potentialOverC:thValue(c,a),fineOverC:thValue(fine,a)};});
  const result={parameters:p,temperatureGeV:p.RT*p.invRGeV,normalization:{C4GeV4:scale,phiGeVPerAlpha:p.invRGeV/p.g4},minima,fineMinima,
    curve,phases,critical:critical?{...critical,temperatureGeV:critical.RT*p.invRGeV,phiBrokenGeV:critical.aBroken*p.invRGeV/p.g4}:null,
    convergence:{maxPotentialShiftOverC:Math.max(...curve.map(x=>Math.abs(x.potentialOverC-x.fineOverC))),minimumShift:minima.length&&fineMinima.length?fineMinima[0].a-minima[0].a:null,
      comparison:'Double both spatial and thermal winding cutoffs; this is a numerical diagnostic, not a rigorous error bound'},
    source:'https://arxiv.org/abs/2303.14192',scope:'Four-dimensional one-loop thermal SU(3) potential, massless bulk matter, no daisy resummation',
    nucleation:null,gravitationalWaves:null,
    unknown:['Nucleation needs a canonical-field bounce; a critical temperature alone is insufficient','Wall velocity, plasma efficiency and radiation content for a gravitational-wave spectrum','Higher loops and resummation at large gauge coupling']};
  thCacheKey=key;thCache=result;return result;
}
