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
- A low-poly faceted shell path now exists and is closer to the target paperlamp-kit direction.
- A raw 300-face labeled triangle SVG template exists, but it is not yet a proper connected papercraft net.
- Stanford Bunny was added as a better controlled animal test object.
- Bunny produces a much more recognizable low-poly animal shell than Dino.
- A first connected Bunny net with glue tabs now exists.
- A controlled image-to-3D diagnostic was run on the 48 rendered Bunny views.
- COLMAP recovered a partial sparse Bunny model:
  - uncalibrated: 27 of 48 registered images, 501 sparse points, 0.871273 px mean reprojection error;
  - fixed `SIMPLE_PINHOLE`: 39 of 48 registered images, 1054 sparse points, 0.971214 px mean reprojection error.
- A tuned fixed-camera COLMAP mapper run improved this to 43 of 48 registered images, 2139 sparse points, and 0.826889 px mean reprojection error.
- The best sparse Bunny point cloud was exported and rendered for visual inspection; it hints at ears/body shape but is not a usable surface.
- COLMAP sparse-input Delaunay meshing produced a mesh, but visual inspection failed: the result is a stretched spike-like artifact, not a recognizable Bunny.
- COLMAP Poisson meshing failed on the sparse PLY because it lacks normal fields such as `nx`.
- This confirms camera/image quality matters, but the current local COLMAP path still does not produce the clean source mesh needed by the product.

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
- A raw faceted triangle template exists, but it lacks tabs, connected unfolding, page layout, and assembly validation.
- The connected Bunny net has tabs and connected islands, but still lacks page layout, fold-line styling, and assembly validation.
- A controlled Bunny benchmark produces recognizable faceted shell output, but the best image-derived Bunny result is still sparse geometry rather than a usable mesh.
- COLMAP should not be treated as a Phase 1A pass yet. It remains useful, but the current result is not satisfying enough for the product.

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
- Mesh watertight check: true.
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

### Experiment 6: Low-Poly Faceted Shell

Status: Partial pass

Input:

- `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull.obj`

Command:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull.obj \
  --output-dir poc/output/middlebury-dino-ring/cleaned-mesh \
  --face-counts 300 800 1600
```

Generated outputs:

- `poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-300.obj`
- `poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-800.obj`
- `poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-1600.obj`
- `poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-variants.png`

Measured result:

- 300 target faces -> 300 faces, 149 vertices, not watertight.
- 800 target faces -> 800 faces, 400 vertices, not watertight.
- 1600 target faces -> 1600 faces, 796 vertices, not watertight.

Interpretation:

- The faceted shell output is closer to the intended DIY paperlamp-kit direction than the rib lattice.
- The shape remains too noisy and blobby to pass recognizability.
- Better masks or a stronger reconstruction source are needed before template polish will matter.

### Experiment 7: Raw Faceted Template Export

Status: Partial pass

Input:

- `poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-300.obj`

Command:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-faceted-template.py \
  --input-mesh poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-300.obj \
  --output-svg poc/output/middlebury-dino-ring/printable-planes/dino-faceted-shell-300-template.svg \
  --target-max-mm 250
```

Generated output:

- `poc/output/middlebury-dino-ring/printable-planes/dino-faceted-shell-300-template.svg`

Measured result:

- 300 individual triangle pieces.
- Face IDs and edge IDs are printed into the SVG.
- Output SVG size: about 165 KB.

Interpretation:

- This proves the low-poly shell can be converted into printable 2D facet geometry.
- It does not yet prove a usable kit because the triangles are isolated rather than arranged as connected nets, and there are no glue tabs or page boundaries.

### Experiment 8: Stanford Bunny Controlled Object

Status: Partial pass

Reason for adding:

- DinoRing is useful for calibrated visual-hull testing, but the curled dinosaur shape is visually ambiguous and the resulting shell is blobby.
- Stanford Bunny has a clearer animal silhouette, especially the ears and compact body.
- This object tests whether the downstream faceted-template pipeline can preserve a recognizable animal when the source shape is clean.

Source:

- `poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply`

Object metadata:

- `poc/input/stanford-bunny/object-metadata.yml`

Commands:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-mesh-views.py \
  --input-mesh poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply \
  --output-dir poc/input/stanford-bunny/images \
  --views 24 \
  --elevations -8 14
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply \
  --output-dir poc/output/stanford-bunny/cleaned-mesh \
  --face-counts 150 300 600 1200 \
  --name-prefix stanford-bunny
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-faceted-template.py \
  --input-mesh poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-300.obj \
  --output-svg poc/output/stanford-bunny/printable-planes/stanford-bunny-faceted-shell-300-template.svg \
  --target-max-mm 250
```

Generated outputs:

- 48 rendered same-object input images under `poc/input/stanford-bunny/images/`.
- `poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-variants.png`
- `poc/output/stanford-bunny/printable-planes/stanford-bunny-faceted-shell-300-template.svg`

Measured result:

- 150 target faces -> 150 faces, 78 vertices, not watertight.
- 300 target faces -> 299 faces, 153 vertices, not watertight.
- 600 target faces -> 600 faces, 306 vertices, not watertight.
- 1200 target faces -> 1200 faces, 601 vertices, not watertight.
- Raw 300-face template exports 299 triangle pieces.

Interpretation:

- This is the best shape-fidelity result so far.
- The Bunny remains recognizable after low-poly faceting, especially by its ears/body silhouette.
- This validates the faceted-shell template direction as the likely paperlamp path.
- It does not prove the final user-photo workflow because the source mesh is already known.

### Experiment 9: Connected Bunny Net Export

Status: Partial pass

Input:

- `poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-300.obj`

Command:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-connected-nets.py \
  --input-mesh poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-300.obj \
  --output-svg poc/output/stanford-bunny/printable-planes/stanford-bunny-connected-net-300.svg \
  --target-max-mm 250 \
  --max-faces-per-island 24
```

Generated output:

- `poc/output/stanford-bunny/printable-planes/stanford-bunny-connected-net-300.svg`

Measured result:

- 299 mesh faces.
- 22 connected islands.
- Island size range: 1 to 24 faces.
- 116 glue tabs.
- SVG page height: about 720 mm.
- SVG file size: about 124 KB.

Interpretation:

- This is the first connected-net artifact and is closer to a real DIY paperlamp kit than the isolated triangle export.
- It still does not pass Phase 1 because page layout, fold/cut line styling, assembly order, and physical/rendered reassembly validation are missing.
- The result confirms that connected-net generation is a viable next workstream for the Bunny benchmark.

### Experiment 10: Bunny Rendered-Image Sparse Reconstruction

Status: Unsatisfying partial pass as a diagnostic; not sufficient for product

Input object:

- 48 synthetic same-object rendered views of Stanford Bunny under `poc/input/stanford-bunny/images/`.

Commands:

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/stanford-bunny/images \
  poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap model_analyzer \
  --path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images/sparse/0
```

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/stanford-bunny/images \
  poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated \
  SIMPLE_PINHOLE \
  960,400,400
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap model_analyzer \
  --path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse/0
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap model_converter \
  --input_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse/0 \
  --output_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse-bunny-calibrated.ply \
  --output_type PLY
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-point-cloud.py \
  --input poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse-bunny-calibrated.ply \
  --output poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse-bunny-calibrated-preview.png
```

```bash
mkdir -p poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap mapper \
  --database_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/database.db \
  --image_path poc/input/stanford-bunny/images \
  --output_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse \
  --Mapper.ba_refine_focal_length false \
  --Mapper.ba_refine_principal_point false \
  --Mapper.ba_refine_extra_params false \
  --Mapper.min_num_matches 6 \
  --Mapper.init_min_num_inliers 30 \
  --Mapper.abs_pose_min_num_inliers 15 \
  --Mapper.tri_ignore_two_view_tracks false \
  --Mapper.multiple_models false
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap model_analyzer \
  --path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse/0
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap model_converter \
  --input_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse/0 \
  --output_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-tuned.ply \
  --output_type PLY
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-point-cloud.py \
  --input poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-tuned.ply \
  --output poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-tuned-preview.png
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap delaunay_mesher \
  --input_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse/0 \
  --input_type sparse \
  --output_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-delaunay.ply
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-delaunay.ply \
  --output-dir poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned \
  --face-counts 300 800 1600 \
  --name-prefix sparse-bunny-delaunay
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc colmap poisson_mesher \
  --input_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-tuned.ply \
  --output_path poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-poisson.ply
```

Measured result:

- Uncalibrated run:
  - 27 registered images out of 48;
  - 501 sparse points;
  - 2287 observations;
  - 4.564870 mean track length;
  - 84.703704 mean observations per image;
  - 0.871273 px mean reprojection error.
- Fixed `SIMPLE_PINHOLE` run:
  - 39 registered images out of 48;
  - 1054 sparse points;
  - 4987 observations;
  - 4.731499 mean track length;
  - 127.871795 mean observations per image;
  - 0.971214 px mean reprojection error.
- Exported preview:
  - `poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated/sparse-bunny-calibrated-preview.png`;
  - visual read: the point cloud hints at the Bunny ears and seated body, but remains sparse and incomplete.
- Tuned fixed-camera mapper run:
  - 43 registered images out of 48;
  - 2139 sparse points;
  - 7258 observations;
  - 3.393174 mean track length;
  - 168.790698 mean observations per image;
  - 0.826889 px mean reprojection error.
- Tuned exported preview:
  - `poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-tuned-preview.png`;
  - visual read: denser and more recognizable than the previous sparse point cloud, but still not a mesh.
- Sparse Delaunay mesh:
  - `poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-delaunay.ply`;
  - 995 vertices;
  - 1978 faces;
  - not watertight;
  - 4 connected components.
- Sparse Delaunay visual result:
  - `poc/output/stanford-bunny/reconstruction/colmap-sparse-rendered-images-calibrated-tuned/sparse-bunny-delaunay-faceted-shell-variants.png`;
  - visual read: failed; the mesh becomes a long spike-like artifact and does not preserve Bunny shape.
- Poisson result:
  - failed with `Failed to find property in ply file: nx`;
  - the sparse PLY does not contain normals required by this mesher.

Interpretation:

- Fixed camera assumptions materially improved registration coverage.
- Relaxed mapper thresholds improved the sparse Bunny result further.
- The synthetic Bunny views are useful as a reconstruction diagnostic but are not equivalent to real phone photos.
- Sparse COLMAP output alone is not a product-ready source shape. It gives camera poses and points, not a watertight mesh suitable for faceting/unfolding.
- Sparse Delaunay and Poisson do not rescue the local COLMAP path.
- Phase 1A conclusion for now: local COLMAP is useful for camera recovery and diagnostic sparse structure, but not satisfying enough as the product's image-to-mesh engine on this setup.

### Experiment 11: User-Captured Recognizable Organic Object

Status: Not started

Input object:

- TBD

Planned output:

- Reconstructed mesh
- Simplified mesh
- Notes on recognizability

Result:

- TBD

### Experiment 12: Printable Plane Strategy

Status: Not started

Planned strategies:

1. Vertical or radial contour slices.
2. Horizontal contour slices.
3. Optional interlocking slots.
4. Optional unfolded surface pieces.

Result:

- TBD

### Experiment 13: Physical Or Rendered Validation

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
- Image-conditioned mesh APIs may hallucinate shape detail. A text prompt can help semantic features, but it cannot replace geometric evidence.

## Next Actions

1. Keep COLMAP in the pipeline only as a diagnostic/camera-recovery baseline for now.
2. Continue Phase 1A by testing the next image-to-mesh candidate that can output an actual mesh.
3. Prefer candidates that can be tested raw on the Bunny benchmark before any UI or product logic.
4. Keep the object-description input idea in mind for image-conditioned mesh generation, but verify outputs geometrically because text can hallucinate shape.
5. Only return to connected-net polish after the source mesh route is credible.
