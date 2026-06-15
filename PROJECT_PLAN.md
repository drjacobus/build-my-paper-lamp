# Build My Paper Lamp - Project Plan

## Project Goal

Build a system that turns several input photos of an object into printable 2D paper or card planes that can be cut, folded, slotted, or glued into a recognizable 3D object inspired by the original image.

The project must prove the technical pipeline before investing in UI, branding, automation, hosting, or marketing.

## Guiding Principle

The first milestone is not an app. The first milestone is proof that the core transformation works:

> Input photos -> 3D reconstruction -> simplified geometry -> printable 2D planes -> recognizable assembled object.

If this cannot be proven with raw tools and scripts, adding a polished interface will only hide the uncertainty. Phase 1 is therefore a lab-style proof of concept with no UI and no product logic.

## Phase 1: Raw Technical Proof Of Concept

### Current Status

Status as of 2026-06-15: **Started**

What exists now:

- POC workspace created under `poc/`.
- Report template created at `poc/reports/poc-report.md`.
- Tool matrix created at `poc/reports/tool-test-matrix.md`.
- Repeatable local tool check created at `poc/scripts/check-tools.sh`.

Initial findings:

- COLMAP is not installed locally.
- Blender is not installed locally.
- Meshroom/AliceVision is not installed locally.
- MeshLab server is not installed locally.
- OpenSCAD is not installed locally.
- Conda is available.
- Anaconda Python is available.
- NumPy, scikit-image, SciPy, and Matplotlib are available.
- Mesh-focused Python packages such as `trimesh`, `open3d`, `pycolmap`, and `shapely` are not installed in the base Anaconda environment.

Immediate blocker:

- The first reconstruction cannot run locally until a reconstruction tool is installed or a cloud/API path with downloadable mesh output is selected.
- The first robust mesh-to-plane conversion cannot run locally until Blender or equivalent mesh-processing libraries are installed.

Next action:

1. Install or provide a reconstruction path, with COLMAP as the preferred local baseline.
2. Install or provide a mesh conversion path, with Blender Python or a Python mesh stack as the preferred path.
3. Capture 30 to 60 photos of a simple matte object into `poc/input/simple-matte-object/images/`.
4. Run Experiment 1 and record the output in `poc/reports/poc-report.md`.

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

Each object should have a dedicated input folder containing the source images. Start with 20 to 60 photos per object when testing photogrammetry-style tools.

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
