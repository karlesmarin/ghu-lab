# Animated mathematics video production

[Watch the complete English MP4](https://karlesmarin.github.io/ghu-explorer/video/mathematics/ghu-mathematics-en.mp4) · [Player, transcript and proofs](https://karlesmarin.github.io/ghu-explorer/video/mathematics/index.html) · [Mathematical certificates](../../proof/boundary-research/README.md)

The film has 29 narrated chapters: eight boundary steps followed by eight profile explanations, six trace explanations, five consistency explanations and two evidence chapters. Drawing primitives use Pillow and Matplotlib mathematical text. Numerical figures use explicit functions and fixed axes where appropriate. Real browser captures show 41 boundary states, 21 Gram states, three trace insertions and six family results. The source snapshots are included so rendering does not depend on the current website.

## Render the stored explanations

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

## Capture a revised laboratory

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

The approved introduction has a pinned historical hash. A render on a different system may fail this provenance check; review a new edition before changing that pin.
