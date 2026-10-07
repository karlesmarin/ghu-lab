/* A view mounted by the existing Simulator, not another rail section. */
const NR_S = { fGeV:1000,t:1,q:.3,r:.4,mDGeV:2,muAkeV:500,muBkeV:500,calibrate:true };
const NR_CMP = {flavour:'electron',kind:'dirac'};
const NR_CONTROLS = [
  ['fGeV','Scale f [GeV]',500,5000,50],['t','Link t / f',.4,1.2,.01],
  ['q','N portal / f',.1,.4,.005],['r','S portal / f',.2,.5,.005],
  ['mDGeV','Active Dirac entry [GeV]',0,20,.01],
  ['muAkeV','Majorana μA [keV]',0,100000,10],['muBkeV','Majorana μB [keV]',0,5000,25],
];

function neutrinoPanelHTML() {
  return `<div class="card" style="margin-bottom:18px">
    <p class="lead"><b>Which heavy masses remain undetermined by light neutrino data?</b>
    Change the links and the two allowed Majorana terms in a four-dimensional U(1)⁵ ring.
    The mass matrix supplies the light response and six heavy pairs together.</p>
    <p class="note">Research model with one active flavour combination. Tree level, first order in μA and μB;
    exact mixing in the lepton-number conserving matrix. The phase is held at θ = π.
    This model has its own inputs and is independent of the SU(N) builder.</p>
  </div>
  <div class="grid two">
    <div class="card"><h2>Change the model</h2>
      <label style="display:block;margin-bottom:14px"><input type="checkbox" id="nrCalibrate">
      Hold mν = 0.1 eV and active deficit = 10⁻⁴ by calibration</label>
      ${NR_CONTROLS.map(([k,label,lo,hi,step])=>`<div style="margin:11px 0"><label for="nr_${k}" style="display:block">${label}</label>
        <div style="display:flex;gap:9px;align-items:center"><input id="nr_${k}" type="range" min="${lo}" max="${hi}" step="${step}" style="flex:1;min-width:0">
        <input id="nrn_${k}" aria-label="${label}" type="number" min="${lo}" max="${hi}" step="any" style="width:105px;max-width:35%"></div></div>`).join('')}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="ghost" id="nrReset">reset model</button>
        <button class="ghost" id="nrNoB">μB = 0</button><button class="ghost" id="nrHighB">μB = 5000 keV</button></div>
      <p id="nrInputNote" class="note" role="status" aria-live="polite"></p>
      <p id="nrCalibrationNote" class="note"></p>
    </div>
    <div>
      <div class="card"><h2>Results together</h2>
        <div class="stat"><div class="k">Light neutrino mass</div><div class="v" id="nrLight">—</div></div>
        <div class="pair" style="margin-top:12px"><div class="stat"><div class="k">Active-current deficit</div><div class="v" id="nrDeficit">—</div></div>
          <div class="stat"><div class="k">First heavy-pair split</div><div class="v" id="nrSplit">—</div></div></div>
        <p id="nrCentre" class="note"></p>
        <div style="margin-top:15px;padding-top:12px;border-top:1px solid var(--line)"><b id="nrSummaryTitle"></b>
          <p id="nrSummary" aria-live="polite"></p><p class="note" id="nrLimit"></p></div>
      </div>
      <div class="card" style="margin-top:18px"><h2>Sweep the independent Majorana term</h2>
        <canvas id="nrSweep" aria-label="First heavy-pair splitting versus muB; click to select muB" style="width:100%;display:block;cursor:crosshair" tabindex="0"></canvas>
        <p class="note" id="nrSweepNote"></p>
        <p class="note">Click the graph to select μB. The range and number controls give the same selection; all results update together.</p>
      </div>
    </div>
  </div>
  <div class="grid two" style="margin-top:18px">
    <div class="card"><h2>What splits each heavy pair</h2>
      <canvas id="nrWeights" aria-label="Contributions of muA and muB to six heavy-pair splittings" style="width:100%;display:block"></canvas>
      <p class="note"><span style="color:#277987">■ μA contribution</span> · <span style="color:#b35b38">■ μB contribution</span>.
      Each bar is a mass splitting in eV, not the mass of the pair.</p>
    </div>
    <div class="card"><h2>Masses, residues and kinetic normalization</h2>
      <div style="overflow-x:auto"><table><thead><tr><th>pair</th><th class="num">centre [GeV]</th><th class="num">split [eV]</th><th class="num">active weight</th></tr></thead><tbody id="nrPairs"></tbody></table></div>
      <p id="nrKinetics" class="note"></p>
      <p id="nrEffective" class="note"></p><p id="nrPrecision" class="note"></p>
      <p class="note">The Schur coefficient at zero momentum is not a pole mass. Heavy centres use the singular values of the full conserving matrix.</p>
    </div>
  </div>
  ${neutrinoDecayHTML()}
  <div class="card" style="margin-top:18px"><h2>Compare with published CMS HNL limits</h2>
    <p>CMS-EXO-22-011 · 13 TeV · 138 fb⁻¹ · limits at 95% CL. Six official HEPData tables, version 2.
    Assign all active mixing to one flavour to inspect a <b>single-HNL reference hypothesis</b>.</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <label>Flavour <select id="nrFlavour"><option value="electron">electron</option><option value="muon">muon</option><option value="tau">tau</option></select></label>
      <label>Reference <select id="nrKind"><option value="dirac">Dirac · pair-summed mixing</option><option value="majorana">Majorana · mixing per component</option></select></label>
    </div>
    <canvas id="nrLimitsPlot" aria-label="CMS observed and expected mixing limits with expected bands and model reference points" style="display:block;width:100%;margin-top:16px"></canvas>
    <p class="note">Solid: observed; dashed: expected; green/yellow: 68%/95% expected-limit bands. Numbered dots: heavy pairs (one component per pair for the Majorana reference). Zero-weight and out-of-range states remain in the table.</p>
    <div style="overflow-x:auto"><table><thead><tr><th>pair</th><th class="num">mass [GeV]</th><th class="num">reference |V|²</th><th class="num">observed limit</th><th class="num">expected limit</th><th class="num">ratio to observed</th><th>evaluation</th></tr></thead><tbody id="nrLimitsRows"></tbody></table></div>
    <p id="nrExperimentalSummary" aria-live="polite"></p>
    <p class="note"><b>Model exclusion: not evaluated.</b> The decay card above adds conditional two-body widths, lifetimes and coherent-pair diagnostics. Full widths and branching fractions including new channels, the flavour vector, detector acceptance and interference still require matching. The two reference choices do not determine how the ring behaves in the detector.</p>
    <p class="note" id="nrDatasetSource"></p>
  </div>
  <div class="card" style="margin-top:18px"><details><summary><b>Inspect the matrix of this experiment</b></summary>
    <p class="note">Conserving Dirac block D/f: rows (ν,S,a₀,…,a₄), columns (N,b₀,…,b₄). The full symmetric Weyl matrix is [μplus,D; Dᵀ,μminus]. The two diagonal Majorana entries and all matrix elements travel in the result card.</p>
    <div style="overflow-x:auto"><table><thead><tr><th></th><th>N</th><th>b₀</th><th>b₁</th><th>b₂</th><th>b₃</th><th>b₄</th></tr></thead><tbody id="nrMatrix"></tbody></table></div>
    <p id="nrMatrixMajorana" class="note"></p>
  </details></div>
  <div class="card" style="margin-top:18px"><details><summary><b>Action, approximation and open quantities</b></summary>
    <p>Five vectorlike pairs aⱼ,bⱼ and five scalar links form the ring. A neutral pair N,S couples to node 0 through χ;
    a scalar Σ at node 2 allows both Σ†a₂a₂ and Σb₂b₂. The active combination couples through (LH)N.</p>
    <p>The displayed slice chooses M = 2f, MNS = 0.25f, vanishing reverse links and χ and Σ vacuum values f/√2 (their radial normalization scales are f).
    Both Majorana Yukawas are allowed. The link geometry therefore does not fix their ratio.</p>
    <p>The collective phase remains protected against a renormalizable scalar potential. A physical Majoron accompanies
    the assumed spontaneous global-symmetry breaking. Its phenomenology, radial stability, electroweak loop masses,
    three-flavour mixing and the allowed dimension-five phase operator are not calculated by these controls.</p>
    <p>The formulas and six reference points are in <code>docs/neutrino-ring.md</code> and
    <code>data/neutrino_ring_reference.json</code>. The references use the complete 13-Weyl matrix at 65 digits.
    The calibration targets are chosen examples, not experimental determinations.</p>
    <p>Background: <a href="https://arxiv.org/abs/1401.1507" target="_blank" rel="noopener">inverse seesaw</a>;
    <a href="https://arxiv.org/abs/1209.4051" target="_blank" rel="noopener">radiative sensitivity to the second Majorana term</a>;
    <a href="https://arxiv.org/abs/hep-ph/0105239" target="_blank" rel="noopener">collective gauge phases</a>.</p>
  </details></div>`;
}

function neutrinoPanelMount(ctx,state) {
  const $=id=>document.getElementById(id);let result=null;
  const decay=neutrinoDecayMount(ctx);
  function commit(key,value) {
    const candidate={...state,[key]:value};
    try{nrValidate(candidate);Object.assign(state,candidate);$('nrInputNote').textContent='';ctx.refresh();}
    catch(e){$('nrInputNote').textContent=e.message+'. The last valid result is retained.';}
  }
  for(const [k] of NR_CONTROLS){$('nr_'+k).oninput=e=>commit(k,Number(e.target.value));
    $('nrn_'+k).onchange=e=>commit(k,e.target.value.trim()===''?NaN:Number(e.target.value));}
  $('nrCalibrate').onchange=e=>{
    if(!e.target.checked&&result)Object.assign(state,{mDGeV:result.used.mDGeV,muAkeV:result.used.muAkeV});
    state.calibrate=e.target.checked;ctx.refresh();
  };
  $('nrReset').onclick=()=>{Object.assign(state,nrDefaults());$('nrInputNote').textContent='';ctx.refresh();};
  $('nrNoB').onclick=()=>commit('muBkeV',0);$('nrHighB').onclick=()=>commit('muBkeV',5000);
  $('nrFlavour').onchange=e=>{NR_CMP.flavour=e.target.value;ctx.refresh();};
  $('nrKind').onchange=e=>{NR_CMP.kind=e.target.value;ctx.refresh();};
  $('nrSweep').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),W=r.width;
    commit('muBkeV',Math.round(5000*Math.max(0,Math.min(1,(e.clientX-r.left-54)/(W-76)))));};
  $('nrSweep').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();commit('muBkeV',Math.max(0,Math.min(5000,state.muBkeV+(e.key==='ArrowRight'?25:-25))));}};
  function canvas(id,height) {
    const c=$(id),d=window.devicePixelRatio||1,W=Math.max(1,c.getBoundingClientRect().width);
    c.width=W*d;c.height=height*d;c.style.width='100%';c.style.height=height+'px';
    const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,W,height);return {g,W,H:height};
  }
  function sweep() {
    const {g,W,H}=canvas('nrSweep',240),rows=nrScan(state),max=Math.max(1,rows.at(-1).splitEV*1.12);
    const X=x=>54+(W-76)*x/5000,Y=y=>H-36-(H-62)*y/max;
    g.font='11px sans-serif';g.fillStyle='#62717b';g.strokeStyle='#d8dfe3';
    for(let j=0;j<=4;j++){const value=max*j/4;g.beginPath();g.moveTo(54,Y(value));g.lineTo(W-22,Y(value));g.stroke();g.fillText(value.toFixed(0),4,Y(value)+4);}
    for(let j=0;j<=5;j++)g.fillText(String(j*1000),X(j*1000)-13,H-18);
    g.fillText('split [eV]',4,12);g.fillText('μB [keV]',Math.max(54,W/2-20),H-2);
    g.strokeStyle='#b35b38';g.lineWidth=2;g.beginPath();rows.forEach((r,i)=>i?g.lineTo(X(r.muBkeV),Y(r.splitEV)):g.moveTo(X(r.muBkeV),Y(r.splitEV)));g.stroke();
    g.fillStyle='#277987';g.beginPath();g.arc(X(state.muBkeV),Y(result.pairs[0].splitEV),5,0,2*Math.PI);g.fill();
    $('nrSweepNote').textContent=`Across this sweep: mν = ${result.lightEV.toPrecision(4)} eV; active deficit = ${result.deficit.toExponential(3)}. Both stay fixed at the displayed order. The dot is the selected point.`;
  }
  function weights() {
    const {g,W,H}=canvas('nrWeights',275),max=Math.max(1,...result.pairs.map(p=>p.splitEV))*1.10;
    const X=x=>40+(W-65)*x/max;g.font='11px sans-serif';
    result.pairs.forEach((p,i)=>{const y=24+i*35,a=result.used.muAkeV*1000*p.weightA;
      g.fillStyle='#62717b';g.fillText(String(i+1),10,y+13);g.fillStyle='#277987';g.fillRect(40,y,X(a)-40,19);
      g.fillStyle='#b35b38';g.fillRect(X(a),y,X(p.splitEV)-X(a),19);});
    g.fillStyle='#62717b';for(let i=0;i<=3;i++)g.fillText((max*i/3).toFixed(0),X(max*i/3)-10,H-22);
    g.fillText('pair',4,13);g.fillText('splitting [eV]',W/2-35,H-3);
  }
  function comparison() {
    const curve=nrLimitCurve(NR_CMP.flavour,NR_CMP.kind),c=nrCompare(result,NR_CMP.flavour,NR_CMP.kind);
    $('nrFlavour').value=NR_CMP.flavour;$('nrKind').value=NR_CMP.kind;
    const {g,W,H}=canvas('nrLimitsPlot',330),xlo=curve.rows[0].massGeV,xhi=curve.rows.at(-1).massGeV;
    const points=c.rows.filter(r=>r.massGeV>=xlo&&r.massGeV<=xhi&&r.referenceWeight>0);
    const ymin=Math.floor(Math.log10(Math.min(...curve.rows.map(r=>r.expected95lo),...points.map(r=>r.referenceWeight))/2));
    const ymax=Math.ceil(Math.log10(Math.max(...curve.rows.map(r=>r.expected95hi),...points.map(r=>r.referenceWeight))*1.2));
    const X=x=>57+(W-79)*Math.log(x/xlo)/Math.log(xhi/xlo),Y=y=>H-40-(H-65)*(Math.log10(y)-ymin)/(ymax-ymin);
    g.font='11px sans-serif';g.fillStyle='#62717b';g.strokeStyle='#d8dfe3';
    for(let p=ymin;p<=ymax;p+=Math.max(1,Math.ceil((ymax-ymin)/7))){g.beginPath();g.moveTo(57,Y(10**p));g.lineTo(W-22,Y(10**p));g.stroke();g.fillText('1e'+p,4,Y(10**p)+4);}
    for(const m of [10,30,100,300,1000,1500].filter(m=>m>=xlo&&m<=xhi))g.fillText(String(m),X(m)-12,H-23);
    for(const [low,high,color] of [['expected95lo','expected95hi','#efe1a1'],['expected68lo','expected68hi','#b8d5ae']]){
      g.fillStyle=color;g.beginPath();curve.rows.forEach((r,i)=>i?g.lineTo(X(r.massGeV),Y(r[low])):g.moveTo(X(r.massGeV),Y(r[low])));
      [...curve.rows].reverse().forEach(r=>g.lineTo(X(r.massGeV),Y(r[high])));g.closePath();g.fill();
    }
    for(const key of ['observed','expected']){g.strokeStyle='#334750';g.lineWidth=1.8;g.setLineDash(key==='expected'?[5,4]:[]);g.beginPath();curve.rows.forEach((r,i)=>i?g.lineTo(X(r.massGeV),Y(r[key])):g.moveTo(X(r.massGeV),Y(r[key])));g.stroke();}g.setLineDash([]);
    g.fillStyle='#b35b38';for(const p of points){g.beginPath();g.arc(X(p.massGeV),Y(p.referenceWeight),4,0,2*Math.PI);g.fill();g.fillText(String(p.pair),X(p.massGeV)+6,Y(p.referenceWeight)-5);}
    g.fillStyle='#62717b';g.fillText('|V|²',4,12);g.fillText('HNL mass [GeV]',W/2-43,H-3);
    const fmt=x=>Number.isFinite(x)?x.toExponential(3):'—';
    $('nrLimitsRows').innerHTML=c.rows.map(r=>`<tr><td>${r.pair}</td><td class="num">${r.massGeV.toFixed(2)}</td><td class="num">${fmt(r.referenceWeight)}</td><td class="num">${fmt(r.limit.observed)}</td><td class="num">${fmt(r.limit.expected)}</td><td class="num">${fmt(r.ratioObserved)}</td><td>${r.limit.status}</td></tr>`).join('');
    const first=c.rows[0],within=c.rows.filter(r=>r.ratioObserved!==null),above=within.filter(r=>r.ratioObserved>1);
    $('nrExperimentalSummary').textContent=`${within.length} of six pair centres have a reference limit in this table; ${above.length} reference points lie above its observed curve. `+
      (first.ratioObserved===null?'The first pair has no single limit at this mass.':`For pair 1, reference |V|² / observed limit = ${first.ratioObserved.toPrecision(4)}.`)+
      ' This is a conditional benchmark comparison, not an exclusion or validation of the ring.';
    $('nrDatasetSource').innerHTML=`Source: <a href="https://doi.org/${curve.doi}" target="_blank" rel="noopener">${curve.doi}</a> · <a href="${NR_HNL_LIMITS.publication}" target="_blank" rel="noopener">CMS analysis</a>. ${NR_HNL_LIMITS.interpolation} Retrieved ${NR_HNL_LIMITS.retrieved}.`;
  }
  return {render(){
    result=nrModel(state);$('nrCalibrate').checked=state.calibrate;
    for(const [k] of NR_CONTROLS){const locked=state.calibrate&&['mDGeV','muAkeV'].includes(k),value=locked?result.used[k]:state[k];
      $('nr_'+k).value=value;$('nrn_'+k).value=Number(value.toPrecision(8));$('nr_'+k).disabled=locked;$('nrn_'+k).disabled=locked;}
    $('nrCalibrationNote').textContent=state.calibrate?'The Dirac entry and μA are solved from the two chosen light inputs. Their controls are locked; μB remains independent.':'All displayed parameters are inputs. Move either Majorana term to compare its light and heavy responses.';
    $('nrLight').textContent=result.lightEV.toPrecision(5)+' eV';$('nrDeficit').textContent=result.deficit.toExponential(3);
    $('nrSplit').textContent=result.pairs[0].splitEV.toFixed(2)+' eV';$('nrCentre').textContent=`First heavy-pair centre: ${result.pairs[0].centerGeV.toFixed(3)} GeV.`;
    const summary=nrSummary(result);$('nrSummaryTitle').textContent=summary.heading;$('nrSummary').textContent=summary.text;$('nrLimit').textContent=summary.limit;
    $('nrPairs').innerHTML=result.pairs.map(p=>`<tr><td>${p.pair}</td><td class="num">${p.centerGeV.toFixed(3)}</td><td class="num">${p.splitEV.toFixed(2)}</td><td class="num">${p.activeWeight.toExponential(3)}</td></tr>`).join('');
    $('nrKinetics').textContent=`K_N = ${result.KN.toFixed(6)}; K_S = ${result.KS.toFixed(6)}. The zero-momentum NS coefficient is ${result.SchurNSGeV.toFixed(3)} GeV. Expansion ratio max(μ)/m₁ = ${result.expansionRatio.toExponential(2)}.`;
    $('nrEffective').textContent=`Induced zero-momentum entries: μN = ${result.muNEV.toPrecision(5)} eV; μS = ${result.muSEV.toPrecision(5)} eV. Sum of heavy active weights = ${result.activeWeightSum.toExponential(6)}; deficit = ${result.deficit.toExponential(6)}.`;
    $('nrPrecision').textContent=`Insertion / smallest heavy-centre gap = ${result.insertionToSmallestGap.toExponential(2)}. These scale ratios are diagnostics, not error bounds; six independent full-matrix reference points test the approximation.`;
    const labels=['ν','S','a₀','a₁','a₂','a₃','a₄'];
    $('nrMatrix').innerHTML=result.conservingDiracOverF.map((row,i)=>`<tr><th>${labels[i]}</th>${row.map(x=>`<td class="num">${x===0?'0':x.toPrecision(5)}</td>`).join('')}</tr>`).join('');
    $('nrMatrixMajorana').textContent=`μA/f at a₂a₂ = ${result.MajoranaOverF.plus.value.toExponential(6)}; μB/f at b₂b₂ = ${result.MajoranaOverF.minus.value.toExponential(6)}.`;
    sweep();weights();comparison();decay.render(result);return result;
  }};
}

function neutrinoPanelExport(state) {
  const r=nrModel(state),source='Tree level; first order in Majorana insertions; full conserving singular vectors. Independent 65-digit reference matrix.',
    v=(value,units)=>val(value,{status:STATUS.VERIFIED,units,source});
  const values={light_mass:v(r.lightEV,'eV'),active_deficit:v(r.deficit,'dimensionless'),
    heavy_pairs:v(r.pairs,'centres GeV; splits eV'),kinetic_N:v(r.KN,'dimensionless'),kinetic_S:v(r.KS,'dimensionless'),
    Schur_NS:v(r.SchurNSGeV,'GeV; zero momentum, not a pole'),
    summary:v(nrSummary(r),'interpretation of selected point'),
    model_sweep:v(nrSensitivity(state),'split eV; muB keV; model variation, not measurement uncertainty'),
    effective_Majorana:v({muN:r.muNEV,muS:r.muSEV},'eV; zero momentum'),
    mass_matrix:v({Dirac:r.conservingDiracOverF,Majorana:r.MajoranaOverF},'units of f; rows nu,S,a0..a4; columns N,b0..b4'),
    mixing_sum_rule:v({heavy_sum:r.activeWeightSum,active_deficit:r.deficit},'dimensionless; conserving limit'),
    approximation_diagnostics:v({insertion_over_mass:r.expansionRatio,insertion_over_gap:r.insertionToSmallestGap},'dimensionless; not error bounds'),
    experimental_comparison:v(nrCompare(r,NR_CMP.flavour,NR_CMP.kind),'conditional single-HNL reference; not model exclusion'),
    decay_scenario:val(ndModel(r,ND_S,NR_CMP.flavour),{status:STATUS.VERIFIED,source:'Conditional on-shell decay scenario; docs/neutrino-decays.md; Atre 0901.3589; Anamiati 1607.05641 eq. (31)',units:'partial widths eV, time s, flight mm; not the full ring width'}),
    decay_summary:val(ndSummary(ndModel(r,ND_S,NR_CMP.flavour)),{status:STATUS.VERIFIED,source:'Interpretation of the explicit conditional decay inputs'}),
    full_model_width:unknown('Majoron, other new channels, heavy cascades, off-shell channels and scalar mixing remain unresolved'),
    model_exclusion:unknown('Conditional decay diagnostics do not match full branching fractions, flavours, acceptance and interference to CMS'),
    three_flavour_fit:unknown('One active Yukawa vector; tree-level rank at most one'),
    full_vacuum:unknown('Radial stability and phase re-minimization not calculated'),
    electroweak_loop_mass:unknown('The second Majorana entry may affect the light mass radiatively')};
  return {card:makeCard({...nrRecord(r),experimental_reference:{...NR_CMP},decay_scenario:{...ND_S}},values,{version:VERSION,build:BUILD,kernelHash:KERNEL_HASH,
    certificates:{reference:'data/neutrino_ring_reference.json',derivation:'docs/neutrino-ring.md',
      scope:r.assumptions}}),mathKeys:[],sources:[],caption:'Four-dimensional neutrino ring at theta=pi. Light targets are calibration inputs; Majorana splittings are leading tree-level responses.'};
}
