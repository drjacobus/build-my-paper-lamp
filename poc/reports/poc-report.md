# Phase 1 POC Report

## Summary

Phase 1 has started. The current objective is to prove that a few object photos can become printable 2D planes that assemble into a recognizable 3D object.

The first constrained image-to-printable-net proof has passed on a controlled benchmark.

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
- A non-Tripo controlled turntable visual-hull route now converts Bunny images into a usable watertight mesh.
- The full 48-image Bunny capture produced a watertight mesh, a 300-face watertight shell, and a connected SVG net with 22 islands and 129 glue tabs.
- A reduced 12-image Bunny subset, matching the intended app input count, also produced a watertight mesh, a 300-face watertight shell, and a connected SVG net with 21 islands and 131 glue tabs.
- Manifest-based input was added so the same path can accept arbitrary app-style image filenames plus approximate azimuth/elevation values.
- This should be treated as a pass only under explicit capture constraints: same object, centered, clean/white background, enough silhouette coverage, and known or estimated viewing angles.

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

Current status: **Phase 1A constrained pass; not ready for full Phase 2 UI**

Reason:

- A clean image-derived mesh has now been produced through controlled turntable visual hull, not through COLMAP dense reconstruction.
- A rough printable-style 2D rib SVG exists, but it has not been cleaned, slotted, printed, or paged.
- A rendered rib assembly exists, but it is not yet recognizable enough to pass Phase 1.
- A raw faceted triangle template exists, but it lacks tabs, connected unfolding, page layout, and assembly validation.
- The connected Bunny net has tabs and connected islands, but still lacks page layout, fold-line styling, and assembly validation.
- A controlled Bunny benchmark now proves the core transformation from 12 clean turntable images to mesh to faceted shell to connected SVG net.
- COLMAP should not be treated as a Phase 1A pass yet. It remains useful, but the current result is not satisfying enough for the product.
- Before investing heavily in UI, the same controlled visual-hull route should be validated on at least one real phone-captured object with a clean background.

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

### Experiment 11: Controlled Turntable Visual-Hull Mesh

Status: Constrained pass

Input object:

- Stanford Bunny rendered turntable views.
- Full test: 48 images from two elevation rings.
- Reduced app-like test: 12 images from two elevation rings.
- Manifest test: same 12 images described by `poc/input/stanford-bunny/turntable-12-view-manifest.csv`.

Commands:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-turntable-visual-hull.py \
  --image-dir poc/input/stanford-bunny/images \
  --output-dir poc/output/stanford-bunny/reconstruction/turntable-visual-hull \
  --name-prefix stanford-bunny-turntable \
  --resolution 96 \
  --min-consensus 0.90 \
  --mask-threshold 18
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-turntable-visual-hull.py \
  --image-dir poc/input/stanford-bunny/images-12-turntable \
  --output-dir poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views \
  --name-prefix stanford-bunny-12view-turntable \
  --resolution 96 \
  --views-per-elevation 24 \
  --min-consensus 0.90 \
  --mask-threshold 18
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views/stanford-bunny-12view-turntable-visual-hull.obj \
  --output-dir poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views \
  --face-counts 300 600 1200 \
  --name-prefix stanford-bunny-12view-turntable-visual-hull
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-connected-nets.py \
  --input-mesh poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views/stanford-bunny-12view-turntable-visual-hull-faceted-shell-300.obj \
  --output-svg poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views/stanford-bunny-12view-turntable-visual-hull-connected-net-300.svg \
  --target-max-mm 250 \
  --max-faces-per-island 24
```

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-turntable-visual-hull.py \
  --image-dir poc/input/stanford-bunny \
  --view-manifest poc/input/stanford-bunny/turntable-12-view-manifest.csv \
  --output-dir poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views-manifest \
  --name-prefix stanford-bunny-12view-manifest \
  --resolution 96 \
  --min-consensus 0.90 \
  --mask-threshold 18
```

Measured result:

- 48-image visual hull:
  - 23,192 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 6966 vertices and 13,928 faces;
  - watertight mesh;
  - 300-face shell remains watertight;
  - connected net export with 22 islands and 129 glue tabs.
- 12-image visual hull:
  - 24,085 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 7468 vertices and 14,940 faces;
  - watertight mesh;
  - 300 target faces -> 300 faces, 152 vertices, watertight;
  - 600 and 1200 face variants generated but not watertight after simplification;
  - connected net export with 21 islands and 131 glue tabs.
- Manifest-driven 12-image run:
  - same 24,085 occupied voxels out of 884,736 after cleanup;
  - same OBJ mesh size: 7468 vertices and 14,940 faces;
  - watertight mesh;
  - 300 target faces -> 300 faces, 152 vertices, watertight;
  - connected net export with 21 islands and 131 glue tabs.

Interpretation:

- This is the first route that satisfies the raw technical requirement under controlled capture constraints.
- The app should ask for roughly 10 to 15 images from different angles of the same object, ideally against a white or high-contrast background.
- This does not prove arbitrary-photo reconstruction. It proves a guided capture flow can make the problem tractable.
- The 300-face shell is currently the safest paperlamp candidate because it stayed watertight on the 12-image test.
- AI makes sense as an assistant layer for segmentation, background cleanup, rough angle estimation, bad-frame rejection, and semantic hints. It should not be trusted to invent final geometry unless the result still passes silhouette/geometry checks.

### Experiment 12: User-Captured Recognizable Organic Object

Status: Public physical-object benchmark started

Input object:

- THU-MVS Dog RGB dataset.
- 12 selected views from 2 height rings and 6 rotation angles.

Planned output:

- Reconstructed mesh
- Simplified mesh
- Notes on recognizability

Result:

- Downloaded `Dog_RGB.zip` from THU-MVS.
- Created `poc/input/thu-mvs-dog/turntable-12-view-manifest.csv`.
- Added background-color mask mode to handle the blue capture background.
- Visual hull result:
  - 67,302 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 16,462 vertices and 32,936 faces;
  - watertight mesh.
- Faceted shell result:
  - 300 target faces -> 300 faces, 152 vertices, watertight;
  - 600 target faces -> 600 faces, 302 vertices, watertight.
- Connected net result:
  - 300 faces;
  - 25 islands;
  - 144 glue tabs;
  - page height: 855 mm.
- Visual read: recognizable as a long animal/figurine volume, but blockier and less characterful than the Bunny. Good proof that the pipeline transfers to a real public physical-object image set.

### Experiment 13: Washington RGB-D Masked Household Object

Status: Technical pass, weak recognizability

Input object:

- Washington RGB-D Object Dataset, `coffee_mug_1`.
- 12 selected views from two turntable sequences.
- Dataset-provided segmentation masks used through the manifest `mask` column.

Result:

- Downloaded `coffee_mug_1.tar`.
- Created `poc/input/washington-rgbd-coffee-mug-1/turntable-12-view-manifest.csv`.
- Added optional `mask` column support to `build-turntable-visual-hull.py`.
- Visual hull result:
  - 761 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 708 vertices and 1412 faces;
  - watertight mesh.
- Faceted shell result:
  - 150 target faces -> 150 faces, 77 vertices, watertight;
  - 300 target faces -> 300 faces, 152 vertices, watertight.
- Connected net result:
  - 150 faces;
  - 10 islands;
  - 61 glue tabs;
  - page height: 850 mm.
- Visual read: the pipeline technically works on a cluttered real household-object dataset when masks are available, but the mug shape is weak. The handle/concavity is mostly lost, which is expected for visual hulls and small object silhouettes.

### Experiment 14: Washington RGB-D Solid Household Object

Status: Technical pass, better shape fit than mug

Input object:

- Washington RGB-D Object Dataset, `bell_pepper_1`.
- 12 selected views from two turntable sequences.
- Dataset-provided segmentation masks used through the manifest `mask` column.

Result:

- Downloaded `bell_pepper_1.tar`.
- Created `poc/input/washington-rgbd-bell-pepper-1/turntable-12-view-manifest.csv`.
- Visual hull result:
  - 466 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 488 vertices and 972 faces;
  - watertight mesh.
- Faceted shell result:
  - 100 target faces -> 100 faces, 52 vertices, watertight;
  - 200 target faces -> 200 faces, 102 vertices, watertight.
- Connected net result:
  - 100 faces;
  - 8 islands;
  - 43 glue tabs;
  - page height: 855 mm.
- Visual read: recognizability is better than the mug because the bell pepper is a solid silhouette-driven object. The result confirms that early product capture should prefer solid organic shapes and avoid handles, holes, loops, thin parts, and deep concavities.

### Experiment 15: Mask-Based Crop Normalization

Status: Pass as preprocessing improvement

Goal:

- Simulate the first useful AI-assisted preprocessing step: produce clean object masks, crop tightly around the foreground object, normalize scale, and feed the normalized masks into the geometry-first visual-hull pipeline.

Implementation:

- Added `--normalize-mask-crop` to `build-turntable-visual-hull.py`.
- Added `--crop-padding` to control foreground padding before square resize.
- The operation uses masks only, so it works with dataset masks now and can later work with AI-generated masks from user photos.

Bell Pepper result:

- Command used `--normalize-mask-crop --crop-padding 0.25`.
- Visual hull:
  - 103,542 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 17,635 vertices and 35,270 faces;
  - watertight mesh.
- Faceted shell:
  - 200 target faces -> 200 faces, 102 vertices, watertight;
  - 400 target faces -> 400 faces, 202 vertices, watertight;
  - 800 target faces -> 800 faces, 402 vertices, watertight.
- Connected net:
  - 200 faces;
  - 12 islands;
  - 82 glue tabs;
  - page height: 777 mm.

Coffee Mug result:

- Command used `--normalize-mask-crop --crop-padding 0.25`.
- Visual hull:
  - 87,498 occupied voxels out of 884,736 after cleanup;
  - OBJ mesh with 17,767 vertices and 35,546 faces;
  - watertight mesh.
- Faceted shell:
  - 200 target faces -> 200 faces, 100 vertices, watertight;
  - 400 target faces -> 400 faces, 200 vertices, watertight.
- Connected net:
  - 200 faces;
  - 13 islands;
  - 84 glue tabs;
  - page height: 940 mm.

Interpretation:

- Crop normalization materially improves scale/detail for objects that occupy a small portion of the camera frame.
- It is a direct bridge to AI-assisted masking: AI can provide the masks; this deterministic step normalizes them before geometry.
- It helps the mug handle silhouette, but it does not remove the fundamental visual-hull weakness around concavities and holes.

### Experiment 16: Printable Plane Strategy

Status: Not started

Planned strategies:

1. Vertical or radial contour slices.
2. Horizontal contour slices.
3. Optional interlocking slots.
4. Optional unfolded surface pieces.

Result:

- TBD

### Experiment 17: Physical Or Rendered Validation

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
- Public benchmark success may not transfer directly to casual phone photos; the app should constrain capture instead of accepting arbitrary uploads.
- Image-conditioned mesh APIs may hallucinate shape detail. A text prompt can help semantic features, but it cannot replace geometric evidence.
- AI segmentation or capture guidance could improve the visual-hull route, but AI-generated geometry can drift away from the user's actual object.
- Visual hull is weak for handles, holes, loops, thin parts, and concavities. The product should initially guide users toward solid silhouette-driven objects.

## Next Actions

1. Promote controlled turntable visual hull as the primary non-Tripo image-to-mesh route.
2. Test THU-MVS Cat/Dog next as the best public physical-object benchmark: turntable-like capture, recognizable animal figurines, and enough views to subset to 10 to 15 inputs.
3. Use Washington RGB-D as the next generalization benchmark after THU-MVS.
4. Keep BigBIRD as a later mask/turntable stress test.
5. Test the same route on one real phone-captured object with 10 to 15 images and a clean background.
6. Improve capture guidance assumptions: object centered, same distance, full 360-degree coverage, high contrast background, minimal shadows.
7. Prototype AI-assisted masks or capture quality checks only after the real-capture baseline is measured.
8. Improve connected-net page layout, fold/cut styling, and assembly order after the real-capture test.
9. Keep COLMAP in the pipeline only as a diagnostic/camera-recovery baseline for now.
