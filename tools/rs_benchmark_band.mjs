/* Rounding band of the published RS reference point (arXiv:0807.4937, Sec. 6.3): the paper prints c and Y to three
 * decimals, so each input is uncertain by ±0.0005. Linear propagation (one-sided finite differences, summed in
 * absolute value = worst case) gives the band of the ZMA masses; the published masses are compared against it.
 * v is varied separately: the paper states only "v ≈ 246 GeV". */
import {readFileSync} from 'node:fs';
import {rfZeroModeMasses} from '../src/modules/rs_fermions.mjs';
const b=JSON.parse(readFileSync(new URL('../data/rs_benchmark_cghnp2008.json',import.meta.url)));
const kL=Number(b.L),c=b.c_paper,h=5e-4;
const base={QL:[1,2,3].map(i=>-Number(c['Q_'+i])),u:[1,2,3].map(i=>Number(c['u_'+i])),d:[1,2,3].map(i=>Number(c['d_'+i]))};
export function band(sector){
  const cs=base[sector],Y=sector==='u'?b.Yu:b.Yd,m0=rfZeroModeMasses(base.QL,cs,Y,kL,246).masses,dm=[0,0,0];
  const add=(m)=>m.forEach((x,i)=>dm[i]+=Math.abs(x-m0[i]));
  for(let i=0;i<3;i++){const q=[...base.QL];q[i]+=h;add(rfZeroModeMasses(q,cs,Y,kL,246).masses);}
  for(let i=0;i<3;i++){const s=[...cs];s[i]+=h;add(rfZeroModeMasses(base.QL,s,Y,kL,246).masses);}
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(const k of [0,1]){const Yp=Y.map(r=>r.map(z=>[...z]));Yp[i][j][k]+=h;add(rfZeroModeMasses(base.QL,cs,Yp,kL,246).masses);}
  return {m0,dm};
}
if(import.meta.url===`file:///${process.argv[1].replace(/\\/g,'/')}`||process.argv[1].endsWith('rs_benchmark_band.mjs')){
  for(const [s,names] of [['u','uct'],['d','dsb']]){const {m0,dm}=band(s);
    [...names].forEach((q,i)=>{const pub=b.masses_exact_GeV_at_MKK[q],dev=(pub-m0[i])/dm[i];
      console.log(q,'ZMA',m0[i].toPrecision(5),'± ',dm[i].toPrecision(2),'(rounding band) | published exact',pub,'| deviation in bands',dev.toFixed(2));});}
}
