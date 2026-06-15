# Source: Stanford Bunny

## Why This Object

The Stanford Bunny is a scanned ceramic rabbit figurine with a much clearer animal silhouette than the curled DinoRing object. It is useful for the Phase 1 shape-fidelity sprint because:

- the object is recognizable from its ears and body shape;
- the source is a real scanned physical object, not a hand-made synthetic model;
- the mesh is small enough for fast faceted-shell and template experiments;
- synthetic same-object view images can be rendered from the mesh to test image-conditioned workflows later.

Limitations:

- this is not a real phone-photo capture set;
- rendering views from a known mesh bypasses reconstruction uncertainty;
- passing this object does not prove the final user-photo workflow;
- it is a controlled benchmark for downstream shape/template quality.

## Source

- Stanford 3D Scanning Repository: https://graphics.stanford.edu/data/3Dscanrep/
- Direct archive: https://graphics.stanford.edu/pub/3Dscanrep/bunny.tar.gz

## Local Files

Downloaded raw archive:

```text
poc/input/stanford-bunny/raw/bunny.tar.gz
```

Extracted reconstruction meshes:

```text
poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper.ply
poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res2.ply
poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply
poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res4.ply
```

Primary POC mesh:

```text
poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply
```

Rendered same-object view images:

```text
poc/input/stanford-bunny/images/
```

The raw mesh archive, extracted meshes, and rendered images are intentionally gitignored.
