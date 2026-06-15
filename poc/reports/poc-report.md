# Phase 1 POC Report

## Summary

Phase 1 has started. The current objective is to prove that a few object photos can become printable 2D planes that assemble into a recognizable 3D object.

No end-to-end proof has passed yet.

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

Implication:

- We can organize inputs and reports now.
- We can run the first reconstruction locally with COLMAP after input photos are added.
- We can begin mesh-to-plane experiments with `trimesh` and `shapely` before adding Blender.

## Phase Gate

Current status: **Not ready for Phase 2**

Reason:

- No input image set has been tested.
- No reconstructed mesh has been produced.
- No printable 2D plane output has been produced.
- No assembled or rendered validation exists yet.

## Experiment Results

### Experiment 1: Simple Object Reconstruction

Status: Not started

Input object:

- TBD

Planned output:

- Reconstructed mesh
- Screenshot or render
- Notes on reconstruction quality

Result:

- TBD

### Experiment 2: Recognizable Organic Object

Status: Not started

Input object:

- TBD

Planned output:

- Reconstructed mesh
- Simplified mesh
- Notes on recognizability

Result:

- TBD

### Experiment 3: Printable Plane Strategy

Status: Not started

Planned strategies:

1. Vertical or radial contour slices.
2. Horizontal contour slices.
3. Optional interlocking slots.
4. Optional unfolded surface pieces.

Result:

- TBD

### Experiment 4: Physical Or Rendered Validation

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
- Local machine tool availability is not yet confirmed.

## Next Actions

1. Choose the first simple matte object.
2. Capture 30 to 60 photos into `poc/input/simple-matte-object/images/`.
3. Run the first reconstruction attempt with `poc/scripts/run-colmap-auto.sh`.
4. Record outputs and failures in this report.
5. Begin mesh-to-plane experiments using `trimesh` and `shapely`.
