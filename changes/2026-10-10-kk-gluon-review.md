---
date: 2026-10-10
part: instrument
severity: correction
affects_record: yes
title: The KK-gluon card after an external review — nine bulk masses, the ATLAS control with its chiral couplings, and certificates that can fail
verify: open **Collider → First KK gluon at the LHC** and press **Published RS point (arXiv:0807.4937)**. r(tt̄) at 3.75 TeV reads 0.96 (it read 0.98), and the m(tt̄) paragraph now gives three Δχ²: 3.2 with the SM-theory uncertainty uncorrelated between bins, 5.6 with it as one correlated normalisation, 5.6 with the experimental covariance alone. The certificate tt_control says 1 to 4 TeV, not 1 to 5.
---

what

An independent review of the laboratory found six defects in the KK-gluon card and its harnesses; each was reproduced
here before it was fixed.

- **The published RS point was a reduced one.** The card set Q₂ = Q₁ and d₁ = d₂ = u₁. It now carries all nine bulk
  masses of arXiv:0807.4937, still in the flavour-diagonal zero-mode approximation without mass-basis rotations. At
  3.75 TeV this moves σ × BR(tt̄) by 1.2% and the dijet σ × B by 19%; the tt̄ crossing moves from 3.73 to 3.72 TeV.
- **The ATLAS control ran the wrong chirality.** ATLAS's benchmark has g_tL = g_s and g_tR ≈ 4 g_s; the harness used
  the vector top threshold. With the benchmark's couplings, our LO curve falls from 1.11 to 0.82 of ATLAS's between 1
  and 5 TeV: within 15% from 1 to 4 TeV, 15–18% low at 4.5–5 TeV. The vector threshold had inflated the low tail and
  kept 5 TeV inside 15%. The mass slope is not explained; 4.5–5 TeV is pinned as a known deviation.
- **The live reference check could not fail.** With an empty reference it returned perfect agreement, having compared
  nothing. It now counts its comparisons, reads an empty block or a non-finite difference as a failure, and judges the
  result by the harness's own tolerances.
- **The covariance solve accepted a non-symmetric matrix**, reading only its lower triangle. It now refuses one.
- **A resonance with no top coupling gave NaN** (0·0/0) instead of zero.
- **The dijet certificate said 4% and its harness tested 5%.** The real worst case is 3.85%; the harness now tests 4%.

why

A certificate that cannot fail certifies nothing, and a control run with the wrong couplings passes for the wrong
reason. The review found both; neither was visible from inside, because every harness was green.

so

The labels say what is assumed. The m(tt̄) sensitivity rests on a 10% SM-theory uncertainty that this tool chooses:
it is now shown both uncorrelated and fully correlated, since CMS correlates its theory errors and the answer depends
on that choice. The same K-factor for SM, octet and interference is stated as assumed, not validated. α_s is labelled
as run at one loop from its value at M_Z; `tools/alphas_table_check.py` measures it against the PDF set's own table:
0.55–0.72% higher between 0.5 and 8 TeV (data/alphas_table_check.txt). Each fix has a negative control in its
harness: an empty, corrupted or NaN reference fails; a non-symmetric matrix is refused; zero top coupling gives zero.
The build now prints FAILED beside a harness that dies on an assertion, instead of "(no output)".
