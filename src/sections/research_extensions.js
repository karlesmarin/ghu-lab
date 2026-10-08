/* Extensions attach to the existing section lifecycle and permalink. */
function rxAttach(section,def) {
  RX_STATE[def.id]={...def.defaults};
  const init=section.init,render=section.render,dispose=section.dispose,encode=section.encodeState,decode=section.decodeState,texExport=section.texExport;
  section.extensionBaseMethods??={init,render,dispose,encode,decode,texExport};
  const marker=`~rx-${def.id}~`;let panel=null;
  section.html=`<button id="rx_${def.id}_jump" class="ghost" style="margin:0 8px 12px 0">Go to experiment · ${rxEscape(def.title)}</button>`+section.html+rxHTML(def);
  section.init=function(ctx){const result=init?init.call(this,ctx):undefined;panel=rxMount(def,ctx);return result;};
  section.dispose=function(){if(panel)panel.dispose();panel=null;if(dispose)dispose.call(this);};
  section.render=function(...args){if(render)render.apply(this,args);if(panel)panel.render();};
  section.encodeState=function(){return (encode?encode.call(this):'')+marker+encodeURIComponent(JSON.stringify(RX_STATE[def.id]));};
  section.decodeState=function(text){const parts=String(text||'').split(marker);if(decode)decode.call(this,parts[0]);RX_STATE[def.id]={...def.defaults};
    if(parts.length===2)try{const raw=JSON.parse(decodeURIComponent(parts[1]));const p=Object.fromEntries(Object.keys(def.defaults).map(k=>[k,raw[k]??def.defaults[k]]));def.validate(p);RX_STATE[def.id]=p;}catch{/* invalid payload keeps defaults */}
  };
  if(texExport)section.texExport=function(...args){const result=texExport.apply(this,args);if(def.visible&&!def.visible())return result;let r;try{r=rxResult(def,RX_STATE[def.id]);}catch(e){result.card.researchExtensions??={};result.card.researchExtensions[def.id]={parameters:RX_STATE[def.id],error:e.message};return result;}
    result.card.researchExtensions??={};result.card.researchExtensions[def.id]={parameters:RX_STATE[def.id],result:r,comparison:RX_BASELINES[def.id]||null};
    result.body=(result.body||'')+'\n\\paragraph{'+def.title.replace(/[&_%#]/g,'')+'} '+def.tex(r)+'\n';return result;};
}
const MN_PANEL={
  id:'su6mn',title:'Maru–Nago SU(6): Type 2 / Type 3 families',
  intro:'Three generations with k₁ = 0 and k₂ = 3 − k₃. Change the content, compare the published minimum and inspect convergence of the Wilson potential.',
  defaults:{k3:3,Nad:5,windings:240},validate:mnValidate,compute:mnModel,
  fields:[{key:'k3',label:'Type 3 generations k₃',min:0,max:3,step:1},{key:'Nad',label:'Adjoint Dirac copies',min:0,max:60,step:1},{key:'windings',label:'Fourier terms',min:5,max:2400,step:1}],
  source:'Source: <a href="https://doi.org/10.1007/JHEP11(2024)035" target="_blank" rel="noopener">Maru–Nago, JHEP 11 (2024) 035, eq. (4.3), Table 2</a>. Independent character and infinite-sum checks accompany this implementation.',
  present(r){return `<p><b>Minimum α = ${rxNumber(r.minimum.alpha)}</b>. ${r.published?`Table 2: ${r.published.alpha}; independent infinite sum: ${rxNumber(r.published.infiniteAlpha)}. The difference is numerical; the authors' truncation procedure is not established.`:'This content has no stored Table 2 comparison.'}</p>`+
    rxPlot('SU(6) Wilson potential',[{name:'Selected content',points:r.curve.map(p=>[p.alpha,p.potential])}],'α','[V(α) − V(0)] / C',r.parameters)+
    rxPlot('Detail around the Wilson minimum',rxCompared('su6mn',[{name:'Potential near minimum',points:r.zoom.map(p=>[p.alpha,p.potential])}],b=>b.zoom.map(p=>[p.alpha,p.potential])),'α · magnified','[V(α) − V(0)] / C',r.parameters)+
    rxTable(['Fourier terms','Minimum α'],r.convergence.map(c=>[c.windings,c.alpha]))+
    `<p class="note">${rxEscape(r.normalization)}. Type 2: 15(+,+) + 15′(+,−) + νR; Type 3: 15(+,+) + 21(+,−) + νR. Three Wilson-blind singlets stay in the model record. Loading transfers only the supported bulk potential; brane terms that lift adjoint exotic zero modes require additional input.</p><p class="note">${r.unknown.map(rxEscape).join('; ')}.</p>`;},
  tex:r=>`Flat SU(6), k3=${r.parameters.k3}, Nad=${r.parameters.Nad}: alpha=${r.minimum.alpha.toPrecision(8)} using ${r.parameters.windings} terms. Potential-only comparison; full phenomenological viability not evaluated.`,
  load(r,ctx){SUN5D_S.blocks={...r.blocks};SUN5D_S.bulk={...r.bulk};SUN5D_S.brane={};SUN5D_S.preset=null;ctx.go('sun5d');}
};
rxAttach(PAP_SECTION,MN_PANEL);

const RU_PANEL={
  id:'rsrunning',title:'Warped SU(6): differential running and UV brane terms',
  intro:'The C1/C2 matter assignments use the asymptotic Planck-brane correlator. Inspect the two independent coupling differences and the brane terms required at the UV scale.',
  defaults:{content:1,irTeV:10,logUV:18,lambda21:0,lambda31:0,cPlus:.7,cMinus:-.7,mUV:0},validate:ruValidate,compute:ruModel,
  fields:[{key:'content',label:'Matter assignment',options:[[1,'C1'],[2,'C2']]},{key:'irTeV',label:'IR scale [TeV]',min:1,max:100},
    {key:'logUV',label:'log₁₀ UV scale [GeV]',min:15,max:19},{key:'lambda21',label:'Chosen Δλ₂₁',min:-3,max:3},{key:'lambda31',label:'Chosen Δλ₃₁',min:-3,max:3},
    {key:'cPlus',label:'Probe c, UV (+)',min:-.99,max:.99},{key:'cMinus',label:'Probe c, UV (−)',min:-.99,max:.99},{key:'mUV',label:'Probe UV mass / k',min:0,max:1}],
  source:'Source: <a href="https://arxiv.org/abs/2512.22094" target="_blank" rel="noopener">Angelescu et al., Planck-brane correlators, §§4.4–6</a>. Coupling inputs retain the laboratory’s recorded PDG editions.',
  present(r){return `<p><b>Required max |Δλ| = ${rxNumber(r.maxRequired)}</b>; NDA reference 1/(16π²) = ${rxNumber(r.nda)}. Residuals compare the required UV boundary terms with your choices; they are not a statistical goodness of fit.</p>`+
    rxPlot('RS differential gauge running',rxCompared('rsrunning',[{name:'α₂⁻¹ − α₁⁻¹',points:r.samples.map(s=>[s.logQ,s.delta[0]])},{name:'α₃⁻¹ − α₁⁻¹',points:r.samples.map(s=>[s.logQ,s.delta[1]])}],b=>b.samples.map(s=>[s.logQ,s.delta[0]])),
      'log₁₀ q [GeV]','Inverse coupling difference',r.parameters)+
    rxTable(['Boundary difference','Required Δλ','Chosen Δλ','Residual'],[['2 − 1',r.requiredDeltaLambda[0],r.parameters.lambda21,r.residual[0]],['3 − 1',r.requiredDeltaLambda[1],r.parameters.lambda31,r.residual[1]]])+
    `<p><b>UV-mass probe:</b> (+): ${rxEscape(r.uvFermionProbe.plus.status)}; (−): ${rxEscape(r.uvFermionProbe.minus.status)}. Effective Dirac threshold: ${rxNumber(r.uvFermionProbe.uvMassGeV)} GeV.</p><p class="note">${rxEscape(r.uvFermionProbe.scope)}. ${rxEscape(r.matching.approximation)}. ${rxEscape(r.scope)}.</p><p class="note">Not evaluated: ${r.unknown.map(rxEscape).join('; ')}.</p>`;},
  tex:r=>`Planck-brane C${r.parameters.content}: required boundary differences (${r.requiredDeltaLambda.map(x=>x.toPrecision(5)).join(', ')}). One-loop differential running with approximate IR matching; no statistical exclusion.`
};
rxAttach(BLKT_SECTION,RU_PANEL);

const NF_PANEL={
  id:'flavour',title:'Three active flavours: construct a rank 2 or rank 3 ring extension',
  intro:'Three sterile copies provide independent mass directions. Reconstruct their Yukawa couplings from chosen masses and PMNS parameters, then compare with the official oscillation reference. These inputs are not predictions of the one-copy ring.',
  defaults:nfDefaults(),validate:nfValidate,compute:p=>nfModel(p,NR_S),visible:()=>PRED_S.variant==='neutrino',
  presets:[{label:'NuFIT 6.1 · normal',values:{...nfDefaults()}},
    {label:'NuFIT 6.1 · inverted',values:{...nfDefaults(),order:1,s23:.550,s13:.02262,delta:274,dm3:2.483}},
    {label:'Hosotani 2026 · historical PMNS inputs',values:{...nfDefaults(),s12:.307,s23:.561,s13:.022,delta:180,dm21:7.49,dm3:2.53}}],
  fields:[{key:'order',label:'Ordering',options:[[0,'Normal'],[1,'Inverted']]},{key:'lightEV',label:'Lightest mass [eV]',min:0,max:.2},
    ...['12','23','13'].map(k=>({key:'s'+k,label:'sin² θ'+k,min:0,max:1})),
    {key:'delta',label:'Dirac δ [degrees]',min:0,max:360},{key:'alpha21',label:'Majorana α₂₁ [degrees]',min:0,max:360},{key:'alpha31',label:'Majorana α₃₁ [degrees]',min:0,max:360},
    {key:'dm21',label:'Δm²₂₁ [10⁻⁵ eV²]',min:1,max:15},{key:'dm3',label:'|Δm²₃ℓ| [10⁻³ eV²]',min:.5,max:5},
    ...[1,2,3].map(i=>({key:'d'+i,label:'Active deficit direction '+i,min:1e-6,max:.001}))],
  source:'References: <a href="https://www.nu-fit.org/sites/default/files/v61.tbl-parameters.pdf" target="_blank" rel="noopener">NuFIT 6.1, IC24 with SK</a>; <a href="https://arxiv.org/abs/2507.08321" target="_blank" rel="noopener">Hosotani 2026</a>. The historical button copies light-sector inputs only; the ring extension is a different action from the paper’s RS model.',
  present(r){return `<p><b>Light rank ${r.rank}; masses ${r.massesEV.map(rxNumber).join(', ')} eV.</b> Sum = ${rxNumber(r.sumMassEV)} eV, light-sector mβ = ${rxNumber(r.mBetaEV)} eV, mββ = ${rxNumber(r.mBBEV)} eV, JCP = ${rxNumber(r.jarlskog)}.</p>`+
    rxPlot('Unitary-limit vacuum appearance probabilities',rxCompared('flavour',[{name:'νμ → νe',points:r.samples.map(s=>[s.LoverE,s.nu])},{name:'antineutrinos',points:r.samples.map(s=>[s.LoverE,s.anti])}],b=>b.samples.map(s=>[s.LoverE,s.nu])),'L/E [km/GeV]','Vacuum probability',r.parameters)+
     rxMatrix('PMNS flavour fractions |Uαi|²',r.U.map(row=>row.map(z=>z[0]**2+z[1]**2)),['e','μ','τ'],['ν₁','ν₂','ν₃'],r.parameters)+
    `<p class="note">The figure uses the unitary PMNS limit in vacuum. The full active deficit matrix and 18 heavy-pair flavour weights are exported separately. Matter effects and a fit allowing nonunitarity are not included.</p>`+
     rxTable(['Direction','Light mass [eV]','Dirac mass [GeV]','μA [keV]','Deficit','Insertion / nearest gap'],r.copies.map(c=>[c.direction,c.lightEV,c.mDGeV,c.muAkeV,c.deficit,c.insertionToSmallestGap]))+
     `<details><summary>Mass, Yukawa and active deficit matrices</summary>`+rxTable(['Row','Column','mν [eV] · Re','mν · Im','Yukawa · Re','Yukawa · Im','Deficit · Re','Deficit · Im'],r.U.flatMap((row,i)=>row.map((_,j)=>[['e','μ','τ'][i],j+1,...r.lightMassMatrixEV[i][j],...r.yukawaMatrix[i][j],...r.activeDeficit[i][j]])))+`</details>`+
    rxTable(['Parameter','Chosen','NuFIT best','3σ lower','3σ upper','Separate range'],r.comparison.map(c=>[c.key,c.value,c.best,c.lo,c.hi,c.inside?'inside':'outside']))+
    `<p class="note">${rxEscape(r.reference.meaning)}. |Δm²₃ℓ| means Δm²₃₁ for normal ordering and −Δm²₃₂ for inverted ordering. No χ² is assigned by adding these ranges.</p><p>${rxEscape(r.action)}. ${rxEscape(r.scope)}</p><p class="note">Not evaluated: ${r.unknown.map(rxEscape).join('; ')}.</p>`;},
  tex:r=>`Three-copy ring inverse construction, light rank ${r.rank}, masses (${r.massesEV.map(x=>x.toPrecision(5)).join(', ')}) eV. PMNS orientation is input. Separate NuFIT ranges do not define a likelihood.`
};
rxAttach(PRED_SECTION,NF_PANEL);

const NI_PANEL={
  id:'identifiability',title:'Fixed light inputs: what can distinguish the neutrino ring?',
  intro:'Hold the selected light masses and PMNS orientation fixed, reconstruct the couplings along a parameter path, and compare the heavy spectrum with raw and normalized vacuum current factors. The archived DeepCore map is a separate standard-three-neutrino reference.',
  defaults:niDefaults(),validate:niValidate,visible:()=>PRED_S.variant==='neutrino',
  compute:p=>({...niModel(p,RX_STATE.flavour,NR_S,NI_DEEPCORE),provenance:{version:VERSION,build:BUILD,kernelHash:KERNEL_HASH,dataset:NI_DEEPCORE.provenance}}),
  presets:[{label:'Heavy splitting at fixed light inputs',values:niDefaults()},
    {label:'Common suppression hidden by normalization',values:{...niDefaults(),axis:5,position:1}},
    {label:'Unequal deficits and flavour shape',values:{...niDefaults(),axis:8,position:1}}],
  fields:[{key:'axis',label:'Parameter to investigate',options:NI_AXES.map((a,i)=>[i,a.label])},
    {key:'position',label:'Selected position in the sweep [0–1]',min:0,max:1,step:.01},
    {key:'copy',label:'Sterile copy',options:[[0,'Direction 1'],[1,'Direction 2'],[2,'Direction 3']]},
    {key:'pair',label:'Heavy pair',options:Array.from({length:6},(_,i)=>[i+1,'Pair '+(i+1)])},
    {key:'from',label:'Source flavour',options:[[0,'Electron'],[1,'Muon'],[2,'Tau']]},
    {key:'to',label:'Detected flavour',options:[[0,'Electron'],[1,'Muon'],[2,'Tau']]},
    {key:'antineutrino',label:'Propagation',options:[[0,'Neutrino'],[1,'Antineutrino']]}],
  source:'Equations: <a href="https://arxiv.org/abs/1609.08637" target="_blank" rel="noopener">Blennow et al., vacuum limit of eqs. (5),(7)</a>. Data: <a href="https://doi.org/10.21234/B4105H" target="_blank" rel="noopener">IceCube DeepCore 2018, DOI 10.21234/B4105H</a>. <a href="https://github.com/karlesmarin/ghu-lab/blob/main/docs/neutrino-identifiability.md" target="_blank" rel="noopener">Method, current scope and reproduction</a>.',
  present:niPresent,
  tex:r=>`Fixed light inputs; ${r.axis.key} sweep: ${r.summary.valid}/${r.summary.total} points evaluated. Light reconstruction residual ${r.summary.maxLightResidualEV} eV. DeepCore 2018 reference Delta chi2 ${r.deepcore?.deltaChi2??'outside grid'} is not a nonunitary ring likelihood.`
};
RX_RESEARCH_GUIDE.identifiability={question:'Which ring parameters can change with the same light masses and mixing, and which additional observables distinguish them?',
  metrics:r=>[['Light residual',r.summary.maxLightResidualEV,'eV'],['Heavy centre',r.selected?.massGeV,'GeV'],['Heavy splitting',r.selected?.splitEV,'eV'],['Max shape difference',r.selected?.maxShapeDifference,'']],
  takeaway:r=>r.reading};
rxAttach(PRED_SECTION,NI_PANEL);


const TH_PANEL={
  id:'thermal',title:'Finite-temperature GHU: Wilson potential and phase coexistence',external:true,
  intro:'Reproduce the two flat SU(3) benchmarks of Hirose–Shibuya, then change their matter content. This experiment uses its own thermal SU(3) inputs; the model selected in the SU(N) builder is separate.',
  defaults:thDefaults(),validate:thValidate,compute:thModel,visible:()=>PRED_S.variant==='builder',
  presets:[{label:'Thermal paper · case 1',values:thDefaults()},{label:'Thermal paper · case 2',values:{...thDefaults(),nfPlus:0,nfMinus:8,adjPlus:2,scalarPlus:4,scalarMinus:2,g4:1,RT:.0246}}],
  fields:[...['nfPlus','nfMinus','adjPlus','adjMinus','scalarPlus','scalarMinus'].map((key,i)=>({key,label:['Fund. fermions η+','Fund. fermions η−','Adjoint fermions η+','Adjoint fermions η−','Fund. scalars η+','Fund. scalars η−'][i],min:0,max:20,step:1})),
    {key:'invRGeV',label:'1/R [GeV]',min:100,max:1e6},{key:'g4',label:'Gauge coupling g₄',min:.3,max:6},{key:'RT',label:'Temperature R T',min:0,max:.6},
    {key:'windings',label:'Spatial winding cutoff',min:20,max:300,step:1},{key:'thermalTerms',label:'Thermal winding cutoff',min:20,max:400,step:1}],
  source:'Source: <a href="https://arxiv.org/abs/2303.14192" target="_blank" rel="noopener">Hirose–Shibuya, eqs. (2.30), (2.33), cases 1 and 2</a>. C₄ = 3/(64π⁶R⁴), α = g₄Rφ.',
  present(r){return `<p><b>T = ${rxNumber(r.temperatureGeV)} GeV; preferred α = ${rxNumber(r.minima[0]?.a)}.</b> ${r.critical?`Coexistence candidate: Tc = ${rxNumber(r.critical.temperatureGeV)} GeV (RTc = ${rxNumber(r.critical.RT)}), broken α = ${rxNumber(r.critical.aBroken)}.`:'No first-order coexistence candidate resolved in 0 ≤ RT ≤ 0.6 with these cutoffs.'}</p>`+
    rxPlot('Thermal Wilson potential and doubled-cutoff check',rxCompared('thermal',[{name:'Selected truncation',points:r.curve.map(s=>[s.a,s.potentialOverC])},{name:'Doubled cutoffs',points:r.curve.map(s=>[s.a,s.fineOverC])}],b=>b.curve.map(s=>[s.a,s.potentialOverC])),'α','[V(α,T) − V(0,T)] / C₄',r.parameters)+
    rxPlot('Thermal preferred Wilson phase',[{name:'Preferred minimum',points:r.phases.flow.filter(x=>x.minima.length).map(x=>[x.RT,x.minima[0].a])}],'R T','Preferred α',r.parameters)+
    rxTable(['Minimum α','Potential / C₄','Curvature / C₄','φ [GeV]'],r.minima.map(m=>[m.a,m.v,m.curvature,m.a*r.parameters.invRGeV/r.parameters.g4]))+
    `<p>Doubling both cutoffs changes the preferred α by ${rxNumber(r.convergence.minimumShift)} and the plotted potential by at most ${rxNumber(r.convergence.maxPotentialShiftOverC)} C₄.</p><p class="note">${rxEscape(r.convergence.comparison)}. ${rxEscape(r.scope)}. Nucleation and gravitational waves require the external bounce calculation and its hypotheses; they are not inferred from this plot.</p>`;},
  tex:r=>`Flat SU(3) thermal potential at RT=${r.parameters.RT}; coexistence RT=${r.critical?.RT?.toPrecision(6)||'not resolved'}. Canonical field alpha=g4 R phi. Nucleation and gravitational waves require an independent bounce calculation.`
};
rxAttach(PRED_SECTION,TH_PANEL);

const TH_HISTORY_PANEL={
  id:'thermalhistory',title:'Integrated nucleation, percolation and conditional gravitational waves',
  intro:'Follow bubble growth for the same SU(3) inputs as the thermal panel above. The two paper benchmarks include refined PhaseTracer actions. Wall speed and fluid efficiency remain explicit assumptions; these thermal benchmarks are not a joint fit of the SU(7) candidate.',
  defaults:thHistoryDefaults(),validate:thHistoryValidate,visible:()=>PRED_S.variant==='builder',
  compute:p=>thHistoryModel(rxExternal(TH_PANEL,RX_STATE.thermal),RX_STATE.thermal,p),
  fields:[{key:'gStar',label:'Relativistic degrees of freedom g*',min:10,max:500},
    {key:'wallSpeed',label:'Assumed wall speed / c',min:.05,max:1},
    {key:'efficiency',label:'Assumed fluid efficiency κ',min:0,max:1},
    {key:'vacuumBackground',label:'Expansion background',options:[[1,'Radiation + false-vacuum energy'],[0,'Radiation only']]}],
  source:'Sources: <a href="https://arxiv.org/abs/2305.02357" target="_blank" rel="noopener">Cosmological transition review</a>; <a href="https://arxiv.org/abs/2309.05474" target="_blank" rel="noopener">Acoustic spectrum, eqs. (28–30)</a>. Published CMS/ATLAS collider data do not measure these thermal or gravitational-wave quantities.',
  present(r){
    if(!r.history)return `<p><b>Refined action table pending.</b> ${rxEscape(r.scope)} Select a paper benchmark above, or import a matching refined result. The reproduction commands are in the repository's research-extensions documentation.</p>`;
    const h=r.history,s=r.spectrum,c=r.convergence,t=r.thermodynamics;
    return `<p><b>${r.status==='conditional-completion'?'Transition completion found under the displayed cosmological assumptions.':'Completion not established over the available action range.'}</b> Percolation means I = 0.34 (false fraction ≈ 0.712); completion means false fraction = 0.01. Both must reduce the physical false-vacuum volume.</p>`+
      rxPlot('False-vacuum fraction during cooling',rxCompared('thermalhistory',[{name:'False fraction',points:h.rows.map(x=>[x.T,x.falseFraction])}],b=>(b.history?.rows||[]).map(x=>[x.T,x.falseFraction])),'Temperature [GeV] · cooling to the left','False-vacuum fraction',r.parameters)+
      rxTable(['Event','Temperature [GeV]','S₃/T','d ln(a³P) / d ln a'],[['Integrated nucleation',h.nucleation],['Percolation',h.percolation],['Completion',h.completion]].map(([n,x])=>[n,x?.temperatureGeV,x?.S3overT,x?.physicalFalseVolumeSlope]))+
      `<p>Mean bubble separation at percolation: ${rxNumber(h.percolation?.separationGeVInverse)} GeV⁻¹. Trace-anomaly strength α = ${rxNumber(t?.traceStrength)}. Upper action-boundary Γ/H⁴ = ${rxNumber(h.upperBoundaryGammaOverH4)}.</p>`+
      (s?`<p><b>Conditional acoustic peak:</b> ${rxNumber(s.fPeakHz)} Hz; Ω<sub>GW</sub>h² = ${rxNumber(s.peakOmegaH2)}. Finite sound-lifetime factor = ${rxNumber(s.lifetimeSuppression)}.</p>`+
        (s.peakOmegaH2>0?rxPlot('Conditional acoustic gravitational-wave spectrum',[{name:'Acoustic contribution',points:s.points.map(x=>[Math.log10(x.frequencyHz),Math.log10(x.omegaH2)])}],'log₁₀ frequency [Hz]','log₁₀ ΩGW h²',r.parameters):'<p>Zero fluid efficiency gives zero acoustic signal.</p>')+`<p class="note">${rxEscape(s.scope)}</p>`:
        `<p><b>Acoustic spectrum not evaluated.</b> ${rxEscape(r.acousticDomain.reason)}</p>`)+
      `<details><summary>Numerical convergence and assumptions</summary>`+
      rxTable(['Comparison against primary result','Relative Tp shift','Relative separation shift'],[[`${c.primaryMultiplier/2}× potential cutoffs`,c.percolationCutoffRelativeShift,c.separationCutoffRelativeShift],['600 integration steps',c.percolationQuadratureRelativeShift,c.separationQuadratureRelativeShift],['Every second action knot',c.percolationSamplingRelativeShift,c.separationSamplingRelativeShift]])+
      `<p>Primary spatial / thermal cutoffs: ${c.primarySpatialCutoff} / ${c.primaryThermalCutoff}. Largest action change on doubling cutoffs: ${rxNumber(c.actionRelativeShift)}. ${rxEscape(c.note)}</p><p>${rxEscape(r.scope)}</p></details>`;
  },
  tex:r=>`Integrated thermal history: ${r.status}; percolation T=${r.history?.percolation?.temperatureGeV??'pending'} GeV. Wall speed and efficiency are supplied. No GHU joint fit or detector significance is assigned.`
};
RX_RESEARCH_GUIDE.thermalhistory={question:'Do nucleated bubbles percolate and complete the transition, under a specified expansion and wall speed?',
  metrics:r=>[['Integrated Tn',r.history?.nucleation?.temperatureGeV,'GeV'],['Percolation Tp',r.history?.percolation?.temperatureGeV,'GeV'],['Acoustic peak',r.spectrum?.fPeakHz,'Hz']],
  takeaway:r=>r.status==='conditional-completion'?'The integrated history meets both false-fraction thresholds with decreasing physical false-vacuum volume. The acoustic signal remains conditional on wall and fluid assumptions.':r.scope};
rxAttach(PRED_SECTION,TH_HISTORY_PANEL);

const RA_PANEL={id:'rsanomaly',title:'RS anomaly flow and baryon current',
 intro:'Normalized Z-tower wavefunctions determine the UV and IR anomaly factors. Change the Wilson angle, warp factor and complete quark/lepton generations to inspect gauge cancellation and the surviving baryon anomaly.',
 defaults:raValidate(),validate:raValidate,compute:raModel,
 fields:[{key:'theta',label:'Wilson θH [rad]',min:.02,max:3.12},{key:'logZL',label:'log₁₀ zL',min:6,max:15},{key:'sin2',label:'sin² θW⁰',min:.1,max:.4},
 {key:'mkkTeV',label:'mKK [TeV]',min:1,max:100},{key:'mode',label:'Z mode',options:[[0,'Z zero mode'],[1,'First excited Z'],[2,'Second excited Z']]},
 {key:'quarkGen',label:'Quark generations',min:0,max:3,step:1},{key:'leptonGen',label:'Lepton generations',min:0,max:3,step:1}],
 source:'Sources: <a href="https://arxiv.org/abs/2606.01829" target="_blank" rel="noopener">RS anomaly flow, June 2026</a> and <a href="https://arxiv.org/abs/2609.29135" target="_blank" rel="noopener">Baryon anomaly, September 2026</a>. Independent SciPy Bessel and quadrature checks included.',
 present(r){const ref=r.parameters.mode===0?r.kkReference.zero:r.kkReference.first;
 return `<p><b>Selected mass ${rxNumber(r.selected.massGeV)} GeV; F¹Z = ${rxNumber(r.selected.F1)}.</b> γγZ gauge factor = ${rxNumber(r.gaugeGammaGammaZ)}. ${r.groups.Q2T3===0?'Complete quark/lepton generations cancel these gauge anomaly factors.':'The selected incomplete matter content leaves a gauge anomaly.'}</p>`+
 rxPlot('Holographic anomaly flow',rxCompared('rsanomaly',[{name:'UV + IR',points:r.flow.map(s=>[s.theta,s.F1])},{name:'UV boundary',points:r.flow.map(s=>[s.theta,s.UV])},{name:'IR boundary',points:r.flow.map(s=>[s.theta,s.IR])}],b=>b.flow.map(s=>[s.theta,s.F1])),'θH [rad]','F¹Z',r.parameters)+
 rxTable(['Z mode','Mass [GeV]','UV factor','IR factor','Full factor'],r.modes.map(m=>[m.mode,m.massGeV,m.boundary.UV,m.boundary.IR,m.F1]))+
 `<p>Doubling the normalization quadrature changes F¹Z by ${rxNumber(r.integrationCheck.shift)}.</p><h3>Baryon-current neutral matrix F¹ZZ</h3>`+
 rxTable(['Mode','Z⁽⁰⁾','Z⁽¹⁾','Z⁽²⁾'],r.baryonNeutral.map((row,i)=>[i,...row]))+
 `<p>Normalized baryon boundary coefficient −Nf/(32π²) = ${rxNumber(r.baryon.normalizedBoundaryCoefficient)}. A nonzero baryon anomaly does not determine a proton lifetime or a baryogenesis yield.</p><details><summary>Published finite KK sums · fixed benchmark</summary><p>${rxEscape(r.kkReference.scope)}. Displaying ${r.parameters.mode===0?'zero':'first excited'} mode reference at θH = 0.1, mKK = 13 TeV.</p>`+
 rxTable(['KK cutoff',...r.kkReference.species],ref.rows)+`</details><p class="note">${rxEscape(r.scope)}. Not evaluated: ${r.unknown.map(rxEscape).join('; ')}.</p>`;},
 tex:r=>`RS mode ${r.parameters.mode}, F1=${r.selected.F1.toPrecision(7)}, gamma-gamma-Z gauge factor=${r.gaugeGammaGammaZ.toPrecision(7)}. Baryon anomaly is not a proton lifetime prediction.`};
rxAttach(ANOMALIES_SECTION,RA_PANEL);

const HT_PANEL={id:'higgstools',title:'Higgs rates, total width and experimental tests',external:true,
 intro:'Construct a complete CP-even Higgs scenario at 125.2 GeV. The gluon amplitude may include a GHU top-tower contribution; all remaining couplings and invisible width are explicit scenario assumptions. Compare production, branching fractions and matching HiggsTools results together.',
 defaults:htValidate(),validate:htValidate,compute:htModel,
 presets:[{label:'SM reference',values:htValidate()},{label:'GHU top tower · MKK = 1.5 TeV',values:{...htValidate(),kg:1-Math.PI**2/3*(173.34/1500)**2}}],
 fields:[{key:'kV',label:'κW = κZ',min:0,max:3},{key:'kF',label:'Common fermion κ',min:0,max:3},{key:'kg',label:'Effective κg',min:0,max:3},{key:'kGamma',label:'Effective κγ',min:0,max:3},{key:'kZGamma',label:'Effective κZγ',min:0,max:3},{key:'invWidthMeV',label:'Invisible width [MeV]',min:0,max:10}],
 source:'Sources: <a href="https://arxiv.org/abs/2608.05401" target="_blank" rel="noopener">HiggsTools for Run 3 (2026)</a>; official <a href="https://gitlab.com/higgsbounds/hbdataset" target="_blank" rel="noopener">HB</a> and <a href="https://gitlab.com/higgsbounds/hsdataset" target="_blank" rel="noopener">HS</a> datasets. The top-tower button uses Carson–Okada eq. (41), with the other couplings assumed SM-like.',
 present(r){return `<p><b>Total width = ${rxNumber(r.widthGeV*1000)} MeV; invisible branching fraction = ${rxNumber(r.branching.directInv)}.</b> All listed partial widths contribute to this total. Local rates use the pinned HiggsPredictions reference and its exact quadratic coupling dependence.</p>`+
 rxPlot('Dominant Higgs production cross sections',[...['ggH','vbfH','HW','Htt'].map(name=>({name,points:[[8,r.crossSectionsPb.LHC8[name]],[13,r.crossSectionsPb.LHC13[name]],[13.6,r.crossSectionsPb.LHC13p6[name]],[14,r.crossSectionsPb.LHC14[name]]]}))],'Collider √s [TeV]','Cross section [pb]',r.parameters)+
 rxTable(['Decay','Partial width [MeV]','Branching fraction','ggH signal strength'],Object.entries(r.branching).map(([d,b])=>[d,r.partialWidthsGeV[d]*1000,b,r.signalStrengths.find(s=>s.mode==='ggH'&&s.decay===d)?.mu??null]))+
 `<details><summary>All production modes at 8, 13, 13.6 and 14 TeV</summary>`+rxTable(['Mode','8 TeV [pb]','13 TeV [pb]','13.6 TeV [pb]','14 TeV [pb]'],Object.keys(r.crossSectionsPb.LHC13).map(m=>[m,...['LHC8','LHC13','LHC13p6','LHC14'].map(c=>r.crossSectionsPb[c][m])]))+`</details><p class="note">${rxEscape(r.scope)}</p>`;},
 tex:r=>`Explicit CP-even 125.2 GeV Higgs scenario. Total width ${r.widthGeV.toPrecision(7)} GeV. Experimental result ${r.externalResult?'from matching versioned HiggsTools calculation':'not evaluated for these inputs'}. Not a complete GHU-model exclusion.`};
rxAttach(COLLIDER_SECTION,HT_PANEL);
