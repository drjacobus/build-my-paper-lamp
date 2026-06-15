# THU-MVS Dog

Source: https://www.aoki.ecei.tohoku.ac.jp/mvs/

Selected as the next public physical-object benchmark after the Stanford Bunny proof.

Why this dataset:

- Physical dog figurine, not a synthetic render.
- Turntable-style capture.
- RGB Dog set has 72 views from 2 camera-height rings and 36 rotation angles.
- Recognizable animal silhouette, closer to the paperlamp direction than mugs or product packaging.
- Small enough to test before larger datasets such as Washington RGB-D or BigBIRD.

Planned test:

1. Download `Dog_RGB.zip`.
2. Extract the images.
3. Select 12 to 15 views across the turntable rotation.
4. Create a CSV manifest with approximate `image,azimuth,elevation`.
5. Run `build-turntable-visual-hull.py`.
6. Generate a 300-face faceted shell.
7. Export a connected SVG net.

Important caveat:

The THU-MVS page says the data is freely available, but it does not clearly state a commercial license. Treat this as a research/POC dataset only unless licensing is clarified.
