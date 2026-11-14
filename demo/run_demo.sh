#!/usr/bin/env bash
# One command for the end-to-end demo on a laptop:
#   backend (labeling page + event screen) + a listening post with the demo playlists.
#
#   bash demo/run_demo.sh            start everything, open the event screen and the labeling page
#   bash demo/run_demo.sh --auto     also run the scripted scenario 3 times (acceptance check)
#   bash demo/run_demo.sh --board    use the UNO Q as the listening post instead of the laptop
#                                    (BOARD_IP, default 10.0.41.141. The board's config.local.yaml must point
#                                    at this laptop's backend. Afterwards restart it normally:
#                                    ssh arduino@BOARD_IP 'bash ~/spetrum/tools/device_ctl.sh start')
#
# Stop with Ctrl+C. Demo data lives in data/demo/ and never touches the real queue or backend.
set -euo pipefail
cd "$(dirname "$0")/.."
export BIOSPECTRA_OVERLAY=demo/config.demo.yaml
PY=.venv/bin/python
AUTO=0; BOARD=0
for arg in "$@"; do
  case "$arg" in --auto) AUTO=1 ;; --board) BOARD=1 ;; *) echo "unknown option $arg"; exit 2 ;; esac
done

[ -f data/demo/manifest.json ] || $PY -m tools.make_demo_set
# the demo backend seeds itself from a copy of the real starting prototypes
mkdir -p data/demo/prototypes
[ -f data/demo/backend/backend.db ] || cp data/prototypes/yamnet-tflite.prototype.json data/demo/prototypes/
pids=()
cleanup() { for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

$PY -m backend.app > data/demo/backend.log 2>&1 & pids+=($!)
until curl -s -o /dev/null http://localhost:8000/stats; do sleep 0.5; done
echo "backend:        http://localhost:8000  (labeling page)"

if [ "$BOARD" = 1 ]; then
  BOARD_IP=${BOARD_IP:-10.0.41.141}
  ssh "arduino@$BOARD_IP" 'mkdir -p ~/spetrum/data/demo/prototypes && rm -rf ~/spetrum/data/demo/queue'
  scp -q -r data/demo/before data/demo/after data/demo/manifest.json "arduino@$BOARD_IP:spetrum/data/demo/"
  scp -q data/prototypes/yamnet-tflite.prototype.json "arduino@$BOARD_IP:spetrum/data/demo/prototypes/"
  ssh "arduino@$BOARD_IP" 'cd ~/spetrum && git pull -q --ff-only; BIOSPECTRA_OVERLAY=demo/config.board.yaml bash tools/device_ctl.sh start' >/dev/null
  until curl -s -o /dev/null "http://$BOARD_IP:8765/"; do sleep 1; done
  sleep 8  # the board loads its model
  DEVICE=http://$BOARD_IP:8765
  TOKEN=$(ssh "arduino@$BOARD_IP" 'cat ~/spetrum/data/console_token')
  echo "device:         the UNO Q at $DEVICE (its config.local.yaml must point at this laptop)"
else
  $PY -m device.console --port 8766 --no-token > data/demo/device.log 2>&1 & pids+=($!)
  until curl -s -o /dev/null http://localhost:8766/; do sleep 0.5; done
  DEVICE=http://localhost:8766; TOKEN=""
  echo "device:         $DEVICE  (developer console of the laptop listening post)"
fi
SCREEN="http://localhost:8000/screen?device=$DEVICE&token=$TOKEN"
echo "event screen:   $SCREEN"
if [ -z "${NO_OPEN:-}" ] && command -v open >/dev/null; then open "$SCREEN"; open "http://localhost:8000/"; fi

if [ "$AUTO" = 1 ]; then
  sleep 2
  $PY -m demo.scenario --runs 3 --device "$DEVICE" --token "$TOKEN"
else
  echo
  echo "Live demo: on the event screen's device console, play data/demo/before once, label the two puzzles"
  echo "on the labeling page (A = crickets, rain = noise), then play data/demo/after. Or run in another terminal:"
  echo "  $PY -m demo.scenario --runs 1 --device $DEVICE --token $TOKEN"
  echo "Ctrl+C stops everything."
  wait
fi
