# Neutral sector supplement · 28 October 2026

Six chapters in English and Spanish supplement the dated main films. Uses the
existing quantization-film renderer and System.Speech narrator. Real app panels
are captured by the existing browser harness, with exact inputs and results in
`captures/provenance.json`. No mathematical value is painted into a screenshot.
`captures/recorded-app.html` retains the exact offline app used in the recording;
its hash matches the capture receipt. Subsequent catalogue/hash normalization
does not change the scientific controls or results shown in that snapshot.

Reproduce from the lab root after building the app:

```
node build/boundary_research.mjs --capture-video
powershell -NoProfile -File tools/neutral_video/en/narrate.ps1
powershell -NoProfile -File tools/neutral_video/es/narrate.ps1
python tools/neutral_video/render.py
python build/build_site.py
```

Renderer dependencies: Pillow and imageio-ffmpeg, or an existing FFmpeg executable
in GHU_FFMPEG. Fonts: Segoe UI (GHU_VIDEO_FONT_DIR can override). Source narration,
word timestamps and audio are retained. Encoding is 1920x1080, 24 fps, H.264/AAC.
Each final MP4 is fully decoded and its frame count checked. VTT timings come
from speech word events. The manifest records hashes, sizes and exact duration.
Automated checks do not claim a complete human listening review.

Proof scope is in `proof/z-isolation/PROOF.txt`. The finite quotient and continuous
vector eigenvalue are separate instruments. No Wilson derivative, RZW, physical
vacuum, Higgs direction or experimental prediction is certified by these movies.
The mathematical engine is maintained in Excovery; this directory holds the
lab-specific audiovisual source, following the established repository structure.
