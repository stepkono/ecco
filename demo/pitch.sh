#!/usr/bin/env bash
# Pitch helper: drive the demo listening post and the backend with one word.
#
#   bash demo/pitch.sh reset    forget everything learned (backend and post start over)
#   bash demo/pitch.sh before   the post hears the unknown sound A and a rain false alarm (about 20 s)
#   bash demo/pitch.sh after    the post hears A, a new recording A2 and the rain again (about 15 s)
#   bash demo/pitch.sh status   what the post knows right now
#
# Start the demo first: NO_OPEN=1 bash demo/run_demo.sh   (or --board for the UNO Q)
# For the UNO Q set DEVICE=http://<board-ip>:8765 and TOKEN=<console token>.
set -euo pipefail
BACKEND=${BACKEND:-http://localhost:8000}
DEVICE=${DEVICE:-http://localhost:8766}
TOKEN=${TOKEN:-}
post() { curl -s -X POST -H 'Content-Type: application/json' -H "X-Token: $TOKEN" -d "${2:-{\}}" "$1" >/dev/null; }
status() {
  curl -s -H "X-Token: $TOKEN" "$DEVICE/api/status" | python3 -c '
import sys, json
d = json.load(sys.stdin)
known = ", ".join(k for k in d["proto_classes"] if not k.startswith("noise:"))
print("post %s: %s, prototypes v%s, knows: %s" % (d["device"], d["mode"], d["proto_version"], known))
print("recognized so far: %s, events sent: %s" % (d["detections_total"] or "nothing", d["events"].get("events_saved", 0)))'
}
play() {
  post "$DEVICE/api/mode" "{\"mode\":\"playlist\",\"path\":\"data/demo/$1\",\"speed\":1,\"loop\":false}"
  echo "playing data/demo/$1 to the post ..."
  for _ in $(seq 1 40); do
    sleep 1
    m=$(curl -s -H "X-Token: $TOKEN" "$DEVICE/api/status" | python3 -c 'import sys, json; print(json.load(sys.stdin)["mode"])')
    [ "$m" = idle ] && break
  done
  status
}
case "${1:-status}" in
  reset)
    post "$BACKEND/demo/reset"
    post "$DEVICE/api/demo/reset"
    sleep 2
    status ;;
  before) play before ;;
  after) play after ;;
  status) status ;;
  *) echo "usage: bash demo/pitch.sh reset|before|after|status"; exit 2 ;;
esac
