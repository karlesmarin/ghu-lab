/* Evidence is shown only for matching archived inputs; all copy is in English. */
function cvBudgetHTML(record){
  const result=cvUncertaintyBudget(record,UNCERTAINTY_BUDGET);
  if(!result)return '<p>No uncertainty budget matches this certificate.</p>';
  const b=result.record,n=b.numerical,w=b.measuredW.higgsGeV;
  const bound=x=>mdOutwardInterval(['0',x],6);
  return `<section id="cvBudget" style="margin-top:18px"><h3>What limits the precision?</h3>
  <p class="note">The entries below describe different effects. They do not define a combined statistical error.</p>
  <div style="overflow-x:auto"><table><thead><tr><th>Source</th><th>Effect on mₕ (GeV)</th><th>Meaning</th></tr></thead><tbody>
  <tr><td>Moment approximation</td><td class="num">${mdOutwardInterval(b.momentApproximation.higgsGeV.absolute,4)}</td><td>Certified absolute bias relative to the full one-loop potential</td></tr>
  <tr><td>Root location</td><td class="num">${bound(n.rootLocationMassUpperGeV)}</td><td>Conservative numerical bound from the certified root interval</td></tr>
  <tr><td>Fourier remainder · N = ${n.fourierTerms}</td><td class="num">${bound(n.fourierTailMassUpperGeV)}</td><td>Analytic tail bound at the interval midpoint</td></tr>
  <tr><td>Measured W input · propagated 1σ</td><td class="num">${mdOutwardInterval(w.propagatedOneSigma,5)}</td><td>Magnitude of the ± response to the pinned W-mass uncertainty</td></tr>
  <tr><td>Chosen g₄ ±10% scenario</td><td class="num">${mdOutwardInterval(b.couplingScenario.massHalfSpanGeV,3)}</td><td>Half-span of a model variation; no probability assigned</td></tr>
  <tr><td>Physical theory uncertainty</td><td>Not quantified</td><td>Pole-mass matching, higher loops and model completion remain open</td></tr>
  </tbody></table></div>
  <p class="note">Changing the W input from 80.4 to 80.3692 GeV shifts the central prediction by ${mdOutwardInterval(w.centralShift,5)} GeV. This update is separate from the propagated uncertainty. The resulting full-potential mass at the measured central input lies in ${mdOutwardInterval(w.atMeasuredCentral,4)} GeV.</p>
  <details><summary>How to read and reproduce this budget</summary><p class="note">The root and Fourier entries bound the difference from the exact finite-sum curvature mass at the certified root interval’s midpoint. Their sum is a worst-case numerical bound, ${bound(n.rootPlusTailMassUpperGeV)} GeV. The full mass enclosure already includes both effects and Arb rounding; its half-width must not be added again. These bounds are conservative and need not be saturated.</p>
  <p class="note">At fixed potential geometry, mₕ ∝ g₄mW and 1/R₅ ∝ mW. The phase is unchanged by these rescalings. The JSON includes the corresponding compactification-scale budget. W input: <a href="${result.measuredW.url}" target="_blank" rel="noopener">PDG 2025</a>. Printed and 3+1 gauge prescriptions remain separate hypotheses.</p>
  <p class="note"><b>No total physical uncertainty or exclusion significance is available.</b> Missing corrections have not been assigned zero. Save the error certificate above to retain this budget and its sources.</p></details></section>`;
}

function cvThermalHTML(result){
  const cv=result.crossValidation;
  if(!cv)return '<section id="cvThermal" data-matched="false"><h3>PhaseTracer / CosmoTransitions comparison</h3><p class="note">No archived solver comparison matches all current thermal inputs. Load either thermal paper case to inspect its evidence.</p></section>';
  const r=cv.record,d=r.diagnostics,last=r.crossings.at(-1);
  return `<section id="cvThermal" data-matched="true" style="margin-top:18px"><h3>PhaseTracer / CosmoTransitions · case ${r.case}</h3>
  <p><b>${r.withinDeclaredTargets?'Within the declared comparison targets.':'At least one numerical target needs further refinement.'}</b> Both programs use the same truncated potential and canonical field. Their shooting algorithms share ancestry; this is a comparison of implementations, not an interval certificate.</p>
  ${rxPlot('Difference between matched bounce calculations',[{name:'CT / PT − 1',points:r.samples.map(s=>[s.RT,100*s.relativeDifference])}],'R T','Action difference (%)',cv.normalization)}
  ${rxTable(['Spatial / thermal cutoffs','PT T₁₄₀ (GeV)','CT T₁₄₀ (GeV)','Difference (%)'],r.crossings.map(c=>[c.windings+' / '+c.thermalTerms,c.phaseTracer.temperatureGeV,c.cosmoTransitions.temperatureGeV,100*c.relativeDifference]))}
  <p class="note">T₁₄₀ solves S₃/T = 140. It is a proxy, separate from the integrated nucleation and percolation temperatures below. The older result above used looser shooting tolerance. This comparison uses tolerance ${cv.tolerances.at(-1)}; at ${last.windings}/${last.thermalTerms}, the matched proxy is approximately ${rxNumber(last.cosmoTransitions.temperatureGeV)} GeV.</p>
  <details><summary>Numerical diagnostics and physical assumptions</summary>
  ${rxTable(['Diagnostic','Observed','Declared target'],[
    ['Maximum relative action difference',d.maxActionRelative,cv.targets.actionRelative],
    ['Maximum relative T140 difference',d.maxCrossingRelative,cv.targets.crossingRelative],
    ['PhaseTracer tolerance shift',d.maxPhaseToleranceShift,cv.targets.toleranceShiftRelative],
    ['CosmoTransitions tolerance shift',d.maxCosmoToleranceShift,cv.targets.toleranceShiftRelative],
    ['O(3) virial residual |K + 3U| / K',d.maxVirialRelative,cv.targets.virialRelative],
    ['CT profile sampling: 2000 → 4000',Math.abs(d.profileSampling.relative2000to4000),'diagnostic only']])}
  <p class="note">K and U are the integrated kinetic and potential parts of the O(3) action. Targets are numerical acceptance criteria, not confidence levels. Cutoff changes and tolerance changes are separate diagnostics. A small difference between programs does not bound a shared numerical or physical error.</p>
  <p class="note">Not quantified: ${cv.physicalUnknowns.map(rxEscape).join('; ')}. These SU(3) thermal examples are separate from the SU(7) mass certificates.</p>
  <p class="note">CosmoTransitions: <a href="https://arxiv.org/abs/1109.4189" target="_blank" rel="noopener">Carroll L. Wainwright</a>; PhaseTracer2: <a href="https://arxiv.org/abs/2412.04881" target="_blank" rel="noopener">Athron et al.</a>; thermal potential: <a href="https://arxiv.org/abs/2303.14192" target="_blank" rel="noopener">Hirose–Shibuya</a>. The experiment JSON includes both solvers, tolerances, checksums and references.</p></details></section>`;
}
