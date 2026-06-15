# Phase 1 POC Workspace

This folder is for the raw proof of concept. It should stay separate from the app UI until the technical pipeline is proven.

## Goal

Prove this chain with real artifacts:

```text
input photos -> 3D reconstruction -> cleaned mesh -> printable 2D planes -> recognizable assembled object
```

## Folder Structure

```text
poc/
  input/
    simple-matte-object/images/
    recognizable-organic-object/images/
    synthetic-lego-nerf/SOURCE.md
    middlebury-dino-ring/SOURCE.md
    final-lamp-candidate/images/
  output/
    simple-matte-object/
      reconstruction/
      cleaned-mesh/
      printable-planes/
      renders/
      assembly-notes.md
  reports/
    tool-test-matrix.md
    poc-report.md
```

## Rules

- Do not build UI during Phase 1.
- Do not count a tool as working unless it produces files we can inspect.
- Prefer boring, repeatable steps over impressive one-off demos.
- Record failures. They are useful evidence.
- Move to Phase 2 only after at least one object produces printable 2D parts and a recognizable assembled or rendered result.

## First Test Object

Start with `simple-matte-object`.

Recommended object traits:

- Matte surface
- Distinct texture or visual features
- Not transparent or reflective
- Can stand still while photographed
- Fits on a table
- Recognizable silhouette

Recommended image capture:

- 30 to 60 photos
- Two height rings: low angle and slightly above
- Consistent lighting
- Object fills most of the frame
- Plain but textured background
- Avoid motion blur

## Local Toolchain

The Phase 1 Conda environment is named `paperlamp-poc`.

Create or recreate it with:

```bash
/opt/anaconda3/bin/conda env create --override-channels -c conda-forge -f poc/environment.yml
```

Check installed tools with:

```bash
poc/scripts/check-tools.sh
```

Run the first COLMAP sparse reconstruction attempt with:

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/simple-matte-object/images \
  poc/output/simple-matte-object/reconstruction/colmap-auto
```

The older `run-colmap-auto.sh` wrapper is still available, but `automatic_reconstructor` can touch Qt/screen services and has crashed in headless macOS sessions. Prefer `run-colmap-sparse.sh`.

Run the calibrated Middlebury DinoRing baseline with:

```bash
poc/scripts/run-colmap-sparse.sh \
  poc/input/middlebury-dino-ring/images \
  poc/output/middlebury-dino-ring/reconstruction/colmap-sparse-calibrated \
  PINHOLE \
  3310.4,3325.5,316.73,200.55
```

The raw DinoRing images and generated COLMAP outputs are intentionally gitignored. The source notes and measured results live in `poc/input/middlebury-dino-ring/SOURCE.md` and `poc/reports/poc-report.md`.

Run the first silhouette visual-hull and rib SVG attempt with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-visual-hull.py \
  --image-dir poc/input/middlebury-dino-ring/images \
  --camera-file poc/input/middlebury-dino-ring/raw/dinoRing/dinoR_par.txt \
  --silhouette-list poc/input/middlebury-dino-ring/raw/dinoRing/dinoR_good_silhouette_images.txt \
  --output-dir poc/output/middlebury-dino-ring/printable-planes \
  --resolution 64 \
  --rib-count 12
```

This produces a rough voxel hull, OBJ, and SVG rib sheet under `poc/output/middlebury-dino-ring/printable-planes/`. Those generated artifacts are ignored by git.

Render an orthogonal rib assembly preview with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-rib-assembly.py \
  --voxel-file poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull-voxels.npz \
  --output-dir poc/output/middlebury-dino-ring/renders \
  --x-ribs 10 \
  --y-ribs 10 \
  --simplify 2.0
```

This produces a 3D rib OBJ plus single-view and multi-view PNG renders. These generated artifacts are also ignored by git.

Generate low-poly faceted shell variants with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/output/middlebury-dino-ring/printable-planes/dino-visual-hull.obj \
  --output-dir poc/output/middlebury-dino-ring/cleaned-mesh \
  --face-counts 300 800 1600
```

Export a raw labeled triangle template from the 300-face shell with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-faceted-template.py \
  --input-mesh poc/output/middlebury-dino-ring/cleaned-mesh/dino-faceted-shell-300.obj \
  --output-svg poc/output/middlebury-dino-ring/printable-planes/dino-faceted-shell-300-template.svg \
  --target-max-mm 250
```

This template is not yet a friendly papercraft net. It is a raw proof artifact: individual triangular facets with face IDs and matching edge IDs.
