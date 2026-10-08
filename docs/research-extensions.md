# GHU experiments: from inputs to a checkable conclusion

🧭 The [complete laboratory map](laboratory-inventory.md) covers the navigation,
Simulator modes, embedded cards, diagnostics and batch studies. For the neutrino
extension, see the [three-flavour guide](neutrino-flavour.md), including what its
vacuum oscillation plots compute, and the [fixed-light-input experiment](neutrino-identifiability.md)
with nine parameter paths, five descriptive figures and the archived DeepCore 2018 reference.

Each new experiment stays in an existing section. Start with its **What this tests** box, choose a reference, then vary one physical parameter. The result area presents the key quantities and a short interpretation before the figures. **Use this point as comparison** saves a snapshot; subsequent changes show differences beside the indicators. The snapshot travels in the JSON export. Tables, matrices and numerical precision controls are expandable.

| Question | Where | First useful comparison |
|---|---|---|
| Does SU(6) content select a small Wilson phase? | Paper models → Maru–Nago | k3=3, Nad=5: compare 10 and 1000 Fourier terms; inspect the magnified minimum |
| Can UV brane terms reconcile the coupling differences? | Brane kinetic terms → Warped SU(6) | Compare C1 and C2, then choose the required Δλ values |
| What does a three-flavour ring require? | Simulator → Neutrino ring → Three active flavours | Normal/inverted ordering; vary δ and inspect the oscillation curves and flavour map |
| How do Majoron channels alter lifetimes? | Simulator → Neutrino ring → Decays | Include computed Majoron widths, select a heavy pair and vary the scalar VEV ratios |
| Does RS matter cancel gauge anomalies? | Anomalies & proton → RS anomaly flow | Remove one lepton generation, then restore it; compare UV and IR contributions |
| Does thermal GHU nucleate bubbles? | Simulator → SU(N) builder → Finite-temperature GHU | Load cases 1 and 2; compare coexistence with the matching PhaseTracer bounce |
| Do the bubbles percolate and complete the transition? | Simulator → SU(N) builder → Integrated nucleation, percolation and conditional gravitational waves | Load case 1, save a comparison, then change wall speed and fluid efficiency; inspect convergence and the acoustic-domain gate |
| Does a conditional rung bound survive a full-potential check? | Screen a table → Conditional rung bounds and full-potential witness checks | Read the selected seed and conventions; compare the interval bound with the archived competing-vacuum examples |
| What Higgs rates do the assumptions imply? | Collider → Higgs rates | Save the SM reference, load the top-tower scenario, add invisible width and run HiggsTools |

Each experiment provides a shortcut near the top of its section. **Save research summary** exports a readable text note. JSON retains full matrices, rates, assumptions and provenance. The figure selector lets you export any plot as SVG. The main permalink retains the controls; external calculations and comparison snapshots are saved in JSON, not encoded into the URL.

## What is computed, supplied or still open

The panels implement distinct actions. They do not silently combine flat SU(6), warped SU(6), flat thermal SU(3) and the Abelian ring into one theory. The Maru–Nago button transfers its supported bulk potential to the existing builder. The neutrino extension shares the current ring parameters. Thermal SU(3), RS running and RS anomalies have their own clearly labelled inputs.

- **SU(6):** eq. (4.3) of [Maru–Nago](https://doi.org/10.1007/JHEP11(2024)035), Type 2/3 generations, k1=0. The laboratory character sum has been checked against the paper coefficients and independent infinite-sum calculations. At k3=3, Nad=5, Table 2 quotes α=0.0305824; the infinite-sum value is approximately 0.03262233. Ten terms closely reproduce the quoted value, but the authors' actual numerical procedure is not established. This is a numerical reproduction issue, with no claim of scientific novelty. Adjoint exotic lifting, full flavour consistency and the Higgs mass are not certified by this potential comparison.
- **RS running:** the one-loop asymptotic Planck-brane calculation of [Angelescu et al.](https://arxiv.org/abs/2512.22094), C1/C2 assignments, approximate IR matching and differential couplings only. The UV localization/mass probe is separate from the C1/C2 spectrum. NDA is a scale estimate, not a likelihood.
- **Neutrinos:** three copy-diagonal sterile rings provide three active mass directions and 18 quasi-Dirac pairs. Masses and PMNS orientation reconstruct Yukawa columns; they are inputs. The light matrix, active deficit and flavour residues are exported. Plotted oscillations use the unitary vacuum limit. [NuFIT 6.1](https://www.nu-fit.org/sites/default/files/v61.tbl-parameters.pdf) provides separate one-parameter ranges, not a combined nonunitarity fit. A [Hosotani reference button](https://arxiv.org/abs/2507.08321) transfers historical PMNS inputs, not the paper's RS action. Copy-changing interactions, radiative flavour stability and vacuum re-minimization remain open.
- **Majoron:** the existing physical quotient normalization and conserving eigenvectors produce light and heavy cascade widths at leading Majorana order. See [the Majoron equations and checks](neutrino-majoron.md). Scalar VEV changes keep the fermion mass matrix fixed by retuning its couplings. Multi-state overlap and unknown radial channels are reported.
- **RS anomalies:** Bessel eigenmodes and normalized gauge profiles reproduce the [June anomaly-flow paper](https://arxiv.org/abs/2606.01829) and the neutral matrix in the [September baryon-current paper](https://arxiv.org/abs/2609.29135). Published finite fermion-KK sums are a fixed comparison table; they are not recalculated when controls change. Gauge cancellation and baryon-current violation are separate outputs. No proton lifetime or baryogenesis yield is inferred.
- **Thermal GHU:** the one-loop four-dimensional potential of [Hirose–Shibuya](https://arxiv.org/abs/2303.14192), C4=3/(64π⁶R⁴) and canonical α=g4 R φ. The browser scans broken/origin coexistence and compares cutoffs. PhaseTracer solves an actual O(3) bounce. The original S3/T=140 result remains labelled a proxy. The integrated-history panel adds nucleation, percolation, completion and a conditional acoustic spectrum using refined action tables; assumptions and reproduction are below. No daisy resummation or predicted wall velocity is supplied.
- **Higgs:** a single CP-even 125.2 GeV scalar with explicit real κV, universal κF, effective κg/κγ/κZγ, and invisible width. Every SM partial width is included. Cross sections at 8, 13, 13.6 and 14 TeV retain the HiggsPredictions coupling interference. [HiggsTools for Run 3](https://arxiv.org/abs/2608.05401) and the official HB/HS datasets evaluate that complete scalar scenario. A top-tower ggH modification alone is not a complete GHU fit. HiggsBounds uses its selected most sensitive expected limit; all applied limits remain in the JSON. HiggsSignals χ² and Δχ² relative to the same SM point are not converted into a confidence level. Di-Higgs production is not evaluated by this adapter.

## Run the scientific engine locally

The browser calculations and frozen benchmark results work offline. New PhaseTracer and HiggsTools parameter points require the local engine, or importing a result calculated with the command-line adapters. **Changing any input invalidates an unmatched external result immediately.** A stored benchmark is used only when every input matches.

Install Docker Desktop, Python 3 and Git, then run from this repository:

```text
python tools/backend.py setup
python tools/backend.py serve
```

Setup fetches the exact official commits in `tools/backend_versions.json`, builds both programs and the bounce adapter, and packages both experimental datasets. It can take several minutes and requires internet access. The server is exposed on **127.0.0.1:8793**. Leave it running, return to the experiment and press **Calculate with local scientific engine**. If the browser asks for local network access, allow it for the laboratory. Stop with Ctrl+C or `python tools/backend.py stop`.

The engine accepts bounded numerical parameters for these two experiments. It does not accept commands or file paths from the web page. Data stay on your machine. The packaged calculation is also usable directly inside the image:

```text
python higgstools_run.py inputs.json result.json --hb /datasets/hb --hs /datasets/hs
python thermal_run.py inputs.json result.json
```

Mount a directory containing an exported input JSON when using these commands through Docker. Import `result.json` with **Import computed result**. The importer checks the experiment, all parameter values, required result fields and (for HiggsTools) numerical agreement of every width, branching fraction and cross section with the browser calculation. Imports document external calculations; they are not cryptographic attestations.

The SU(6), RS, flavour, thermal and Higgs harnesses run with the normal application build. The extensions browser gate checks controls, invalid inputs, comparison snapshots, permalinks, exports, stale-result rejection and mobile layouts. Separate reference records hold independent SciPy calculations and real PhaseTracer/HiggsTools runs. The PhaseTracer-linked C++ adapter is GPL-3.0-or-later; upstream tools retain their own licenses.

## Integrated transition history

In **Simulator → SU(N) builder**, select a thermal paper benchmark, then use **Integrated nucleation, percolation and conditional gravitational waves**. It shares the thermal panel's inputs. The wall speed, fluid efficiency, relativistic degrees of freedom and expansion background can be varied separately. Exported results retain the action samples, pinned backend and precision record. Changing a thermal input withdraws the result unless a matching action table exists.

The integration assumes adiabatic cooling, constant g*=g*s, Γ=T⁴(S3/(2πT))^(3/2)exp(−S3/T), and constant wall speed. It evaluates the unweighted integral of Γ/H⁴ for nucleation and the expanding-bubble volume integral I for P=false fraction=exp(−I). Percolation uses I=0.34 (about 28.8% converted); completion uses P=0.01. Both additionally require decreasing a³P. The default H includes radiation and a constant false-vacuum energy obtained by assigning zero energy to the T=0 true vacuum. Radiation-only expansion is an explicit alternative.

For 1/R=1000 GeV, g*=106.75, wall speed 0.95, efficiency 0.5, and the default background:

| Thermal benchmark | Integrated Tn [GeV] | Tp [GeV] | Completion T [GeV] | Acoustic peak [Hz] | Peak ΩGW h² |
|---|---:|---:|---:|---:|---:|
| Case 1, g4=3 | 94.8871 | 90.3414 | 89.2832 | 0.00133823 | 1.69262e−11 |
| Case 2, g4=1 | 25.1778 | 25.1480 | 25.1444 | 0.0291382 | 3.53341e−17 |

These are model calculations, not measurements by CMS or ATLAS. The action samples use spatial cutoffs 100/200/400/800, thermal cutoffs 120/240/480/960 and shooting tolerance 2e−5. The primary calculation uses 800/960 and 1200 integration steps. Doubling 400/480 changes Tp by about 2.43e−6 relative for case 1 and 9.22e−6 for case 2. The panel also compares 600 steps and every second action knot. These comparisons diagnose convergence; they are not rigorous error bars.

The acoustic estimate uses [eqs. (28–30) of the transition-robustness study](https://arxiv.org/abs/2309.05474), the mean separation inferred from the false-volume-weighted bubble density, a finite sound lifetime, supplied κ, and instantaneous bag-model reheating. The fit is gated to completing transitions with α≤1 and wall speed above the bag Jouguet speed. Slower walls require hydrodynamics not implemented here. Thermal reheating during growth, O(4) tunnelling, collisions, turbulence and detector significance are not evaluated. The two SU(3) examples are separate from the SU(7) action and do not establish an electroweak or collider fit. See also the [transition review](https://arxiv.org/abs/2305.02357).

To refine a saved result, mount this repository in the pinned image built by `tools/backend.py setup`. From its root (PowerShell), for example:

```powershell
docker run --rm --mount "type=bind,source=$($PWD.Path),target=/work" ghu-lab-scientific:20261006 python /work/tools/thermal_history_run.py /work/data/thermal_case1_phasetracer.json /work/data/thermal_history_case1.json
```

For a new point, first obtain the ordinary thermal result through the engine and save its raw external JSON. Refine that file, then import the resulting JSON into the thermal panel with exactly matching inputs. The refinement requires a sampled metastable branch bracketing the crossing; it fails if that branch is absent. The ordinary engine button does not perform this extra refinement automatically.

## Conditional SU(7) bounds and vacuum checks

**Screen a table → Conditional rung bounds and full-potential witness checks** reads the selected seed and conventions. The interval calculation covers the listed even candidate rungs k=2…20 and odd published rungs k=1…21, with mh in [123,127] GeV, mW=80.4 GeV and g4=0.63. Bounds outside those conventions are withdrawn. Candidate upper bounds start at 7.37630 TeV for k=2 and 5.55422 TeV for k=4.

The certificates prove a bound on the small-angle moment relaxation. A rational dual is checked against every generator with interval arithmetic. At the first excluded A4 lattice point, a negative gap with negative derivative and strictly negative second derivative excludes the entire larger-A4 tail. The mh=127 endpoint bounds the full mass interval because the required G increases with μ. No finite scan is used as a proof of the tail, no monotonicity between unlisted rungs is assumed, and no attainment claim follows.

Independent NumPy/SciPy full-Fourier checks distinguish selected physical-vacuum candidates from stationary examples. The archived measured-mass content gives mh≈125.1328 GeV and 1/R5≈6.40824 TeV; its small-angle minimum is lowest among the numerically located extrema. Two stationary upper examples have a deeper minimum at α=1. A k=0 example also has an endpoint vacuum, illustrating why the small-angle exclusion is not a universal full-potential statement. These searches are numerical, not interval isolation of every root. Both the potential tail and the doubled bound for F(α)−F(0) are recorded.

Reproduce the bounds, witness checks and browser references with Python plus mpmath, NumPy and SciPy:

```text
python tools/build_closure_references.py
node _test_candidate_bounds.mjs
node _test_thermal_history.mjs
```

The full-potential remainder enclosure, an exhaustive global-vacuum ceiling, anomaly/flavour completion and common observable matching remain open. A complete SU(7) joint likelihood requires specifying the same bulk/brane action, Yukawa sector, spectrum and uncertainties across Higgs, electroweak and collider observables. No combined χ² is constructed by adding unrelated panels.

## Experimental numbers already included

The HNL panel includes the published [CMS EXO-22-011 search](https://cms-results.web.cern.ch/cms-results/public-results/publications/EXO-22-011/), at 13 TeV with 138 fb⁻¹. Observed and expected 95% CL curves, bands, HEPData DOIs and source hashes are stored in `data/neutrino_hnl_limits.json`. For a Dirac HNL of 10 GeV coupled exclusively to electrons, the stored observed upper limit is |VeN|²=5.7415e−5. The single-flavour hypothesis matters when comparing a multi-flavour theory. These are published limits, not a new analysis of raw detector events.

HiggsBounds and HiggsSignals use pinned official experimental datasets that include CMS and ATLAS results. The saved SM reference has χ²=151.642065 over 159 observables; this is a reference calculation, not a joint GHU fit or 159 independent degrees of freedom. Dataset commits and hashes are retained. The historical Higgs-rate window elsewhere in the laboratory is a paper-era reference and is not advertised as the latest combination.

## 🔬 Fixed-light-input neutrino experiment

In **Simulator → Neutrino ring**, open **Fixed light inputs: what can distinguish the neutrino ring?**
Compare the heavy-splitting, common-suppression and unequal-deficit presets. The five figures
show what is held fixed, what responds and how the reference data are used. The [method guide](neutrino-identifiability.md)
details the vacuum current normalization, data provenance, invalid points and limits.
The fourth [archived study](../research/2026-10-07-neutrinos/README.md) records 738 scan points
with standalone SVG/PNG/PDF figures. Reproduce it with `node tools/neutrino_identifiability.mjs`
and `python tools/plot_neutrino_identifiability.py`.

## Reproducible exploration beyond one point

The [October 7 report](research-exploration-2026-10-07.md) applies these tools to three separate
studies, with [JSON records, figures and an artifact inventory](../research/2026-10-07/README.md):

- **Higgs coupling/width assumptions:** 2,646 actual HiggsTools evaluations reproduce the common-κ
  compensation in visible rates. The selected HiggsBounds limit changes the verdict between
  κ=1.05 and 1.06 along that line; the reference is stored per point. This known degeneracy
  illustrates why a fixed-coupling width constraint cannot be transferred to a profiled fit.
- **Thermal assumptions:** 160 wall/efficiency/background scenarios produce supported acoustic
  amplitudes spanning factors of 124 and 151 for the two cases. The quoted ranges are scenario
  envelopes; unsupported acoustic regimes remain unevaluated.
- **Candidate vacuum screening:** k=2 enumerates 1,227,070 contents inside the conditional moment
  region; k=4 reaches a 5,000,000-content cap. Full-potential checks of 80 selected representatives
  leave 37 with a preferred vacuum among the numerically located extrema and a full mass inside
  [123,127] GeV. The approximate prefilter, selection and cap preclude an exhaustive optimum claim.

The batch scans are supplied as command-line tools, not extra interactive panels. Interactive
profile scans, a resumable candidate queue and plasma/friction dynamics are proposed extensions.
The report explains their prerequisites. The menu has 29 entries; the full contents are mapped
in the [laboratory inventory](laboratory-inventory.md). The current
release validation is 5,867 source checks across 66 harnesses, eleven browser gates and 30 site checks.
The formula correction also has 13 independent SageMath checks. The twelve study-record checks
are counted separately.

## Matched thermal solvers and separate numerical diagnostics · 8 October 2026

The existing thermal card now includes a PhaseTracer/CosmoTransitions comparison for each
stored paper case. Every input must match, including the displayed temperature and base
cutoffs; edited inputs withdraw the evidence and its JSON export. The comparison uses the
same one-loop SU(3) potential and canonical field phi = alpha/(g4 R), with
C4 = 3/(64 pi^6 R^4). It does not attach the thermal model to the SU(7) action.

For O(3), S3 = 4 pi integral dr r^2 [0.5 (dphi/dr)^2 + V(phi,T) - V(0,T)].
We supply analytic first and second field derivatives. Direct term-sum checks and finite
differences verify the field-normalization factors. Near a stationary point, roundoff is
scaled to the absolute term sum, because the final derivative can cancel to zero.

| Case | PhaseTracer T140 (GeV) | CosmoTransitions T140 (GeV) | Max relative action difference | Max action shift on tightening tolerance |
|---|---:|---:|---:|---:|
| 1 | 93.174864 | 93.174864 | 2.294e-08 | 0.09479% |
| 2 | 25.171554 | 25.171554 | 1.924e-08 | 0.111% |

The table uses 800 spatial / 960 thermal terms and shooting tolerance 2e-6. T140 is the
S3/T=140 proxy, not the integrated nucleation or percolation temperature. The archived original
proxy used tolerance 1e-4; the integrated-history tables use 2e-5. This comparison does not
replace those history tables or silently update the gravitational-wave calculation.

Nine temperatures per case compare tolerance 2e-5 against 2e-6. The crossing is also solved
at 100/120, 200/240, 400/480 and 800/960 cutoffs for each solver. A separate 500/2000/4000-point
profile check measures action quadrature sensitivity at one temperature per case. The O(3)
virial diagnostic is |K + 3U|/K, with the finite starting-radius core included in U.
The maximum virial residual is below 0.000326. Numerical targets were 1% for relative action
differences, 0.1% for relative crossing differences, 0.2% for tolerance shifts and 0.5% for
the virial residual. Both cases meet those targets; they are not confidence levels.

**The implementations share algorithmic ancestry.** PhaseTracer2 documents its improvements
to the shooting/path-deformation methods used by CosmoTransitions. Agreement between these
implementations does not bound their shared numerical errors. The tolerance response is
much larger than their mutual difference; both are retained. No rigorous thermal remainder,
interval bounce proof, higher-loop uncertainty or thermal resummation error is inferred.

Attribution: thermal potential, [Hirose and Shibuya](https://arxiv.org/abs/2303.14192);
CosmoTransitions, [Carroll L. Wainwright](https://arxiv.org/abs/1109.4189);
PhaseTracer2, [Peter Athron et al.](https://arxiv.org/abs/2412.04881).
CosmoTransitions 2.0.7 is pinned by its published wheel SHA-256; the output records actual
Python/NumPy/SciPy versions, the PhaseTracer commit, executable/source hashes and input hashes.

Starting from the existing scientific image, reproduce from the repository root:

```text
docker build -f tools/crossvalidation.Dockerfile -t ghu-lab-crossvalidation:20261008 tools
docker run --rm --mount "type=bind,source=<absolute repository path>,target=/work" ghu-lab-crossvalidation:20261008 python tools/thermal_crossvalidate.py data/thermal_crossvalidation.json
python tools/build_crossvalidation_reference.py
node _test_crossvalidation.mjs
```

`--pilot` is an optional two-point diagnostic; a pilot file cannot activate archived evidence
in the browser. The full [comparison JSON](../data/thermal_crossvalidation.json) retains the
individual actions and diagnostics. Higher loops, resummation, perturbative validity, O(4)
tunnelling and plasma dynamics remain outside this calculation. This is numerical validation,
not a new physical prediction or a claim of scientific originality.
