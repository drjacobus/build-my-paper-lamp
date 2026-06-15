# Middlebury DinoRing Assembly Notes

No printable assembly has been generated yet.

Current result:

- COLMAP sparse reconstruction works when the provided calibration is used.
- The reconstruction is split into two sparse models covering 47 of 48 source images.
- COLMAP dense stereo failed locally because the installed COLMAP build requires CUDA.
- The silhouette visual-hull path produced a rough voxel hull, OBJ mesh, and 12-rib SVG sheet.
- Next step is to clean the rib contours, add slots, render the plane assembly, and check recognizability.

This dataset is a technical proof input, not a final lamp candidate.
