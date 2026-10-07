# 🎬 GHU Lab video guide · English and Spanish

[Watch in English](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=en) ·
[Ver en español](https://karlesmarin.github.io/ghu-explorer/video/index.html?lang=es)

The guide demonstrates all 29 navigation sections, three Simulator modes, eight research cards,
integrated diagnostics and exports. There are 43 chapters and 121 narrated scenes per language.
Representative controls are shown; the guide does not enumerate every input combination.
The experiment's question, changed input and interpretation form each chapter's teaching sequence.

## What was recorded

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
The browser player uses native caption tracks created from embedded cue data, including from disk.

## Reproduce on Windows

Prerequisites: the tested standalone app, Node with WebSocket support, Chromium, Python with Pillow
and `imageio-ffmpeg==0.6.0`, and the two named Windows System.Speech voices. Set `GHU_CHROME` if the
browser is not automatically found. Capture and intermediate output must stay outside the source
tree, so browser profiles, local file URLs and raw footage do not enter the public repository.

```powershell
node tools/video_guide/record.mjs ../video-recording
powershell -NoProfile -File tools/video_guide/narrate.ps1 -OutputDirectory ../video-recording/audio/en -Language en
powershell -NoProfile -File tools/video_guide/narrate.ps1 -OutputDirectory ../video-recording/audio/es -Language es
python tools/video_guide/render.py ../video-recording --pilot
python tools/video_guide/render.py ../video-recording
```

Inspect the pilot before rendering the whole guide. Use `--vendor` if imageio-ffmpeg is installed
in a project-local directory. Replacing a narration requires removing its corresponding WAV and
timing JSON from the chosen capture directory; review the resolved paths before removing files.
The renderer caches clips using audio and render-input digests. A changed recording must be rendered
with a fresh render cache. The committed media manifest pins the delivered assets, rather than
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
It checks both languages, seeks, live captions, transcript coverage, chapter search, deep links,
mobile width and playback from disk. Its local server supports byte-range video requests.
Screenshots and the result are written to `shots/video-guide/`, outside the tracked source.
