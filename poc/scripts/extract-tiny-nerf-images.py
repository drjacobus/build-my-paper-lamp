#!/usr/bin/env python
"""Extract RGB images from the original tiny NeRF NPZ example dataset."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("npz_path", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    data = np.load(args.npz_path)
    images = data["images"]

    args.output_dir.mkdir(parents=True, exist_ok=True)

    for index, image in enumerate(images):
        output_path = args.output_dir / f"view_{index:03d}.png"
        rgb = (np.clip(image, 0.0, 1.0) * 255).astype(np.uint8)
        Image.fromarray(rgb, mode="RGB").save(output_path)

    print(f"extracted {len(images)} images to {args.output_dir}")


if __name__ == "__main__":
    main()
