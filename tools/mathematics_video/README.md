# Mathematical film production · current revision 17 October 2026

The current film has 46 chapters per language and uses the original `full/whiteboard_core.py` primitives, palette, grid, formula reveal, 24 fps clock and System.Speech word-event captions. Inspect `matched_profiles/scenes.py` and the pinned `matched_profiles/inputs.json` for the new mathematical and experimental figures. The previous 43 chapters are retained; three new chapters explain certified matching, continuum residual bounds and physical scope. Full original films remain archived.

From the repository root, with the existing requirements installed:

```text
python tools/mathematics_video/matched_profiles/prepare.py
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/matched_profiles/en/narrate.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/matched_profiles/es/narrate.ps1
python tools/mathematics_video/matched_profiles/render.py . --preview
python tools/mathematics_video/matched_profiles/render.py .
python tools/mathematics_video/matched_profiles/assemble.py
python tools/mathematics_video/matched_profiles/verify.py
node build/quantization_site.mjs
```

Set `GHU_FFMPEG` to the FFmpeg executable before assembly. The last command checks the completed `site/` build. Intermediates and early/middle/late previews are under `.tmp/mathematics-20261017/`; source audio, word timestamps and bilingual storyboards are retained under `matched_profiles/`. The scene cache hashes its drawing code, original primitives, chart data, narration and audio. Assembly performs full decoding and exact frame-count checks and writes a source/media manifest. Font or voice changes may change rendered bytes. Review assumptions and listen to the audio separately; automated checks do not claim human listening.

Current version: `media/video/2026-10-17-mathematics-profiles/`. [Current guide](../../docs/mathematics-video.md).

---

## Historical 12 October production instructions

The material below documents the original 29-chapter edition, retained in `media/video/2026-10-12-mathematics/`. Its player is now under `video/mathematics/2026-10-12/`.

# Animated mathematics video production

| Language | Full film | Direct download | Chapters | Synthetic narration |
|---|---|---|---|---|
| English | [11:34 · player](https://karlesmarin.github.io/ghu-explorer/video/mathematics/2026-10-12/index.html) | [MP4](https://karlesmarin.github.io/ghu-explorer/video/mathematics/2026-10-12/ghu-mathematics-en.mp4) | 29 | Microsoft Zira |
| Castellano | [11:55 · reproductor](https://karlesmarin.github.io/ghu-explorer/video/mathematics/2026-10-12/index-es.html) | [MP4](https://karlesmarin.github.io/ghu-explorer/video/mathematics/2026-10-12/ghu-mathematics-es.mp4) | 29 | Microsoft Helena (España) |

[Video guide](../../docs/mathematics-video.md) · [Mathematical certificates](../../proof/boundary-research/README.md)

The film has 29 narrated chapters: eight boundary steps followed by eight profile explanations, six trace explanations, five consistency explanations and two evidence chapters. Drawing primitives use Pillow and Matplotlib mathematical text. Numerical figures use explicit functions and fixed axes where appropriate. Real browser captures show 41 boundary states, 21 Gram states, three trace insertions and six family results. The source snapshots are included so rendering does not depend on the current website.

## Choose a language

The commands below render English using Microsoft Zira. For the complete Spanish edition,
use [the Spanish production instructions](es/README.md), Microsoft Helena (es-ES), and the
scripts and stored captures under `es/`. Both editions have translated whiteboards and actual
laboratory captures. Do not mix English and Spanish chapter timings or VTT files.

## Render the stored English explanations

Tested on Windows with Python 3.14, Microsoft Zira Desktop, Segoe UI and Node.js 24. Narration uses Windows PowerShell and System.Speech; its word events synchronize the captions. The `GHU_VIDEO_FONT_DIR` environment variable can point to a directory containing `segoeui.ttf` and `segoeuib.ttf`. No font binaries are redistributed. Other platforms and speech voices require adapting narration and fonts; byte-identical output is not promised across systems.

From the repository root:

```text
python -m pip install -r tools/mathematics_video/requirements.txt
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/boundary/narrate.ps1
python tools/mathematics_video/boundary/render_animated.py .
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/full/narrate.ps1
python tools/mathematics_video/full/render_more.py . --preview
python tools/mathematics_video/full/render_more.py .
python tools/mathematics_video/full/assemble.py .
python tools/mathematics_video/full/verify_final.py .
```

The final `.` argument supplies a dependency search directory; use `.` with the packages installed above. `imageio-ffmpeg` supplies FFmpeg. Preview mode writes early, middle and late images before the expensive render. Each further chapter is cached against its drawing code, captures, script and audio; input changes invalidate that scene. The final assembler preserves the approved boundary video stream, normalizes its audio format, joins all scenes and embeds MP4 chapter metadata. VTT and transcript timings follow the same video-frame clock.

## Capture a revised English laboratory

Build the lab and website using the main repository instructions, then run the local range server:

```text
node tools/mathematics_video/preview.mjs site 8875
```

In a second terminal:

```text
node tools/mathematics_video/boundary/capture_lab.mjs
node tools/mathematics_video/full/capture_more.mjs
python tools/mathematics_video/full/crop_captures.py
```

Chromium is discovered through the repository's `build/_chrome.mjs`, or `GHU_CHROME`. The scripts use real controls, preserve the English locale, and save numerical provenance. The trace table is opened; trace/family typography is enlarged for legibility without changing numerical values. The later captures use visible viewport screenshots and checked crop bounds to avoid offscreen displacement. Keep new captures in a new revision when an edition has been published.

## Review and scope

Inspect the rendered frames, especially formula timing, axis labels, right-edge cancellation and real-table legibility. The verifier decodes the complete film, checks 29 continuous chapters, caption intervals, Full HD at 24 fps, 48 kHz mono audio, frame count and independent rational teaching examples. Automated checks do not replace listening to the narration or reviewing scientific assumptions. The published video hash and its validation receipt are in `media/video/2026-10-12-mathematics/`.

The 113 certificate checks are separate from media checks. They do not certify the whole physical theory. The code and record have the repository's existing license terms; no additional open-source license is granted here.

The English introduction has a pinned historical hash; the Spanish edition renders all 29 scenes with its own narration and timings. A Spanish render is not compared against the English introduction hash.

The approved English introduction has a pinned historical hash. A render on a different system may fail this provenance check; review a new edition before changing that pin.
