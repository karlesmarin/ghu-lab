# Certified matched profiles

In **Anomalies → Boundary research → 5**, compare uniform and triangular wall
layers after fixing the same pole s=1/100, residue R=1/2 and source normalization.
The two admitted queries are t=1/4 and t=1/2, at epsilon=1/8, alpha=1/20,
c=38, kL=2 and kT=8. Their response difference has a strictly positive lower
bound in the declared unit-square model.

The instrument includes a downloadable ZIP containing a written functional
proof, exact polynomial witnesses, displayed intervals, an independent Sage
verifier, its completed verification record and file hashes. After extraction:

```text
sage -python verify.py receipt.json
```

The verifier imports no production solver. It reconstructs interfaces,
integrals and residual bounds, checks matching through input-box vertices,
then checks that the displayed decimals enclose the certified rationals.
The accompanying proof supplies the continuum implications and their
hypotheses. This is a computational certificate with a written proof,
not a Lean formalization; software tests and hashes alone do not certify it.

Only these two replayed instances are selectable. Arbitrary calculations and
unverified JSON imports are excluded from this instrument. Other parameters
require a new independent replay before admission. Everything works offline.
Save the individual result to preserve the selected query and certificate hash;
the shared section permalink, comparison snapshot, JSON and research summary all
preserve the selected query through the boundary module's matchedProbe parameter.

The mathematical producer, verifier and certificate exporter are maintained
in Excovery. The Lab contains the interface and generated certificate payload.
Rebuild the payload with `excovery.ghu_lab_certificate` only after replaying
the verifier; a stale receipt or changed displayed result fails admission.

The result is conditional on the declared domain, forms and source. It does
not certify full GHU, experimental agreement, all query points or the
thin-layer limit. Existing dated tutorial videos retain their original scope.

Validation:

```text
node _test_matched_profiles.mjs
python _test_matched_certificate.py
node build/boundary_research.mjs
```

## Module placement and maintained structure

This is the fifth diagnostic of Boundary research, under Anomalies. Its varying
wall profile, trace domain, residual bound and corner response make that the
appropriate mathematical home. The Hypotheses card covers a different model:
nine recalibrated Wilson-potential cases and a separate measured CMS spectrum.
No new menu or card is needed.

The presentation API follows defaults, validation, model, rendering and disposal:
`gmrDefaults`, `gmrValidateSelection`, `gmrModel`, `gmrPresent`, `gmrBind`.
`brxModel` composes it; `RX_STATE.boundaryresearch.matchedProbe` is the sole
scientific selection. The generic controls, presets, reset, permalink, comparison,
JSON and summary lifecycle are shared with the other boundary diagnostics.
Its schema, fixed mathematical parameters, scope and certificate identifier remain
inside `matchedProfiles` rather than being attributed to the other diagnostics.

The bilingual guide catalogue drives inline help, web guides and both PDF manuals.
The maintained storyboard drives the Demo and general video; the mathematical
companion explains the proof chain. Generated files must be rebuilt together when
these maintained sources change. Dated released media are preserved separately.

## Teaching media and catalogue

The general video and Demo share chapter 44 of the maintained storyboard:
two certified queries, matching interpretation and proof download. The mathematical
companion's chapters 44–46 explain the continuum certificate and physical scope.
The general revision has 47 chapters / 178 scenes in each language; the mathematical
revision has 46 chapters (22:07 English, 22:21 Castellano).
The general catalogue offers proof/matched-profiles/certificate.zip, byte-identical
to the application's archive. Its written proof and independent replay remain the
admission evidence; the catalogue's hash check only preserves their identity.
