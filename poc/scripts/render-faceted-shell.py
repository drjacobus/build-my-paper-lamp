#!/usr/bin/env python
"""Generate and render low-poly faceted shell variants from a mesh."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import trimesh
from mpl_toolkits.mplot3d.art3d import Poly3DCollection


def simplify_mesh(mesh: trimesh.Trimesh, face_count: int) -> trimesh.Trimesh:
    simplified = mesh.simplify_quadric_decimation(face_count=face_count)
    simplified.remove_unreferenced_vertices()
    return simplified


def face_colors(mesh: trimesh.Trimesh) -> list[tuple[float, float, float, float]]:
    normals = mesh.face_normals
    light = np.array([0.25, -0.35, 0.9], dtype=np.float64)
    light /= np.linalg.norm(light)
    intensity = np.clip(normals @ light, 0.0, 1.0)
    base = np.array([0.98, 0.78, 0.48], dtype=np.float64)
    shade = 0.42 + 0.58 * intensity[:, None]
    colors = np.clip(base * shade, 0.0, 1.0)
    return [(float(r), float(g), float(b), 0.92) for r, g, b in colors]


def add_mesh_to_axis(ax, mesh: trimesh.Trimesh) -> None:
    triangles = mesh.vertices[mesh.faces]
    collection = Poly3DCollection(
        triangles,
        facecolors=face_colors(mesh),
        edgecolor="#2f2f2f",
        linewidth=0.24,
        alpha=0.94,
    )
    ax.add_collection3d(collection)
    bounds = mesh.bounds
    ax.set_xlim(bounds[0, 0], bounds[1, 0])
    ax.set_ylim(bounds[0, 1], bounds[1, 1])
    ax.set_zlim(bounds[0, 2], bounds[1, 2])
    ax.set_box_aspect(bounds[1] - bounds[0])
    ax.set_axis_off()


def render_mesh_grid(path: Path, meshes: list[tuple[int, trimesh.Trimesh]]) -> None:
    fig = plt.figure(figsize=(12, 8), dpi=180)
    views = [(-70, 16), (-35, 20), (0, 8), (55, 18)]
    for row, (face_count, mesh) in enumerate(meshes):
        for col, (azim, elev) in enumerate(views):
            index = row * len(views) + col + 1
            ax = fig.add_subplot(len(meshes), len(views), index, projection="3d")
            add_mesh_to_axis(ax, mesh)
            ax.view_init(elev=elev, azim=azim)
            if col == 0:
                ax.set_title(f"{face_count} faces", fontsize=9, pad=0)
    fig.tight_layout(pad=0.25)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, transparent=False, facecolor="white")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-mesh", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--face-counts", type=int, nargs="+", default=[300, 800, 1600])
    parser.add_argument("--name-prefix", default=None)
    args = parser.parse_args()

    source = trimesh.load(args.input_mesh, force="mesh")
    if not isinstance(source, trimesh.Trimesh):
        raise RuntimeError(f"Expected a single mesh, got {type(source)!r}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    name_prefix = args.name_prefix or args.input_mesh.stem
    variants: list[tuple[int, trimesh.Trimesh]] = []

    for face_count in args.face_counts:
        mesh = simplify_mesh(source, face_count)
        variants.append((face_count, mesh))
        output_path = args.output_dir / f"{name_prefix}-faceted-shell-{face_count}.obj"
        mesh.export(output_path)
        print(
            f"{face_count} target faces -> {len(mesh.faces)} faces, "
            f"{len(mesh.vertices)} vertices, watertight={mesh.is_watertight}: {output_path}"
        )

    render_path = args.output_dir / f"{name_prefix}-faceted-shell-variants.png"
    render_mesh_grid(render_path, variants)
    print(f"wrote {render_path}")


if __name__ == "__main__":
    main()
