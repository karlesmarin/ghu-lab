---
date: 2026-10-07
part: instrument
severity: extension
affects_record: no
title: Fixed light inputs, neutrino responses and descriptive experimental-reference figures
verify: In Simulator select Neutrino ring and open Fixed light inputs. Compare the three presets and change the sweep position. Run node _test_neutrino_research.mjs, node tools/neutrino_identifiability.mjs and build/build_app.py --browser.
---

what
: A new experiment reconstructs the same light inputs along nine ring/deficit paths. Five
  descriptive figures display heavy centres, splitting, raw and explicitly normalized vacuum
  current factors, a magnified difference and the archived DeepCore 2018 reference map.
: The fourth study category archives 738 scan points and standalone SVG/PNG/PDF figures.
  Original experimental tables, hashes, independent NumPy/SVD references and browser checks
  accompany the code. Both READMEs, inventory, help and public guides describe the complete route.

why
: Reproducing supplied masses does not make them predictions. A research tool must show which
  additional responses change, where normalization hides an effect, and which data assumptions
  permit a comparison. Captions, scales, fixed-input labels and difference plots make this visible.

so
: This is tree-level, leading-Majorana reconstruction with specified vacuum current normalization.
  DeepCore is an archived standard-three-neutrino reference, not a nonunitary ring fit. No ordering
  odds, extrapolation, ring exclusion or sum with NuFIT is assigned. Detector response, matter,
  weak-input refits and radiative stability remain open. Frozen papers and editions are unchanged.
