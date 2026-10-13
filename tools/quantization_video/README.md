# Quantization video supplement — 13 October 2026

Eleven chapters in English and Spanish, narrated with Microsoft Zira / Helena using the existing Windows System.Speech workflow. The film uses real captures of the new laboratory option, with independently timed captions, a transcript, embedded chapter metadata and full media decoding.

From the repository root:

    python build/build_app.py --browser
    node build/quantization.mjs --capture-video
    python tools/quantization_video/prepare.py
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/quantization_video/en/narrate.ps1
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/quantization_video/es/narrate.ps1
    python tools/quantization_video/render.py

Dependencies: Pillow, imageio-ffmpeg, the installed Segoe UI fonts and the named Windows voices. Captures and their numerical provenance are preserved; scientific values are not painted onto the screenshots. Captions use speech word timings. Font or voice changes may change media bytes. A full human listening review is not recorded.

This is a narrated, chaptered screen-capture supplement, not a replacement of the October 12 films. The old editions are retained. No video frame promotes arithmetic verification into full physical consistency. Full outputs and hashes live in media/video/2026-10-13-quantization.
