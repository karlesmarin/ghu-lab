# The site — what it is, page by page

## Current source and site · 26 October 2026

Boundary research section 6 adds the certified finite neutral quotient, with exact
generic/restored strata and a downloadable proof, witnesses and SymPy replay.
The continuous-domain reduction and physical mass interpretation remain open.
The bilingual Demo now visits all six instruments; both manuals and the 46 guides
per language are synchronized. Navigation remains 30 sections, 11 cards and three
Simulator modes, with 67 glossary terms.

Both films remain the 17 October recordings (general: 47 chapters / 178 scenes;
mathematical: 46 chapters). They do not cover section 6. Visible player notices
link to the current live Demo; the 181-scene storyboard is not a rendered film.
See [the current change entry](changes/2026-10-26-finite-neutral-quotient.md)
and [scope and replay](docs/boundary-research.md).

The publication README is maintained in `src/site/README.md` and copied by the
site build. Publish the reviewed generated `site/` to `ghu-explorer`; a push
to the source repository alone does not deploy the web app. Preserve archived
media, frozen papers, editions and the ownership verification file.

## Historical release · 17 October 2026

Boundary research now includes [certified matched profiles](docs/matched-profiles.md),
with two admitted query points and a downloadable proof and replayable certificate.
Navigation and card counts are unchanged. The source and generated-site repositories
carry this release; dated site and media descriptions below retain their original scope.


Final local validation: 10576 source checks / 82 harnesses for the integration,
followed by the final cosmetic corrections and all 21 current browser gates.
The two language gates report no missing visible or computed phrases across
47 Demos. Site: 34 checks; guides/manuals: 135; 5180 local links, none broken;
general player: 35; mathematical/supplement player: 221; guide browser: 206.
The main films have 47 chapters / 178 scenes per language (3455 media checks).
The mathematical films have 46 chapters. The current revisions are
2026-10-17-certified-profiles and 2026-10-17-mathematics-profiles.
A post-capture global shortcut translation and build timestamp are the only
live-app text differences; the exact captured app remains available for replay.
Preview locally with the existing tools/mathematics_video/preview.mjs server.
Publication authorized by Carles on 17 October: commit and push the reviewed source
to ghu-lab and the generated site to ghu-explorer, then verify GitHub Pages.
Excovery and private research remain outside the public repositories.

## Historical site checkpoint · 14 October 2026

The Lab has 30 menu sections, 11 embedded cards, 3 Simulator modes and 46 bilingual
guides. Same potential? contains the Hypotheses card, its four linked plots, contextual
readings, data downloads, selection import and a shared guided Demo/video script.
The measured CMS spectrum is kept separate from the nine recalibrated model cases;
there is no compatible GHU prediction or observed fit in this card yet.

The main tutorial has 47 chapters and 175 scenes per language (English 47:32,
Spanish 49:10). Chapter 47 starts at 45:16 in Spanish. Its 3D-response / 2D-mass
cover remains visible before playback. Current assets are selected by
`media/video/current.json`: `2026-10-14-hypotheses`.
The mathematical companion has 43 chapters (English 19:56, Spanish 20:12), with
assets in `media/video/2026-10-14-mathematics-hypotheses/`.

The data guide is `data/hypothesis_comparison/index.html`; the certificate catalogue
contains 59 Lean declarations in five files and a replayable download. Formal algebra,
numerical checks and experimental support have distinct scopes. The site build checks
123 canonical URLs and 5,059 local links; both PDF manuals match the current guides.
See [production and playback checks](docs/video-guide-production.md) and
[mathematical-film documentation](docs/mathematics-video.md).

The source repository is `ghu-lab`; the reviewed generated `site/` is published through
`ghu-explorer`. Preserve historical media, frozen papers and ownership verification.
The dated architecture snapshots below describe previous versions.

### Google sitemap

`build/build_site.py` regenerates `site/sitemap.xml` from current canonical pages.
It contains 123 absolute HTTPS URLs, including both hypothesis guides and the data
index. Historical editions, hash-only app states and duplicate entry points are excluded.
The guide/site gate checks exact coverage, uniqueness, canonical tags and local targets.
No artificial modification dates or priority values are added.

Submit `https://karlesmarin.github.io/ghu-explorer/sitemap.xml` in the Sitemaps report
for the existing URL-prefix property. The ownership verification HTML is preserved.
This project is hosted in a subdirectory: a `robots.txt` inside `/ghu-explorer/` is
not the host-root robots file Google reads, so the project does not claim discovery
through such a file. Publishing a sitemap is distinct from submitting it or confirming
indexing. See [Google's sitemap instructions](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
and [robots.txt location](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).


## Historical checkpoint · 13 October 2026 · v0.2.2

The independent **Quantization & certificates** menu option compares exact universal and closed-spin-four periods, the published q=6 axion congruence, conditional parent transfer and joint U(2) arithmetic. It includes a bilingual guided Demo, JSON/LaTeX exports and worked examples. The Spin(20) lift clarification is also linked from Boundary research.

The [complete proof catalogue](https://karlesmarin.github.io/ghu-explorer/proof/index.html) exposes all four Lean source files (49 theorem declarations), recorded checks, replay commands, hashes and a downloadable bundle. Arithmetic formalization is distinct from topology and physical consistency. Full anomaly cancellation remains unknown.

[English walkthrough](https://karlesmarin.github.io/ghu-explorer/video/quantization/index.html) · [Vídeo en castellano](https://karlesmarin.github.io/ghu-explorer/video/quantization/index-es.html). This supplementary edition covers the new option; the earlier films retain their original scope. Current navigation has 30 sections and the bilingual catalogue has 45 guides; dated counts below describe earlier releases.


## Historical media and guide architecture · 12 October 2026

The mathematical companion then had two current pages: `video/mathematics/index.html` (English,
11:34) and `video/mathematics/index-es.html` (Castellano, 11:55). Each has 29 animated chapters,
a direct MP4, visible captions, a transcript, reciprocal language links and a canonical URL.
Shared ordinary proof notes are at `video/mathematics/proof-notes.html`; the notes are in English.

Versioned media and verification receipts live in `media/video/2026-10-12-mathematics/`;
production scripts and recorded inputs in `tools/mathematics_video/` (Spanish under `es/`);
mathematical evidence in `proof/boundary-research/`. See [the video guide](docs/mathematics-video.md).
The bilingual general tutorial remains separate: 45 chapters and 154 scenes per language.
The mathematical-film pages are linked from Docs, Video and Editions. Current pages contribute
113 canonical sitemap URLs after this addition; the build reports the measured count.

Current guide architecture (12 October 2026): `docs/user-guides[.es].json` supplies
44 guides and 59 glossary terms in each language. `build/user_guides.py` generates inline help
and 92 HTML guide/index/glossary pages; `build/guide_manual.py` generates both PDF manuals with
Babel. The site build links these from Home, Docs and Editions, gives current pages canonical
URLs, and lists current English/Spanish HTML in the root sitemap. No hash-only app state is
listed as a separate indexable page. Historical video pages and frozen artifacts are preserved.
The current full build reports its measured check count; dated counts below describe earlier work.

The tenth research card, Anomalies → Boundary research, is documented in
`docs/boundary-research.md`. Lab 0.2.1 includes linked 2D/3D views and the downloadable
offline edition. The current general video has 45 chapters and 154 scenes in each language;
its predecessor is preserved at `video/2026-10-10-demos.html`.

Google Search Console uses the URL-prefix property `https://karlesmarin.github.io/ghu-explorer/`.
Its original HTML verification file lives in `src/site/verification/`; the site build copies it
byte-for-byte to the property root and checks its content. Keep this file after verification,
because Google periodically checks ownership. Verification responses are excluded from page
metadata and the sitemap. Publishing the file does not submit the sitemap or confirm the
owner-account action in Search Console.



Carles Marín + Claude (AI assistant). 2026-08-08.
Follows the decisions in [`DESIGN.md`](DESIGN.md). One repository, GitHub Pages, no server, no cost.

## Current implementation — 7 October 2026

The site is generated from the source repository and published in `karlesmarin/ghu-explorer`.
The navigation has **29 menu sections**, containing **three Simulator modes**, **nine embedded
experiment cards**, integrated diagnostics and links to **four archived batch studies**.
The [complete laboratory map](docs/laboratory-inventory.md) explains these overlapping counts;
[README.md](README.md) lists every section in actual menu order and describes the available tools.
The map and sketches below are the original August design, retained as design history.

| Public surface | Current October additions | Source |
|---|---|---|
| Home | Complete capability map, source-derived navigation/mode/card counts, research routes and exploration report | `src/site/home.html`, `build/build_site.py` |
| `/app/index.html#s=predict` | Thermal SU(3) coexistence plus integrated nucleation/percolation/completion and conditional acoustics | `src/sections/research_extensions.js`, `src/modules/thermal_history.mjs` |
| `/app/index.html#s=screen` | Seed-dependent interval bounds and separate full-potential witness checks | `src/sections/screen_section.js`, the candidate-bound modules and reference records |
| `/app/index.html#s=collider` | Complete scalar scenarios compared with pinned HiggsTools experimental datasets | The Higgs experiment in `src/sections/research_extensions.js` |
| Simulator → Neutrino ring | Ring spectrum, CMS HNL comparisons, three-copy reconstruction, fixed-light-input paths with five figures and DeepCore 2018, and decay/coherence with optional Majoron channels | `docs/neutrino-ring.md`, `docs/research-extensions.md`, `docs/neutrino-decays.md`, `docs/neutrino-majoron.md` |
| Hierarchy and Simulator → Higgs production | Dynamic robustness and the top-KK finite/resummed rate comparison | `docs/diagnostics.md` |
| `/docs/index.html` | Updated routes, conventions, glossary and links to the batch studies | `src/site/docs.html`, `docs/research-extensions.md`, `docs/research-exploration-2026-10-07.md` |
| `/changes/index.html` | New extension entry with what/why/so and reproduction steps | `changes/2026-10-07-neutrino-identifiability.md` |
| Source README and research archive | Study descriptions, figures, inputs, budgets and proposed next work | `README.md`, `research/2026-10-07/`, `research/2026-10-07-neutrinos/` |

The static app and saved references run offline. New PhaseTracer/HiggsTools calculations use an
optional local engine, contacted only by an explicit button. The Edition build removes that
bridge. The integrated history requires matching refined actions; it does not rerun a bounce
automatically when the thermal inputs change. Batch studies live in the source archive and are
linked from the public site.

Build with `python build/build_app.py --browser`, then
`python build/build_site.py --legacy <path-to-existing-tools-2026-07>`.
The current gates are 64 source harnesses, ten browser gates and 30 site checks. Copy the reviewed
generated site and updated public README into the publishing repository; preserve legacy tools
and existing editions. The full release procedure and validation counts are in the README.

---

## The map

```
/                        home — what this is, and the two doors
│
├── /app/                THE INSTRUMENT — one model, five sections
│     ├── selection      which Wilson-line domain is legal          (Part III)
│     ├── calculator     content in → potential, vacuum, Higgs      (Parts IV–V)
│     ├── eta            what the parameter does, in closed form    (Parts IV–V)
│     ├── anomalies      six channels, the ladder, the bill         (Part VI)   ← does not exist yet
│     └── hierarchy      α_min, m_h, 1/R₅, the certified ceiling    (Part VII)  ← being built
│
├── /papers/             THE SERIES — one living page per paper
│     ├── part-i/  …  part-vii/
│     └── each: status · abstract · ledger · figures · → app · downloads · changes
│
├── /changes/            THE LOG — what changed, when, and why
│     └── one stream, filterable by paper and by severity
│
├── /docs/               conventions, glossary, how to reproduce, how to cite
│
└── /editions/           frozen copies, cut BY NEED — see DESIGN.md's amendment of 2026-09-09
      └── (empty: no record has needed one yet)
```

Two doors on the home page, because there are two kinds of visitor:

> **"I read the paper and want to try it"** → the app, with that paper's model preloaded.
> **"I found the tool and want to know what it is"** → the paper it comes from.

---

## The instrument: `/app/`

One page. Five sections. **One model.**

```
┌──────────────────────────────────────────────────────────────────────┐
│  MODEL   SU(7) · S¹/Z₂×S¹/Z₂ · 3×7⁺⁺ + 7⁺⁻ + 2×48⁺⁺ + 48⁺⁻ + 84⁺⁺   │  ← pinned, never scrolls
│  #a3f21c    [theorem 2] [verified 3] [measured 4] [unknown 0]        │
├────────────┬─────────────────────────────────────────────────────────┤
│ selection  │                                                         │
│ calculator │        the active section renders here                  │
│ eta        │        — and switching does NOT reset the model         │
│ anomalies  │                                                         │
│ hierarchy ●│                                                         │
├────────────┴─────────────────────────────────────────────────────────┤
│  ⌘/  command palette      ⇩ result card      🔗 permalink            │
└──────────────────────────────────────────────────────────────────────┘
```

The header is the whole "one instrument" feeling. The model hash is simultaneously the permalink,
the benchmark name and the provenance stamp (`DESIGN.md` D2).

### What each section shows

| section | you move | you see |
|---|---|---|
| **selection** | the parities | which α-domain is legal, and why the others are not |
| **calculator** | the bulk content | the potential over the torus, the vacuum, the Higgs mass matrix, the electroweak verdict |
| **eta** | the parameter | its effect in closed form beside the loop sum that confirms it; the atlas of every multiplet |
| **anomalies** | the content and the brane charges | the six channels, which cancel, the ladder inside SU(7), the bill in eighths |
| **hierarchy** | the content, m_h, g₄ | **the potential curve with the vacuum moving on it**, the moment plane, α_min, m_h, 1/R₅ against the certified ceiling, the two arithmetic laws |

Every number carries its status chip, and the chip is a field in the exported card, not decoration.

---

## A living paper page: `/papers/part-vii/`

This is the piece that does not exist anywhere else, and it is what makes the papers *dynamic*
without lying about what a DOI means.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Part VII · The compactification scale of SU(7) GGHU is bounded       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ VERSION OF RECORD   doi:10.5281/zenodo.XXXXXXX   v1.0, 20 Aug   │ │
│  │ THIS PAGE           living · last updated 3 Sep · 2 changes     │ │
│  │                     1 correction · 1 extension  → see changes   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Abstract                                                             │
│  The ledger      established · corrected · withdrawn · open           │
│  Figures         the five, at full size, each with its data           │
│  ▶ Open in the app with this paper's model                            │
│  Downloads       PDF · Zenodo · the gate scripts and their receipts   │
│  Changes         what moved since the record, and why                 │
└──────────────────────────────────────────────────────────────────────┘
```

**The banner is the honest device.** The record stays frozen — that is what a DOI is for. The page
may have moved on, and says so, in the first thing you read.

The **ledger** is not new work: the papers already end with one — *established / corrected here /
withdrawn / open*. On the page it becomes the summary, at the top, where it belongs.

---

## The changelog: `/changes/`

One stream, newest first, filterable by paper. **Every entry answers three questions**, and the
third is the one nobody else answers:

```
2026-09-03   Part VII   CORRECTION                      affects the record: YES
   what   The ceiling moved from 10.03 to 10.01 TeV.
   why    The Higgs window was applied at 127.0 GeV exactly; the published
          table rounds to 127, so the interval is [126.5, 127.5).
   so     Zenodo v1.1 issued. The record's §8 number is superseded.
          Nothing else in the paper depends on it.
```

Four severities, and they are not cosmetic — they decide whether a new frozen version is needed:

| | what it is | new Zenodo version? |
|---|---|---|
| **note** | a clarification; no number moves | no |
| **extension** | new material; the record is still correct | no |
| **correction** | a number or a statement moves | **yes** |
| **withdrawal** | a claim is retracted | **yes**, and it is said in the abstract |

We have already done a withdrawal once — the SMEFT novelty claim, retracted two months later on
finding it was a corollary. That is the culture this log is built for: **the retraction has to reach
the artifact a reader actually holds.**

---

## How Zenodo and the site hold hands

```
        ZENODO                                  THE SITE
   ┌──────────────────┐                   ┌──────────────────────┐
   │ PDF + scripts    │  ── "living  ──▶  │ /papers/part-vii/    │
   │ FROZEN           │      version"     │ corrections, growth  │
   │ doi:…/v1.0       │  ◀── "version ──  │ the app, the log     │
   │ concept doi ──▶ latest │  of record"  └──────────────────────┘
   └──────────────────┘
```

Both directions, always. The Zenodo description carries the living URL; the living page carries the
DOI and the date it was frozen. A reader arriving from either side learns the other exists within
one screen.

**And what does NOT travel with a paper: the tool.** This section used to promise a third frozen
copy per record — `/editions/part-vii-v1.0.html`, byte-identical to the one archived with the paper.
**It was never cut, for any of the records**, and `DESIGN.md`'s amendment of 2026-09-09 changed the
rule rather than the discipline: **an Edition is cut when a claim needs the tool to run in order to
be checked**, and no record of the series has needed that. What makes a result checkable are the
**gate scripts and their archived receipts**, which travel with every record — and, since Part IX-A,
inside the arXiv submission itself. What is kept alive instead is **every URL a published record
points at**, plus the [changes](#) log of what has moved since.

---

## `/docs/` — the part that makes it usable by a stranger

- **conventions** — every symbol, every normalisation, every default, each with the equation or the
  paper that fixes it. An unsourced default is a hidden hypothesis.
- **glossary** — and every symbol shown in the app links here. This is the cheapest thing that makes
  a tool usable by someone who has never seen it, and it is why Ned Wright's calculator is still
  used after twenty-five years.
- **how to reproduce** — the Python engine, the command lines, the Normaliz inputs.
- **how to cite** — BibTeX for the series, for a paper, and for the tool, with copy buttons.

---

## What the home page must do in ten seconds

1. say what this is, in one sentence, without jargon;
2. show the two doors;
3. show the honesty vocabulary — *theorem, verified, measured, unknown* — because it is the thing
   that makes this different from a demo, and a visitor should meet it immediately;
4. link the series, the log and the code.

No carousel, no hero animation, no news feed.

---

## Build and deploy

```
python build_site.py          # papers + docs + changelog + app  → docs/ or /
python build_site.py --edition part-vii   # the frozen copy, and it FAILS if the
                                          # bundle contains fetch/import/Worker/
                                          # script-src/http(s) assets
git push                                  # that is the deployment
```

The changelog is written by hand in one Markdown file per entry; the build renders the stream and
the per-paper views from it. Git history is the audit trail underneath; the log is the human layer
on top. They are not the same thing and neither replaces the other.

---

## What is deliberately not here

No blog. No news. No search box (five papers do not need one). No account. No comments. No
analytics. No cookie banner, because there is nothing to consent to.

Every one of those is a maintenance obligation that outlives the enthusiasm that added it.

## 🎬 Bilingual video manual

The generated `video/index.html` page uses `src/site/video.html`, `build/video_guide.py` and the SHA-256 manifest in `media/video/manifest.json`. It serves only adjacent media. A declared edition-gate exception applies to this requested tutorial; the standalone scientific app remains self-contained. The builder checks every media digest. Chapter data, captions and posters are embedded in the page so language selection and captions also work when the complete site is opened from disk.
