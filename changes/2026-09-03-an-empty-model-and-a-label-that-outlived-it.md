---
date: 2026-09-03
part: instrument
severity: note
affects_record: no
title: An empty model that did not survive its own link, and a label that outlived the model
verify: open **Model calculator**, press *clear*, copy the link, and open it in a new tab — the model comes back **empty**, as it was when the link was made. A link that does not name a family at all still opens on that family's published anchor. Then open **Hierarchy**: the header says *opening on published row (2)* with its caveat; switch the gauge seed to the candidate, or type a brane charge in **Escape from proton decay**, and the label goes — it is your model now.
---

what
: Two bugs from an outside review of the deployed page, both real, both about the page saying
  something that was no longer true.

  **A cleared model did not survive its own permalink.** Every family opens on its published
  anchor, so `clear` is the one edit that makes a family's parameter empty — and the encoder wrote
  nothing at all for an empty family. At the far end an omitted parameter means *leave this family
  alone*, which is what an old link written before that family existed must mean, so the anchor
  loaded at startup was left standing. You cleared the model, copied the link, opened it, and got
  the published model back, while the button's tooltip promised the whole state. A cleared family
  now writes its key with an empty value and the decoder keys on the **presence** of the key, not
  on its truthiness. Both meanings are kept and both are driven: an old link still opens on the
  anchor, a cleared link still opens empty.

  **The published-model label outlived the published model.** The header carries *"opening on
  <row> — <its caveat>"* while the model is untouched, and the comment beside it
  promised it disappears the moment you change anything. The signature compared the
  representation, the parities and the multiplicity — and the interface moves four more things:
  η, the role, the gauge seed and the brane. Flip any of them and a caveat about the published
  row stayed attached to numbers that were no longer its. The comparison now covers every dial a
  reader can move.

  The head of the page went with them: the title still said *one model, every section* and the
  description *one bulk model*, from a build with five sections and one family.

why
: Both are provenance, which is the thing this instrument claims to be careful about. A link that
  silently substitutes a different model is worse than a link that does not work; a caveat
  attached to the wrong numbers is worse than no caveat. And the title was stale because nothing
  had ever read it — `_test_site.py`'s head gate skips `app/index.html` by name, so it was the
  only prose on the page no gate had looked at.

so
: The empty round trip is in `drive.mjs`, both legs of it — the cleared link comes back empty, and
  a link that names no family still opens on the anchor. The label is driven too: the seed and the
  brane each drop it, and putting the seed back brings it back. `_test_app.mjs` now reads the head
  and asserts the claim rather than a count, so it cannot go stale the next time a section is
  added. Three further items in the same review did **not** reproduce against the current source or
  the deployed page — the test/source contradiction, the two stale sentences in the limits panel,
  and an MIT notice — all three were fixed earlier and the review had read a cached copy; the
  repository's public remote being a commit behind is what made that possible, and it is pushed.
