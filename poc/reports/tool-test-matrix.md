# Tool Test Matrix

## Current Status

Phase 1 has started. No tool has passed the end-to-end proof yet.

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
| COLMAP | Installed in `paperlamp-poc` | Not tested | Not tested | CLI | Ready for first image set | Preferred local baseline. |
| Meshroom / AliceVision | Missing | Not tested | Not tested | CLI/GUI mixed | Blocked until installed | Useful comparison if available. |
| Cloud/API image-to-3D | Unknown | Not tested | Not tested | API-dependent | Not started | Only useful if it returns downloadable meshes. |

## Mesh Cleanup And 2D Conversion Tools

| Tool | Local availability | Mesh tested | 2D output | Automation path | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Blender Python | Missing | Not tested | Not tested | Scriptable | Deferred | We will first try `trimesh` + `shapely` for slicing before adding Blender. |
| Papercraft unfold tool | Unknown | Not tested | Not tested | Unknown | Not started | Risk: too many tiny parts for organic forms. |
| Custom lamp-plane script | Not implemented | Not tested | Not tested | Fully scriptable | Not started | Strong candidate for MVP if contour/rib output works. |

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
- Next step: capture the first simple matte object image set and run COLMAP automatic reconstruction.
