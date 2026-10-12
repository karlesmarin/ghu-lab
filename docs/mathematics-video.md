# Between physics and mathematics: video guide

| Language | Full film | Direct download | Chapters | Synthetic narration |
|---|---|---|---|---|
| English | [11:34 · player](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index.html) | [MP4](https://karlesmarin.github.io/ghu-explorer/video/mathematics/ghu-mathematics-en.mp4) | 29 | Microsoft Zira |
| Castellano | [11:55 · reproductor](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index-es.html) | [MP4](https://karlesmarin.github.io/ghu-explorer/video/mathematics/ghu-mathematics-es.mp4) | 29 | Microsoft Helena (España) |

Both editions contain the same 29 explanations, organized as eight boundary scenes, eight
profile scenes, six trace scenes, five consistency scenes and two evidence scenes. Their duration
differs because captions and animation follow the narration in each language.

## What the viewer can investigate

| Physical question | Mathematical tool | What is established in the example |
|---|---|---|
| Can changing an endpoint condition open a normal mass gap? | A separated interval operator and the first Robin root | A positive first eigenvalue for positive boundary coupling in the stated interval problem |
| Can three two-component field profiles be independent? | Integrated overlaps, Gram rank and differentiation | Independence of the displayed profiles for nonzero M; rank two at M = 0 |
| What does an inserted representation trace measure? | A finite sum over 512 half-spin weights | The complete quadratic identity T2(h) = 256 h1 h2 for the specified insertion |
| Does a six-dimensional consistency condition select three families? | Signed counts and modular arithmetic | Multiples of three under identical assignments; no unique selection of three |

The spatial profile plot is a field amplitude, not a particle trajectory. The unrestricted
exponential ansatz does not count physical families. Raw inserted traces precede normalization,
projectors, descent and inflow. A restricted congruence does not settle full quantum consistency,
the Higgs vacuum, neutrino masses or a Standard Model fit.

## Watch, then use the laboratory

1. Choose a language above; use full screen to read the formulas. Chapter buttons seek within
   the MP4. English and Spanish are separately timed editions.
2. Open [GHU Lab](https://karlesmarin.github.io/ghu-explorer/app/) and choose **Anomalies → Boundary research**.
3. Compare boundary strength 0 and 1, profile mass 0 and 1, then one, three and six identical
   families. Read the stated assumptions beside each result.
4. Follow [the tool documentation](boundary-research.md) for variables, equations, exports,
   linked 2D/3D mass views and the exact meaning of each diagnostic.

The visible captions are burned into the films. Separate VTT files and transcripts are also
available from each player. Narration is synthetic: Zira for English and Helena for Spanish.
The whiteboards and laboratory captures are translated; the shared proof notes and primary
papers retain their original language. A complete human listening review has not been recorded.

## Evidence, versions and reproducibility

- [Certificate bundle and ordinary proofs](../proof/boundary-research/README.md): 113 checks,
  including exact rational intervals and polynomial coefficients, plus independent numerical
  comparisons. This is not a count of formal theorems.
- [Versioned media](../media/video/2026-10-12-mathematics/README.md): original MP4s, 29-chapter
  indexes, 154 English / 156 Spanish subtitle cues, transcripts, posters, hashes and verification receipts.
- [Production sources](../tools/mathematics_video/README.md) and
  [Spanish production](../tools/mathematics_video/es/README.md): stored real captures,
  rendering scripts, speech generation, assembly and verification commands.

The English verifier records **194 checks** and the Spanish verifier **196**. The counts differ
with the number of subtitle intervals. Both include complete audio/video decoding, exact frame
counts, 29 continuous chapters, dimensions and rational teaching examples. Public browser
checks exercise playback, all chapters, links and mobile layout; they are separate from the
mathematical certificate checks. Both films use 1920×1080 at 24 fps, 48 kHz mono AAC audio.

The mathematical-video media directory is `2026-10-12-mathematics`. The scientific application
remains **0.2.1**, the boundary tool **1.0.0**, and its result schema `ghu-boundary-research-v1`.
Adding a narrated edition does not change those scientific versions.

From a checkout, reproduce the mathematical evidence with:

```text
python -m pip install -r proof/boundary-research/requirements.txt
python proof/boundary-research/certify.py --check
```

No SageMath or Docker is needed for these checks. See the production instructions to regenerate
speech and video; font and voice availability can change the rendered bytes across systems.
Do not overwrite a published video when changing its scientific or narrated content: use a new
edition and retain its old URLs and SHA-256 record.

## Public announcement

The [English Mathstodon announcement](https://mathstodon.xyz/@karlesmarin/117428242947952586)
attaches the full English MP4 and links the laboratory, chapter player and evidence. It introduces
the new boundary tools through the intersection of physics and mathematics. The Spanish edition
is available through the same companion's language navigation; no separate Spanish social post
has been published as part of this update.

The [general laboratory tutorial](https://karlesmarin.github.io/ghu-explorer/video/index.html)
is separate: 45 chapters and 154 scenes in each language, covering the laboratory's navigation
and experiments. This shorter mathematical film explains four connected examples in depth.
