#!/usr/bin/env python
"""Create rough foreground masks for controlled real-photo tests.

This is a lightweight fallback before adding a real AI segmentation model.
It works best when the object is central and visually distinct from the
background. It is intentionally conservative and should be visually inspected.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from skimage import color, measure, morphology


def largest_component(mask: np.ndarray) -> np.ndarray:
    labels = measure.label(mask)
    if labels.max() == 0:
        return mask
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    return labels == int(sizes.argmax())


def make_mask(path: Path, close_radius: int, dilate_radius: int, convex_hull: bool) -> np.ndarray:
    image = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255.0
    hsv = color.rgb2hsv(image)
    value = hsv[..., 2]
    saturation = hsv[..., 1]
    height, width = value.shape

    yy, xx = np.mgrid[:height, :width]
    cx = width * 0.5
    cy = height * 0.50
    central = ((xx - cx) / (width * 0.42)) ** 2 + ((yy - cy) / (height * 0.50)) ** 2 < 1.0

    dark_glass = value < 0.34
    colored_label_or_cap = (saturation > 0.22) & (value < 0.96)
    mask = central & (dark_glass | colored_label_or_cap)
    mask = morphology.closing(mask, morphology.disk(close_radius))
    mask = morphology.dilation(mask, morphology.disk(dilate_radius))
    mask = morphology.remove_small_holes(mask, area_threshold=height * width // 30)
    if convex_hull:
        mask = morphology.convex_hull_image(mask)
    else:
        mask = largest_component(mask)
    mask = morphology.closing(mask, morphology.disk(close_radius))
    return mask


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--close-radius", type=int, default=18)
    parser.add_argument("--dilate-radius", type=int, default=12)
    parser.add_argument("--convex-hull", action="store_true")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for image_path in sorted(args.image_dir.glob("*")):
        if image_path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        mask = make_mask(image_path, args.close_radius, args.dilate_radius, args.convex_hull)
        out_path = args.output_dir / f"{image_path.stem}_mask.png"
        Image.fromarray((mask.astype(np.uint8) * 255), mode="L").save(out_path)
        print(out_path)


if __name__ == "__main__":
    main()
