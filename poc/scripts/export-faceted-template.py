#!/usr/bin/env python
"""Export a raw labeled SVG template from a triangular low-poly mesh."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
import trimesh


def triangle_2d(points: np.ndarray, scale: float) -> np.ndarray:
    p0, p1, p2 = points * scale
    a = float(np.linalg.norm(p1 - p0))
    b = float(np.linalg.norm(p2 - p1))
    c = float(np.linalg.norm(p2 - p0))
    if a <= 1e-9:
        return np.zeros((3, 2), dtype=np.float64)

    x = (c * c + a * a - b * b) / (2.0 * a)
    y_squared = max(c * c - x * x, 0.0)
    y = math.sqrt(y_squared)
    return np.array([[0.0, 0.0], [a, 0.0], [x, y]], dtype=np.float64)


def edge_key(face: np.ndarray, start: int, end: int) -> tuple[int, int]:
    a = int(face[start])
    b = int(face[end])
    return (a, b) if a < b else (b, a)


def build_edge_ids(faces: np.ndarray) -> dict[tuple[int, int], int]:
    edges = sorted(
        {
            edge_key(face, 0, 1)
            for face in faces
        }
        | {
            edge_key(face, 1, 2)
            for face in faces
        }
        | {
            edge_key(face, 2, 0)
            for face in faces
        }
    )
    return {edge: index + 1 for index, edge in enumerate(edges)}


def text_element(x: float, y: float, content: str, size: float = 2.4) -> str:
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size:.2f}" '
        f'font-family="monospace" text-anchor="middle" fill="#111">{content}</text>'
    )


def template_svg(mesh: trimesh.Trimesh, target_max_mm: float, page_width: float, margin: float, gap: float) -> str:
    max_dimension = float((mesh.bounds[1] - mesh.bounds[0]).max())
    if max_dimension <= 1e-9:
        raise RuntimeError("Mesh has invalid bounds.")
    scale = target_max_mm / max_dimension
    edge_ids = build_edge_ids(mesh.faces)

    cursor_x = margin
    cursor_y = margin
    row_height = 0.0
    placed: list[str] = []

    for face_index, face in enumerate(mesh.faces, start=1):
        points = mesh.vertices[face]
        tri = triangle_2d(points, scale)
        min_xy = tri.min(axis=0)
        max_xy = tri.max(axis=0)
        tri -= min_xy
        width = float((max_xy - min_xy)[0])
        height = float((max_xy - min_xy)[1])

        if cursor_x + width + margin > page_width:
            cursor_x = margin
            cursor_y += row_height + gap
            row_height = 0.0

        placed_tri = tri + np.array([cursor_x, cursor_y])
        points_attr = " ".join(f"{x:.2f},{y:.2f}" for x, y in placed_tri)
        placed.append(f'<polygon points="{points_attr}" fill="none" stroke="#111" stroke-width="0.25" />')

        centroid = placed_tri.mean(axis=0)
        placed.append(text_element(float(centroid[0]), float(centroid[1]), f"F{face_index}", size=2.1))

        edge_pairs = [(0, 1), (1, 2), (2, 0)]
        for edge_start, edge_end in edge_pairs:
            midpoint = (placed_tri[edge_start] + placed_tri[edge_end]) / 2.0
            edge_id = edge_ids[edge_key(face, edge_start, edge_end)]
            placed.append(text_element(float(midpoint[0]), float(midpoint[1]), f"E{edge_id}", size=1.8))

        cursor_x += width + gap
        row_height = max(row_height, height)

    page_height = cursor_y + row_height + margin
    header = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{page_width:.2f}mm" '
        f'height="{page_height:.2f}mm" viewBox="0 0 {page_width:.2f} {page_height:.2f}">',
        '<rect x="0" y="0" width="100%" height="100%" fill="white"/>',
        '<g>',
    ]
    footer = ["</g>", "</svg>"]
    return "\n".join(header + placed + footer) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-mesh", type=Path, required=True)
    parser.add_argument("--output-svg", type=Path, required=True)
    parser.add_argument("--target-max-mm", type=float, default=250.0)
    parser.add_argument("--page-width-mm", type=float, default=760.0)
    parser.add_argument("--margin-mm", type=float, default=10.0)
    parser.add_argument("--gap-mm", type=float, default=4.0)
    args = parser.parse_args()

    mesh = trimesh.load(args.input_mesh, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise RuntimeError(f"Expected a single mesh, got {type(mesh)!r}")
    if not mesh.is_watertight:
        print("warning: mesh is not watertight; template edge labels may include open boundaries")

    args.output_svg.parent.mkdir(parents=True, exist_ok=True)
    args.output_svg.write_text(
        template_svg(
            mesh=mesh,
            target_max_mm=args.target_max_mm,
            page_width=args.page_width_mm,
            margin=args.margin_mm,
            gap=args.gap_mm,
        )
    )
    print(f"wrote {args.output_svg} from {len(mesh.faces)} faces")


if __name__ == "__main__":
    main()
