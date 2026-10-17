/* Presentation contract for the externally computed continuum certificate.
 * The PDE and interval propagation live in the mathematical engine.
 */
import {GMR_REFERENCE} from './matched_profiles_reference.mjs';
import {GMR_CERTIFICATE} from './matched_profiles_certificate.mjs';
export const GMR_DEFAULTS={width:'1/8',alpha:'1/20',t:'1/4',degree:3};
export const GMR_MODEL={id:'unit-square-wall-response-v1',c:'38',kL:'2',kT:'8',s:'1/100',R:'1/2',source:'common-corner-trace-q',mass_uses_layer_weight:false};
function gmrQ(x){
 if(typeof x!=='string'||x.length>100||!/^[-+]?\d+(?:\/\d+|\.\d+)?$/.test(x))throw Error('Invalid rational value');
 let n,d;
 if(x.includes('/')){const a=x.split('/');n=BigInt(a[0]);d=BigInt(a[1]);}
 else if(x.includes('.')){const [a,b]=x.split('.');d=10n**BigInt(b.length);n=BigInt(a)*d+(x.startsWith('-')?-1n:1n)*BigInt(b);}
 else {n=BigInt(x);d=1n;}
 if(d<=0n)throw Error('Invalid denominator');
 let a=n<0n?-n:n,b=d;while(b){const c=a%b;a=b;b=c;}
 return {n:n/a,d:d/a};
}
function gmrCmp(a,b){return a.n*b.d-b.n*a.d;}
function gmrText(q){return q.d===1n?String(q.n):q.n+'/'+q.d;}
export function gmrParameters(p){
 if(!p||Object.keys(p).sort().join(',')!=='alpha,degree,t,width')throw Error('Expected four profile parameters');
 const result={};
 for(const [k,lo,hi] of [['width','1/64','1/2'],['alpha','0','1/10'],['t','1/100','1/2']]){
  const q=gmrQ(p[k]);
  if(p[k].length>32||q.d>1000000n||gmrCmp(q,gmrQ(lo))<0n||gmrCmp(q,gmrQ(hi))>0n)throw Error('Parameter outside supported range');
  result[k]=gmrText(q);
 }
 if(![1,2,3].includes(p.degree))throw Error('Degree must be 1, 2 or 3');
 result.degree=p.degree;return result;
}
function gmrPair(v){
 if(!Array.isArray(v)||v.length!==2)throw Error('Expected interval');
 const pair=v.map(gmrQ);if(gmrCmp(...pair)>0n)throw Error('Reversed interval');return pair;
}
function gmrSubtract(a,b){return {n:a.n*b.d-b.n*a.d,d:a.d*b.d};}
function gmrSame(a,b){return JSON.stringify(gmrParameters(a))===JSON.stringify(gmrParameters(b));}
export function gmrValidate(data,p){
 if(data?.schema!=='ghu-matched-profiles-v1'||!gmrSame(data.parameters,p))throw Error('Result does not match these inputs');
 if(!data.model||Object.keys(data.model).length!==Object.keys(GMR_MODEL).length||Object.entries(GMR_MODEL).some(([k,v])=>data.model[k]!==v))throw Error('Different model or source');
 if(!Array.isArray(data.profiles)||data.profiles.length!==2||!data.provenance||!['archived_verified_inputs','computed_locally'].includes(data.provenance.mode))throw Error('Incomplete result');
 const hashes=data.provenance.sources_sha256;
 if(!hashes||!['ghu_lab_response.py','ghu_piecewise_response.py','ghu_shifted_response.py','ghu_polynomial_trials.py','ghu_matched_response.py','response_bounds.py'].every(k=>/^[0-9a-f]{64}$/.test(hashes[k])))throw Error('Missing producer versions');
 const reports=[],zero=gmrQ('0');let positive=true;
 for(let i=0;i<2;i++){
  const row=data.profiles[i],r=row.report,m=row.matching;
  if(row.profile!==['uniform','triangular'][i]||!r||!m)throw Error('Missing profile');
  gmrPair(row.D);gmrPair(row.anchor_D);
  const allowed=['finite_response_conditional','matched_pole','inconclusive_denominator_sign','inconclusive_positive_D'];
  if(!allowed.includes(r.status))throw Error('Unknown response status');
  if(r.status!=='inconclusive_positive_D'){
   if(r.anchor_t!=='1/100'||r.target_residue!=='1/2'||gmrCmp(gmrQ(r.probe_t),gmrQ(p.t))!==0n)throw Error('Different matching targets');
   const den=gmrPair(r.inverse_response);gmrPair(r.remainder);
   if(r.status==='matched_pole'){
    if(gmrCmp(gmrQ(p.t),gmrQ('1/100'))!==0n||den.some(q=>q.n!==0n)||r.response)throw Error('Pole cannot have finite response');
   }else if(r.status==='finite_response_conditional'){
    gmrPair(r.response);if(den[0].n<=0n&&den[1].n>=0n)throw Error('Denominator crosses zero');
   }else if(!(den[0].n<=0n&&den[1].n>=0n)||r.response)throw Error('Invalid inconclusive denominator');
  }else if(r.response)throw Error('Uncertified positive D');
  if(m.status==='positive_matching_conditional'){
   if(gmrPair(m.kappa)[0].n<=0n||gmrPair(m.zeta)[0].n<0n||m.target_residue!=='1/2')throw Error('Positive matching not enclosed');
  }else{
   if(!['inconclusive_positive_matching','excluded_positive_matching_conditional','inconclusive_positive_D'].includes(m.status))throw Error('Unknown matching status');
   positive=false;
  }
  reports.push(r);
 }
 let expected='inconclusive';
 if(reports.every(r=>r.response)){
  const a=gmrPair(reports[0].response),b=gmrPair(reports[1].response),diff=gmrPair(data.comparison.difference_a_minus_b);
  if(gmrCmp(diff[0],gmrSubtract(a[0],b[1]))>0n||gmrCmp(diff[1],gmrSubtract(a[1],b[0]))<0n)throw Error('Difference interval is too narrow');
  const direction=diff[0].n>0n?'a_above_b':diff[1].n<0n?'a_below_b':'overlap';
  expected=direction==='overlap'?'inconclusive_overlap':'separated_conditional';
  if(data.comparison.direction!==direction||data.comparison.status!==expected)throw Error('Incorrect interval decision');
 }
 if(reports.every(r=>r.status==='matched_pole'))expected='matched_pole';
 else if(!positive)expected='inconclusive_matching';
 if(data.status!==expected)throw Error('Incorrect overall decision');
 return structuredClone(data);
}
export function gmrReference(p){
 const canonical=gmrParameters(p),data=GMR_REFERENCE.find(r=>gmrSame(r.parameters,canonical));
 return data?gmrValidate(data,canonical):null;
}

export const gmrDefaults=()=>({probe:0});
export function gmrValidateSelection(p=gmrDefaults()){
 if(!p||!Number.isInteger(p.probe)||![0,1].includes(p.probe))throw Error('Choose a certified response query');
 return {probe:p.probe};
}
export function gmrModel(p=gmrDefaults()){
 const selection=gmrValidateSelection(p),parameters={...GMR_DEFAULTS,t:['1/4','1/2'][selection.probe]},result=gmrReference(parameters);
 if(!result)throw Error('No admitted certificate');
 return {schema:'ghu-matched-profile-tool-v1',toolVersion:'1.0.0',selection,parameters,result,
  certificate:{sha256:GMR_CERTIFICATE.sha256,checks:GMR_CERTIFICATE.checks,sage_version:GMR_CERTIFICATE.sage_version,
   files_sha256:GMR_CERTIFICATE.files_sha256,kind:'written-proof-and-independent-computational-certificate'},
  scope:'Fixed unit-square model and source; two finite-width queries only. Full GHU, data fit and thin-layer rate are not certified.'};
}
