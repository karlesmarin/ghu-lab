/* Neutrino ring: pure, DOM-free physics for the Simulator's research model.
 * Tree level; first order in Majorana insertions, exact conserving mixing.
 * A single active flavour combination, not a three-flavour fit.
 */
import { scan } from '../kernel/sensitivity.mjs';

export function nrDefaults() {
  return { fGeV: 1000, t: 1, q: .3, r: .4, mDGeV: 2, muAkeV: 500,
           muBkeV: 500, calibrate: true };
}

export const NR_LIMITS = { fGeV: [500,5000], t: [.4,1.2], q: [.1,.4], r: [.2,.5],
  mDGeV: [0,20], muAkeV: [0,100000], muBkeV: [0,5000] };

export function nrValidate(input) {
  const p = { ...nrDefaults(), ...input };
  for (const [key,[lo,hi]] of Object.entries(NR_LIMITS))
    if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key]<lo || p[key]>hi)
      throw new RangeError(`${key} must be between ${lo} and ${hi}`);
  if (typeof p.calibrate !== 'boolean') throw new TypeError('calibrate must be boolean');
  return p;
}

function nrZeros(n,m=n) { return Array.from({length:n},()=>Array(m).fill(0)); }
function nrInverse(input) {
  const n=input.length,A=input.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(i===j))]);
  for(let j=0;j<n;j++) {
    let pivot=j;for(let k=j+1;k<n;k++)if(Math.abs(A[k][j])>Math.abs(A[pivot][j]))pivot=k;
    if(Math.abs(A[pivot][j])<1e-14)throw new RangeError('Singular ring matrix');
    [A[j],A[pivot]]=[A[pivot],A[j]];const d=A[j][j];A[j]=A[j].map(x=>x/d);
    for(let k=0;k<n;k++)if(k!==j){const x=A[k][j];for(let l=0;l<2*n;l++)A[k][l]-=x*A[j][l];}
  }
  return A.map(r=>r.slice(n));
}

/* Jacobi vectors are needed for the two Majorana weights, not only eigenvalues. */
export function nrEigen(input) {
  const n=input.length,A=input.map(r=>r.slice()),V=nrZeros(n);
  for(let j=0;j<n;j++)V[j][j]=1;
  let converged=false;
  for(let step=0;step<100*n*n;step++) {
    let p=0,q=1,off=0,scale=1;
    for(let i=0;i<n;i++){scale=Math.max(scale,Math.abs(A[i][i]));for(let j=i+1;j<n;j++)if(Math.abs(A[i][j])>off){off=Math.abs(A[i][j]);p=i;q=j;}}
    if(off<2e-15*scale){converged=true;break;}
    const tau=(A[q][q]-A[p][p])/(2*A[p][q]);
    const t=(Math.sign(tau)||1)/(Math.abs(tau)+Math.sqrt(1+tau*tau)),c=1/Math.sqrt(1+t*t),s=t*c;
    const pp=A[p][p],qq=A[q][q],pq=A[p][q];
    A[p][p]=pp-t*pq;A[q][q]=qq+t*pq;A[p][q]=A[q][p]=0;
    for(let k=0;k<n;k++)if(k!==p&&k!==q){const x=A[k][p],y=A[k][q];A[k][p]=A[p][k]=c*x-s*y;A[k][q]=A[q][k]=s*x+c*y;}
    for(let k=0;k<n;k++){const x=V[k][p],y=V[k][q];V[k][p]=c*x-s*y;V[k][q]=s*x+c*y;}
  }
  if(!converged)throw new Error('Neutrino eigensolver did not converge');
  return Array.from({length:n},(_,j)=>({value:A[j][j],vector:V.map(r=>r[j])})).sort((a,b)=>a.value-b.value);
}

export function nrModel(input={}) {
  const p=nrValidate(input),B=nrZeros(5);
  for(let j=0;j<5;j++){B[j][j]=2;B[j][(j+1)%5]=(j===4?1:-1)*p.t;}
  const I=nrInverse(B),E=.25-p.q*p.r*I[0][0];
  const KN=1+p.q*p.q*I.reduce((s,r)=>s+r[0]*r[0],0);
  const KS=1+p.r*p.r*I[0].reduce((s,x)=>s+x*x,0);
  let m=p.mDGeV/p.fGeV,muA=p.muAkeV*1e-6/p.fGeV;
  if(p.calibrate) {
    const deficit=1e-4;m=Math.abs(E)*Math.sqrt(deficit/((1-deficit)*KS));
    const coefficient=deficit*p.r*p.r*I[0][2]**2/KS;
    muA=.1/(p.fGeV*1e9*coefficient);
  }
  const muB=p.muBkeV*1e-6/p.fGeV,norm=1+m*m/E**2*KS;
  const light=muA*(p.r*m/E*I[0][2])**2/norm;
  const deficit=(norm-1)/norm;
  const D=nrZeros(7,6);D[0][0]=m;D[1][0]=.25;D[1][1]=p.r;D[2][0]=p.q;
  for(let i=0;i<5;i++)for(let j=0;j<5;j++)D[i+2][j+1]=B[i][j];
  const H=nrZeros(6);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)for(let k=0;k<7;k++)H[i][j]+=D[k][i]*D[k][j];
  const basisLeft=[],basisRight=[];
  const pairs=nrEigen(H).map(({value,vector:v},j)=>{
    if(value<=0)throw new RangeError('No positive Dirac mass gap');
    const s=Math.sqrt(value),u=D.map(row=>row.reduce((a,x,k)=>a+x*v[k],0)/s);
    basisLeft.push(u);basisRight.push(v);
    const weightA=u[4]**2,weightB=v[3]**2;
    return {pair:j+1,centerGeV:s*p.fGeV,splitEV:(muA*weightA+muB*weightB)*p.fGeV*1e9,
            weightA,weightB,activeWeight:u[0]**2};
  });
  const used={...p,mDGeV:m*p.fGeV,muAkeV:muA*p.fGeV*1e6};
  return {input:p,used,lightEV:light*p.fGeV*1e9,deficit,KN,KS,
    SchurNSGeV:E*p.fGeV,muNEV:p.q**2*muB*I[2][0]**2*p.fGeV*1e9,
    muSEV:p.r**2*muA*I[0][2]**2*p.fGeV*1e9,pairs,
    conservingBasis:{left:basisLeft,right:basisRight,zero:[1,-m/E,...I[0].map(x=>p.r*m/E*x)].map(x=>x/Math.sqrt(norm))},
    conservingDiracOverF:D,MajoranaOverF:{plus:{index:4,value:muA},minus:{index:3,value:muB}},
    activeWeightSum:pairs.reduce((s,pair)=>s+pair.activeWeight,0),
    expansionRatio:Math.max(muA,muB)*p.fGeV/pairs[0].centerGeV,
    insertionToSmallestGap:Math.max(muA,muB)*p.fGeV/Math.min(...pairs.slice(1).map((pair,i)=>pair.centerGeV-pairs[i].centerGeV)),
    assumptions:{order:'Tree level, first order in muA and muB; exact lepton-conserving mixing',
      phase:'CP background theta=pi; phase vacuum is not re-minimized here',
      chosen:{nodes:5,M_over_f:2,MNS_over_f:.25,source_node:0,Majorana_node:2,reverse_hopping:0,chi_over_f:1,Sigma_over_f:1},
      targets:p.calibrate?{light_eV:.1,active_deficit:1e-4}:null,
      unknown:['three-flavour fit','electroweak loop masses','radial stability','dimension-five matching','full phase potential at nonzero Majorana terms'],
      extra_phase:'A massless Majoron is present under the global symmetry hypothesis.'}};
}

export function nrSensitivity(input,steps=40) {
  if(!Number.isInteger(steps)||steps<1||steps>1000)throw new RangeError('Sweep steps must be an integer from 1 to 1000');
  const base=nrModel(input);
  // Varying muB changes neither the conserving singular vectors nor muA at this order.
  return scan(p=>base.used.muAkeV*1000*base.pairs[0].weightA+p.muBkeV*1000*base.pairs[0].weightB,
    [{name:'muBkeV',kind:'model',what:'Independent Majorana Yukawa; a range of model predictions in eV, not a measurement error',
      values:Array.from({length:steps+1},(_,i)=>5000*i/steps)}],base.input);
}

export function nrScan(input,steps=40) {
  const base=nrModel(input),sensitivity=nrSensitivity(input,steps);
  return sensitivity.scans[0].values.map(r=>({muBkeV:r.value,lightEV:base.lightEV,deficit:base.deficit,splitEV:r.y}));
}

export function nrSummary(result) {
  const {lightEV,deficit,pairs,used,input}=result,lo=used.muAkeV*1000*pairs[0].weightA;
  const hi=lo+5000*1000*pairs[0].weightB;
  return {heading:input.calibrate?'Two light inputs held fixed; the heavy splitting remains free.':'The light and heavy responses come from the same mass matrix.',
    text:`The light mass is ${lightEV.toPrecision(4)} eV and the active-current deficit is ${deficit.toExponential(3)}${input.calibrate?' by calibration':''}. `+
      `The first heavy pair is centred at ${pairs[0].centerGeV.toFixed(2)} GeV and split by ${pairs[0].splitEV.toFixed(2)} eV. `+
      `Sweeping muB from 0 to 5000 keV moves that splitting from ${lo.toFixed(2)} to ${hi.toFixed(2)} eV while the two light quantities stay fixed at this order.`,
    limit:'Both Majorana Yukawas are allowed. These controls do not establish a unique NN prediction or a fit to three neutrino flavours.'};
}

export function nrRecord(result) {
  return {group:'tme-u1-ring',section:'predict',variant:'neutrino-ring',parameters:result.used,
    requested_parameters:result.input,bulk:[],brane:[],orbifold:{name:'4D U(1)^5 ring; no extra dimension assumed'},
    conventions:{m_W:null,g4:null,mh_window:null,windings:null,gauge_seed:null},assumptions:result.assumptions};
}
