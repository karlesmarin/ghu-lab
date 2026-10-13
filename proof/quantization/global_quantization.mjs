// Private experimental GHU diagnostics. No DOM, network, files or automatic publication.
// Input conventions: alpha*c2_su2 + beta*c2_su3 + gamma*Y^2.
// H=S(U(2)xU(3)), A=c2(E2), B=c2(E3), Y=c1(E3)=-c1(E2).
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;}
function rational(n,d=1n){if(!d)throw Error('Zero denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
function read(x){
  if(typeof x==='number'){if(!Number.isSafeInteger(x))throw Error('Use an exact integer or a rational string');x=String(x);}
  if(typeof x==='bigint')return rational(x);
  if(typeof x!=='string')throw Error('Expected exact rational string');
  const match=x.trim().match(/^([+-]?\d+)(?:\/(\d+))?$/);
  if(!match)throw Error('Invalid rational');
  return rational(BigInt(match[1]),BigInt(match[2]||'1'));
}
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>rational(-a.n,a.d);
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>rational(a.n*b.n,a.d*b.d);
const frac=(a,n)=>rational(a.n,a.d*BigInt(n));
const text=a=>a.d===1n?String(a.n):String(a.n)+'/'+String(a.d);
const integer=x=>{const a=read(x);if(a.d!==1n)throw Error('Expected integer');return a.n;};
const publicScope='Degree-four characteristic-class quantization for H=S(U(2)xU(3)); orbifold admissibility, spectra, torsion phases and a full action are not checked';

function jointBasis({alpha,beta,gamma}){
  const a=read(alpha),b=read(beta),g=read(gamma);
  return [a,b,sub(sub(g,frac(a,4)),frac(b,3))];
}
function evaluate(cs,weights){
  if(!Array.isArray(weights)||weights.length!==5)throw Error('Five integer cocharacter weights required');
  const [m,n,u,v,w]=weights.map(integer);
  if(m+n+u+v+w!==0n)throw Error('Weights must sum to zero');
  const vals=[m*n,u*v+u*w+v*w,(m+n)*(m+n)];
  return cs.reduce((acc,c,i)=>add(acc,mul(c,rational(vals[i]))),rational(0n));
}
export function evaluateSMClass(coefficients,weights){return text(evaluate(jointBasis(coefficients),weights));}

export function checkSMQuantization(coefficients){
  const cs=jointBasis(coefficients);
  const witnesses=[[1,-1,0,0,0],[0,0,1,-1,0],[1,0,-1,0,0]];
  const i=cs.findIndex(c=>c.d!==1n);
  return {status:i<0?'passes':'fails',scope:publicScope,
    basis:['A','B','Y^2'],coefficients:cs.map(text),
    witness:i<0?null:{cocharacter:witnesses[i],period:text(evaluate(cs,witnesses[i]))},
    fullModelConsistency:'not_checked'};
}
export function checkParentMixedGravity({a,b,c}){
  const aa=read(a),bb=read(b),cc=read(c);
  const ob=add(add(aa,bb),mul(rational(2n),cc));
  return {status:ob.n===0n?'passes':'fails',
    scope:'Rational polynomial image of lambda times the two parent quadratic invariants, with hidden curvature zero',
    obstruction:text(ob),parentCoefficients:ob.n===0n?[text(frac(neg(aa),2)),text(frac(neg(bb),2))]:null,
    quantizedParentLevel:'not_checked',fullModelConsistency:'not_checked'};
}
export function checkStandardTensorTransfer({p,q,r}){
  const pp=integer(p),qq=integer(q),rr=integer(r);
  const required=[sub(rational(8n,3n),rational(pp,2n)),rational(-qq,2n),rational(-rr,2n)];
  const image=checkParentMixedGravity({a:text(required[0]),b:text(required[1]),c:text(required[2])});
  return {...image,requiredMixedGravity:required.map(text),
    assumptions:['Inherited lower anomaly has lambda coefficient -8A/3',
      'Ordinary GS source X=a*lambda/2+v with a and all gauge coefficients in an integral charge lattice',
      'Unchanged charged matter anomaly','Parent ordinary invariant Chern-Simons; no orientation-dependent Wess-Zumino term'],
    excluded:'Only the simultaneous realization of these assumptions',
    universalCertificate:'GHUQuantization.standard_tensor_obstruction'};
}
