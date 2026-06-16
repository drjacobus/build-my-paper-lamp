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
