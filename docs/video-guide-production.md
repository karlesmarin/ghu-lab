# 🎬 GHU Lab video guide · English and Spanish

For the separate 43-chapter mathematical film in English and Castellano,
see [the mathematical video guide](mathematics-video.md) and
[its production instructions](../tools/mathematics_video/README.md). The workflow below
concerns the 47-chapter general laboratory tutorial.

[Watch in English](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=en) ·
[Ver en español](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=es)

The guide demonstrates all 30 navigation sections, three Simulator modes, eleven research cards,
integrated diagnostics and exports. There are 47 chapters and 175 narrated scenes per language.
Representative controls are shown; the guide does not enumerate every input combination.
The experiment's question, changed input and interpretation form each chapter's teaching sequence.

The general recordings were captured from source commit
[`99007ca`](https://github.com/karlesmarin/ghu-lab/commit/99007ca), whose built app
SHA-256 is `16f09833671badd3b3a5f7a935784dda8a4cef8874bb02c59c95d1d1bd117d68`.
The subsequent live language-switch correction preserves the recorded calculations,
data, media and chapter times. Replay the capture against that checkpoint; the current
app has its own build hash.

## Cover and access to the new chapter · 14 October 2026

In Spanish, chapter 47, **Hipótesis: respuesta, medidas y certificados**, runs from
**45:16 to 49:10**. In a local build open
`site/video/index.html?lang=es#hypothesiscompare`, or search for “Hipótesis” in the player.

The player cover combines a 3D source-response surface with a 2D plot of invariant paired
masses. `tools/video_guide/poster_data.mjs` computes it from the maintained gravity–gauge
engine; `poster.py` renders both languages. `poster-data.json` and
`poster-provenance.json` record the model scope, reference checks and hashes. This is a
calculated model example, not measured collider data. The cover is the player's poster;
it does not add an introductory segment or change the MP4 chapter times.

The startup fix avoids assigning `currentTime = 0` after loading metadata: even that
redundant seek dismisses the browser's poster and exposes the black opening frame.
Nonzero chapter links and language changes retain their intended positions. The browser
gate now passes **35 checks**, including rendered-pixel comparisons with the cover in
English, Spanish and local-file playback. These supplement the **3,376** capture,
media and subtitle checks for this recording; neither is a full human listening review.

## What was recorded

The current `2026-10-14-hypotheses` revision recaptures all 47 chapters in both languages. Chapter 47 and the embedded hypothesis Demo share one storyboard: start with a question, change a real control, read axes and uncertainty, state what follows, then save and practice. It demonstrates recalibrated GHU cases, a global potential view, measured CMS bins, correlations and scoped certificates. The guide links directly to this chapter. The recorder resolves translated controls using their original source text.

The 13 October main film and mathematical film remain archived with their original media. Current mathematics has 43 chapters and the complete Lean catalogue has 59 declarations in five files. Publication is a separate step; these commands produce local assets.


The historical revision `2026-10-12-boundary-research` recaptures all 45 chapters against Lab 0.2.1.
Chapter 44 adds nine scenes: the boundary spectrum, linked 2D/3D mass views, independent
profiles, parity-inserted traces and the restricted six-dimensional family condition.
The controls and numerical results come from the actual app. The narration explains
why these separate diagnostics do not certify a complete quantum model. Generate the
new chapter with `tools/video_guide/add_chapter_boundary_research.py`, then regenerate
the in-app demos before building and recording. Both manuals and task guides cover it.

The revision `2026-10-10-demos` recaptures all 44 chapters (145 scenes) against the current laboratory, so every
screen shows the guided 🎬 Demo buttons; chapter 43 opens by starting the KK-gluon card's own demo, then takes
over, and its narration follows the card after the external review (`tools/video_guide/add_revision_demos.py`).
The earlier revision of 10 October (`2026-10-10-kkgluon`) recaptured all 44 chapters and added chapter 43, *First KK gluon at the LHC*: five scenes that load the published warped reference point,
read r against the ATLAS tt̄ limit, show the m(tt̄) spectrum with constructive interference, switch to the flat
GHU coloron where it turns destructive, and set the SM theory uncertainty to zero to show how the expected Δχ²
moves. The opening scene mentions the new chapter. `tools/video_guide/add_chapter_kkgluon.py` inserts it;
`tools/video_guide/publish_revision.py` copies a verified recording into `media/video/<revision>/` with its
hash manifest and selects it.

The certification revision of 8 October recaptures all 43 chapters against the current
laboratory. Eighteen additional scenes demonstrate certificates, full-potential versus moment
comparisons, the separated uncertainty budget, named experimental references, thermal solver
diagnostics and withdrawal of unmatched archived evidence. Two existing scenes have revised
narration in each language. The 139-scene script preserves scientific attribution and separates
formal proofs, computer-assisted interval results, numerical agreement and open physics.

Current assets live in `media/video/2026-10-14-hypotheses/`, selected by
`media/video/current.json`. Earlier media remain byte-identical in `media/video/`,
`media/video/2026-10-08/`, `media/video/2026-10-08-certification/` and `media/video/2026-10-10-kkgluon/`. Their
complete previously served pages are preserved as `video/2026-10-07.html`, `video/2026-10-08.html`,
`video/2026-10-08-certification.html`, `video/2026-10-10-kkgluon.html` and
`video/2026-10-10-demos.html`; Editions links all five. The
2026-10-10-demos revision re-recorded every chapter again, after the 🎬 Demo buttons were added (the KK-gluon
revision's screens predate them).
English and Spanish now have separate interface captures under `en/` and `es/` in the
recording directory. Each capture records its application hash and requested UI language;
the verifier checks that the Spanish boundary scenes contain Spanish results. The boundary
card translates its controls, plots and explanations; the current interface uses its reversible translation catalogue, preserving scientific source names. Identical audio is reused only when text, voice, rate and sample rate match. Image contents,
audio and overlays all participate in clip cache keys. Captions and chapter times are rebuilt.

`tools/video_guide/storyboard.json` contains the English and Spanish narration and the exact browser
actions. `record.mjs` drives the real app in Chromium, captures the controls before and after changes,
checks that values persist, and fails on missing elements or browser exceptions. Results are computed
by the browser. The recording adds a pointer highlight and chapter bar; waits are shortened and
built-in demos are paused for explanation. Frames are captured at 1920 × 1080. The final H.264/AAC
MP4 uses 15 frames per second, appropriate to these largely stationary scientific interfaces.

Narration is synthetic: Microsoft Zira Desktop for English and Microsoft Helena Desktop for Spanish.
`narrate.ps1` stores the word positions returned by System.Speech. The 16 kHz mono PCM synthesis
format keeps the engine's word positions aligned with the WAV timeline; caption construction refuses
out-of-range or nonpositive timings. Rendering normalizes narration toward −16 LUFS with a −1.5 dBTP
target. MP4 chapter metadata and downloadable WebVTT subtitles accompany both versions.
The browser player uses native caption tracks created from embedded cue data, including from disk. A visible CC · Subtitles button toggles their display, retains the choice across seeks and language changes, and exposes its state to assistive technology.

## The same script drives the in-app demos

`tools/make_demo_scripts.mjs` turns this storyboard (and the user guides' "how to read it") into the 🎬 Demo of every
section, Simulator mode and card (`src/view/demo_scripts.mjs`, run by `src/view/card_demo.js`). After
editing the storyboard, regenerate it: `_test_demo_scripts.mjs` fails when the demos are stale, and `build/demos.mjs`
runs all of them in a browser.

## Reproduce on Windows

Prerequisites: the tested standalone app, Node with WebSocket support, Chromium, Python with Pillow
and `imageio-ffmpeg==0.6.0`, and the two named Windows System.Speech voices. Set `GHU_CHROME` if the
browser is not automatically found. Capture and intermediate output must stay outside the source
tree, so browser profiles, local file URLs and raw footage do not enter the public repository.

```powershell
node tools/video_guide/record.mjs ../video-recording/en --language=en
node tools/video_guide/record.mjs ../video-recording/es --language=es
powershell -NoProfile -File tools/video_guide/narrate.ps1 -OutputDirectory ../video-recording/audio/en -Language en
powershell -NoProfile -File tools/video_guide/narrate.ps1 -OutputDirectory ../video-recording/audio/es -Language es
python tools/video_guide/render.py ../video-recording --pilot
python tools/video_guide/render.py ../video-recording
python tools/video_guide/verify_revision.py ../video-recording
```

Inspect the pilot before rendering the whole guide. Use `--vendor` if imageio-ffmpeg is installed
in a project-local directory. A changed narration automatically regenerates its WAV and timing JSON.
The renderer invalidates clips when audio, frames or overlays change. Use a fresh output directory
for a new dated revision to preserve the previous release. The committed media manifest pins the delivered assets, rather than
promising byte-identical encoding on every FFmpeg or voice version.

The site builder copies only manifest-listed assets and verifies their SHA-256 digests. The guide
is reachable from the home page, documentation, navigation, inventory and both repository READMEs.
It uses local media, with an explicit exception for that video page in the existing edition gate.
Scientific app sources, standalone behavior and numerical validation are unaffected.

## Production references

The structure follows TechSmith's guidance on scripts, showing controls together with explanations,
readable screen capture and clear narration: [instructional-video guide](https://assets.techsmith.com/Docs/ultimate-guide-to-easily-make-instructional-videos.pdf).
Captions, transcripts and integrated explanations of visual results follow the
[W3C media-accessibility guidance](https://www.w3.org/WAI/media/av/).
These references informed the production choices; they are not endorsements or a conformance certification.

## Playback verification

After building the site, run `node build/video_guide.mjs` for the real-browser playback gate.
It checks visible startup covers, both languages, seeks, live captions, transcript coverage, chapter search, deep links,
mobile width and playback from disk. Its local server supports byte-range video requests.
Screenshots and the result are written to `shots/video-guide/`, outside the tracked source.
