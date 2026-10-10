import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {kkgValidate,kkgModel,kkgBenchmarkInputs} from './src/modules/kk_gluon_lhc.mjs';
import {XS_LUMI} from './src/modules/xs_lumi_reference.mjs';
import {XS_LIMITS} from './src/modules/xs_limits_reference.mjs';
import {RF_BENCHMARK} from './src/modules/rf_benchmark_reference.mjs';
import {xsSigmaNWA,xsAcceptance} from './src/modules/resonance_xsec.mjs';
import {alphasRun} from './src/modules/collider.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const raw=p=>readFileSync(new URL(p,import.meta.url)),J=p=>JSON.parse(raw(p).toString('utf8')),sha=p=>createHash('sha256').update(raw(p)).digest('hex');

/* 1. The in-page reference modules are faithful to the pinned data files (and say which bytes they came from). */
const L=J('./data/parton_lumi_13TeV.json');
check('lumi module records its source sha256',XS_LUMI.source.sha256===sha('./data/parton_lumi_13TeV.json'));
let worst=0;for(const [s,t] of Object.entries(L.tables))for(const [c,col] of Object.entries(t))col.forEach((v,i)=>{worst=Math.max(worst,Math.abs(XS_LUMI.tables[s][c][i]/v-1));});
check(`lumi module = data file to 7 digits (worst ${worst.toExponential(1)})`,worst<1e-6);
const Cm=J('./data/hepdata_cms_ins1764471.meta.json'),Am=J('./data/hepdata_atlas_ins3094414_fig10c.meta.json');
check('ATLAS columns = pinned meta',XS_LIMITS.atlas_tt.observed_pb.every((v,i)=>v===Am.columns.observed[i])&&XS_LIMITS.atlas_tt.raw_sha256===Am.raw_sha256);
check('CMS narrow columns = pinned meta',XS_LIMITS.cms_dijet.observed_narrow_pb.every((v,i)=>v===Cm.tables.narrow_qq.columns['95% CL observed upper limits [pb]'][i]));
for(const [tag,file] of [['narrow_qq','./data/hepdata_cms_ins1764471_narrow_qq.json'],['spin1_qq_widths','./data/hepdata_cms_ins1764471_spin1_qq.json']])
  check(`CMS ${tag} raw bytes match sha256`,sha(file)===Cm.tables[tag].raw_sha256);
check('benchmark module = data file',JSON.stringify(RF_BENCHMARK)===JSON.stringify(J('./data/rs_benchmark_cghnp2008.json')));
check('PDF systematic module = data file',XS_LIMITS.pdf_systematic.source.sha256===sha('./data/pdf_systematic_cteq6l1.json'));

/* 2. CONTROL against CMS's own coloron prediction (cot θ = 1: g_s to every quark), and the paper's 6.6 TeV. */
const D=XS_LIMITS.cms_dijet,A=xsAcceptance(1.1,'vector'),K=m=>1.1+.2*(m-600)/7500,ps=M=>{const r=4*172.5**2/(M*M);return Math.sqrt(1-r)*(1+r/2);};
const colOurs=M=>xsSigmaNWA(XS_LUMI,{MGeV:M,alphas:alphasRun(M,{aZ:XS_LUMI.pdf.alphas_MZ}),gq:{uu:[1,1],dd:[1,1],ss:[1,1],cc:[1,1],bb:[1,1]},BRX:5/(5+ps(M))})*A*K(M);
const P=XS_LIMITS.pdf_systematic,pdfR=M=>{const i=P.M_GeV.indexOf(M);return P.ratio_NNPDF_over_CTEQ6L1[i];};
for(const M of [2000,3000,4000,5000]){const i=D.mass_GeV.indexOf(M),r=colOurs(M)/D.coloron_theory_pb[i];check(`coloron σBA vs CMS within 5% at ${M} GeV (×${r.toFixed(3)})`,Math.abs(r-1)<.05);}
for(const M of [6000,7000,8000]){const i=D.mass_GeV.indexOf(M),r=colOurs(M)/D.coloron_theory_pb[i];
  check(`high-mass drift explained by the PDF luminosity ratio at ${M} GeV (residual ${(r/pdfR(M)).toFixed(3)})`,Math.abs(r/pdfR(M)-1)<.12);}
{let cms=null;for(let i=0;i+1<D.mass_GeV.length;i++){const a=D.coloron_theory_pb[i]/D.observed_narrow_pb[i],b=D.coloron_theory_pb[i+1]/D.observed_narrow_pb[i+1];
  if(a>=1&&b<1){cms=D.mass_GeV[i]+Math.log(a)/(Math.log(a)-Math.log(b))*100;break;}}
 check(`reading of CMS's own curve gives the paper's 6.6 TeV (${cms?.toFixed(0)})`,Math.abs(cms-6600)<50);}
check('isotropic acceptance = CMS «A ≈ 0.5»',Math.abs(xsAcceptance(1.1,'isotropic')-.5)<.002&&Math.abs(A-.4067)<1e-4);

/* 3. Flat realisation: the Part VII theorems survive the pipeline. */
const flat=kkgModel({realisation:0,MTeV:4.5});
check('flat: Γ/M = 2α_s (massless limit) within top phase space',Math.abs(flat.here.GoverM/(2*flat.here.aS)-1)<.01);
check('flat: BR(tt̄) → 1/6',Math.abs(flat.here.BRtt-1/6)<.005&&Math.abs(flat.here.BRjj-5/6)<.005);
check('flat: crosses the CMS width-interpolated dijet limit between 4 and 5 TeV',flat.values.crossing_dijet_GeV.value>4000&&flat.values.crossing_dijet_GeV.value<5000);
check('flat: tt̄ r > 1 at the ATLAS grid end (no crossing below 5 TeV is reported as unknown, not invented)',flat.scanTT.at(-1).sigmaBR_pb>flat.scanTT.at(-1).observed&&flat.values.crossing_tt_GeV.status==='unknown');

/* 4. Warped: the published reference point, mapped (doublets −c_Q, singlets +c_q). */
const bi=kkgBenchmarkInputs(),bench=kkgModel(bi);
check('benchmark inputs mapped from arXiv:0807.4937',Math.abs(bi.cQ3-.473)<1e-12&&Math.abs(bi.cTR-.339)<1e-12&&Math.abs(bi.kL-Math.log(1e16))<1e-9);
check('benchmark: top-philic, BR(tt̄) > 0.98',bench.here.BRtt>.98);
check('benchmark: at the edge of the ATLAS exclusion (r within 0.85–1.25 at 3.75 TeV)',bench.values.r_tt_observed.value>.85&&bench.values.r_tt_observed.value<1.25);
check('benchmark: tt̄ crossing between 3.5 and 4.1 TeV',bench.values.crossing_tt_GeV.value>3500&&bench.values.crossing_tt_GeV.value<4100);

/* 5. Honesty and refusals. */
for(const r of [flat,bench]){
  check('every value has status and source',Object.values(r.values).every(v=>['theorem','verified','measured','unknown'].includes(v.status)&&v.source&&(v.status!=='unknown'||v.reason)));
  check('every certificate has claim and check',Object.values(r.certificates).every(c=>c.claim&&c.check));
}
for(const bad of [{MTeV:.5},{MTeV:9},{kL:5},{realisation:2},{cTR:2},{alphasSet:3}]){assert.throws(()=>kkgValidate(bad));passed++;}
console.log(`${passed} passed, 0 failed (reference modules = pinned data; CMS coloron control and 6.6 TeV; PDF drift; flat theorems; published RS point at the ATLAS edge)`);
