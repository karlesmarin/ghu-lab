# Joint U(2) arithmetic

Eight Lean 4.27.0 theorems certify a quadratic integrality criterion and witnesses, including rational coefficients encoded with a common nonzero denominator. Run `python verify_lean.py --check` here. Source, axiom-dependency report and kernel output are included.

Q(m,n)=b0(m−n)²/4+b1(m+n)²/8 is integral for every integer pair iff b0 is integral and b1+2b0 is divisible by eight. The witness (b0,b1)=(1,6) gives m²+mn+n². The scalar example does not construct an anomaly-free supergravity spectrum. The translation to the cocharacter lattice is external to Lean. Additional hypotheses of a physical application require separate analysis.

The original full-subgroup audit is also included: `sage -python sage_audit.py --check` (SageMath 10.9), `node lab_crosscheck.mjs --check`, the saved reports and the byte-preserved inputs listed in `inputs.json`. Its polynomial matching, virtual-representation index density and parent-span calculations retain their stated assumptions. They are not a construction of the full orbifold action or a bordism computation. The input paths labelled `original` are historical provenance; replay reads the adjacent `local` files.
