#!/usr/bin/env python
"""Run the current MVP image-to-paperlamp pipeline for one uploaded job."""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path

import trimesh


def run(command: list[str]) -> None:
    print(" ".join(command), flush=True)
    subprocess.run(command, check=True)


def write_manifest(image_dir: Path, mask_dir: Path, manifest_path: Path, max_views: int) -> int:
    images = sorted(
        path for path in image_dir.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if len(images) < 10:
        raise RuntimeError("At least 10 images are required for the MVP visual-hull pipeline.")

    if len(images) > max_views:
        indexes = [round(i * (len(images) - 1) / (max_views - 1)) for i in range(max_views)]
        images = [images[index] for index in indexes]

    with manifest_path.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["image", "mask", "azimuth", "elevation"])
        writer.writeheader()
        for index, image_path in enumerate(images):
            azimuth = 360.0 * index / len(images)
            mask_path = mask_dir / f"{image_path.stem}_mask.png"
            writer.writerow(
                {
                    "image": str(image_path.relative_to(manifest_path.parent)),
                    "mask": str(mask_path.relative_to(manifest_path.parent)),
                    "azimuth": f"{azimuth:.6f}",
                    "elevation": "5",
                }
            )
    return len(images)


def export_glb(input_mesh: Path, output_glb: Path) -> None:
    mesh = trimesh.load(input_mesh, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise RuntimeError(f"Expected a single mesh, got {type(mesh)!r}")

    mesh.visual = trimesh.visual.ColorVisuals(mesh, face_colors=[198, 139, 58, 255])
    output_glb.write_bytes(trimesh.exchange.gltf.export_glb(mesh))
    print(output_glb, flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-dir", type=Path, required=True)
    parser.add_argument("--max-views", type=int, default=15)
    parser.add_argument("--resolution", type=int, default=104)
    parser.add_argument("--face-count", type=int, default=320)
    parser.add_argument("--python", default=sys.executable)
    parser.add_argument("--skip-segmentation", action="store_true")
    parser.add_argument("--colored-svg", action="store_true")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    image_dir = args.job_dir / "images"
    mask_dir = args.job_dir / "masks-ai-isnet"
    output_dir = args.job_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.job_dir / "turntable-ai-isnet-manifest.csv"

    if not args.skip_segmentation:
        run(
            [
                args.python,
                str(script_dir / "make-ai-foreground-masks.py"),
                "--image-dir",
                str(image_dir),
                "--output-dir",
                str(mask_dir),
                "--model",
                "isnet-general-use",
                "--contact-sheet",
                str(output_dir / "segmentation-contact-sheet.jpg"),
            ]
        )

    view_count = write_manifest(image_dir, mask_dir, manifest_path, args.max_views)
    prefix = "paperlamp-mvp"

    run(
        [
            args.python,
            str(script_dir / "build-turntable-visual-hull.py"),
            "--image-dir",
            str(args.job_dir),
            "--view-manifest",
            str(manifest_path),
            "--output-dir",
            str(output_dir),
            "--name-prefix",
            prefix,
            "--resolution",
            str(args.resolution),
            "--min-consensus",
            "0.80",
            "--mask-threshold",
            "1",
            "--mask-close-radius",
            "1",
            "--normalize-mask-crop",
            "--crop-padding",
            "0.18",
        ]
    )

    hull_obj = output_dir / f"{prefix}-visual-hull.obj"
    run(
        [
            args.python,
            str(script_dir / "render-faceted-shell.py"),
            "--input-mesh",
            str(hull_obj),
            "--output-dir",
            str(output_dir),
            "--face-counts",
            str(args.face_count),
            "--name-prefix",
            f"{prefix}-visual-hull",
        ]
    )

    shell_obj = output_dir / f"{prefix}-visual-hull-faceted-shell-{args.face_count}.obj"
    svg_path = output_dir / "paperlamp-net.svg"
    run(
        [
            args.python,
            str(script_dir / "export-connected-nets.py"),
            "--input-mesh",
            str(shell_obj),
            "--output-svg",
            str(svg_path),
            "--target-max-mm",
            "260",
            "--max-faces-per-island",
            "32",
            "--color-mode",
            "sampled" if args.colored_svg else "plain",
            "--source-image-dir",
            str(image_dir),
        ]
    )

    glb_path = output_dir / "paperlamp-model.glb"
    export_glb(shell_obj, glb_path)
    print(f"completed views={view_count} model={glb_path} svg={svg_path}", flush=True)


if __name__ == "__main__":
    main()
