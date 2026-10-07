import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CANDIDATE_BOUNDS as reference} from './src/modules/candidate_bounds_reference.mjs';
import {CANDIDATE_VACUA as vacua} from './src/modules/candidate_vacua_reference.mjs';
import {cbBoundStatus} from './src/modules/candidate_bounds.mjs';
let checks=0;function ok(value,message){assert.ok(value,message);checks++;}
const source=readFileSync(new URL('./data/su7_km25.json',import.meta.url));
const data=JSON.parse(source),mu=4*Math.PI**2*127**2/(3*80.4**2*.63**2);
// Git may check the identical JSON out with LF or CRLF. Accept only that
// formatting difference when comparing the archived raw-source checksum.
const lf=source.toString('utf8').replace(/\r\n/g,'\n');
const sourceHashes=[lf,lf.replace(/\n/g,'\r\n')].map(s=>createHash('sha256').update(s).digest('hex'));
ok(sourceHashes.includes(reference.inputSHA256),'proof refers to current moment source, allowing Git LF/CRLF conversion');
for(const seed of ['candidate','published']){
 const status=cbBoundStatus({mh:125.2,mW:80.4,g4:.63,seed});
 ok(status.applicable&&!status.fullPotentialCertified&&status.globalTheoryFit===null,'conditional scope preserved');
 for(const r of status.rows){
  const [lo,hi]=r.massIntervalGeV.map(Number);
  ok(lo<=hi&&r.upperGeV>=hi,'browser upper bound encloses exported interval');
  ok(r.gapInterval.every(x=>Number(x)<0)&&r.derivativeInterval.every(x=>Number(x)<0),'strict decreasing negative tail');
  ok(((2*r.A4cap+3-r.k8D)%6+6)%6===0,'legal lattice point');
  const zeta=1.2020569031595943;
  const m=2*Math.PI*80.4*Math.sqrt((6*mu+r.A4cap)/(1.5*r.k8D*zeta));
  ok(Math.abs(m/r.upperGeV-1)<1e-14&&!r.attainmentEstablished&&!r.fullPotentialBound,'identity agrees without promoting bound to attainment');
 }
}
for(const input of [{mh:122},{mh:128},{mW:80.38},{g4:.65},{mh:null}]){
 const r=cbBoundStatus({mh:125.2,mW:80.4,g4:.63,...input});
 ok(!r.applicable&&r.rows.length===0,'conventions invalidate rather than rescale');
}
for(const item of vacua.cases){
 const terms=data.gauge_seeds.candidate.gauge.map(x=>[...x]);
 for(const b of item.bulk){const key='('+b.parities.map(x=>x>0?'+':'-').join(',')+')';
  terms.push(...data.reps[b.rep][key].map(([m,s,c])=>[m*b.multiplicity,s,c]));}
 const evaluate=(a,derivative)=>{let sum=0;for(let n=1;n<=2048;n++)for(const [m,s,c] of terms){
  const phase=Math.PI*c*n*a,w=m*(s===1?1:(n%2?-1:1))/n**5,k=Math.PI*c*n;
  sum+=w*(derivative===0?-2*Math.sin(phase/2)**2:derivative===1?-k*Math.sin(phase):-k*k*Math.cos(phase));
 }return sum;};
 const f=item.fine;
 ok(Math.abs(evaluate(f.globalMinimum.alpha,0)-f.globalMinimum.deltaF)<1e-9,'independent full-potential value');
 ok(f.deltaPotentialTailBound===2*f.potentialTailBound,'subtracted potential includes both tails');
 if(f.localSmallAngle){
  const a=f.localSmallAngle.alpha;
  ok(Math.abs(evaluate(a,1))<1e-8,'independent derivative at root');
  const mass=2*80.4*Math.sqrt(3/(16*Math.PI**6))*.63*Math.sqrt(evaluate(a,2))/a;
  ok(Math.abs(mass-f.higgsMassGeV)<1e-7,'full-potential mass from curvature');
 }
}
const falseVacua=vacua.cases.filter(x=>x.name.includes('stationary upper'));
ok(falseVacua.length===2&&falseVacua.every(x=>!x.fine.globalSmallAngle&&x.fine.globalMinimum.alpha===1),'stationary upper examples fail global-vacuum selection');
console.log(`${checks} checks pass`);
