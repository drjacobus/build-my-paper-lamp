#!/usr/bin/env python
"""Create AI foreground masks with rembg for real-photo visual hull tests."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from rembg import new_session, remove
from skimage import measure, morphology


def largest_component(mask: np.ndarray) -> np.ndarray:
    labels = measure.label(mask)
    if labels.max() == 0:
        return mask
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    return labels == int(sizes.argmax())


def clean_alpha_mask(alpha: np.ndarray, threshold: int, close_radius: int, dilate_radius: int) -> np.ndarray:
    mask = alpha >= threshold
    mask = largest_component(mask)
    if close_radius > 0:
        mask = morphology.closing(mask, morphology.disk(close_radius))
    mask = morphology.remove_small_holes(mask, max_size=max(64, mask.size // 250))
    if dilate_radius > 0:
        mask = morphology.dilation(mask, morphology.disk(dilate_radius))
    return mask


def make_contact_sheet(rows: list[tuple[Path, Path]], output_path: Path, thumb_width: int) -> None:
    if not rows:
        return

    thumbs: list[Image.Image] = []
    label_height = 24
    for image_path, mask_path in rows:
        image = Image.open(image_path).convert("RGB")
        mask = Image.open(mask_path).convert("L")
        scale = thumb_width / image.width
        thumb_height = int(round(image.height * scale))
        image_thumb = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        mask_thumb = Image.merge("RGB", (mask, mask, mask)).resize(
            (thumb_width, thumb_height),
            Image.Resampling.NEAREST,
        )

        panel = Image.new("RGB", (thumb_width * 2, thumb_height + label_height), "white")
        panel.paste(image_thumb, (0, label_height))
        panel.paste(mask_thumb, (thumb_width, label_height))
        draw = ImageDraw.Draw(panel)
        draw.text((6, 4), image_path.stem, fill=(20, 20, 20))
        thumbs.append(panel)

    columns = 2
    panel_width, panel_height = thumbs[0].size
    sheet = Image.new(
        "RGB",
        (panel_width * columns, panel_height * ((len(thumbs) + columns - 1) // columns)),
        "white",
    )
    for index, thumb in enumerate(thumbs):
        x = (index % columns) * panel_width
        y = (index // columns) * panel_height
        sheet.paste(thumb, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, quality=92)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--model", default="isnet-general-use")
    parser.add_argument("--alpha-threshold", type=int, default=20)
    parser.add_argument("--close-radius", type=int, default=5)
    parser.add_argument("--dilate-radius", type=int, default=2)
    parser.add_argument("--contact-sheet", type=Path)
    parser.add_argument("--thumb-width", type=int, default=180)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    session = new_session(args.model)
    written: list[tuple[Path, Path]] = []

    for image_path in sorted(args.image_dir.glob("*")):
        if image_path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        image = Image.open(image_path).convert("RGB")
        cutout = remove(image, session=session).convert("RGBA")
        alpha = np.asarray(cutout.getchannel("A"))
        mask = clean_alpha_mask(alpha, args.alpha_threshold, args.close_radius, args.dilate_radius)
        out_path = args.output_dir / f"{image_path.stem}_mask.png"
        Image.fromarray((mask.astype(np.uint8) * 255), mode="L").save(out_path)
        written.append((image_path, out_path))
        print(out_path)

    if args.contact_sheet is not None:
        make_contact_sheet(written, args.contact_sheet, args.thumb_width)
        print(args.contact_sheet)


if __name__ == "__main__":
    main()
