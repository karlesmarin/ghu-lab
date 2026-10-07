# 🔬 Research records — 7 October 2026

These files are reproducible batch studies using the laboratory's engines. They do not add a new
menu or combine the separate benchmark actions. Read the
[report, figures, selection rules and reproduction commands](../../docs/research-exploration-2026-10-07.md)
before quoting a result.

| File | What it contains | Units and scope |
|---|---|---|
| [higgs_degeneracy.json](higgs_degeneracy.json) | Pinned backend/dataset provenance; SM reference; fixed-coupling scan; common-κ profile; 2D grid; compensated line and selected HiggsBounds analysis per point | Widths in MeV; dimensionless κ, branching fractions, signal strength and χ². Explicit 125.2 GeV scalar scenario |
| [thermal_assumptions.json](thermal_assumptions.json) | 160 wall/efficiency/background scenarios; transition temperatures and conditional acoustic peaks | Temperatures in GeV, frequencies in Hz, dimensionless ΩGW h². Null peak fields mean the fit was not evaluated |
| [candidate_rung_search.json](candidate_rung_search.json) | Enumerated budgets, approximate-window hits grouped by all five potential coordinates, representative content and full-potential selection | Masses and inverse radii in GeV; k=D8. k=4 reaches the 5,000,000-content cap |
| [candidate_full_potential.json](candidate_full_potential.json) | All 80 selected representatives with independent 1,024/2,048-term checks, competing extrema, tail bounds and full mass-window verdict | GeV for mass and inverse radius; dimensionless Wilson phase and potential normalization as defined by the checker |
| [summary.json](summary.json) | Twelve consistency checks and compact tables used by the report | Records what was run; not a universal bound or a combined fit |
| [higgs_assumptions.png](higgs_assumptions.png) · [SVG](higgs_assumptions.svg) | Fixed versus profiled invisible width; selected HiggsBounds ratios on the compensated line | A χ² diagnostic and selected-limit ratios, not a confidence contour |
| [thermal_assumptions.png](thermal_assumptions.png) · [SVG](thermal_assumptions.svg) | Supported acoustic peaks for three displayed efficiencies and both backgrounds | The JSON includes all five efficiencies; curves are assumption scenarios |
| [candidate_vacua.png](candidate_vacua.png) · [SVG](candidate_vacua.svg) | Approximate and full-Fourier compactification scales for the selected representatives | Colour records the vacuum and full mass-window check |

The Higgs records evaluate published experimental datasets, including ATLAS and CMS, through
HiggsTools. The thermal and SU(7) records are model calculations. No raw detector events enter
these studies. The generator scripts live in `tools/`, and every command is listed in the report.

To check existing records and redraw the three figures:

```text
python tools/plot_exploration.py research/2026-10-07
```

To reproduce the numerical data, run the four study commands first. Figure files can contain
backend-dependent metadata; compare the numerical records and reported tolerances rather than
requiring byte-identical images from a different plotting installation.
