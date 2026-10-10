import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rfValidate,rfZeroModeF,rfGaugeModes,rfCoupling,rfModel,rfZeroModeMasses} from './src/modules/rs_fermions.mjs';
import {ruFermion} from './src/modules/rs_unification.mjs';
import {coloronOf} from './src/modules/collider.mjs';
let passed=0;const check=(s,c)=>{assert.ok(c,s);passed++;};

/* 1. Independent 40-digit reference (mpmath inside SageMath): roots and couplings, both chiralities. */
/* RF_REF lets the mutation test point at a perturbed copy; the default is the pinned reference. */
const ref=JSON.parse(readFileSync(process.env.RF_REF||new URL('./data/rs_fermions_reference.json',import.meta.url)));
const t0=Date.now();
check('reference file is the 40-digit mpmath control',ref.schema==='ghu-rs-fermions-reference-v1'&&/40 digits/.test(ref.engine));
for(const cs of ref.cases){
  const kL=Number(cs.kL),modes=rfGaugeModes(kL,cs.modes.length);
  cs.modes.forEach((rm,i)=>{
    check(`root n=${rm.n} kL=${cs.kL} vs reference`,Math.abs(modes[i].x-Number(rm.x))<1e-10);
    for(const [ch,tab] of [['L',rm.couplingL],['R',rm.couplingR]])for(const [c,g] of Object.entries(tab)){
      const mine=rfCoupling(Number(c),ch,kL,modes[i]).value;
      check(`coupling n=${rm.n} ${ch} c=${c} kL=${cs.kL}`,Math.abs(mine-Number(g))<1e-6*Math.max(1,Math.abs(Number(g))));
    }
  });
  for(const [c,F] of Object.entries(cs.zeroModeF))check(`F(${c}) closed form kL=${cs.kL}`,Math.abs(rfZeroModeF(Number(c),kL,'L')/Number(F)-1)<1e-12);
}

/* 2. Theorems the numerics must respect. */
for(const kL of [12,26.67,35]){const g=rfGaugeModes(kL,3);
  for(const m of g){
    check('c = 1/2 quark decouples from KK mode '+m.n,Math.abs(rfCoupling(.5,'L',kL,m).value)<1e-8);
    check('RH c = -1/2 equals LH c = 1/2 (flat profile)',Math.abs(rfCoupling(-.5,'R',kL,m).value)<1e-8);
    check('chirality mirror: g_R(c) = g_L(-c)',Math.abs(rfCoupling(.3,'R',kL,m).value-rfCoupling(-.3,'L',kL,m).value)<1e-12);
    check('root certificate: residual and Wronskian',Math.abs(m.residual)<1e-12&&Math.abs(m.wronskianAtRoot)<3e-8);
    check('normalisation converged',Math.abs(m.norm.relativeShift)<1e-7);
  }
  check('roots ordered and in the raBessel domain',g[0].x<g[1].x&&g[1].x<g[2].x&&g[2].x<12);
}
check('F(1/2)^2 = 1/kL',Math.abs(rfZeroModeF(.5,30)**2*30-1)<1e-12);
check('F continuous at c = 1/2',Math.abs(rfZeroModeF(.5+1e-9,30)/rfZeroModeF(.5,30)-1)<1e-6);
check('RH F uses -c',rfZeroModeF(.3,30,'R')===rfZeroModeF(-.3,30,'L'));

/* 3. Conventions shared with ruFermion: UV localisation means the same c. */
for(const c of [-.9,-.7,-.6,.6,.7,.9]){
  const lh=ruFermion(c,1).chirality==='LH',rh=ruFermion(c,-1).chirality==='RH';
  const dens=(ch)=>{const a=ch==='L'?1-2*c:1+2*c;return a<0;};      /* density decreasing toward the IR = UV-localised */
  check('LH UV localisation agrees with ruFermion at c='+c,lh===dens('L'));
  check('RH UV localisation agrees with ruFermion at c='+c,rh===dens('R'));
}

/* 4. The model: width convention reduces to the flat theorem; statuses and unknowns are honest. */
const r=rfModel();
check('width convention = flat theorem 2 alpha_s',Math.abs(r.certificates.width_convention.witness.difference)<1e-15);
check('flat theorem is the one collider.mjs carries',Math.abs(r.certificates.width_convention.witness.theorem-coloronOf(5000).GoverM)<1e-15);
check('every value has a status and a source',Object.values(r.values).every(v=>['theorem','verified','measured','unknown'].includes(v.status)&&v.source));
check('production and quark-mass fit are unknown with a reason',r.values.production.status==='unknown'&&r.values.production.reason&&r.values.quark_masses.status==='unknown');
check('every certificate has claim and check',Object.values(r.certificates).every(c=>c.claim&&c.check));
check('top-philic with these inputs',r.values.BR_tt.value>.8&&r.values.g_tR.value>4);
check('light quarks couple weakly and negatively',r.values.g_light_L.value<0&&r.values.g_light_L.value>-.3);

/* 4b. The published reference point of arXiv:0807.4937 (data/rs_benchmark_cghnp2008.json, extracted from its LaTeX). */
{
  const b=JSON.parse(readFileSync(new URL('./data/rs_benchmark_cghnp2008.json',import.meta.url))),c=b.c_paper,kL=Number(b.L);
  const QL=[1,2,3].map(i=>-Number(c['Q_'+i])),U=[1,2,3].map(i=>Number(c['u_'+i])),D=[1,2,3].map(i=>Number(c['d_'+i]));
  const up=rfZeroModeMasses(QL,U,b.Yu,kL,246),dn=rfZeroModeMasses(QL,D,b.Yd,kL,246),bref=ref.benchmark;
  /* (i) independent: mpmath SVD at 40 digits, in the PAPER's convention — this also certifies the sign map */
  up.masses.forEach((m,i)=>check(`up-type mass ${i} vs 40-digit SVD`,Math.abs(m/Number(bref.masses_GeV.up[i])-1)<1e-9));
  dn.masses.forEach((m,i)=>check(`down-type mass ${i} vs 40-digit SVD`,Math.abs(m/Number(bref.masses_GeV.down[i])-1)<1e-9));
  /* (ii) published: within the rounding band of the printed c and Y (tools/rs_benchmark_band.mjs); the top against
   * the paper's own statement that the ZMA top is about 5.5 GeV above the exact 136 GeV */
  const pub=b.masses_exact_GeV_at_MKK;
  [['u',up.masses[0],5e-5],['c',up.masses[1],.015],['d',dn.masses[0],1e-4],['s',dn.masses[1],.0014],['b',dn.masses[2],.047]]
    .forEach(([q,m,band])=>check(`published ${q} mass inside the rounding band`,Math.abs(pub[q]-m)<band));
  check('ZMA top ≈ exact 136 GeV + 5.5 GeV (paper, Sec. 6.3), within the 1 GeV band',Math.abs(up.masses[2]-(pub.t+5.5))<1);
  for(const cert of [up.certificate,dn.certificate]){
    check('eigenvalue invariants reconstructed',Math.abs(cert.reconstructed.trace/cert.invariants.e1-1)<1e-12&&Math.abs(cert.reconstructed.det/cert.invariants.e3-1)<1e-9);
    check('cubic residuals at machine precision',cert.cubicResidualRelative.every(x=>Math.abs(x)<1e-12));
  }
  check('lab F with the map equals the paper F (doublet)',Math.abs(rfZeroModeF(-Number(c.Q_3),kL,'L')**2-(1+2*Number(c.Q_3))/(1-Math.exp(-(1+2*Number(c.Q_3))*kL)))<1e-14);
  check('lab F with the map equals the paper F (singlet)',Math.abs(rfZeroModeF(Number(c.u_3),kL,'R')**2-(1+2*Number(c.u_3))/(1-Math.exp(-(1+2*Number(c.u_3))*kL)))<1e-14);
  /* (iii) KK-gluon couplings at the reference point against the 40-digit quadrature */
  const g1=rfGaugeModes(kL,1)[0];
  check('benchmark root vs reference',Math.abs(g1.x-Number(bref.x1))<1e-10);
  for(const [k,v] of Object.entries(bref.coupling_g1)){
    const ch=k.startsWith('Q')?'L':'R',cl=ch==='L'?-Number(c[k]):Number(c[k]);
    check(`benchmark coupling ${k}`,Math.abs(rfCoupling(cl,ch,kL,g1).value-Number(v))<1e-6*Math.max(1,Math.abs(Number(v))));
  }
}

/* 5. Refusals. */
for(const bad of [{kL:5},{kL:41},{modes:4},{cL:{light:2,Q3:.3}},{MGeV:100}]){assert.throws(()=>rfValidate(bad));passed++;}
console.error(`[timing] ${Date.now()-t0} ms`);
console.log(`${passed} passed, 0 failed (RS zero-mode quarks: 40-digit reference, orthogonality, chirality mirror, ruFermion conventions, flat-width theorem)`);
