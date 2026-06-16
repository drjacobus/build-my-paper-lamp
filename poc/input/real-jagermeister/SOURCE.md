# Real Jagermeister Bottle Phone Capture

Source images:

- `/Users/jacoblind/Downloads/jagerMeisterImages/IMG_7390.HEIC` through `IMG_7408.HEIC`

This is the first real user-provided phone-photo test.

Notes:

- The object is a glossy dark glass bottle.
- The first 10 images (`IMG_7390` through `IMG_7399`) are the most turntable-like upright sequence.
- The later images include more top-down / mixed camera angles.
- This is intentionally harder than recommended first targets because of gloss, dark glass, cluttered background, and changing camera elevation.
- HEIC files were converted to 1200px PNG proxies through macOS Quick Look for local processing.

Initial mask approach:

- `make-simple-foreground-masks.py` was added as a lightweight fallback before real AI segmentation.
- It is not a replacement for AI segmentation; masks must be inspected.
- Result: technical mesh generation worked, but visual recognizability failed because the heuristic masks over-smoothed the body and did not preserve neck/cap detail reliably.

AI segmentation approach:

- Installed `rembg[cpu]`, which adds CPU ONNX Runtime support.
- Used the `isnet-general-use` segmentation model.
- Added `poc/scripts/make-ai-foreground-masks.py` to generate binary masks plus an inspection contact sheet.
- Generated AI masks under `poc/input/real-jagermeister/masks-ai-isnet/`.
- Generated the inspection sheet at `poc/output/real-jagermeister/renders/ai-isnet-mask-contact-sheet.jpg`.
- Created `turntable-10-view-ai-isnet-manifest.csv` for `IMG_7390` through `IMG_7399`.

AI segmentation result:

- The AI masks consistently preserve the bottle body, shoulders, neck, and cap in the first 10 upright views.
- The rebuilt visual hull is watertight and recognizable as a bottle.
- The output does not preserve the Jagermeister label or texture; this pass proves geometry/silhouette recognition, not branded texture reconstruction.

Best current output:

- Reconstruction folder: `poc/output/real-jagermeister/reconstruction/turntable-visual-hull-10views-ai-isnet-r112-c080/`
- Shell preview: `real-jagermeister-10view-ai-isnet-visual-hull-faceted-shell-variants.png`
- Mesh: `real-jagermeister-10view-ai-isnet-visual-hull.obj`
- Connected net: `real-jagermeister-10view-ai-isnet-visual-hull-faceted-shell-320-net.svg`
