# 🧬 Three active flavours: what the laboratory computes

Open **Simulator → Neutrino ring · 4D research model → Three active flavours**.
The card extends the base ring with three sterile copies and reconstructs a model
from chosen light masses and mixing parameters. It already plots neutrino and
antineutrino appearance probabilities in the unitary vacuum limit.

## 🎛️ Inputs and a first experiment

1. Load **NuFIT 6.1 · normal**, then **Use this point as comparison**.
2. Vary the Dirac phase δ. Compare the νμ → νe and antineutrino curves against
   L/E in km/GeV, and inspect the Jarlskog invariant.
3. Change the lightest mass or select inverted ordering. Read the three masses,
   their sum, light-sector mβ and mββ, then expand the mass and Yukawa matrices.
4. Vary either Majorana phase. In this vacuum approximation these phases cancel
   from oscillation probabilities, while they can change the light-sector mββ.
5. Change one of the three active deficits and inspect the reconstructed couplings
   and heavy-state flavour weights. The plotted probabilities retain their stated
   unitary limit; they do not become a full nonunitary propagation calculation.

The controls use sin²θ₁₂, sin²θ₂₃ and sin²θ₁₃, phases in degrees, a lightest
mass in eV, Δm²₂₁ in units of 10⁻⁵ eV² and the atmospheric splitting input in
units of 10⁻³ eV². The ring parameters are shared with the base model above the
card. Normal and inverted ordering have explicit mass conventions in
[`nfModel`](../src/modules/neutrino_flavour.mjs).

## 🔬 Construction and outputs

| Quantity | What is implemented |
|---|---|
| Light sector | Three selected masses and a complex PMNS matrix; mass rank and reconstructed light Majorana mass matrix |
| Sterile sector | Three copy-diagonal rings, with six quasi-Dirac pairs per copy: 18 heavy pairs in this extension |
| Couplings | Active Yukawa columns aligned with conjugate PMNS columns; each copy's Dirac and Majorana inputs reconstructed from its selected light mass and deficit |
| Mixing diagnostics | The active-deficit matrix and the electron/muon/tau weight of each heavy pair |
| Light observables | Σmᵢ, mβ, light-sector mββ and the Jarlskog invariant |
| Vacuum propagation | 161 samples of νμ → νe and antineutrino appearance over L/E = 0–2000 km/GeV, in the unitary limit |
| Reference comparison | Selected inputs compared separately with the recorded NuFIT one-parameter ranges |
| Exports | Research summary, JSON including assumptions and matrices, and SVG figures; saved comparisons accompany the JSON |

The implementation is an inverse construction at tree level and leading Majorana
order. Masses and angles are inputs. Their reconstruction is not a prediction or
a joint likelihood fit. Copy-changing interactions are set to zero by the ansatz;
their absence is not derived from a protective symmetry.

The recorded [NuFIT 6.1 table](https://www.nu-fit.org/sites/default/files/v61.tbl-parameters.pdf)
is the November 2025 IC24 selection with Super-Kamiokande atmospheric data. The
source record retains its retrieval limitation: indexed on 6 October 2026, while
direct access to the PDF server timed out. Its separate 3σ intervals are not a
multidimensional confidence region. The Hosotani preset transfers historical PMNS
inputs; it does not implement that paper's complete warped action.

Radiative flavour stability, vacuum re-minimization with three copies, matter
effects, a full nonunitary oscillation likelihood, detector event rates and
heavy-exchange contributions to neutrinoless double beta decay remain open.
The [CMS HNL comparison](neutrino-ring.md#experimental-reference-inside-the-same-panel)
and [decay card](neutrino-decays.md) retain their own base-ring hypotheses.

## 🌌 IceCube context and a possible extension

The Nobel Prize in Physics 2026 recognizes Francis Halzen's contributions to
IceCube and the discovery of high-energy astrophysical neutrinos, as reported by
[the IceCube collaboration on 6 October](https://icecube.wisc.edu/news/awards/2026/10/francis-halzen-icecube-principal-investigator-wins-2026-physics-nobel-prize/).
This provides context for exploring neutrino astronomy; it does not validate this
laboratory's ring model. The [2015 Nobel Prize](https://www.nobelprize.org/prizes/physics/2015/press-release/)
recognized the discovery of neutrino oscillations showing that neutrinos have mass.

A useful **future extension, not currently implemented**, would connect chosen
source flavour compositions to Earthly compositions after averaged propagation,
then add a specifically versioned IceCube data comparison. Matter effects, energy
and direction dependence, detector response and the selected dataset's likelihood
would need their own calculations and validation before inferring constraints.
The existing unitary vacuum curves provide a starting point, not an IceCube fit.

[🧭 Complete laboratory map](laboratory-inventory.md) ·
[🧬 Base ring](neutrino-ring.md) · [✨ Majoron channels](neutrino-majoron.md)
