# Cloud MVP Deployment

This MVP uses the simple single-container architecture:

```text
Next.js UI + API routes
        |
        v
local Python worker process in the same container
        |
        v
/data/lamp-jobs persistent disk
```

This is intended for early testers, not high-volume production.

## Why Not Vercel-Only?

The proven pipeline runs Python, ONNX Runtime, AI segmentation, visual-hull voxel processing, mesh simplification, and SVG export. That is better suited to a long-running container than a serverless function.

Vercel can still host a later frontend-only deployment, but the MVP starts with one Docker app so a tester can use a public link without your laptop running.

## Render Deployment

The repo includes:

- `Dockerfile`
- `requirements-mvp.txt`
- `render.yaml`

On Render:

1. Create a new Blueprint or Docker web service from this repository.
2. Use the included Dockerfile.
3. Mount the persistent disk at `/data`.
4. Keep these environment variables:
   - `LAMP_JOB_DIR=/data/lamp-jobs`
   - `PYTHON_BIN=python3`

The Docker build pre-downloads the `isnet-general-use` segmentation model so the first user job does not pay that download cost.

## MVP Limits

- Jobs are stored on one persistent disk.
- Processing runs in the same web container.
- Multiple simultaneous jobs may contend for CPU/memory.
- Uploaded images and generated models are not authenticated yet.
- This is good enough for a private testing link, not a public launch.
