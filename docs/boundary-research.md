# Boundary research tools · 1.0.0 · 12 October 2026

These four tools turn intermediate GHU research questions into reproducible calculations.
They belong to **Anomalies → Boundary research** in GHU Lab 0.2.1. They work offline.
The English and Spanish task guides, manual and general video all cover the same examples.
The scientific goals remain three chiral Standard Model families, a gauge Higgs,
viable neutrinos, no unwanted light exotics and a consistent local quantum action.
These diagnostics address parts of that programme; they do not establish the full model.

## What to use, and when

| Question | Tool | Input | What the result establishes |
|---|---|---|---|
| Does the boundary interaction lift a paired zero mode? | Flat Robin spectrum | a = κ²L ≥ 0, imposed θ | Normal roots and conditional masses under the stated action |
| Do overlapping candidate profiles span independent directions? | Complex Gram matrix | M and profile angles | Numerical linear independence at an explicit threshold |
| Can an orbifold parity expose a localized anomaly term? | Inserted spinor moments | Rank, insertion mask, degree, Cartan probe, half-spin chirality | Exact scalar trace values before local normalization |
| Do identical 6D families satisfy the restricted tensor condition? | Signed doublet residue | Family count and 6D lepton chirality | A necessary modular condition in a specified standalone setting |

Do not combine the four outputs into a single “model passed” flag. Each uses a different
set of premises. In particular, the profile mass is not a mass added to the Spin(20) action.

## A five-minute experiment

Select **English** or **Español** beside the card title. The choice applies to controls,
results, plot labels, errors and the demo; it preserves the current calculation and comparison.
Links with `lang=es` open the Spanish card and demo. JSON keys and scientific metadata keep
their stable schema; SVG titles and labels follow the selected display language.

1. Open Anomalies, find the card and press **Research baseline**.
2. Set **Boundary strength κ²L** to 0, then 1. The first normal kR goes from 0 to
   0.2738526868. The mass curve also contains the Wilson shift, so it need not equal kR.
3. Select **2D**. Drag the white point and release: coupling and Wilson angle update together.
   The preview gives the recomputed mass. Arrow keys provide an alternative to dragging.
   Edit the numbers to select an exact point.
4. Select **3D**. The same data become a height surface. **3D perspective** changes the
   camera only. Clicking the surface selects a nearest mesh node; use the numeric inputs
   or the 2D map for continuous selection.
5. Set **Profile example M** to 0. Rank is 2, even though three profiles were supplied.
   Set M to 1: eigenvalues are approximately 0.1729986743, 2.7834235075, 10.6863547328,
   and numerical rank is 3. Nonorthogonality and dependence are different questions.
6. Switch **Spin(20) parity insertion** between C1, C0 and C0 W. Open numerical details
   below the trace explanation. A nonzero probe proves the polynomial is not identically
   zero. A zero probe does not prove it is zero everywhere.
7. With **Opposite to Q**, one 6D family has complex-doublet excess 2 and residue 2 modulo 6;
   three have excess 6 and residue 0. Six also pass. This is not a selection of exactly three.
8. Save JSON, an SVG figure and the application link. JSON includes parameters, version,
   sampled grid, numerical results, exact rational moments, sources, scope and open questions.
   **Use this point as comparison** preserves a previous result and overlays its paired curve.

## Reading the figures

The map's horizontal axis is a = κ²L and its vertical axis is θ in radians. The colour
is the lightest paired mR, on a **fixed linear scale from 0 to √(1/2)**. The same variable
is the height in 3D. The displayed coupling range is 0 to max(4, a); it expands for inputs
above 4. The white point is the selected calculation; the red slice fixes a and corresponds
to the paired curve in the spectrum plot below. The plot is a mass landscape, not a
potential, a vacuum search or measured data.

The surface uses a 25 × 25 grid of independently solved roots, with coloured planar cells
for display. A click in 3D snaps to a grid node. The 2D selection recomputes the equation
at the selected continuous coordinates; it does not interpolate the cell colour to obtain
the numerical result. The grid and display parameters are included in JSON and SVG metadata.

Gram bars use a separate labelled linear scale that adapts to the largest eigenvalue.
Always compare their printed values between different M values. A zero eigenvalue can
appear as a tiny negative number from floating-point roundoff; rank uses the shown threshold.
The exact trace table is retained as a table because sign, degree and fractions matter more
than an apparent trend. Neither a positive bar nor a vanishing trace is a full anomaly verdict.

## Equations and assumptions

### Flat boundary spectrum

For the stated uniform boundary mixing, let x = kL and a = κ²L. The normal equation is
`x tan(x) = a`. On each interval `[jπ, (j + 1/2)π)` it has one root for positive a.
At a = 0 the roots are jπ, including zero. The implementation bisects the equivalent
pole-free function `x sin(x) - a cos(x)` and exports a scaled residual and final bracket.
For L = πR, kR = x/π. For the selected periodic transverse branch,
`m_unpaired R = θ/(2π)` and `m_paired R = hypot(kR, θ/(2π))`.

For weak coupling, the first normal root behaves as `kR ≈ sqrt(a)/π`. For strong coupling
it approaches 1/2 from below: this interaction cannot raise the lightest normal mode without
bound. Together with θ ≤ π, this explains the fixed colour upper limit √(1/2) in the figures.
The surface exposes both the initial sensitivity and the subsequent saturation.

This follows from the flat uniform boundary action of the ACTION study. It is not a result
claimed for the cited papers. It assumes a common tangent gauge connection, the specified
boundary orientations, no extra boundary kinetic terms and equal lengths L5 = L6 = πR.
The six normal roots are not the entire higher-dimensional Kaluza–Klein spectrum.
A supplied θ does not establish a dynamically selected Higgs vacuum or a physical mass scale.

### Complex Gram matrix

On a unit rectangle use the illustrative exponential spinor profiles
`f_α(y,z) = (1, exp(iα)) exp[M(y cos α + z sin α)]` at angles 0, π/2, π.
With `I(t) = expm1(t)/t` and `I(0) = 1`,
`G_ab = (1 + exp[i(b-a)]) I(M(cos a + cos b)) I(M(sin a + sin b))`.
The complex Hermitian matrix is realified as `[[Re G,-Im G],[Im G,Re G]]` and diagonalized
with the laboratory's existing Jacobi solver. Each eigenvalue occurs twice; the pair is
averaged. Rank counts eigenvalues above `tolerance × max(1, max |eigenvalue|)`, default 1e-10.
Non-Hermitian or significantly non-positive input matrices are rejected.

This is a finite profile example inspired by Fujimoto et al., section 3.2 and the discussion
around footnote 10. It is not a completeness theorem for an operator domain, a compactification
index or a physical family count. The full domain and boundary conditions must still be specified.

### Exact parity-inserted moments

For Spin(2r), enumerate half-spin weights `(s1,...,sr)/2`, with product si equal to the
chosen half-spin chirality. A bitmask selects the sign insertion `λ = product s_i` over
its set bits. Sum `λ (sum s_i x_i / 2)^d` exactly as an integer numerator over 2^d, then
reduce using the laboratory's rational arithmetic. In the UI r = 10, chirality is positive,
the representation has dimension 512 and x = (1,2,1,0,-1,1,0,1,-1,2).
C1 uses mask 3, C0 uses 31 and C0 W uses 991.

Integer probes are bounded to [-4,4], rank to [2,10] and degree to [0,4]; these bounds keep
integer arithmetic exact in JavaScript. The API rejects unsupported inputs. Six-dimensional
anomaly terms involve degree 4 and mixed degree 2; four-dimensional terms degree 3 and mixed
degree 1. These unweighted moments omit projector/cover factors, consistent descent, mirror
contributions and inflow. See Asaka–Buchmüller–Covi equations 41–43, 71–72 and appendix D.

### Restricted six-dimensional condition

With positive quark chirality, three colours and lepton sign s = ±1, identical 6D families
give signed complex-doublet excess `N = n_g (3+s)`. The displayed test is `N = 0 mod 6`,
equivalently a half-doublet coefficient `2N = 0 mod 12`. It permits multiples of three
under identical assignments. Mixed assignments can evade that family-count conclusion:
two different families can contribute 2 + 4 = 6. The API test includes this counterexample.

The modular coefficient is meaningful in the specified standalone 6D tensor setting;
factorization alone is insufficient without an integral charge lattice. An orbifold corner
coupled to bulk inflow cannot automatically be treated as that standalone theory. The global
gauge-group quotient, physical local coefficients and mirror parity anomaly remain unresolved.
See Dobrescu–Poppitz equations 3–4 and Lee–Tachikawa sections 2.6–2.7 and 3.3.

## Reuse from JavaScript

```js
import {brxModel, brxRobinRoots, brxProfileGram, brxGramSpectrum,
        brxTwistedMoment, brxSU2TensorCondition, brxLandscape}
  from './src/modules/boundary_research.mjs';
const result = brxModel({strength:1, theta:0.2});
console.log(result.roots[0].kR, result.values.fullAnomalyCancellation.status);
// approximately 0.2738526868, 'unknown'
console.log(brxProfileGram(0).rank); // 2
console.log(brxSU2TensorCondition(6).passes); // true within the stated scope
```

`brxRobinRoots(a,count=6)` accepts a in [0,100], count 1..32. `brxProfileGram(M,angles)`
accepts M in [0,2] and 1..12 angles in [-2π,2π]. `brxGramSpectrum(real,imag,tolerance)`
accepts matrices of size 1..32 and tolerance 1e-14..1e-3. `brxTwistedMoment(rank,mask,
degree,cartan,halfSpin=1)` returns a reduced rational `{n,d}`. `brxLandscape(maxStrength=4,
steps=24)` accepts 4..64 grid steps. `brxModel` collects the four diagnostics, grid, scopes
and sources. Invalid values throw; the UI explains input errors and keeps the last valid state.

## Mathematical companion and certificates

The animated mathematical film is available in
[English (16:37)](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index.html) and
[Castellano (16:53)](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index-es.html).
Each has 38 chapters, translated narration, visible captions, whiteboards and actual laboratory
captures. See [the video guide](mathematics-video.md) for topics, downloads, version information
and verification. The shared [ordinary proofs and executable certificates](../proof/boundary-research/README.md)
cover the displayed Gram example, ten Robin root brackets, the complete quadratic inserted trace
and the restricted family congruence. The 113 checks include exact finite computation and independent
numerical comparisons; they are not 113 formal theorems. The profile ansatz locator is Fujimoto et al.,
section 3.1.2, equations 3.32–3.43, footnote 10 and Appendix B.

## Reproduce and maintain

```text
python tools/boundary_research_reference.py
node _test_boundary_research.mjs
python tools/add_guide_boundary_research.py
python tools/video_guide/add_chapter_boundary_research.py
node tools/make_demo_scripts.mjs
python tools/laboratory_inventory.py
python build/build_app.py --browser
python build/guide_manual.py
```

The independent reference uses SciPy Brent roots, numerical quadrature, NumPy eigenvalues
and Python Fraction weight sums. Runtime calculations use the browser engine; SciPy is only
needed to regenerate the reference. Browser checks exercise real controls, graph selection,
permalinks, exports, responsive layouts and absence of runtime errors. See
[video production](video-guide-production.md) for full general-video capture, narration,
rendering, verification and revision preservation. Do not replace a frozen video directory.

Tool version 1.0.0 / result schema `ghu-boundary-research-v1`; integration release 0.2.1;
general video revision `2026-10-12-boundary-research`. Previous application editions and
the general video `2026-10-10-demos` remain available. No neutrino mass fit, Wilson vacuum,
realistic flavour construction or completed quantum anomaly cancellation is claimed.

## Primary literature

- [Fujimoto et al., 1609.01413](https://arxiv.org/abs/1609.01413): boundary domains and the profile ansatz.
- [Asaka, Buchmüller, Covi, hep-ph/0209144](https://arxiv.org/abs/hep-ph/0209144): localized orbifold anomalies and normalization.
- [Dobrescu, Poppitz, hep-ph/0102010](https://arxiv.org/abs/hep-ph/0102010): identical 6D chirality and generation constraints.
- [Lee, Tachikawa, 2012.11622](https://arxiv.org/abs/2012.11622): tensor quantization beyond polynomial factorization.


## 13 October 2026 supplement

The [quantization guide](https://karlesmarin.github.io/ghu-explorer/guide/quantization/index.html), [bilingual narrated supplement](https://karlesmarin.github.io/ghu-explorer/video/quantization/index.html), and [complete certificates](https://karlesmarin.github.io/ghu-explorer/proof/index.html) add universal versus spin-period quantization, the joint U(2) arithmetic test, the conditional parent obstruction, and the Spin(20) lift audit. The matrices Ua = −i ta square to +1 while ta² = −1; these matrices do not establish an ordinary equivariant Spin(20) bundle. The lift audit is exact computation, not a Lean proof. The four Lean files contain 49 theorem declarations and do not certify full physical consistency. Earlier films remain dated records and are complemented by the new eleven-chapter video.
