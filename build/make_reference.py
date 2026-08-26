#!/usr/bin/env python3
"""make_reference.py — the golden suite, produced by the PYTHON engine, for the public repo.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Emits tests/reference_models.json: for a spread of SU(7) bulk contents, the numbers a second
  implementation produces — moments, W, the closed form, the DIRECT global minimum of F, and the
  Higgs mass — so that `node tests/run.mjs` in the deployed repository can hold the shipped
  page to an engine that shares no line of code with it.

WHY THIS FILE EXISTS.  A referee reading the deployed repository sees one 542 kB HTML file and
the July builders; the sixteen harnesses and their 856 checks live in a working tree that is not
published, so from outside they do not exist.  A guard nobody can see is a guard nobody believes.
This ships the evidence with the artifact: reference numbers from the Python engine of Part VII,
and a runner that pulls the engine out of app/index.html and compares.

The contents are chosen to make the suite capable of failing:
  - the five published rows (their Table 1)
  - THE COUNTEREXAMPLE of the 2026-08-26 audit: W > 0 and yet the small-alpha branch is not the
    deepest point of F -- the case that proves the true-vacuum verdict needs two halves
  - a false vacuum by W alone, a content that does not break, and the window tile of the atlas

  python build/make_reference.py
"""
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sources import root as _sources_root, provenance                   # noqa: E402
SRC = _sources_root("the reference (Python) engine") / "part_vii"
ENGINE = SRC / "amin_closed_form.py"
if not ENGINE.exists():
    sys.exit(f"FATAL: the reference engine is not there: {ENGINE}")

_ns = {"__file__": str(ENGINE)}
exec(ENGINE.read_text(encoding="utf-8")
     .split("# ---------------------------------------------------------------- run")[0], _ns)
table, F, numeric_min = _ns["table"], _ns["F"], _ns["numeric_min"]
moments, closed_form, T1 = _ns["moments"], _ns["closed_form"], _ns["T1"]

MW, G4 = 80.4, 0.63
KC = (3 ** 0.5) / (2 * 3.141592653589793 ** 3) * MW * G4


def fval(content, alpha):
    """F at one phase, as a plain float -- the engine's basis() is vectorised and returns arrays."""
    import numpy as np
    return float(np.asarray(F(content, alpha)).ravel()[0])


def stability_W(content):
    """W = sum over ODD charges of m(-s) -- Part VII eq. (34)."""
    return sum(m * (-s) for m, s, c in table(content) if c % 2 == 1)


def row(name, content, note):
    mo = moments(content)
    D, A4 = mo["D"], mo["A4"]
    a, _ = closed_form(content)          # the engine returns (alpha, moments)
    ag = numeric_min(content)
    out = {
        "name": name, "note": note,
        "content": [{"rep": r, "parities": [e, ep], "multiplicity": m} for r, e, ep, m in content],
        "D": D, "A4": A4, "8D": 8 * D, "W": stability_W(content),
        "alpha_closed": a, "alpha_global": ag,
        "F_at_closed": None if a is None else fval(content, a),
        "F_at_global": None if ag is None else fval(content, ag),
        "F_at_1_minus_F_at_0": fval(content, 1.0) - fval(content, 1e-9),
    }
    if a is not None and D > 0:
        x = 3.141592653589793 * a
        fpp = 3.141592653589793 ** 2 * (2 * 1.2020569031595942854 * D - A4 * x * x / 6)
        out["F_second"] = fpp
        out["m_h"] = KC * (fpp ** 0.5) / a if fpp > 0 else None
    return out


ROWS = []
for tag, cont, a_t, mh_t, iR_t in T1:
    ROWS.append(row(f"published row {tag}", cont,
                    "their Table 1; published alpha_min %.4f, m_h %.1f GeV" % (a_t, mh_t)))

# THE COUNTEREXAMPLE.  W > 0 -- so the symmetric-point criterion passes -- and the small-alpha
# branch is nonetheless not the deepest point of F.  Found by an outside audit on 2026-08-26.
ROWS.append(row("audit counterexample", [("7", 1, 1, 1), ("48", 1, -1, 1), ("84", 1, 1, 1)],
                "W > 0 and yet NOT the global vacuum: the case the 'true vacuum' verdict has to "
                "get right, and did not before 2026-08-26"))
# a false vacuum by W alone, from the ceiling's own attained witness family
ROWS.append(row("false vacuum by W", [("28", 1, -1, 9)],
                "W < 0: deeper at the other symmetric point, before any interior question"))
ROWS.append(row("no electroweak breaking", [("7", 1, 1, 1)],
                "D <= 0: the symmetric point is a minimum and there is nothing to minimise"))

OUT = {
    "what": "reference numbers for the SU(7) Komori-Maru model, produced by the Python engine of "
            "Part VII (amin_closed_form.py, which extracts terms() and GAUGE from "
            "part_vi/su7_anchor_mh.py). The shipped page must reproduce them.",
    "conventions": {"m_W": MW, "g4": G4, "K": KC,
                    "note": "alpha is the Wilson-line phase; F is the one-loop potential summed "
                            "over windings; 8D and A4 are the two quantised moments"},
    "produced_by": "ghu-lab/build/make_reference.py against " + provenance(ENGINE),
    "rows": ROWS,
}
out = HERE / "tests" / "reference_models.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(OUT, indent=1), encoding="utf-8", newline="\n")
print(f"wrote {out}  ({len(ROWS)} contents)")
for r in ROWS:
    print(f"  {r['name']:<26} 8D={r['8D']:>6.2f}  W={r['W']:>6.2f}  "
          f"a_closed={r['alpha_closed'] if r['alpha_closed'] is None else round(r['alpha_closed'], 6)}  "
          f"a_global={r['alpha_global'] if r['alpha_global'] is None else round(r['alpha_global'], 6)}")
