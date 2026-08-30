#!/usr/bin/env python3
"""make_census.py — what the gauge-Higgs literature actually PUBLISHES, measured over the corpus.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

THE QUESTION THE CENSUS ANSWERS.  To compare two gauge-Higgs models you need a triple from each:
the bulk CONTENT, the MINIMUM of the Wilson-line potential, and a mass -- m_h or the
compactification scale.  Nobody has a list of who publishes it.  There is no dataset to consult:
HEPData is experimental, and the tables of gauge-Higgs theory live inside PDFs and nowhere else.

So this is curation, not calculation, and the honest way to curate is in two halves.

  MEASURED, over every paper in the corpus: which signals a paper's text carries.  Cheap, complete
  and reproducible -- and it is what turns eighty-six papers into a shortlist rather than into a
  claim.  A signal firing is NOT a finding: it means "worth opening".

  READ, by a person, for the rows the census actually asserts.  Those carry page and equation
  numbers and are kept in `census_curated.json` beside this script.  A row that says a paper
  publishes a minimum means somebody looked at the page.

The two are kept apart in the output, and the section says which is which.  Conflating them would
make a keyword sweep look like a literature review, which is the failure this file is shaped to
avoid.

A NOTE THAT COST THIS PROJECT A DAY.  A PDF's text layer is not its page: on 2026-08-30 we spent a
day proving a correct published formula wrong because an extraction had silently eaten two
characters.  So the sweep records, per paper, whether its text layer carries glyphs that do not
survive extraction -- the same check `pdf_glyph_audit.py` runs -- and any paper flagged there is
marked `text_layer: suspect`.  Nothing is quoted from those without opening the page.

    python build/make_census.py            (writes data/census.json)
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sources  # noqa: E402

try:
    import fitz
except ImportError:
    sys.exit("FATAL: PyMuPDF (fitz) is needed to read the corpus. pip install pymupdf")

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "data" / "census.json"
CURATED = HERE / "census_curated.json"

# ---------------------------------------------------------------------------- the signals
#
# Each is a marker for one leg of the triple.  Deliberately BROAD: this stage decides what is worth
# opening, and a false positive costs a look while a false negative costs a paper.  None of these
# is quoted as a finding anywhere.
SIGNALS = {
    "wilson_minimum": [r"\bminim(um|a|ise|ize)\b.{0,80}\b(potential|Wilson|alpha|α)",
                       r"\b(alpha|α)[_ ]?\{?min", r"\bvacuum expectation value of A_?5"],
    "higgs_mass": [r"\bm_?\{?h\}?\b", r"\bHiggs (boson )?mass\b", r"125(\.\d+)? ?GeV"],
    "compactification_scale": [r"\b1/R\b", r"compactification scale", r"\bR\^\{?-1\}?"],
    "bulk_content": [r"\bbulk (fermion|field|matter|content)", r"\brepresentation(s)? in the bulk"],
    "effective_potential": [r"effective potential", r"one[- ]loop potential"],
    "orbifold": [r"S\^?1/Z_?2", r"T\^?2/Z_?[2-6]", r"orbifold"],
    "blkt": [r"brane[- ]localized kinetic", r"\bBLKT\b"],
    "warped": [r"\bRandall[- ]Sundrum\b", r"\bwarped\b", r"AdS_?5"],
}
RX = {k: [re.compile(p, re.I) for p in v] for k, v in SIGNALS.items()}


def unrenderable(page):
    """Glyphs the text layer cannot carry -- the same test as pdf_glyph_audit.py."""
    n = 0
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for ch in span["chars"]:
                    if ord(ch["c"]) < 32 or ord(ch["c"]) == 0xFFFD:
                        n += 1
    return n


def scan(path):
    """One paper: its signals, its size, and whether its text layer may be trusted."""
    out = {"id": path.stem, "file": path.name, "kind": path.suffix.lstrip(".")}
    if path.suffix == ".pdf":
        try:
            doc = fitz.open(path)
        except Exception as e:                                   # a file that will not open is a fact too
            out["error"] = str(e)[:120]
            out["signals"] = []
            out["readable"] = False
            return out
        out["pages"] = doc.page_count
        text = []
        bad = 0
        for p in doc:
            text.append(p.get_text())
            bad += unrenderable(p)
        out["lost_glyphs"] = bad
        out["text_layer"] = "suspect" if bad else "ok"
        text = "\n".join(text)
    else:
        text = path.read_text(encoding="utf-8", errors="replace")
        out["pages"] = None
        out["text_layer"] = "unknown"          # a .txt has already been through an extraction
    out["chars"] = len(text)
    out["signals"] = sorted(k for k, pats in RX.items() if any(p.search(text) for p in pats))

    # A PAPER THIS SWEEP CANNOT READ HAS NOT BEEN MEASURED, and must never be counted as one that
    # publishes nothing.  Two ways it happens, and both are common in this corpus: a text layer
    # that lost glyphs (an equation-heavy paper can lose hundreds), or a body so thin that the
    # extraction returned a cover page.  `readable` is that verdict, and the section shows it as a
    # third state rather than folding it into "no".
    out["readable"] = bool(out["signals"]) or (out["chars"] > 20000 and not out.get("lost_glyphs"))
    return out


def main():
    papers = sources.root("the paper corpus") / "_papers"
    if not papers.exists():
        sys.exit(f"FATAL: no corpus at {papers}. The census reads the papers themselves.")

    seen, rows = {}, []
    for p in sorted(papers.iterdir()):
        if p.suffix not in (".pdf", ".txt"):
            continue
        # one row per PAPER, and the PDF wins: a .txt is an extraction of one and cannot be audited
        if p.stem in seen and seen[p.stem] == ".pdf":
            continue
        r = scan(p)
        if p.stem in seen:                                        # replace a .txt with its .pdf
            rows = [x for x in rows if x["id"] != p.stem]
        seen[p.stem] = p.suffix
        rows.append(r)
        print(f"  {r['id']:<34} {r.get('text_layer','-'):<8} "
              f"{r.get('lost_glyphs', 0):>5}  {','.join(r['signals'])}")

    curated = json.loads(CURATED.read_text(encoding="utf-8")) if CURATED.exists() else {"rows": []}
    ids = {c["id"] for c in curated["rows"]}
    missing = [c["id"] for c in curated["rows"] if c["id"] not in seen]
    if missing:
        sys.exit(f"FATAL: {CURATED.name} asserts rows for papers not in the corpus: {missing}.\n"
                 f"       A curated row names a page somebody read; if the paper is gone the row\n"
                 f"       cannot be checked and must not ship.")

    # THE SAME PAPER UNDER TWO FILENAMES IS ONE PAPER, and a census that counts it twice has the
    # wrong denominator -- which is the one number a census is for.  Filenames in this corpus grew
    # by hand over months, so `2409.16137` and `ccd24_2409.16137` are the same preprint.  Matched
    # on the arXiv identifier the filename carries, which is the only part of it that is not a
    # nickname.
    import collections
    by_eprint = collections.defaultdict(list)
    for r in rows:
        m = re.search(r"(\d{4}\.\d{4,5})|((?:hep-ph|hep-th|math)[_/]\d{7})", r["id"])
        if m:
            key = (m.group(0) or "").replace("_", "/")
            r["eprint"] = key
            by_eprint[key].append(r["id"])
    duplicates = {k: v for k, v in by_eprint.items() if len(v) > 1}

    triple = ["wilson_minimum", "higgs_mass", "compactification_scale"]
    shortlist = sorted(r["id"] for r in rows if all(t in r["signals"] for t in triple))
    unreadable = sorted(r["id"] for r in rows if not r.get("readable"))

    doc = {
        "what": "The gauge-Higgs literature, measured for what it publishes and curated for what "
                "we have read.",
        "produced_by": "build/make_census.py",
        "corpus": {
            "papers": len(rows),
            "pdf": sum(1 for r in rows if r["kind"] == "pdf"),
            "text_only": sum(1 for r in rows if r["kind"] == "txt"),
            "text_layer_suspect": sum(1 for r in rows if r.get("text_layer") == "suspect"),
            "not_readable_by_this_sweep": len(unreadable),
            "duplicate_files": sum(len(v) - 1 for v in duplicates.values()),
            "distinct_papers": len(rows) - sum(len(v) - 1 for v in duplicates.values()),
        },
        "duplicates": {
            "why": "the same preprint under two filenames, matched on the arXiv identifier. The "
                   "corpus grew by hand; a census that counts one paper twice has the wrong "
                   "denominator, which is the one number a census exists to give.",
            "groups": duplicates,
        },
        "unreadable": {
            "why": "no signal fired AND the text layer lost glyphs or returned almost nothing. "
                   "These papers have NOT been measured; counting them as publishing nothing would "
                   "be the sweep reporting its own blind spot as a property of the literature.",
            "ids": unreadable,
        },
        "signals": {k: [p.pattern for p in v] for k, v in RX.items()},
        "shortlist": {
            "criterion": "the text carries all three legs of the triple: a minimum, a Higgs mass "
                         "and a compactification scale",
            "note": "a signal firing means WORTH OPENING and nothing else; the census asserts "
                    "nothing from this list that a curated row does not also carry",
            "ids": shortlist,
        },
        "measured": rows,
        "curated": curated["rows"],
        "curated_note": curated.get("note", ""),
        "coverage": {
            "curated_rows": len(ids),
            "of_corpus": len(rows),
            "shortlisted_but_not_read": sorted(set(shortlist) - ids),
        },
    }
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    dup = sum(len(v) - 1 for v in duplicates.values())
    print(f"\n  corpus {len(rows)} files, {len(rows) - dup} distinct papers "
          f"({dup} duplicate filename{'s' if dup != 1 else ''}) · "
          f"shortlist {len(shortlist)} · curated {len(ids)}")
    print(f"  text layer suspect on {doc['corpus']['text_layer_suspect']} of "
          f"{doc['corpus']['pdf']} PDFs")
    print(f"  NOT readable by this sweep: {len(unreadable)} -- not measured, not a finding")
    print(f"  wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
