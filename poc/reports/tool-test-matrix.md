# Tool Test Matrix

## Current Status

Phase 1 has started. No tool has passed the end-to-end proof yet.

Initial local availability check:

- `colmap`: missing
- `blender`: missing
- `meshroom_batch`: missing
- `aliceVision_cameraInit`: missing
- `meshlabserver`: missing
- `openscad`: missing
- `brew`: missing
- `conda`: available at `/opt/anaconda3/bin/conda`
- Anaconda Python: available at `/opt/anaconda3/bin/python`
- Python packages found: `numpy`, `scikit-image`, `scipy`, `matplotlib`
- Python packages missing: `trimesh`, `open3d`, `pycolmap`, `shapely`

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
| COLMAP | Missing | Not tested | Not tested | CLI | Blocked until installed | Preferred local baseline. |
| Meshroom / AliceVision | Missing | Not tested | Not tested | CLI/GUI mixed | Blocked until installed | Useful comparison if available. |
| Cloud/API image-to-3D | Unknown | Not tested | Not tested | API-dependent | Not started | Only useful if it returns downloadable meshes. |

## Mesh Cleanup And 2D Conversion Tools

| Tool | Local availability | Mesh tested | 2D output | Automation path | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Blender Python | Missing | Not tested | Not tested | Scriptable | Blocked until installed | Main candidate for cleanup, slicing, and SVG/DXF export. |
| Papercraft unfold tool | Unknown | Not tested | Not tested | Unknown | Not started | Risk: too many tiny parts for organic forms. |
| Custom lamp-plane script | Not implemented | Not tested | Not tested | Fully scriptable | Not started | Strong candidate for MVP if contour/rib output works. |

## Tool Test Log

### 2026-06-15: Phase 1 Setup

- Created the POC workspace.
- Created this tool matrix.
- Checked local availability of COLMAP, Meshroom/AliceVision, Blender, and supporting mesh tools.
- Result: core geometry tools are not installed locally yet.
- Next step: install or otherwise provide a reconstruction tool and a mesh/plane conversion tool, then capture the first simple matte object image set.
