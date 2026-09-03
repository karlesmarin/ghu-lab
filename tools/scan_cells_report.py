#!/usr/bin/env python3
"""scan_cells_report.py -- read scan_cells.mjs's JSONL and look for regularities across the space.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  python tools/scan_cells_report.py scan.jsonl

Every count is printed with its denominator, and a regularity is only called one when it holds on
EVERY row of its class -- a pattern with a counterexample is printed with the counterexample.
"""
import collections
import json
import sys

rows = [json.loads(l) for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
print(f"{len(rows)} rows")
by = lambda key: collections.Counter(key(r) for r in rows)

def sec(t): print("\n" + "=" * 8, t)

sec("1. full cells: how many, where, with what")
full = [r for r in rows if r["cellFound"] == 5]
print(f"full cell (5/5): {len(full)} of {len(rows)} rows")
print("  by N:", dict(collections.Counter(r["N"] for r in full)))
print("  by boundary condition:", dict(collections.Counter(f"SU({r['N']}) [{','.join(map(str, r['bc']))}]" for r in full)))
print("  sin2 values among full cells:", dict(collections.Counter(str(r["sin2"]) for r in full)))
print("  with a Higgs doublet:", sum(1 for r in full if r["higgs"]), "of", len(full))
print("  full cell + Higgs + anomaly cancels at the minimum:",
      sum(1 for r in full if r["higgs"] and r["anomVac"] == "cancels"), "of", len(full))
print("  minimal contents (fewest fields) with full cell + Higgs:")
mins = sorted([r for r in full if r["higgs"]], key=lambda r: (r["nFields"], r["N"]))[:12]
for r in mins:
    print(f"    SU({r['N']}) [{','.join(map(str, r['bc']))}] {r['content']}: sin2={r['sin2']} exotics={r['exotics']} "
          f"(dim {r['exoticDim']}) anomaly@min={r['anomVac']} vacuum={r['vacWhere'][:40]} mWR={r['mWR']} 1/R={r['invR']}")

sec("2. what the cell needs: phases, class size, energetics")
print("  phases among full cells:", dict(collections.Counter(r["phases"] for r in full)))
print("  class-preferred member (lowest N_v) among full cells:", dict(collections.Counter(r["preferred"] for r in full)))
print("  phases over all rows:", dict(collections.Counter(r["phases"] for r in rows)))

sec("3. the vacuum of the full-cell models")
print("  where the vacuum sits (symmetric point / broken):",
      dict(collections.Counter("symmetric" if "symmetric point" in (r["vacWhere"] or "") else "broken" for r in full)))
print("  distance to nearest symmetric point, full cells:", dict(collections.Counter(r["distance"] for r in full)))
print("  weak block broken by the vacuum:", dict(collections.Counter(r["weakBroken"] for r in full)),
      " colour broken:", dict(collections.Counter(r["colourBroken"] for r in full)))
broken_full = [r for r in full if r["invR"] is not None]
print(f"  full cells with a Wilson-line W (scale set): {len(broken_full)}")
for r in sorted(broken_full, key=lambda r: -r["invR"])[:10]:
    print(f"    SU({r['N']}) [{','.join(map(str, r['bc']))}] {r['content']}: mWR={r['mWR']:.4f} 1/R={r['invR']/1000:.2f} TeV {r['kk']} "
          f"weakBroken={r['weakBroken']} colourBroken={r['colourBroken']} higgs={r['higgs']} anomaly@min={r['anomVac']}")

sec("4. sin2 across ALL cells that fix Y (not only full)")
fixed = [r for r in rows if r["sin2"] is not None]
print(f"  rows with Y fixed: {len(fixed)}; sin2 values:", dict(collections.Counter(r["sin2"] for r in fixed).most_common(12)))
print("  by number of fields found:", {k: dict(collections.Counter(r["sin2"] for r in fixed if r["cellFound"] == k).most_common(5)) for k in range(1, 6)})

sec("5. which fields are missing most, and where Q ever appears")
miss = collections.Counter()
for r in rows:
    if r["cellMissing"]:
        for m in r["cellMissing"]: miss[m] += 1
print("  missing counts over rows with a partial cell:", dict(miss))
withQ = [r for r in rows if r["cellFound"] and r["cellMissing"] is not None and "Q" not in r["cellMissing"]]
print("  rows where Q is found:", len(withQ), " their sin2:", dict(collections.Counter(str(r["sin2"]) for r in withQ).most_common(8)))
print("  boundary conditions hosting Q:", dict(collections.Counter(f"SU({r['N']}) [{','.join(map(str, r['bc']))}]" for r in withQ).most_common(12)))

sec("6. anomalies at the minimum vs at the symmetric point of the frame")
print("  anomaly verdict at the minimum, all rows:", dict(collections.Counter(r["anomVac"] for r in rows)))
print("  among full cells:", dict(collections.Counter(r["anomVac"] for r in full)))

sec("7. exotics: the bill of the full-cell models")
print("  exotic components (dim) among full cells:", dict(collections.Counter(r["exoticDim"] for r in full).most_common(10)))

sec("8. the Wilson line and the cell: does breaking ever land on colour?")
print("  colour broken by the vacuum, all rows with a cell:", dict(collections.Counter(r["colourBroken"] for r in rows if r["cellFound"])))
cb = [r for r in rows if r["colourBroken"]]
print("  examples:", [f"SU({r['N']}) [{','.join(map(str, r['bc']))}] {r['content']} θ={r['theta']}" for r in cb[:5]])

sec("9. laws to test: every full-cell row satisfies ...")
def law(name, pred):
    bad = [r for r in full if not pred(r)]
    print(f"  {name}: {'HOLDS' if not bad else 'FAILS'} on {len(full) - len(bad)}/{len(full)}" +
          ("" if not bad else f"  counterexample SU({bad[0]['N']}) [{','.join(map(str, bad[0]['bc']))}] {bad[0]['content']}"))
law("sin2 = 3/8", lambda r: r["sin2"] == "3/8")
law("at least one Wilson-line phase", lambda r: r["phases"] >= 1)
law("the weak block has size 2 and colour size 3 in DIFFERENT letters", lambda r: r["colour"] != r["weak"])
law("N >= 6", lambda r: r["N"] >= 6)
law("content has both an η=+ and an η=− field", lambda r: "+" in r["content"] and "-" in r["content"])
law("content has an antisymmetric", lambda r: "anti" in r["content"])
law("the vacuum does not break colour", lambda r: not r["colourBroken"])
law("anomaly at the minimum is not 'no subject'", lambda r: r["anomVac"] != "no subject")
