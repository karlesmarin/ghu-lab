#!/usr/bin/env python3
"""scan_map.py -- the picture a researcher wants first: where the models live against where the
data are.  One point per theory with a full Standard-Model cell and a Wilson-line W, from
scan_predict.mjs's table: 1/R on the horizontal axis, the one-loop Higgs mass on the vertical,
with the measured m_h and the CMS coloron bound drawn as the lines they are.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  python tools/scan_map.py data/scan_2026-09-03/predictions.md out.png
"""
import re
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

rows = []
for line in open(sys.argv[1], encoding="utf-8"):
    if not line.startswith("| SU("):
        continue
    c = [x.strip() for x in line.strip().strip("|").split("|")]
    model, phases, mWR, invR, mH, sin2, top, higgs, colour, anom, exo, kk = c
    try:
        rows.append(dict(model=model, invR=float(invR), mH=float(mH.split()[0]) if mH[0].isdigit() else None,
                         sin2=float(sin2.split("/")[0]), higgs=int(higgs), colour=colour == "true"))
    except ValueError:
        pass

fig, ax = plt.subplots(figsize=(8.4, 5.4), dpi=130)
ax.axvspan(0.05, 6.6, color="#e33", alpha=0.08, lw=0)
ax.axvline(6.6, color="#c33", lw=1.2, ls="--")
ax.text(6.7, 12, "CMS dijet: colour-octet vectors\nexcluded below 6.6 TeV\n(if colour is in the bulk)", fontsize=8, color="#c33", va="bottom")
ax.axhline(125.2, color="#37c", lw=1.2, ls="--")
ax.text(0.052, 128, "m_h = 125.20 GeV (PDG 2024)", fontsize=8, color="#37c")
for r in rows:
    if r["mH"] is None:
        continue
    mk = "o" if r["higgs"] else "x"
    col = "#888" if r["colour"] else ("#2a7" if r["sin2"] == 0.375 else "#a63")
    ax.plot(r["invR"], r["mH"], mk, ms=6 if r["higgs"] else 5, color=col, alpha=0.85, mew=1.2)
ax.plot([], [], "o", color="#2a7", label="full cell, Higgs doublet, sin²θ_W = 3/8")
ax.plot([], [], "o", color="#a63", label="full cell, Higgs doublet, other sin²θ_W")
ax.plot([], [], "x", color="#2a7", label="full cell, no Higgs doublet")
ax.plot([], [], "o", color="#888", label="the vacuum breaks colour")
ax.set_xscale("log"); ax.set_yscale("log")
ax.set_xlim(0.05, 20); ax.set_ylim(5, 400)
ax.set_xlabel("1/R from the measured m_W  [TeV]")
ax.set_ylabel("one-loop Higgs mass, g₄ = g₂(1/R)  [GeV]")
ax.set_title("Every 5D SU(5)–SU(7) model on S¹/Z₂ with a full Standard-Model generation\n(bulk of up to four fields, multiplicity one) against the data", fontsize=10)
ax.legend(fontsize=7.5, loc="lower right")
ax.grid(True, which="both", alpha=0.25)
fig.tight_layout()
fig.savefig(sys.argv[2])
print(len(rows), "theories drawn")
