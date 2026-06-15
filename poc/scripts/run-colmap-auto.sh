#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <image-dir> <workspace-dir>"
  exit 2
fi

image_dir="$1"
workspace_dir="$2"

if [ ! -d "$image_dir" ]; then
  echo "Image directory does not exist: $image_dir"
  exit 1
fi

mkdir -p "$workspace_dir"

/opt/anaconda3/bin/conda run -n paperlamp-poc colmap automatic_reconstructor \
  --image_path "$image_dir" \
  --workspace_path "$workspace_dir" \
  --data_type individual \
  --quality medium
