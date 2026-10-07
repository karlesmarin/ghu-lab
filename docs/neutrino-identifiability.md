# 🔬 Fixed light inputs: what can distinguish the neutrino ring?

Open **Simulator → Neutrino ring · 4D research model → Fixed light inputs: what can
distinguish the neutrino ring?** This experiment asks which heavy-sector and
charged-current responses can change while reconstructing the same light masses
and PMNS orientation. It uses the inputs in **Three active flavours** and the
geometry of the base ring. It is an inverse construction, not a prediction of its
supplied masses or a likelihood fit of the ring.

## 🎛️ Three first experiments

1. Select **Heavy splitting at fixed light inputs** and move **Selected position**
   from `0.1` to `0.8`. The selected heavy centre stays fixed; its pair splitting
   changes with μB. The light inputs and the DeepCore reference stay fixed.
2. Select **Common suppression hidden by normalization**. Equal active deficits
   suppress the raw vacuum current factor. The displayed near normalization
   cancels that common suppression. The difference graph identifies numerical
   coincidence rather than magnifying floating-point noise.
3. Select **Unequal deficits and flavour shape**. Inspect the fourth graph: it
   resolves a small absolute difference that can be hidden by overlapping curves
   in the third graph. Change the source/detected flavour or select antineutrinos.

To move the cross in the data map, change **sin² θ₂₃** or the atmospheric splitting
in **Three active flavours**. Changing a ring parameter along the displayed path
does not move these fixed light inputs. Use **Use this point as comparison** for
the numerical comparison snapshot. Save the full JSON to retain both points.

## 📊 Read the five linked figures

| Figure | Reading |
|---|---|
| 01 · Heavy centre | Teal samples give the mass in GeV; the open circle and vertical guide select a point. A flat curve can be the physical response of this path. The vertical axis is cropped and has explicit values. |
| 02 · Pair splitting | Rust samples give the leading splitting in eV, distinct from the centre. Uncomputed points break the line. |
| 03 · Vacuum current factors | Grey dashed: unitary reference; violet: raw CC factor; rust dashed: the stated near-normalized factor. The legend is embedded in the exported SVG. |
| 04 · Magnified difference | Near-normalized minus unitary, in absolute dimensionless units. A power of ten is shown when needed. If the entire sampled difference is below 10⁻¹² it is drawn at zero with an explicit explanation; JSON and SVG metadata retain the original samples. |
| 05 · DeepCore reference | Darker means larger archived Δχ², with colour saturated at 20. Cross: chosen light inputs; circle: tabulated grid minimum; rust: the supplied normal-ordering 90% Feldman–Cousins contour. This is a standard-three-neutrino reference. |

The green strip identifies what is fixed. Captions state what to look for; the
plots have units, numerical scales, accessible titles/descriptions and embedded
provenance. They reflow into one column on narrower screens. SVG is a standalone
vector export; complete sampled numbers and assumptions are retained in metadata.

## 🧮 Calculation and nine parameter paths

The nine choices vary μB, the sterile scale f, the three geometric links t/q/r,
a common active deficit, or one of d₁/d₂/d₃. The browser computes 25 scan points
and a separately selected point. Deficits use logarithmic spacing. Each copy
reconstructs its Dirac and μA couplings to realize the selected light mass and
deficit using the [three-copy construction](neutrino-flavour.md). The sterile copy
and pair selectors identify which of the 18 pairs to plot.

The calculation retains the conserving singular system exactly and the Majorana
insertions to leading order. An insertion/nearest-gap diagnostic is provided for
the path; it is not a certified error estimate. Out-of-domain reconstructed
couplings are labelled unevaluated and are not joined by a plotted line. An
invalid selected point removes its current-factor curves instead of leaving a
stale calculation visible.

For inaccessible heavy states the light charged-current matrix is

```text
N = U diag(√(1−d₁), √(1−d₂), √(1−d₃)),
zα = (N N†)αα,
Kαβ(L/E) = |Σi Nβi N*αi exp[−2i × 1.266932679 × (mi²−m1²) L/E]|².
```

Mass squared is in eV², L in km and E in GeV. Antineutrinos conjugate the coupling
product. The raw factor K is the vacuum limit of eq. (5) in
[Blennow et al., arXiv:1609.08637](https://arxiv.org/html/1609.08637v3). It uses
Standard Model flux/cross-section normalization and need not sum to one.

The displayed hypothetical near-normalized factor is **Kαβ/zα²**, the vacuum
version of that paper's eq. (7) for its specified near/far normalization protocol.
It is not the response of IceCube. It is also not a definition of flavour
probabilities normalized to sum to one. For equal deficits d, the raw factor is
(1−d)² times the unitary result, while the displayed ratio is exactly the unitary
result. Unequal deficits can leave a flavour-dependent response. A different
normalization protocol need not have the same cancellation.

The selected curves sample 161 L/E values in 0–2000 km/GeV; the scan's maximum
shape difference uses 81 samples over the same interval. These are sampled
diagnostics, not certified continuous extrema. Matter, astrophysical averaged
propagation, fluxes, efficiencies, energy/angle response, cross sections and
weak-input refits are not computed here.

## 🧊 Real data: the explicitly archived DeepCore 2018 reference

The source is IceCube's [three-year full-sky atmospheric-neutrino release](https://icecube.wisc.edu/data-releases/2018/02/measurement-of-atmospheric-neutrino-oscillations-with-three-years-of-data-from-the-full-sky/),
[DOI 10.21234/B4105H](https://doi.org/10.21234/B4105H), associated with
[arXiv:1707.07081](https://arxiv.org/abs/1707.07081). The original tables and README
are in [data/icecube_deepcore_2018](../data/icecube_deepcore_2018/), together with
SHA256 hashes, the archive URL and retrieval date. The compiled application needs
no network request to use them.

Both ordering maps contain 51 × 51 values in sin² θ₂₃ and **signed Δm²₃₂**.
The laboratory preserves the published values and interpolates bilinearly inside
the grid, with no extrapolation. For normal ordering it converts Δm²₃₁ to Δm²₃₂
by subtracting Δm²₂₁; for inverted ordering its atmospheric input is already
|Δm²₃₂|. Each map has its own zero: their minima cannot supply ordering odds.
The supplied normal-ordering 90% Feldman–Cousins contour is used as supplied,
not replaced by a constant Δχ² = 4.6 contour.

These grids assume standard three-neutrino oscillations. Their reference value
does not constrain the nonunitary ring path. NuFIT's IC24 selection already uses
IceCube information; independence from the earlier atmospheric sample is not
established. **No sum of NuFIT and DeepCore likelihoods is performed.**

This is explicitly the 2018 archive. The public Harvard Dataverse metadata
endpoints for the 2024 release (10.7910/DVN/U20MMB) and 2025 release
(10.7910/DVN/B4RITM) returned HTTP 403 in this environment on 7 October 2026.
Their contents were not imported or claimed as a newer dataset.

## 🔁 Reproduce the reference and the study

From the repository root:

```text
python tools/build_deepcore_reference.py
python tools/build_neutrino_research_reference.py
node _test_neutrino_research.mjs
node tools/neutrino_identifiability.mjs
python tools/plot_neutrino_identifiability.py
python build/build_app.py --browser
```

The independent reference generator uses NumPy's full SVD of the 7 × 6 conserving
Dirac matrix, its null mode and complex matrix multiplication. Nine reference
cases cover geometry, scale, deficits, phases and ordering, with 360 independent
current-factor samples. The source harness also checks exact normalization
identities, zero-distance response, original data hashes, interpolation edges,
mass conventions and invalid-domain handling. The browser gate exercises real
controls, shared inputs, saved comparisons, permalinks, all five SVG downloads,
JSON, global result export and desktop/mobile layouts.

The [archived study](../research/2026-10-07-neutrinos/README.md) contains 738 scan
points: nine paths × two orderings × 41 points, with inputs, source/data hashes,
budgets, JSON and standalone SVG/PNG/PDF figures. JavaScript hashes normalize CRLF
to LF for reproducibility across checkouts. The default light-mass
reconstruction residual stays below 2.1 × 10⁻¹⁷ eV; that verifies the construction
numerically and does not make its input masses predictions.

## 🧭 What this makes investigable, and what remains

The experiment separates a reconstruction check from an observable response. It
exhibits parameter paths that the fixed standard light-sector reference cannot
distinguish, and identifies heavy masses, pair splitting, absolute current
normalization or flavour-dependent current factors as possible additional probes.
These are model calculations under stated approximations, not new exclusions or
a proof of full identifiability.

A useful next step is a fit permitting nonunitarity with a specified experimental
normalization, weak-input scheme and detector response. Matter propagation,
coherent multi-state production/decay and radiative stability need their own
validation. Increasing the precision of plots cannot replace those calculations.

[🧭 Laboratory inventory](laboratory-inventory.md) ·
[🧬 Three-flavour construction](neutrino-flavour.md) ·
[⏱️ Decays and coherence](neutrino-decays.md)
