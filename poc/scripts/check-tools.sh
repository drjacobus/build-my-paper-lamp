#!/usr/bin/env bash
set -u

tools=(
  colmap
  blender
  meshroom_batch
  aliceVision_cameraInit
  meshlabserver
  openscad
)

echo "POC tool availability"
echo

for tool in "${tools[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf "found   %-24s %s\n" "$tool" "$(command -v "$tool")"
  else
    printf "missing %-24s\n" "$tool"
  fi
done

echo
echo "Package managers"

if command -v brew >/dev/null 2>&1; then
  printf "found   %-24s %s\n" "brew" "$(command -v brew)"
else
  printf "missing %-24s\n" "brew"
fi

if command -v conda >/dev/null 2>&1; then
  printf "found   %-24s %s\n" "conda" "$(command -v conda)"
else
  printf "missing %-24s\n" "conda"
fi

echo
echo "Python mesh libraries"

python_bin=""
if command -v /opt/anaconda3/bin/python >/dev/null 2>&1; then
  python_bin="/opt/anaconda3/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  python_bin="$(command -v python3)"
fi

if [ -z "$python_bin" ]; then
  echo "missing python"
  exit 0
fi

echo "python  $python_bin"

for package in trimesh open3d pycolmap shapely numpy scikit-image scipy matplotlib; do
  if "$python_bin" -m pip show "$package" >/dev/null 2>&1; then
    printf "found   %-24s\n" "$package"
  else
    printf "missing %-24s\n" "$package"
  fi
done
