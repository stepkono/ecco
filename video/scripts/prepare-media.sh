#!/usr/bin/env bash
# Makes the media visible to Remotion under public/footage/ (git ignores it).
#  - hard-links every screen recording from ../footage/
#  - hard-links every clip you dropped into clips/
#  - links voice and music from audio/
#  - cuts the generated shots out of the long sketch video into short 30 fps files
set -euo pipefail
cd "$(dirname "$0")/.."
# hard links, not symlinks: the render copies public/ to a temp folder and skips symlinks.
# Hard links cost no extra disk space. Fall back to a copy across disks.
link() { rm -f "$2"; ln "$1" "$2" 2>/dev/null || cp "$1" "$2"; }
OUT=public/footage
mkdir -p "$OUT/sketch"

for f in ../footage/*.mp4; do
  [ -e "$f" ] || continue
  link "$f" "$OUT/$(basename "$f")"
done

if [ -d clips ]; then
  for f in clips/*.mp4 clips/*.mov; do
    [ -e "$f" ] || continue
    case "$(basename "$f")" in sketch-*) continue ;; esac # the long sketches are only used through their cuts below
    link "$f" "$OUT/$(basename "$f")"
  done
fi

# voice and music: video/audio/voice.* and video/audio/music.*
mkdir -p "$OUT/audio"
rm -f "$OUT/audio/"*
if [ -d audio ]; then
  for f in audio/voice.* audio/music.*; do
    [ -e "$f" ] || continue
    link "$f" "$OUT/audio/$(basename "$f")"
  done
fi

# cut <source> <start s> <length s> <name>
cut() {
  [ -e "$1" ] || { echo "skip $4, $1 is missing"; return; }
  [ -e "$OUT/sketch/$4.mp4" ] && return
  ffmpeg -loglevel error -y -ss "$2" -t "$3" -i "$1" -an -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p "$OUT/sketch/$4.mp4"
  echo "cut $4"
}
SK=clips/sketch-0618.mp4
cut "$SK" 13.05 7.6 network-topo
cut "$SK" 20.80 6.5 post-on-tree
cut "$SK" 27.42 6.5 post-studio
cut clips/sketch-0843.mp4 0 10 post-reveal

echo "media ready in $OUT"
