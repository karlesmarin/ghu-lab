---
date: 2026-09-18
part: instrument
severity: correction
affects_record: yes
title: Every card now says which arithmetic made it, and the text export no longer drops the structured values
verify: open any panel and press ⇩ card. The header block of the `.txt` now carries a `kernel` line — sixteen hex characters — and it was absent from every card the tool has ever exported. Then open a card from **Hierarchy** with a published row and look at `coords`, `moments`, `laws`, `seed` and `vacuum`: they now print as JSON. Until today they printed `[object Object]`, five of nineteen rows, while the `.json` beside them was complete. If you hold an exported `.txt` older than this entry, re-export it.
---

what
: Two things that travelled with every result this tool has ever handed out, and neither was
  right.

  **The card did not say which arithmetic produced it.** `card.mjs` has always documented its
  provenance block as *"tool version, build, kernel hash, model id"*. The field existed, the
  printer printed it — and nothing ever filled it. Counted on 18 September: seventeen call sites,
  seventeen passing `version` and `build`, **none** passing a hash. The line was printed only when
  the value was present, so its absence was invisible. Every card said which release and when it
  was built; no card said against which engine.

  Now the build computes a digest over `src/kernel/` and `src/modules/` — the files where the
  arithmetic lives — and injects it into the page; `makeCard` **refuses to build a card without
  one**, and the text form prints it always.

  **The text export silently dropped structured values.** A result whose value is an object —
  `coords`, the five complete invariants of Part VII Theorem 3; `moments`; `laws`; `seed`;
  `vacuum` — came out as `[object Object]`. Five of the nineteen rows of an SU(7) card. The
  `.json` export beside it was complete the whole time, so the two exports of the same card
  disagreed and only one of them was ever read.

why
: Because a fingerprint is what lets you tell two situations apart that otherwise look identical.
  Same input, same fingerprint, different numbers is a bug worth reporting. Same input,
  **different** fingerprint, different numbers means the engine moved between the two runs, and
  this log says what moved. Without it you cannot distinguish them, and a reader comparing two
  cards months apart has no way to know which of the two they are looking at.

  And because a value that disappears without saying so is worse than one that is absent. A reader
  pasting the plain text into an email lost the five invariants that decide whether two contents
  have the same one-loop potential, with nothing on the page to suggest anything was missing.

so
: The printed record does not move: no number in any paper changes, and the JSON exports were
  always complete. What moves is what an exported card can be trusted to tell you about itself.
  **Any `.txt` card exported before today is missing its structured rows and cannot name its
  engine**; re-export it. A `.json` card from before today is complete except for the fingerprint,
  which will read `null`.

  The seam is now held by a harness of its own, `_test_card.mjs`: the guard fires, every call site
  in the source passes a hash, the fingerprint in the built page equals the digest of the sources
  on disk — so a stale build is caught rather than published with a fingerprint that lies — and no
  card's text form may contain `[object Object]`. A full guide to reading a card, on a real
  export, is in [`docs/result-card.md`](https://github.com/karlesmarin/ghu-lab/blob/main/docs/result-card.md).
