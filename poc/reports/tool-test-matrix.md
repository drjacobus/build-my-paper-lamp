# Tool Test Matrix

## Current Status

Phase 1A now has a constrained pass: controlled turntable visual hull can convert 12 clean same-object images into a watertight mesh, a low-poly faceted shell, and a connected SVG net with glue tabs. COLMAP remains useful as a diagnostic/camera-recovery baseline, but its current local result is sparse/partial and not satisfying enough as the product's image-to-3D source.

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
| COLMAP | Installed in `paperlamp-poc` | Tiny NeRF Lego, Middlebury DinoRing, Stanford Bunny rendered views | Sparse reconstruction plus failed sparse mesh attempt | CLI | Diagnostic only for now | Tiny NeRF failed to produce useful sparse geometry. Calibrated DinoRing produced two sparse models covering 47 of 48 images. Bunny rendered views improved to 43/48 registered images and 2139 sparse points with fixed intrinsics plus relaxed mapper settings. Sparse Delaunay meshing produced an unusable spike-like mesh; Poisson failed because sparse PLY lacks normals. Dense stereo failed locally because this COLMAP build requires CUDA. |
| Controlled turntable visual hull | Implemented as `build-turntable-visual-hull.py` | Stanford Bunny rendered turntable views, including a 12-image subset | Watertight OBJ mesh | Fully scriptable | Constrained Phase 1A pass | Assumes same object, centered capture, clean/white background, and known or estimated turntable angles. The 12-image subset produced a watertight mesh, a watertight 300-face shell, and a connected SVG net. CSV manifest input now supports arbitrary app-style image filenames plus azimuth/elevation. This is the current non-Tripo solution path. |
| Meshroom / AliceVision | Missing | Not tested | Not tested | CLI/GUI mixed | Blocked until installed | Useful comparison if available. |
| Cloud/API image-to-3D | Existing repo client stub for Tripo; Tripo rejected after prior user trial | Not tested further in current POC | Not tested | API-dependent | Deferred | Only useful if it returns downloadable meshes and beats the controlled visual-hull baseline. Text descriptions may help semantic shape, but outputs must be checked for hallucinated geometry. |
| AI-assisted capture/masking | Not implemented yet | Not tested | N/A | API/model-dependent | Candidate assistant, not core geometry | Useful roles: segmentation masks, background cleanup, angle estimation, bad-frame rejection, capture guidance, and semantic hints such as preserving dinosaur spikes. Risk: hallucinated geometry if AI-generated meshes are trusted directly. |

## Mesh Cleanup And 2D Conversion Tools

| Tool | Local availability | Mesh tested | 2D output | Automation path | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Blender Python | Missing | Not tested | Not tested | Scriptable | Deferred | We will first try `trimesh` + `shapely` for slicing before adding Blender. |
| Papercraft unfold tool | Custom first-pass exporter | Faceted Dino and Bunny shells tested through custom exporter | Raw labeled triangle SVG and connected net SVG | Custom Python | Partial pass | Exported isolated labeled triangles and a first Bunny connected net with glue tabs. Needs page layout, fold styling, and assembly validation. |
| Custom lamp-plane script | Implemented as first visual-hull/rib prototype | Middlebury DinoRing and Stanford Bunny | SVG rib sheet, 3D rib render, faceted shell, connected net | Fully scriptable | Pass under controlled capture for faceted shell path | Dino rib output was too noisy. Bunny controlled turntable visual hull produced a usable mesh-to-net route. |
| Point-cloud preview renderer | Implemented | Stanford Bunny COLMAP sparse point cloud | PNG diagnostic render | Custom Python | Pass as diagnostic only | Confirms sparse reconstructions can be visually inspected quickly, but does not create printable geometry. |

## Tool Test Log

### 2026-06-16: Next Public Test Dataset Selection

- Ranked the next public datasets for controlled visual-hull testing:
  - THU-MVS Cat/Dog: selected first because it is narrow, turntable-like, physical, and animal-shaped.
  - Washington RGB-D Object Dataset: selected second for broader household-object generalization.
  - BigBIRD: selected third as a later turntable/mask stress test.
- Deferred CO3D, Objectron, YCB/T-LESS BOP, DTU, and HILO for now because they are broader, larger, more cluttered, less isolated, or less directly aligned with the immediate paperlamp proof.
- Next test target: download THU-MVS Cat or Dog, create a 10 to 15 view manifest, run visual hull, then generate a 300-face shell and connected net.
- Started the THU-MVS Dog test:
  - downloaded `Dog_RGB.zip`;
  - created `poc/input/thu-mvs-dog/turntable-12-view-manifest.csv`;
  - added background-color masking for blue-background images;
  - 12-view visual hull produced a watertight mesh with 16,462 vertices and 32,936 faces;
  - 300-face and 600-face shells both stayed watertight;
  - connected 300-face net produced 25 islands and 144 glue tabs.
- Started the Washington RGB-D Coffee Mug 1 test:
  - downloaded `coffee_mug_1.tar`;
  - created `poc/input/washington-rgbd-coffee-mug-1/turntable-12-view-manifest.csv`;
  - added optional manifest mask support and used the dataset's provided segmentation masks;
  - 12-view masked visual hull produced a watertight mesh with 708 vertices and 1412 faces;
  - 150-face and 300-face shells both stayed watertight;
  - connected 150-face net produced 10 islands and 61 glue tabs;
  - visual read: technical pass, but weak recognizability because the mug handle/concavity is mostly lost.
- Started the Washington RGB-D Bell Pepper 1 test:
  - downloaded `bell_pepper_1.tar`;
  - created `poc/input/washington-rgbd-bell-pepper-1/turntable-12-view-manifest.csv`;
  - used the dataset's provided segmentation masks;
  - 12-view masked visual hull produced a watertight mesh with 488 vertices and 972 faces;
  - 100-face and 200-face shells both stayed watertight;
  - connected 100-face net produced 8 islands and 43 glue tabs;
  - visual read: better than the mug and confirms solid silhouette-driven objects are the right first target class.
- Added mask-based crop normalization:
  - Bell Pepper crop-normalized visual hull produced a watertight mesh with 17,635 vertices and 35,270 faces;
  - Bell Pepper 200, 400, and 800-face shells stayed watertight;
  - Bell Pepper connected 200-face net produced 12 islands and 82 glue tabs;
  - Coffee Mug crop-normalized visual hull produced a watertight mesh with 17,767 vertices and 35,546 faces;
  - Coffee Mug 200 and 400-face shells stayed watertight;
  - visual read: crop normalization improves object scale/detail and helps the mug handle silhouette, but concavity remains a core visual-hull limitation.
- Started the first real user-photo test on a Jagermeister bottle:
  - converted 19 HEIC phone photos to 1200px PNG proxies through macOS Quick Look;
  - selected the first 10 upright views as the most turntable-like subset;
  - added `make-simple-foreground-masks.py` as a non-AI fallback mask generator;
  - 10-view visual hull produced a watertight mesh with 17,139 vertices and 34,318 faces;
  - 200 and 400-face shells stayed watertight;
  - connected 200-face net produced 15 islands and 93 glue tabs;
  - visual read: shape failed because the heuristic masks over-smoothed the bottle and missed neck/cap detail. This confirms the next real-photo step should be true AI segmentation or cleaner capture backgrounds.

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

### 2026-06-15: Bunny Image-To-3D Diagnostic

- Ran COLMAP sparse reconstruction on the 48 rendered Stanford Bunny views.
- Uncalibrated result:
  - 27 registered images;
  - 501 sparse points;
  - 2287 observations;
  - 0.871273 px mean reprojection error.
- Re-ran with fixed `SIMPLE_PINHOLE` camera parameters `960,400,400`.
- Fixed-camera result:
  - 39 registered images;
  - 1054 sparse points;
  - 4987 observations;
  - 0.971214 px mean reprojection error.
- Exported and rendered the calibrated sparse point cloud to `sparse-bunny-calibrated-preview.png`.
- Tuned the mapper with relaxed thresholds:
  - `--Mapper.min_num_matches 6`;
  - `--Mapper.init_min_num_inliers 30`;
  - `--Mapper.abs_pose_min_num_inliers 15`;
  - `--Mapper.tri_ignore_two_view_tracks false`;
  - `--Mapper.multiple_models false`.
- Tuned fixed-camera result:
  - 43 registered images;
  - 2139 sparse points;
  - 7258 observations;
  - 0.826889 px mean reprojection error.
- Exported and rendered the tuned sparse point cloud to `sparse-bunny-tuned-preview.png`.
- Ran COLMAP sparse-input Delaunay meshing on the tuned sparse model.
- Delaunay output:
  - 995 vertices;
  - 1978 faces;
  - not watertight;
  - 4 connected components.
- Rendered Delaunay faceted variants. Visual result is a long spike-like artifact, not a recognizable Bunny.
- Ran COLMAP Poisson meshing on the tuned sparse PLY. It failed because the sparse PLY has no normal field such as `nx`.
- Conclusion: tuned COLMAP improves sparse camera/point recovery, but local COLMAP does not currently produce a satisfying mesh for this product. Treat it as a diagnostic/camera-recovery tool and move Phase 1A to the next image-to-mesh candidate.

### 2026-06-16: Controlled Turntable Visual-Hull Pass

- Added `build-turntable-visual-hull.py` for controlled same-object captures where the object is centered, the background is clean, and image angles are known or estimated.
- Tested the full 48-view Stanford Bunny rendered capture:
  - 48 input images;
  - watertight OBJ mesh with 6966 vertices and 13,928 faces;
  - 300-face shell remains watertight;
  - connected net export with 22 islands and 129 glue tabs.
- Tested a reduced input matching the intended app capture rule:
  - 12 input images from two elevation rings;
  - watertight OBJ mesh with 7468 vertices and 14,940 faces;
  - 300-face shell remains watertight;
  - connected net export with 21 islands and 131 glue tabs.
- Added CSV manifest input for app-style captures. The manifest-driven 12-image run matched the previous result exactly and produced the same watertight mesh, 300-face watertight shell, and connected net.
- Conclusion: this is the first non-Tripo route that meets the raw technical requirement under explicit capture constraints: controlled images in, mesh out, faceted shell out, connected printable SVG net out.
