// Private extension: closed spin-4 periods are a different gate from H^4(BH;Z).
import {checkSMQuantization} from './global_quantization.mjs';
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
export function checkSMSpin4Periods(coefficients){
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
export function checkAxionQ6({K2,K3,K1}){
  const k2=exactInteger(K2),k3=exactInteger(K3),k1=exactInteger(K1);
  return {...checkSMSpin4Periods({alpha:-k2,beta:-k3,gamma:`${k1}/72`}),
    normalization:'Choi et al. 2309.03937v2 Eq. (2.6), Table 1 q=6; theta has period 2pi',
    source:'https://arxiv.org/abs/2309.03937',
    identificationWithGHUHiggs:'not_established'};
}
