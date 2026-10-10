import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ttsPartonic,ttsSpectrum,ttsCholesky,ttsSolve,ttsSensitivity,ttsShapeControl,ttsReferenceCheck} from './src/modules/tt_spectrum.mjs';
import {xsSigmaBW,xsTopThreshold} from './src/modules/resonance_xsec.mjs';
import {XS_LUMI} from './src/modules/xs_lumi_reference.mjs';
import {TT_CMS} from './src/modules/tt_cms_reference.mjs';
import {kkgModel,kkgBenchmarkInputs} from './src/modules/kk_gluon_lhc.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};
const raw=p=>readFileSync(new URL(p,import.meta.url)),J=p=>JSON.parse(raw(p));
const close=(a,b,t)=>Math.abs(a/b-1)<t;

/* 1. Partonic controls (the normalisation of σ̂_V and σ̂_int is fixed by QCD itself). */
const o0={mt:172.5,aS:.1,aV:.1,M:0,G:0};
for(const m of [350,400,1000,3000,7000]){
  const x=ttsPartonic(m*m,{...o0,Sq:2,vq:1,cTL:1,cTR:1});
  check(`massless octet, c = 1: σ̂_V = σ̂_QCD(qq̄) at ${m} GeV`,close(x.V,x.qq,1e-12));
  check(`massless octet, c = 1: σ̂_int = 2 σ̂_QCD(qq̄) at ${m} GeV`,close(x.int,2*x.qq,1e-12));
  check(`axial octet (c_L = −c_R) does not interfere in dσ/dm at ${m} GeV`,ttsPartonic(m*m,{...o0,Sq:2,vq:0,cTL:1,cTR:-1}).int===0);
}
check('below threshold everything vanishes',Object.values(ttsPartonic(340*340,{...o0,Sq:2,vq:1,cTL:1,cTR:1})).every(v=>v===0));
{/* gg → tt̄: high-energy limit (π α²/(3ŝ))(ln(ŝ/m²) − 7/4) (corrections O(ρ ln ρ), so far out), and the S-wave
   * threshold (π α²/(3ŝ)) β · 7/16 (ρ → 1: (33/8) − (59/16) = 7/16) */
  const hi=ttsPartonic(1e10,{...o0,Sq:0,vq:0,cTL:0,cTR:0}).gg,lim=Math.PI*.01/(3e10)*(Math.log(1e10/172.5**2)-7/4);
  check('gg → tt̄ high-energy limit (Combridge)',close(hi,lim,1e-4));
  const sh=345.001**2,b=Math.sqrt(1-4*172.5**2/sh);
  check('gg → tt̄ S-wave threshold: σ̂ → (πα²/3ŝ) β 7/16',close(ttsPartonic(sh,{...o0,Sq:0,vq:0,cTL:0,cTR:0}).gg/(Math.PI*.01/(3*sh)*b),7/16,1e-3));}
{/* sign of the interference: −sign(v_q v_t) below the pole, +sign above; zero at the pole */
  const o={mt:172.5,aS:.1,aV:.1,M:3000,G:450,Sq:2,cTL:1,cTR:1};
  check('same-sign couplings: destructive below the pole',ttsPartonic(2000**2,{...o,vq:1}).int<0);
  check('same-sign couplings: constructive above the pole',ttsPartonic(4000**2,{...o,vq:1}).int>0);
  check('opposite-sign couplings: constructive below the pole',ttsPartonic(2000**2,{...o,vq:-.2}).int>0);
  check('interference vanishes at the pole',ttsPartonic(3000**2,{...o,vq:1}).int===0);
  const a=ttsPartonic(2000**2,{...o,vq:1}),b=ttsPartonic(2000**2,{...o,Sq:8,vq:2,cTL:2,cTR:2});
  check('fixed width: σ̂_V scales as c⁴, σ̂_int as c²',close(b.V,16*a.V,1e-12)&&close(b.int,4*a.int,1e-12));}

/* 2. σ̂_V is the Breit–Wigner of resonance_xsec.mjs: integrated over the same range they agree. */
{const M=3000,GoverM=.15,G=GoverM*M,a=.1,ft=xsTopThreshold(1,1,M),BRX=(a/12)*ft*M/G;
  const bw=xsSigmaBW(XS_LUMI,{MGeV:M,alphas:a,gq:{uu:[1,1]},GammaOverM:GoverM,BRX,panels:8000});
  const sp=ttsSpectrum(XS_LUMI,{MGeV:M,GammaGeV:G,gq:{uu:[1,1]},top:[1,1],aS:()=>a,aV:a,bins:[[bw.range[0],bw.range[1]]],panels:20000});
  const sV=sp.bins[0].V*(bw.range[1]-bw.range[0]);
  check(`σ_V (spectrum) = σ (xsSigmaBW) over ${bw.range[0]}–${bw.range[1]} GeV: ratio ${(sV/bw.sigma_pb).toFixed(5)}`,close(sV,bw.sigma_pb,1e-3));}

/* 3. The pinned CMS spectrum (TOP-20-001, HEPData ins1901295) travels intact. */
const meta=J('./data/hepdata_cms_ins1901295.meta.json');
for(const k of ['abs','norm']){const t=TT_CMS[k],m=meta.tables[k];
  check(`${k}: DOI ${t.doi}`,t.doi===m.doi&&/hepdata\.102956/.test(t.doi));
  check(`${k}: 15 bins 250–3500 GeV`,t.value.length===15&&t.bin_low_GeV[0]===250&&t.bin_high_GeV[14]===3500);
  check(`${k}: values and covariance equal the meta file`,JSON.stringify(t.value)===JSON.stringify(m.value)&&JSON.stringify(t.covariance)===JSON.stringify(m.covariance));
  for(const [name,h] of Object.entries(t.raw_sha256))
    check(`${k}: raw ${name} bytes match their sha256`,createHash('sha256').update(raw(`./data/hepdata_cms_ins1901295_${name}.json`)).digest('hex')===h);
  check(`${k}: covariance diagonal = stat ⊕ sys within 0.1%`,t.value.every((_,i)=>close(Math.sqrt(t.covariance[i][i]),Math.hypot(t.stat[i],t.sys[i]),1e-3)));
  check(`${k}: covariance symmetric`,t.covariance.every((r,i)=>r.every((c,j)=>Math.abs(c-t.covariance[j][i])<=1e-12*Math.abs(c)+1e-300)));}
check('absolute covariance is positive definite',(()=>{try{ttsCholesky(TT_CMS.abs.covariance);return true;}catch{return false;}})());

/* 4. Linear algebra: Cholesky solve exact to rounding; a non-positive matrix is refused. */
{const C=[[4,2,0],[2,5,1],[0,1,3]],{x,residual}=ttsSolve(C,[1,2,3]);
  check('solve residual at rounding',residual<1e-14);
  check('solve matches the hand result',close(x[2],(3-x[1])/3,1e-12));
  assert.throws(()=>ttsCholesky([[1,2],[2,1]]));passed++;
  const s=ttsSensitivity([.1,.1,.1],[1,1,1],[[1,0,0],[0,1,0],[0,0,1]]);
  check('Δχ² of a diagonal unit covariance is Σ Δ²',close(s.chi2,.03,1e-12));}

/* 5. The SM at LO in the CMS binning: magnitudes, composition, convergence, and the shape control. */
const aS=mu=>.13/(1+.13*(21/(12*Math.PI))*2*Math.log(mu/91.1876));
const bins=TT_CMS.abs.bin_low_GeV.map((lo,i)=>[lo,TT_CMS.abs.bin_high_GeV[i]]);
const sm=ttsSpectrum(XS_LUMI,{MGeV:3000,GammaGeV:300,gq:{},top:[0,0],aS,aV:aS(3000),bins});
const totLO=sm.bins.reduce((a,b)=>a+b.sm*(b.hi-b.lo),0);
check(`LO σ(tt̄) in 250–3500 GeV = ${totLO.toFixed(1)} pb (regression 391.4 pb)`,close(totLO,391.4,2e-3));
{const ggTot=sm.bins.reduce((a,b)=>a+b.smGG*(b.hi-b.lo),0)/totLO;
check(`gg share of σ(tt̄) at 13 TeV LO = ${(100*ggTot).toFixed(1)}% (expected 80–90%)`,ggTot>.8&&ggTot<.9);
check('gg dominates every bin (> 75%)',sm.bins.every(b=>b.smGG/b.sm>.75));
check('q q̄ share rises in the tail (valence quarks at high x)',sm.bins[14].smQQ/sm.bins[14].sm>sm.bins[8].smQQ/sm.bins[8].sm);}
check('bin averages converged (400 vs 200 panels) below 1e-4',sm.worstShiftVsHalf<1e-4);
check('no octet coupling → R = 0 in every bin',sm.bins.every(b=>b.R===0));
const shp=ttsShapeControl(sm.bins,TT_CMS.norm);
check(`shape control: data/LO within 0.9–1.4 in every bin (χ² ${shp.chi2.toFixed(0)}/${shp.ndof}: LO shape is not the measured one)`,shp.ratioDataOverLO.every(r=>r>.9&&r<1.4));
assert.throws(()=>ttsSpectrum(XS_LUMI,{MGeV:3000,GammaGeV:300,gq:{},top:[0,0],aS,aV:.1,bins,panels:6}));passed++;

/* 6. Through the KK gluon card: the published RS point and flat GHU. */
{const rs=kkgModel(kkgBenchmarkInputs()),v=rs.values;
  check('RS reference point: interference constructive below the pole (v_u < 0 < v_t)',v.interference_below_pole.value==='constructive');
  check('RS reference point: theory error lowers Δχ²',v.tt_spectrum_dchi2.value<v.tt_spectrum_dchi2_experimental.value);
  check(`RS reference point: spectrum reach ${(v.tt_spectrum_reach_GeV.value/1000).toFixed(2)} TeV within 3.4–4.0 TeV (regression 3.70)`,v.tt_spectrum_reach_GeV.value>3400&&v.tt_spectrum_reach_GeV.value<4000);
  check('certificates: control ratios 1 and 2',close(rs.certificates.tt_spectrum_control.witness.V_over_QCD,1,1e-12)&&close(rs.certificates.tt_spectrum_control.witness.int_over_QCD,2,1e-12));
  check('certificates: solve residual at rounding',rs.certificates.tt_spectrum_integration.witness.solveResidual<1e-12);
  check('every certificate states its claim',Object.values(rs.certificates).every(c=>typeof c.claim==='string'&&c.claim.length>10));
  const fl=kkgModel({realisation:0,MTeV:4.6});
  check('flat GHU: same-sign couplings, destructive below the pole',fl.values.interference_below_pole.value==='destructive');
  check('flat GHU at 4.6 TeV: the low bins go down',fl.hereS.bins[0].R<0&&fl.hereS.bins[13].R<0);
  const fl0=kkgModel({realisation:0,MTeV:4.6,ttTheory:0});
  check('ttTheory = 0 reproduces the experimental-only Δχ²',close(fl0.values.tt_spectrum_dchi2.value,fl0.values.tt_spectrum_dchi2_experimental.value,1e-12));
  assert.throws(()=>kkgModel({ttTheory:.6}));passed++;}

/* 7. Independent reference (tools/tt_spectrum_reference.py): Dirac-matrix traces for the partonic pieces, the
 * differential Combridge |M|² for gg, and the hadronic bins with LHAPDF called directly (no interpolated grid). */
const ref=J('./data/tt_spectrum_reference.json');
let worstP=0;
for(const k of ref.partonic){const [qL,qR]=k.cq,[tL,tR]=k.ct;
  const x=ttsPartonic(k.shat,{mt:k.mt,aS:k.alpha,aV:k.alphaV,M:k.M,G:k.Gam,Sq:qL*qL+qR*qR,vq:(qL+qR)/2,cTL:tL,cTR:tR});
  for(const t of ['qq','V','int']){const d=Math.abs(x[t]/k['sigma_'+t]-1);worstP=Math.max(worstP,d);
    check(`Dirac traces: σ̂_${t} at √ŝ = ${Math.sqrt(k.shat)} GeV, c_q = ${k.cq}, c_t = ${k.ct} (rel. diff ${d.toExponential(1)})`,d<1e-9);}}
for(const k of ref.gg_textbook){const x=ttsPartonic(k.shat,{mt:k.mt,aS:k.alpha,aV:0,M:0,G:0,Sq:0,vq:0,cTL:0,cTR:0}).gg;
  check(`gg → tt̄ integrated formula = differential Combridge |M|² integrated, √ŝ = ${Math.sqrt(k.shat)} GeV`,close(x,k.sigma_gg_textbook,1e-6));}
{const aR=mu=>.13/(1+.13*(21/(12*Math.PI))*2*Math.log(mu/91.1876));
  const sp={};for(const [name,o] of Object.entries(ref.octets))
    sp[name]=ttsSpectrum(XS_LUMI,{MGeV:o.M,GammaGeV:o.GoverM*o.M,gq:o.cq,top:o.ct,aS:aR,aV:aR(o.M),bins:ref.bins.map(b=>[b.lo,b.hi])});
  let worstSM=0,worstBSM=0;
  ref.bins.forEach((b,i)=>{const smRef=b.qq+b.gg,j=sp.flat_4600.bins[i];
    worstSM=Math.max(worstSM,Math.abs(j.sm/smRef-1));
    for(const name of Object.keys(ref.octets)){const jb=sp[name].bins[i];
      worstBSM=Math.max(worstBSM,Math.abs((jb.V+jb.int)-(b[name+'_V']+b[name+'_int']))/smRef);}});
  check(`LHAPDF directly vs the pinned grid: SM bins agree within 1e-3 (worst ${worstSM.toExponential(2)})`,worstSM<1e-3);
  check(`LHAPDF directly vs the pinned grid: octet + interference agree within 1e-4 of the SM (worst ${worstBSM.toExponential(2)})`,worstBSM<1e-4);
  check('reference provenance: LHAPDF 247000',ref.pdf.lhapdf_id===247000);
  console.log(`independent reference: partonic worst ${worstP.toExponential(1)}; SM bins worst ${worstSM.toExponential(2)}; octet terms worst ${worstBSM.toExponential(2)} of the SM`);
  /* the shared function the card runs live gives the same answer as this harness's own loop */
  const {TTS_REFERENCE}=await import('./src/modules/tts_reference.mjs'),live=ttsReferenceCheck(XS_LUMI,TTS_REFERENCE);
  check('generated tts_reference.mjs carries the reference file',JSON.stringify(TTS_REFERENCE.bins)===JSON.stringify(ref.bins)&&TTS_REFERENCE.source.sha256===createHash('sha256').update(raw('./data/tt_spectrum_reference.json')).digest('hex'));
  check('ttsReferenceCheck = the harness loop',Math.abs(live.partonic-worstP)<1e-15&&Math.abs(live.sm-worstSM)<1e-12&&Math.abs(live.octet-worstBSM)<1e-12);
  const card=kkgModel(kkgBenchmarkInputs()).certificates.tt_spectrum_reference;
  check('the KK-gluon card shows the live reference check',card.witness.partonic===live.partonic&&card.witness.sm===live.sm);}

console.log(`${passed} passed, 0 failed (σ̂_V = QCD and σ̂_int = 2 QCD for a massless octet, σ_V = xsSigmaBW, Dirac-trace and LHAPDF-direct references, pinned CMS m(tt̄) bytes, Cholesky, LO SM shape control, sensitivity through the KK gluon card)`);
