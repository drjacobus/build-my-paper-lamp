# Stanford Bunny Assembly Notes

No physical assembly has been generated yet.

Current role:

- Controlled animal benchmark for shape fidelity.
- Used to test whether a recognizable animal mesh can become a low-poly faceted shell and raw printable template.
- First connected net generated from the 300-face shell:
  - 22 connected islands;
  - 299 total faces;
  - 116 glue tabs;
  - output SVG: `poc/output/stanford-bunny/printable-planes/stanford-bunny-connected-net-300.svg`.

This object does not replace real-photo reconstruction testing. It isolates the downstream paperlamp-kit path from the current Dino visual-hull noise.

Next assembly work:

- reduce island count where possible;
- distinguish cut lines and fold lines visually;
- add page layout;
- add assembly ordering;
- validate that the net can reconstruct the faceted shell.
