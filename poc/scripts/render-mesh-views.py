#!/usr/bin/env python
"""Render synthetic same-object view images from a mesh."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import trimesh
from mpl_toolkits.mplot3d.art3d import Poly3DCollection


def normalize_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mesh = mesh.copy()
    center = mesh.bounds.mean(axis=0)
    scale = float((mesh.bounds[1] - mesh.bounds[0]).max())
    mesh.apply_translation(-center)
    mesh.apply_scale(1.0 / scale)
    return mesh


def face_colors(mesh: trimesh.Trimesh) -> list[tuple[float, float, float, float]]:
    normals = mesh.face_normals
    light = np.array([0.25, -0.5, 0.85], dtype=np.float64)
    light /= np.linalg.norm(light)
    intensity = np.clip(normals @ light, 0.0, 1.0)
    base = np.array([0.86, 0.80, 0.68], dtype=np.float64)
    shade = 0.44 + 0.56 * intensity[:, None]
    colors = np.clip(base * shade, 0.0, 1.0)
    return [(float(r), float(g), float(b), 1.0) for r, g, b in colors]


def render_view(mesh: trimesh.Trimesh, output_path: Path, azim: float, elev: float) -> None:
    fig = plt.figure(figsize=(5, 5), dpi=160)
    ax = fig.add_subplot(111, projection="3d")
    triangles = mesh.vertices[mesh.faces]
    ax.add_collection3d(
        Poly3DCollection(
            triangles,
            facecolors=face_colors(mesh),
            edgecolor="#2f2f2f",
            linewidth=0.03,
            alpha=1.0,
        )
    )
    bound = 0.62
    ax.set_xlim(-bound, bound)
    ax.set_ylim(-bound, bound)
    ax.set_zlim(-bound, bound)
    ax.set_box_aspect((1, 1, 1))
    ax.view_init(elev=elev, azim=azim)
    ax.set_axis_off()
    fig.tight_layout(pad=0)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, transparent=False, facecolor="white")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-mesh", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--views", type=int, default=24)
    parser.add_argument("--elevations", type=float, nargs="+", default=[-8.0, 14.0])
    args = parser.parse_args()

    mesh = trimesh.load(args.input_mesh, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise RuntimeError(f"Expected a single mesh, got {type(mesh)!r}")
    mesh = normalize_mesh(mesh)

    total = 0
    for elev in args.elevations:
        for view_index, azim in enumerate(np.linspace(0.0, 360.0, args.views, endpoint=False)):
            output_path = args.output_dir / f"view_e{int(elev):+03d}_{view_index:03d}.png"
            render_view(mesh, output_path, azim=float(azim), elev=float(elev))
            total += 1

    print(f"wrote {total} images to {args.output_dir}")


if __name__ == "__main__":
    main()
