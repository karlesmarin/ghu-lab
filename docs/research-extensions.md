# GHU experiments: from inputs to a checkable conclusion

Each new experiment stays in an existing section. Start with its **What this tests** box, choose a reference, then vary one physical parameter. The result area presents the key quantities and a short interpretation before the figures. **Use this point as comparison** saves a snapshot; subsequent changes show differences beside the indicators. The snapshot travels in the JSON export. Tables, matrices and numerical precision controls are expandable.

| Question | Where | First useful comparison |
|---|---|---|
| Does SU(6) content select a small Wilson phase? | Paper models → Maru–Nago | k3=3, Nad=5: compare 10 and 1000 Fourier terms; inspect the magnified minimum |
| Can UV brane terms reconcile the coupling differences? | Brane kinetic terms → Warped SU(6) | Compare C1 and C2, then choose the required Δλ values |
| What does a three-flavour ring require? | Simulator → Neutrino ring → Three active flavours | Normal/inverted ordering; vary δ and inspect the oscillation curves and flavour map |
| How do Majoron channels alter lifetimes? | Simulator → Neutrino ring → Decays | Include computed Majoron widths, select a heavy pair and vary the scalar VEV ratios |
| Does RS matter cancel gauge anomalies? | Anomalies & proton → RS anomaly flow | Remove one lepton generation, then restore it; compare UV and IR contributions |
| Does thermal GHU nucleate bubbles? | Simulator → SU(N) builder → Finite-temperature GHU | Load cases 1 and 2; compare coexistence with the matching PhaseTracer bounce |
| What Higgs rates do the assumptions imply? | Collider → Higgs rates | Save the SM reference, load the top-tower scenario, add invisible width and run HiggsTools |

Each experiment provides a shortcut near the top of its section. **Save research summary** exports a readable text note. JSON retains full matrices, rates, assumptions and provenance. The figure selector lets you export any plot as SVG. The main permalink retains the controls; external calculations and comparison snapshots are saved in JSON, not encoded into the URL.

## What is computed, supplied or still open

The panels implement distinct actions. They do not silently combine flat SU(6), warped SU(6), flat thermal SU(3) and the Abelian ring into one theory. The Maru–Nago button transfers its supported bulk potential to the existing builder. The neutrino extension shares the current ring parameters. Thermal SU(3), RS running and RS anomalies have their own clearly labelled inputs.

- **SU(6):** eq. (4.3) of [Maru–Nago](https://doi.org/10.1007/JHEP11(2024)035), Type 2/3 generations, k1=0. The laboratory character sum has been checked against the paper coefficients and independent infinite-sum calculations. At k3=3, Nad=5, Table 2 quotes α=0.0305824; the infinite-sum value is approximately 0.03262233. Ten terms closely reproduce the quoted value, but the authors' actual numerical procedure is not established. This is a numerical reproduction issue, with no claim of scientific novelty. Adjoint exotic lifting, full flavour consistency and the Higgs mass are not certified by this potential comparison.
- **RS running:** the one-loop asymptotic Planck-brane calculation of [Angelescu et al.](https://arxiv.org/abs/2512.22094), C1/C2 assignments, approximate IR matching and differential couplings only. The UV localization/mass probe is separate from the C1/C2 spectrum. NDA is a scale estimate, not a likelihood.
- **Neutrinos:** three copy-diagonal sterile rings provide three active mass directions and 18 quasi-Dirac pairs. Masses and PMNS orientation reconstruct Yukawa columns; they are inputs. The light matrix, active deficit and flavour residues are exported. Plotted oscillations use the unitary vacuum limit. [NuFIT 6.1](https://www.nu-fit.org/sites/default/files/v61.tbl-parameters.pdf) provides separate one-parameter ranges, not a combined nonunitarity fit. A [Hosotani reference button](https://arxiv.org/abs/2507.08321) transfers historical PMNS inputs, not the paper's RS action. Copy-changing interactions, radiative flavour stability and vacuum re-minimization remain open.
- **Majoron:** the existing physical quotient normalization and conserving eigenvectors produce light and heavy cascade widths at leading Majorana order. See [the Majoron equations and checks](neutrino-majoron.md). Scalar VEV changes keep the fermion mass matrix fixed by retuning its couplings. Multi-state overlap and unknown radial channels are reported.
- **RS anomalies:** Bessel eigenmodes and normalized gauge profiles reproduce the [June anomaly-flow paper](https://arxiv.org/abs/2606.01829) and the neutral matrix in the [September baryon-current paper](https://arxiv.org/abs/2609.29135). Published finite fermion-KK sums are a fixed comparison table; they are not recalculated when controls change. Gauge cancellation and baryon-current violation are separate outputs. No proton lifetime or baryogenesis yield is inferred.
- **Thermal GHU:** the one-loop four-dimensional potential of [Hirose–Shibuya](https://arxiv.org/abs/2303.14192), C4=3/(64π⁶R⁴) and canonical α=g4 R φ. The browser scans broken/origin coexistence and compares cutoffs. PhaseTracer solves an actual O(3) bounce. S3/T=140 is a radiation-era proxy, not integrated nucleation or percolation. No daisy resummation, wall velocity or gravitational-wave prediction is supplied. Case 1 gives RTn≈0.092887 at g4=3, with about 0.48% action variation in the combined cutoff/tolerance check. Case 2 is more sensitive (about 6.1%); its displayed result explicitly asks for refinement.
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
