"""Run the listening post.

    python -m device.main --source mic
    python -m device.main --source file --path clip.wav
    python -m device.main --source playlist --path data/playlist --speed 4

The mock light page runs on http://<host>:8765 (config device.web_port).
On the UNO Q the RGB LED 1 shows the state too.
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys

from core.audio import check_ffmpeg
from core.config import load_config
from core.models import build_registry

from .hardware import build_hardware
from .runtime import Listener, prototype_path, set_mic_gain
from .sources import FileSource, MicSource, PlaylistSource
from .sync import SyncClient


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=["mic", "file", "playlist"], default="mic")
    ap.add_argument("--path", help="file or playlist folder")
    ap.add_argument("--speed", type=float, default=1.0, help="file/playlist pacing: 1 = real time, 0 = as fast as possible")
    ap.add_argument("--no-loop", action="store_true", help="stop at the end of the file or playlist")
    ap.add_argument("--max-decisions", type=int, default=None)
    ap.add_argument("--hardware", default=None, help="override config device.hardware (auto, mock, led, none)")
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s", datefmt="%H:%M:%S")
    for noisy in ("websockets", "absl", "birdnet"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    cfg = load_config()
    dev, audio = cfg["device"], cfg["audio"]
    if a.source in ("file", "playlist"):
        if not a.path:
            sys.exit("--path is required for file and playlist sources")
        try:
            check_ffmpeg()
        except RuntimeError:
            logging.getLogger("biospectra.device").warning("ffmpeg missing: only wav/flac/ogg/aiff files can be played")

    sr = int(audio["sample_rate"])
    if a.source == "mic":
        set_mic_gain(audio)
        source = MicSource(sr, audio.get("device"))
    elif a.source == "file":
        source = FileSource(a.path, sr, speed=a.speed, loop=not a.no_loop)
    else:
        source = PlaylistSource(a.path, sr, speed=a.speed, loop=not a.no_loop)

    registry = build_registry(threads=cfg["runtime"]["threads"])
    hw_spec = a.hardware or dev.get("hardware", "auto")
    knob_lo, knob_hi = cfg["head"].get("knob_range", [0.4, 0.95])
    t0 = cfg["head"].get("t_known_by_model", {}).get(dev["model_id"], cfg["head"]["t_known"])
    hardware = build_hardware(hw_spec, int(dev.get("web_port", 8765)), (t0 - knob_lo) / (knob_hi - knob_lo))
    listener = Listener(cfg, registry, source, hardware)
    sync = SyncClient(
        queue=listener.queue, device_id=dev["id"], model_id=listener.model.model_id,
        backend_url=dev.get("backend_url"), local_prototypes=prototype_path(listener.model.model_id),
        current_version=lambda: listener.proto_version, on_prototypes=listener.swap_prototypes,
        interval_s=float(dev.get("sync_interval_s", 5)),
    ).start()
    listener.sync_status = lambda: sync.status

    def stop(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    try:
        listener.run(a.max_decisions)
    except KeyboardInterrupt:
        pass
    finally:
        sync.stop()
        source.close()
        hardware.close()
        logging.getLogger("biospectra.device").info("stopped. %d clips waiting in the queue",
                                                     listener.queue.count(only_pending=True))


if __name__ == "__main__":
    main()
