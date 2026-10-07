# Neutrino ring: conditional decay diagnostics

The existing Simulator → Neutrino ring includes widths, lifetime, flight-distance
probability and pair coherence. This is a conditional scenario built on the existing
conserving masses and active weights. The complete ring width is **unknown**.
No experimental exclusion or detector efficiency is calculated.

The on-shell reference has W plus a charged lepton, Z plus the light neutrino, and
an unmixed Standard Model Higgs plus the light neutrino. The same additional width
in eV can be assigned to each component of every heavy pair. Its value is an input,
not a prediction for the Majoron or other new particles. Zero does not demonstrate
that those channels are absent.

## Width normalization

For a pair of centre mass M and pair-summed active weight U², each Majorana
component has U²/2 at the displayed order. Adding charge-conjugate channels gives
the Dirac-width normalization evaluated with U². The displayed Γ is the width of
**one component**, not the sum of two widths. The CMS Dirac/Majorana reference
selector cannot change it.

Let A = G_F M³ U²/(8√2π), x_B = m_B²/M², y = m_l²/M², and z = 1 − deficit.
In GeV, the implemented light-final-state widths are

```text
ΓW = A √λ(1,xW,y) [(1−y)² + xW(1+y) − 2xW²]    if M > mW + ml
ΓZ = A z/2 (1−xZ)²(1+2xZ)                       if M > mZ
Γh = A z/2 (1−xh)²                              if M > mh
λ(1,x,y) = (1−x−y)² − 4xy
```

Closed channels contribute zero to this partial sum. The light-neutrino mass is
neglected; charged-lepton masses are retained. The neutral-current light residue
z follows from the conserving active projector. For an unmixed SM Higgs, the
Dirac-matrix active row gives the same light-heavy residue. The high-mass, z→1
fractions approach 1/2, 1/4, 1/4. Scalar mixing could change the h channel.

[Atre et al.](https://arxiv.org/abs/0901.3589), eqs. (3.13–3.21), supply the
standard weak-channel normalization. The charged-lepton mass extension is checked
independently by exact four-component spin traces in SageMath. This laboratory's
factor z is the conserving ring's light residue, not a fit to three flavours.

## Lifetime and ideal coherence

The chosen scenario sets Γ = ΓW + ΓZ + Γh + Γextra, converts eV to GeV, and uses
τ = ℏ/Γ and cτ in mm. At a fixed input b = βγ, the mean straight-line flight
distance is b cτ. Between Lmin and Lmax the probability is

```text
P = exp(−Lmin/(b cτ)) − exp(−Lmax/(b cτ)).
```

This is not a transverse detector radius, a boost distribution, a branching-weighted
event yield or a detector acceptance. `expm1` preserves very small window probabilities.
A zero included width returns undefined lifetime/probability, never a stability verdict.

For an isolated coherent pair of equal widths, CP conservation, and integration over
all proper times, [Anamiati, Hirsch and Nardi](https://arxiv.org/abs/1607.05641),
eq. (31), gives SS/OS = Δm²/(2Γ²+Δm²). The same-sign fraction among those two charge
classes is SS/(SS+OS) = (SS/OS)/(1+SS/OS); these are different numbers.
The flight-window probability does not turn the all-time ratio into a selected-event
ratio. Inter-pair interference and unequal-width effects remain unresolved.

## Scope, sources and validation

Off-shell weak decays, heavy-to-heavy cascades, loops, the Majoron, collective phase,
radial scalars and extra gauge channels are not included. The panel lists lower-pair
Z/h thresholds without assigning rates. It flags near/below-W inputs, zero active
production, large insertion/gap diagnostics and broad scenarios. Such flags are
diagnostics, not error bounds. No value of the extra-width control resolves this
missing action-level calculation.

Masses reuse `EXPERIMENT` with its recorded source editions: W 80.3692 GeV,
Z 91.1876 GeV, h 125.20 GeV, μ 0.1056583755 GeV, τ 1.77693 GeV.
The [PDG 2025 constants table](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-phys-constants.pdf)
supplies G_F = 1.1663785×10⁻⁵ GeV⁻² and electron mass 0.00051099895069 GeV.
ℏ is evaluated from exact SI h and elementary charge; c is exact. These are fixed
reference central values, not an uncertainty propagation or a claim to use the
latest edition of every mass. All sources and constants travel with JSON exports.

The 75-digit reference file contains 24 threshold/flavour points, 18 widths from
three independently diagonalized ring spectra, and four numerical proper-time
integrals. The module harness also checks thresholds, units, channel normalization,
zero mixing, added widths, invalid inputs and flight windows. SageMath 10.9 checks
exact spin traces, the component normalization, the coherent ratio and 256-bit Arb
unit conversions. Browser checks exercise the actual controls, all three SVG exports,
result-card exports, permalinks, undefined cases, and desktop/mobile layout.

## Visual use

The three SVG figures share controls and results. Select a pair using the channel
bars or arrow keys. The coherence figure sweeps the existing μB parameter; clicking
it updates the complete experiment. Its vertical scale adapts and is explicitly
labelled. The flight curve shows physical mm at the chosen boost, shades the visible
portion of the chosen window, and reports the complete probability separately.
Figure metadata includes the model inputs, scenario, source data and plotted samples.
The JSON/text/LaTeX card retains the calculation and explicit unknown quantities.
