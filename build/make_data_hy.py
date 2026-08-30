#!/usr/bin/env python3
"""make_data_hy.py — the Haba-Yamashita SU(3) model, extracted rather than retyped.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Emits data/su3_hy.json: the third group of the instrument, and the first for readers OUTSIDE
  this series — Haba & Yamashita's general 5D SU(N) on S^1/Z_2 one-loop potential (JHEP 02 (2004)
  059, hep-ph/0401185), at their own worked case SU(3) -> SU(2) x U(1), one Wilson phase.  Their
  eq. (3.20) is a four-row (m, s, c) table linear in the six bulk counts (adjoint / fundamental
  Dirac fermions and complex scalars, at either eta*eta'), and their summary calls analysing the
  vacuum structure the hard part: the instrument locates the vacuum in the browser.

  Nothing here is typed.  The coefficient table is EXTRACTED from hy_predictions.py — the script
  whose output the paper's section 11 stands on — by evaluating its own hy_table() on unit
  contents; the prediction bank is that script's archived JSON, read verbatim; the census count is
  read out of the archived text.  A missing archive stops this build.
"""
import datetime
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sources import root as _sources_root, provenance                   # noqa: E402
SRC = _sources_root("Haba-Yamashita's archived prediction bank") / "part_vii"
ENGINE = SRC / "hy_predictions.py"
BANK = SRC / "outputs" / "hy_predictions.json"
TXT = SRC / "outputs" / "hy_predictions.txt"

for p in (ENGINE, BANK, TXT):
    if not p.exists():
        sys.exit(f"FATAL: the source of truth is not where it should be: {p}\n"
                 f"       This file must not invent the physics it cannot read.")

_ns = {"__file__": str(ENGINE)}
exec(ENGINE.read_text(encoding="utf-8")
     .split("# ---------------------------------------------------------------- controls first")[0],
     _ns)
hy_table = _ns["hy_table"]

SPECIES = ["Nap", "Nam", "Nfp", "Nfm", "Nsp", "Nsm"]

# THE COEFFICIENT TABLE, extracted from the script's own function: the base row is the gauge and
# ghost sector (their -(D-2) counting rule at D = 5), and each species' column is the difference
# a unit of it makes.  Evaluating on unit vectors is what makes this read, not transcribed.
base = hy_table(0, 0, 0, 0, 0, 0)
rows = []
for i, (m0, s, c) in enumerate(base):
    per = {}
    for j, sp in enumerate(SPECIES):
        unit = [0] * 6
        unit[j] = 1
        dm = hy_table(*unit)[i][0] - m0
        if dm:
            per[sp] = dm
    rows.append({"c": c, "s": s, "base": m0, "per": per})

bank = json.loads(BANK.read_text(encoding="utf-8"))

# THE SECOND ANCHOR: von Gersdorff-Irges-Quiros (hep-th/0204223), a different group, dimension
# and decade, whose four published numbers our machinery must hit with nothing adjusted.  The
# SU(3) minimum is a MISMATCH -- ours exactly 1/3 on the Z3 centre where the Polyakov loop
# vanishes, theirs printed 0.29 -- and it ships as unresolved with the evidence stated, exactly
# as the archived run reports it.
VGIQ = SRC / "outputs" / "vgiq_anchor.json"
VGIQ_TXT = SRC / "outputs" / "vgiq_anchor.txt"
for p in (VGIQ, VGIQ_TXT):
    if not p.exists():
        sys.exit(f"FATAL: {p} is not there; the second anchor must be read, not retyped.")
_vg = json.loads(VGIQ.read_text(encoding="utf-8"))
_vgt = VGIQ_TXT.read_text(encoding="utf-8")
_m = re.search(r"SU\(3\)\s+theirs\s+omega = ([\d.]+)\s+\|P\| = ([\d.]+)", _vgt)
_m2 = re.search(r"SU\(2\)\s+adjoint fermions.*?theirs: ([\d.]+)", _vgt, re.S)
if not (_m and _m2):
    sys.exit("FATAL: could not read the published minima out of vgiq_anchor.txt.")
census = re.search(r"contents with D > 0 and a genuine interior minimum: (\d+)",
                   TXT.read_text(encoding="utf-8"))
if not census:
    sys.exit("FATAL: could not read the census count out of the archived run.")

# THE ANCHOR: the smallest content of the archived bank (ties broken by alpha) -- so the group
# opens on a row the harness independently re-derives, never on an invented example.
anchor_row = sorted(bank, key=lambda r: (sum(r["content"].values()), r["alpha"]))[0]

SLOT_OF = {"Nap": ("adjoint", [1, 1]), "Nam": ("adjoint", [1, -1]),
           "Nfp": ("fund", [1, 1]), "Nfm": ("fund", [1, -1]),
           "Nsp": ("scalar", [1, 1]), "Nsm": ("scalar", [1, -1])}


def bulk_of(content):
    out = []
    for sp in SPECIES:
        n = content.get(sp, 0)
        if n:
            rep, par = SLOT_OF[sp]
            out.append({"rep": rep, "parities": par, "multiplicity": n})
    return out


DATA = {
    "id": "su3_hy",
    "group": "SU(3) 5D",
    "orbifold": {"name": "S1/Z2"},
    "source": {
        "paper": "N. Haba, T. Yamashita, JHEP 02 (2004) 059 (hep-ph/0401185), eq. (3.20)",
        "extracted_from": provenance(ENGINE),
        "chain": "hy_predictions.py defines their eq. (3.20) as hy_table(); this file evaluates "
                 "it on unit contents to extract the coefficient table, and copies the archived "
                 "prediction bank verbatim",
        "date": datetime.date.today().isoformat(),
    },
    # The six slots the shell builds its rail from.  A rep here is a SPECIES x (eta eta') pair:
    # the potential of their eq. (3.20) sees exactly these six numbers and nothing else.
    "reps": {"adjoint": {"(+,+)": 1, "(+,-)": 1},
             "fund": {"(+,+)": 1, "(+,-)": 1},
             "scalar": {"(+,+)": 1, "(+,-)": 1}},
    "species": {"adjoint": "adjoint Dirac fermion (4 dof)",
                "fund": "fundamental Dirac fermion (2 dof per pair)",
                "scalar": "complex scalar (-2 dof)"},
    # eq. (3.20) as data: V = C sum_n n^-5 sum_rows m(content) * [s-tower] cos(pi n c alpha),
    # m(content) = base + sum species per[sp] * N_sp.  The base is the gauge+ghost -(D-2) = -3.
    "terms5d": rows,
    "census": {"vacua": int(census.group(1)), "max_each": 4,
               "source": "hy_predictions.py: every content up to four of each species"},
    "vgiq": {
        "charges": _vg["charges"],
        "critical_nf": _vg["critical_nf"],
        "minima_ours": _vg["minima"],
        "minima_theirs": {"SU(2)": float(_m2.group(1)), "SU(3)": float(_m.group(1))},
        "polyakov_at_theirs_su3": float(_m.group(2)),
        "source": "vgiq_anchor.py against von Gersdorff-Irges-Quiros hep-th/0204223: charges "
                  "from explicit generators, their alpha = 2 omega convention from their own "
                  "footnotes; four critical flavour numbers exact, the SU(2) minimum exact, and "
                  "the SU(3) minimum UNRESOLVED -- ours is exactly 1/3, on the Z3 centre, where "
                  "the fundamental Polyakov loop vanishes; theirs prints 0.29 = (1/3)(sqrt3/2) "
                  "to two digits, a normalisation their text fixes for SU(2) and not for SU(3). "
                  "Reported with the evidence, not claimed as a slip",
    },
    "bank": bank,
    "anchor": {
        "label": f"the smallest content of the archived bank",
        "bulk": bulk_of(anchor_row["content"]),
        "expected": {"alpha": anchor_row["alpha"], "D": anchor_row["D"], "A4": anchor_row["A4"],
                     "Fpp": anchor_row["Fpp"]},
        "caveat": "no absolute scale exists here at all: Haba-Yamashita publish no normalisation, "
                  "so alpha and the spectrum are in units of 1/R and nothing is a GeV",
    },
    "note": "the 5D class of Part VII section 11: no odd 8D occurs here -- a Dirac fermion enters "
            "with 4 dof and a complex scalar with -2, both even, and the odd -3 of gauge+ghost "
            "multiplies only the adjoint, evenly. The odd rung the ceiling stands on needs the "
            "sixth dimension.",
}

out = HERE / "data" / "su3_hy.json"
out.write_text(json.dumps(DATA, indent=1, ensure_ascii=False), encoding="utf-8", newline="\n")
print(f"wrote {out}  ({out.stat().st_size / 1024:.1f} kB, "
      f"{len(bank)} bank rows, census {DATA['census']['vacua']}, "
      f"anchor {anchor_row['content']} at alpha = {anchor_row['alpha']:.5f})")
