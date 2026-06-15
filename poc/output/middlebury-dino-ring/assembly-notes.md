# Middlebury DinoRing Assembly Notes

No printable assembly has been generated yet.

Current result:

- COLMAP sparse reconstruction works when the provided calibration is used.
- The reconstruction is split into two sparse models covering 47 of 48 source images.
- COLMAP dense stereo failed locally because the installed COLMAP build requires CUDA.
- The silhouette visual-hull path produced a rough voxel hull, OBJ mesh, and 12-rib SVG sheet.
- The orthogonal rib render path produced a 20-rib 3D assembly preview.
- Current recognizability is weak: the output reads as a ribbed volume, but not yet clearly as the source dinosaur.
- Next step is to improve mask quality, contour filtering, slots, and validation renders before physical assembly.

This dataset is a technical proof input, not a final lamp candidate.
