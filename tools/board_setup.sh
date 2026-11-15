#!/usr/bin/env bash
# Set up the BioSpectra device side on an Arduino UNO Q (Debian 13, Python 3.13).
# Run on the board as user `arduino` (over `adb shell` or SSH). No sudo needed.
#
#   bash tools/board_setup.sh            # first time: clone, venv, deps
#   bash tools/board_setup.sh --measure  # also measure the device models
#
# Debian on the board ships without python3-venv/ensurepip, so we use uv
# (single static binary from its GitHub release) to create the environment.
set -euo pipefail

UV_VERSION=0.13.8
REPO=https://github.com/stepkono/ecco.git
DIR="$HOME/spetrum"
UV="$HOME/.local/bin/uv"

if [ ! -x "$UV" ]; then
  echo "[setup] installing uv $UV_VERSION"
  mkdir -p "$HOME/.local/bin" /tmp/uvdl
  curl -sSL -o /tmp/uvdl/uv.tar.gz \
    "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-aarch64-unknown-linux-gnu.tar.gz"
  tar xzf /tmp/uvdl/uv.tar.gz -C /tmp/uvdl
  cp /tmp/uvdl/uv-aarch64-unknown-linux-gnu/uv "$UV"
fi

if [ -d "$DIR/.git" ]; then
  echo "[setup] updating $DIR"
  git -C "$DIR" pull --ff-only
else
  echo "[setup] cloning $REPO"
  git clone -q "$REPO" "$DIR"
fi

cd "$DIR"
[ -d .venv ] || "$UV" venv -q --python /usr/bin/python3 .venv
# Device set: LiteRT models only (birdnet-2.4-int8, yamnet-tflite). No TensorFlow, no Gradio.
"$UV" pip install -q --python .venv birdnet==1.4.0 kagglehub==1.0.3 numpy scipy soundfile pyyaml psutil websockets==17.4
echo "[setup] python: $(.venv/bin/python --version)"

command -v ffmpeg >/dev/null || echo "[setup] note: ffmpeg missing. Needed to decode mp3/mp4 on the board: sudo apt install ffmpeg"
arecord -l 2>/dev/null | grep -E "^card" || echo "[setup] no microphone detected yet (arecord -l)"

if [ "${1:-}" = "--measure" ]; then
  for m in yamnet-tflite birdnet-2.4-int8; do
    .venv/bin/python -m core.measure --model "$m" --threads 4 --windows 10 2>/dev/null | grep BIOSPECTRA_RESULT
  done
fi
echo "[setup] done"
