# The result card — what the two download buttons give you, and how to read it

Every panel has two buttons in the header: **⇩ card** and **⇩ LaTeX**. This page explains what
comes out, field by field, on a real export.

It is worth two minutes because the card is the only thing that leaves the tool. A screenshot of a
panel shows you a number; a card shows you the number, the input that produced it, how much that
number is worth, and which version of the arithmetic computed it. The difference matters the day
someone asks you where a figure came from.

---

## ⇩ card gives you two files

| file | what it is | who it is for |
|---|---|---|
| `ghu-<model id>.json` | the whole card, machine-readable | a script, a diff, an archive beside a paper |
| `ghu-<model id>.txt` | the same card as flat text | pasting into an email, a log, an issue |

They carry **the same content**. The text form is deliberately not a table: it must survive being
quoted, wrapped and re-quoted.

Both are named after the *model id* inside them, so two exports of different models never collide
on your disk — and two exports of the same model always do, which is the useful behaviour.

**⇩ LaTeX** gives you the same card as a table you can paste into a paper, with a status column and
a bibliography for the sources the numbers rest on.

---

## The six blocks of a card

### 1. Provenance — who, which tool, which arithmetic

```
# ghu-lab result card
model      b8cfc8ec414b
tool       ghu-lab 0.2.0 (2026-09-18 19:55)
author     Carles Marín  ORCID 0009-0007-5637-9688  (Independent researcher)
assisted   Claude (Anthropic), as AI assistant
kernel     82e2013c2d8fa6d7
```

- **`model`** — a short id computed from the completed input. Same input, same id, always. It is
  how you tell two exports apart without reading them.
- **`tool` / version / build** — which release, and when that page was built.
- **`kernel`** — a fingerprint of the code that produced the numbers: a digest over
  `src/kernel/` and `src/modules/`, the files where the arithmetic lives.

  **This is the field to look at when two cards disagree.** Same input, same kernel, different
  numbers is a bug worth reporting. Same input, *different* kernel, different numbers means the
  engine moved between the two runs, and the change log tells you what moved. Without it you
  cannot tell those two situations apart.

  It does **not** cover the panels' presentation code, and it does not cover the reference data a
  particular panel may use — that is named in each result's own `source`, which is more precise
  than a global digest would be.

### 2. Input — including what you did *not* choose

```
## input
{"conventions":{"g4":0.63,"gauge_seed":"published","m_W":80.4,"mh_window":[125,127],
 "windings":600},"group":"SU(7)","orbifold":{"name":"S1/Z2 x S1/Z2"},"schema_version":1}
```

The card echoes the **completed** input, not what you typed. When the tool filled something in on
your behalf, a second block lists it, each entry with where the value came from. Exporting a bare
SU(7) model gives all five:

```
## defaults applied by the tool, not chosen by the user
  m_W = 80.4 GeV   [PDG, as used by arXiv:2503.04090]
  g4 = 0.63   [the Standard-Model su(2)_L value]
  mh_window = [125,127] GeV   [arXiv:2503.04090, Table 1]
  windings = 600   [truncation of the Li_5 sum; see /docs]
  gauge_seed = "published"   [the gauge coefficients as printed in arXiv:2503.04090 eq. (68);
                              Part VII section 13 carries a candidate split, and the page can
                              stand on it instead]
```

That list is the point of the block. A number you did not choose is still a number your result
depends on, and a card that hid it would be a screenshot with extra steps. Note `gauge_seed`
especially: it is a **convention of the model**, not something the representation content forces,
and the page can be made to stand on the other one.

The block is only printed when there is something to print. A card exported from a panel that
loaded a published row — where every convention came from the row — has no such block, and that
absence is itself information.

### 3. Results — a value, its units, its *status*, and its source

```
  D8       -27   [theorem] 8D is an odd integer on this seed -- Part VII Thm 1, Corollary 1
  A4       -18   [measured] fourth moment of the content
  coords   {"A4":-18,"D8":-27,"U2":-39,"V":0,"W2":-3}   [theorem] the five complete invariants
           (A4, 8D, 2U, V, 2W) -- Part VII Thm 3: two contents have the same one-loop potential
           iff they agree on all five
  m_h      — GeV [unknown] not computed -- D = -3.3750 is not positive: the symmetric point is a
           minimum, so there is no electroweak breaking and no vacuum to report
```

**The status column is the honest part, and it is the reason to prefer a card over a number.**

| status | what it means |
|---|---|
| `theorem` | proved, with the statement named |
| `verified` | computed and checked against an independent implementation |
| `measured` | computed here; true on what was run, and no more |
| `unknown` | **not computed, and it says why** |

`unknown` is a verdict, not a gap. A tool that returned a plausible number there would be worse
than one that refuses, because you would have no way to know.

A value can be structured — `coords`, `moments`, `laws` and `seed` are objects, `terms` is a
nested array — and the text form prints them as JSON rather than dropping them. (Until
18 September 2026 it printed `[object Object]`, which lost five of the nineteen rows of an SU(7)
card while the JSON beside it was complete. If you have an exported `.txt` older than that,
re-export it.)

### 4. Summary — the weakest link, named

```
## summary
  theorem 5 · verified 0 · measured 4 · unknown 8
  the weakest thing in this card is: unknown
  8 value(s) are UNKNOWN and say why.  That is a verdict, not a gap.
```

A card is worth its **weakest** row, not its best one. This block puts that in front so nobody has
to scan for it.

### 5. Certificates — how to re-check a bound without this tool

```
## certificates — re-checkable without this tool
  ceiling: {"claim":"1/R_5 <= 10034 GeV for any bulk content with m_h <= 127 GeV ...",
            "method":"integer program over the multiplet lattice; the relaxation's dual has two
                      variables and its vertices were enumerated exactly in rationals",
            "check":"ceiling_ilp.py in the Part VII ancillary scripts reproduces every number"}
```

**A bound is not a number — it is a number plus a witness.** This block is the witness: the claim
in words, how it was obtained, and what you would run to reproduce it with your own arithmetic. It
exists so that a referee never has to take the tool's word for anything.

### 6. Schema — `card_version`

One integer at the top of the JSON. If a future release changes the shape of a card, this is what
a script reads to know which shape it is holding.

---

## Worked example: exporting one published row

1. Open the **Hierarchy** panel and press a published row to load it.
2. Press **⇩ card**. Two files land in your downloads.
3. Open the `.txt`. Read it in this order:
   - the **status tally** in `## summary` — is anything `unknown`, and does it matter to you?
   - the **defaults applied** — did the tool choose something on your behalf that you would have
     chosen differently?
   - the **`kernel`** line — write it down beside any number you quote.
4. If you are going to publish the number, press **⇩ LaTeX** too: it carries the same values with
   the status column and the bibliography.

## The two questions the card is built to answer

**"Where did this number come from?"** — the input block, the defaults, and the per-result
`source`.

**"Would I get it again?"** — the `kernel` line. Same model id and same kernel fingerprint means
the same arithmetic ran on the same input. That is reproducibility stated as two short strings,
and it is why the tool now refuses to build a card that cannot name its kernel.

---

## For developers

`makeCard(model, values, { version, build, kernelHash, certificates })` in
`src/kernel/card.mjs`. `kernelHash` is **required** — it used to default to `null` and the text
form printed the line only when it was present, so an absent fingerprint was invisible; on
18 September 2026 a count found 17 of 17 call sites passing `version` and `build` and none passing
a hash. `build/build_app.py` computes it in `kernel_hash()` and injects `const KERNEL_HASH`.

`_test_card.mjs` holds the seam: the guard fires, every call site in `src/` passes a hash, the
fingerprint in the built page equals the digest of the sources on disk, and no card's text form
contains `[object Object]`. Each check is also fed input built to trip it — a control that cannot
fail is not a control.
