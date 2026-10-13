# Quantization: scoped arithmetic and reproducible diagnostics

The eight theorems in GHUQuantization.lean and seven in SpinPeriod.lean are checked with Lean 4.27.0 (import Lean, no Mathlib). They formalize integer arithmetic, not the topology of characteristic classes, the Wu formula, orbifold bundle admissibility or a complete physical theory.

Run from this folder:

    python verify_lean.py --check
    python verify_spin.py --check
    node test_lab.mjs --check
    node test_spin.mjs --check
    sage -python sage_audit.py --check
    sage -python residue_prior_art_checks.py

Sage 10.9 was used for the archived reports. The 81 centered-root fixtures contain 405 periods; 729 tensor samples and 3625 axion-coupling samples are implementation checks, not universal proofs. The cyclotomic audit contains 527 finite cases. The exact runtime wrapper is generated from the two preserved .mjs modules; the app gate cross-checks their outputs.

For H=S(U(2)×U(3)), A=c2(E2), B=c2(E3), C=Y² and Y=c1(E3)=−c1(E2), set δ=γ−α/4−β/3. Universal integrality requires α,β,δ integral. Ordinary closed spin-4 periods require α,β,2δ integral; the topology of the generators is external to Lean.

With an inherited lower-wall mixed coefficient −8A/3 and integral ordinary GS sources, the transfer v=(8/3−p/2,−q/2,−r/2) cannot lie in the rational span of (−2,0,1),(0,−2,1). Its annihilator gives 6ℓ(v)=16−3p−3q−6r=1 mod 3. The allowed orbifold backgrounds, additional responses and full global action remain open. This response class is not an identified global Z3 anomaly. The isolated-wall divisibility criterion reproduces Lee–Tachikawa; novelty is not established.

Primary references: arXiv:1711.04777, 2309.03937, 1705.01853, 2012.11622, 2011.10102, hep-th/0612212. See the bilingual laboratory guide for the complete input conventions and examples.
# Supplementary literature arithmetic

`python literature_checks.py --check` replays the archived charge sums, finite U(2) representation sample and the specialization comparison in arXiv:2011.10102v3. That separate specialization discrepancy has not been confirmed against the published version and is not used as a physical conclusion of the Lab or as part of the U(2) author query. This is exact arithmetic, not a proof of the cited bordism groups or eta invariants.

