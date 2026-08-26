#!/usr/bin/env python3
"""make_data.py — the physics data, extracted rather than retyped.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Emits data/su7_km25.json: the term tables of Komori-Maru's SU(7) model, the five published rows,
  and the constants Part VII certified.  Read from the Part VII engine; nothing here is typed by
  hand.

DESIGN.md D3: the kernel knows about lattices, parities and winding sums.  A GROUP IS DATA.  This
file is what makes that true rather than aspirational -- SU(7) lives in a JSON document, and adding
SU(9) tomorrow means adding a document, not editing the kernel.

It also refuses to run if it cannot reach the source of truth.  A data file silently regenerated
from a stale copy is exactly the failure that leaves no trace until a number moves.
"""
import datetime
import json
import pathlib
import re
import sys
from fractions import Fraction

HERE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sources import root as _sources_root, provenance                   # noqa: E402
SRC = _sources_root("the Part VII engine and its archived runs") / "part_vii"
ENGINE = SRC / "amin_closed_form.py"

if not ENGINE.exists():
    sys.exit(f"FATAL: the source of truth is not where it should be: {ENGINE}\n"
             f"       This file must not invent the physics it cannot read.")

_ns = {"__file__": str(ENGINE)}
exec(ENGINE.read_text(encoding="utf-8")
     .split("# ---------------------------------------------------------------- run")[0], _ns)
terms, GAUGE, T1, moments = _ns["terms"], _ns["GAUGE"], _ns["T1"], _ns["moments"]
closed_form = _ns["closed_form"]

# THE CEILING IS READ, NOT TYPED.  It used to be three literals in the constants block below --
# 10034.0, 215, 1 -- in a file whose docstring says nothing here is typed by hand.  They are the
# output of `ceiling_ilp.py`, so they come from its output.  Re-running that script is now the only
# way they can move, and a stale or missing certificate stops this build rather than shipping a
# number nobody can trace.  [[quote-the-number-from-the-aux]]
CERT = SRC / "outputs" / "ceiling_ilp.json"
if not CERT.exists():
    sys.exit(f"FATAL: the ceiling certificate is not there: {CERT}\n"
             f"       Run `python ceiling_ilp.py` in {SRC} first. This file must not type a\n"
             f"       ceiling it cannot read.")
CEIL = json.loads(CERT.read_text(encoding="utf-8"))
if "escape" not in CEIL:
    sys.exit(f"FATAL: {CERT} predates section 6 and carries no escape ceiling. Re-run ceiling_ilp.py.")

# THE PUBLISHED PART VII, NOT THE DRAFT.  The instrument was closed on the 9 August draft, whose
# ceiling was the relaxation's 10.03 TeV.  The published paper (2026-08-24) keeps that number as
# the bound the dual proves and adds three levels below it, each read here from the archived run
# that produced it -- never typed:
#
#   10.01 TeV  attained at (A4, 8D) = (212, 1) once the lattice is lifted to four coordinates
#              (the relaxation's own vertex (215, 1) is EMPTY)          certify_212_215.json
#    9.22 TeV  once the electroweak point must be the TRUE vacuum, W > 0, at (104, 1);
#              its witness minimised on the exact potential gives 9157   vacuum_constraint.txt
#    9.09 TeV  the same, at the Higgs mass the Higgs actually has        higgs_window.json
#    2.68 TeV  the Lambert-W asymptote the per-rung ceiling falls to     asymptotic_ray.json
#
# and the gauge-seed fork of its section 13: the candidate (3/2, 1/2) split of the four gauge
# degrees of freedom, under which 8D is EVEN and the relaxation ceiling is 7.38 TeV at 8D = 2
# (ceiling_ilp_coset.txt), together with the five lattice coordinates (A4, 8D, 2U, V, 2W) of
# every generator (lattice_lift.json), which the page recomputes and the harness compares.
OUT = SRC / "outputs"


def archived(name):
    p = OUT / name
    if not p.exists():
        sys.exit(f"FATAL: the archived run {p} is not there. The published Part VII reads it; this "
                 f"file must not type the number it carries.")
    return p


def read_json(name):
    return json.loads(archived(name).read_text(encoding="utf-8"))


def grab(text, pattern, what):
    m = re.search(pattern, text, re.M)
    if not m:
        sys.exit(f"FATAL: could not read {what} out of the archived run; the pattern "
                 f"{pattern!r} matched nothing. Read the file, do not guess.")
    return m


HW = read_json("higgs_window.json")
C212 = read_json("certify_212_215.json")
RAY = read_json("asymptotic_ray.json")
LIFT = read_json("lattice_lift.json")
CONGR = read_json("congruences.json")
VC = archived("vacuum_constraint.txt").read_text(encoding="utf-8")
COSET = archived("ceiling_ilp_coset.txt").read_text(encoding="utf-8")

_true = grab(VC, r"CEILING WITH THE TRUE-VACUUM CONDITION : 1/R5 = (\d+) GeV = [\d.]+ TeV  at A4 = (\d+)",
             "the true-vacuum ceiling")
_wit = grab(VC, r"witness : (.+?)\s+\(N = (\d+), W = (\S+)\)", "the true-vacuum witness")
_exact = grab(VC, r"global minimiser alpha = ([\d.]+)\s+m_h = ([\d.]+) GeV\s+1/R5 exact = (\d+) GeV",
              "the witness on the exact potential")
_att = grab(VC, r"^\s*212\s+[\d.]+\s+[\d.]+\s+\+[\d.]+\s+[\d.]+\s+-[\d.]+\s+(\d+)\s*$",
            "the attained ceiling at A4 = 212")
_cand = grab(COSET, r"TECHO \(con fantasmas\), valido para contenido arbitrario:  1/R5 <= (\d+) GeV",
             "the candidate-seed ceiling")
_cand_at = grab(COSET, r"alcanzado en  A_4 = (\S+),  D = 2/8", "where the candidate ceiling sits")
_cand_seed = grab(COSET, r"punto base nuevo: A_4=(\S+)\s+8D=(\S+)\s+2U=(\S+)\s+V=(\S+)\s+2W=(\S+)",
                  "the candidate gauge base point")


def parse_content(s):
    """'16x7(+,+) + 1x28(+,-) + ...' -> bulk list, as the data file writes contents."""
    out = []
    for tok in s.split(" + "):
        m = re.fullmatch(r"(\d+)x(\d+)\(([+-]),([+-])\)", tok.strip())
        if not m:
            sys.exit(f"FATAL: cannot parse the multiplet {tok!r} in {s!r}")
        out.append({"rep": m.group(2), "parities": [1 if m.group(3) == "+" else -1,
                                                    1 if m.group(4) == "+" else -1],
                    "multiplicity": int(m.group(1))})
    return out


def frac(s):
    return float(Fraction(s))


if C212["vertex212"]["in_band"] != 1 or C212["vertex215"]["n_contents"] < 1:
    sys.exit("FATAL: certify_212_215.json no longer says (212,1) is attained and (215,1) checked.")
_pdg = next(r for r in HW["rows"] if r["label"] == "PDG central")
_top = next(r for r in HW["rows"] if r["label"].startswith("the window's top"))
_unc_pdg = next(r for r in HW["unconstrained"] if r["label"] == "PDG central")
if round(_top["invR"]) != int(_true.group(1)) or _top["A4"] != int(_true.group(2)):
    sys.exit(f"FATAL: higgs_window.json ({_top}) and vacuum_constraint.txt ({_true.groups()}) "
             f"disagree on the true-vacuum ceiling. Two archives, one number; re-run both.")

# The candidate seed's term list, from its bracket (3/2, 3, 6): the three coefficients stand in
# the same slots as the published (2, 4, 7) -> [[-1,+,2],[-2,+,1],[-7/2,-,1]], i.e. each is halved
# per charge pair exactly as the archive derives it.  Checked against the archive's own five
# coordinates below rather than trusted.
CANDIDATE_GAUGE = [[-0.75, 1, 2], [-1.5, 1, 1], [-3.0, -1, 1]]
PUBLISHED_GAUGE = [[float(m), int(s), int(c)] for m, s, c in GAUGE]


def five(terms):
    """(A4, 8D, 2U, V, 2W) of a term list, the published paper's integer coordinates."""
    A2 = B2 = A4 = B4 = U2 = V = W = 0.0
    for m, s, c in terms:
        if s > 0:
            A2 += m * c * c; A4 += m * c ** 4
            if c == 2: U2 += 2 * 16 * m
            if c == 3: V += 81 * m
        else:
            B2 += m * c * c; B4 += m * c ** 4
        if c % 2 == 1: W += -s * m
    U2 += 2 * B4
    return [A4, 8 * (A2 - 0.75 * B2), U2, V, 2 * W]


# THE WEDGE: the headline as a region of repair space.  su7_repair_space.py takes the WHOLE
# family of (w28, w84) reweightings of D and asks over which of them "case (2) is the unique
# row" survives -- a conclusion on a region being a different object from one at a point.  The
# exposed inequalities live in a plane (w7 and w48 never enter), every repair the programme
# actually fitted lands inside, and the largest repair the anchor asks for is invisible to it.
_WEDGE_PATH = SRC.parent / "part_vi" / "paper_data" / "su7_repair_space.json"
if not _WEDGE_PATH.exists():
    sys.exit(f"FATAL: {_WEDGE_PATH} is not there; the wedge must be read, not retyped.")
_WEDGE = json.loads(_WEDGE_PATH.read_text(encoding="utf-8"))["steps"]["headline_region"]
_RSTXT = SRC.parent / "part_vi" / "outputs" / "su7_repair_space.txt"
if not _RSTXT.exists():
    sys.exit(f"FATAL: {_RSTXT} is not there.")
_w48 = grab(_RSTXT.read_text(encoding="utf-8"),
            r"LARGEST REPAIR THE a_min COLUMN ASKS FOR IS w\(48\) = ([\d.]+)",
            "the largest repair the anchor asks for")

# THE SIXTH ROW, PRE-REGISTERED.  Across their five rows n(48) and the published alpha are
# perfectly rank-correlated, so the anchor ratio (1.94 with a 48, 1.20 without) cannot say WHICH
# is the locus.  su7_sixth_row.py found two publishable contents that break the lock and committed,
# in print, to the number each reading predicts -- before any such row exists.  Read verbatim.
_SIXTH_PATH = SRC.parent / "part_vi" / "paper_data" / "su7_sixth_row.json"
if not _SIXTH_PATH.exists():
    sys.exit(f"FATAL: {_SIXTH_PATH} is not there; the pre-registered row must be read, not retyped.")
_SIXTH = json.loads(_SIXTH_PATH.read_text(encoding="utf-8"))


def _sixth_bulk(s):
    """'1 x 28(+1,-1) + ...' -> bulk list."""
    out = []
    for tok in s.split(" + "):
        m = re.fullmatch(r"(\d+) x (\d+)\(([+-]1),([+-]1)\)", tok.strip())
        if not m:
            sys.exit(f"FATAL: cannot parse the sixth-row multiplet {tok!r}")
        out.append({"rep": m.group(2), "parities": [int(m.group(3)), int(m.group(4))],
                    "multiplicity": int(m.group(1))})
    return out


# THE COLLIDER DICTIONARY, FROM ITS OWN ARCHIVE.  collider_dictionary.py derives, from the parity
# matrices alone, which state a dijet search bounds; kk_resummation.py collapses the whole
# coloured tower into one form factor.  The branch table and the closed-form ratios are read from
# those runs; the Delta chi^2 teeth of eq. (combchi) are QUOTED from the published tex, because
# re-deriving them needs make_fig_chi2.py's exact profiling recipe and a near-miss re-derivation
# would ship a number that disagrees with the record.  [[dont-manufacture-the-finding]]
_CD = archived("collider_dictionary.txt").read_text(encoding="utf-8")
_cd_rows = re.findall(r"^\s{4}(ceiling[^0-9]+?|contents that afford the escape)\s+([\d.]+)\s+"
                      r"([\d.]+)\s+([\d.]+)\s+(\d+)\s*$", _CD, re.M)
if len(_cd_rows) != 4:
    sys.exit(f"FATAL: expected 4 branch rows in collider_dictionary.txt, got {len(_cd_rows)}.")
_KKR = read_json("kk_resummation.json")
_KKL = read_json("kk_dijet_lo.json")
_TEX = (SRC / "paper" / "su7_hierarchy.tex").read_text(encoding="utf-8")
_l8 = grab(_TEX, r"which is \$([\d.]+)\$~TeV on the escape branch and \$([\d.]+)\$~TeV at the "
                 r"measured-\$m_h\$ ceiling", "the two Lambda_8 values")
_teeth = grab(_TEX, r"=\\;(12\.0)\s*\n\s*\\qquad\\text\{at \} 8D=1,\\ 1/R_5=([\d.]+)\\ \\text\{TeV",
              "the comb verdict of eq. (combchi)")
_thr = grab(_TEX, r"against a threshold of \$([\d.]+)\$; the next tooth is at "
                  r"\$\\Delta\\chi\^2=(\d+)\$", "the threshold and the next tooth")
_half = grab(_TEX, r"top tooth at\s*\$([\d.]+)\$~TeV, where this recast returns\s*"
                   r"\$\\Delta\\chi\^2=(-[\d.]+)\$", "the half-quantum sign flip")

# THE K SCREEN, FROM PART VI's OWN ARCHIVE.  su7_anchor_mh.py section B: for ANY row of ANY
# content, K = m_h a_min / sqrt(F''(a_min)) = 2 m_W sqrt(3/(16 pi^6)) g4 -- invariant under
# F -> lambda F, so it screens a published row's internal consistency without touching the
# normalisation the anchor question is about.  Their five rows, evaluated at THEIR a_min with the
# exact F'' of each row's content: three consistent near g4 ~ 0.6, one at 1.87, and one whose
# published alpha is not even at a minimum (F'' < 0).  The page recomputes all of it; this copy is
# what the harness holds it to.  NaN is valid JSON to Python and not to a browser, hence _denan.
_MH_PATH = SRC.parent / "part_vi" / "paper_data" / "su7_anchor_mh.json"
if not _MH_PATH.exists():
    sys.exit(f"FATAL: {_MH_PATH} is not there; the K screen must be read from Part VI's archive.")
_MH = json.loads(_MH_PATH.read_text(encoding="utf-8"))["steps"]["mh_test"]


def _denan(x):
    return None if isinstance(x, float) and x != x else x


# PART VI's ESCAPE, FROM ITS OWN ARCHIVE.  su7_realisable.py re-derives the fourteen (rung set, X_Q)
# assignments that cancel all six anomaly channels with every generation protected, and marks the
# two their own tensors can host.  The page recomputes the table in the browser; the harness holds
# it to this copy, row by row.
VI_OUT = SRC.parent / "part_vi" / "outputs"
_real = VI_OUT / "su7_realisable.txt"
if not _real.exists():
    sys.exit(f"FATAL: {_real} is not there; the escape table must be read from Part VI's archive.")
_rows = []
_in = False
for line in _real.read_text(encoding="utf-8").splitlines():
    if line.startswith("STEP 2 -- every assignment"):
        _in = True
    elif _in and line.startswith("STEP"):
        break
    elif _in:
        m = re.match(r"\s*\(('[^)]*)\)\s+(\S+)\s+\(('[^)]*)\)\s+\(('[^)]*)\)\s+(YES|no.*)$", line)
        if not m:
            continue
        tup = lambda s: [x.strip().strip("'") for x in s.split(",") if x.strip()]
        _rows.append({"l": tup(m.group(1)), "X_Q": m.group(2), "A": tup(m.group(3)),
                      "nus": tup(m.group(4)), "realisable": m.group(5) == "YES"})
if len(_rows) != 14 or sum(r["realisable"] for r in _rows) != 2:
    sys.exit(f"FATAL: parsed {len(_rows)} assignments with {sum(r['realisable'] for r in _rows)} "
             f"realisable out of {_real}; Part VI says 14 and 2. The parser or the archive moved.")

_want = [frac(x) for x in _cand_seed.groups()]
if any(abs(a - b) > 1e-9 for a, b in zip(five(CANDIDATE_GAUGE), _want)):
    sys.exit(f"FATAL: the candidate gauge list gives {five(CANDIDATE_GAUGE)} but the archive says "
             f"{_want}. The seed must reproduce the archived base point before it ships.")
if any(abs(a - b) > 1e-9 for a, b in zip(five(PUBLISHED_GAUGE), LIFT["gauge"])):
    sys.exit(f"FATAL: the published gauge list gives {five(PUBLISHED_GAUGE)} against "
             f"lattice_lift.json's {LIFT['gauge']}.")

SLOTS = [("7", 1, 1), ("7", 1, -1), ("28", 1, 1), ("28", 1, -1),
         ("48", 1, 1), ("48", 1, -1), ("84", 1, 1), ("84", 1, -1)]
KEY = lambda e, p: f"({'+' if e > 0 else '-'},{'+' if p > 0 else '-'})"

reps = {}
for rep, e, p in SLOTS:
    reps.setdefault(rep, {})[KEY(e, p)] = [[float(m), int(s), int(c)] for m, s, c in terms(rep, e, p)]

rows = []
for label, cont, a_them, mh_them, invR in T1:
    mo = moments(cont)
    rows.append({
        "label": label,
        "bulk": [{"rep": r, "parities": [int(e), int(p)], "multiplicity": int(m)} for r, e, p, m in cont],
        "published": {"alpha_min": a_them, "m_h": mh_them, "invR5": invR},
        "ours": {"D8": round(8 * mo["D"]), "A4": round(mo["A4"]), "G": mo["G"]},
    })

# THE ANCHOR BAND, COMPUTED.  It used to be typed -- [1.03, 2.08] in the constants and the same two
# numbers again in the anchor's caveat -- which is two chances to drift from the rows they describe.
# Both now come from the rows themselves, so re-running this file is the only way they can change.
RATIOS = []
for label, cont, a_them, mh_them, invR in T1:
    a_ours, _mo = closed_form(cont)     # the engine returns (alpha, moments)
    if a_ours and a_them:
        RATIOS.append(a_ours / a_them)
_BEST = min(range(len(RATIOS)), key=lambda i: abs(RATIOS[i] - 1))
CAVEAT = (f"the row where our alpha agrees best with theirs ({RATIOS[1]:.2f}x); across the "
          f"{len(RATIOS)} rows the ratio runs {min(RATIOS):.2f}x to {max(RATIOS):.2f}x, and this "
          f"is the only row whose m_h falls inside the 125-127 GeV window")
if _BEST != 1:
    sys.exit(f"FATAL: the caveat says row (2) is the best-agreeing one and it is now row "
             f"{_BEST + 1}. Rewrite the sentence rather than shipping a stale one.")

DATA = {
    "id": "su7_km25",
    "group": "SU(7)",
    "orbifold": {"name": "S1/Z2 x S1/Z2",
                 "note": "their eqs. (11)-(13); two parities on the fifth circle, one on the sixth"},
    "source": {
        "paper": "Y. Komori, N. Maru, arXiv:2503.04090",
        "extracted_from": provenance(ENGINE),
        "chain": "amin_closed_form.py extracts terms(), GAUGE and T1 from part_vi/su7_anchor_mh.py, "
                 "which derives the gauge weights from their eqs. (63)-(67)",
        "generated": datetime.date.today().isoformat(),
    },
    # (multiplicity, periodicity sign, integer charge).  The half-integer gauge weight is the
    # derived one, and it is what makes 8D odd.
    "gauge": [[float(m), int(s), int(c)] for m, s, c in GAUGE],
    "reps": reps,
    "published_rows": rows,
    # THE ROW THE TOOL OPENS ON, AND THE UNCOMFORTABLE FACT ABOUT IT.
    #
    # It is row (2), inherited from a bare `rows[1]` in the shell.  Naming it made the choice
    # visible, and visible it turned out to be the FLATTERING one: across the five rows our alpha
    # runs 1.03x to 2.08x the published alpha, and row (2) is the 1.03 -- the only row that agrees,
    # and the only one whose m_h lands inside the 125-127 GeV window.  The other four give 143 to
    # 150 GeV and miss by 29 to 108 percent.
    #
    # Opening on your best case without saying so is how a tool flatters itself.  The row stays --
    # it is the row Part VII's argument walks through -- and `caveat` travels with it so the page
    # says out loud that this is the agreeing one.
    "anchor": {
        "label": f"published row {rows[1]['label']}",
        "bulk": rows[1]["bulk"],
        "caveat": CAVEAT,
    },
    "constants": {
        "ceiling_GeV": round(CEIL["ceiling_GeV"], 1),
        "ceiling_A4": CEIL["ceiling_A4"], "ceiling_8D": CEIL["ceiling_8D"],
        "anchor_band": [round(min(RATIOS), 2), round(max(RATIOS), 2)],
        "note": "ceiling_GeV is the RELAXATION's bound -- Part VII section 8, eq. (24), certified "
                "by an exact rational dual for arbitrary content on the seed as printed; its own "
                "vertex is empty, and the levels below it are in `ceilings`. The band is the "
                "row-wise range of alpha_ours/alpha_theirs, Part VI section 7",
    },
    # THE FOUR LEVELS OF THE CEILING, as the published Part VII states them, each with what it
    # bounds and where it was computed.  A page that showed only the first would be showing the
    # draft.
    "ceilings": {
        "relaxation": {
            "GeV": round(CEIL["ceiling_GeV"], 1), "A4": CEIL["ceiling_A4"], "8D": CEIL["ceiling_8D"],
            "bounds": "any bulk content, on the gauge seed as printed -- the LP dual's bound",
            "attained": False,
            "source": "ceiling_ilp.py, Part VII eq. (24); the vertex (215, 1) is EMPTY once G is "
                      "written in {1, ln 2, ln 3}: no content of any size can pay for it in G, "
                      "short by 0.067 in a budget of 681 (certify_212_215.py)",
        },
        "attained": {
            "GeV": int(_att.group(1)), "A4": 212, "8D": 1,
            "bounds": "any bulk content whose electroweak point is STATIONARY",
            "attained": True,
            "witness": parse_content("17x7(+,+) + 2x7(+,-) + 57x28(+,-)"),
            "source": "vacuum_constraint.py section 3 and certify_212_215.py, Part VII eq. (32); "
                      "the witness sits in a FALSE vacuum -- deeper at alpha = 1 by 316",
        },
        "true_vacuum": {
            "GeV": int(_true.group(1)), "A4": int(_true.group(2)), "8D": 1,
            "bounds": "any bulk content whose electroweak point is its TRUE vacuum (W > 0), "
                      "with m_h anywhere in the window",
            "attained": True,
            "witness": parse_content(_wit.group(1)),
            "witness_W": frac(_wit.group(3)),
            "exact": {"alpha": float(_exact.group(1)), "m_h": float(_exact.group(2)),
                      "GeV": int(_exact.group(3))},
            "source": "vacuum_constraint.py section 3, Part VII eq. (36); [8]'s stability "
                      "criterion carried inside the integer program. `exact` is the same "
                      "witness minimised on the untruncated polylogarithmic potential",
        },
        "measured_mh": {
            "GeV": round(_pdg["invR"]), "A4": _pdg["A4"], "8D": 1, "m_h": _pdg["mh"],
            "m_h_err": HW["mh_err"],
            "bounds": "any true-vacuum content at the Higgs mass the Higgs actually has",
            "attained": True,
            "unconstrained_GeV": round(_unc_pdg["invR"]), "unconstrained_A4": _unc_pdg["A4"],
            "source": "higgs_window.py, Part VII eq. (37); the one-sigma band does not move "
                      "the vertex",
        },
        "asymptote_GeV": round(RAY["M_infinity"], 1),
        "asymptote_source": "asymptotic_ray.py, Part VII eq. (27): the Lambert-W limit the "
                            "per-rung ceiling falls to, approached from above and never reached; "
                            "it carries no gauge quantity at all",
        "per_rung": [{"8D": r["k8D"], "A4": r["A4"], "GeV": round(r["invR"], 1)}
                     for r in CEIL["per_k"]],
        "per_rung_source": "ceiling_ilp.py: the relaxation's ceiling on each odd rung, on the "
                           "seed as printed -- the teeth Part VII section 10 reads the likelihood at",
    },
    # THE GAUGE SEED, AND THE FORK.  Everything a bulk content contributes is fixed; what the gauge
    # sector contributes is read off eq. (68) of arXiv:2503.04090 and Part VII section 13 records
    # that a parity-resolved covariant count suggests a different split of the same four degrees
    # of freedom.  Both are carried, the page can switch, and the harness checks that the switch
    # moves exactly what the paper says it moves: (2A4, 8D, 2U, V, 2W) by (9, 9, 9, 0, 0).
    "gauge_seeds": {
        "published": {
            "label": "as printed in arXiv:2503.04090, eq. (68)",
            "weights": [2, 0.5], "bracket": [2, 4, 7],
            "gauge": PUBLISHED_GAUGE,
            "five": LIFT["gauge"],
            "parity_of_8D": "odd",
            "ceiling_GeV": round(CEIL["ceiling_GeV"], 1), "ceiling_8D": CEIL["ceiling_8D"],
            "note": "four degrees of freedom in the periodic channel and one in the antiperiodic: "
                    "five, where a six-dimensional gauge field has four. Theorem 1 (8D odd) holds "
                    "on this seed",
        },
        "candidate": {
            "label": "candidate parity-resolved split, Part VII section 13",
            "weights": [1.5, 0.5], "bracket": [1.5, 3, 6],
            "gauge": CANDIDATE_GAUGE,
            "five": _want,
            "parity_of_8D": "even",
            "ceiling_GeV": int(_cand.group(1)), "ceiling_8D": 2,
            "ceiling_A4": frac(_cand_at.group(1)),
            "note": "three and one, which is four; the ghost subtraction lands in the periodic "
                    "sector. 8D is even, A4 half-integral, the hypothesis of Theorem 1 is not met, "
                    "Theorem 2 and the 2W theorem survive, and the relaxation ceiling drops one "
                    "rung to 8D = 2. The true-vacuum level is NOT recomputed on this branch",
        },
        "shift": {"2A4": 9, "8D": 9, "2U": 9, "V": 0, "2W": 0},
        "source": "gauge_ghost_seed.py, ceiling_ilp_coset.py, seed_shift_character.py",
    },
    # PART VI's ESCAPE, the archived table: the fourteen assignments and the two that fit.
    "escape_assignments": {
        "rows": _rows,
        "count": len(_rows), "realisable": sum(r["realisable"] for r in _rows),
        "source": "su7_realisable.py, Part VI §4 (an independent re-derivation of the fourteen "
                  "of su7_family_u1.py); brane-quark charge family-universal, a = -(sum l)/9; "
                  "right-handed neutrinos from the singlet ladder, up to three",
        "one_generation": {"X_Q": "-1/6", "channels_forcing_it": ["su2_x", "x2_y", "x_y2"],
                           "uncancellable": ["x_grav", "x3"], "value": "1",
                           "source": "su7_anomaly_channels.py, Part VI §3"},
        "hosting": {"0": ["21", "28"], "1": ["84"], "2": [], "3": [],
                    "parities": {"21@0": [-1, 1], "84@1": [1, 1]},
                    "source": "su7_family_u1.py steps 6-7 and su7_realisable.py step 1: the 35 "
                              "hosts L at rung 1 and not e_R; the 48 is real (Prop. 2)"},
        "qphi": {"supply": [["1/2", "7"], ["1", "28"], ["3/2", "84"]],
                 "minimal_halfline": "1/3", "strict_halfline": "1",
                 "scan": {"values": 18648, "disagreements": 0},
                 "source": "su7_qphi.py steps 2, 6, 7"},
        "residual": {"Z": {"1/2": 1, "1": 2, "3/2": 3}, "pairs_collapse_to": "1/2",
                     "source": "su7_residual_group.py"},
    },
    # The five coordinates of every generator, from the archive, for the harness to compare
    # against the kernel's own computation of them.  Theorem 3: two contents have the same one-loop
    # potential iff they agree on all five.
    "coordinates": {
        "names": ["A4", "8D", "2U", "V", "2W"],
        "generators": LIFT["rows"],
        "gauge": LIFT["gauge"],
        "invariant_factors": LIFT["quotient"],
        "index": CONGR["index"],
        "probes": CONGR["probes"],
        "source": "lattice_lift.py and congruences.py; rank 5, kernel of dimension 3",
    },
    # THE WEDGE: the donation headline as an exact region in the (w28, w84) repair plane.
    "wedge": {
        "w_diagonal_interval": _WEDGE["w_diagonal_interval"],
        "fitted": _WEDGE["fitted"],
        "w48_largest_repair": float(_w48.group(1)),
        "source": "su7_repair_space.py part A: D(2) donated = -27/8 + 2 w28 + (15/4) w84 must "
                  "stay positive and D(3) donated = -27/8 + 2 w28 + (5/4) w84 negative; w(7) and "
                  "w(48) appear in neither, so the headline lives in a plane and the largest "
                  "repair the anchor asks for is identically invisible to it",
    },
    # THE SIXTH ROW: the two pre-registered contents, each carrying BOTH committed predictions.
    "sixth_row": {
        "ratio_with48": _SIXTH["ratio_with48"],
        "ratio_no48": _SIXTH["ratio_no48"],
        "candidates": [
            {"kind": p["kind"], "content": p["content"], "bulk": _sixth_bulk(p["content"]),
             "n48": p["n48"], "a_ours": p["a_ours"], "mh_ours": p["mh_ours"]}
            for p in _SIXTH["predictions"]
        ],
        "source": "su7_sixth_row.py (Part VI section 7): the confound is that n(48) and the "
                  "published alpha are rank-correlated across their five rows; these two "
                  "publishable contents break the lock, and the committed numbers -- a_ours "
                  "divided by 1.94 or by 1.20 according to the reading -- were fixed in print "
                  "before any such row exists",
    },
    # THE COLLIDER DICTIONARY: which state a dijet search bounds, its width, the form factor the
    # whole coloured tower collapses into, and the recast verdict at the per-rung teeth.
    "collider": {
        "coupling_ratio": "sqrt(2)",
        "alphas_run": {"aZ": 0.1180, "MZ": 91.1876, "nf": 6,
                       "source": "collider_dictionary.py: one-loop, crude on purpose -- the "
                                 "width is a 10%-level statement"},
        "branches": [{"name": n.strip(), "invR5_TeV": float(m), "alphas": float(a),
                      "GoverM": float(g), "Gamma_GeV": int(G)}
                     for n, m, a, g, G in _cd_rows],
        "resummation": {
            "eft_coefficient": _KKR["eft_coefficient"],
            "invR5_used_TeV": _KKR["invR5_used"],
            "width_shift_at_zero": _KKR["width_shift_at_zero"],
            "ratios_chi_1p5": _KKR["ratios_chi_1p5"],
            "source": "kk_resummation.py: F(t) = pi R5 sqrt(-t) coth(pi R5 sqrt(-t)); the "
                      "withdrawn width correction tends to 1/(1+(2 alpha_s)^2) at t -> 0, "
                      "which no self-energy below threshold may do",
        },
        "lambda8_TeV": {"escape": float(_l8.group(1)), "measured_mh": float(_l8.group(2))},
        # the binning the recast actually used -- kk_dijet_lo.py's own grid, read not typed --
        # so the page can hand a reader the ratio at exactly the bins a fit would want
        "bins": {"mjj_TeV": _KKL["mjj_TeV"], "chi": _KKL["chi"],
                 "source": "kk_dijet_lo.py, the LO recast's own grid"},
        "teeth": {
            "min_dchi2": float(_teeth.group(1)), "at_8D": 1, "at_TeV": float(_teeth.group(2)),
            "threshold": float(_thr.group(1)), "next_tooth_dchi2": int(_thr.group(2)),
            "escape_dchi2": "beyond a thousand",
            "half_quantum": {"TeV": float(_half.group(1)), "dchi2": float(_half.group(2))},
            "source": "QUOTED from the published Part VII, eq. (combchi): the 77-point chi^2, "
                      "truncated teeth -- both stated choices made the unfavourable way; the "
                      "profiling recipe lives in make_fig_chi2.py and is not re-derived here",
        },
    },
    # THE K SCREEN: the row-consistency invariant of Part VI's open problem 3, with their five
    # rows evaluated at their own published alpha.  K carries no normalisation; the implied g4 is
    # what each row says the gauge coupling would have to be.
    "screen": {
        "K_over_g4": _MH["const"],
        "at_theirs": [{k: _denan(v) for k, v in r.items()} for r in _MH["at_theirs"]],
        "source": "su7_anchor_mh.py section B (Part VI): K = m_h a_min / sqrt(F''(a_min)) = "
                  "2 m_W sqrt(3/(16 pi^6)) g4 for every row of every content; invariant under "
                  "F -> lambda F, so it does not test the normalisation",
    },
    # THE CATALOGUE, AND WHAT PART VI's ESCAPE COSTS IT.  The five published rows are their Table 1,
    # not the universe: the same lattice generates a content for every multiset of multiplets, and
    # the escape is priced on all of them.  Both the certificate and the enumeration are read from
    # ceiling_ilp.py -- the lab displays this, it does not re-derive it.
    "escape": {
        "host": CEIL["escape"]["host"],
        "cost8": CEIL["escape"]["cost8"],
        "min_8D": CEIL["escape"]["min_8D"],
        "ceiling_GeV": round(CEIL["escape"]["ceiling_GeV"], 1),
        "ceiling_A4": CEIL["escape"]["ceiling_A4"],
        "ceiling_8D": CEIL["escape"]["ceiling_8D"],
        "ratio": round(CEIL["escape"]["ratio_to_unconstrained"], 2),
        "note": "donating the host takes cost8/8 off D, and D must stay positive, so a content can "
                "afford the escape iff 8D >= min_8D. The per-rung ceiling is monotone decreasing "
                "in D, so that bound moves the ceiling itself: ceiling_GeV against the "
                "unconstrained one. It bounds the content BEFORE the donation, not the world after",
    },
    "size_curve": [
        {"N": c["N"], "contents": c["contents"], "in_window": c["in_window"],
         "with_host": c["with_host"], "can_pay": c["can_pay"],
         "best_invR5": round(c["invR"]), "best_8D": round(8 * c["D"]),
         "best_invR5_paying": (None if c["invR_paying"] is None else round(c["invR_paying"])),
         "best_8D_paying": (None if c["D_paying"] is None else round(8 * c["D_paying"]))}
        for c in CEIL["size_curve"]
    ],
}

# The certificate has to be about the same physics the app runs, or it is decoration.  The window
# and g4 are the two places they could silently disagree.
if CEIL["mh_window"] != [125.0, 127.0] or CEIL["g4"] != 0.63:
    sys.exit(f"FATAL: the certificate was computed for m_h in {CEIL['mh_window']} at g4="
             f"{CEIL['g4']}, which is not what the app's conventions say. One of the two is wrong.")
_five = [c for c in DATA["size_curve"] if c["N"] == 5]
if not _five or _five[0]["in_window"] != 1:
    sys.exit("FATAL: at N=5 the catalogue must contain exactly one window content -- published row "
             "(2). It does not, so the enumeration and the rows no longer describe the same lattice.")

out = HERE / "data" / "su7_km25.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(DATA, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"wrote {out}")
print(f"  {len(reps)} representations, {sum(len(v) for v in reps.values())} parity assignments, "
      f"{len(rows)} published rows")
for r in rows:
    print(f"    {r['label']:5s} 8D={r['ours']['D8']:3d}  A4={r['ours']['A4']:4d}  "
          f"alpha_theirs={r['published']['alpha_min']}")
