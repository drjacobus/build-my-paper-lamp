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
