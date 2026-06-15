#!/usr/bin/env python
"""Build a rough visual hull and rib SVG from calibrated silhouette images."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from skimage import measure, morphology


DINO_BOUNDS = np.array(
    [
        [-0.021897, 0.021126, -0.017845],
        [0.050897, 0.108227, 0.055495],
    ],
    dtype=np.float64,
)


@dataclass(frozen=True)
class Camera:
    image_name: str
    projection: np.ndarray


def parse_cameras(path: Path) -> dict[str, Camera]:
    lines = path.read_text().strip().splitlines()
    cameras: dict[str, Camera] = {}
    for line in lines[1:]:
        parts = line.split()
        image_name = parts[0]
        values = np.array([float(value) for value in parts[1:]], dtype=np.float64)
        k = values[:9].reshape(3, 3)
        r = values[9:18].reshape(3, 3)
        t = values[18:21].reshape(3, 1)
        projection = k @ np.hstack([r, t])
        cameras[image_name] = Camera(image_name=image_name, projection=projection)
    return cameras


def make_mask(image_path: Path, threshold: float) -> np.ndarray:
    image = np.asarray(Image.open(image_path).convert("RGB"), dtype=np.float32) / 255.0
    grayscale = image.mean(axis=2)
    mask = grayscale > threshold
    mask = morphology.dilation(mask, morphology.disk(10))
    mask = morphology.erosion(mask, morphology.disk(7))
    return mask


def project_points(projection: np.ndarray, points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    homogeneous = np.column_stack([points, np.ones(len(points), dtype=np.float64)])
    projected = homogeneous @ projection.T
    depth = projected[:, 2]
    valid_depth = np.abs(depth) > 1e-12
    uv = np.empty((len(points), 2), dtype=np.float64)
    uv[:] = np.nan
    uv[valid_depth, 0] = projected[valid_depth, 0] / depth[valid_depth]
    uv[valid_depth, 1] = projected[valid_depth, 1] / depth[valid_depth]
    return uv, valid_depth


def write_obj(path: Path, vertices: np.ndarray, faces: np.ndarray) -> None:
    with path.open("w") as file:
        for vertex in vertices:
            file.write(f"v {vertex[0]:.8f} {vertex[1]:.8f} {vertex[2]:.8f}\n")
        for face in faces + 1:
            file.write(f"f {face[0]} {face[1]} {face[2]}\n")


def contour_to_path(contour: np.ndarray, y_values: np.ndarray, z_values: np.ndarray) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for row, col in contour:
        row_index = int(np.clip(round(row), 0, len(y_values) - 1))
        col_index = int(np.clip(round(col), 0, len(z_values) - 1))
        points.append((y_values[row_index] * 1000.0, z_values[col_index] * 1000.0))
    return points


def write_rib_svg(path: Path, occupancy: np.ndarray, bounds: np.ndarray, rib_count: int) -> int:
    x_values = np.linspace(bounds[0, 0], bounds[1, 0], occupancy.shape[0])
    y_values = np.linspace(bounds[0, 1], bounds[1, 1], occupancy.shape[1])
    z_values = np.linspace(bounds[0, 2], bounds[1, 2], occupancy.shape[2])

    occupied_x = np.where(occupancy.any(axis=(1, 2)))[0]
    if len(occupied_x) == 0:
        raise RuntimeError("No occupied voxels found; cannot generate rib SVG.")

    rib_indices = np.linspace(occupied_x.min(), occupied_x.max(), rib_count).round().astype(int)
    contours: list[tuple[int, list[tuple[float, float]]]] = []

    for x_index in rib_indices:
        slice_mask = occupancy[x_index, :, :]
        raw_contours = measure.find_contours(slice_mask.astype(np.float32), 0.5)
        if not raw_contours:
            continue
        largest = max(raw_contours, key=len)
        contours.append((x_index, contour_to_path(largest, y_values, z_values)))

    if not contours:
        raise RuntimeError("No contours found in occupied slices; cannot generate rib SVG.")

    margin = 10.0
    gap = 12.0
    rib_width = (y_values.max() - y_values.min()) * 1000.0
    rib_height = (z_values.max() - z_values.min()) * 1000.0
    sheet_width = margin * 2 + len(contours) * rib_width + (len(contours) - 1) * gap
    sheet_height = margin * 2 + rib_height + 14.0

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{sheet_width:.2f}mm" '
        f'height="{sheet_height:.2f}mm" viewBox="0 0 {sheet_width:.2f} {sheet_height:.2f}">',
        '<g fill="none" stroke="black" stroke-width="0.25">',
    ]

    for rib_number, (x_index, points) in enumerate(contours, start=1):
        offset_x = margin + (rib_number - 1) * (rib_width + gap)
        offset_y = margin + rib_height
        path_parts = []
        for point_index, (y_mm, z_mm) in enumerate(points):
            x = offset_x + (y_mm - y_values.min() * 1000.0)
            y = offset_y - (z_mm - z_values.min() * 1000.0)
            command = "M" if point_index == 0 else "L"
            path_parts.append(f"{command} {x:.2f} {y:.2f}")
        path_parts.append("Z")
        x_world = x_values[x_index] * 1000.0
        lines.append(f'<path d="{" ".join(path_parts)}" />')
        lines.append(
            f'<text x="{offset_x:.2f}" y="{sheet_height - 4:.2f}" '
            f'font-size="3" fill="black" stroke="none">rib {rib_number}: x={x_world:.1f}mm</text>'
        )

    lines.extend(["</g>", "</svg>"])
    path.write_text("\n".join(lines) + "\n")
    return len(contours)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--camera-file", type=Path, required=True)
    parser.add_argument("--silhouette-list", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--resolution", type=int, default=64)
    parser.add_argument("--threshold", type=float, default=0.19)
    parser.add_argument("--min-consensus", type=float, default=0.9)
    parser.add_argument("--rib-count", type=int, default=12)
    args = parser.parse_args()

    cameras = parse_cameras(args.camera_file)
    image_names = [
        line.strip()
        for line in args.silhouette_list.read_text().splitlines()
        if line.strip()
    ]

    axes = [np.linspace(DINO_BOUNDS[0, axis], DINO_BOUNDS[1, axis], args.resolution) for axis in range(3)]
    grid = np.stack(np.meshgrid(*axes, indexing="ij"), axis=-1)
    points = grid.reshape(-1, 3)

    votes = np.zeros(len(points), dtype=np.uint16)
    valid_views = np.zeros(len(points), dtype=np.uint16)

    for image_name in image_names:
        camera = cameras[image_name]
        mask = make_mask(args.image_dir / image_name, args.threshold)
        uv, valid_depth = project_points(camera.projection, points)
        u = np.rint(uv[:, 0]).astype(np.int64)
        v = np.rint(uv[:, 1]).astype(np.int64)
        inside = valid_depth & (u >= 0) & (v >= 0) & (u < mask.shape[1]) & (v < mask.shape[0])
        valid_views[inside] += 1
        visible = np.zeros(len(points), dtype=bool)
        visible[inside] = mask[v[inside], u[inside]]
        votes[visible] += 1

    required_votes = np.ceil(valid_views * args.min_consensus).astype(np.uint16)
    occupancy = (valid_views > 0) & (votes >= required_votes)
    occupancy_grid = occupancy.reshape((args.resolution, args.resolution, args.resolution))

    args.output_dir.mkdir(parents=True, exist_ok=True)
    voxel_path = args.output_dir / "dino-visual-hull-voxels.npz"
    obj_path = args.output_dir / "dino-visual-hull.obj"
    svg_path = args.output_dir / "dino-visual-hull-ribs.svg"

    np.savez_compressed(
        voxel_path,
        occupancy=occupancy_grid,
        bounds=DINO_BOUNDS,
        resolution=args.resolution,
        threshold=args.threshold,
        min_consensus=args.min_consensus,
    )

    padded = np.pad(occupancy_grid.astype(np.float32), 1)
    spacing = (DINO_BOUNDS[1] - DINO_BOUNDS[0]) / (args.resolution - 1)
    vertices, faces, _, _ = measure.marching_cubes(padded, level=0.5, spacing=spacing)
    vertices += DINO_BOUNDS[0] - spacing
    write_obj(obj_path, vertices, faces)
    rib_total = write_rib_svg(svg_path, occupancy_grid, DINO_BOUNDS, args.rib_count)

    occupied = int(occupancy_grid.sum())
    print(f"occupied voxels: {occupied}/{occupancy_grid.size}")
    print(f"wrote {voxel_path}")
    print(f"wrote {obj_path} ({len(vertices)} vertices, {len(faces)} faces)")
    print(f"wrote {svg_path} ({rib_total} ribs)")


if __name__ == "__main__":
    main()
