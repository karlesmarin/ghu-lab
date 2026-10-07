# Neutrino ring in the existing Simulator

Open **Simulator → Model to calculate → Neutrino ring · 4D research model**.
Move the scale, link and portal strengths, or the two Majorana insertions. The light
mass, active-current deficit, six heavy pairs, plots and interpretation update together.
Click the sweep plot to choose a point. The usual card, LaTeX and permalink buttons
refer to the selected model. The SU(N) builder remains the default Simulator model.

Calibration solves the active Dirac entry and μA from **chosen** targets mν = 0.1 eV
and δ = 10⁻⁴. They are illustrative inputs, not predictions or experimental fits.
Turn calibration off to vary those entries independently.

## What is reused

There is no new rail section. `predict_section.js` hosts the selector;
`view/neutrino_panel.js` mounts the controls and plots. The pure calculation lives in
`modules/neutrino_ring.mjs`. Its sweep uses the existing `kernel/sensitivity.mjs`
with `kind: model`: the displayed range is a family of predictions, not a measurement
error. Existing model cards, statuses, exports and section-state serialization are reused.

The laboratory already has BLKT for brane kinetics, Gravity ↔ Gauge for equal masses
with different residues, and same-potential comparisons. The existing robustness module
also separates truncation, model changes and measurement errors. Its SU(7) mass
dictionary is not applied to this different action. No second generic sensitivity,
convergence or comparison tool has been added.

## Action and relation to GHU

This is a four-dimensional deconstructed gauge ring with a collective phase. It tests
a possible neutrino embedding of that mechanism; it is not a completed five-dimensional
GHU model or an identification of the phase with the observed Higgs.

For j = 0,…,4 modulo 5, left-handed Weyl fields aⱼ and bⱼ have U(1)⁵ charges +eⱼ
and −eⱼ, and scalar links Φⱼ carry eⱼ−eⱼ₊₁. Add neutral Weyl fields N,S,
χ of charge −e₀ and Σ of charge 2e₂. The global charge F is +1 for a,S, −1
for b,N, 0 for Φ,χ and +2 for Σ. On the SM fields choose F = L−B.
The relevant mass terms are

```text
aᵀ B b + MNS N S + κN χ N a₀ + κS χ† S b₀
  + λA Σ† a₂ a₂ / 2 + λB Σ b₂ b₂ / 2 + yᵢ (Lᵢ H) N + h.c.
```

Forward and reverse link Yukawas are allowed. The displayed slice sets reverse links
to zero, diagonal B entries to 2f, MNS = f/4, and scalar vacuum amplitudes to f/√2.
Scalar modulus portals and gauge kinetic mixing are allowed; radial stabilization
has not been solved. The new charged fermions are vectorlike.

With the global symmetry imposed, no scalar phase operator of dimension ≤4 is allowed.
The first collective one is ∏ⱼ Φⱼ at dimension five. There are two physical phases:
θ = Σⱼ φⱼ and β = argΣ + 2argχ + 2(φ₀+φ₁). The latter is a Majoron from the
spontaneously broken global symmetry. It is not removed by the gauge fields.

Both Majorana Yukawas are allowed. Any ordinary phase charge preserving a₂b₂ obeys
Q(Σb₂²)+Q(Σ†a₂²)=2Q(a₂b₂), so allowing one does not forbid the other.

## Calculation and units

All matrices below are in units of f. At the chosen CP background θ = π,
B has diagonal 2, forward entries −t/f and a positive wraparound entry t/f.
The 7×6 conserving Dirac matrix has rows (ν,S,a₀,…,a₄) and columns (N,b₀,…,b₄):
DνN=m, DSN=1/4, DSb₀=r, Da₀N=q, and the remaining a,b block is B.
Here m=mD/f; q and r are dimensionless portal mass entries. The full symmetric
13×13 Weyl matrix is `[μplus,D; Dᵀ,μminus]`, with μA at a₂a₂ and μB at b₂b₂.

Put I=B⁻¹ and E=1/4−qrI₀₀. Integrating out the ring at zero momentum gives

```text
KN = 1 + q² Σⱼ |Iⱼ₀|²             KS = 1 + r² Σⱼ |I₀ⱼ|²
μN = q² μB I₂₀²                  μS = r² μA I₀₂²
Z  = 1 + (m/E)² KS               δ  = (Z−1)/Z
mν/f = μA (rm I₀₂/E)² / Z        [first order in Majorana entries]
```

The zero-momentum coefficient Ef is not a pole mass. The six heavy centres are
the singular values sₖ of D times f. With Dvₖ=sₖuₖ, their first-order splittings are
f(μA |uₖ,a₂|² + μB |vₖ,b₂|²). This retains the full conserving mixing, rather than
applying a small-portal expansion. If μA=0 the active chiral zero survives μB
exactly at tree level; electroweak radiative corrections are not included.

The browser reports GeV for centres, eV for splittings and light masses, and keV
for the Majorana inputs. The reported expansion ratio max(μ)/m₁ is informative,
not a uniform error bound: small gaps between heavy pairs can also matter.

For f=1000 GeV, t/f=1, q=0.3 and r=0.4, calibration gives mD≈1.871957 GeV and
μA≈446.703125 keV. Moving μB from 0 to 5000 keV changes the first splitting from
1147.702904 to 2300.912670 eV while mν=0.1 eV and δ=10⁻⁴ stay fixed at the displayed
order. This demonstrates a remaining free parameter, not a unique NN prediction.

## Checks and limitations

`data/neutrino_ring_reference.json` stores six independent full-matrix calculations
with mpmath at 65 decimal digits, plus conserving singular-vector results.
`node _test_neutrino_ring.mjs` compares the JavaScript calculation with those references,
checks eigenvector residuals, limiting cases, the shared sweep and the model-card scope.
The build runs this harness alongside the existing ones.

At those six points, light masses and deficits meet a relative tolerance of 10⁻⁷;
heavy splittings meet 10⁻⁴. The underlying study also verifies quadratic improvement
on halving the insertions for a nearly degenerate heavy pair. These checks do not
establish a uniform approximation bound over the entire control domain.

One SM Yukawa vector gives the base ring light flavour rank at most one. The separate
[three-copy flavour card](neutrino-flavour.md) reconstructs chosen light masses and
mixing inputs; it is not a joint experimental fit. The decay controls now include
optional [leading Majoron light and heavy cascade widths](neutrino-majoron.md).
Electroweak loop masses, radial stability, dimension-five matching and minimization
of the full phase potential with nonzero μ remain open.
The controls hold θ=π. The separate research calculation of the fermion phase
potential uses the μA=μB=0 limit and finds local positive curvature there;
that result is not substituted for the full vacuum calculation.

## Experimental reference inside the same panel

The comparison uses all **190 rows of six official HEPData tables**, version 2,
from [CMS-EXO-22-011](https://cms-results.web.cern.ch/cms-results/public-results/publications/EXO-22-011/):
13 TeV, 138 fb⁻¹, three charged leptons, exclusive coupling to one SM generation,
and observed/expected 95% CL limits for single Dirac or Majorana HNLs.
The 68% and 95% bands describe expected limits, not errors on our prediction.

Choose electron, muon or tau and the reference hypothesis. The graph and six-state
table update with the model. For a Dirac reference the plotted coupling is the
pair-summed active weight |uₖ,ν|². For a single Majorana reference it is half this
weight per component, at leading order. All mixing is assigned to the selected flavour
as an explicit benchmark assumption. The sum of pair weights equals the active
deficit in the conserving limit; the panel and tests check this identity.

Between distinct published mass points the tool interpolates log(limit) linearly
in mass. It does not extrapolate. The tables contain duplicate mass knots at
selection transitions: both are retained, and exactly at such a knot no unique
limit or ratio is assigned. The curve draws the transition. Every comparison
carries its bracketing masses, table DOI, source SHA-256 and retrieval date.

| Table | DOI |
|---|---|
| Majorana, electron | [t1](https://doi.org/10.17182/hepdata.146676.v2/t1) |
| Majorana, muon | [t2](https://doi.org/10.17182/hepdata.146676.v2/t2) |
| Majorana, tau | [t3](https://doi.org/10.17182/hepdata.146676.v2/t3) |
| Dirac, electron | [t4](https://doi.org/10.17182/hepdata.146676.v2/t4) |
| Dirac, muon | [t5](https://doi.org/10.17182/hepdata.146676.v2/t5) |
| Dirac, tau | [t6](https://doi.org/10.17182/hepdata.146676.v2/t6) |

The ratio to a published bound is a **conditional reference comparison**. It does
not give an exclusion or validation of the ring. Its flavour vector, widths,
branching fractions including new scalar/gauge channels, lifetime, detector
acceptance and interference between nearly degenerate states are not matched.
The two menu choices do not decide whether the detector sees this ring as a
single Dirac or Majorana HNL. No likelihood, p-value or combined exclusion is
constructed by overlaying multiple points.

ATLAS's [2025 displaced-HNL search](https://arxiv.org/abs/2503.16213) is useful for
a lower-mass extension, rather than an interchangeable limit on the present
benchmark. The existing Collider section already contains a CMS dijet comparison
for its GHU projection. Those are different observables and hypotheses.

The data are stored locally in `data/neutrino_hnl_limits.json`, with CC0 license
metadata and source hashes. The comparison therefore works offline. A dedicated
`node build/neutrino.mjs` gate tests controls, plots, references, permalink and
real exports; it also runs with `python build/build_app.py --browser`.

Background: [Arkani-Hamed, Cohen and Georgi, hep-ph/0105239](https://arxiv.org/abs/hep-ph/0105239)
for collective gauge phases; [Abada and Lucente, 1401.1507](https://arxiv.org/abs/1401.1507)
for inverse-seesaw realizations; [Dev and Pilaftsis, 1209.4051](https://arxiv.org/abs/1209.4051)
for radiative sensitivity to a right-handed Majorana term. The ring action and numerical
slice above are the construction tested here, not a claim taken from those papers.
