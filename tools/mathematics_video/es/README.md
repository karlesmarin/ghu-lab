# Spanish mathematical film

The complete 29-chapter Spanish edition is 11:55, with Microsoft Helena Desktop (es-ES),
Spanish whiteboards, burned captions and actual captures of the Spanish laboratory.
It preserves the mathematical examples and uses the same certificate bundle as English.

Use the parent requirements file. On Windows, generate speech for both groups:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/es/boundary/narrate.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/mathematics_video/es/full/narrate.ps1
python tools/mathematics_video/es/boundary/render_more.py .
python tools/mathematics_video/es/full/render_more.py .
python tools/mathematics_video/es/assemble.py .
python tools/mathematics_video/es/verify_final.py .
```

The final positional argument is the dependency directory (use `.` when installed in the environment).
Use `--preview` on either renderer to inspect early, middle and late scene frames without encoding.
The renderer caches each completed scene by source, labels, captures, voice and timing.
The included captures allow rendering without a browser. To capture again, serve the built site
on port 8875, run each group's `capture.mjs`, then `crop_captures.py`.
Only typography is enlarged in selected captures; computed values are not altered.
Fonts come from the operating system; GHU_VIDEO_FONT_DIR can select compatible font files.

Expected edition: 1920×1080, 24 fps, 48 kHz mono AAC, 29 embedded chapters, 156 caption cues.
The verifier decodes the complete movie, checks timing and samples all scenes.
Synthetic narration has not received a complete human listening review.
Shared primary references, mathematical scope and the 113 checks are in `proof/boundary-research/`.
