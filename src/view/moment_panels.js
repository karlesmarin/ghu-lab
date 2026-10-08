/* English experiment cards backed by exact-coordinate checks and Arb artifacts. */
function momentErrorHTML(){return `
<div class="card" id="momentErrorCard" style="margin-top:18px">
  <h2>How accurate is the moment approximation?</h2>
  <p class="note">Certified comparison of the quartic-logarithmic minimum with the full Fourier minimum for ten reference configurations. The certificate is conditional on the specified one-loop potential, m<sub>W</sub> = 80.4 GeV and g₄ = 0.63.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label for="mdBenchmark">Load a certified benchmark</label><select id="mdBenchmark"><option value="">Choose a row and gauge</option></select><button class="ghost" id="mdSave">Save this error certificate (JSON)</button></div>
  <div id="mdStatus" class="note" style="margin-top:12px" aria-live="polite"></div>
  <div id="mdResults"></div>
  <details style="margin-top:12px"><summary>What the error bound proves</summary><p class="note">At the approximate stationary point, the full derivative has magnitude at most ε. If the full curvature is at least m &gt; 0 throughout the interval joining the two roots, the mean-value theorem gives |α<sub>full</sub> − α<sub>approx</sub>| ≤ ε/m. Root existence, positive curvature and the interval cover are checked with Arb. The mass and scale errors are propagated separately. A small curvature weakens this bound; failure to obtain a positive lower bound would leave the comparison uncertified. Globality comes from the separate full-domain certificate.</p></details>
  <p class="note">Expansions: <a href="https://arxiv.org/abs/hep-ph/0411250" target="_blank" rel="noopener">Haba–Takenaga–Yamashita</a> and <a href="https://arxiv.org/abs/hep-th/0609067" target="_blank" rel="noopener">Sakamoto–Takenaga</a>. SU(7) moment application: Carles Marín, Part VII.</p>
</div>`;}

function momentErrorMount(ctx){
  const select=document.getElementById('mdBenchmark'),save=document.getElementById('mdSave');
  let current=null;
  select.innerHTML='<option value="">Choose a row and gauge</option>'+MOMENT_DIAGNOSTICS.benchmarks.map((r,i)=>`<option value="${i}">Row ${r.row} · ${r.seed==='published'?'printed gauge':'3+1 gauge'}</option>`).join('');
  select.onchange=()=>{
    if(select.value==='')return;
    const record=MOMENT_DIAGNOSTICS.benchmarks[Number(select.value)];
    ctx.setSeed(record.seed);ctx.load(record.bulk);
  };
  save.onclick=()=>{if(current)rxDownload('ghu-moment-error.json',JSON.stringify({schema:MOMENT_DIAGNOSTICS.schema,conventions:MOMENT_DIAGNOSTICS.conventions,record:current,inputs:MOMENT_DIAGNOSTICS.inputs,sources:MOMENT_DIAGNOSTICS.sources,scope:MOMENT_DIAGNOSTICS.scope,uncertaintyBudget:cvUncertaintyBudget(current,UNCERTAINTY_BUDGET),experimentalReferences:MD_HIGGS_REFERENCES,massComparisons:MD_HIGGS_REFERENCES.measurements.map(m=>mdHiggsComparison(current.full.higgsGeV,m))},null,2));};
  return {render(model,data){
    const found=mdFindCertificate(data,model,MOMENT_DIAGNOSTICS);current=found.record;
    save.disabled=!current;select.value=current?String(MOMENT_DIAGNOSTICS.benchmarks.indexOf(current)):'';
    const status=document.getElementById('mdStatus'),box=document.getElementById('mdResults');
    status.dataset.status=found.status;
    if(!current){
      status.textContent=found.status==='different-mass-inputs'?'No matching certificate: the current mass inputs differ from mW = 80.4 GeV and g4 = 0.63.':'No certificate for the current configuration. Choose one of the ten certified benchmarks above; an edited content does not inherit its certificate.';
      box.replaceChildren();return;
    }
    status.innerHTML='<span class="chip thm">interval certified</span> Two separately enclosed stationary points. The full-potential minimum is globally certified on [0,1].';
    const fields=[['alpha','α minimum',8],['higgsGeV','Higgs mass (GeV)',3],['compactificationGeV','1/R₅ (GeV)',3]];
    box.innerHTML='<div style="overflow-x:auto;margin-top:12px"><table><thead><tr><th>quantity</th><th>approximation</th><th>full Fourier</th><th>absolute error</th><th>relative error (%)</th></tr></thead><tbody>'+fields.map(([key,label,d])=>`<tr><td>${label}</td><td class="num">${mdOutwardInterval(current.approximate[key],d)}</td><td class="num">${mdOutwardInterval(current.full[key],d)}</td><td class="num">${mdOutwardInterval(current.errors[key].absolute,d)}</td><td class="num">${mdOutwardInterval(current.errors[key].relativePercent,4)}</td></tr>`).join('')+'</tbody></table></div>'+`<p class="note">The displayed intervals are rounded outward. Relative error means |approximate/full − 1| × 100. The independent derivative/curvature argument encloses |Δα| in ${mdOutwardInterval(['0',current.residualProof.absoluteAlphaErrorUpper],8)}. This bound concerns the local root displacement; the table also encloses the error in each observable directly.</p>`+cvBudgetHTML(current)+mdExperimentHTML(current);
  }};
}

function mdExperimentHTML(record){
  const rows=MD_HIGGS_REFERENCES.measurements.map(m=>{
    const c=mdHiggsComparison(record.full.higgsGeV,m);
    return `<tr data-relation="${c.relation}"><td><a href="${m.url}" target="_blank" rel="noopener">${m.collaboration} · ${m.channel}</a><br><small>${m.runs}</small></td><td class="num">${mdRational(m.central).toFixed(2)} ± ${mdRational(m.totalError).toFixed(2)}</td><td class="num">${mdOutwardInterval(c.difference,3)}</td><td>${c.relation==='overlap'?'overlaps':c.relation+' the'} reported band</td></tr>`;
  }).join('');
  return `<h3>Comparison with ATLAS and CMS</h3><p class="note">Full-potential mass at the fixed inputs above, compared separately with published total-error bands. References checked 8 October 2026; CMS diphoton includes the July 2026 submission.</p><div style="overflow-x:auto"><table id="mdExperiment"><thead><tr><th>measurement</th><th>mass ± total error (GeV)</th><th>model − central value (GeV)</th><th>interval position</th></tr></thead><tbody>${rows}</tbody></table></div><p class="note"><b>This is not a statistical exclusion.</b> Numerical certification does not include higher-loop or physical-model uncertainty. Identifying the curvature mass with the measured Higgs mass requires a physical matching calculation. The fixed gauge prescriptions are compared conditionally. These channels are not combined into a likelihood, and CERN is not counted as a third independent experiment.</p><details><summary>Datasets and routes to a fuller comparison</summary><p class="note"><a href="https://www.hepdata.net/record/ins2839209" target="_blank" rel="noopener">CMS Higgs mass and width tables</a>; <a href="https://www.hepdata.net/record/167852" target="_blank" rel="noopener">CMS 2026 dijet angular distributions, 138 fb⁻¹</a>. The dijet record links Combine and Rivet resources. A model reinterpretation still needs its signal prediction, selections and nuisance parameters. <a href="https://github.com/scikit-hep/pyhf" target="_blank" rel="noopener">pyhf</a> consumes HistFactory models; <a href="https://github.com/sabinekraml/Lilith-2" target="_blank" rel="noopener">Lilith</a> compares Higgs signal strengths. Neither can infer rates from D, A₄ and G alone. The repository certification report records the reviewed resources and their scope.</p></details>`;
}

function momentPairHTML(){return `
<div class="card" id="momentPairCard" style="margin-bottom:18px">
  <h2>What do the three moments miss?</h2>
  <p class="note">Compare the exact local coordinates behind D, A₄ and G, then inspect the full potential. Matching a local expansion does not determine the global vacuum.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="ghost" id="mmExample">Load equal-moment example</button><label for="mmScale">Plot range</label><select id="mmScale"><option value="full">Full phase interval</option><option value="local">Near the origin</option></select><button class="ghost" id="mmSave">Save this comparison (JSON)</button></div>
  <div id="mmStatus" class="note" style="margin-top:12px" aria-live="polite"></div>
  <div id="mmNumbers" style="overflow-x:auto;margin-top:12px"></div>
  <canvas id="mmPlot" width="900" height="300" style="margin-top:12px" aria-label="Potentials measured relative to their values at the origin"></canvas>
  <div class="legend"><span><i style="background:var(--blue)"></i>F<sub>A</sub>(α) − F<sub>A</sub>(0)</span><span><i style="background:var(--rust)"></i>F<sub>B</sub>(α) − F<sub>B</sub>(0)</span><span><i style="background:var(--green)"></i>local expansion A</span><span><i style="background:var(--amber)"></i>local expansion B</span></div>
  <div id="mmProof" class="note" style="margin-top:12px"></div>
  <p class="note">Curves use 768 Fourier terms and illustrate the comparison; the exact coordinate verdict and any interval certificate are separate. Expansions are shown only near the origin. The example is a one-loop mathematical comparison; perturbative and phenomenological viability are not assessed. Coordinate interpretation: Carles Marín, Part VII.</p>
</div>`;}

function momentPairMount(ctx){
  let current=null,model=null,bulk=null,curve=null;
  const select=document.getElementById('mmScale');
  document.getElementById('mmExample').onclick=()=>{
    const [a,b]=MOMENT_DIAGNOSTICS.momentWitness.contents;
    SAMEPOT_B=countsOf(b.bulk);ctx.setSeed('published');ctx.load(a.bulk);
  };
  const draw=()=>{
    if(!current)return;
    curve=mdPairCurve(current,select.value==='local');
    const canvas=document.getElementById('mmPlot'),ratio=window.devicePixelRatio||1;
    const width=canvas.clientWidth||720,height=300;
    canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.height=height+'px';
    const g=canvas.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);
    const css=getComputedStyle(document.documentElement),color=k=>css.getPropertyValue(k).trim();
    const lines=[[curve.a,color('--blue'),[]],[curve.b,color('--rust'),[7,4]]];
    if(curve.appA)lines.push([curve.appA,color('--green'),[2,3]],[curve.appB,color('--amber'),[9,4]]);
    const all=lines.flatMap(l=>l[0]);let lo=Math.min(...all),hi=Math.max(...all);
    const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;
    const left=58,right=14,top=16,bottom=40,w=width-left-right,h=height-top-bottom;
    const x=a=>left+a/curve.hi*w,y=v=>top+(hi-v)/(hi-lo)*h;
    g.fillStyle='#fff';g.fillRect(0,0,width,height);g.font='11px system-ui';
    for(let i=0;i<=4;i++){
      const yy=lo+(hi-lo)*i/4;g.strokeStyle='#e5edf2';g.beginPath();g.moveTo(left,y(yy));g.lineTo(width-right,y(yy));g.stroke();
      g.fillStyle=color('--ink3');g.textAlign='right';g.fillText(yy.toPrecision(3),left-7,y(yy)+4);
      g.textAlign='center';g.fillText((curve.hi*i/4).toFixed(3),x(curve.hi*i/4),height-22);
    }
    g.save();g.beginPath();g.rect(left,top,w,h);g.clip();
    for(const [values,col,dash] of lines){g.strokeStyle=col;g.lineWidth=2;g.setLineDash(dash);g.beginPath();values.forEach((v,i)=>i?g.lineTo(x(curve.xs[i]),y(v)):g.moveTo(x(curve.xs[i]),y(v)));g.stroke();}
    g.restore();g.setLineDash([]);g.fillStyle=color('--ink3');g.textAlign='center';g.fillText('α · Wilson-line phase',left+w/2,height-4);
  };
  select.onchange=draw;
  document.getElementById('mmSave').onclick=()=>{
    if(!current)return;
    rxDownload('ghu-equal-moment-comparison.json',JSON.stringify({schema:'ghu-moment-comparison-v1',modelA:model,bulkB:bulk,equalLocal:current.equalLocal,samePotential:current.samePotential,coordinatesA:current.coordsA,coordinatesB:current.coordsB,termsA:current.termsA,termsB:current.termsB,matchedWitnessA:current.witnessA,matchedWitnessB:current.witnessB,plotRange:select.value,curve,sources:MOMENT_DIAGNOSTICS.sources,scope:MOMENT_DIAGNOSTICS.momentWitness.scope},null,2));
  };
  return {render(nextModel,nextBulk){
    model=nextModel;bulk=nextBulk;current=mdCompareContents(ctx.DATA,model,bulk,MOMENT_DIAGNOSTICS);
    const status=document.getElementById('mmStatus');
    status.dataset.equalLocal=String(current.equalLocal);status.dataset.samePotential=String(current.samePotential);
    status.innerHTML=current.samePotential?'<b>Same local expansion and same full potential.</b> All five coordinates agree.':current.equalLocal?'<b>Exactly the same local expansion, different full potentials.</b> D, A₄ and G agree through exact equality of (2A₄, 8D, 2U, V); the endpoint coordinate differs.':'<b>The local expansions differ.</b> The integer coordinates underlying D, A₄ and G do not all match.';
    const a=current.momentsA,b=current.momentsB;
    const values=[['D',a.D,b.D],['A₄',a.A4,b.A4],['G (decimal display)',a.G.toFixed(8),b.G.toFixed(8)],['2W (exact)',current.coordsA.W2,current.coordsB.W2]];
    document.getElementById('mmNumbers').innerHTML='<table><thead><tr><th>quantity</th><th class="num">A</th><th class="num">B</th></tr></thead><tbody>'+values.map(([label,v,w])=>`<tr><td>${label}</td><td class="num">${v}</td><td class="num">${w}</td></tr>`).join('')+'</tbody></table>';
    const proof=document.getElementById('mmProof');proof.dataset.certifiedLowerCompetitor='false';
    const lower=[['A',current.witnessA],['B',current.witnessB]].find(([,r])=>r?.lowerEndpointCertified);
    if(lower){
      proof.dataset.certifiedLowerCompetitor='true';
      proof.innerHTML=`<b>Certified lower competitor for content ${lower[0]}.</b> Its local minimum is enclosed at α ∈ ${mdOutwardInterval(lower[1].localRoot,7)}. The energy difference F(1) − F(α<sub>local</sub>) lies in ${mdOutwardInterval(lower[1].endpointMinusLocalEnergy,5)}, strictly below zero. This local minimum is therefore not global. The certificate does not assert that α = 1 is the global minimum.`;
    }else proof.textContent='The coordinate comparison is exact. No archived lower-competitor certificate matches the currently selected potentials.';
    draw();
  }};
}
