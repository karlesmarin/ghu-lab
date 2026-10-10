/* The flat-GHU first KK gluon (Part VII coloron: √2 g_s to every quark, Γ/M = 2α_s) against the CMS dijet data,
 * arXiv:1911.03947 (HEPData ins1764471), as σ × B × A versus the published limit — not mass against a quoted mass.
 *   1. CONTROL: CMS's own axigluon/coloron prediction (cot θ = 1: g_s to every quark, NWA, CTEQ6L1 LO × K) and its
 *      6.6 TeV observed limit, recomputed with resonance_xsec.mjs (NNPDF2.3lo; the PDF differs on purpose and is a
 *      stated systematic).
 *   2. THE LAB'S OBJECT: couplings √2 g_s, Γ/M = 2α_s(M) ≈ 0.16 → spin-1 qq limits interpolated in the intrinsic width
 *      (log-linear between the 10% and 30% columns), and also the narrow qq limit for reference.
 * B: five light quarks (top in the width only), as CMS; A: xsAcceptance(1.1,'vector'); K: CMS's coloron K,
 * linear from 1.1 at 0.6 TeV to 1.3 at 8.1 TeV (reported with and without).
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {xsSigmaNWA,xsAcceptance} from '../src/modules/resonance_xsec.mjs';
import {alphasRun} from '../src/modules/collider.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const J=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const lumi=J('data/parton_lumi_13TeV.json'),cms=J('data/hepdata_cms_ins1764471.meta.json');
const N=cms.tables.narrow_qq.columns,W=cms.tables.spin1_qq_widths.columns;
const mass=N['Resonance mass [GeV]'],obs=N['95% CL observed upper limits [pb]'],colTh=N['Axigluon/coloron cross section [pb]'];
const w10=W['95% CL upper limits, 10% intrinsic width [pb]'],w30=W['95% CL upper limits, 30% intrinsic width [pb]'];
const aPDF=m=>alphasRun(m,{aZ:lumi.pdf.alphas_MZ});
const K=m=>1.1+(1.3-1.1)*(m-600)/(8100-600);
const A=xsAcceptance(1.1,'vector'),Aiso=xsAcceptance(1.1,'isotropic');
const psTop=M=>{const r=4*172.5**2/(M*M);return Math.sqrt(1-r)*(1+r/2);};
const BR5=M=>5/(5+psTop(M));                                      /* equal vector couplings to six quarks, top off-B */
const all=g=>({uu:[g,g],dd:[g,g],ss:[g,g],cc:[g,g],bb:[g,g]});
const sigmaBA=(M,g,withK=true)=>xsSigmaNWA(lumi,{MGeV:M,alphas:aPDF(M),gq:all(g),BRX:BR5(M)})*A*(withK?K(M):1);
const crossing=(f)=>{for(let i=0;i+1<mass.length;i++){const m0=mass[i],m1=mass[i+1];if(m1>8000)break;
  const r0=f(i),r1=f(i+1);if(r0==null||r1==null)continue;if(r0>=1&&r1<1){const t=Math.log(r0)/(Math.log(r0)-Math.log(r1));return m0+t*(m1-m0);}}return null;};

console.log(`acceptance: vector ${A.toFixed(4)}, isotropic ${Aiso.toFixed(4)} (CMS quotes ≈ 0.5 for isotropic)`);
/* 1. control */
const ctrl=mass.map((M,i)=>M>8000||colTh[i]==null?null:{M,cmsColoron:colTh[i],ours:sigmaBA(M,1),ratio:sigmaBA(M,1)/colTh[i]}).filter(Boolean);
console.log('CONTROL coloron σBA ours/CMS:',ctrl.filter(r=>r.M%1000===0).map(r=>`${r.M/1000}TeV ×${r.ratio.toFixed(2)}`).join('  '));
const cmsCross=crossing(i=>colTh[i]==null?null:colTh[i]/obs[i]),ourCross=crossing(i=>sigmaBA(mass[i],1)/obs[i]);
console.log(`coloron observed limit: CMS curve ${cmsCross?.toFixed(0)} GeV (paper: 6600) | ours ${ourCross?.toFixed(0)} GeV`);

/* 2. flat-GHU KK gluon */
const GoverM=M=>2*aPDF(M);
const limW=(i,M)=>{const g=GoverM(M);if(w10[i]==null||w30[i]==null)return null;
  const t=(Math.log(g)-Math.log(.10))/(Math.log(.30)-Math.log(.10));return Math.exp((1-t)*Math.log(w10[i])+t*Math.log(w30[i]));};
const rows=mass.filter(M=>M<=8000).map((M,i)=>({M,GoverM:GoverM(M),sigmaBA:sigmaBA(M,Math.SQRT2),sigmaBA_noK:sigmaBA(M,Math.SQRT2,false),
  limitWidth:limW(i,M),limitNarrow:obs[i]}));
const ghuCrossWidth=crossing(i=>rows[i]&&rows[i].limitWidth?rows[i].sigmaBA/rows[i].limitWidth:null);
const ghuCrossWidthNoK=crossing(i=>rows[i]&&rows[i].limitWidth?rows[i].sigmaBA_noK/rows[i].limitWidth:null);
const ghuCrossNarrow=crossing(i=>rows[i]?rows[i].sigmaBA/rows[i].limitNarrow:null);
console.log(`flat-GHU KK gluon (√2 g_s, Γ/M = ${GoverM(6000).toFixed(3)} at 6 TeV): excluded below ${ghuCrossWidth?.toFixed(0)} GeV (width-interpolated limit; ${ghuCrossWidthNoK?.toFixed(0)} without K) | narrow-limit reading ${ghuCrossNarrow?.toFixed(0)} GeV`);
const coverage=rows.filter(r=>r.limitWidth!=null).map(r=>r.M);
console.log(`width-interpolated limits exist from ${coverage[0]} to ${coverage.at(-1)} GeV`);
const dest=resolve(root,'research/2026-10-10-kkgluon-fourtop');mkdirSync(dest,{recursive:true});
writeFileSync(resolve(dest,'cms_dijet_contrast.json'),JSON.stringify({schema:'ghu-coloron-cms-dijet-v1',date:'2026-10-10',
  data:{narrow:cms.tables.narrow_qq.doi,spin1:cms.tables.spin1_qq_widths.doi},pdf:lumi.pdf,acceptance:{vector:A,isotropic:Aiso},
  control:{rows:ctrl,coloronLimit_CMScurve_GeV:cmsCross,coloronLimit_ours_GeV:ourCross,paper_GeV:6600},
  flatGHU:{rows,excludedBelow_widthInterpolated_GeV:ghuCrossWidth,withoutK_GeV:ghuCrossWidthNoK,narrowReading_GeV:ghuCrossNarrow,widthCoverage_GeV:[coverage[0],coverage.at(-1)]},
  scope:'NWA x B x A x K as CMS does for its models; NNPDF2.3lo instead of CTEQ6L1; |eta|<2.5 not applied; width interpolation log-linear between 10% and 30%.'},null,1)+'\n');
