# Design — what this becomes, and why

Carles Marín + Claude (AI assistant). 2026-08-08.
**Decisions, not options.** Each one is stated with what it costs and what it forbids. The survey
behind it is in `docs/SURVEY_2026-08-08.md`; where a claim there was unverified it is marked here
too, because a design that quietly promotes a guess to a premise is worse than no design.

---

## The problem, stated once

Five distinct computations — a Wilson-line selection rule, a model calculator over the torus, a
parameter-response meter, an anomaly and proton-decay auditor, and a hierarchy calculator with a
certified bound — that **share one model**. Today they are three pages that do not know about each
other, and a fourth that does not exist yet.

Two things pull in opposite directions and the whole design is about not pretending otherwise:

- a tool that a paper cites must still run in ten years, unchanged, offline, with a DOI;
- a tool that helps a physicist must grow, and grow into needs nobody has had yet.

The cautionary precedent is exact and it is in this genre: **Wolfram CDF** was the 2011 answer to
"interactive paper companion", and it is dead — legacy since ~2021, and every CDF-backed companion
is now unrunnable without a deprecated proprietary player. *Never depend on a runtime you do not
ship.* The counter-example is Ned Wright's cosmology calculator: dependency-free in-page JavaScript,
essentially unchanged since 1999, cited thousands of times.

---

## D1 — Two tiers, one source, and the build refuses to mix them

| | **Edition** (Tier 1) | **App** (Tier 2) |
|---|---|---|
| what | one frozen HTML file per published paper | the living multi-section instrument |
| where | Zenodo, DOI'd, alongside the paper | GitHub Pages, and openable from `file://` |
| may use | nothing external. No `fetch`, no `import(`, no `new Worker(`, no `<script src=`, no `http(s)://` asset, no WASM | ES modules, workers, precomputed tables |
| changes | **never** after release | continuously |

**Every Edition is a subset build of the App at a tagged commit.** There is one source tree and one
kernel; the Edition is a build target, not a fork.

**The enforcement is mechanical, and this is the load-bearing part.** `build_*.py` gains a target
`--edition` that inlines everything and then **fails the build** if the inlined bundle contains any
of those five constructs. Without that check, Tier 2 features leak into Tier 1 by accident and the
archival guarantee dies quietly. The existing rule — *extract the maths from the BUILT page and
re-run it in node against numbers produced outside the page* — stays as the second half of the gate.

> **Cost, stated:** the Edition can never carry a feature that needs a worker, a network or WASM. We
> accept that. A published claim must be checkable from a file on a disk.

---

## D2 — The model record is the interchange format. It is our SLHA.

One canonical JSON document is the only thing the five sections share:

```
{ schema_version, group, orbifold: {parities, wilson_line}, bulk: [...], brane: [...],
  conventions: {...} }
```

Canonical means: sorted keys, rationals as `[p,q]` and never floats where a rational will do, no
defaults omitted. It hashes to a short id, and **that one id is simultaneously the permalink, the
benchmark-point name and the provenance stamp**. Three needs, one object.

This copies the SUSY Les Houches Accord's actual mandate, which is stronger than people remember:
*the parameters that were **actually used** for the run must be written onto the output.* A default
that is not echoed is a hidden hypothesis.

**Consequence**: a model can be written down, saved, mailed, cited and diffed without the tool.
That is the difference between an instrument and a demo.

---

## D3 — The kernel knows about lattices, not about SU(7)

If the kernel knows the group, the application never extends. The kernel knows **weight lattices,
parity assignments, charge multisets, winding sums, polylogarithms, minimisation, rational cones**.
`SU(4)`, `SU(7)` and whatever comes next are **data files**, not code.

This is what SARAH and FlexibleSUSY do and it is why they outlived their first model: a model is a
declarative file, and the machinery is generated or driven from it. We do not need code generation;
we need the same boundary.

Layers, and the first four are DOM-free and importable from node:

1. **model record** — D2.
2. **kernel** — pure functions. No I/O, no globals, no DOM. This is exactly what `_test*.mjs`
   already exercises, which is why the architecture is not speculative: half of it exists.
3. **physics modules** — one per section:
   `{ id, provides: [...], requires: [...], compute(ctx), render(el, result) }`.
4. **result card** — D5.
5. **shell** — registry, router, chrome. Sections registered at build time; no dynamic loading,
   because dynamic loading is exactly what `file://` forbids.

Adding a section = one file + one registry line.

---

## D4 — A capability resolver, and `UNKNOWN` propagates

Modules declare what they provide and what they require; a ~100-line resolver topologically sorts
and memoises. `selection_rule` provides `legal_domain`; `potential` requires it and provides
`vacuum`; `hierarchy` requires `vacuum` and provides `invR5` and `bound_certificate`; `anomaly`
requires only the model record.

This is GAMBIT's capability/dependency mechanism at 1/1000th the scale, and it buys the thing we
care about most for free: **if `legal_domain` comes back `UNKNOWN`, everything downstream is marked
`UNKNOWN` rather than silently computing on an illegal domain.** The honesty floor becomes
structural instead of a habit.

---

## D5 — The result card, and the honesty grade becomes a field

One output object, and the only thing serialised:

```
input        the model record echoed, defaults included
provenance   tool version, git sha, build date, kernel hash, model hash
results      every number as { value, units, status, source }
             status ∈ { theorem | verified | measured | unknown }
certificates the witness a third party needs to re-check a bound, without the tool
```

`status` is the differentiator and it is nearly free. The field's existing vocabulary is SLHA's
`SPINFO` code 3 = warning, 4 = error — a binary about whether the *run* failed, with nothing about
the *epistemic status of each number*. As far as the survey could find, **no hep-ph tool exports a
per-value provenance grade.** We already display it as a chip; promoting it to a machine-readable
field costs an afternoon.

And `unknown` is a **first-class exportable verdict**, not an empty cell. That is
`UNAUDITABLE > false confidence` applied to a calculator.

Exported as JSON and as flat text. Both downloadable, both paste-able.

---

## D6 — One instrument, not five utilities

- **A pinned model header that never scrolls away**, showing the current model record, its hash and
  the honesty summary.
- **A persistent left rail** of sections.
- **Switching section never resets the model.** This single rule is the whole "one instrument"
  feeling, and it is precisely polymake's `application 'topaz';` — one object, many applications,
  one shell.
- **A `/` command palette** accepting navigation *and* model edits — MadGraph's shell, keyboard-first.

**Rejected: tabs-as-documents.** For five fixed computations over one object it is the wrong
metaphor and it invites the user to lose track of which model each tab holds.

---

## D7 — Engine: tables first, JavaScript second, nothing exotic in Tier 1

1. **Precompute and pin.** The exact lattice objects — Hilbert basis, sublattice index, the cone's
   dual description — are computed **once**, offline, in Normaliz or Sage, and pinned into the page
   as exact integers with the tool version and the input echoed beside them. A table silently
   defines a domain of validity, so the grid bounds are displayed and extrapolation is refused.
2. **Re-implement in JS what must be live.** The winding sum, the fixed point, the minimiser. This
   is JSROOT's model, it is what won in HEP, and it is what we already do. Its permanent obligation
   — test the re-implementation against the original — is already discharged by `_test*.mjs`.
3. **Workers only in Tier 2**, and only after the `file://` question below is actually tested.
4. **No WASM in Tier 1.** WASM streaming instantiation goes through `fetch`, which fails under
   `file://`.
5. **The escape hatch is a feature, not an admission**: next to every heavy lattice panel, a button
   that downloads the exact Normaliz/polymake input plus the command line to run it.

> **Open, and to be tested before anything depends on it:** whether a Blob-URL worker and a
> base64-embedded `WebAssembly.instantiate(bytes)` (no fetch) work from `file://` in current Chrome
> and Firefox. The survey could not verify it. **Assume no until a 20-line test says otherwise.**

---

## D8 — Hosting: free, and layered so that nothing citable depends on a free tier

| layer | where | what it is allowed to support |
|---|---|---|
| Edition | **Zenodo** (DOI) + the repo | everything a paper cites. Offline. Immutable per version. |
| App | **GitHub Pages** | the living instrument. Static, free, `file://`-openable. |
| Heavy lab | **Hugging Face Space** *(optional, later)* | scans, exact arithmetic that outgrows the browser |

**The rule that decides ties: nothing supporting a published claim may depend on a hosted service.**
A free Space sleeps and cold-starts; the moment a referee cannot check a number because a container
is asleep, the tool has stopped being an instrument. The Space is a convenience, and it is labelled
non-citable in the page itself.

*Free-tier limits change and my knowledge of them has a cutoff — quotas, sleep times and image sizes
must be re-checked against the current documentation before any of this is committed to.*

---

## D9 — What we deliberately do not build

Three restraints, taken from what the best tools refuse to do:

1. **We do not hide the method behind the number.** Collider Reach calls itself a "quick and dirty
   estimate", states its scaling assumption in one sentence, and draws a **band across partonic
   channels instead of one authoritative line**. Our certified-bound section shows the bound *and*
   the spread of what feeds it.
2. **We do not accumulate features into a workbench.** Section count may grow; **per-section control
   count must not.** No plotting studio, no export wizard, no settings panel.
3. **We do not require an account, a login, a build step, or a runtime the reader installs.** No
   telemetry, no analytics, no CDN font. One external request is enough to break an Edition ten
   years out.

And a fourth, which is a warning about our own instinct: **we do not put the tool's opinion above
the user's data.** An "electroweak verdict" is fine only while every input to it is visible and it
is one line among many, never the product. SModelS reports `r = prediction/upper-limit` and lets the
user conclude; that is the register.

---

## What ships, in phases

**Phase 0 — the spine.** Model record + kernel extracted from the three existing pages + the
resolver + the result card + the `--edition` build gate. No new physics. Ends when the three
existing tools run **on the new spine** and their node harnesses still pass. Nothing is published
until this is true, because everything after it is cheap only if this is right.

**Phase 1 — the fourth and fifth sections.** `hierarchy` (Part VII: the closed form, the two
identities, the certified ceiling, the arithmetic laws) and `anomaly` (Part VI: the six channels,
the ladder, the bill in eighths). Part VI has no tool at all today, and that is a bigger hole than
the missing fourth.

**Phase 2 — the professional layer.** Permalinks that compress the whole state into the URL
fragment (SageCell's pattern: truly permanent, no server storage); result-card export; the headless
CLI over the same kernel; named benchmark points shipped from each paper; a `.bib` regenerated by
the build.

**Phase 3 — the differentiators.** The live reference-comparison panel (the anchor recomputed at
load, shown as *ours / published / Δ / tolerance / verdict*, and **the tool refuses to present
results if it fails**); certificate export for the bound; drill-down from the atlas to a full result
card; the scan mode.

---

## The five things to verify before Phase 0 starts

1. Blob-URL workers and base64 WASM under `file://` — the D7 gate.
2. Current free-tier limits for GitHub Pages and Hugging Face Spaces.
3. Whether an arXiv ancillary `.html` is served renderable or only downloadable — decides whether an
   Edition can hang off the preprint as well as off Zenodo.
4. Whether the CONTUR drill-down (a 2020 proposal) was ever built, before we claim that verb is
   unoccupied.
5. Whether any interactive physics tool displays a charge cone's Hilbert basis and quasi-polynomial.
   The survey did not run a proper gate on this; **it is not to be said out loud until one is run.**

---

## The one-line summary

**An instrument whose outputs carry their own epistemic status, which checks itself against
published results in front of the user, and which hands out certificates instead of point
estimates — built as a living application that can freeze a citable, offline copy of itself for
every paper it accompanies.**
