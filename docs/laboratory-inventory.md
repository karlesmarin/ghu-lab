# 🧭 The complete laboratory — navigation, experiments and research tools

The laboratory covers model construction, Wilson potentials and vacua, spectra, anomalies,
boundary conditions, collider references, neutrino dynamics and thermal transitions. The
[README catalog](../README.md#-the-instrument) follows the actual menu order; this guide explains
the capabilities inside those entries and the tools that run outside the browser.

## 🔢 What each count describes

| Inventory | Count | Source of the count |
|---|---:|---|
| 🗂️ Menu sections | 29 | Active section registrations in `src/sections/registry.js` |
| 🔮 Simulator model modes | 3 | The builder, top-KK Higgs production and neutrino-ring options in `predict_section.js` |
| 🧪 Embedded experiment cards | 8 | The `rxAttach` registrations in `research_extensions.js` |
| 🔬 Archived batch studies | 4 | Higgs, thermal and vacuum studies under `research/2026-10-07/`; neutrino paths under `research/2026-10-07-neutrinos/` |

These counts describe different levels. A mode or experiment lives inside a menu section, and
one study may use several engines. They do not add up to a total of independent panels.
The ten October research additions are the eight experiment cards plus computed Majoron
channels inside Decays and conditional certificates inside Screen a table. The original
neutrino-ring mode, Higgs-production mode and robustness/decay diagnostics remain part of the
laboratory as well.

Regenerate the [machine-readable inventory](laboratory-inventory.json) from the source:

```text
python tools/laboratory_inventory.py
```

The script derives section order, labels, experiment hosts and Simulator options directly from
their registrations. The named analysis areas and batch-study categories are documented groupings;
they are not a count of every control, plot or numerical function.

## 🧪 The eight embedded experiment cards

| Card | Host section | Main controls and results |
|---|---|---|
| 🧩 Maru–Nago SU(6) | Paper models | Type 2/3 generations, adjoint matter, Fourier cutoff, Wilson potential and minimum, convergence and transfer to the builder |
| 🌌 Warped SU(6) running | Brane kinetic terms | C1/C2 assignments, IR/UV scales, differential coupling curves, required UV brane terms and the separate localization probe |
| 🧬 Three active flavours | Simulator → Neutrino ring | Chosen masses and PMNS inputs, reconstructed Yukawa/light-mass matrices, active deficit, heavy flavour weights and unitary-limit oscillation plots |
| 🔬 Fixed light inputs | Simulator → Neutrino ring | Nine reconstructed paths, heavy mass/splitting responses, vacuum CC factors, magnified shape differences and the archived DeepCore 2018 map |
| 🌡️ Finite-temperature GHU | Simulator → SU(N) builder | Independent thermal SU(3) benchmark, coexistence, phase flow, cutoff comparison and matching PhaseTracer bounce |
| 🫧 Integrated transition history | Simulator → SU(N) builder | Refined actions, nucleation, percolation, completion, false-vacuum fraction, bubble separation and a conditional acoustic spectrum |
| ⚖️ RS anomaly flow | Anomalies & proton | Z-mode profiles and masses, UV/IR anomaly factors, gauge cancellation and baryon-current matrix |
| 💥 Higgs rates and experimental tests | Collider | Scalar couplings, invisible width, complete rate/width tables and matching HiggsBounds/HiggsSignals results |

Use each section's **Go to experiment** shortcut. The flavour and fixed-input cards appear in the neutrino mode;
the two thermal cards appear in the builder mode and use their own thermal inputs.
The [experiment guide](research-extensions.md) documents equations, references and limitations.

## 🔮 Three Simulator modes and the analyses around them

| Mode or analysis | Available work | First useful action |
|---|---|---|
| 🏗️ 5D model from the SU(N) builder | Vacuum-derived compactification scale, Higgs mass, weak-angle comparison, KK towers and Wilson-line fermion masses; separate thermal experiment cards below | Load a paper model into the builder, then inspect its predictions and their assumptions |
| 💥 Higgs production · top KK reference | Leading rate, finite tower, resummed low-energy-theorem comparison, numerical tail and conditional historical/user window | Change MKK, then compare cutoff and approximation effects |
| 🧬 Neutrino ring · 4D research model | Ring links and Majorana insertions, light mass, six heavy pairs, residues, active deficit, normalization and the μB response | Change a link or μB and inspect the joint results; calibration can hold two light inputs fixed |
| 📐 Hierarchy robustness | Separate g₄ model variation, measured W-input propagation and winding-convergence responses | Use the three plots to see which source moves m_h and 1/R₅ |
| ⏱️ Neutrino decays, flight and coherence | W/Z/h widths, optional computed Majoron light/heavy cascade widths, extra-width hypothesis, lifetime, cτ, fixed-boost flight probability and ideal SS/OS | Choose a heavy pair, include Majoron channels and compare width with splitting and the nearest pair gap |
| 📡 CMS HNL reference comparison | Observed/expected limits and expected bands, electron/muon/tau hypotheses, Dirac/Majorana normalization and per-pair reference ratios | Change the flavour/reference selectors; read the exclusive-coupling and isolated-state assumptions |
| 🔎 Conditional SU(7) certificates | Listed even/odd rungs, convention-dependent interval bounds, full-Fourier witnesses and competing vacua | Switch the seed and distinguish a moment bound from a physical-vacuum witness |

See the [ring guide](neutrino-ring.md), [three-flavour and oscillation guide](neutrino-flavour.md),
[decay guide](neutrino-decays.md),
[Majoron calculation](neutrino-majoron.md) and [robustness/Higgs guide](diagnostics.md).
The gravity–gauge 3D research section, boundary-condition classifiers, representation tools,
inverse design and census remain separately listed in the main navigation catalog.

## 🧾 What comes from experiment

| Reference | How the laboratory uses it | Scope |
|---|---|---|
| 💥 CMS dijet result | Comparison under the specified colour-octet/bulk-colour hypothesis | A named model comparison, not a detector event simulation |
| 📡 CMS EXO-22-011 HNL tables | Six official HEPData tables with observed/expected curves and bands | Single-flavour Dirac/Majorana hypotheses are retained; the ring overlay is not a multi-state likelihood |
| 📊 ATLAS/CMS Higgs datasets | Pinned HiggsBounds/HiggsSignals evaluations for an explicit scalar scenario | Selected-limit exclusion and HiggsSignals χ² remain separate |
| 🧊 IceCube DeepCore 2018 | Original normal/inverted 51 × 51 standard-three-neutrino maps and supplied normal-ordering FC contour | An archived reference; no extrapolation, nonunitary ring exclusion or combination with NuFIT |
| 🧬 NuFIT and PDG references | Chosen flavour parameters, separate reference ranges, masses and measured-input uncertainties | Inputs and their editions are identified; separate ranges are not silently combined into a fit |

The thermal transition and gravitational-wave outputs are model calculations. They are not
measurements by CMS/ATLAS, and the separate actions are not a common GHU likelihood.

## ⚙️ Browser, local engine and batch studies

Browser calculations and stored benchmark results work offline. New HiggsTools/PhaseTracer
points use the optional local engine or imported matching JSON. A changed input withdraws an
unmatched result. Integrated thermal history requires refined action tables in addition to
the ordinary bounce result. See [setup and refinement](research-extensions.md).

The [earlier three batch studies](research-exploration-2026-10-07.md) contain 2,646 HiggsTools evaluations,
160 thermal scenarios and 80 selected full-potential checks after budgeted candidate enumeration.
The fourth [neutrino study](../research/2026-10-07-neutrinos/README.md) adds 738 fixed-light-input scan points and standalone figures; see its [interactive guide](neutrino-identifiability.md).
Their [JSON records and figures](../research/2026-10-07/README.md) are reproducible command-line
artifacts. Interactive profile scans, a resumable candidate queue and plasma/friction dynamics
remain proposed extensions.

## 📤 Keep the input with the result

The main card, LaTeX and permalink describe the selected model. Experiment JSON retains the
experiment parameters, full result, provenance and optional comparison snapshot; the text summary
and SVG are complementary exports. Permalinks preserve controls, while external results and saved
comparisons belong in the JSON archive. See [the export guide](result-card.md).

## 🎬 Video guide

Watch this inventory in action: [English](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=en) · [Español](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=es). The tutorial covers every menu entry, Simulator mode and research card, with chapters, narration, subtitles and downloads.
