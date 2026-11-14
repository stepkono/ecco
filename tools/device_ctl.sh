#!/usr/bin/env bash
# Start, stop and watch the listening post in the background (UNO Q or laptop).
#
#   bash tools/device_ctl.sh start [extra device.main args]   default: --source mic
#   bash tools/device_ctl.sh stop | status | log
#
# From the Mac:  ssh arduino@<board-ip> 'bash ~/spetrum/tools/device_ctl.sh start'
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=data/device.log
PIDFILE=data/device.pid
mkdir -p data

running() { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }

case "${1:-status}" in
  start)
    shift || true
    if running; then kill "$(cat "$PIDFILE")"; sleep 1; fi
    args=("$@"); [ ${#args[@]} -eq 0 ] && args=(--source mic)
    nohup .venv/bin/python -m device.main "${args[@]}" > "$LOG" 2>&1 < /dev/null &
    echo $! > "$PIDFILE"
    echo "started (pid $(cat "$PIDFILE")): ${args[*]}  log: $LOG"
    ;;
  stop)
    if running; then kill "$(cat "$PIDFILE")" && echo "stopped"; else echo "not running"; fi
    rm -f "$PIDFILE"
    ;;
  status)
    if running; then echo "running (pid $(cat "$PIDFILE"))"; else echo "not running"; fi
    ;;
  log)
    tail -n 30 "$LOG"
    ;;
  *)
    echo "usage: $0 start|stop|status|log" >&2; exit 2
    ;;
esac
