#!/usr/bin/env python
"""Render a sparse point cloud to a PNG preview."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import trimesh


def points_from_loaded(loaded: object) -> np.ndarray:
    if isinstance(loaded, trimesh.points.PointCloud):
        return np.asarray(loaded.vertices, dtype=np.float64)
    if isinstance(loaded, trimesh.Trimesh):
        return np.asarray(loaded.vertices, dtype=np.float64)
    raise TypeError(f"Unsupported geometry type: {type(loaded)!r}")


def normalize(points: np.ndarray) -> np.ndarray:
    points = points[np.isfinite(points).all(axis=1)]
    if points.size == 0:
        raise ValueError("Point cloud has no finite points")
    center = points.mean(axis=0)
    points = points - center
    scale = np.percentile(np.linalg.norm(points, axis=1), 95)
    if scale <= 0:
        scale = float(np.ptp(points, axis=0).max())
    if scale <= 0:
        raise ValueError("Point cloud has zero scale")
    return points / scale


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--azim", type=float, default=-55.0)
    parser.add_argument("--elev", type=float, default=18.0)
    args = parser.parse_args()

    loaded = trimesh.load(args.input)
    points = normalize(points_from_loaded(loaded))

    fig = plt.figure(figsize=(7, 7), dpi=180)
    ax = fig.add_subplot(111, projection="3d")
    ax.scatter(points[:, 0], points[:, 1], points[:, 2], s=1.8, c="#1f2933", alpha=0.92)
    ax.view_init(elev=args.elev, azim=args.azim)
    limit = 1.05
    ax.set_xlim(-limit, limit)
    ax.set_ylim(-limit, limit)
    ax.set_zlim(-limit, limit)
    ax.set_box_aspect((1, 1, 1))
    ax.set_axis_off()
    fig.tight_layout(pad=0)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.output, facecolor="white")
    plt.close(fig)
    print(f"rendered {len(points)} points to {args.output}")


if __name__ == "__main__":
    main()
