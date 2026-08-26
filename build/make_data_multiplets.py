#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""make_data_multiplets.py -- the layer BELOW the term tables: multiplets and their parities.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

WHAT THIS ADDS.  `data/su7_km25.json` carries term tables -- `gauge = [[-1,1,2],[-2,1,1],
[-3.5,-1,1]]`, and `(m, s, c)` triples per representation.  Those are AGGREGATES, and they were
transcribed.  Underneath them sits the layer the paper actually derives them from: the
decomposition of each representation into multiplets of SU(3)_C x SU(2)_L, each tagged with its
three Z2 parities.  This file encodes that layer, and then DERIVES the term tables from it.

Three things fall out of one addition:

  1. the term tables stop being quoted and start being computed -- and the derivation is checked
     against the tables already shipped, which is a control that can fail;
  2. the zero-mode spectrum by parities, which is what a reader outside this series needs and
     what nobody can currently get without redoing it by hand;
  3. the split of the gauge sector by P6, and with it the fact that one adjoint fermion 48(+,+)
     cancels the gauge contribution identically in the periodic sector.

THE RULES, from the paper, with equation numbers:

  charge      a multiplet of SU(2)_L dimension r sits at Wilson-line charges c = r-1, r-3, ...
              down to 1 (a c = 0 piece is a constant and drops).  Their eq. (71) states the r-1
              term and then adds, in the note below it, "we have to sum the potential from 4 and
              2 for 4" -- the same rule, written for the one case they need.  Implemented in
              general, because outside this series r > 4 occurs.
  sign        s = eta_R * eta'_R * P5 * P5'  (their eq. (72)).  For the gauge field there is no
              (eta, eta'), so s = P5 * P5' (their eq. (58)).
  weight      one 6D Dirac multiplet weighs 2 in units of 3k/(128 pi^8 R5^6), which is the unit
              their eq. (68) is written in; the gauge weighs 2 per multiplet in the P6 = +1
              sector and 1/2 in the P6 = -1 one.  The tables in su7_km25.json are HALF of that
              (one Dirac multiplet weighs 1), and the check below uses that convention.

SOURCE.  Komori & Maru, "SU(7) Grand Gauge-Higgs Unification", arXiv:2503.04090:
  eq. (41) the 7, eq. (57) the adjoint 48, eq. (69) the 28, eq. (70) the 84, eq. (68) the gauge
  sector, eqs. (71)-(72) the potential, eqs. (73)-(76) the assembled term tables.

  python build/make_data_multiplets.py
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE.parent / "data"
OUT = DATA / "su7_multiplets.json"

# Each multiplet is (label, sign of P6, sign of P5, sign of P5', colour dim, SU(2) dim r).
# For a fermion representation R the three signs are relative to (xi_R, eta_R, eta'_R), exactly as
# the paper prints them; for the gauge sector they are absolute.  Only the SU(2)-nontrivial
# multiplets carry Wilson-line charge, but the singlets are kept because the zero-mode spectrum
# needs them.
DECOMP = {
    "7": {  # eq. (41)
        "equation": "(41)",
        "multiplets": [["(3,1)", +1, -1, -1, 3, 1],
                       ["(1,2)", -1, -1, +1, 1, 2],
                       ["(1,1)", -1, +1, -1, 1, 1],
                       ["(1,1)'", -1, +1, +1, 1, 1]],
    },
    "28": {  # eq. (69)
        "equation": "(69)",
        "multiplets": [["(3,2)", -1, -1, +1, 3, 2],
                       ["(1,3)", +1, -1, -1, 1, 3],
                       ["(1,2)", +1, +1, -1, 1, 2],
                       ["(1,2)'", +1, +1, +1, 1, 2]],
    },
    "48": {  # eq. (57), the adjoint -- printed with absolute parities because the gauge field
             # uses the same decomposition.  Only the SU(2)-nontrivial part is listed there.
        "equation": "(57)",
        "multiplets": [["(1,3)", +1, +1, +1, 1, 3],
                       ["(1,2)", +1, -1, +1, 1, 2],
                       ["(1,2bar)", +1, -1, +1, 1, 2],
                       ["(1,2)'", +1, -1, -1, 1, 2],
                       ["(1,2bar)'", +1, -1, -1, 1, 2],
                       ["(3,2bar)", -1, +1, -1, 3, 2],
                       ["(3bar,2)", -1, +1, -1, 3, 2]],
    },
    "84": {  # eq. (70)
        "equation": "(70)",
        "multiplets": [["(6,2)", -1, -1, +1, 6, 2],
                       ["(3,3)", +1, -1, -1, 3, 3],
                       ["(3,2)", +1, +1, +1, 3, 2],
                       ["(3,2)'", +1, +1, -1, 3, 2],
                       ["(1,4)", -1, -1, +1, 1, 4],
                       ["(1,3)", -1, +1, -1, 1, 3],
                       ["(1,3)'", -1, +1, +1, 1, 3],
                       ["(1,2)", -1, -1, +1, 1, 2],
                       ["(1,2)'", -1, -1, +1, 1, 2],
                       ["(1,2)''", -1, -1, -1, 1, 2]],
    },
}

# The gauge sector runs over the SAME multiplets as the adjoint, eq. (57), with absolute parities
# and no (eta, eta').  Its weight per multiplet differs between the two P6 sectors: that asymmetry
# is what their eq. (68) is written with, and it is the whole reason a single 48(+,+) cancels the
# periodic part and leaves the antiperiodic one.
GAUGE_WEIGHT = {"periodic": 1.0, "antiperiodic": 0.25}   # su7_km25.json convention (Dirac = 1)


def charges(r):
    """c = r-1, r-3, ... > 0.  Their eq. (71) and the note below it, in general."""
    return [c for c in range(r - 1, 0, -2)]


def terms_of(multiplets, eta=+1, etap=+1, weight=None):
    """(m, s, c) table: sign s = eta*etap*P5*P5', charge from r, multiplicity = colour dim."""
    acc = {}
    for _lab, p6, p5, p5p, dim, r in multiplets:
        s = eta * etap * p5 * p5p
        w = dim * (weight(p6) if weight else 1.0)
        for c in charges(r):
            acc[(s, c)] = acc.get((s, c), 0.0) + w
    return sorted(((m, s, c) for (s, c), m in acc.items() if m),
                  key=lambda t: (-t[2], -t[1]))


def agg(t):
    out = {}
    for m, s, c in t:
        out[(s, c)] = out.get((s, c), 0.0) + m
    return {k: v for k, v in out.items() if abs(v) > 1e-12}


def same(a, b, tol=1e-9):
    """Equal as POTENTIALS: aggregated channel by channel, not term by term.

    The shipped 84 table keeps the quadruplet's smaller eigenvalue as its own entry, (1,-s,1)
    beside (11,-s,1), because su7_anchor_mh.py has an `r4` flag that turns it off; the
    decomposition produces the single (12,-s,1) they sum to.  Same potential, different
    bookkeeping, and comparing term by term would call that a failure -- which it is not.
    """
    ka, kb = agg(a), agg(b)
    return ka.keys() == kb.keys() and all(abs(ka[k] - kb[k]) < tol for k in ka)


def main():
    km = json.loads((DATA / "su7_km25.json").read_text(encoding="utf-8"))
    fails = []
    print("=" * 88)
    print("CONTROL -- do the multiplets reproduce the term tables already shipped?")
    print("=" * 88)
    print("   rep   parities   derived from the decomposition          shipped in su7_km25.json")

    for rep, blk in DECOMP.items():
        for tag, (eta, etap) in (("(+,+)", (+1, +1)), ("(+,-)", (+1, -1))):
            want = km["reps"].get(rep, {}).get(tag)
            if want is None:
                continue
            want = [tuple(t) for t in want]
            got = terms_of(blk["multiplets"], eta, etap)
            ok = same(got, want)
            fails += [] if ok else [f"{rep}{tag}"]
            g = " ".join(f"({m:g},{s:+d},{c})" for m, s, c in got)
            w = " ".join(f"({m:g},{s:+d},{c})" for m, s, c in want)
            print(f"   {rep:>3}   {tag}      {g:<38}  {w}   {'ok' if ok else '*** NO ***'}")

    print()
    gauge_got = [(-m, s, c) for m, s, c in
                 terms_of(DECOMP["48"]["multiplets"], +1, +1,
                          weight=lambda p6: GAUGE_WEIGHT["periodic" if p6 > 0 else "antiperiodic"])]
    gauge_want = [tuple(t) for t in km["gauge"]]
    ok = same(gauge_got, gauge_want)
    fails += [] if ok else ["gauge"]
    print(f"   gauge, eq. (68), from eq. (57) with weight "
          f"{GAUGE_WEIGHT['periodic']} / {GAUGE_WEIGHT['antiperiodic']} by P6:")
    print(f"      derived  {' '.join(f'({m:g},{s:+d},{c})' for m, s, c in gauge_got)}")
    print(f"      shipped  {' '.join(f'({m:g},{s:+d},{c})' for m, s, c in gauge_want)}"
          f"   {'ok' if ok else '*** NO ***'}")

    print()
    print("   doublet count per representation (the hand count: 1, 5, 10, 16):")
    for rep, blk in DECOMP.items():
        n = sum(dim for _l, _6, _5, _5p, dim, r in blk["multiplets"] if r == 2)
        n += sum(dim for _l, _6, _5, _5p, dim, r in blk["multiplets"] if r == 4)  # smaller eigenvalue
        print(f"      {rep:>3}: {n}")

    print()
    print("=" * 88)
    if fails:
        print(f"*** FAILED: {', '.join(fails)} -- the decomposition does not reproduce the "
              f"tables; NOT written ***")
        print("=" * 88)
        sys.exit(1)

    payload = {
        "source": "Komori & Maru, arXiv:2503.04090",
        "equations": {r: b["equation"] for r, b in DECOMP.items()},
        "note": ("Multiplets of SU(3)_C x SU(2)_L with their three Z2 parities.  For a fermion "
                 "representation the signs are relative to (xi_R, eta_R, eta'_R) as the paper "
                 "prints them; the 48 is eq. (57), printed with absolute parities because the "
                 "gauge sector shares the decomposition.  Charges are c = r-1, r-3, ... > 0 "
                 "(eq. (71) and the note below it).  Sign s = eta*eta'*P5*P5' (eq. (72)); for the "
                 "gauge field s = P5*P5' (eq. (58))."),
        "fields": ["label", "P6", "P5", "P5p", "colour", "r"],
        "gauge_weight": GAUGE_WEIGHT,
        "decomposition": {r: b["multiplets"] for r, b in DECOMP.items()},
        "produced_by": "ghu-lab/build/make_data_multiplets.py",
        "verified_against": "data/su7_km25.json reps + gauge, term table by term table",
    }
    # One group, one file -- the rule build_app.py states ("Every group is a file").  The block
    # goes INSIDE su7_km25.json, next to the term tables it derives, rather than becoming a second
    # dataset the shell would have to learn about.
    km["multiplets"] = payload
    (DATA / "su7_km25.json").write_text(json.dumps(km, indent=1) + "\n", encoding="utf-8")
    print(f"ALL CONTROLS PASSED -- wrote the `multiplets` block into data/su7_km25.json "
          f"({len(json.dumps(payload))} bytes)")
    print("=" * 88)


if __name__ == "__main__":
    main()
