#!/usr/bin/env bash
# Start, stop and watch the listening post in the background (UNO Q or laptop).
#
#   bash tools/device_ctl.sh start [console args]   web console, idle (start mic or playlist from the page)
#   bash tools/device_ctl.sh start --start mic      console that starts listening right away
#   bash tools/device_ctl.sh url                    console address with the access token
#   bash tools/device_ctl.sh stop | status | log
#   bash tools/device_ctl.sh ensure                 start it listening to the mic, only if it is not running (and not stopped on purpose)
#   bash tools/device_ctl.sh autostart on|off       start after every reboot and restart it within a minute if it dies
#                                                   (user crontab, no admin rights; board_cleanup.sh removes it)
#
# From the Mac:  ssh arduino@<board-ip> 'bash ~/spetrum/tools/device_ctl.sh start'
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=data/device.log
PIDFILE=data/device.pid
STOPPED=data/device.stopped   # set by `stop`, so `ensure` does not undo a deliberate stop
TAG="# biospectra-autostart"
mkdir -p data

# after a reboot the old pid can belong to another process, so check what it runs
running() {
  [ -f "$PIDFILE" ] || return 1
  local pid; pid=$(cat "$PIDFILE")
  kill -0 "$pid" 2>/dev/null && tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | grep -q "device.console"
}

case "${1:-status}" in
  start)
    shift || true
    if running; then kill "$(cat "$PIDFILE")"; sleep 1; fi
    rm -f "$STOPPED"
    nohup .venv/bin/python -m device.console "$@" > "$LOG" 2>&1 < /dev/null &
    echo $! > "$PIDFILE"
    echo "console started (pid $(cat "$PIDFILE")) $*  log: $LOG"
    ;;
  stop)
    if running; then kill "$(cat "$PIDFILE")" && echo "stopped"; else echo "not running"; fi
    rm -f "$PIDFILE"
    touch "$STOPPED"
    ;;
  ensure)
    if running || [ -f "$STOPPED" ]; then exit 0; fi
    rm -f "$PIDFILE"
    # a listening post resumes listening after a reboot or a crash
    nohup .venv/bin/python -m device.console --start mic > "$LOG" 2>&1 < /dev/null &
    echo $! > "$PIDFILE"
    echo "$(date '+%F %T') console (re)started by ensure" >> data/autostart.log
    ;;
  autostart)
    me="$(pwd)/tools/device_ctl.sh"
    { crontab -l 2>/dev/null | grep -v "$TAG"; } > data/cron.tmp
    if [ "${2:-on}" = on ]; then
      echo "@reboot sleep 25 && /bin/bash $me ensure $TAG" >> data/cron.tmp
      echo "* * * * * /bin/bash $me ensure $TAG" >> data/cron.tmp
      echo "autostart on: the console starts after every reboot and is checked every minute"
    else
      echo "autostart off"
    fi
    crontab data/cron.tmp && rm -f data/cron.tmp
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
    echo "usage: $0 start|stop|status|log|url|ensure|autostart on|off" >&2; exit 2
    ;;
esac
