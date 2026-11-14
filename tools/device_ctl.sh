#!/usr/bin/env bash
# Start, stop and watch the listening post in the background (UNO Q or laptop).
#
#   bash tools/device_ctl.sh start [console args]   web console, idle (start mic or playlist from the page)
#   bash tools/device_ctl.sh start --start mic      console that starts listening right away
#   bash tools/device_ctl.sh url                    console address with the access token
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
    nohup .venv/bin/python -m device.console "$@" > "$LOG" 2>&1 < /dev/null &
    echo $! > "$PIDFILE"
    echo "console started (pid $(cat "$PIDFILE")) $*  log: $LOG"
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
  url)
    for _ in 1 2 3 4 5 6 7 8 9 10; do [ -f data/console_token ] && break; sleep 1; done
    ip=$(hostname -I 2>/dev/null | awk '{print $1}'); [ -z "$ip" ] && ip=localhost
    echo "http://$ip:8765/?token=$(cat data/console_token 2>/dev/null)"
    ;;
  *)
    echo "usage: $0 start|stop|status|log|url" >&2; exit 2
    ;;
esac
