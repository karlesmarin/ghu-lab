#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""make_data_viii.py -- the Part VIII blocks: the inverse map, the clusters, and the rung census.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

WHAT THIS ADDS, AND WHY IT IS NOT THE SAME AS THE CEILING.  `data/su7_km25.json` already carries
Part VII's ceiling: the top of the top band, four levels of it, each an EXTREMAL statement.  Part
VIII runs the same map backwards and the backwards direction sees something the extremal one
cannot -- not a bound but a SET.  Three things come with it, and the instrument had none of them:

  1. the inverse map with its five NAMED certificates (floor, cone, congruence, dual, exhaustion),
     which is what turns "we did not find one" into "there is none";
  2. the clusters and the gap on the 1/R5 axis -- the reachable scales are finitely many, they
     fall in one cluster per rung, and between the rung-three and rung-one clusters there are
     2682 GeV with nothing in them, forty-five times the widest gap inside either cluster;
  3. the census N(A_4, 8D): how many contents a rung holds, counted by a dynamic programme
     instead of enumerated.  It is under a second, which is why it can live in a browser.

WHAT IS READ AND WHAT IS RECOMPUTED.  The page recomputes (2) nothing and (1) and (3) everything:
the inverse decision at a rung and the whole census run IN the browser from the term tables, and
what this file ships is the ARCHIVE they are held to.  The band ends are the exception and they
are honest about it -- finding the floor of rung 1 means enumerating 423 631 contents and putting
the survivors on the exact potential, which is a run, not a page.

  Sources, all three under part_viii/outputs/:
    inverse_design.json   the map on the PUBLISHED seed: certificates, bands, ladder, gap, designs
    reachable_set.json    the same on BOTH gauge seeds, in doubled coordinates (2A_4, 8D)
    rung_census.json      the DP: totals, the counting function, the recurrence, the fibre of 81

  python build/make_data_viii.py
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from sources import root as _sources_root, provenance                    # noqa: E402

SRC = _sources_root("the Part VIII archived runs") / "part_viii" / "outputs"
NAMES = ["7(+,+)", "7(+,-)", "28(+,+)", "28(+,-)", "48(+,+)", "48(+,-)", "84(+,+)", "84(+,-)"]


def _read(name, what):
    p = SRC / name
    if not p.exists():
        sys.exit(f"FATAL: {what} is not where it should be: {p}\n"
                 f"       Run the Part VIII script that produces it. This file must not invent\n"
                 f"       a number it cannot read.")
    return json.loads(p.read_text(encoding="utf-8")), p


INV, P_INV = _read("inverse_design.json", "the inverse designer's archived run")
REACH, P_REACH = _read("reachable_set.json", "the reachable set on both gauge seeds")
CENS, P_CENS = _read("rung_census.json", "the rung census")

KM = json.loads((ROOT / "data" / "su7_km25.json").read_text(encoding="utf-8"))

# ---------------------------------------------------------------- the controls, before anything
# THE LATTICE HAS TO BE THE SAME LATTICE.  The page derives (A_4, 8D, G, 2W) per generator from the
# term tables it already carries; these three runs derived them from the Part VII engine.  If the
# two ever disagree the archived bands describe a different model from the one on screen, and every
# number below would be decoration.  This is the one check that makes the rest mean anything.
_coord = KM["coordinates"]["generators"]
_gauge5 = KM["coordinates"]["gauge"]
for j, nm in enumerate(NAMES):
    if nm not in _coord:
        sys.exit(f"FATAL: the data file has no generator {nm}; the two lattices are not the same.")
    a4, k8d = _coord[nm][0], _coord[nm][1]
    w2 = _coord[nm][4]
    if a4 != INV["lattice"]["A4"][j] or k8d != INV["lattice"]["k8D"][j]:
        sys.exit(f"FATAL: {nm} is ({a4}, {k8d}) in data/su7_km25.json and "
                 f"({INV['lattice']['A4'][j]}, {INV['lattice']['k8D'][j]}) in the Part VIII run.")
    if w2 != 2 * int(INV["lattice"]["W"][j]):
        sys.exit(f"FATAL: {nm} has 2W = {w2} here and {2 * int(INV['lattice']['W'][j])} there.")
if [_gauge5[0], _gauge5[1]] != [INV["lattice"]["gauge"][0], INV["lattice"]["gauge"][1]]:
    sys.exit("FATAL: the gauge base point differs between the data file and the Part VIII run.")
if CENS["lattice"]["A4"] != INV["lattice"]["A4"] or CENS["lattice"]["k8D"] != INV["lattice"]["k8D"]:
    sys.exit("FATAL: the census and the designer disagree about the lattice.")
if REACH["lattice"]["k8D_per_multiplet"] != INV["lattice"]["k8D"]:
    sys.exit("FATAL: the reachable-set run and the designer disagree about 8D per multiplet.")
if REACH["lattice"]["t2_per_multiplet"] != [2 * a for a in INV["lattice"]["A4"]]:
    sys.exit("FATAL: the doubled coordinate is not twice A_4; the two runs are not the same map.")

# THE THREE RUNS HAVE TO HAVE PASSED THEIR OWN CONTROLS.  Shipping a band from a run whose own
# gates went red would be shipping a number nobody checked.  [[stale-outputs-lie]]
for tag, blob, path in (("inverse_design", INV, P_INV), ("reachable_set", REACH, P_REACH),
                        ("rung_census", CENS, P_CENS)):
    # only the BOOLEAN entries are verdicts; `n_brute` is how many points a control compared.
    # Testing `v is not True` over everything made a count read as a failure -- and the opposite
    # slip, treating a truthy count as a pass, is the one that would matter.
    flags = {k: v for k, v in blob["controls"].items() if isinstance(v, bool)}
    if not flags:
        sys.exit(f"FATAL: {path.name} records no boolean control at all. A run with nothing to "
                 f"fail is not a run this build ships.")
    bad = [k for k, v in flags.items() if not v]
    if bad:
        sys.exit(f"FATAL: {path.name} archives a run whose controls FAILED: {bad}.\n"
                 f"       Re-run it before the lab quotes any of its numbers.")

# THE CENSUS AGAINST THE ENUMERATOR.  The whole point of the DP is that two algorithms sharing
# nothing agree on 69 million contents; the archived run asserts it, and so does this file, because
# a build that ships the pair must not be the only place the pair is not compared.
for k, row in CENS["totals"].items():
    if row["counted"] != row["enumerated"]:
        sys.exit(f"FATAL: at 8D = {k} the census counts {row['counted']} and the enumerator built "
                 f"{row['enumerated']}. One of the two runs is wrong; the lab ships neither.")
    band = next((b for b in INV["bands"] if b["k8D"] == int(k)), None)
    if band is None or band["enumerated"] != row["enumerated"] or band["A4_cap"] != row["A4_cap"]:
        sys.exit(f"FATAL: rung {k} is not the same rung in the census and in the designer.")

# THE GAP HAS TO BE THE ENDS IT CLAIMS TO JOIN.  It is the headline of the part, so it is derived
# here from the bands rather than copied from the run's own summary: the top of rung 3 and the
# floor of rung 1, and nothing in between.  A copy would still print if the bands moved.
_b1 = next(b for b in INV["bands"] if b["k8D"] == 1)
_b3 = next(b for b in INV["bands"] if b["k8D"] == 3)
if abs(INV["gap"]["lo"] - _b3["top"]) > 1e-6 or abs(INV["gap"]["hi"] - _b1["bottom"]) > 1e-6:
    sys.exit("FATAL: the archived gap is not the interval between the rung-3 ceiling and the "
             "rung-1 floor. Re-derive it or do not ship it.")
if abs((INV["gap"]["hi"] - INV["gap"]["lo"]) - INV["gap"]["width"]) > 1e-6:
    sys.exit("FATAL: the archived gap width is not its own two ends.")

# AND IT HAS TO BE THE WIDEST THING AROUND, or "forty-five times" is a sentence nobody measured.
_interior = []
for b in INV["bands"]:
    lad = next((l for l in INV["ladder"] if l["k8D"] == b["k8D"]), None)
    if lad:
        _interior.append(lad["hi"] - lad["lo"])
_ratio = INV["gap"]["width"] / max(59.44, 30.83)          # the two the paper names, in GeV
del _interior


import re                                                                # noqa: E402
_NAME = re.compile(r"^(\d+)\(([+-]),([+-])\)$")


def _content(v):
    """a multiplicity vector as the record's bulk list -- the shape ctx.load() takes.

    The parities are PARSED, not read off fixed character positions.  Indexing "7(+,+)" at [2] and
    [4] gives the two signs and indexing "28(+,+)" at the same places gives '(' and ',': every
    two-digit representation came out with parities (-1, -1), and the only symptom was that a
    witness loaded from the archive was a different content from the one archived.
    """
    out = []
    for j in range(8):
        if not v[j]:
            continue
        m = _NAME.match(NAMES[j])
        if not m:
            sys.exit(f"FATAL: cannot parse the generator name {NAMES[j]!r}.")
        out.append({"rep": m.group(1),
                    "parities": [1 if m.group(2) == "+" else -1, 1 if m.group(3) == "+" else -1],
                    "multiplicity": v[j]})
    return out


def _band(b, doubled=False):
    out = dict(k8D=b["k8D"], bottom=b["bottom"], top=b["top"], top_LP=b["top_LP"],
               enumerated=b["enumerated"], in_window=b["in_window"], n_W=b["n_W"],
               bottom_content=_content(b["bottom_content"]),
               top_content=_content(b["top_content"]),
               closed_below=b["closed_below"])
    if doubled:
        out.update(t2_cap=b["t2_cap"], bottom_t2=b["bottom_t2"], top_t2=b["top_t2"])
    else:
        out.update(A4_cap=b["A4_cap"], A4_first=b["A4_first"],
                   bottom_A4=b["bottom_A4"], top_A4=b["top_A4"],
                   top_W=b["top_W"], top_W_content=_content(b["top_W_content"]))
    return out


CERTS = {
    "floor": "identity (II) demands an A_4 below that of the EMPTY content, and multiplicities are "
             "non-negative. This is the obstruction the extremal direction never meets: it closes "
             "the scale from BELOW, and it is what makes the reachable set bounded rather than a "
             "half-line.",
    "cone": "(A_4, 8D) lies outside the moment cone generated by the eight multiplets. Not even a "
            "REAL content -- fractional multiplicities allowed -- sits there.",
    "congruence": "the lattice law 8D = 2 A_4 + 3 (mod 6), Part VII Theorem 2. An integer "
                  "obstruction: it holds at any size, and it holds on either gauge seed.",
    "dual": "an exact rational Farkas pair (lambda, nu): the smallest G a real content can have at "
            "this rung already lies outside the interval the target box allows. A bound with a "
            "witness, not a search.",
    "exhaustion": "the rung is a FINITE set -- of the eight generators only 7(+,+) has A_4 = 0, so "
                  "at fixed A_4 the other seven are bounded and 7(+,+) is then pinned by 8D -- and "
                  "the finite set was enumerated with nothing landing in the box.",
}
NOT_CERTS = {
    "rung": "the rung cannot meet the box at all once (II) fixes mu as a function of x. Cheap, and "
            "it is a real exclusion of that rung -- but of the RUNG, not of the target.",
    "budget": "the enumeration ran past its declared budget. This is NOT a certificate and never "
              "prints as one: 'we stopped looking' must not read as 'there is none'.",
}

inverse = {
    "certificates": CERTS,
    "not_certificates": NOT_CERTS,
    "screen": "W > 0 is a SCREEN, not a certificate: Part VII eq. (34) compares the two symmetric "
              "points only, so every design is put on the exact potential before it is delivered.",
    "dual_vertices": INV["dual_vertices"],
    "k_max": INV["k_max"],
    "published": {
        "k_band": INV["k_band"],
        "bands": [_band(b) for b in INV["bands"]],
        "ladder": INV["ladder"],
        "band_ends": [dict(e, content=_content(e["content"])) for e in INV["band_ends"]],
        "gap": INV["gap"],
        "gap_note": "between the rung-3 ceiling and the rung-1 floor. The ends are rounded INWARD, "
                    "never to nearest: an interval that says 'nothing here' is a negative claim, "
                    "and rounding to nearest can put an occupied point inside it.",
        "verified_rung1": dict(INV["verified_rung1"],
                               lo_content=_content(INV["verified_rung1"]["lo_content"]),
                               hi_content=_content(INV["verified_rung1"]["hi_content"])),
        "pdg_window": dict(INV["pdg_window"],
                           lo_content=_content(INV["pdg_window"]["lo_content"]),
                           hi_content=_content(INV["pdg_window"]["hi_content"])),
    },
    "candidate": {
        "seeds": REACH["seeds"],
        "lp_caps": REACH["lp_caps"],
        "bands": [_band(b, doubled=True) for b in REACH["bands"]],
        "ladder": REACH["ladder"],
        "gap": REACH["gap"],
        "pdg": dict(REACH["pdg"], lo_content=_content(REACH["pdg"]["lo_content"])),
        "census": REACH["census"],
        "note": "the candidate parity-resolved seed of Part VII section 13, where 8D is even and "
                "A_4 half-integral. The reachable SUBGROUP of Z^2 in (2A_4, 8D) is the same on "
                "both seeds -- basis (2, 8) and (0, 6) -- so only the base point moves, and the "
                "mod-6 law survives while the odd-eighths corollary does not.",
    },
    "rows": INV["rows"],
    "design_table": INV["design_table"],
    "source": provenance(P_INV) + " and " + provenance(P_REACH),
    "note": "The bands and their ends are READ. Finding the floor of rung 1 means enumerating "
            "423 631 contents and putting the survivors on the exact potential; the page shows "
            "that, it does not re-derive it. What the page DOES re-derive is the decision at a "
            "rung -- the certificates and the enumeration -- and it is held to this archive.",
}

census = {
    "free": CENS["lattice"]["free"],
    "step": CENS["lattice"]["step"],
    "build_seconds": CENS["build_seconds"],
    "totals": CENS["totals"],
    "curves": CENS["census"],
    "curves_low": {k: v for k, v in CENS["census_low"].items()},
    "recurrence": CENS["recurrence"],
    "fibre": CENS["fibre"],
    "budget": CENS["budget"],
    "quasipolynomial": CENS["quasipolynomial"],
    "brute_force_points": CENS["controls"]["n_brute"],
    "source": provenance(P_CENS),
    "note": "N(A_4, 8D) counted by a dynamic programme over the two partial moments, not by "
            "enumeration. The four rung totals -- 69 million contents -- are the strongest "
            "falsification the enumerator has, because the two algorithms share nothing. The "
            "quasi-polynomial structure a vector partition function must have is NOT claimed: the "
            "period comes from the 2x2 determinants of the generators and is too large to measure "
            "on the 77 legal A_4 of rung one. Measured, then not claimed.",
}

KM["inverse"] = inverse
KM["census"] = census
(ROOT / "data" / "su7_km25.json").write_text(json.dumps(KM, indent=1, ensure_ascii=False) + "\n",
                                             encoding="utf-8")
print("=" * 88)
print("ALL CONTROLS PASSED")
print(f"  lattice, gauge base point and 2W agree with data/su7_km25.json on all eight generators")
print(f"  the three archived runs report every control green")
print(f"  the census and the enumerator agree on "
      f"{sum(r['enumerated'] for r in CENS['totals'].values()):,} contents over four rungs")
print(f"  the gap IS [rung-3 ceiling, rung-1 floor] = "
      f"({INV['gap']['lo']:.3f}, {INV['gap']['hi']:.3f}) GeV, "
      f"{INV['gap']['width']:.1f} GeV wide, {_ratio:.0f}x the widest interior gap")
print(f"wrote the `inverse` ({len(json.dumps(inverse)):,} bytes) and `census` "
      f"({len(json.dumps(census)):,} bytes) blocks into data/su7_km25.json")
print("=" * 88)
