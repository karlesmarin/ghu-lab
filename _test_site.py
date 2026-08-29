#!/usr/bin/env python3
"""_test_site.py — the site, and the thirteen ways it is allowed to be wrong.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

  python _test_site.py          check site/ ; also prove every check can fail

Two halves, and the second is the one that makes the first worth running.  First every check runs
against the site as built and must find nothing.  Then each check is run again against a copy of
the site broken *on purpose*, in exactly the way that check exists to catch, and must find it.  A
guard that has never fired is not a guard — this repository has shipped one before.

The checks are not stylistic.  Each one corresponds to a way a static site quietly starts lying:

  links        a link that 404s under file:// but works on a server, or the reverse
  assets       one external request, and an Edition stops being self-contained
  dois         a DOI on a page that data/series.json does not hold
  undeposited  a DOI printed for a paper that has none yet
  dead links   an archive or repository link on a paper that has neither yet
  app          the instrument on the site drifting from the instrument that was tested
  palette      the pages and the app drifting apart visually, which reads as two sites
  coverage     a paper in the series with no page, or a page for a paper that is not in it
  head         a page with no title or no description
  placeholder  a substitution token that survived into the output
  honesty      the home page losing the sentence that says the numbers are not citable yet
  entries      a change log entry whose severity and "affects the record" disagree
  echo         an entry that appears in the stream but not on its own paper's page
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "build"))
from editiongate import check as edition_check                             # noqa: E402
from build_site import ROMAN, SLUG, SEVERITIES, APP_HOME                   # noqa: E402
from build_app import HOME_PLAIN, HOME_LINKED                              # noqa: E402

SITE = ROOT / "site"
DOI_RX = re.compile(r"10\.5281/zenodo\.\d+")
HREF_RX = re.compile(r'href="([^"]+)"')
VAR_RX = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")


# ------------------------------------------------------------------ the world under test

def load():
    if not SITE.exists():
        sys.exit("FATAL: site/ does not exist. Run python build/build_site.py first.")
    pages = {str(p.relative_to(SITE)).replace("\\", "/"): p.read_text(encoding="utf-8")
             for p in SITE.rglob("*.html")}
    series = json.loads((ROOT / "data" / "series.json").read_text(encoding="utf-8"))
    return {
        "pages": pages,
        "files": {str(p.relative_to(SITE)).replace("\\", "/") for p in SITE.rglob("*") if p.is_file()},
        "series": series,
        "site_css": (ROOT / "src" / "site" / "site.css").read_text(encoding="utf-8"),
        "app_css": (ROOT / "src" / "shell" / "app_shell.html").read_text(encoding="utf-8"),
        "app_built": (ROOT / "app" / "index.html").read_bytes(),
        "app_shipped": (SITE / "app" / "index.html").read_bytes(),
        "changes": sorted((ROOT / "changes").glob("*.md")),
    }


# ------------------------------------------------------------------ the checks

def check_links(w):
    bad = []
    for rel, text in w["pages"].items():
        # The instrument is not a page of this site, it is the artifact the site carries: it is
        # gated by build_app.py and seven harnesses of its own, and its hrefs are template
        # literals that a static reader cannot resolve (`href="${author.orcid_uri}"`).
        if rel == "app/index.html":
            continue
        base = pathlib.PurePosixPath(rel).parent
        for href in HREF_RX.findall(text):
            # `data:` is not a place, it is the payload: the favicon is carried in the attribute
            # itself, so there is no file to find on disk and its absence is not a broken link.
            if href.startswith(("http://", "https://", "mailto:", "#", "data:")):
                continue
            target = str((base / href.split("#")[0]).as_posix())
            while "/../" in "/" + target:
                target = re.sub(r"[^/]+/\.\./", "", target, count=1)
            target = target.lstrip("./")
            if target and target not in w["files"]:
                bad.append(f"{rel} links to {href!r} -> {target!r}, which is not on disk")
    return bad


def check_assets(w):
    bad = []
    for rel, text in w["pages"].items():
        violations, _ = edition_check(text)
        for v in violations:
            bad.append(f"{rel} reaches outside itself: {v['rule']} — {v.get('line', '')}"[:160])
    return bad


def check_dois(w):
    known = {p["doi"] for p in w["series"]["parts"] if p["doi"]}
    known |= {p["version_doi"] for p in w["series"]["parts"] if p.get("version_doi")}
    bad = []
    for rel, text in w["pages"].items():
        if rel == "app/index.html":
            continue                       # the instrument is gated by its own harnesses
        for doi in set(DOI_RX.findall(text)):
            if doi not in known:
                bad.append(f"{rel} prints {doi}, which data/series.json does not hold")
    return bad


def check_undeposited(w):
    bad = []
    for p in w["series"]["parts"]:
        if p["doi"]:
            continue
        rel = f"papers/{SLUG[p['numeral']]}/index.html"
        text = w["pages"].get(rel, "")
        if DOI_RX.search(text):
            bad.append(f"Part {p['numeral']} has no record, but {rel} prints a DOI")
        if "not yet deposited" not in text and "none</strong>" not in text:
            bad.append(f"Part {p['numeral']} has no record and {rel} does not say so")
    return bad


def check_dead_links(w):
    """A paper that is not deposited has no repository and no archive.  Printing either as a link
    is a 404 dressed as a download, and it is the kind of thing nobody clicks until a reader
    does."""
    bad = []
    for p in w["series"]["parts"]:
        if p["status"] == "published":
            continue
        rel = f"papers/{SLUG[p['numeral']]}/index.html"
        for href in HREF_RX.findall(w["pages"].get(rel, "")):
            if "github.com" in href or "doi.org" in href or "zenodo.org" in href:
                bad.append(f"Part {p['numeral']} is {p['status']} but {rel} links to {href}")
    return bad


def check_app(w):
    """The site's copy of the instrument is allowed to differ from the standalone one in exactly
    one way: it carries a link back to the home page, which a downloaded single file must not.
    Normalise that one difference away and the two must be byte-identical — otherwise the site is
    shipping an instrument the harnesses never saw."""
    shipped = w["app_shipped"].decode("utf-8")
    linked = HOME_LINKED.format(href=APP_HOME)
    bad = []
    if linked not in shipped:
        return [f"site/app/index.html does not carry the link home ({linked!r}); the instrument "
                f"would be a dead end for anyone who opened it from the site"]
    # and the link has to go somewhere: it is skipped by the link check, which cannot read the
    # instrument's template literals, so it is checked here by hand.
    target = str((pathlib.PurePosixPath("app") / APP_HOME).as_posix())
    while "/../" in "/" + target:
        target = re.sub(r"[^/]+/\.\./", "", target, count=1)
    if target not in w["files"]:
        bad.append(f"the instrument links home to {APP_HOME!r} -> {target!r}, which is not there")
    # The build stamp is a timestamp, not behaviour: the two builds run seconds apart and would
    # differ on it alone.  Everything else must match to the byte.
    stamp = re.compile(r'const BUILD = "[^"]*";')
    if stamp.sub("", shipped.replace(linked, HOME_PLAIN)) != stamp.sub("", w["app_built"].decode("utf-8")):
        bad.append("site/app/index.html differs from app/index.html by more than the link home "
                   "and the build stamp — the site is shipping an instrument that the harnesses "
                   "did not test")
    return bad


def check_palette(w):
    site_root = re.search(r":root\{(.*?)\}", w["site_css"], re.S)
    app_root = re.search(r":root\{(.*?)\}", w["app_css"], re.S)
    if not site_root or not app_root:
        return ["no :root palette block in one of the two stylesheets"]
    a = dict(VAR_RX.findall(site_root.group(1)))
    b = dict(VAR_RX.findall(app_root.group(1)))
    shared = set(a) & set(b)
    if len(shared) < 10:
        return [f"only {len(shared)} tokens in common; the comparison has gone vacuous"]
    return [f"{k}: site has {a[k].strip()!r}, the app has {b[k].strip()!r}"
            for k in sorted(shared) if a[k].strip() != b[k].strip()]


def check_coverage(w):
    want = {f"papers/{SLUG[p['numeral']]}/index.html" for p in w["series"]["parts"]}
    have = {r for r in w["pages"] if r.startswith("papers/") and r != "papers/index.html"}
    return ([f"no page for {r}" for r in sorted(want - have)]
            + [f"page {r} is not a part of the series" for r in sorted(have - want)])


def carried(rel):
    """Frozen artifacts the site carries rather than generates: the earlier tools, whose URLs are
    reachable from five published records, and the cut editions.  They may not be edited — that is
    what frozen means — so holding them to the standards of a generated page would produce a
    failure nobody is allowed to fix.  They are still required to be self-contained and to carry a
    title."""
    return rel.startswith(("tools-", "editions/")) and rel != "editions/index.html"


def check_head(w):
    bad = []
    for rel, text in w["pages"].items():
        if rel == "app/index.html":
            continue
        if carried(rel):
            t = re.search(r"<title>(.*?)</title>", text, re.S)
            if not t or not t.group(1).strip():
                bad.append(f"{rel} is a carried artifact with no title")
            continue
        if '<html lang="en">' not in text:
            bad.append(f"{rel} has no lang")
        if 'name="viewport"' not in text:
            bad.append(f"{rel} has no viewport")
        t = re.search(r"<title>(.*?)</title>", text, re.S)
        if not t or not t.group(1).strip():
            bad.append(f"{rel} has no title")
        d = re.search(r'name="description" content="(.*?)"', text, re.S)
        if not d or len(d.group(1).strip()) < 20:
            bad.append(f"{rel} has no usable description")
    return bad


def check_placeholders(w):
    return [f"{rel} still contains {m}"
            for rel, text in w["pages"].items() if rel != "app/index.html"
            for m in set(re.findall(r"__[A-Z][A-Z_]+__", text))]


def check_honesty(w):
    home = w["pages"].get("index.html", "")
    missing = [s for s in ("not citable", "arithmetic laws", "bill in eighths")
               if s not in home]
    return ([f"the home page no longer says {s!r}; the open anchor question must be on the "
             f"first screen, not in a footnote" for s in missing])


def check_entries(w):
    bad = []
    for p in w["changes"]:
        src = p.read_text(encoding="utf-8")
        fm = src.split("---", 2)[1]
        meta = dict(line.split(":", 1) for line in fm.strip().splitlines() if ":" in line)
        meta = {k.strip(): v.strip() for k, v in meta.items()}
        sev = meta.get("severity")
        if sev not in SEVERITIES:
            bad.append(f"{p.name}: severity {sev!r} is not one of the four")
            continue
        forces = SEVERITIES[sev][1]
        says = meta.get("affects_record", "").lower() in ("yes", "true")
        if forces != says:
            bad.append(f"{p.name}: a {sev} says affects_record: {meta.get('affects_record')!r}")
        # 'instrument' is the one non-part a change may name -- see build_site.py.  Still a NAME,
        # so a missing or misspelt part is the failure it always was.
        if meta.get("part") not in ROMAN and meta.get("part") != "instrument":
            bad.append(f"{p.name}: part {meta.get('part')!r} is neither in the series nor "
                       f"'instrument'")
    return bad


def check_echo(w):
    stream = w["pages"].get("changes/index.html", "")
    bad = []
    for p in w["changes"]:
        src = p.read_text(encoding="utf-8")
        fm = dict(line.split(":", 1) for line in src.split("---", 2)[1].strip().splitlines()
                  if ":" in line)
        fm = {k.strip(): v.strip() for k, v in fm.items()}
        title = html.escape(fm["title"], quote=False)
        marker = title[:40]
        if marker not in stream:
            bad.append(f"{p.name} is not in the stream")
        # A change about the INSTRUMENT has no paper page to echo onto, so the second half of this
        # check does not apply to it -- and it must not be quietly skipped either: the stream
        # above is where it has to appear, and that half still ran.
        if fm["part"] not in SLUG:
            continue
        page = w["pages"].get(f"papers/{SLUG[fm['part']]}/index.html", "")
        if marker not in page:
            bad.append(f"{p.name} is not on the Part {fm['part']} page")
    return bad


def check_double_escape(w):
    """NOTHING IS ESCAPED TWICE.  `inline()` escapes an entry's whole text and then the code-span
    rule escaped its own group again, so a `<` between backticks reached the page as `&amp;lt;` and
    rendered as the literal characters `&lt;`.  It sat there from the first build: no entry had
    ever put a `<`, `>` or `&` inside backticks until 2026-08-27, and the half of a converter that
    handles the awkward character is the half nobody exercises.  A rendered page must never carry
    `&amp;lt;`, `&amp;gt;` or `&amp;amp;` -- each is one escape too many."""
    bad = []
    for rel, txt in w["pages"].items():
        for ent in ("&amp;lt;", "&amp;gt;", "&amp;amp;", "&amp;quot;"):
            if ent in txt:
                bad.append(f"{rel} carries {ent}: escaped twice, and the entity will show")
    return bad


CHECKS = [
    ("nothing on any page is escaped twice", check_double_escape),
    ("links resolve on disk, so file:// and a server agree", check_links),
    ("no page reaches outside itself", check_assets),
    ("every DOI printed is one the series record holds", check_dois),
    ("a paper with no record prints no DOI, and says so", check_undeposited),
    ("an undeposited paper links to no archive and no repository", check_dead_links),
    ("the shipped instrument is the tested instrument", check_app),
    ("the pages and the app share one palette", check_palette),
    ("every part has a page and every page is a part", check_coverage),
    ("every page has a title, a description and a viewport", check_head),
    ("no substitution token survived", check_placeholders),
    ("the home page still says the numbers are not citable", check_honesty),
    ("severity and 'affects the record' agree in every entry", check_entries),
    ("every entry appears in the stream AND on its paper's page", check_echo),
]


# ------------------------------------------------------------------ break it on purpose

def _first_paper(w):
    return next(r for r in w["pages"] if r.startswith("papers/part-"))


def _copy(w):
    out = dict(w)
    out["pages"] = dict(w["pages"])
    return out


def break_links(w):
    b = _copy(w)
    b["pages"]["index.html"] = b["pages"]["index.html"].replace(
        'href="docs/index.html"', 'href="docs/conventions.html"')
    return b


def break_assets(w):
    b = _copy(w)
    b["pages"]["index.html"] = b["pages"]["index.html"].replace(
        "</head>", '<link rel="stylesheet" href="https://fonts.example/x.css"></head>')
    return b


def break_dois(w):
    b = _copy(w)
    b["pages"]["docs/index.html"] += "<p>doi:10.5281/zenodo.99999999</p>"
    return b


def _undeposit(b):
    """A part with no record, for the breakers that need one.  Since 2026-08-24 every part of the
    series is deposited, and a breaker that searched for an undeposited part raised StopIteration
    -- the self-falsification half of this file stopped dead at its fourth check and the site went
    RED for lack of something to break.  So the breaker MAKES one: in the broken copy the last
    published part has its record withdrawn, while its page still prints the DOI and the
    repository link.  Exactly the situation the two checks exist to catch."""
    # _copy is shallow: the record must be cloned before a breaker withdraws anything from it, or
    # the withdrawal reaches the real series and every later check reads a lie.
    b["series"] = json.loads(json.dumps(b["series"]))
    p = next((q for q in b["series"]["parts"] if not q["doi"]), None)
    if p is None:
        p = [q for q in b["series"]["parts"] if q["doi"]][-1]
        p["doi"] = None
        p["version_doi"] = None
        p["status"] = "draft"
    return p


def break_undeposited(w):
    b = _copy(w)
    p = _undeposit(b)
    rel = f"papers/{SLUG[p['numeral']]}/index.html"
    if "not yet deposited" in b["pages"][rel]:
        b["pages"][rel] = b["pages"][rel].replace("not yet deposited", "doi 10.5281/zenodo.21432625")
    return b


def break_dead_links(w):
    b = _copy(w)
    p = _undeposit(b)
    rel = f"papers/{SLUG[p['numeral']]}/index.html"
    b["pages"][rel] += '<a href="https://github.com/karlesmarin/does-not-exist">code</a>'
    return b


def break_app(w):
    b = _copy(w)
    b["app_shipped"] = w["app_shipped"] + b"<!-- edited after the tests ran -->"
    return b


def break_palette(w):
    b = _copy(w)
    b["site_css"] = w["site_css"].replace("--blue:#1B6F8C", "--blue:#0000ff")
    return b


def break_coverage(w):
    b = _copy(w)
    del b["pages"][_first_paper(w)]
    return b


def break_head(w):
    b = _copy(w)
    b["pages"]["docs/index.html"] = re.sub(r'<meta name="description"[^>]*>', "",
                                           b["pages"]["docs/index.html"])
    return b


def break_placeholders(w):
    b = _copy(w)
    b["pages"]["papers/index.html"] += "<p>__SERIES_TABLE__</p>"
    return b


def break_honesty(w):
    b = _copy(w)
    b["pages"]["index.html"] = b["pages"]["index.html"].replace("not citable", "reliable")
    return b


def break_entries(w):
    """The only check whose input is on disk rather than in memory, so it is broken by pointing it
    at a synthetic entry rather than by editing a real one."""
    b = _copy(w)
    tmp = ROOT / "changes" / "_selftest_tmp.md"
    tmp.write_text("---\ndate: 2026-01-01\npart: III\nseverity: correction\n"
                   "affects_record: no\ntitle: a correction that claims to change nothing\n---\n"
                   "what\n: x\n\nwhy\n: x\n\nso\n: x\n", encoding="utf-8")
    b["changes"] = list(w["changes"]) + [tmp]
    b["_cleanup"] = tmp
    return b


def break_echo(w):
    b = _copy(w)
    first = next(p for p in w["changes"])
    fm = dict(line.split(":", 1) for line in
              first.read_text(encoding="utf-8").split("---", 2)[1].strip().splitlines()
              if ":" in line)
    title = html.escape(fm["title"].strip(), quote=False)[:40]
    rel = f"papers/{SLUG[fm['part'].strip()]}/index.html"
    b["pages"][rel] = b["pages"][rel].replace(title, "(removed)")
    return b


def break_double_escape(w):
    b = _copy(w)
    b["pages"]["index.html"] += "<p><code>a &amp;lt; b</code></p>"
    return b


BREAKERS = dict(zip([c[0] for c in CHECKS],
                    [break_double_escape,
                     break_links, break_assets, break_dois, break_undeposited, break_dead_links,
                     break_app, break_palette, break_coverage, break_head, break_placeholders,
                     break_honesty, break_entries, break_echo]))


# ------------------------------------------------------------------ run

def main():
    w = load()
    ok, fail = [], []

    print("THE SITE AS BUILT\n")
    for name, fn in CHECKS:
        bad = fn(w)
        if bad:
            fail.append((name, bad))
            print(f"  FAIL {name}")
            for b in bad[:6]:
                print(f"         {b}")
        else:
            ok.append(name)
            print(f"  ok   {name}")

    print("\nAND EACH CHECK, AGAINST A SITE BROKEN ON PURPOSE\n")
    for name, fn in CHECKS:
        broken = BREAKERS[name](w)
        try:
            found = fn(broken)
        finally:
            tmp = broken.get("_cleanup")
            if tmp:
                tmp.unlink(missing_ok=True)
        if found:
            ok.append(f"{name} — fires when broken")
            print(f"  ok   fires: {name}")
        else:
            fail.append((f"{name} — fires when broken", ["the check did not notice"]))
            print(f"  FAIL does NOT fire: {name}")

    print(f"\n{'PASSED' if not fail else '*** FAILED ***'}   {len(ok)} ok, {len(fail)} failed")
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())
