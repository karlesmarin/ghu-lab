# The site — what it is, page by page

Carles Marín + Claude (AI assistant). 2026-08-08.
Follows the decisions in [`DESIGN.md`](DESIGN.md). One repository, GitHub Pages, no server, no cost.

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
└── /editions/           the frozen copies, one per released paper
      └── part-vii-v1.0.html   ← byte-identical to what Zenodo holds
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
│  Downloads       PDF · Zenodo · the scripts · the frozen edition      │
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

And a third copy that matters: `/editions/part-vii-v1.0.html` — **the frozen tool**, byte-identical
to the one archived with the paper, still on the site, still openable. So a link in a paper never
dies even if the app is rewritten.

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
