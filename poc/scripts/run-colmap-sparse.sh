#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 4 ]; then
  echo "Usage: $0 <image-dir> <workspace-dir> [camera-model] [camera-params]"
  echo "Example SIMPLE_PINHOLE params: 138.88887889922103,50,50"
  echo "Example PINHOLE params: 3310.4,3325.5,316.73,200.55"
  exit 2
fi

image_dir="$1"
workspace_dir="$2"
camera_model="${3:-}"
camera_params="${4:-}"

if [ ! -d "$image_dir" ]; then
  echo "Image directory does not exist: $image_dir"
  exit 1
fi

if { [ -n "$camera_model" ] && [ -z "$camera_params" ]; } || { [ -z "$camera_model" ] && [ -n "$camera_params" ]; }; then
  echo "Camera model and camera params must be provided together."
  exit 2
fi

mkdir -p "$workspace_dir/sparse"

feature_args=(
  colmap feature_extractor
  --database_path "$workspace_dir/database.db"
  --image_path "$image_dir"
  --ImageReader.single_camera 1
  --SiftExtraction.use_gpu false
)

if [ -n "$camera_model" ]; then
  feature_args+=(
    --ImageReader.camera_model "$camera_model"
    --ImageReader.camera_params "$camera_params"
  )
fi

/opt/anaconda3/bin/conda run -n paperlamp-poc "${feature_args[@]}"

/opt/anaconda3/bin/conda run -n paperlamp-poc colmap exhaustive_matcher \
  --database_path "$workspace_dir/database.db" \
  --SiftMatching.use_gpu false

mapper_args=(
  colmap mapper
  --database_path "$workspace_dir/database.db" \
  --image_path "$image_dir" \
  --output_path "$workspace_dir/sparse"
)

if [ -n "$camera_model" ]; then
  mapper_args+=(
    --Mapper.ba_refine_focal_length false
    --Mapper.ba_refine_principal_point false
    --Mapper.ba_refine_extra_params false
  )
fi

/opt/anaconda3/bin/conda run -n paperlamp-poc "${mapper_args[@]}"
