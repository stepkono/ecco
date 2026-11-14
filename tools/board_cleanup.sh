#!/usr/bin/env bash
# Remove everything BioSpectra added to a borrowed Arduino UNO Q before returning it.
# Run on the board as user `arduino`, for example from the Mac:
#
#   ssh arduino@<board-ip> 'bash -s' < tools/board_cleanup.sh
#
# Removes: our code and Python environment, uv, model caches, recorded clips,
# the Wi-Fi priority change, and the `biospectra-dev` SSH key (last, so an SSH
# session that runs this script still finishes). A full reflash with Arduino's
# flashing tool is still the cleanest way to hand a board over.
set -uo pipefail

echo "[cleanup] removing code, environment, caches and recordings"
rm -rf "$HOME/spetrum" "$HOME/.local/bin/uv" "$HOME/.local/bin/uvx" \
       "$HOME/.cache/uv" "$HOME/.cache/kagglehub" "$HOME/.local/share/birdnet" /tmp/uvdl

echo "[cleanup] resetting Wi-Fi priorities"
for c in Junction2026 Hype-Guest; do
  nmcli -t -f NAME connection show 2>/dev/null | grep -qx "$c" \
    && nmcli connection modify "$c" connection.autoconnect-priority 0 2>/dev/null \
    && echo "  $c priority -> 0"
done

echo "[cleanup] removing the biospectra-dev SSH key"
if [ -f "$HOME/.ssh/authorized_keys" ]; then
  grep -v "biospectra-dev" "$HOME/.ssh/authorized_keys" > "$HOME/.ssh/authorized_keys.tmp" || true
  mv "$HOME/.ssh/authorized_keys.tmp" "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
fi

echo "[cleanup] done. Remaining: $(du -sh "$HOME" 2>/dev/null | cut -f1) in $HOME"
echo "[cleanup] not touched: saved Wi-Fi networks and the board password (a reflash resets both)"
