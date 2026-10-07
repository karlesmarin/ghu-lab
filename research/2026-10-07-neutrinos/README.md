# 🔬 Neutrino ring: fixed light inputs, different responses

This is the fourth archived study category in the laboratory. It complements the
[Higgs, thermal and candidate-vacuum studies](../2026-10-07/README.md).

![Heavy masses, splitting and normalized flavour responses](fixed-light-inputs.png)

## 📋 Scope and budget

Nine parameter paths, two light-mass orderings and 41 points per path give **738
evaluated scan points**. All other inputs are the recorded defaults. The displayed
heavy pair is copy 1, pair 1; the vacuum channel is μ → e. Each scan point uses 81
L/E samples between 0 and 2000 km/GeV. Each path also archives a selected endpoint
with 161 current-factor samples. Finite budgets are explicit; a maximum over
samples is not a certified global maximum.

## 📊 Findings at these recorded inputs

| Path, normal ordering | Sampled result | Interpretation |
|---|---|---|
| μB: 0–5000 keV | Heavy centre 183.7744 GeV stays fixed; splitting spans 11.4770–1164.6868 eV | Light reconstruction does not fix heavy lepton-number violation at this order |
| f: 500–5000 GeV | Centre spans 91.8872–918.8720 GeV | A mass-sensitive probe distinguishes this path |
| Common deficit: 10⁻⁶–10⁻³ | Normalized shape agrees with the unitary reference within 10⁻¹⁶ | The stated normalization cancels the common suppression |
| Direction-3 deficit: 10⁻⁶–10⁻³ | Maximum sampled normalized-factor difference ≈ 2.3596 × 10⁻⁵ | Unequal deficits can leave a flavour-dependent shape response |

Across both orderings, the maximum reconstructed light-mass residual is
2.0817 × 10⁻¹⁷ eV and the supplied PMNS entries remain unchanged. These are checks
of the inverse construction. The DeepCore standard-three-neutrino reference is
fixed on each path; the NO reference value is 1.3962375. This is not a nonunitary
ring likelihood and is not combined with NuFIT.

The study uses tree-level leading-Majorana results and the stated vacuum
normalization protocol. Every point retains approximation indicators. No matter
response, detector yield, exclusion, radiative stability or full-model fit is
claimed. See the [method and scientific limits](../../docs/neutrino-identifiability.md).

## 🔁 Artifacts and reproduction

- [Full study JSON](study.json): every input, scan row, selected spectrum, current curve, reference value and source/data hash.
- JavaScript hashes normalize CRLF to LF; original experimental tables retain exact byte hashes and are protected from Git newline conversion.
- [Compact numerical summary](summary.json).
- Standalone research figure: [SVG](fixed-light-inputs.svg), [PNG](fixed-light-inputs.png), [PDF](fixed-light-inputs.pdf).

```text
node tools/neutrino_identifiability.mjs
python tools/plot_neutrino_identifiability.py
```

Run the source harness with `node _test_neutrino_research.mjs`. The independent
NumPy/SVD reference is regenerated with
`python tools/build_neutrino_research_reference.py`. Original experimental tables
and their hashes live under `data/icecube_deepcore_2018/`.
