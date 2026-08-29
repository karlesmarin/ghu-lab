#!/usr/bin/env python3
"""make_series.py — the series record, fetched rather than retyped.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Emits data/series.json: one entry per paper of the GHU series, carrying the title, the concept
  DOI, the version of record, its date, the repository, and the abstract as the archive itself
  holds it.

      python build/make_series.py            fetch and write
      python build/make_series.py --offline  refuse to fetch; only re-derive the unpublished parts

A paper page that prints a DOI is making a claim about a permanent record, and a hand-typed DOI is
the cheapest possible way to make that claim falsely.  So every published field here comes from
Zenodo's own API at generation time, and the *unpublished* parts carry `doi: null` — the site
renders that as "not yet deposited" and there is no code path that lets it print a number instead.

The one field this file is allowed to assert is `status`, and only through a rule it applies
uniformly: a part is `published` iff Zenodo returns a record for its concept id.
"""
import argparse
import datetime
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from sources import root as _sources_root                               # noqa: E402
CURIOSITY = _sources_root("the staged Zenodo metadata of unpublished parts")
ZENODO = "https://zenodo.org/api"

# numeral, concept id (None while unpublished), github repo, the section ids of the instrument this
# paper is behind, and the local staging directory in Curiosity that holds its release material.
PARTS = [
    ("I", "21432625", "ghu-su4-completion", [], "release"),
    ("II", "21432627", "su4-sm-cell-criterion", ["selection"], "release_ii"),
    ("III", "21438226", "centre-parity-selection", ["selection"], "release_iii"),
    ("IV", "21463000", "schur-nonidentity-o4", ["calculator", "eta"], "release_iv"),
    ("V", "21727094", "higgs-blind-class", ["calculator", "eta"], "release_v"),
    # Part VI was deposited on 2026-08-20 and Part VII on 2026-08-24; both concept ids resolve,
    # and the repositories exist.  Until then the two carried None here, and the site rendered
    # "not yet deposited" -- which it kept rendering for five days after the fact, because
    # publishing a part does not update the site by itself.  [[gate-the-whole-artifact-before-publish]]
    ("VI", "22033302", "su7-proton-row", ["anomalies", "escape", "screen"], "release_vi"),
    ("VII", "22087251", "su7-compactification-bound",
     ["hierarchy", "atlas7", "samepot", "screen", "collider", "fived"], None),
    # Part VIII, deposited 2026-08-29.  Same map as VII, run backwards and then counted, so it
    # gets two sections of its own rather than a footnote in the hierarchy one.
    ("VIII", "22159036", "su7-certified-gap", ["inverse", "census"], "release_viii"),
]

# Titles and leads for the parts that have no archived record to read them from.  Each one names
# the file it was taken from, and the generator checks that file still exists — an unpublished
# part is the only place where this repository holds text it did not fetch, so it is the only
# place that needs a tripwire.
UNPUBLISHED = {
    "VI": {
        "source": "release_vi/zenodo_metadata.json",
        "expected_date": "2026-08-20",
    },
    "VII": {
        "source": "part_vii/paper/su7_hierarchy.tex",
        "expected_date": None,
    },
}


def fetch(concept_id):
    import requests
    r = requests.get(f"{ZENODO}/records/{concept_id}/versions/latest", timeout=60)
    r.raise_for_status()
    j = r.json()
    m = j["metadata"]
    return {
        "title": m["title"],
        "abstract_html": m.get("description", ""),
        "doi": j.get("conceptdoi"),
        "version_doi": m.get("doi"),
        "version": m.get("version"),
        "date": m.get("publication_date"),
        "record_id": str(j["id"]),
    }


def from_staging(rel):
    """The Zenodo metadata as it is staged in Curiosity, for a part not yet deposited."""
    p = CURIOSITY / rel / "zenodo_metadata.json"
    if not p.exists():
        sys.exit(f"FATAL: {p} is missing; this generator must not invent a title.")
    m = json.loads(p.read_text(encoding="utf-8"))
    m = m.get("metadata", m)
    return {
        "title": m["title"],
        "abstract_html": m.get("description", ""),
        "doi": None,
        "version_doi": None,
        "version": m.get("version"),
        "date": m.get("publication_date"),
        "record_id": None,
    }


def from_tex(rel):
    """Title and abstract of a part that is still a .tex.  Read, never retyped."""
    p = CURIOSITY / rel
    if not p.exists():
        sys.exit(f"FATAL: {p} is missing; this generator must not invent a title.")
    src = p.read_text(encoding="utf-8", errors="replace")
    start = src.find(r"\begin{abstract}")
    end = src.find(r"\end{abstract}")
    if start < 0 or end < 0:
        sys.exit(f"FATAL: no abstract environment in {p}.")
    body = src[start + len(r"\begin{abstract}"):end]
    return {"abstract_tex": body.strip(), "source_file": str(p)}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true",
                    help="do not reach Zenodo; keep the published entries already on disk")
    a = ap.parse_args(argv)

    out_path = ROOT / "data" / "series.json"
    previous = {}
    if out_path.exists():
        for p in json.loads(out_path.read_text(encoding="utf-8"))["parts"]:
            previous[p["numeral"]] = p
    if a.offline and not previous:
        sys.exit("FATAL: --offline with no data/series.json to keep. Run it online once.")

    parts = []
    for numeral, cid, repo, sections, staging in PARTS:
        entry = {"numeral": numeral, "repo": repo, "sections": sections}
        if cid:
            if a.offline:
                if numeral not in previous:
                    sys.exit(f"FATAL: --offline and Part {numeral} is not in the existing file.")
                entry.update({k: v for k, v in previous[numeral].items()
                              if k not in ("numeral", "repo", "sections")})
                entry["status"] = "published"
            else:
                entry.update(fetch(cid))
                entry["status"] = "published"
            entry["concept_id"] = cid
        else:
            hint = UNPUBLISHED[numeral]
            if numeral == "VII":
                tex = from_tex(hint["source"])
                entry.update({
                    "title": "The compactification scale of SU(7) grand gauge-Higgs unification "
                             "is bounded",
                    "abstract_html": None,
                    "abstract_tex": tex["abstract_tex"],
                    "doi": None, "version_doi": None, "version": None, "date": None,
                    "record_id": None, "status": "draft",
                })
            else:
                entry.update(from_staging(staging))
                entry["status"] = "in press"
            entry["concept_id"] = None
            entry["staged_from"] = hint["source"]
            if hint["expected_date"] and entry.get("date") != hint["expected_date"]:
                sys.exit(f"FATAL: Part {numeral} is staged for {hint['expected_date']} but its "
                         f"metadata says {entry.get('date')}. One of the two moved; fix the "
                         f"other before this file ships a wrong date.")
        parts.append(entry)

    doc = {
        "generated": datetime.datetime.now(datetime.timezone.utc)
                             .strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "published": "zenodo.org/api/records/<concept>/versions/latest",
            "unpublished": "research/smeft_formalization (the authoring tree; set GHU_SOURCES)",
            "note": "A part with doi: null has no permanent record yet. The site must say so and "
                    "must not print a number in its place.",
        },
        "parts": parts,
    }
    out_path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n",
                        encoding="utf-8", newline="\n")
    pub = sum(1 for p in parts if p["status"] == "published")
    print(f"wrote {out_path}  ({len(parts)} parts, {pub} published, "
          f"{len(parts) - pub} without a DOI)")
    for p in parts:
        print(f"  {p['numeral']:<4} {p['status']:<10} {p['doi'] or '(no DOI yet)':<28} "
              f"{p['title'][:52]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
