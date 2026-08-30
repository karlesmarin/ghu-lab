#!/usr/bin/env python3
"""build_site.py — the pages around the instrument, and the gates that keep them honest.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  Renders site/ from data/series.json, changes/*.md and src/site/*: the home page, one living page
  per paper, the change log, the docs, the editions index, and a copy of the instrument.

      python build/build_site.py
      python build/build_site.py --legacy ../ghu-explorer/tools-2026-07

  (`--legacy` names the directory holding the three July 2026 pages by their original file
  names.  Before the site was deployed that was the root of the published repository; since
  2026-08-09 the root serves the home page and the three live under tools-2026-07/, so the
  path now ends there.  Pointing it at the root builds a site whose "carried" pages are the
  home page itself, and the link check catches it -- as it did on 2026-08-26.)

Three rules decide everything here, and each is enforced rather than intended.

  1. **No page may print a DOI that data/series.json does not hold.**  A DOI is a claim about a
     permanent record; a hand-typed one is the cheapest way to make that claim falsely.  Parts
     without a record render "not yet deposited" and there is no branch that can print a number.
  2. **Every link must resolve on disk**, so the site works identically from `file://` and from a
     web server.  That is why every href ends in an explicit `index.html`: a bare directory link
     is a 404 under `file://`, and nobody notices until a reader does.
  3. **Nothing external.**  No font, no CDN, no analytics.  The pages carry links to other sites,
     which is different from depending on them; the gate in _test_site.py knows the difference.

`--legacy` takes the working copy of the published ghu-explorer repository and carries its three
pages into the new site *at the URLs they already have*, because five Zenodo records point at that
host.  A link in a published record is not ours to break.
"""
import argparse
import datetime
import html
import json
import pathlib
import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_app                                                            # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / "src" / "site"
OUT = ROOT / "site"

# Where the instrument's header points on the site.  One constant, read by the build and by the
# gate, so the two cannot disagree about what the difference between the two copies is.
APP_HOME = "../index.html"

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
SLUG = {n: "part-" + n.lower() for n in ROMAN}

SEVERITIES = {
    "note":        ("a clarification; no number moves", False),
    "extension":   ("new material; the record is still correct", False),
    "correction":  ("a number or a statement moves", True),
    "withdrawal":  ("a claim is retracted", True),
}

SECTION_NAMES = {
    "selection": "selection rule",
    "calculator": "model calculator",
    "eta": "eta-meter",
    "anomalies": "anomalies &amp; proton",
    "escape": "escape from proton decay",
    "hierarchy": "hierarchy",
    "samepot": "same potential?",
    "screen": "screen a table",
    "fived": "five dimensions",
    "collider": "collider",
    "atlas7": "atlas",
    "inverse": "design a scale",
    "census": "count a rung",
}


# ------------------------------------------------------------------ tiny, total renderers

class Sanitiser(HTMLParser):
    """Zenodo's abstracts are HTML we did not write.  Keep the handful of tags that carry meaning,
    drop the rest to their text.  Not a security boundary — the input is our own archive — but a
    guarantee that a stray <div style> from an upload never redecorates a page."""
    KEEP = {"p", "strong", "em", "b", "i", "ul", "ol", "li", "br", "sub", "sup", "code", "a"}

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.KEEP:
            return
        if tag == "a":
            href = dict(attrs).get("href", "")
            if not href.startswith(("http://", "https://", "mailto:")):
                return                                  # a relative link out of an abstract is a
            self.out.append(f'<a href="{html.escape(href)}">')   # dangling one; drop it to text
        else:
            self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if tag in self.KEEP and tag != "br":
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        self.out.append(html.escape(data, quote=False))

    def handle_entityref(self, name):
        self.out.append(f"&{name};")

    def handle_charref(self, name):
        self.out.append(f"&#{name};")

    def text(self):
        return "".join(self.out).strip()


def sanitise(fragment):
    s = Sanitiser()
    s.feed(fragment or "")
    s.close()
    return s.text()


INLINE = [
    # ESCAPED ONCE, NOT TWICE.  `inline()` escapes the whole text before these rules run, so the
    # group this matches is ALREADY escaped; calling html.escape on it again turned a `<` inside a
    # code span into `&amp;lt;` and rendered the entity itself on the page.  It never fired until
    # 2026-08-27, because no entry had ever put a `<`, `>` or `&` between backticks -- the first
    # one that did was the entry about a boolean that could not say "not asked".
    (re.compile(r"`([^`]+)`"), lambda m: f"<code>{m.group(1)}</code>"),
    (re.compile(r"\*\*([^*]+)\*\*"), lambda m: f"<strong>{m.group(1)}</strong>"),
    (re.compile(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])"), lambda m: f"<em>{m.group(1)}</em>"),
]


def inline(text):
    """The only markup the change log is allowed to use.  Escaped first, so a stray < in a
    changelog entry can never open a tag."""
    out = html.escape(text, quote=False)
    for rx, fn in INLINE:
        out = rx.sub(fn, out)
    return out


def read_entry(path):
    """One change: `--- key: value ---` front matter, then `what` / `why` / `so` blocks written as
    a definition list, which is what they are."""
    src = path.read_text(encoding="utf-8")
    if not src.startswith("---"):
        sys.exit(f"FATAL: {path.name} has no front matter.")
    _, fm, body = src.split("---", 2)
    meta = {}
    for line in fm.strip().splitlines():
        if ":" not in line:
            sys.exit(f"FATAL: {path.name}: front-matter line without a colon: {line!r}")
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip()

    blocks, key, buf = [], None, []
    for line in body.strip().splitlines():
        if re.fullmatch(r"[a-z]+", line.strip()) and not line.startswith((" ", ":")):
            if key:
                blocks.append((key, "\n".join(buf).strip()))
            key, buf = line.strip(), []
        elif line.startswith(":"):
            buf.append(line[1:].strip())
        else:
            buf.append(line.strip())
    if key:
        blocks.append((key, "\n".join(buf).strip()))
    if [k for k, _ in blocks] != ["what", "why", "so"]:
        sys.exit(f"FATAL: {path.name} must answer exactly what / why / so, in that order; "
                 f"it has {[k for k, _ in blocks]}.")

    for need in ("date", "part", "severity", "affects_record", "title"):
        if need not in meta:
            sys.exit(f"FATAL: {path.name} has no {need}.")
    if meta["severity"] not in SEVERITIES:
        sys.exit(f"FATAL: {path.name} has severity {meta['severity']!r}; "
                 f"the four are {sorted(SEVERITIES)}.")
    # A CHANGE MAY BELONG TO NO PART, and that had to become sayable the day the instrument grew a
    # section that is not about a paper of ours -- the general SU(N) builder answers a question
    # nobody in this series asked.  `part: instrument` is the only other admissible value, and it
    # is a NAME rather than an empty field, so a missing part is still the error it was.
    if meta["part"] not in ROMAN and meta["part"] != "instrument":
        sys.exit(f"FATAL: {path.name} names part {meta['part']!r}, which is neither a part of the "
                 f"series nor 'instrument'.")
    datetime.date.fromisoformat(meta["date"])
    forces = SEVERITIES[meta["severity"]][1]
    says = meta["affects_record"].lower() in ("yes", "true")
    if forces != says:
        sys.exit(f"FATAL: {path.name} is a {meta['severity']} but says affects_record: "
                 f"{meta['affects_record']}. A {meta['severity']} "
                 f"{'requires' if forces else 'does not require'} a new frozen version, and the "
                 f"log may not disagree with its own table.")
    meta["blocks"] = blocks
    meta["file"] = path.name
    return meta


def paras(text):
    return "".join(f"<p>{inline(p)}</p>" for p in re.split(r"\n\s*\n", text) if p.strip())


# ------------------------------------------------------------------ the sources

def load_defaults():
    """The defaults table, parsed out of the one file allowed to declare a default."""
    src = (ROOT / "src" / "kernel" / "model.mjs").read_text(encoding="utf-8")
    block = re.search(r"export const DEFAULTS = \{(.*?)\n\};", src, re.S)
    if not block:
        sys.exit("FATAL: no DEFAULTS block in model.mjs; the docs page may not invent one.")
    rows = re.findall(
        r'"([\w.]+)":\s*\{\s*value:\s*(.+?),\s*units:\s*"([^"]*)",\s*source:\s*"([^"]*)"\s*\}',
        block.group(1))
    if len(rows) < 4:
        sys.exit(f"FATAL: parsed {len(rows)} defaults out of model.mjs; the parser has drifted "
                 f"from the file. Fix the parser — do not ship a short table.")
    return rows


def load_groups():
    out = []
    # NOT EVERY FILE IN data/ IS A GROUP.  `series.json` is the record of the papers, and
    # `census.json` is about the LITERATURE rather than about a model -- neither has a group, an
    # orbifold or a source paper, and the loader below would be right to refuse them.  Named here
    # rather than skipped by a shape test, so a new group file that is merely malformed still
    # fails loudly instead of being quietly taken for one of these.
    NOT_A_GROUP = {"series.json", "census.json"}
    for p in sorted((ROOT / "data").glob("*.json")):
        if p.name in NOT_A_GROUP:
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        src = d["source"]
        out.append({
            "id": d["id"], "group": d["group"], "orbifold": d["orbifold"]["name"],
            # the two data files disagree on the key, because one cites one paper and the other
            # cites three.  Read both rather than making one of them lie.
            "source": src.get("paper") or src["papers"], "file": p.name,
            "anchor": d.get("anchor", {}).get("label", "—"),
            "caveat": d.get("anchor", {}).get("caveat", ""),
        })
    if not out:
        sys.exit("FATAL: no group data files found.")
    return out


def anchor_sentence(groups):
    """The site's first warning is generated from the data, not typed, so it cannot go stale while
    the numbers behind it move."""
    for g in groups:
        if g["caveat"]:
            return (f"Our &alpha; does not reproduce the published &alpha; of {g['source']}, and "
                    f"the disagreement is <strong>not a constant</strong> &mdash; so it is not a "
                    f"convention that could be absorbed. Every absolute scale on this site "
                    f"(TeV, GeV) inherits that open question and is <strong>not citable</strong> "
                    f"until it closes. What escapes it entirely, because no normalisation enters "
                    f"them: the mass ratio, the bill in eighths, and the two arithmetic laws. "
                    f"The instrument states this in its own header and carries a permanent "
                    f"&ldquo;what this cannot tell you&rdquo; panel; the reasoning is in "
                    f"<a href=\"changes/index.html\">the log</a>.")
    sys.exit("FATAL: no anchor caveat in any data file. Either the gap closed — in which case "
             "delete this gate deliberately — or a data file lost its caveat.")


# ------------------------------------------------------------------ rendering

TABLE_RX = re.compile(r"<table>.*?</table>", re.S)


def page(shell, css, *, title, desc, body, depth, here, build):
    root = "../" * depth
    # Every table gets a scroll container.  Done here rather than at each call site so that a table
    # added later cannot forget it -- on a phone an unwrapped one pushes the whole page sideways.
    body = TABLE_RX.sub(lambda m: f'<div class="tw">{m.group(0)}</div>', body)
    out = (shell
           .replace("__CSS__", css)
           .replace("__TITLE__", html.escape(title))
           .replace("__DESC__", html.escape(desc, quote=True))
           .replace("__BODY__", body)
           .replace("__BUILD__", build)
           .replace("__ROOT__", root))
    for key in ("APP", "PAPERS", "CHANGES", "DOCS", "EDITIONS"):
        out = out.replace(f"__NAV_{key}__", ' aria-current="page"' if key == here else "")
    left = re.search(r"__[A-Z_]+__", out)
    if left:
        sys.exit(f"FATAL: {left.group(0)} survived substitution on page {title!r}.")
    return out


# The archived titles carry "(Part III)" at the end, because a Zenodo record has to stand alone.
# Here the numeral is already the first thing on the line, so the suffix would print twice.
PART_SUFFIX = re.compile(r"\s*\(Part\s+[IVXLC]+\)\s*$")


def title_of(part):
    return PART_SUFFIX.sub("", part["title"]).strip()


def status_chip(part):
    if part["status"] == "published":
        return '<span class="chip thm">published</span>'
    if part["status"] == "in press":
        return '<span class="chip ver">in press</span>'
    return '<span class="chip unk">draft</span>'


def series_table(parts, changes, depth=0):
    root = "../" * depth
    rows = []
    for p in parts:
        n = p["numeral"]
        cnt = sum(1 for c in changes if c["part"] == n)
        doi = (f'<a href="https://doi.org/{p["doi"]}">{p["doi"]}</a>' if p["doi"]
               else '<span style="color:var(--ink3)">not yet deposited</span>')
        rows.append(
            f'<tr><td class="num">{n}</td>'
            f'<td><a href="{root}papers/{SLUG[n]}/index.html">{html.escape(title_of(p))}</a><br>'
            f'<span style="font-size:13px;color:var(--ink3)">{doi}</span></td>'
            f'<td>{status_chip(p)}<br>'
            f'<span style="font-size:12.5px;color:var(--ink3)">'
            f'{cnt} change{"s" if cnt != 1 else ""}</span></td></tr>')
    return ('<table><thead><tr><th style="width:44px">part</th><th>paper</th>'
            f'<th style="width:118px">record</th></tr></thead><tbody>{"".join(rows)}'
            '</tbody></table>')


def entry_html(c, depth, with_part=True):
    root = "../" * depth
    # a change with no part has no paper page to link to, and says so instead of linking nowhere
    part = ("" if not with_part
            else f'<a href="{root}papers/{SLUG[c["part"]]}/index.html">Part {c["part"]}</a> &middot; '
            if c["part"] in SLUG else "the instrument &middot; ")
    affects = ("affects the record: <strong>YES</strong>"
               if SEVERITIES[c["severity"]][1] else "affects the record: no")
    verify = (f'<dt>check</dt><dd>{inline(c["verify"])}</dd>' if c.get("verify") else "")
    body = "".join(f"<dt>{k}</dt><dd>{paras(v)}</dd>" for k, v in c["blocks"])
    return (f'<div class="entry"><div class="hd">'
            f'<span class="dt">{c["date"]}</span>'
            f'<span class="sev-{c["severity"]}" style="font-weight:650;font-size:12.5px;'
            f'text-transform:uppercase;letter-spacing:.05em">{c["severity"]}</span>'
            f'<span style="font-size:12.5px;color:var(--ink3);margin-left:auto">{part}{affects}'
            f'</span></div>'
            f'<h3>{inline(c["title"])}</h3><dl>{body}{verify}</dl></div>')


def paper_page(p, changes, build, shell, css):
    n = p["numeral"]
    mine = [c for c in changes if c["part"] == n]
    lead_file = SITE_SRC / "leads" / f"{SLUG[n]}.html"

    if p["doi"]:
        rec = (f'<div class="row frozen"><span class="k">version of record</span>'
               f'<span><a href="https://doi.org/{p["doi"]}">{p["doi"]}</a> &middot; '
               f'{p["version"] or "v1"}, {p["date"]} &middot; frozen, and it stays frozen</span>'
               f'</div>')
    elif p["status"] == "in press":
        rec = ('<div class="row frozen"><span class="k">version of record</span>'
               f'<span><strong>not yet deposited</strong> &mdash; scheduled for {p["date"]}. '
               'No DOI exists yet, so none is printed here.</span></div>')
    else:
        rec = ('<div class="row frozen"><span class="k">version of record</span>'
               '<span><strong>none</strong> &mdash; this paper is a draft. Nothing on this page '
               'is citable.</span></div>')

    if mine:
        last = max(c["date"] for c in mine)
        kinds = {}
        for c in mine:
            kinds[c["severity"]] = kinds.get(c["severity"], 0) + 1
        detail = ", ".join(f"{v} {k}{'s' if v != 1 else ''}" for k, v in sorted(kinds.items()))
        living = (f'<span>living &middot; last updated {last} &middot; {len(mine)} change'
                  f'{"s" if len(mine) != 1 else ""} ({detail}) &rarr; '
                  f'<a href="#changes">below</a></span>')
    else:
        living = "<span>living &middot; nothing logged against this paper yet</span>"
    rec += f'<div class="row living"><span class="k">this page</span>{living}</div>'

    if p.get("abstract_html"):
        abstract = f'<h2>Abstract</h2><div class="abstract">{sanitise(p["abstract_html"])}</div>'
    elif lead_file.exists():
        abstract = (f'<h2>What it says</h2><div class="abstract">'
                    f'{lead_file.read_text(encoding="utf-8").strip()}</div>')
    else:
        abstract = ('<h2>Abstract</h2><p class="sub">Not reproduced here: this paper has no '
                    'archived record yet, and this page does not hold text the archive cannot '
                    'confirm.</p>')

    if p["sections"]:
        names = ", ".join(SECTION_NAMES[s] for s in p["sections"])
        app = (f'<div class="note"><strong>This paper is behind the {names} '
               f'{"sections" if len(p["sections"]) > 1 else "section"} of the instrument.</strong> '
               f'&nbsp;<a href="../../app/index.html">Open it &rarr;</a></div>')
    else:
        app = ('<p class="sub">This paper has no section of its own in the instrument; its results '
               'enter through the group data the other sections use.</p>')

    dl = ['<dl class="dl">']
    if p["doi"]:
        dl += [f'<dt>archive</dt><dd><a href="https://doi.org/{p["doi"]}">Zenodo &mdash; PDF, '
               f'scripts and ancillary archive</a> (concept DOI: always the latest version)</dd>']
        if p.get("version_doi"):
            dl += [f'<dt>this version</dt><dd><a href="https://doi.org/{p["version_doi"]}">'
                   f'{p["version_doi"]}</a></dd>']
    else:
        dl += ['<dt>archive</dt><dd>none yet</dd>']
    # A repository link is only printed for a paper that has one.  Until a paper is deposited its
    # repository does not exist, and a 404 in a "downloads" list is a claim that failed silently.
    if p["status"] == "published" and p["repo"]:
        dl += [f'<dt>code</dt><dd><a href="https://github.com/karlesmarin/{p["repo"]}">'
               f'github.com/karlesmarin/{p["repo"]}</a></dd>']
    elif p["repo"]:
        dl += [f'<dt>code</dt><dd>will be <code>github.com/karlesmarin/{html.escape(p["repo"])}'
               f'</code>, created with the record. It does not exist yet, so it is not a link.</dd>']
    else:
        dl += ['<dt>code</dt><dd>none yet</dd>']
    dl += ["</dl>"]

    chg = (f'<h2 id="changes">Changes since the record</h2>'
           + ("".join(entry_html(c, 2, with_part=False)
                      for c in sorted(mine, key=lambda c: c["date"], reverse=True))
              if mine else '<p class="sub">Nothing logged against this paper yet.</p>'))

    body = (f'<p class="sub"><a href="../index.html">&larr; the series</a></p>'
            f'<h1>Part {n} &middot; {html.escape(title_of(p))}</h1>'
            f'<div class="record">{rec}</div>'
            f'{abstract}{app}<h2>Downloads</h2>{"".join(dl)}{chg}')
    return page(shell, css, title=f"Part {n} — {title_of(p)}",
                desc=f"Part {n} of the GHU series: its record, its status, and what has moved "
                     f"since.",
                body=body, depth=2, here="PAPERS", build=build)


# ------------------------------------------------------------------ the build

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--legacy", type=pathlib.Path, default=None,
                    help="working copy of karlesmarin/ghu-explorer, whose URLs are already cited")
    ap.add_argument("--skip-tests", action="store_true",
                    help="build without gating it — do not deploy from such a build")
    a = ap.parse_args(argv)

    build = datetime.datetime.now().strftime("%Y-%m-%d")
    shell = (SITE_SRC / "page.html").read_text(encoding="utf-8")
    css = (SITE_SRC / "site.css").read_text(encoding="utf-8")
    series = json.loads((ROOT / "data" / "series.json").read_text(encoding="utf-8"))
    parts = series["parts"]
    groups = load_groups()
    changes = sorted((read_entry(p) for p in sorted((ROOT / "changes").glob("*.md"))),
                     key=lambda c: (c["date"], c["file"]), reverse=True)

    app_src = ROOT / "app" / "index.html"
    if not app_src.exists():
        sys.exit("FATAL: app/index.html does not exist. Run build/build_app.py first — the site "
                 "must not ship without the instrument it is built around.")

    if OUT.exists():
        shutil.rmtree(OUT)                     # a stale page left behind is a page that lies
    for d in ("app", "papers", "changes", "docs", "editions"):
        (OUT / d).mkdir(parents=True)

    written = []

    def write(rel, text):
        p = OUT / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8", newline="\n")
        written.append(rel)

    # --- home
    home = ((SITE_SRC / "home.html").read_text(encoding="utf-8")
            .replace("__ANCHOR_SENTENCE__", anchor_sentence(groups))
            .replace("__SERIES_TABLE__", series_table(parts, changes, 0))
            .replace("__CHANGES_RECENT__", "".join(entry_html(c, 0) for c in changes[:2])))
    write("index.html", page(shell, css,
                             title="GHU Lab — an instrument for gauge-Higgs unification",
                             desc="One bulk model, several computations over it, every output "
                                  "carrying what is known about it. Runs offline in the browser.",
                             body=home, depth=0, here="", build=build))

    # --- the instrument.  Rebuilt rather than copied, because the site's copy carries one thing
    # the standalone file must not: a link back to the home page.  Everything else is identical,
    # and _test_site.py proves that by normalising the one difference away.
    build_app.build(home=APP_HOME, out_path=OUT / "app" / "index.html")
    written.append("app/index.html")

    # --- the series index and one page per paper
    idx = (f'<h1>The series</h1><p class="lead">Seven papers on six-dimensional gauge-Higgs '
           f'unification. They are independent and are best read in order. Each has a page here '
           f'that says what its record is, what has moved since, and which part of the instrument '
           f'it is behind.</p>{series_table(parts, changes, 1)}'
           f'<div class="note">A paper page is <strong>living</strong>; the record it points to is '
           f'<strong>frozen</strong>. That is what a DOI is for, and the banner at the top of each '
           f'page says which of the two you are reading.</div>')
    write("papers/index.html", page(shell, css, title="The series — GHU Lab",
                                    desc="Seven papers on six-dimensional gauge-Higgs unification.",
                                    body=idx, depth=1, here="PAPERS", build=build))
    for p in parts:
        write(f"papers/{SLUG[p['numeral']]}/index.html", paper_page(p, changes, build, shell, css))

    # --- the log
    tbl = "".join(f'<tr><td><strong class="sev-{k}">{k}</strong></td><td>{d}</td>'
                  f'<td>{"<strong>yes</strong>" if r else "no"}</td></tr>'
                  for k, (d, r) in SEVERITIES.items())
    log = (f'<h1>What changed, when, and why</h1>'
           f'<p class="lead">One stream, newest first. Every entry answers three questions, and '
           f'the third &mdash; <em>so what</em> &mdash; is the one that decides whether the frozen '
           f'record has to move.</p>'
           f'<table><thead><tr><th style="width:120px">severity</th><th>what it is</th>'
           f'<th style="width:150px">new frozen version?</th></tr></thead><tbody>{tbl}</tbody>'
           f'</table>'
           f'<p>Git history is the audit trail underneath; this log is the human layer on top. '
           f'They are not the same thing and neither replaces the other.</p>'
           + ("".join(entry_html(c, 1) for c in changes) if changes
              else '<p class="sub">Nothing logged yet.</p>'))
    write("changes/index.html", page(shell, css, title="Changes — GHU Lab",
                                     desc="What changed in the papers and the tool, when, why, "
                                          "and whether the frozen record moves.",
                                     body=log, depth=1, here="CHANGES", build=build))

    # --- docs
    drows = "".join(f'<tr><td><code>{html.escape(k)}</code></td><td class="num">'
                    f'{html.escape(v)}</td><td>{html.escape(u) or "&mdash;"}</td>'
                    f'<td>{html.escape(s)}</td></tr>' for k, v, u, s in load_defaults())
    grows = "".join(f'<tr><td><code>{html.escape(g["id"])}</code></td><td>{html.escape(g["group"])}'
                    f'</td><td>{html.escape(g["orbifold"])}</td>'
                    f'<td>{html.escape(g["source"])}</td>'
                    f'<td>{html.escape(g["anchor"])}</td></tr>' for g in groups)
    cite = "<ul>" + "".join(
        f'<li><strong>Part {p["numeral"]}</strong> &mdash; '
        + (f'<code>doi:{p["doi"]}</code>' if p["doi"]
           else '<span style="color:var(--ink3)">no record yet; do not cite</span>')
        + "</li>" for p in parts) + "</ul>"
    docs = ((SITE_SRC / "docs.html").read_text(encoding="utf-8")
            .replace("__DEFAULTS_TABLE__",
                     '<table><thead><tr><th>key</th><th style="width:110px">default</th>'
                     '<th style="width:60px">units</th><th>what fixes it</th></tr></thead>'
                     f'<tbody>{drows}</tbody></table>')
            .replace("__GROUPS_TABLE__",
                     '<table><thead><tr><th>id</th><th>group</th><th>orbifold</th><th>from</th>'
                     f'<th>opens on</th></tr></thead><tbody>{grows}</tbody></table>')
            .replace("__CITE__", cite))
    write("docs/index.html", page(shell, css, title="Documentation — GHU Lab",
                                  desc="Conventions, glossary, how to reproduce every number "
                                       "without the tool, and how to cite it.",
                                  body=docs, depth=1, here="DOCS", build=build))

    # --- editions: the frozen copies, and the pages the published records already point at
    frozen, carried = [], []
    for p in sorted((ROOT / "editions").glob("*.html")):
        shutil.copyfile(p, OUT / "editions" / p.name)
        written.append(f"editions/{p.name}")
        frozen.append(p.name)
    if a.legacy:
        legacy = a.legacy.resolve()
        # All three go into ONE directory, keeping their file names.  The first attempt scattered
        # them -- the selection page into editions/, the other two at the root -- and broke the
        # relative links they carry to each other, which is a failure invisible until someone
        # clicks.  They are frozen artifacts: the site moves around them, they do not move.
        for src_name, dest in (("index.html", "tools-2026-07/index.html"),
                               ("calculator.html", "tools-2026-07/calculator.html"),
                               ("predictor.html", "tools-2026-07/predictor.html")):
            f = legacy / src_name
            if not f.exists():
                sys.exit(f"FATAL: --legacy given but {f} is not there. These three pages are "
                         f"cited from five published Zenodo records; do not ship a site that "
                         f"drops them silently.")
            (OUT / dest).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(f, OUT / dest)
            written.append(dest)
            carried.append((src_name, dest))

    ed_rows = "".join(f'<tr><td><a href="{n}">{n}</a></td><td>frozen copy of the instrument</td>'
                      f'</tr>' for n in frozen) or \
              '<tr><td colspan="2" style="color:var(--ink3)">No edition has been cut yet. The ' \
              'first is cut when the first paper that cites the tool is deposited.</td></tr>'
    car = ("".join(f'<li><a href="../{d}">/{d}</a> &mdash; the page previously served as '
                   f'<code>/{s}</code>, carried over byte for byte</li>' for s, d in carried)
           if carried else
           "<li>None carried in this build. Pass <code>--legacy</code> with the working copy of "
           "the published repository to bring them in.</li>")
    eds = (f'<h1>Editions</h1>'
           f'<p class="lead">A frozen copy of the instrument, one per released paper, '
           f'byte-identical to the copy archived with it. The living tool may be rewritten; a link '
           f'in a paper must not die because of that.</p>'
           f'<table><thead><tr><th>file</th><th>what it is</th></tr></thead>'
           f'<tbody>{ed_rows}</tbody></table>'
           f'<h2>Pages carried over from the earlier tools</h2>'
           f'<p>Five published Zenodo records link to the host these pages were served from. A URL '
           f'in a published record is not ours to break, so they keep working:</p><ul>{car}</ul>')
    write("editions/index.html", page(shell, css, title="Editions — GHU Lab",
                                      desc="The frozen copies of the instrument, one per released "
                                           "paper.",
                                      body=eds, depth=1, here="EDITIONS", build=build))

    total = sum((OUT / w).stat().st_size for w in written)
    print(f"built {OUT}  ({len(written)} files, {total / 1024:.1f} kB total)")
    for w in written:
        print(f"  {w:<44} {(OUT / w).stat().st_size / 1024:8.1f} kB")

    if a.skip_tests:
        print("\nchecks skipped by request — do not deploy from this build.")
        return 0
    # The build gates itself, exactly as build_app.py does.  A site that is built but not checked
    # is a site nobody checked, because the checking is the step that gets skipped.
    print()
    r = subprocess.run([sys.executable, "_test_site.py"], cwd=ROOT, capture_output=True, text=True)
    tail = [ln for ln in r.stdout.strip().split("\n") if ln.strip()][-1:] or ["(no output)"]
    print(f"  _test_site.py            {tail[0].strip()}")
    if r.returncode:
        print(r.stdout[-2500:])
        print("*** SITE RED — do not deploy ***")
    return r.returncode


if __name__ == "__main__":
    sys.exit(main())
