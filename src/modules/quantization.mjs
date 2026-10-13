// Generated from the byte-preserved replay modules in proof/quantization.
export const GQ_API=(()=>{
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
function evaluateSMClass(coefficients,weights){return text(evaluate(jointBasis(coefficients),weights));}

function checkSMQuantization(coefficients){
  const cs=jointBasis(coefficients);
  const witnesses=[[1,-1,0,0,0],[0,0,1,-1,0],[1,0,-1,0,0]];
  const i=cs.findIndex(c=>c.d!==1n);
  return {status:i<0?'passes':'fails',scope:publicScope,
    basis:['A','B','Y^2'],coefficients:cs.map(text),
    witness:i<0?null:{cocharacter:witnesses[i],period:text(evaluate(cs,witnesses[i]))},
    fullModelConsistency:'not_checked'};
}
function checkParentMixedGravity({a,b,c}){
  const aa=read(a),bb=read(b),cc=read(c);
  const ob=add(add(aa,bb),mul(rational(2n),cc));
  return {status:ob.n===0n?'passes':'fails',
    scope:'Rational polynomial image of lambda times the two parent quadratic invariants, with hidden curvature zero',
    obstruction:text(ob),parentCoefficients:ob.n===0n?[text(frac(neg(aa),2)),text(frac(neg(bb),2))]:null,
    quantizedParentLevel:'not_checked',fullModelConsistency:'not_checked'};
}
function checkStandardTensorTransfer({p,q,r}){
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

return {checkSMQuantization,evaluateSMClass,checkParentMixedGravity,checkStandardTensorTransfer};
})();
export const SP_API=(()=>{
// Private extension: closed spin-4 periods are a different gate from H^4(BH;Z).
const {checkSMQuantization}=GQ_API;
function double(x){
  const [n,d='1']=x.split('/'); const nn=BigInt(n),dd=BigInt(d);
  const a=dd%2n===0n?nn:2n*nn, b=dd%2n===0n?dd/2n:dd;
  return b===1n?String(a):`${a}/${b}`;
}
function exactInteger(x){
  if(typeof x==='bigint')return x;
  if(typeof x==='number'&&Number.isSafeInteger(x))return BigInt(x);
  if(typeof x==='string'&&/^[+-]?\d+$/.test(x.trim()))return BigInt(x.trim());
  throw Error('Expected exact integer coupling');
}
function checkSMSpin4Periods(coefficients){
  const universal=checkSMQuantization(coefficients);
  const [a,b,c]=universal.coefficients;
  const periods=[a,b,double(c)];
  const i=periods.findIndex(x=>x.includes('/'));
  const generators=[
    {manifold:'S^4',bundle:'SU(2) instanton, A=1; B=C=0',characteristicNumbers:['1','0','0']},
    {manifold:'S^4',bundle:'SU(3) instanton, B=1; A=C=0',characteristicNumbers:['0','1','0']},
    {manifold:'S^2 x S^2',bundle:'E2=L^-1+1, E3=L+1+1; c1(L)=x+y',characteristicNumbers:['0','0','2']}
  ];
  return {status:i<0?'passes':'fails',
    scope:'Integer periods of the specified degree-four polynomial on all closed smooth spin 4-manifolds with H=S(U(2)xU(3)) bundles',
    profile:'closed_spin_4_periods',coefficients:universal.coefficients,
    generatorPeriods:periods,witness:i<0?null:{...generators[i],period:periods[i]},
    universalClassStatus:universal.status,
    assumptions:['Ordinary H bundles independent of the spin structure','No additional topological sector'],
    certificate:'SpinPeriod.spin_basis; topology of period generators is external to Lean',
    differentialAction:'not_checked',orbifoldAdmissibility:'not_checked',fullModelConsistency:'not_checked'};
}
function checkAxionQ6({K2,K3,K1}){
  const k2=exactInteger(K2),k3=exactInteger(K3),k1=exactInteger(K1);
  return {...checkSMSpin4Periods({alpha:-k2,beta:-k3,gamma:`${k1}/72`}),
    normalization:'Choi et al. 2309.03937v2 Eq. (2.6), Table 1 q=6; theta has period 2pi',
    source:'https://arxiv.org/abs/2309.03937',
    identificationWithGHUHiggs:'not_established'};
}

return {checkSMSpin4Periods,checkAxionQ6};
})();

export function gqDefaults(){return {alpha:'0',beta:'0',gamma:'1/2',p:'0',q:'0',r:'0',K2:'0',K3:'1',K1:'12',b0:'1',b1:'6'};}
export function gqFraction(n,d=1n){
 if(d===0n)throw Error('Zero denominator');if(d<0n){n=-n;d=-d;}
 let a=n<0n?-n:n,b=d;while(b){const t=a%b;a=b;b=t;}n/=a;d/=a;
 return d===1n?String(n):`${n}/${d}`;
}
export function gqFigureData(input={},checkedClass=null){
 const p={...gqDefaults(),...input},q=checkedClass||GQ_API.checkSMQuantization(p),[alpha,beta,delta]=q.coefficients;
 const lattice=[];
 if(!beta.includes('/'))for(let a=-3;a<=3;a++)for(let twiceD=-6;twiceD<=6;twiceD++)lattice.push({alpha:String(a),delta:gqFraction(BigInt(twiceD),2n),universal:twiceD%2===0,spin:true});
 const cells=[],b0=BigInt(p.b0),b1=BigInt(p.b1);
 for(let m=-4;m<=4;m++)for(let n=-4;n<=4;n++){
  const mm=BigInt(m),nn=BigInt(n),num=2n*b0*(mm-nn)**2n+b1*(mm+nn)**2n,rem=(num%8n+8n)%8n;
  cells.push({m,n,period:gqFraction(num,8n),fractionalPart:gqFraction(rem,8n),residueEighths:Number(rem),integral:rem===0n});
 }
 return {schema:'ghu-quantization-figures-v1',current:{alpha,beta,delta},lattice,cocharacters:cells,window:{alpha:[-3,3],delta:[-3,3],m:[-4,4],n:[-4,4]},scope:'Exact arithmetic. Cocharacter window is a finite visualization; universal statements use the separate theorem. Pixel positions alone use floating point.'};
}
export function gqLatticePreset(alpha,delta,beta){
 const pair=s=>{const [n,d='1']=String(s).split('/');return [BigInt(n),BigInt(d)];};
 const [a,ad]=pair(alpha),[d,dd]=pair(delta),[b,bd]=pair(beta);
 return {alpha:String(alpha),beta:String(beta),gamma:gqFraction(12n*d*ad*bd+3n*a*dd*bd+4n*b*dd*ad,12n*dd*ad*bd)};
}
export function gqModel(input={}){
 const p={...gqDefaults(),...input};
 for(const k of Object.keys(p))if(typeof p[k]!=='string'||p[k].length>160)throw Error('Use exact integers or fractions, at most 160 characters');
 const universal=GQ_API.checkSMQuantization(p),spin=SP_API.checkSMSpin4Periods(p),tensor=GQ_API.checkStandardTensorTransfer(p),axion=SP_API.checkAxionQ6(p);
 for(const k of ['b0','b1'])if(!/^[+-]?\d+$/.test(p[k]))throw Error('U(2): enter integer b0 and b1');
 const b0=BigInt(p.b0),b1=BigInt(p.b1),res=((b1+2n*b0)%8n+8n)%8n;
 return {schema:'ghu-quantization-v1',parameters:p,universal,spin,tensor,axion,figures:gqFigureData(p,universal),
   u2:{status:res===0n?'passes':'fails',residue:String(res),integerInputProfile:true,criterion:'b0 in Z and b1+2b0 in 8Z',fullModelConsistency:'not_checked'},
   lift:{rawDegrees:[8,18,12],rawSquares:[1,-1,1],representationSquares:[1,1,1],phase:'Ua=-i ta',globalAction:'not_checked',leanCertified:false},
   residue:{wallCoefficients:['-64','40'],modulus:12,wallResidues:[8,4],sumResidue:0,parentClass:'1/3 mod Z',interpretation:'Conditional response quotient, not an identified global Z3 anomaly'},
   fullModelConsistency:'not_checked',novelty:'not_established',sources:['https://arxiv.org/abs/1711.04777','https://arxiv.org/abs/2309.03937','https://arxiv.org/abs/1705.01853','https://arxiv.org/abs/2012.11622','https://arxiv.org/abs/2011.10102','https://arxiv.org/abs/hep-th/0305024']};
}
