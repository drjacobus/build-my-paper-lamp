#!/usr/bin/env python
"""Render orthogonal rib planes from a visual hull voxel grid."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from skimage import measure


@dataclass(frozen=True)
class Rib:
    label: str
    axis: str
    position_mm: float
    points: np.ndarray


def contour_points(contour: np.ndarray, values_a: np.ndarray, values_b: np.ndarray) -> np.ndarray:
    points: list[tuple[float, float]] = []
    for row, col in contour:
        row_index = int(np.clip(round(row), 0, len(values_a) - 1))
        col_index = int(np.clip(round(col), 0, len(values_b) - 1))
        points.append((values_a[row_index], values_b[col_index]))
    return np.asarray(points, dtype=np.float64)


def rib_indices(occupancy: np.ndarray, axis: int, count: int, trim_edges: bool) -> np.ndarray:
    occupied = np.where(occupancy.any(axis=tuple(dim for dim in range(3) if dim != axis)))[0]
    if len(occupied) == 0:
        raise RuntimeError(f"No occupied voxels along axis {axis}.")

    start = occupied.min()
    stop = occupied.max()
    if trim_edges and stop - start > count:
        start += 1
        stop -= 1
    return np.unique(np.linspace(start, stop, count).round().astype(int))


def extract_x_ribs(occupancy: np.ndarray, bounds: np.ndarray, count: int, simplify: float) -> list[Rib]:
    x_values = np.linspace(bounds[0, 0], bounds[1, 0], occupancy.shape[0])
    y_values = np.linspace(bounds[0, 1], bounds[1, 1], occupancy.shape[1])
    z_values = np.linspace(bounds[0, 2], bounds[1, 2], occupancy.shape[2])

    ribs: list[Rib] = []
    for rib_number, x_index in enumerate(rib_indices(occupancy, axis=0, count=count, trim_edges=True), start=1):
        raw_contours = measure.find_contours(occupancy[x_index, :, :].astype(np.float32), 0.5)
        if not raw_contours:
            continue
        contour = measure.approximate_polygon(max(raw_contours, key=len), tolerance=simplify)
        yz = contour_points(contour, y_values, z_values)
        xyz = np.column_stack([np.full(len(yz), x_values[x_index]), yz[:, 0], yz[:, 1]])
        ribs.append(Rib(label=f"x-rib-{rib_number:02d}", axis="x", position_mm=x_values[x_index] * 1000.0, points=xyz))
    return ribs


def extract_y_ribs(occupancy: np.ndarray, bounds: np.ndarray, count: int, simplify: float) -> list[Rib]:
    x_values = np.linspace(bounds[0, 0], bounds[1, 0], occupancy.shape[0])
    y_values = np.linspace(bounds[0, 1], bounds[1, 1], occupancy.shape[1])
    z_values = np.linspace(bounds[0, 2], bounds[1, 2], occupancy.shape[2])

    ribs: list[Rib] = []
    for rib_number, y_index in enumerate(rib_indices(occupancy, axis=1, count=count, trim_edges=True), start=1):
        raw_contours = measure.find_contours(occupancy[:, y_index, :].astype(np.float32), 0.5)
        if not raw_contours:
            continue
        contour = measure.approximate_polygon(max(raw_contours, key=len), tolerance=simplify)
        xz = contour_points(contour, x_values, z_values)
        xyz = np.column_stack([xz[:, 0], np.full(len(xz), y_values[y_index]), xz[:, 1]])
        ribs.append(Rib(label=f"y-rib-{rib_number:02d}", axis="y", position_mm=y_values[y_index] * 1000.0, points=xyz))
    return ribs


def write_rib_obj(path: Path, ribs: list[Rib]) -> None:
    vertex_offset = 1
    with path.open("w") as file:
        for rib in ribs:
            file.write(f"o {rib.label}\n")
            for point in rib.points:
                file.write(f"v {point[0]:.8f} {point[1]:.8f} {point[2]:.8f}\n")
            face = " ".join(str(index) for index in range(vertex_offset, vertex_offset + len(rib.points)))
            file.write(f"f {face}\n")
            vertex_offset += len(rib.points)


def add_ribs_to_axis(ax, ribs: list[Rib], bounds: np.ndarray) -> None:
    x_faces = [rib.points for rib in ribs if rib.axis == "x" and len(rib.points) >= 3]
    y_faces = [rib.points for rib in ribs if rib.axis == "y" and len(rib.points) >= 3]

    ax.add_collection3d(
        Poly3DCollection(x_faces, facecolor="#4c78a8", edgecolor="#1f2937", linewidth=0.35, alpha=0.42)
    )
    ax.add_collection3d(
        Poly3DCollection(y_faces, facecolor="#f58518", edgecolor="#1f2937", linewidth=0.35, alpha=0.34)
    )

    ax.set_xlim(bounds[0, 0], bounds[1, 0])
    ax.set_ylim(bounds[0, 1], bounds[1, 1])
    ax.set_zlim(bounds[0, 2], bounds[1, 2])
    ax.set_box_aspect(bounds[1] - bounds[0])
    ax.set_axis_off()


def render_ribs(path: Path, ribs: list[Rib], bounds: np.ndarray) -> None:
    fig = plt.figure(figsize=(9, 7), dpi=180)
    ax = fig.add_subplot(111, projection="3d")
    add_ribs_to_axis(ax, ribs, bounds)
    ax.view_init(elev=18, azim=-55)
    fig.tight_layout(pad=0)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, transparent=False, facecolor="white")
    plt.close(fig)


def render_view_grid(path: Path, ribs: list[Rib], bounds: np.ndarray) -> None:
    views = [
        ("side", 5, -90),
        ("front", 5, 0),
        ("top", 90, -90),
        ("3/4", 18, -55),
    ]
    fig = plt.figure(figsize=(12, 9), dpi=180)
    for index, (title, elev, azim) in enumerate(views, start=1):
        ax = fig.add_subplot(2, 2, index, projection="3d")
        add_ribs_to_axis(ax, ribs, bounds)
        ax.view_init(elev=elev, azim=azim)
        ax.set_title(title, fontsize=9, pad=0)
    fig.tight_layout(pad=0.5)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, transparent=False, facecolor="white")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voxel-file", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--x-ribs", type=int, default=10)
    parser.add_argument("--y-ribs", type=int, default=10)
    parser.add_argument("--simplify", type=float, default=1.25)
    args = parser.parse_args()

    data = np.load(args.voxel_file)
    occupancy = data["occupancy"].astype(bool)
    bounds = data["bounds"].astype(np.float64)

    ribs = []
    ribs.extend(extract_x_ribs(occupancy, bounds, args.x_ribs, args.simplify))
    ribs.extend(extract_y_ribs(occupancy, bounds, args.y_ribs, args.simplify))

    args.output_dir.mkdir(parents=True, exist_ok=True)
    obj_path = args.output_dir / "dino-rib-assembly.obj"
    render_path = args.output_dir / "dino-rib-assembly.png"
    view_grid_path = args.output_dir / "dino-rib-assembly-views.png"

    write_rib_obj(obj_path, ribs)
    render_ribs(render_path, ribs, bounds)
    render_view_grid(view_grid_path, ribs, bounds)

    print(f"ribs: {len(ribs)} ({sum(rib.axis == 'x' for rib in ribs)} x-axis, {sum(rib.axis == 'y' for rib in ribs)} y-axis)")
    print(f"wrote {obj_path}")
    print(f"wrote {render_path}")
    print(f"wrote {view_grid_path}")


if __name__ == "__main__":
    main()
