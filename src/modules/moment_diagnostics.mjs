/* Approximation certificates and exact local-coordinate comparisons.
 * Model: Komori–Maru. Expansions: Haba–Takenaga–Yamashita and Sakamoto–Takenaga.
 * SU(7) coordinate applications: Carles Marin, Part VII.
 */
import {termTable, coordinates, moments, FGrid, alphaMin, Z3} from '../kernel/potential.mjs';

export function mdRational(value) {
  const parts=String(value).split('/').map(Number);
  return parts.length===2 ? parts[0]/parts[1] : parts[0];
}

/* All model coefficients are binary rationals. This integer representation
 * applies duplication exactly and does not compare rounded transcendental G. */
export function mdPeriodicSignature(terms) {
  const byCharge=new Map();
  for(const [raw,s,c] of terms){
    const m=mdRational(raw);
    if(![1,-1].includes(s)||![1,2,3].includes(c)||!Number.isSafeInteger(4*m))return null;
    byCharge.set(c,(byCharge.get(c)||0)+64*m*(s===1?1:-1));
    if(s===-1)byCharge.set(2*c,(byCharge.get(2*c)||0)+4*m);
  }
  const v=[1,2,3,4,6].map(c=>byCharge.get(c)||0);
  return v.every(Number.isSafeInteger)?v.join(','):null;
}

export function mdFindCertificate(data,model,reference) {
  if(data.id!=='su7_km25')return {status:'unsupported-model',record:null};
  const c=model.conventions||{};
  if(c.m_W!==reference.conventions.mWGeV||c.g4!==reference.conventions.g4)
    return {status:'different-mass-inputs',record:null};
  const signature=mdPeriodicSignature(termTable(model,data));
  const seed=c.gauge_seed||'published';
  const record=signature===null?null:reference.benchmarks.find(r=>r.seed===seed&&mdPeriodicSignature(r.terms)===signature);
  return {status:record?'certified-benchmark':'no-matching-certificate',record:record||null};
}

export function mdCompareContents(data,model,bulkB,reference) {
  const a=termTable(model,data),b=termTable({...model,bulk:bulkB},data);
  const coordsA=coordinates(a),coordsB=coordinates(b);
  const keys=['A4','D8','U2','V'];
  const exact=keys.every(k=>Number.isSafeInteger(2*coordsA[k])&&Number.isSafeInteger(2*coordsB[k]));
  const sigA=mdPeriodicSignature(a),sigB=mdPeriodicSignature(b);
  const equalLocal=exact&&keys.every(k=>coordsA[k]===coordsB[k]);
  const samePotential=sigA!==null&&sigA===sigB;
  const sources=reference.momentWitness.contents;
  const witnessA=sources.find(r=>mdPeriodicSignature(r.terms)===sigA)||null;
  const witnessB=sources.find(r=>mdPeriodicSignature(r.terms)===sigB)||null;
  return {equalLocal,samePotential,coordsA,coordsB,momentsA:moments(a),momentsB:moments(b),
    termsA:a,termsB:b,witnessA,witnessB};
}

export function mdExpansion(mo,alpha) {
  if(alpha===0)return 0;
  const x=Math.PI*Math.abs(alpha);
  return -Z3*mo.D*x*x/2+x**4*(mo.G-mo.A4*Math.log(x))/24;
}

export function mdPairCurve(comparison,local=false) {
  const aa=alphaMin(comparison.momentsA),ab=alphaMin(comparison.momentsB);
  const roots=[aa,ab].filter(x=>Number.isFinite(x)&&x>0&&x<1);
  const hi=local?Math.min(.25,Math.max(.08,1.6*(roots.length?Math.max(...roots):.08))):1;
  const xs=Array.from({length:241},(_,i)=>hi*i/240);
  const ya=FGrid(comparison.termsA,xs,768),yb=FGrid(comparison.termsB,xs,768);
  const a0=ya[0],b0=yb[0];
  return {xs,a:Array.from(ya,y=>y-a0),b:Array.from(yb,y=>y-b0),
    appA:local?xs.map(x=>mdExpansion(comparison.momentsA,x)):null,
    appB:local?xs.map(x=>mdExpansion(comparison.momentsB,x)):null,
    hi,windings:768,approximateAlphaA:aa,approximateAlphaB:ab};
}

/* Decimal display is widened using exact integer division of rational endpoints.
 * Binary floating-point formatting is used only for illustrative plot values. */
export function mdOutwardInterval(interval,digits=6) {
  const scale=10n**BigInt(digits);
  const decimal=(value,up)=>{
    let [n,d='1']=String(value).split('/');let a=BigInt(n)*scale,b=BigInt(d);
    if(b<0n){a=-a;b=-b;}
    let q=a/b,r=a%b;
    if(r!==0n&&((up&&a>0n)||(!up&&a<0n)))q+=up?1n:-1n;
    const sign=q<0n?'-':'';const u=q<0n?-q:q;
    return sign+(u/scale).toString()+(digits?'.'+(u%scale).toString().padStart(digits,'0'):'');
  };
  return '['+decimal(interval[0],false)+', '+decimal(interval[1],true)+']';
}

/* Exact rational comparison, including boundaries, without floating rounding. */
export function mdHiggsComparison(mass,reference) {
  const parse=s=>{const [a,b='1']=String(s).split('/');return [BigInt(a),BigInt(b)];};
  const sub=(a,b)=>[a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
  const add=(a,b)=>sub(a,[-b[0],b[1]]);
  const str=a=>a[0]+'/'+a[1];
  const sign=a=>a[0]===0n?0:(a[0]>0n)===(a[1]>0n)?1:-1;
  const lo=parse(mass[0]),hi=parse(mass[1]),mu=parse(reference.central),err=parse(reference.totalError);
  const bottom=sub(mu,err),top=add(mu,err);
  const relation=sign(sub(lo,top))>0?'above':sign(sub(hi,bottom))<0?'below':'overlap';
  return {measurementId:reference.id,band:[str(bottom),str(top)],difference:[str(sub(lo,mu)),str(sub(hi,mu))],relation,
    scope:'Interval position relative to the reported total-error band at fixed inputs; not a statistical exclusion.'};
}
