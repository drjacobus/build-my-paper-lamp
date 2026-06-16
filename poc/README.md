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
    stanford-bunny/SOURCE.md
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

- 10 to 15 photos for the current guided visual-hull path
- Two height rings if possible: low angle and slightly above
- Consistent lighting
- Object fills most of the frame
- White or high-contrast background
- Avoid motion blur
- Use 20 to 60 photos only when testing photogrammetry-style tools such as COLMAP.

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

Render controlled Stanford Bunny source views with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-mesh-views.py \
  --input-mesh poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply \
  --output-dir poc/input/stanford-bunny/images \
  --views 24 \
  --elevations -8 14
```

Generate Stanford Bunny low-poly shell variants with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/render-faceted-shell.py \
  --input-mesh poc/input/stanford-bunny/raw/bunny/reconstruction/bun_zipper_res3.ply \
  --output-dir poc/output/stanford-bunny/cleaned-mesh \
  --face-counts 150 300 600 1200 \
  --name-prefix stanford-bunny
```

Export the raw Bunny template with:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-faceted-template.py \
  --input-mesh poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-300.obj \
  --output-svg poc/output/stanford-bunny/printable-planes/stanford-bunny-faceted-shell-300-template.svg \
  --target-max-mm 250
```

Export a first connected Bunny net with glue tabs:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/export-connected-nets.py \
  --input-mesh poc/output/stanford-bunny/cleaned-mesh/stanford-bunny-faceted-shell-300.obj \
  --output-svg poc/output/stanford-bunny/printable-planes/stanford-bunny-connected-net-300.svg \
  --target-max-mm 250 \
  --max-faces-per-island 24
```

This produces connected triangle islands with matching edge labels and one simple tab per shared cut edge. It is still a raw proof artifact, not final printable product art.

Run the current controlled turntable visual-hull path from app-style manifest input:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-turntable-visual-hull.py \
  --image-dir poc/input/stanford-bunny \
  --view-manifest poc/input/stanford-bunny/turntable-12-view-manifest.csv \
  --output-dir poc/output/stanford-bunny/reconstruction/turntable-visual-hull-12views-manifest \
  --name-prefix stanford-bunny-12view-manifest \
  --resolution 96 \
  --min-consensus 0.90 \
  --mask-threshold 18
```

The manifest format is:

```csv
image,azimuth,elevation
images-12-turntable/view_e+14_000.png,0,14
images-12-turntable/view_e+14_004.png,60,14
```

Manifests can also include dataset-provided or AI-generated masks:

```csv
image,mask,azimuth,elevation
photo_001.png,mask_001.png,0,10
photo_002.png,mask_002.png,30,10
```

When the object is small in the frame, normalize each mask crop before visual-hull carving:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/build-turntable-visual-hull.py \
  --image-dir poc/input/washington-rgbd-bell-pepper-1 \
  --view-manifest poc/input/washington-rgbd-bell-pepper-1/turntable-12-view-manifest.csv \
  --output-dir poc/output/washington-rgbd-bell-pepper-1/reconstruction/turntable-visual-hull-12views-cropnorm \
  --name-prefix washington-bell-pepper-1-12view-cropnorm \
  --resolution 96 \
  --min-consensus 0.90 \
  --mask-threshold 1 \
  --normalize-mask-crop \
  --crop-padding 0.25
```

For the future app, AI should assist this geometry-first path rather than replace it. The most useful AI jobs are object masking, background cleanup, bad-photo rejection, rough angle estimation, and capture guidance.

Generate rough fallback masks for a real-photo test set:

```bash
/opt/anaconda3/bin/conda run -n paperlamp-poc python poc/scripts/make-simple-foreground-masks.py \
  --image-dir poc/input/real-jagermeister/images \
  --output-dir poc/input/real-jagermeister/masks-tuned \
  --close-radius 16 \
  --dilate-radius 10
```

This script is intentionally only a fallback for experiments. The first real phone-photo bottle test showed that simple color/brightness masks are not reliable enough for glossy dark objects in cluttered scenes. AI segmentation is the next required step for user-uploaded photos.
