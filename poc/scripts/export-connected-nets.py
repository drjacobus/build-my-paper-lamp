#!/usr/bin/env python
"""Export connected triangle net islands with simple glue tabs."""

from __future__ import annotations

import argparse
import math
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image
from shapely.geometry import Polygon


@dataclass
class PlacedFace:
    face_index: int
    points: np.ndarray


@dataclass
class NetIsland:
    faces: dict[int, PlacedFace]


def ordered_edge(face: np.ndarray, start: int, end: int) -> tuple[int, int]:
    return int(face[start]), int(face[end])


def edge_key(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def build_edge_ids(faces: np.ndarray) -> dict[tuple[int, int], int]:
    edges: set[tuple[int, int]] = set()
    for face in faces:
        edges.add(edge_key(int(face[0]), int(face[1])))
        edges.add(edge_key(int(face[1]), int(face[2])))
        edges.add(edge_key(int(face[2]), int(face[0])))
    return {edge: index + 1 for index, edge in enumerate(sorted(edges))}


def triangle_2d(points: np.ndarray, scale: float) -> np.ndarray:
    p0, p1, p2 = points * scale
    a = float(np.linalg.norm(p1 - p0))
    b = float(np.linalg.norm(p2 - p1))
    c = float(np.linalg.norm(p2 - p0))
    if a <= 1e-9:
        return np.zeros((3, 2), dtype=np.float64)

    x = (c * c + a * a - b * b) / (2.0 * a)
    y = math.sqrt(max(c * c - x * x, 0.0))
    return np.array([[0.0, 0.0], [a, 0.0], [x, y]], dtype=np.float64)


def build_adjacency(faces: np.ndarray) -> tuple[dict[int, list[tuple[int, tuple[int, int]]]], dict[tuple[int, int], list[int]]]:
    edge_to_faces: dict[tuple[int, int], list[int]] = defaultdict(list)
    for face_index, face in enumerate(faces):
        for start, end in [(0, 1), (1, 2), (2, 0)]:
            edge_to_faces[edge_key(int(face[start]), int(face[end]))].append(face_index)

    adjacency: dict[int, list[tuple[int, tuple[int, int]]]] = defaultdict(list)
    for edge, owners in edge_to_faces.items():
        if len(owners) != 2:
            continue
        a, b = owners
        adjacency[a].append((b, edge))
        adjacency[b].append((a, edge))
    return adjacency, edge_to_faces


def signed_area_2d(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    edge = b - a
    point = c - a
    return float(edge[0] * point[1] - edge[1] * point[0])


def place_neighbor(
    mesh: trimesh.Trimesh,
    current_face_index: int,
    neighbor_face_index: int,
    shared_edge: tuple[int, int],
    placed: dict[int, PlacedFace],
    scale: float,
) -> PlacedFace | None:
    current_face = mesh.faces[current_face_index]
    neighbor_face = mesh.faces[neighbor_face_index]
    a_id, b_id = shared_edge

    current_positions = {
        int(vertex_id): placed[current_face_index].points[local_index]
        for local_index, vertex_id in enumerate(current_face)
    }
    if a_id not in current_positions or b_id not in current_positions:
        return None

    a_2d = current_positions[a_id]
    b_2d = current_positions[b_id]
    current_third_id = next(int(vertex_id) for vertex_id in current_face if int(vertex_id) not in shared_edge)
    current_third_2d = current_positions[current_third_id]

    neighbor_third_id = next(int(vertex_id) for vertex_id in neighbor_face if int(vertex_id) not in shared_edge)
    a_3d = mesh.vertices[a_id] * scale
    b_3d = mesh.vertices[b_id] * scale
    c_3d = mesh.vertices[neighbor_third_id] * scale

    edge = b_2d - a_2d
    edge_length = float(np.linalg.norm(edge))
    if edge_length <= 1e-9:
        return None

    ac = float(np.linalg.norm(c_3d - a_3d))
    bc = float(np.linalg.norm(c_3d - b_3d))
    x = (ac * ac - bc * bc + edge_length * edge_length) / (2.0 * edge_length)
    h = math.sqrt(max(ac * ac - x * x, 0.0))
    unit = edge / edge_length
    perp = np.array([-unit[1], unit[0]], dtype=np.float64)
    base = a_2d + unit * x
    candidates = [base + perp * h, base - perp * h]

    current_side = signed_area_2d(a_2d, b_2d, current_third_2d)
    opposite = [
        candidate
        for candidate in candidates
        if signed_area_2d(a_2d, b_2d, candidate) * current_side < 0.0
    ]
    third_2d = opposite[0] if opposite else candidates[0]

    positions = {
        a_id: a_2d,
        b_id: b_2d,
        neighbor_third_id: third_2d,
    }
    ordered_points = np.array([positions[int(vertex_id)] for vertex_id in neighbor_face], dtype=np.float64)
    return PlacedFace(face_index=neighbor_face_index, points=ordered_points)


def polygon_for(points: np.ndarray) -> Polygon:
    return Polygon([(float(x), float(y)) for x, y in points])


def overlaps_existing(candidate: PlacedFace, existing: dict[int, PlacedFace], epsilon: float = 1e-4) -> bool:
    candidate_poly = polygon_for(candidate.points)
    if not candidate_poly.is_valid or candidate_poly.area <= epsilon:
        return True
    for face in existing.values():
        intersection = candidate_poly.intersection(polygon_for(face.points))
        if intersection.area > epsilon:
            return True
    return False


def unfold_islands(mesh: trimesh.Trimesh, scale: float, max_faces_per_island: int) -> list[NetIsland]:
    adjacency, _ = build_adjacency(mesh.faces)
    unplaced = set(range(len(mesh.faces)))
    islands: list[NetIsland] = []

    while unplaced:
        seed = min(unplaced)
        seed_points = triangle_2d(mesh.vertices[mesh.faces[seed]], scale)
        faces = {seed: PlacedFace(face_index=seed, points=seed_points)}
        unplaced.remove(seed)
        queue: deque[int] = deque([seed])

        while queue and len(faces) < max_faces_per_island:
            current = queue.popleft()
            for neighbor, shared_edge in adjacency[current]:
                if neighbor not in unplaced or len(faces) >= max_faces_per_island:
                    continue
                candidate = place_neighbor(mesh, current, neighbor, shared_edge, faces, scale)
                if candidate is None or overlaps_existing(candidate, faces):
                    continue
                faces[neighbor] = candidate
                unplaced.remove(neighbor)
                queue.append(neighbor)

        islands.append(NetIsland(faces=faces))

    return islands


def island_bounds(island: NetIsland) -> tuple[np.ndarray, np.ndarray]:
    points = np.concatenate([face.points for face in island.faces.values()], axis=0)
    return points.min(axis=0), points.max(axis=0)


def text_element(x: float, y: float, content: str, size: float = 2.3) -> str:
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size:.2f}" '
        f'font-family="monospace" text-anchor="middle" fill="#111">{content}</text>'
    )


def tab_polygon(edge_start: np.ndarray, edge_end: np.ndarray, face_third: np.ndarray, depth: float) -> np.ndarray:
    edge = edge_end - edge_start
    edge_length = float(np.linalg.norm(edge))
    if edge_length <= 1e-9:
        return np.empty((0, 2), dtype=np.float64)
    unit = edge / edge_length
    perp = np.array([-unit[1], unit[0]], dtype=np.float64)
    side = signed_area_2d(edge_start, edge_end, face_third)
    outward = -perp if side > 0.0 else perp
    inset = min(edge_length * 0.18, depth * 0.85)
    a = edge_start + unit * inset
    b = edge_end - unit * inset
    return np.array([a, b, b + outward * depth, a + outward * depth], dtype=np.float64)


def face_edge_pairs(face: np.ndarray) -> list[tuple[int, int, int, int]]:
    return [
        (0, 1, int(face[0]), int(face[1])),
        (1, 2, int(face[1]), int(face[2])),
        (2, 0, int(face[2]), int(face[0])),
    ]


def html_color(rgb: np.ndarray) -> str:
    values = np.clip(np.rint(rgb), 0, 255).astype(np.uint8)
    return f"#{values[0]:02x}{values[1]:02x}{values[2]:02x}"


def load_source_palette(image_dir: Path | None) -> list[np.ndarray]:
    if image_dir is None:
        return []
    colors: list[np.ndarray] = []
    for image_path in sorted(image_dir.iterdir()):
        if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        image = Image.open(image_path).convert("RGB").resize((96, 96), Image.Resampling.LANCZOS)
        pixels = np.asarray(image, dtype=np.float64).reshape(-1, 3)
        brightness = pixels.mean(axis=1)
        saturation = pixels.max(axis=1) - pixels.min(axis=1)
        foregroundish = (brightness > 25) & (brightness < 245) & (saturation > 8)
        sample = pixels[foregroundish] if foregroundish.any() else pixels
        colors.append(np.median(sample, axis=0))
    return colors


def assign_face_colors(mesh: trimesh.Trimesh, palette: list[np.ndarray]) -> list[str]:
    if not palette:
        return ["none"] * len(mesh.faces)

    palette_array = np.vstack(palette)
    normals = mesh.face_normals
    azimuths = (np.arctan2(normals[:, 1], normals[:, 0]) + 2.0 * np.pi) % (2.0 * np.pi)
    indexes = np.floor(azimuths / (2.0 * np.pi) * len(palette_array)).astype(int) % len(palette_array)
    colors = palette_array[indexes]
    light = 0.82 + 0.18 * np.clip(normals[:, 2], -0.25, 1.0)
    colors = np.clip(colors * light[:, None], 0, 255)
    return [html_color(color) for color in colors]


def render_svg(
    mesh: trimesh.Trimesh,
    islands: list[NetIsland],
    edge_ids: dict[tuple[int, int], int],
    edge_to_faces: dict[tuple[int, int], list[int]],
    output_svg: Path,
    page_width: float,
    margin: float,
    gap: float,
    tab_depth: float,
    face_colors: list[str],
) -> tuple[int, int]:
    cursor_x = margin
    cursor_y = margin + 14.0
    row_height = 0.0
    content: list[str] = []
    tabs = 0

    for island_index, island in enumerate(islands, start=1):
        min_xy, max_xy = island_bounds(island)
        width, height = max_xy - min_xy
        if cursor_x + width + margin > page_width:
            cursor_x = margin
            cursor_y += row_height + gap
            row_height = 0.0

        offset = np.array([cursor_x, cursor_y], dtype=np.float64) - min_xy
        island_face_ids = set(island.faces)
        content.append(f'<g id="island-{island_index}">')

        for placed in island.faces.values():
            face = mesh.faces[placed.face_index]
            points = placed.points + offset

            for local_a, local_b, vertex_a, vertex_b in face_edge_pairs(face):
                key = edge_key(vertex_a, vertex_b)
                owners = set(edge_to_faces[key])
                is_cross_island = len(owners) == 2 and len(owners & island_face_ids) == 1
                should_tab = is_cross_island and placed.face_index == min(owners)
                if should_tab:
                    third_local = next(index for index in [0, 1, 2] if index not in [local_a, local_b])
                    tab = tab_polygon(points[local_a], points[local_b], points[third_local], tab_depth)
                    if len(tab):
                        points_attr = " ".join(f"{x:.2f},{y:.2f}" for x, y in tab)
                        content.append(
                            f'<polygon class="glue-tab" points="{points_attr}" />'
                        )
                        tabs += 1

            points_attr = " ".join(f"{x:.2f},{y:.2f}" for x, y in points)
            fill = face_colors[placed.face_index] if face_colors else "none"
            content.append(f'<polygon class="cut-face" points="{points_attr}" fill="{fill}" />')
            centroid = points.mean(axis=0)
            content.append(text_element(float(centroid[0]), float(centroid[1]), f"F{placed.face_index + 1}", size=2.0))

            for local_a, local_b, vertex_a, vertex_b in face_edge_pairs(face):
                key = edge_key(vertex_a, vertex_b)
                owners = set(edge_to_faces[key])
                is_cross_island = len(owners) == 2 and len(owners & island_face_ids) == 1
                is_boundary = len(owners) == 1
                if is_cross_island or is_boundary:
                    midpoint = (points[local_a] + points[local_b]) / 2.0
                    prefix = "B" if is_boundary else "E"
                    content.append(text_element(float(midpoint[0]), float(midpoint[1]), f"{prefix}{edge_ids[key]}", size=1.7))

        label_x = cursor_x
        label_y = cursor_y + height + 4.0
        content.append(
            f'<text x="{label_x:.2f}" y="{label_y:.2f}" font-size="3.00" '
            f'font-family="monospace" fill="#555">island {island_index}: {len(island.faces)} faces</text>'
        )
        content.append("</g>")

        cursor_x += width + gap
        row_height = max(row_height, height + 8.0)

    page_height = cursor_y + row_height + margin
    header = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{page_width:.2f}mm" '
        f'height="{page_height:.2f}mm" viewBox="0 0 {page_width:.2f} {page_height:.2f}">',
        '<rect x="0" y="0" width="100%" height="100%" fill="white"/>',
        "<style>",
        "polygon, line { vector-effect: non-scaling-stroke; }",
        ".cut-face { stroke: #111; stroke-width: 0.25; }",
        ".glue-tab { fill: none; stroke: #d97706; stroke-width: 0.22; }",
        ".legend { font-family: monospace; font-size: 3px; fill: #444; }",
        "</style>",
        '<text x="10" y="8" class="legend">Build My Paper Lamp - cut black outlines, glue orange tabs, match E labels across islands</text>',
        '<line x1="10" y1="12" x2="24" y2="12" stroke="#111" stroke-width="0.25"/>',
        '<text x="27" y="13" class="legend">cut/fold edge</text>',
        '<line x1="58" y1="12" x2="72" y2="12" stroke="#d97706" stroke-width="0.22"/>',
        '<text x="75" y="13" class="legend">glue tab</text>',
    ]
    output_svg.parent.mkdir(parents=True, exist_ok=True)
    output_svg.write_text("\n".join(header + content + ["</svg>"]) + "\n")
    return tabs, int(math.ceil(page_height))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-mesh", type=Path, required=True)
    parser.add_argument("--output-svg", type=Path, required=True)
    parser.add_argument("--target-max-mm", type=float, default=250.0)
    parser.add_argument("--page-width-mm", type=float, default=760.0)
    parser.add_argument("--margin-mm", type=float, default=10.0)
    parser.add_argument("--gap-mm", type=float, default=8.0)
    parser.add_argument("--tab-depth-mm", type=float, default=5.0)
    parser.add_argument("--max-faces-per-island", type=int, default=24)
    parser.add_argument("--color-mode", choices=("plain", "sampled"), default="plain")
    parser.add_argument("--source-image-dir", type=Path)
    args = parser.parse_args()

    mesh = trimesh.load(args.input_mesh, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise RuntimeError(f"Expected a single mesh, got {type(mesh)!r}")

    max_dimension = float((mesh.bounds[1] - mesh.bounds[0]).max())
    if max_dimension <= 1e-9:
        raise RuntimeError("Mesh has invalid bounds.")
    scale = args.target_max_mm / max_dimension

    islands = unfold_islands(mesh, scale=scale, max_faces_per_island=args.max_faces_per_island)
    edge_ids = build_edge_ids(mesh.faces)
    _, edge_to_faces = build_adjacency(mesh.faces)
    face_colors = (
        assign_face_colors(mesh, load_source_palette(args.source_image_dir))
        if args.color_mode == "sampled"
        else ["none"] * len(mesh.faces)
    )
    tabs, page_height = render_svg(
        mesh=mesh,
        islands=islands,
        edge_ids=edge_ids,
        edge_to_faces=edge_to_faces,
        output_svg=args.output_svg,
        page_width=args.page_width_mm,
        margin=args.margin_mm,
        gap=args.gap_mm,
        tab_depth=args.tab_depth_mm,
        face_colors=face_colors,
    )

    island_sizes = [len(island.faces) for island in islands]
    print(f"faces: {len(mesh.faces)}")
    print(f"islands: {len(islands)}")
    print(f"island size min/max: {min(island_sizes)}/{max(island_sizes)}")
    print(f"tabs: {tabs}")
    print(f"page height: {page_height}mm")
    print(f"wrote {args.output_svg}")


if __name__ == "__main__":
    main()
