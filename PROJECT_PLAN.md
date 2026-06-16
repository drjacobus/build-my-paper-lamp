# Build My Paper Lamp - Project Plan

## Project Goal

Build a system that turns several input photos of an object into printable 2D paper or card planes that can be cut, folded, slotted, or glued into a recognizable 3D object inspired by the original image.

The project must prove the technical pipeline before investing in UI, branding, automation, hosting, or marketing.

The intended product direction is a DIY paper lamp kit: a recognizable faceted paper object assembled from pre-cut or printable 2D parts, similar in category and quality bar to commercial animal paperlamp kits. The project should not copy any specific existing design.

## Guiding Principle

The first milestone is not an app. The first milestone is proof that the core transformation works:

> Input photos -> 3D reconstruction -> simplified geometry -> printable 2D planes -> recognizable assembled object.

If this cannot be proven with raw tools and scripts, adding a polished interface will only hide the uncertainty. Phase 1 is therefore a lab-style proof of concept with no UI and no product logic.

## Phase 1: Raw Technical Proof Of Concept

### Current Status

Status as of 2026-06-16: **Phase 1A constrained pass for guided turntable capture**

What exists now:

- POC workspace created under `poc/`.
- Report template created at `poc/reports/poc-report.md`.
- Tool matrix created at `poc/reports/tool-test-matrix.md`.
- Repeatable local tool check created at `poc/scripts/check-tools.sh`.
- POC Conda environment created as `paperlamp-poc`.
- Reproducible environment file created at `poc/environment.yml`.
- COLMAP automatic reconstruction wrapper created at `poc/scripts/run-colmap-auto.sh`.
- COLMAP headless sparse reconstruction wrapper created at `poc/scripts/run-colmap-sparse.sh`.
- Silhouette visual-hull and rib SVG script created at `poc/scripts/build-visual-hull.py`.
- Orthogonal rib assembly render script created at `poc/scripts/render-rib-assembly.py`.
- Low-poly faceted shell render script created at `poc/scripts/render-faceted-shell.py`.
- Raw faceted triangle template exporter created at `poc/scripts/export-faceted-template.py`.
- Connected net exporter with simple glue tabs created at `poc/scripts/export-connected-nets.py`.
- Mesh view renderer created at `poc/scripts/render-mesh-views.py`.
- Sparse point-cloud preview renderer created at `poc/scripts/render-point-cloud.py`.
- Controlled turntable visual-hull mesh script created at `poc/scripts/build-turntable-visual-hull.py`.
- Same-object dataset source notes added for Tiny NeRF Lego, Middlebury DinoRing, and Stanford Bunny.
- Middlebury DinoRing output folder added under `poc/output/middlebury-dino-ring/`.
- Stanford Bunny output folder added under `poc/output/stanford-bunny/`.

Initial findings:

- COLMAP 3.11.1 is installed and verified in `paperlamp-poc`.
- Blender is not installed locally.
- Meshroom/AliceVision is not installed locally.
- MeshLab server is not installed locally.
- OpenSCAD is not installed locally.
- Conda is available.
- POC Python is available at `/opt/anaconda3/envs/paperlamp-poc/bin/python`.
- pycolmap 3.11.1 is installed and verified.
- trimesh, shapely, NumPy, scikit-image, SciPy, and Matplotlib are installed and verified.
- Open3D was tried, failed import due to a TBB/Embree dynamic library mismatch, and was removed.
- Installed Python libraries were checked for bundled same-object multi-view object test datasets; no useful candidate was found.
- Tiny NeRF Lego provides 106 same-object synthetic views, but the 100x100 images did not produce a useful COLMAP sparse model.
- Middlebury DinoRing provides 48 real calibrated same-object views of a matte ceramic dinosaur.
- COLMAP automatic reconstruction crashed in the headless macOS session because it touched Qt/screen services.
- Manual COLMAP CLI feature extraction and matching works.
- Uncalibrated DinoRing COLMAP produced only a small partial model: 3 registered images and 162 sparse points.
- Calibrated DinoRing COLMAP produced two sparse models covering 47 of 48 images:
  - model 0: 23 registered images, 704 sparse points, 0.725452 px mean reprojection error;
  - model 1: 24 registered images, 511 sparse points, 0.807898 px mean reprojection error.
- COLMAP image undistortion worked for the calibrated DinoRing model 0.
- COLMAP dense stereo failed locally because this COLMAP build requires CUDA for dense reconstruction.
- DinoRing silhouette visual hull at 64^3 generated:
  - 78,721 occupied voxels out of 262,144 after cleanup;
  - rough OBJ mesh with 20,738 vertices and 41,564 faces;
  - first 12-rib SVG sheet at `poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-ribs.svg`.
- A 20-rib orthogonal assembly render was generated from the voxel hull:
  - 10 ribs along the x-axis;
  - 10 ribs along the y-axis;
  - render output at `poc/output/middlebury-dino-ring/renders/dino-rib-assembly-views.png`.
- The rendered rib assembly forms a 3D volume, but it is still too noisy and weakly recognizable compared with the source dinosaur.
- Installed `fast-simplification` to support low-poly shell decimation through `trimesh`.
- Low-poly faceted shell variants were generated at 300, 800, and 1600 target faces.
- The faceted shell reads closer to the paperlamp-kit goal than the rib lattice, but the underlying visual hull remains too noisy.
- A raw 300-face triangle SVG template with face and edge labels was generated at `poc/output/middlebury-dino-ring/printable-planes/dino-faceted-shell-300-template.svg`.
- Stanford Bunny was added as the next controlled animal benchmark.
- A metadata sidecar was added for the Bunny object, describing the expected rabbit features to preserve.
- 48 synthetic same-object Bunny views were rendered from the scan-derived mesh.
- Bunny low-poly faceted shell variants were generated at 150, 300, 600, and 1200 target faces.
- The Bunny shell is substantially more recognizable than the Dino shell, especially from ear/body silhouette.
- A raw 299-face Bunny triangle SVG template was generated at `poc/output/stanford-bunny/printable-planes/stanford-bunny-faceted-shell-300-template.svg`.
- A connected Bunny net SVG was generated at `poc/output/stanford-bunny/printable-planes/stanford-bunny-connected-net-300.svg`.
- The first connected net result contains 22 connected islands, 299 faces, and 116 glue tabs.
- Bunny rendered-image COLMAP sparse reconstruction was tested:
  - uncalibrated run: 27 of 48 registered images, 501 sparse points, 0.871273 px mean reprojection error;
  - fixed `SIMPLE_PINHOLE` run: 39 of 48 registered images, 1054 sparse points, 0.971214 px mean reprojection error.
- A tuned fixed-camera COLMAP mapper run improved the Bunny sparse result to 43 of 48 registered images, 2139 sparse points, and 0.826889 px mean reprojection error.
- The calibrated Bunny sparse point cloud visually hints at ears/body silhouette, but remains far from a usable mesh.
- COLMAP sparse-input Delaunay meshing produced a mesh, but the rendered result is a stretched spike-like artifact and not a recognizable Bunny.
- COLMAP Poisson meshing failed on the sparse PLY because the export has no normal fields such as `nx`.
- Tripo/TripoSR route was not pursued after user feedback that Tripo output had already been tried and was not good.
- Local Docker is not installed, so containerized Meshroom/OpenMVS is not available on this machine.
- Conda-forge package checks found no `openmvs`, `openmvg`, `alicevision`, or `meshroom` package for the local macOS arm64 setup.
- Controlled turntable visual hull was tested on the 48 Bunny rendered images and produced:
  - watertight OBJ mesh with 6966 vertices and 13,928 faces;
  - low-poly shell variants at 300, 600, and 1200 faces;
  - 300-face shell remains watertight;
  - connected net export with 22 islands and 129 glue tabs.
- A reduced 12-image turntable subset was tested to match the intended app constraint of roughly 10 to 15 clean object images from different angles:
  - 12 input images from two elevation rings;
  - watertight OBJ mesh with 7468 vertices and 14,940 faces;
  - 300-face faceted shell remains watertight;
  - connected net export with 21 islands and 131 glue tabs.
- Manifest-based turntable input was added so future app-style captures can provide arbitrary image filenames plus approximate `azimuth` and `elevation` values.
- THU-MVS Dog was started as the next public physical-object benchmark:
  - 12 selected RGB images from 2 height rings;
  - background-color masking added for non-white backgrounds;
  - watertight visual-hull mesh with 16,462 vertices and 32,936 faces;
  - 300-face and 600-face shells both watertight;
  - connected 300-face SVG net with 25 islands and 144 glue tabs.
- Washington RGB-D Coffee Mug 1 was started as the next generalization benchmark:
  - 12 selected masked RGB images from 2 turntable sequences;
  - manifest `mask` column support added;
  - watertight visual-hull mesh with 708 vertices and 1412 faces;
  - 150-face and 300-face shells both watertight;
  - connected 150-face SVG net with 10 islands and 61 glue tabs;
  - visual recognizability is weak because the mug handle/concavity is mostly lost.
- Washington RGB-D Bell Pepper 1 was tested as a solid-object follow-up:
  - 12 selected masked RGB images from 2 turntable sequences;
  - watertight visual-hull mesh with 488 vertices and 972 faces;
  - 100-face and 200-face shells both watertight;
  - connected 100-face SVG net with 8 islands and 43 glue tabs;
  - visual recognizability is better than the mug because the object is solid and silhouette-driven.
- Mask-based crop normalization was added as the first AI-assist-compatible preprocessing step:
  - it crops each mask around the foreground object, pads it to a square, and scales it back to the working frame;
  - Washington Bell Pepper crop-normalized visual hull produced 17,635 vertices and 35,270 faces, watertight;
  - 200, 400, and 800-face Bell Pepper shells all stayed watertight;
  - connected 200-face Bell Pepper net produced 12 islands and 82 glue tabs;
  - Washington Coffee Mug crop-normalized visual hull produced 17,767 vertices and 35,546 faces, watertight;
  - 200 and 400-face Coffee Mug shells stayed watertight, and the handle silhouette improved.
- First real user-photo test was run on a Jagermeister bottle:
  - 19 HEIC phone photos were converted to 1200px PNG proxies;
  - first 10 upright views were selected as the closest turntable-like subset;
  - a simple foreground-mask fallback script was added;
  - visual hull produced a watertight mesh with 17,139 vertices and 34,318 faces;
  - 200 and 400-face shells stayed watertight;
  - connected 200-face net produced 15 islands and 93 glue tabs;
  - visual shape failed because the heuristic masks did not reliably capture the bottle neck/cap and over-smoothed the silhouette.

Current conclusion:

- We have a working sparse reconstruction baseline, a first rough silhouette-derived rib SVG, a rendered orthogonal rib assembly, low-poly faceted shell variants, a raw labeled triangle template, and connected nets with glue tabs.
- The faceted shell path is closer to the target paperlamp kit than the rib path.
- Bunny shows that a cleaner, clearer animal source can preserve recognizable shape through low-poly faceting.
- The 12-image guided turntable test satisfies the raw Phase 1A requirement under explicit capture constraints: same object, centered, clean/white background, known or estimated angles, and enough silhouette coverage.
- The remaining blocker is no longer "can 10 to 15 controlled images become a mesh and printable net"; it is "can real user phone images meet those capture constraints reliably enough."
- COLMAP can recover partial sparse Bunny geometry from rendered images, especially with fixed camera assumptions and relaxed mapper thresholds, but this is not enough by itself because the product needs a usable mesh, not just camera poses and sparse points.
- Local COLMAP should now be treated as a diagnostic/camera-recovery baseline, not a satisfying Phase 1A image-to-mesh solution.
- The first viable non-Tripo solution is controlled capture plus silhouette visual hull. It is not arbitrary photo reconstruction, but it gives a practical product constraint: guide the user to capture the object like a turntable scan on a clean background.
- AI should be treated as an assistant to this geometry-first route, not as the primary source of truth. Good candidate uses are object masking, background cleanup, crop normalization, capture quality checks, rough angle estimation, and optional semantic hints; generated mesh details must still be checked against the input silhouettes.
- The first robust mesh-to-plane conversion may be possible with `trimesh`, `shapely`, scikit-image, and image silhouettes; Blender remains deferred unless the Python stack is insufficient.
- Object choice matters: solid silhouette-driven forms are good early targets; handles, holes, loops, thin parts, and concavities are weak targets for visual hull and should be filtered out or handled by a later method.
- Real phone photos need robust AI segmentation or much stronger capture constraints. Simple color/brightness masking is not reliable for glossy dark objects in cluttered backgrounds.

Next action:

1. Promote controlled turntable visual hull to the primary Phase 1A solution path.
2. Define the app capture requirement around 10 to 15 clean same-object images from different angles, preferably on a white or high-contrast background.
3. Test the next public physical-object benchmark in this order:
   - THU-MVS Cat/Dog first, because it is the closest match: turntable-like physical figurines with many views and recognizable animal shapes.
   - Washington RGB-D Object Dataset second, because it offers many centered household objects and turntable videos for generalization.
   - BigBIRD third, because it has turntable positions and masks but less paperlamp-like grocery/product objects.
4. Validate the route on a real captured object with phone images, clean background, and turntable-style coverage.
5. Add AI assistance only where it improves the geometry-first pipeline: better masks, bad-frame rejection, angle estimation, and capture guidance.
6. Favor the faceted-shell paperlamp path over rib-only construction unless future evidence says otherwise.
7. Only research non-Tripo image-to-3D APIs or models if they return downloadable meshes and can beat the controlled visual-hull baseline.

### Goal

Prove that a small set of object photos can become printable 2D parts that assemble into a recognizable 3D form.

### Explicitly Out Of Scope

- No landing page
- No camera UI
- No upload flow
- No accounts
- No payments
- No Vercel deployment
- No polished frontend
- No mobile browser flow
- No automated user journey

Phase 1 should use folders, scripts, command-line tools, generated files, manual inspection, and physical or rendered validation.

### Test Inputs

Use 3 to 5 controlled test objects:

1. A simple matte object, such as a mug, vase, blocky toy, or small sculpture.
2. A recognizable organic object, such as a plush animal or figurine.
3. A difficult object, such as something glossy, thin, dark, or low-texture.
4. One object that matches the final paper lamp product vision.

Each object should have a dedicated input folder containing the source images. Start with 10 to 15 clean, guided turntable-style images when testing the current visual-hull path. Use 20 to 60 photos only when testing photogrammetry-style tools such as COLMAP or Meshroom.

### Required Outputs

For each serious test object, produce:

- Source image set
- Reconstructed 3D mesh, such as OBJ, GLB, STL, or PLY
- Cleaned or simplified mesh
- Printable 2D planes as SVG, PDF, or DXF
- Assembly notes
- Rendered or photographed evidence that the output resembles the input object
- Short notes on what worked, what failed, and whether the result is repeatable

### Success Criteria

Phase 1 succeeds only if:

- At least one object can go from photos to printable 2D parts end to end.
- The generated 2D parts can realistically be printed or laser cut.
- The assembled or rendered result is visibly related to the original object.
- The process is documented well enough to repeat with a second object.

If these criteria are not met, do not move into UI development.

## Phase 1A: Tool Testing Matrix

The goal is not to find the most impressive demo. The goal is to find a repeatable pipeline that can eventually become productized.

Each candidate pipeline should be tested against the same checklist:

- Can it process our input photos?
- Does it produce a downloadable 3D mesh?
- Is the mesh clean enough to simplify?
- Can the mesh be converted into 2D printable parts?
- How much manual cleanup is required?
- Is the result recognizable?
- Could this process later be automated?
- What are the licensing, cost, and runtime constraints?

### 3D Reconstruction Candidates

#### COLMAP

Use COLMAP as a local, reproducible photogrammetry baseline.

Why test it:

- Strong structure-from-motion and multi-view stereo pipeline.
- Command-line friendly.
- Useful for understanding the technical floor without relying on a black-box API.

Risk:

- Requires good input photos and may need careful environment setup.
- Mesh cleanup may still require additional tools.

#### Meshroom / AliceVision

Use Meshroom as an open-source photogrammetry comparison point.

Why test it:

- Good for visual debugging.
- Mature photogrammetry workflow.
- Useful when COLMAP setup or results are difficult to interpret.

Risk:

- May be heavier to run locally.
- Automation may be less straightforward depending on the workflow.

#### Cloud Or API Image-To-3D Tools

Use one or two cloud/API tools only if they accelerate proof of concept and return downloadable meshes.

Why test them:

- Faster validation.
- May produce better meshes from imperfect input.

Risk:

- Cost, rate limits, licensing, and black-box behavior.
- Product dependency risk if the API changes or output quality is inconsistent.

### 2D Conversion Candidates

#### Blender Python Pipeline

Use Blender as the main candidate for mesh cleanup, simplification, slicing, and export.

Possible jobs:

- Import reconstructed mesh.
- Normalize scale and orientation.
- Decimate or remesh.
- Generate contour slices or planar ribs.
- Export SVG, PDF, or DXF-friendly geometry.

Why test it:

- Scriptable.
- Good long-term automation path.
- Gives control over geometry decisions.

#### Papercraft Unfold Pipeline

Test whether simplified meshes can be unfolded into flat paper patterns.

Why test it:

- Directly maps a 3D surface into 2D pieces.
- Good for faceted papercraft objects.

Risk:

- Organic meshes can create many tiny, ugly, or impossible pieces.
- Assembly may be too complex for a friendly product.

#### Custom Lamp Plane Pipeline

Test an approach where the object is represented by interlocking vertical and horizontal contour planes instead of a fully unfolded surface.

Why test it:

- More reliable for laser cutting.
- Easier to assemble.
- Better suited to lamp aesthetics.
- Can produce a recognizable silhouette without perfect surface reconstruction.

This may be the strongest MVP direction.

## Phase 1B: End-To-End Experiments

### Experiment 1: Simple Object Reconstruction

Use a matte, textured, easy object.

Purpose:

- Confirm that the reconstruction pipeline works.
- Establish the baseline folder structure and output checklist.

Expected output:

- Mesh file
- Screenshot or render
- Notes on photo quality and reconstruction quality

### Experiment 2: Recognizable Organic Object

Use an object closer to the real product vision, such as a small animal figure or plush toy.

Purpose:

- Test recognizability.
- Discover how much geometry detail is required.

Expected output:

- Mesh file
- Simplified mesh
- Notes on failure modes

### Experiment 3: Printable Plane Strategy

Take the best reconstructed mesh and generate printable 2D parts using at least two strategies:

1. Vertical or radial contour slices.
2. Horizontal contour slices.
3. Optional interlocking slots.
4. Optional unfolded surface pieces.

Purpose:

- Decide whether the product should use contour/rib construction or surface unfolding.

Expected output:

- SVG, PDF, or DXF cutting files
- Rendered preview of assembled planes
- Notes on material assumptions and slot tolerances

### Experiment 4: Physical Or Rendered Validation

Validate one complete result.

Preferred:

- Print or laser cut the parts.
- Assemble the object.
- Photograph it next to the source object.

Fallback:

- Render the generated planes in 3D and compare them to the input object.

Purpose:

- Prove that the generated planes form a recognizable 3D object.

Expected output:

- Final output image or render
- Assembly notes
- Final pass/fail assessment

## Phase 1C: Image-To-3D Source Shape Proof

### Why This Phase Exists

The Bunny benchmark proved an important downstream point: if we already have a clean animal mesh, the pipeline can simplify it into a recognizable faceted shell and export paper-style connected nets.

That does not yet prove the product. The product depends on getting that clean-enough source shape from user images.

Phase 1C is therefore the current focus. It should answer one narrow question:

> Can a few images of the same object produce a usable 3D source mesh for the paperlamp pipeline?

### Current Evidence

- COLMAP is useful as a local sparse reconstruction and camera-recovery baseline.
- Calibrated DinoRing produced sparse models across 47 of 48 real images, split into two partial models.
- COLMAP dense stereo is blocked locally because the installed build requires CUDA.
- Bunny rendered-image reconstruction produced a better calibrated sparse baseline:
  - uncalibrated: 27 of 48 views, 501 sparse points;
  - fixed `SIMPLE_PINHOLE`: 39 of 48 views, 1054 sparse points.
- Sparse output is not sufficient for the product by itself. We need a mesh or a reliable silhouette/visual-hull substitute.

### Candidate Routes To Test

1. **Photogrammetry mesh route**
   - Use COLMAP or a comparable tool to produce camera poses and dense geometry.
   - Needs a non-CUDA dense step locally, a different COLMAP build/environment, or a cloud/GPU worker.

2. **Silhouette plus known/estimated camera route**
   - Segment the object from each image.
   - Use camera poses from COLMAP or controlled capture assumptions.
   - Build a visual hull mesh that can feed the faceted-shell pipeline.

3. **Image-conditioned mesh generation route**
   - Use an API or model that returns a downloadable mesh from one or more images.
   - A short text description can help this route, especially for semantic features like "rabbit with long ears" or "dinosaur with back spikes".
   - Text should be treated as optional guidance, not magic. It may improve plausibility but can also hallucinate details that were not actually visible.

### Phase 1C Success Criteria

Phase 1C passes only if one route produces:

- a downloadable or locally generated mesh from image input;
- recognizable object-specific silhouette and major features;
- enough geometric cleanliness to simplify into a faceted shell;
- repeatable commands or API calls documented in `poc/reports/poc-report.md`.

If Phase 1C does not pass, the product should not move to UI. The honest options would be narrowing supported objects, using guided capture with stricter constraints, relying on a vetted image-to-3D provider, or shifting toward curated/semi-manual templates.

## Phase 1 Deliverables

Create a proof-of-concept workspace like this:

```text
poc/
  input/
    object-name/
      images/
  output/
    object-name/
      reconstruction/
      cleaned-mesh/
      printable-planes/
      renders/
      assembly-notes.md
  reports/
    tool-test-matrix.md
    poc-report.md
```

The final Phase 1 report should answer:

- Which tools were tested?
- Which tools produced usable output?
- Which step is currently the weakest?
- Can the process be repeated?
- Does the output resemble the input object?
- Is the lamp-plane concept more promising than full papercraft unfolding?
- Should the project continue to UI development?

## Phase 1 Decision Gate

Move to Phase 2 only if this statement is true:

> We can reliably convert at least one photographed object into printable 2D parts that form a recognizable 3D object.

If this is not true, do not build the UI yet. Instead, choose one of these actions:

- Improve the reconstruction pipeline.
- Reduce the supported object types.
- Switch from photo-to-3D to a semi-manual design workflow.
- Change the output format from unfolded paper model to contour/rib lamp structure.
- Reframe the product around curated templates rather than arbitrary objects.

## Phase 2: Product Interface

### Goal

Build the user-facing app only after the technical transformation has been proven.

### Scope

- Photo upload or camera capture
- Input quality checklist
- Processing status
- 3D preview
- 2D cut-sheet preview
- Download SVG, PDF, or DXF
- Basic project history
- Clear error states when the input photos are not usable

### Still Out Of Scope

- Payments
- Marketplace
- Social sharing
- Advanced editing
- Multi-user collaboration
- E-commerce fulfillment

### Success Criteria

- A user can complete the flow without developer help.
- Bad inputs produce understandable feedback.
- Output files are printable or laser-cutter-ready.
- The app exposes the proven pipeline rather than pretending unfinished steps work.

## Phase 3: Productization And Marketing

### Goal

Turn the proven workflow into a product people can understand, trust, and share.

### Positioning Options

- DIY paper lamp maker
- Custom laser-cut craft generator
- Photo-to-papercraft tool
- Maker or STEM classroom activity
- Etsy-adjacent custom craft product
- Personalized gift design tool

### Marketing Channels

- Short-form build videos on TikTok, Instagram, and YouTube Shorts
- Maker communities
- Laser cutting communities
- Etsy seller communities
- Schools, workshops, and STEM programs
- Local fabrication labs
- Product Hunt after the demo is visually strong

### Marketing Proof Needed

- Before/after photos
- Short video: photos -> generated sheets -> cutting -> assembly -> glowing lamp
- 3 to 5 strong example objects
- Clear explanation of what object types work well
- Honest examples of what does not work yet

## Recommended Next Milestone

Produce one complete proof-of-concept folder containing:

- Input photos
- Reconstructed mesh
- Generated 2D printable planes
- Rendered or physical assembled result
- Short report explaining whether the result is good enough to justify UI development

This is the truth test for the project. Once it works, the app can be built around a real pipeline instead of hope.
