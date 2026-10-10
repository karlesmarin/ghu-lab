/* KK gluon against data: ATLAS arXiv:2512.17856 (HEPData ins3094414, Fig. 10c) observed limit on σ×BR(tt̄).
 *   1. CONTROL: reproduce ATLAS's own theory curve for its benchmark (g_q = -0.2 g_s, g_bL = g_tL = g_s,
 *      BR(tt̄) = 0.925, Γ/M = 30%; MadGraph LO, NNPDF2.3lo) with resonance_xsec.mjs + data/parton_lumi_13TeV.json.
 *   2. CONTRAST: the published RS reference point of arXiv:0807.4937 (via rs_fermions.mjs) and the illustrative
 *      c sets, scanned in mass: r = σ×BR / observed limit (SModelS register), and the mass where r crosses 1.
 * Limits are for Γ/M = 30%; applying them to a narrower resonance is conservative (a narrower peak is more
 * constrained). Leading order, no K-factor, no interference with QCD tt̄ — the same order as ATLAS's theory curve.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {xsSigmaBW,xsSigmaNWA} from '../src/modules/resonance_xsec.mjs';
import {rfOctetGenerations} from '../src/modules/rs_fermions.mjs';
import {alphasRun} from '../src/modules/collider.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const J=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const lumi=J('data/parton_lumi_13TeV.json'),atlas=J('data/hepdata_atlas_ins3094414_fig10c.meta.json'),bench=J('data/rs_benchmark_cghnp2008.json');
const dest=resolve(root,'research/2026-10-10-kkgluon-fourtop');mkdirSync(dest,{recursive:true});
const C=atlas.columns, interpLog=(xs,ys,x)=>{if(x<xs[0]||x>xs[xs.length-1])return null;let i=0;while(xs[i+1]<x)i++;
  const t=(x-xs[i])/(xs[i+1]-xs[i]);return Math.exp((1-t)*Math.log(ys[i])+t*Math.log(ys[i+1]));};
/* alpha_s with the PDF set's own alpha_s(MZ) = 0.130, one-loop, same routine as the lab */
const alphasPDF=(m)=>alphasRun(m,{aZ:lumi.pdf.alphas_MZ});

/* 1. control */
const atlasCouplings={uu:[-.2,-.2],dd:[-.2,-.2],ss:[-.2,-.2],cc:[-.2,-.2],bb:[1,-.2]};
const control=C.mass_TeV.map((mT,i)=>{const M=mT*1000;
  const run=(aFn,scale)=>xsSigmaBW(lumi,{MGeV:M,alphas:aFn(M),gq:atlasCouplings,GammaOverM:.30,BRX:.925,scale});
  const lab=run(m=>alphasRun(m),'mu=sqrt(shat)'),pdf=run(alphasPDF,'mu=sqrt(shat)'),pdfHalf=run(alphasPDF,'mu=sqrt(shat)/2');
  return {mass_TeV:mT,atlasTheory_pb:C.theory_gKK_30pc[i],ours_alphasLab_pb:lab.sigma_pb,ours_alphasPDF_pb:pdf.sigma_pb,
    ours_alphasPDF_muHalf_pb:pdfHalf.sigma_pb,ratio_alphasPDF:pdf.sigma_pb/C.theory_gKK_30pc[i],
    ratio_alphasLab:lab.sigma_pb/C.theory_gKK_30pc[i],integration:{relShift:pdf.relativeShiftVsHalf,window:pdf.window,truncated:pdf.truncated}};});
console.log('CONTROL vs ATLAS theory (ratio ours/ATLAS):');
for(const r of control)console.log(`  ${r.mass_TeV} TeV  ATLAS ${r.atlasTheory_pb.toPrecision(4)} pb | ours αs(PDF) ${r.ours_alphasPDF_pb.toPrecision(4)} (×${r.ratio_alphasPDF.toFixed(3)}) | αs(lab) ×${r.ratio_alphasLab.toFixed(3)} | μ/2 ${r.ours_alphasPDF_muHalf_pb.toPrecision(4)}`);

/* 2. contrast */
const kLb=Number(bench.L),cp=bench.c_paper;
const points={
  'CGHNP2008 reference point':{kL:kLb,cQ:[1,2,3].map(i=>-Number(cp['Q_'+i])),cU:[1,2,3].map(i=>Number(cp['u_'+i])),cD:[1,2,3].map(i=>Number(cp['d_'+i]))},
  'illustrative c_R(t_R)=0.3, kL=35':{kL:35,cQ:[.6,.6,.3],cU:[-.6,-.6,.3],cD:[-.6,-.6,-.6]},
};
const contrast={};
for(const [name,pt] of Object.entries(points)){
  const rows=[];
  for(let M=1000;M<=5000;M+=250){
    const o=rfOctetGenerations({kL:pt.kL,MGeV:M,cQ:pt.cQ,cU:pt.cU,cD:pt.cD});
    const gq={uu:[o.couplings.Q[0],o.couplings.U[0]],dd:[o.couplings.Q[0],o.couplings.D[0]],ss:[o.couplings.Q[1],o.couplings.D[1]],
              cc:[o.couplings.Q[1],o.couplings.U[1]],bb:[o.couplings.Q[2],o.couplings.D[2]]};
    const bw=xsSigmaBW(lumi,{MGeV:M,alphas:alphasPDF(M),gq,GammaOverM:o.GoverM,BRX:o.BR_tt,scale:'mu=sqrt(shat)'});
    const nwa=xsSigmaNWA(lumi,{MGeV:M,alphas:alphasPDF(M),gq,BRX:o.BR_tt,scale:'mu=sqrt(shat)'});
    const lim=interpLog(C.mass_TeV,C.observed,M/1000),exp=interpLog(C.mass_TeV,C.expected,M/1000);
    rows.push({M_GeV:M,GoverM:o.GoverM,BR_tt:o.BR_tt,sigmaBR_BW_pb:bw.sigma_pb,sigmaBR_NWA_pb:nwa,observed_pb:lim,expected_pb:exp,
      r_observed:lim?bw.sigma_pb/lim:null,r_expected:exp?bw.sigma_pb/exp:null,integrationRelShift:bw.relativeShiftVsHalf});
  }
  let cross=null;for(let i=0;i+1<rows.length;i++)if(rows[i].r_observed>=1&&rows[i+1].r_observed<1){const a=rows[i],b=rows[i+1];
    const t=Math.log(a.r_observed)/(Math.log(a.r_observed)-Math.log(b.r_observed));cross=a.M_GeV+t*(b.M_GeV-a.M_GeV);}
  contrast[name]={rows,excludedBelow_GeV:cross};
  console.log(`\n${name}: excluded below ≈ ${cross?cross.toFixed(0):'(no crossing in 1–5 TeV)'} GeV (observed, Γ/M=30% limits)`);
  for(const r of rows.filter(r=>r.M_GeV%1000===0||r.M_GeV===3750))console.log(`  M=${r.M_GeV}  Γ/M=${r.GoverM.toFixed(3)} BR=${r.BR_tt.toFixed(3)}  σBR(BW)=${r.sigmaBR_BW_pb.toPrecision(3)} pb (NWA ${r.sigmaBR_NWA_pb.toPrecision(3)})  r_obs=${r.r_observed?.toFixed(2)}`);
}
writeFileSync(resolve(dest,'atlas_contrast.json'),JSON.stringify({schema:'ghu-kkgluon-atlas-contrast-v1',date:'2026-10-10',
  data:{atlas:atlas.doi,raw_sha256:atlas.raw_sha256},pdf:lumi.pdf,control,contrast,
  scope:'LO, no K-factor, no interference; limits for Γ/M = 30% applied to the computed width (conservative for narrower).'},null,1)+'\n');
