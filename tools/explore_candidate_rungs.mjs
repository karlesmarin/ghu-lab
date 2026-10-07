/* Use the laboratory inverse engine, retaining an explicit enumeration budget. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {inverseLattice,contentsAt,congruenceOK,inCone,multBulk} from '../src/modules/inverse.mjs';
import {coordinates,alphaMin,higgsMass,invR5} from '../src/kernel/potential.mjs';
const data=JSON.parse(readFileSync(new URL('../data/su7_km25.json',import.meta.url))),L=inverseLattice(data,data.gauge_seeds.candidate.gauge);
const out=resolve(process.argv[2]||'research/2026-10-07');mkdirSync(out,{recursive:true});
const base=coordinates(data.gauge_seeds.candidate.gauge),generators=L.slots.map(s=>coordinates(s.table));
const scans=[];
for(const [k,cap] of [[2,272.5],[4,375.5]]){
 const classes=new Map();let built=0,inWindow=0,capped=false,lastA4=null;
 for(let t2=L.base.t2;t2<=2*cap;t2++){
  if(!congruenceOK(t2,k)||!inCone(L,t2,k))continue;
  contentsAt(L,t2,k,(n,G,W2)=>{
   if(built>=5000000){capped=true;return true;}built++;lastA4=t2/2;
   const mo={A4:t2/2,D:k/8,G},a=alphaMin(mo);if(a===null)return false;
   const mh=higgsMass(mo,a,80.4,.63);if(mh===null||mh<123||mh>127)return false;inWindow++;
   const U2=base.U2+n.reduce((s,v,j)=>s+v*generators[j].U2,0),V=base.V+n.reduce((s,v,j)=>s+v*generators[j].V,0);
   const key=JSON.stringify([t2,k,U2,V,W2]),old=classes.get(key),size=n.reduce((s,v)=>s+v,0);
   if(old){old.multiplicity++;if(size<old.size){old.mult=n.slice();old.size=size;}}
   else classes.set(key,{invR:invR5(a,80.4),mh,A4:t2/2,k,G,W2,U2,V,mult:n.slice(),size,multiplicity:1});
   return false;
  },Infinity);
  if(capped)break;
 }
 const points=[...classes.values()].sort((a,b)=>b.invR-a.invR),result={k,A4cap:cap,built,inWindow,capped,lastA4,distinctFullPotentials:points.length,points};
 // Include upper-scale candidates and upper-scale W-positive controls. W alone
 // is not a global-minimum test. Deduplication uses all five exact coordinates.
 const picks=[...points.slice(0,20),...points.filter(p=>p.W2>0).slice(0,20)];
 const selected=[...new Map(picks.map(p=>[JSON.stringify([p.A4,k,p.U2,p.V,p.W2]),p])).values()].map(p=>({...p,bulk:multBulk(L,p.mult)}));
 scans.push({...result,selectedForFullPotential:selected});
 console.log(JSON.stringify({k,built:result.built,capped:result.capped,inWindow:result.inWindow,distinctFullPotentials:points.length,topApproximateGeV:points[0]?.invR,selectedForFullPotential:selected.length}));
}
writeFileSync(resolve(out,'candidate_rung_search.json'),JSON.stringify({schema:'ghu-candidate-search-v1',scans,
 scope:'Finite, budget-limited enumeration with the existing small-angle inverse engine. Classes use all five exact potential coordinates. Twenty highest returned approximate scales and twenty highest W-positive controls per rung are independently checked in full Fourier. Unvisited contents, prefilter failures and other rungs remain unresolved; no full-potential exclusion or universal ceiling follows.'},null,2)+'\n');
