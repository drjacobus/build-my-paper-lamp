#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export LAMP_JOB_DIR="${LAMP_JOB_DIR:-$HOME/.paperlamp/jobs}"
export PYTHON_BIN="${PYTHON_BIN:-/opt/anaconda3/envs/paperlamp-poc/bin/python}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"

if [ ! -x "$PYTHON_BIN" ]; then
  echo "Missing Python binary: $PYTHON_BIN" >&2
  echo "Create the POC environment first, or set PYTHON_BIN to the correct Python path." >&2
  exit 1
fi

mkdir -p "$LAMP_JOB_DIR"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
echo "Job storage: $LAMP_JOB_DIR"
echo "Python: $PYTHON_BIN"
echo "Host: http://localhost:$PORT"

if [ "$NODE_MAJOR" -ge 20 ]; then
  exec npm run dev -- -H "$HOST" -p "$PORT"
fi

echo "Local node is older than 20; using temporary Node 20 through npx."
exec npx -p node@20 npm run dev -- -H "$HOST" -p "$PORT"
