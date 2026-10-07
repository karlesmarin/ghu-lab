# Majoron channels in the neutrino ring

The Simulator computes a massless physical Majoron at conserving order. Enable
its channels in the existing decay card to include them in the scenario width.
The reference setting leaves them disabled so earlier benchmarks remain readable.
This switch does not assert that the physical channel is absent.

For scalar phase order (Φ0,…,Φ4,χ,Σ), the kinetic metric is
W = diag(f²,f²,f²,f²,f²,w²,s²), with VEVs equal to the scales divided by √2.
The invariant phase rows are (1,1,1,1,1,0,0) and (2,2,0,0,0,2,1).
Writing K = (R W⁻¹ Rᵀ)⁻¹, the normalized direction at fixed collective phase is
t = W⁻¹ Rᵀ K[:,β]/√Kββ. It satisfies G W t = 0 and tᵀ W t = 1.

Fβ² = [24/(5f²) + 4/w² + 1/s²]⁻¹ and FJ = 2Fβ.
For equal VEV scales the tangent is (6,6,−4,−4,−4,10,5)/(7√5 f).
Thus varying arg Σ alone is not the canonically normalized Majoron.

The phase vertex obeys dM/dJ = −i(QM+MQ). In the conserving singular basis,
for a heavy daughter j, the partial width per parent pair component is
(QL² + QR²)(Mi²−Mj²)³/(32π Mi³). The light chiral channel is
QL² Mi³/(32π). The code subtracts the common identity charge only from
off-diagonal conserving matrix elements. It does not apply that subtraction
to a Majorana mass insertion. Heavy daughter components are both summed.

Changing χ/f or Σ/f retunes Yukawa couplings to keep the fermion matrix fixed.
The scalar vacuum is assumed, not minimized. Finite Majorana corrections,
intrapair emission at higher order, radial and collective-phase scalars, new
gauge bosons and weak cascades remain outside these partial widths.
The width divided by the nearest pair separation flags when the isolated-pair
SS/OS diagnostic needs a treatment with multiple overlapping states.

Validation uses 75-digit full signed 13-Weyl pole calculations and an independent
SageMath gamma-matrix spin trace and quotient-metric calculation. The conventional
singlet-Majoron interaction is documented by
[Heeck and Patel](https://arxiv.org/abs/1909.02029); the gauged-ring projection here
is specific to the stated research action and is not a fit to that singlet model.
