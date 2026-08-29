# 🔧 GHU Lab — the source tree of the gauge–Higgs unification instrument

This repository builds **[karlesmarin.github.io/ghu-explorer](https://karlesmarin.github.io/ghu-explorer/)**:
one self-contained HTML page holding sixteen computations — including a builder for models nobody has
written yet — over three published models:
SU(7) on S¹/Z₂×S¹/Z₂ (Komori–Maru), SU(4) on T²/Z₂ (AHMN), and Haba–Yamashita's 5D SU(3) on
S¹/Z₂ — with **every output carrying what is known about it**: `theorem`, `verified`, `measured`
or `unknown`, as fields in the exported result card rather than as decoration.

The deployed page is a build artifact. This is where it comes from, and why it says what it says.

```
python build/build_app.py     # inline → collision guard → edition gate → 21 harnesses → app/index.html
python build/build_site.py --legacy ../ghu-explorer/tools-2026-07     # → site/, then gates itself
node   build/shoot.mjs        # headless screenshots of every section + console + which model
node   build/drive.mjs        # USES the calculator: real mouse through the DevTools Input domain
node   tests/run.mjs          # the built page against the Python engine of Part VII
```

`build_app.py` refuses to report a green build if any harness fails, and prints
`*** BUILD RED — do not publish ***` instead.

## What is checked, and against what

**1 347 checks.** The ones that carry weight are the ones an outside computation could lose:

| harness | what it puts at risk |
|---|---|
| `tests/run.mjs` | the **built page** against `tests/reference_models.json`, produced by the **Python** engine of Part VII. Two implementations, one set of numbers. Ships with the artifact, so a reader can run it against the page they were served |
| `_test_hierarchy.mjs` | the closed form against direct minimisation; the arithmetic laws; the four levels of the ceiling; the pre-registered sixth row; the repair-space wedge |
| `_test_selection.mjs` | Part III's rule against a winding sum that has never heard of Dynkin labels — 119 representations, zero disagreements — and Part II's three gates, with the minimality of the **60** recovered by brute force rather than quoted |
| `_test_eta.mjs` | the η closed form against brute force on 119 multiplets; the atlas's blank tiles predicted from the modes *before* being drawn; tile diffs held to spectra |
| `_test_escape.mjs` | Part VI's charge arithmetic in exact rationals, against the archived enumeration |
| `_test_atlas.mjs` | the 1 286-content lattice re-enumerated in the browser, against `ceiling_ilp.py`'s archived counts — and against the hierarchy sweep, which reaches them another way |
| `_test_inverse.mjs` | the map run **backwards**: the five published rows inverted from their own observables, the certificate roster of every target the paper tabulates, the designs it delivers — and the certificates **falsified**, a rung a Farkas bound closes being enumerated whole to confirm it is empty. It also resolves the two clusters a browser can reach into their **35 and 65 points**, recovering the paper's spacings and the 45× the gap is measured against |
| `_test_census.mjs` | N(A₄, 8D) counted by dynamic programme, against three other things: the archived enumeration (**69 022 464** contents over four rungs), an independent brute force, and the enumerator that builds the contents one by one |
| `_test_sun5d.mjs` | the **general SU(N)** formula — Haba–Yamashita §5 — against every equation of all four worked examples the same paper prints, transcribed term by term; against the invariance (P, P′) → (−P, −P′) that fixes a sign the printed formula leaves ambiguous; and, through the one-phase bridge, against the archived 60-row SU(3) prediction bank, which it reproduces to 8e-16 by a route that shares nothing with the special case those rows came from |
| `_test_bcclass.mjs` | the **equivalence classes** of orbifold boundary conditions, as orbits actually walked: Haba–Hosotani–Kawamura's C(N+3,3) conditions, (N−1)N(N+1)/6 relations and **(N+1)² classes** reproduced at every N up to 14 as a property of the orbit structure rather than as a quoted theorem; their eq. (3.27) energetics term by term; and the same question asked again on T²/Z₃, where the answer is different and is measured instead of inherited |
| `_test_app.mjs` | the page that **ships**, not the sources it came from: the inliner, the module stripper and the data injection are the only code no other test covers |
| `_test_site.py` | thirteen site checks, and then **each of them again against a site broken on purpose** |
| `build/drive.mjs` | the panels answer a **real mouse** through the DevTools Input domain, not events dispatched from inside the page |

Every guard here has been fired at least once by breaking something on purpose. A guard that has
never failed is not a guard, and `HANDOFF.md` carries the index of what each one cost.

## Reproducing the data files

Nothing in `data/` is typed. `build/make_data*.py` and `build/make_reference.py` read the papers'
own Python scripts and archived runs, and stop rather than invent a number if they cannot reach
them. That authoring tree is not part of this repository; point at it with:

```
set GHU_SOURCES=...\research\smeft_formalization        # Windows
export GHU_SOURCES=.../research/smeft_formalization     # POSIX
```

or write the path into `build/sources.local` (git-ignored). Without it the generators exit with
a message saying exactly what they wanted to read. The instrument itself needs none of this: the
built page carries its data inline and reaches nothing outside itself.

## Read this before quoting a number

The instrument says it on its own front page, and it belongs here too: **the absolute scales are
not settled.** Our α does not reproduce the published α of the SU(7) model — the ratio runs
1.03× to 2.08× across the five published rows, and a varying factor cannot be absorbed as a
convention. Every TeV and GeV inherits that, and is labelled `measured` for it. What escapes the
caveat entirely: the **mass ratio**, the **bill in eighths**, and the **two arithmetic laws** —
no normalisation enters any of them.

The two anchor routes that are in print — Part VI's pre-registered sixth row and the second
anchor of von Gersdorff–Irges–Quirós — are both live in the instrument.

## Layout

```
src/kernel/     the mathematics: potential, moments, closed form, exact-rational charges,
                the five complete invariants, the relief renderer, the resolver
src/modules/    one capability each, with a status and a source on every value
src/sections/   one file per section of the page; adding a section is a file and a line
src/shell/      the shell: one model per group, a rail grouped by family, the permalink
src/site/       the source of the surrounding site (home, per-paper pages, docs, changes)
build/          the builders, the gates, the shooters, the mouse driver
data/           extracted, never typed — one JSON per group
tests/          the golden suite that travels with the deployed artifact
changes/        the change log, one file per entry, rendered onto the site
```

`app/`, `site/`, `shots/` and the shooter profiles are generated and untracked on purpose.

## History

This repository starts at its first public commit. The working history that preceded it is kept
privately: a headless-browser profile had been committed into it at one point, and files named
`Cookies` and `Login Data` are not something to publish even when they belong to a throwaway
profile. Nothing of the engineering narrative is lost — `HANDOFF.md` carries the trap index and
`changes/` carries every change that touched a published record.

---

Carles Marín · `karlesmarin@gmail.com` ·
[ORCID 0009-0007-5637-9688](https://orcid.org/0009-0007-5637-9688) ·
Claude (Anthropic) as AI research assistant; the mathematics and every claim are the author's
responsibility · Apache 2.0
