# Tool Test Matrix

## Current Status

Phase 1 has started. No tool has passed the end-to-end proof yet, but COLMAP now has a working calibrated same-object sparse reconstruction baseline.

Initial local availability check:

- `colmap`: available in Conda environment `paperlamp-poc`
- `blender`: missing
- `meshroom_batch`: missing
- `aliceVision_cameraInit`: missing
- `meshlabserver`: missing
- `openscad`: missing
- `brew`: missing
- `conda`: available at `/opt/anaconda3/bin/conda`
- POC Python: available at `/opt/anaconda3/envs/paperlamp-poc/bin/python`
- Python packages found in `paperlamp-poc`: `pycolmap`, `trimesh`, `shapely`, `numpy`, `scikit-image`, `scipy`, `matplotlib`
- `open3d`: installed during setup, failed import due to a TBB/Embree dynamic library mismatch, and was removed because it is not required for the first proof
- Bundled test data in installed Python libraries was checked and did not include a useful same-object multi-view object dataset for this POC.

## Evaluation Checklist

Each tool or pipeline must be evaluated against the same checklist:

- Can it process our input photos?
- Does it produce a downloadable 3D mesh?
- Is the mesh clean enough to simplify?
- Can the mesh be converted into 2D printable parts?
- How much manual cleanup is required?
- Is the result recognizable?
- Could this process later be automated?
- What are the licensing, cost, and runtime constraints?

## Reconstruction Tools

| Tool | Local availability | Input tested | Mesh output | Automation path | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| COLMAP | Installed in `paperlamp-poc` | Tiny NeRF Lego, Middlebury DinoRing | Sparse reconstruction only so far | CLI | Partial pass | Tiny NeRF failed to produce useful sparse geometry. Calibrated DinoRing produced two sparse models covering 47 of 48 images. Dense stereo failed locally because this COLMAP build requires CUDA. |
| Meshroom / AliceVision | Missing | Not tested | Not tested | CLI/GUI mixed | Blocked until installed | Useful comparison if available. |
| Cloud/API image-to-3D | Unknown | Not tested | Not tested | API-dependent | Not started | Only useful if it returns downloadable meshes. |

## Mesh Cleanup And 2D Conversion Tools

| Tool | Local availability | Mesh tested | 2D output | Automation path | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Blender Python | Missing | Not tested | Not tested | Scriptable | Deferred | We will first try `trimesh` + `shapely` for slicing before adding Blender. |
| Papercraft unfold tool | Custom first-pass exporter | Faceted Dino and Bunny shells tested through custom exporter | Raw labeled triangle SVG and connected net SVG | Custom Python | Partial pass | Exported isolated labeled triangles and a first Bunny connected net with glue tabs. Needs page layout, fold styling, and assembly validation. |
| Custom lamp-plane script | Implemented as first visual-hull/rib prototype | Middlebury DinoRing | SVG rib sheet plus 3D rib render | Fully scriptable | Partial pass | Produced a rough visual hull, 12-rib SVG, and 20-rib orthogonal assembly render. Shape is still too noisy for a phase pass. |

## Tool Test Log

### 2026-06-15: Phase 1 Setup

- Created the POC workspace.
- Created this tool matrix.
- Checked local availability of COLMAP, Meshroom/AliceVision, Blender, and supporting mesh tools.
- Result: core geometry tools were not installed locally yet.
- Installed `paperlamp-poc` Conda environment from conda-forge.
- Verified COLMAP 3.11.1 runs.
- Verified `pycolmap`, `trimesh`, `shapely`, `numpy`, `scikit-image`, `scipy`, and `matplotlib` import successfully.
- Open3D was removed after a failed import caused by a TBB/Embree dynamic library mismatch.
- Checked installed Python library datasets for same-object multi-view object images; none were useful for this proof.
- Next step became sourcing a controlled public same-object image set.

### 2026-06-15: Same-Object Dataset Search

- Found Tiny NeRF Lego, a small synthetic same-object dataset with 106 RGB views at 100x100.
- Extracted the Tiny NeRF views into `poc/input/synthetic-lego-nerf/images/`.
- Result: COLMAP feature extraction and matching ran, but the mapper failed to find a useful initial pair. The dataset is useful as a negative/sanity case, not as the main benchmark.
- Found Middlebury DinoRing, a real same-object multi-view dataset with 48 calibrated views of a matte ceramic dinosaur.
- Downloaded DinoRing locally and copied its 48 images into `poc/input/middlebury-dino-ring/images/`.

### 2026-06-15: COLMAP Reconstruction Tests

- `run-colmap-auto.sh` / COLMAP `automatic_reconstructor` crashed in the headless macOS session because it touched Qt/screen services.
- Added `run-colmap-sparse.sh` to run feature extraction, exhaustive matching, and sparse mapping through command-line COLMAP without the automatic wrapper.
- Uncalibrated DinoRing run produced a small partial sparse model:
  - 3 registered images;
  - 162 sparse points;
  - 394 observations;
  - 0.500495 px mean reprojection error.
- Calibrated DinoRing run used the provided `PINHOLE` intrinsics: `3310.4,3325.5,316.73,200.55`.
- Calibrated DinoRing model 0:
  - 23 registered images;
  - 704 sparse points;
  - 4804 observations;
  - 0.725452 px mean reprojection error.
- Calibrated DinoRing model 1:
  - 24 registered images;
  - 511 sparse points;
  - 3309 observations;
  - 0.807898 px mean reprojection error.
- Conclusion: COLMAP is viable as the first reconstruction baseline when calibrated same-object images are available. The next test is dense geometry or silhouette-derived visual hull creation.

### 2026-06-15: Dense And Visual-Hull Tests

- COLMAP `image_undistorter` worked on calibrated DinoRing model 0 and wrote an undistorted dense workspace.
- COLMAP `patch_match_stereo` failed because the installed COLMAP build requires CUDA for dense stereo on this machine.
- Added `build-visual-hull.py` to test a silhouette-derived route using the DinoRing camera calibration and good-silhouette image list.
- Visual-hull result at 64^3 resolution:
  - 78,721 occupied voxels out of 262,144 after cleanup;
  - OBJ mesh with 20,738 vertices and 41,564 faces;
  - mesh is not watertight yet;
  - generated a 12-rib SVG sheet.
- Added `render-rib-assembly.py` to generate a 20-rib orthogonal assembly OBJ and multi-view PNG render from the voxel hull.
- A stricter temporary visual-hull test with `--min-consensus 1.0` reduced occupancy to 57,436 voxels, but did not fix recognizability enough to replace the baseline.
- Conclusion: the silhouette path produced the first raw image-to-plane and image-to-rib-render artifacts. It is still a rough prototype, but it avoids the local CUDA blocker.

### 2026-06-15: Faceted Shell Template Tests

- Installed `fast-simplification` so `trimesh.simplify_quadric_decimation` can produce low-poly shell variants.
- Added `render-faceted-shell.py` to generate and render low-poly faceted shells.
- Tested target face counts:
  - 300 faces -> 149 vertices, not watertight after simplification;
  - 800 faces -> 400 vertices, not watertight after simplification;
  - 1600 faces -> 796 vertices, not watertight after simplification.
- Added `export-faceted-template.py` to export a raw labeled triangle SVG from a low-poly shell.
- Generated `dino-faceted-shell-300-template.svg` from the 300-face shell.
- Conclusion: faceted shell output is visually closer to the intended paperlamp-kit direction than rib lattices, but the current visual hull still needs better shape fidelity and the template needs connected nets and tabs.

### 2026-06-15: Better Controlled Object Search

- Rejected CO3D as the immediate next object source because even the small subset is too large for this short sprint.
- Added Stanford Bunny as a better controlled animal benchmark from the Stanford 3D Scanning Repository.
- Downloaded the small Bunny archive and selected `bun_zipper_res3.ply` as the primary mesh.
- Added an object metadata sidecar describing preserved features:
  - long upright ears;
  - compact rabbit body;
  - head;
  - feet;
  - seated posture.
- Rendered 48 synthetic same-object Bunny views from the mesh.
- Generated Bunny faceted shell variants:
  - 150 target faces -> 150 faces, 78 vertices, not watertight;
  - 300 target faces -> 299 faces, 153 vertices, not watertight;
  - 600 target faces -> 600 faces, 306 vertices, not watertight;
  - 1200 target faces -> 1200 faces, 601 vertices, not watertight.
- Generated `stanford-bunny-faceted-shell-300-template.svg` from the 300-face shell.
- Conclusion: Bunny is a much better controlled shape-fidelity benchmark than Dino. The faceted-shell path can preserve a recognizable animal when the source shape is clean enough.

### 2026-06-15: Connected Net Export Test

- Added `export-connected-nets.py` to unfold a triangular mesh into connected net islands.
- The first approach is greedy and conservative:
  - grow connected face islands through mesh adjacency;
  - reject overlaps;
  - limit island size;
  - add one glue tab per shared cut edge;
  - label matching cut edges.
- Tested on the 300-face Stanford Bunny shell.
- Result:
  - 299 mesh faces;
  - 22 connected islands;
  - island size range: 1 to 24 faces;
  - 116 glue tabs;
  - SVG page height: about 720 mm.
- Conclusion: this is the first artifact that looks structurally like a paper kit rather than a pile of unrelated triangles. It still needs better unfolding, page layout, fold/cut styling, and assembly validation.
