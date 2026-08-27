---
date: 2026-08-27
part: VII
severity: note
affects_record: no
title: A verdict can have no subject — the true-vacuum flag was a boolean where three answers were needed
verify: load 2 × 7(+,+) in the hierarchy section — 8D = −39 < 0 with 2W = +1 > 0, so there is no electroweak breaking at all; the exported card now reads `state: no-electroweak-breaking` and `true: null` where it used to read `true: true`. `tests/run.mjs`, which ships with the page, pins it against the Python engine, and the globality half no longer rests on any positional tolerance
---

what
: A second outside audit read the corrected source and found the correction's own edge. The
  verdict had become `true: symmetricOK && deepest !== false` — right whenever there was
  something to test, and wrong whenever there was not. `deepest` is `null` on every content that
  never reaches the minimiser, and in this language `null !== false` is `true`. So a content with
  **no electroweak breaking** and W > 0 exported `alpha_min: no electroweak breaking` next to
  `vacuum.true: true`. The auditor built it from this page's own coordinates: **2 × 7(+,+)**,
  where the gauge seed gives 8D = −27, 2W = −3 and each 7(+,+) adds 8D = −6, 2W = +2, so
  8D = −39 < 0 and 2W = +1 > 0. Reproduced here to every digit, and the Python engine of Part VII
  now produces that row into `tests/reference_models.json` so a reader can check the null against
  an implementation that shares no line of code with the page. The screen was never wrong — it
  said "But D ≤ 0, so there is no interior minimum for it to be the vacuum of" — but the screen
  is not what a third party reads. `vacuum.true` is now one of `{true, false, null}` beside a
  named `state`: `true-vacuum`, `false-vacuum`, `no-electroweak-breaking`, `no-branch-located`,
  `undetermined`. Null is not a verdict, and it no longer pretends to be one.

  The same audit asked for the globality half to stop resting on a **positional** tolerance —
  it decided the branch was the deepest point if `|α_global − α_closed| < 0.02` *or* the gap in F
  was negligible. The closed form is an expansion, accurate to 0.71 % under the largest α of
  their Table 1 and to 20 % out at α = 0.229, so a fixed window in α is a guess about how wide a
  basin is. It is gone. The closed form now only **locates** the basin: `localMin` walks downhill
  from it to the minimum it is about, `numericMin` finds the deepest point with no bracket at
  all, and the verdict is F against F at two numerically refined minima. On their five rows the
  two points coincide to better than 10⁻⁶; on the 2026-08-26 counterexample they are 0.0839 and
  0.5660, and F is lower at the second by 1.07.

why
: The first is the honesty floor read at the wrong layer. The instrument had learned that a
  necessary condition is not a sufficient one, wrote the two halves, and then joined them with an
  operator that cannot tell "no" from "not asked" — a three-valued question answered in a
  two-valued type. The second is the same instinct as the first correction, applied one level
  deeper: a tolerance in α is a claim about the potential's shape, made where a comparison of two
  computed depths was available for the same cost.

so
: No printed number moves and the frozen record is untouched: every published row has a branch,
  and on all five the refined branch minimum *is* the global one. What moves is what the
  instrument exports about contents that break nothing — and the standard the globality half is
  held to. Both are pinned: `_test_hierarchy.mjs` fails on the old boolean and on a `localMin`
  that returns its input, and the shipped `tests/run.mjs` now checks that a reference row with no
  electroweak point makes the page claim neither vacuum. Fired both on purpose before believing
  them.
