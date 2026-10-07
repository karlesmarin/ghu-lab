# Dynamic diagnostics in the existing laboratory

Hierarchy includes a robustness card for its current SU(7) content and gauge seed.
The Simulator includes **Higgs production · top KK reference** in its model selector.
Neither adds a navigation section. Inputs, computed results, scope and provenance
travel with JSON, text and LaTeX exports; copy-link preserves each diagnostic state.

## Hierarchy: three separate responses

The existing `robustness.mjs` calls the summed-potential minimizer and curvature.
It reuses the same vacuum for changes of g4 and mW, which do not enter the potential.
The diagnostic baseline uses the registered PDG W mass, 80.3692 ± 0.0133 GeV;
the other Hierarchy outputs retain their paper conventions. Central g4, its relative
span and the winding cutoff are adjustable. The four cutoffs are N/4, N/2, N, 2N.

The table reports actual minimum and maximum responses, with one input varied at
a time. Model ranges, propagated measured uncertainty and numerical spread are
not combined. The full winding spread must be at most 0.01 GeV for each quantity.
This is a finite convergence diagnostic, not a rigorous error bound. The minimizer
searches a finite grid on [0.0001, 1]; failure to resolve a positive-curvature
interior minimum disables the robustness verdict. Radion stability is not computed.

## Higgs: a specific GHU reference

The top-only benchmark in [Carson–Okada](https://arxiv.org/abs/1510.03092),
equations (33), (35), (41), Table 1, uses the spectrum n MKK ± mt and gives
Rgg = [1 − (π²/3)(mt/MKK)²]². The historical window [0.89, 1.19] and
mt = 173.34 GeV reproduce the reported lower scale of 1.32 TeV.

This model is separate from the SU(N) builder and neutrino ring. Its lower/upper
window can be changed as a user scenario, with no assigned confidence level.
The allowed interval is intersected with mt/MKK ≤ 0.2, a laboratory domain policy
that does not promise a physical accuracy. Outside it the current-point rate and
verdict are withheld. This interval is not a new exclusion or a current global fit.

For x = mt/MKK, the leading finite-tower amplitude is 1 − 2x² Σ(n=1..N) 1/n².
The integral test bounds its missing amplitude by 2x²/N. Since the amplitudes
remain positive in the chosen domain, the rate difference is bounded above by
2 A_N (2x²/N). This concerns numerical truncation only.

Independently resumming the determinant low-energy theorem gives
A_LET = 1 − Σ 2x²/(n²−x²) = πx cot(πx). The displayed difference between its
squared amplitude and the leading rate diagnoses the small-x expansion within
that theorem. It is not a full finite-mass loop calculation or total theory error.
Branching fractions and additional coloured particles are outside this panel.

Five independent 70-digit spectral sums are shipped in
`data/higgs_diagnostics_reference.json`. The source harness compares both rates
and the historical bound, verifies the numerical tail, domain handling and both
window edges. Browser checks exercise real controls, state, exports and layout.


## Visual responses and usability

User preference, recorded 6 October 2026: make the laboratory easier to use wherever
possible. Show data visually when this helps explain it, alongside the controls,
numerical results and a short interpretation. Reuse existing sections and modules.

The robustness card now presents three simultaneous figures: g4 (model variation),
mW (measured input), and winding cutoff (numerical convergence). Each overlays m_h
and 1/R5 as percentage changes relative to its own central value. Vertical scales
are independent and explicitly labelled; the three kinds of variation are not added.
All points come directly from the existing raw sensitivity scan, with no extra physics
engine or interpolation presented as a calculation. g4 and mW use three samples;
convergence uses the four actual cutoffs with a labelled log2 horizontal axis so that
successive doublings are evenly spaced. Zero span and unresolved minima are handled.

Hover or tap to inspect a point, or focus a chart and use arrows, Home or End.
The readout gives both absolute masses and relative changes. Each figure can be
downloaded as a standalone SVG with its model, settings, measured W source, units
and actual plotted values embedded in metadata. JSON/LaTeX exports remain available.
