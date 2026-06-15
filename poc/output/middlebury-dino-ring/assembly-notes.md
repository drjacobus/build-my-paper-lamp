# Middlebury DinoRing Assembly Notes

No printable assembly has been generated yet.

Current result:

- COLMAP sparse reconstruction works when the provided calibration is used.
- The reconstruction is split into two sparse models covering 47 of 48 source images.
- COLMAP dense stereo failed locally because the installed COLMAP build requires CUDA.
- The silhouette visual-hull path produced a rough voxel hull, OBJ mesh, and 12-rib SVG sheet.
- The orthogonal rib render path produced a 20-rib 3D assembly preview.
- Current recognizability is weak: the output reads as a ribbed volume, but not yet clearly as the source dinosaur.
- The low-poly faceted shell path produced 300, 800, and 1600 face variants.
- The 300-face shell produced a raw labeled triangle SVG template.
- The faceted shell path is closer to the desired DIY paperlamp-kit direction than the rib lattice, but it still needs connected nets, tabs, page layout, and better shape fidelity before physical assembly.

This dataset is a technical proof input, not a final lamp candidate.
