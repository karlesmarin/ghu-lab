# Between physics and mathematics: boundary research

[English video · 11:34](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index.html) · [Vídeo en castellano · 11:55](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index-es.html) · [Tool documentation](../../docs/boundary-research.md) · [Certificates](certificates.json)

A small story between physics and mathematics: can three profiles be independent if each has only two components? The film follows an animated boundary profile, then builds a Gram matrix, a trace polynomial and a residue condition from visible calculations. Both editions have 29 chapters, synthetic narration and embedded captions in the selected language. The shared proofs and checker documentation below are in English. It is an explanatory companion to GHU Lab, with explicit assumptions and open physical questions.

## Reproduce the certificates

From a checkout of this repository, with Python 3.11 or later:

```text
python -m pip install -r proof/boundary-research/requirements.txt
python proof/boundary-research/certify.py --check
```

The checker recomputes the certificate and compares it with the saved JSON without overwriting it. Expected result: **113 successful checks**, including ten exact root brackets, positive Gram minors, a lower eigenvalue bound, all 55 quadratic trace coefficients, and conditional congruence checks. Some checks are independent numerical comparisons; the count is not a count of formal theorems. Run without Python's `-O` option.

To regenerate the source-engine reference and certificate deliberately:

```text
node proof/boundary-research/export_lab.mjs
python proof/boundary-research/certify.py
python proof/boundary-research/certify.py --check
```

Node.js is only needed for the optional reference export. No SageMath or Docker is required. The pinned NumPy and SciPy versions reproduce the tested environment; the exact interval and polynomial arithmetic uses Python's standard-library Fraction. The generator uses numerical roots only to propose brackets; exact rational sign bounds then certify them.

[Provenance and SHA-256 hashes](provenance.json) identify the source module, certificate, checker and reference. Hashes identify bytes; they do not themselves establish a mathematical result. No Lean or other proof-assistant formalization, complete anomaly cancellation, physical family count or Standard Model fit is claimed.

Ordinary proofs + executable certificates · no proof-assistant formalization

## Mathematical notes and certificates

These notes support the same mathematical examples in both language editions. They distinguish exact mathematical reasoning, exact finite computation and numerical checks. They concern the stated examples, not a completed quantum field theory.

### 1. Gram rank is the dimension of a span

Let f₁,…,fₙ belong to a complex Hilbert space, with inner product conjugate-linear in the first argument. Define F(c)=Σᵢcᵢfᵢ and Gᵢⱼ=⟨fᵢ,fⱼ⟩. Then G=F*F and c*Gc=‖F(c)‖². Thus ker G=ker F. Rank–nullity on the finite-dimensional coefficient space gives rank G=dim span{fᵢ}. Positivity does not require the profiles to be orthogonal.

For an independent finite family, changing basis using the positive square root of G yields orthonormal profiles. This changes their expressions, but not their span. In particular, the transformed profiles need not each remain a single exponential.

### A visible two-component example

On the unit interval take `f1=(1,0)`, `f2=(0,1)` and `f3=(u,0)`. Their Gram matrix is

```text
G = [[1,   0, 1/2],
     [0,   1,   0],
     [1/2, 0, 1/3]].
```

Its determinant is `1/3 - 1/4 = 1/12 > 0`. For `c=(-1/2,0,1)`, the combined profile is `(u-1/2,0)` and `c*Gc = integral_0^1 (u-1/2)^2 du = 1/12`. It vanishes at the midpoint but is not the zero function. This pedagogical example is separate from the exponential rectangle example used in the lab.

### 2. Three two-component profiles

f₀=(1,1)ᵀeᴹʸ,   fπ/₂=(1,i)ᵀeᴹᶻ,   fπ=(1,−1)ᵀe⁻ᴹʸ.

The space is L²([0,1]²;ℂ²); the coordinates are dimensionless. At M=0 the functions are constant, and fπ/₂=((1+i)/2)f₀+((1−i)/2)fπ. The other two are independent, so the rank is exactly two.

For M>0, suppose a f₀+b fπ/₂+c fπ=0 as an L² function. The combination is continuous, so it vanishes everywhere in the interior. Its z derivative is b M(1,i)ᵀeᴹᶻ, which forces b=0. Adding and subtracting the remaining two components gives a=c=0. Thus the rank is exactly three. The same reasoning works for any nonzero real M.

#### The essential limitation

For any finite set of distinct real angles modulo 2π and nonzero M, the vectors vⱼ=M(cos αⱼ,sin αⱼ) are distinct. Choose a line direction d avoiding the finitely many conditions (vᵢ−vⱼ)·d=0. Restrict the first components to a short line segment inside the square. Up to nonzero constant factors, they are eʳʲᵗ with distinct rates rⱼ=vⱼ·d. Differentiating a linear relation zero through n−1 times gives a Vandermonde matrix, whose determinant is ∏ᵢ<ⱼ(rⱼ−rᵢ)≠0.

Consequently this unrestricted ansatz admits arbitrarily large finite independent sets. Selecting three examples does not determine a physical multiplicity. That requires specifying which functions are in the domain of the relevant operator, the complete boundary conditions and the physical zero-mode constraints. This does not assert that an actual compactification admits an infinite physical family spectrum.

The exponential ansatz is discussed by Fujimoto et al. in **§3.1.2, equations 3.32–3.43, footnote 10 and Appendix B**. The present rank calculations and arguments have their own stated scope. This precise locator supersedes the earlier general reference to section 3.2; no numerical result depends on that editorial locator.

### 3. A rigorous positive Gram bound at M=1

For the displayed order of profiles, put A=e²−1, C=1−e⁻², b=(e−1)² and d=(1−e⁻¹)(e−1). The Hermitian Gram matrix has diagonal (A,A,C), entries G₀₁=(1+i)b, G₁₂=(1+i)d and G₀₂=0. Its leading principal minors are:

D₁=A;   D₂=A²−2b²;   D₃=A²C−2Ad²−2Cb².

The certificate encloses e and e² using positive rational Taylor sums and a geometric bound on the remaining tail; reciprocals enclose the negative exponentials. Exact interval arithmetic yields strictly positive lower bounds for all three minors. Sylvester's criterion gives positive definiteness.

If T=tr G and 0<λ₁≤λ₂≤λ₃, then λ₂λ₃≤T²/4 and λ₁=det G/(λ₂λ₃)≥4 det G/T². Using the lower determinant bound and upper trace bound certifies **λ₁>0.1105**. The numerical value, approximately 0.1729986743, is consistent with that enclosure. Raw eigenvalues depend on profile normalization; the exact rank does not.

### 4. The interval operator and its gap

Take L>0 and κ²≥0. Let Af=−f″ on the regular separated domain {f∈H²(0,L): f′(0)=0, f′(L)+κ²f(L)=0}. This defines a self-adjoint interval operator. Integration by parts gives:

⟨f,Af⟩=∫₀ᴸ|f′(y)|²dy+κ²|f(L)|².

When κ²>0, zero energy forces f′=0 and f(L)=0, hence f=0. A uniform bound can also be obtained directly: f(y)=f(L)−∫ʸᴸf′ gives ‖f‖²≤2L|f(L)|²+2L²‖f′‖². Therefore ⟨f,Af⟩≥min{κ²/(2L),1/(2L²)}‖f‖². This is an explicit positive lower bound; no fitted spectrum is needed to prove the gap.

For a positive eigenvalue k², the left boundary gives f=A cos(ky). The right condition yields k sin(kL)=κ²cos(kL). With x=kL and a=κ²L, the first positive branch satisfies x tan x=a, 0<x<π/2. Its derivative tan x+x sec²x is positive; the endpoint limits are 0 and +∞. This proves existence and uniqueness on this branch. At a=0 the first root is zero. As a→0, x∼√a; as a→∞, x→π/2. With L=πR, kR=x/π.

#### What the root certificate checks

Ten specified positive couplings have rational brackets. The checker encloses sin and cos by Taylor polynomials with real derivative bounds and checks opposite signs of x sin x−a cos x at the endpoints. The analytic branch argument supplies uniqueness. A rational enclosure of π is obtained from Machin's identity π=16 atan(1/5)−4 atan(1/239) and alternating-series bounds. These mathematical facts are explained here; they are not formalized in a proof assistant.

The operator above is the reduced normal problem of the stated flat, uniform construction. It is not a certificate of the full higher-dimensional field-theory domain or all of its sectors.

### 5. The mass landscape

(mR)²=(kR)²+(θ/2π)²,   0≤θ≤π.

This is one specified periodic paired branch with an imposed Wilson background. The laboratory shows the same 25×25 values as a heat map and a surface, with colour fixed on [0,√(1/2)]. For finite a the first normal kR is less than 1/2. The surface is not an effective potential or a vacuum selection, and it does not determine an experimental mass scale.

### 6. An exact trace identity, not a handful of probes

Enumerate the 512 sign vectors s∈{−1,+1}¹⁰ with ∏ᵢsᵢ=+1. For λ(s)=s₁s₂, the quadratic inserted moment is Σₛλ(s)(Σᵢsᵢhᵢ/2)². The checker accumulates all 55 degree-two coefficients using exact rational arithmetic.

T₂(h)=256 h₁h₂.

Every diagonal coefficient vanishes; the only surviving cross term is h₁h₂. This also follows by sign-character cancellation on the even-parity sign subgroup. Thus T₂(0,2)=0 while T₂(1,2)=512. A nonzero evaluation refutes the zero-polynomial identity; a single zero does not prove that identity. These unweighted traces omit the normalization, projectors, descent and inflow needed for physical local anomaly coefficients.

### 7. A conditional congruence

In the specified standalone six-dimensional SU(2) tensor setting, with complex Weyl doublets, write N for the signed doublet excess. The displayed condition N≡0 mod 6 is equivalent to 2N≡0 mod 12 in half-doublet units. For identical family assignments, positive quark chirality and lepton sign s=±1, N=n_g(3+s). Since 3+s is 2 or 4, the condition is equivalent to n_g≡0 mod 3.

This permits multiples of three, not uniquely three. Two differently assigned families can contribute 2+4=6; this is a counterexample to extending the identical-assignment inference to mixed assignments. It is not a claim of a fully consistent two-family model. Additional representations, group quotients and bulk inflow require their own analysis. Lee–Tachikawa §2.7 explains the role of integral tensor quantization; a factorized polynomial is not by itself a complete global consistency argument.

### 8. Reproduce the checks

```text
python -m pip install numpy scipy
python certify.py --check
```

The checker reads [lab-reference.json](lab-reference.json), generated by the published JavaScript engine. Its interval and polynomial certificates use Python Fraction arithmetic. The separate overlap check uses numerical integration and NumPy's Hermitian eigensolver. See [certificates.json](certificates.json) for the exact rational bounds and every check.

**No Lean or other proof-assistant formalization is claimed.** Executing this checker validates the finite certificates under its stated mathematical justification and software assumptions. It does not formalize the analytic theorems or certify the complete physical programme.

### Sources and scope

- [Boundary tools: equations, assumptions and API](https://github.com/karlesmarin/ghu-lab/blob/main/docs/boundary-research.md)

- [Fujimoto et al. — 6d Dirac fermion on a rectangle](https://arxiv.org/abs/1609.01413) — section 3.1.2, equations 3.32–3.43, footnote 10; appendix B; illustrative profile ansatz, not a full-domain theorem

- [Asaka, Buchmüller, Covi — Bulk and brane anomalies in six dimensions](https://arxiv.org/abs/hep-ph/0209144) — equations 41–43, 71–72; appendix D

- [Dobrescu, Poppitz — Number of fermion generations derived from anomaly cancellation](https://arxiv.org/abs/hep-ph/0102010) — equations 3–4; identical-assignment assumption

- [Lee, Tachikawa — Some comments on 6d global gauge anomalies](https://arxiv.org/abs/2012.11622) — sections 2.6–2.7 and 3.3; integral tensor quantization
