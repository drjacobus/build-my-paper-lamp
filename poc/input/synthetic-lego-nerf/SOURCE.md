# Source: Tiny NeRF Lego Dataset

## Why This Dataset

This is a tiny multi-view dataset from the original NeRF example data. It contains 106 rendered RGB views of the same synthetic Lego object, plus camera poses and focal length.

It is useful for a first pipeline sanity check because:

- all images are of the same object;
- the dataset is small enough to keep local;
- the source is a well-known 3D reconstruction/view-synthesis example;
- the input is controlled, so failures are easier to interpret.

Limitations:

- images are synthetic renders, not real phone photos;
- images are only 100x100 pixels;
- COLMAP may struggle if too few stable local features are detectable;
- passing this dataset does not prove the final real-object lamp workflow.

## Source

- Repository: https://github.com/bmild/nerf
- Download script: https://raw.githubusercontent.com/bmild/nerf/master/download_example_data.sh
- Direct data URL: http://cseweb.ucsd.edu/~viscomp/projects/LF/papers/ECCV20/nerf/tiny_nerf_data.npz

## Local Files

Downloaded raw dataset:

```text
poc/input/synthetic-lego-nerf/raw/tiny_nerf_data.npz
```

Extracted COLMAP input images:

```text
poc/input/synthetic-lego-nerf/images/view_000.png
...
poc/input/synthetic-lego-nerf/images/view_105.png
```

These raw and extracted files are intentionally gitignored.
