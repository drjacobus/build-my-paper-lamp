#!/usr/bin/env python
"""Build a visual-hull mesh from controlled turntable object images.

This is a Phase 1A image-to-mesh candidate. It assumes a controlled capture:
the object stays centered, the camera/object rotates around the vertical axis,
and each image has an approximate azimuth/elevation angle.

The script can either infer angles from benchmark filenames such as
`view_e+14_000.png`, or read a CSV manifest with:

    image,azimuth,elevation
"""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image
from skimage import measure, morphology


VIEW_RE = re.compile(r"view_e(?P<elev>[+-]\d+)_(?P<index>\d+)\.png$")


@dataclass(frozen=True)
class TurntableView:
    path: Path
    elevation: float
    index: int
    azimuth: float
    mask_path: Path | None = None


def resolve_manifest_image(image_dir: Path, manifest_path: Path, image_value: str) -> Path:
    image_path = Path(image_value)
    if image_path.is_absolute():
        return image_path

    image_dir_candidate = image_dir / image_path
    if image_dir_candidate.exists():
        return image_dir_candidate

    return manifest_path.parent / image_path


def load_manifest(image_dir: Path, manifest_path: Path) -> list[TurntableView]:
    views: list[TurntableView] = []
    with manifest_path.open(newline="") as file:
        reader = csv.DictReader(file)
        required_fields = {"image", "azimuth"}
        if not reader.fieldnames or not required_fields.issubset(reader.fieldnames):
            raise RuntimeError(f"{manifest_path} must contain at least image and azimuth columns")

        for index, row in enumerate(reader):
            image_value = (row.get("image") or "").strip()
            azimuth_value = (row.get("azimuth") or "").strip()
            elevation_value = (row.get("elevation") or "0").strip() or "0"
            if not image_value or not azimuth_value:
                raise RuntimeError(f"{manifest_path} row {index + 2} is missing image or azimuth")

            image_path = resolve_manifest_image(image_dir, manifest_path, image_value)
            if not image_path.exists():
                raise RuntimeError(f"{manifest_path} row {index + 2} image does not exist: {image_path}")
            mask_value = (row.get("mask") or "").strip()
            mask_path = resolve_manifest_image(image_dir, manifest_path, mask_value) if mask_value else None
            if mask_path is not None and not mask_path.exists():
                raise RuntimeError(f"{manifest_path} row {index + 2} mask does not exist: {mask_path}")

            views.append(
                TurntableView(
                    path=image_path,
                    elevation=float(elevation_value),
                    index=index,
                    azimuth=float(azimuth_value),
                    mask_path=mask_path,
                )
            )

    if not views:
        raise RuntimeError(f"No turntable views found in {manifest_path}")
    return views


def discover_views(
    image_dir: Path,
    views_per_elevation: int | None,
    manifest_path: Path | None,
) -> list[TurntableView]:
    if manifest_path is not None:
        return load_manifest(image_dir, manifest_path)

    grouped: dict[int, list[tuple[int, Path]]] = {}
    for path in sorted(image_dir.glob("view_e*.png")):
        match = VIEW_RE.match(path.name)
        if not match:
            continue
        elevation = int(match.group("elev"))
        index = int(match.group("index"))
        grouped.setdefault(elevation, []).append((index, path))

    views: list[TurntableView] = []
    for elevation, items in sorted(grouped.items()):
        items = sorted(items)
        total = views_per_elevation or len(items)
        for index, path in items:
            views.append(
                TurntableView(
                    path=path,
                    elevation=float(elevation),
                    index=index,
                    azimuth=360.0 * float(index) / float(total),
                )
            )
    if not views:
        raise RuntimeError(f"No turntable images found in {image_dir}")
    return views


def estimate_background_color(image: np.ndarray, sample_size: int = 32) -> np.ndarray:
    samples = np.concatenate(
        [
            image[:sample_size, :sample_size].reshape(-1, 3),
            image[:sample_size, -sample_size:].reshape(-1, 3),
            image[-sample_size:, :sample_size].reshape(-1, 3),
            image[-sample_size:, -sample_size:].reshape(-1, 3),
        ],
        axis=0,
    )
    return np.median(samples, axis=0)


def make_mask(image_path: Path, threshold: int, close_radius: int, mask_mode: str) -> np.ndarray:
    image = np.asarray(Image.open(image_path).convert("RGB"), dtype=np.int16)
    if mask_mode == "background":
        background = estimate_background_color(image)
        distance = np.linalg.norm(image.astype(np.float32) - background.astype(np.float32), axis=2)
        mask = distance > threshold
    else:
        distance_from_white = 255 - image.min(axis=2)
        mask = distance_from_white > threshold
    if close_radius > 0:
        footprint = morphology.disk(close_radius)
        mask = morphology.closing(mask, footprint)
        mask = morphology.dilation(mask, footprint)
    return mask


def normalize_mask_crop(mask: np.ndarray, padding_ratio: float) -> np.ndarray:
    rows, cols = np.nonzero(mask)
    if len(rows) == 0:
        return mask

    y_min, y_max = int(rows.min()), int(rows.max()) + 1
    x_min, x_max = int(cols.min()), int(cols.max()) + 1
    box_height = y_max - y_min
    box_width = x_max - x_min
    side = int(np.ceil(max(box_width, box_height) * (1.0 + padding_ratio * 2.0)))
    center_y = (y_min + y_max) / 2.0
    center_x = (x_min + x_max) / 2.0

    src_y0 = int(np.floor(center_y - side / 2.0))
    src_x0 = int(np.floor(center_x - side / 2.0))
    src_y1 = src_y0 + side
    src_x1 = src_x0 + side

    square = np.zeros((side, side), dtype=bool)
    copy_y0 = max(0, src_y0)
    copy_x0 = max(0, src_x0)
    copy_y1 = min(mask.shape[0], src_y1)
    copy_x1 = min(mask.shape[1], src_x1)
    dst_y0 = copy_y0 - src_y0
    dst_x0 = copy_x0 - src_x0
    square[dst_y0 : dst_y0 + copy_y1 - copy_y0, dst_x0 : dst_x0 + copy_x1 - copy_x0] = mask[
        copy_y0:copy_y1,
        copy_x0:copy_x1,
    ]

    resized = Image.fromarray((square.astype(np.uint8) * 255), mode="L").resize(
        (mask.shape[1], mask.shape[0]),
        Image.Resampling.NEAREST,
    )
    return np.asarray(resized, dtype=np.uint8) > 0


def load_view_mask(
    view: TurntableView,
    threshold: int,
    close_radius: int,
    mask_mode: str,
    normalize_crop: bool,
    crop_padding: float,
) -> np.ndarray:
    if view.mask_path is None:
        mask = make_mask(view.path, threshold, close_radius, mask_mode)
    else:
        mask_image = np.asarray(Image.open(view.mask_path).convert("L"), dtype=np.uint8)
        mask = mask_image > threshold

    if close_radius > 0:
        footprint = morphology.disk(close_radius)
        mask = morphology.closing(mask, footprint)
        mask = morphology.dilation(mask, footprint)
    if normalize_crop:
        mask = normalize_mask_crop(mask, crop_padding)
    return mask


def camera_axes(azimuth_deg: float, elevation_deg: float) -> tuple[np.ndarray, np.ndarray]:
    azimuth = np.deg2rad(azimuth_deg)
    elevation = np.deg2rad(elevation_deg)
    view = np.array(
        [
            np.cos(elevation) * np.cos(azimuth),
            np.cos(elevation) * np.sin(azimuth),
            np.sin(elevation),
        ],
        dtype=np.float64,
    )
    view /= np.linalg.norm(view)

    world_up = np.array([0.0, 0.0, 1.0], dtype=np.float64)
    right = np.cross(world_up, view)
    if np.linalg.norm(right) < 1e-9:
        right = np.array([1.0, 0.0, 0.0], dtype=np.float64)
    else:
        right /= np.linalg.norm(right)

    up = np.cross(view, right)
    up /= np.linalg.norm(up)
    return right, up


def project_orthographic(
    points: np.ndarray,
    view: TurntableView,
    image_shape: tuple[int, int],
    projection_bound: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    right, up = camera_axes(view.azimuth, view.elevation)
    x = points @ right
    y = points @ up
    height, width = image_shape
    u = np.rint((x / projection_bound + 1.0) * 0.5 * (width - 1)).astype(np.int64)
    v = np.rint((1.0 - (y / projection_bound + 1.0) * 0.5) * (height - 1)).astype(np.int64)
    inside = (u >= 0) & (v >= 0) & (u < width) & (v < height)
    return u, v, inside


def clean_occupancy(occupancy: np.ndarray) -> np.ndarray:
    occupancy = morphology.closing(occupancy, morphology.ball(1))
    labels = measure.label(occupancy)
    if labels.max() == 0:
        return occupancy
    component_sizes = np.bincount(labels.ravel())
    component_sizes[0] = 0
    largest_label = int(component_sizes.argmax())
    return labels == largest_label


def write_obj(path: Path, vertices: np.ndarray, faces: np.ndarray) -> None:
    with path.open("w") as file:
        for vertex in vertices:
            file.write(f"v {vertex[0]:.8f} {vertex[1]:.8f} {vertex[2]:.8f}\n")
        for face in faces + 1:
            file.write(f"f {face[0]} {face[1]} {face[2]}\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--view-manifest", type=Path, default=None)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--name-prefix", default="turntable")
    parser.add_argument("--resolution", type=int, default=96)
    parser.add_argument("--views-per-elevation", type=int, default=None)
    parser.add_argument("--grid-bound", type=float, default=0.62)
    parser.add_argument("--projection-bound", type=float, default=0.62)
    parser.add_argument("--mask-threshold", type=int, default=18)
    parser.add_argument("--mask-mode", choices=("white", "background"), default="white")
    parser.add_argument("--mask-close-radius", type=int, default=2)
    parser.add_argument("--normalize-mask-crop", action="store_true")
    parser.add_argument("--crop-padding", type=float, default=0.20)
    parser.add_argument("--min-consensus", type=float, default=0.9)
    parser.add_argument("--no-clean", action="store_true")
    args = parser.parse_args()

    views = discover_views(args.image_dir, args.views_per_elevation, args.view_manifest)
    axes = [np.linspace(-args.grid_bound, args.grid_bound, args.resolution) for _ in range(3)]
    grid = np.stack(np.meshgrid(*axes, indexing="ij"), axis=-1)
    points = grid.reshape(-1, 3)

    votes = np.zeros(len(points), dtype=np.uint16)
    valid_views = np.zeros(len(points), dtype=np.uint16)

    for view in views:
        mask = load_view_mask(
            view,
            args.mask_threshold,
            args.mask_close_radius,
            args.mask_mode,
            args.normalize_mask_crop,
            args.crop_padding,
        )
        u, v, inside = project_orthographic(points, view, mask.shape, args.projection_bound)
        valid_views[inside] += 1
        visible = np.zeros(len(points), dtype=bool)
        visible[inside] = mask[v[inside], u[inside]]
        votes[visible] += 1

    required_votes = np.ceil(valid_views * args.min_consensus).astype(np.uint16)
    occupancy = (valid_views > 0) & (votes >= required_votes)
    occupancy_grid = occupancy.reshape((args.resolution, args.resolution, args.resolution))
    raw_occupied = int(occupancy_grid.sum())
    if not args.no_clean:
        occupancy_grid = clean_occupancy(occupancy_grid)

    if occupancy_grid.sum() == 0:
        raise RuntimeError("No occupied voxels found; lower --min-consensus or mask threshold.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    voxel_path = args.output_dir / f"{args.name_prefix}-visual-hull-voxels.npz"
    obj_path = args.output_dir / f"{args.name_prefix}-visual-hull.obj"
    bounds = np.array(
        [
            [-args.grid_bound, -args.grid_bound, -args.grid_bound],
            [args.grid_bound, args.grid_bound, args.grid_bound],
        ],
        dtype=np.float64,
    )
    np.savez_compressed(
        voxel_path,
        occupancy=occupancy_grid,
        bounds=bounds,
        resolution=args.resolution,
        grid_bound=args.grid_bound,
        projection_bound=args.projection_bound,
        mask_threshold=args.mask_threshold,
        mask_mode=args.mask_mode,
        normalize_mask_crop=args.normalize_mask_crop,
        crop_padding=args.crop_padding,
        min_consensus=args.min_consensus,
        views=len(views),
    )

    padded = np.pad(occupancy_grid.astype(np.float32), 1)
    spacing = (bounds[1] - bounds[0]) / (args.resolution - 1)
    vertices, faces, _, _ = measure.marching_cubes(padded, level=0.5, spacing=spacing)
    vertices += bounds[0] - spacing
    write_obj(obj_path, vertices, faces)

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    print(f"views: {len(views)}")
    print(f"occupied voxels: {int(occupancy_grid.sum())}/{occupancy_grid.size} (raw: {raw_occupied})")
    print(f"mesh: {len(vertices)} vertices, {len(faces)} faces, watertight={mesh.is_watertight}")
    print(f"wrote {voxel_path}")
    print(f"wrote {obj_path}")


if __name__ == "__main__":
    main()
