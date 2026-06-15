# Phase 1 POC Report

## Summary

Phase 1 has started. The current objective is to prove that a few object photos can become printable 2D planes that assemble into a recognizable 3D object.

No end-to-end proof has passed yet.

Current best technical result:

- A controlled same-object benchmark has been found: Middlebury DinoRing.
- COLMAP sparse reconstruction works on DinoRing when the provided camera calibration is used.
- COLMAP dense stereo is blocked locally by a CUDA requirement.
- A silhouette-derived visual hull produced the first rough OBJ and 12-rib SVG sheet.
- A 20-rib orthogonal assembly render exists, but recognizability is still weak.

## Setup Findings

Date: 2026-06-15

The Phase 1 workspace has been created under `poc/`.

Initial tool availability:

- COLMAP is installed and verified in the `paperlamp-poc` Conda environment.
- Blender is not installed.
- Meshroom/AliceVision is not installed.
- MeshLab server is not installed.
- OpenSCAD is not installed.
- Conda is available.
- POC Python is available at `/opt/anaconda3/envs/paperlamp-poc/bin/python`.
- pycolmap, trimesh, shapely, NumPy, scikit-image, SciPy, and Matplotlib are available and import successfully in `paperlamp-poc`.
- Open3D was installed during setup but failed import because of a TBB/Embree dynamic library mismatch. It was removed because it is not needed for the first proof.
- Installed Python libraries were checked for bundled same-object multi-view object datasets. No useful dataset was found, so external benchmark image sets were used.

Implication:

- We can organize inputs and reports now.
- We can run sparse reconstruction locally with COLMAP.
- We can begin mesh-to-plane experiments with `trimesh` and `shapely` before adding Blender.

## Phase Gate

Current status: **Not ready for Phase 2**

Reason:

- Input image sets have only been tested through sparse reconstruction.
- No clean dense reconstructed mesh has been produced.
- A rough printable-style 2D rib SVG exists, but it has not been cleaned, slotted, printed, or paged.
- A rendered rib assembly exists, but it is not yet recognizable enough to pass Phase 1.

## Experiment Results

### Experiment 1: Same-Object Dataset Search

Status: Complete for first benchmark

Inputs checked:

- Installed Python test/example data from the POC environment.
- Tiny NeRF Lego.
- Middlebury DinoRing.

Result:

- Installed library datasets did not include a useful same-object multi-view object set.
- Tiny NeRF Lego contains 106 views of the same synthetic Lego object, but images are only 100x100 and did not produce a useful COLMAP sparse model.
- Middlebury DinoRing contains 48 calibrated real views of the same matte ceramic dinosaur and is now the first Phase 1 benchmark.

### Experiment 2: COLMAP Sparse Reconstruction

Status: Partial pass

Input object:

- Middlebury DinoRing, 48 images of the same matte ceramic dinosaur.

Commands:

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/middlebury-dino-ring/images \
  poc/output/middlebury-dino-ring/reconstruction/colmap-sparse-calibrated \
  PINHOLE \
  3310.4,3325.5,316.73,200.55
```

Results:

- COLMAP automatic reconstruction crashed in the headless macOS session because it touched Qt/screen services.
- Manual COLMAP CLI feature extraction and exhaustive matching worked.
- Uncalibrated DinoRing sparse mapping produced only 3 registered images and 162 sparse points.
- Calibrated DinoRing sparse mapping produced two sparse models:
  - model 0: 23 registered images, 704 sparse points, 4804 observations, 0.725452 px mean reprojection error;
  - model 1: 24 registered images, 511 sparse points, 3309 observations, 0.807898 px mean reprojection error.

Interpretation:

- The calibrated image set is good enough for local sparse reconstruction.
- The sparse output does not yet satisfy Phase 1 because it is not a dense object mesh and cannot directly become printable planes.
- The next raw proof step should test dense geometry or a silhouette-derived visual hull from the DinoRing images.

### Experiment 3: Dense Geometry Attempt

Status: Failed locally

Input object:

- Middlebury DinoRing, calibrated COLMAP sparse model 0.

Result:

- COLMAP `image_undistorter` worked for 23 registered images.
- COLMAP `patch_match_stereo` failed with: dense stereo reconstruction requires CUDA.

Interpretation:

- The local COLMAP package is still useful for sparse reconstruction and calibration checks.
- Dense reconstruction through this COLMAP build is not viable on this machine unless we use a CUDA-capable environment.
- The POC should continue with a non-CUDA silhouette/visual-hull route before adding heavier tools.

### Experiment 4: Silhouette Visual Hull And Rib SVG

Status: Partial pass

Input object:

- Middlebury DinoRing, 43 curated good-silhouette images and provided camera calibration.

Command:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-visual-hull.py \
  --image-dir poc/input/middlebury-dino-ring/images \
  --camera-file poc/input/middlebury-dino-ring/raw/dinoRing/dinoR_par.txt \
  --silhouette-list poc/input/middlebury-dino-ring/raw/dinoRing/dinoR_good_silhouette_images.txt \
  --output-dir poc/output/middlebury-dino-ring/printable-planes \
  --resolution 64 \
  --rib-count 12
```

Generated outputs:

- `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-voxels.npz`
- `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull.obj`
- `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-ribs.svg`

Measured result:

- 78,721 occupied voxels out of 262,144 after cleanup.
- OBJ mesh: 20,738 vertices and 41,564 faces.
- Mesh watertight check: false.
- SVG output: 12 rib contours.

Interpretation:

- This is the first raw artifact that converts same-object images into 2D printable-style plane outlines.
- It does not yet pass Phase 1 because the ribs are noisy, unslotted, unpaged, and not yet rendered or physically assembled.
- The path is promising because it avoids the CUDA blocker and aligns with the lamp-plane product direction.

### Experiment 5: Orthogonal Rib Assembly Render

Status: Partial pass

Input:

- `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-voxels.npz`

Command:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-rib-assembly.py \
  --voxel-file poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-voxels.npz \
  --output-dir poc/output/middlebury-dino-ring/renders \
  --x-ribs 10 \
  --y-ribs 10 \
  --simplify 2.0
```

Generated outputs:

- `poc/output/middlebury-dino-ring/renders/dino-rib-assembly.obj`
- `poc/output/middlebury-dino-ring/renders/dino-rib-assembly.png`
- `poc/output/middlebury-dino-ring/renders/dino-rib-assembly-views.png`

Measured result:

- 20 total ribs:
  - 10 x-axis ribs;
  - 10 y-axis ribs.

Interpretation:

- The output now forms an inspectable 3D rib assembly, not just isolated 2D outlines.
- The object is still too noisy and weakly recognizable compared with the curled stegosaurus source image.
- This is progress toward Phase 1, but not a pass.

### Experiment 6: Recognizable Organic Object

Status: Not started

Input object:

- TBD

Planned output:

- Reconstructed mesh
- Simplified mesh
- Notes on recognizability

Result:

- TBD

### Experiment 7: Printable Plane Strategy

Status: Not started

Planned strategies:

1. Vertical or radial contour slices.
2. Horizontal contour slices.
3. Optional interlocking slots.
4. Optional unfolded surface pieces.

Result:

- TBD

### Experiment 8: Physical Or Rendered Validation

Status: Not started

Preferred validation:

- Print or laser cut generated parts and assemble.

Fallback validation:

- Render generated planes in 3D and compare them to the source object.

Result:

- TBD

## Current Risks

- Photogrammetry may fail on glossy, transparent, low-texture, or thin objects.
- Full papercraft unfolding may create too many small pieces for a good product.
- The most promising MVP may be contour/rib lamp construction rather than true unfolded surface reconstruction.
- Sparse reconstruction alone may not contain enough surface information for printable plane generation.
- Dense reconstruction may require additional COLMAP steps, Blender, Meshroom/AliceVision, or a custom silhouette/visual-hull path.
- Public benchmark success may not transfer directly to casual phone photos.

## Next Actions

1. Improve mask quality and contour filtering until the Dino rib render is recognizably related to the source object.
2. Add slot generation and page layout to the SVG rib output.
3. Add side-by-side rendered validation against one or more source silhouettes.
4. Repeat at a higher voxel resolution once the 64^3 result is cleaner.
5. Capture our own object photos only after the benchmark path produces a recognizable rendered assembly.
