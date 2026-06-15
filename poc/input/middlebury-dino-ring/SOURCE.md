# Source: Middlebury DinoRing Dataset

## Why This Dataset

This is a real multi-view dataset with 48 calibrated images of the same matte ceramic dinosaur object.

It is useful for Phase 1 because:

- all images show the exact same object;
- the object is matte and non-reflective;
- camera intrinsics and extrinsics are provided;
- the object has a recognizable silhouette;
- the image set is small enough for repeatable local COLMAP tests.

Limitations:

- this is a lab dataset, not phone photography;
- the object is untextured, so sparse feature matching is harder than with a richly textured object;
- some images have shadows or partial field-of-view issues;
- passing this dataset does not yet prove printable plane generation.

## Source

- Dataset page: https://vision.middlebury.edu/mview/data/
- Direct download: https://vision.middlebury.edu/mview/data/data/dinoRing.zip

## Local Files

Downloaded raw archive:

```text
poc/input/middlebury-dino-ring/raw/dinoRing.zip
```

Extracted source folder:

```text
poc/input/middlebury-dino-ring/raw/dinoRing/
```

Copied COLMAP input images:

```text
poc/input/middlebury-dino-ring/images/dinoR0001.png
...
poc/input/middlebury-dino-ring/images/dinoR0048.png
```

The raw and extracted image files are intentionally gitignored.

## Calibration Used

The provided `dinoR_par.txt` file reports constant intrinsics across the 48 views:

```text
fx = 3310.4
fy = 3325.5
cx = 316.73
cy = 200.55
```

The reproducible COLMAP command is:

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/middlebury-dino-ring/images \
  poc/output/middlebury-dino-ring/reconstruction/colmap-sparse-calibrated \
  PINHOLE \
  3310.4,3325.5,316.73,200.55
```
