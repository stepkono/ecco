"""Developer console: control the listening post from one web page.

    python -m device.console                 # http://<device>:8765/?token=...

* Live: start/stop the mic listener or a playlist, trust knob, live decisions
* Analyze: upload audio files, the on-device models report what they hear
* Clips: play, download (single or zip) and delete the queued uncertain clips

Standard library only (http.server + Server-Sent Events), so nothing extra is
needed on the UNO Q. The API needs a token because the board sits on a shared
network and the clips are recordings. The token is printed at start and kept in
data/console_token.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import queue as queue_mod
import secrets
import shutil
import subprocess
import threading
import time
import zipfile
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np
import psutil
import soundfile as sf

from core.audio import mel_spectrogram, rms_dbfs
from core.config import ROOT, data_path, load_config
from core.measure import peak_rss_mb
from core.models import build_registry
from core.models.base import ModelUnavailable
from core.state import State, StateKind

from .hardware import NullHardware, UnoQLedHardware
from .runtime import Listener, prototype_path, set_mic_gain
from .sources import MicSource, PlaylistSource
from .sync import SyncClient

log = logging.getLogger("biospectra.console")
WEB = Path(__file__).parent / "web" / "console.html"
MAX_UPLOAD = 60 * 1024 * 1024


class EventBus:
    """Fan-out of JSON events to every open page (Server-Sent Events)."""

    def __init__(self) -> None:
        self._subs: set[queue_mod.Queue] = set()
        self._lock = threading.Lock()
        self.last_state: dict = {}

    def subscribe(self) -> queue_mod.Queue:
        q: queue_mod.Queue = queue_mod.Queue(maxsize=200)
        with self._lock:
            self._subs.add(q)
        return q

    def unsubscribe(self, q: queue_mod.Queue) -> None:
        with self._lock:
            self._subs.discard(q)

    def publish(self, event: dict) -> None:
        if event.get("type") == "decision":
            self.last_state = event
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(event)
            except queue_mod.Full:
                pass


class ConsoleHardware(NullHardware):
    """The page is the light and the knob. The board's RGB LED is driven alongside when present."""

    def __init__(self, bus: EventBus, knob: float) -> None:
        self.bus = bus
        self.knob = knob
        self.led = UnoQLedHardware() if UnoQLedHardware.available() else None

    def show_state(self, state: State, info: dict | None = None) -> None:
        if self.led:
            self.led.show_state(state, info)
        self.bus.publish({"type": "decision", "state": state.kind.value, "color": state.color,
                          "text": state.describe(), **(info or {})})

    def read_knob(self) -> float | None:
        return self.knob

    def close(self) -> None:
        if self.led:
            self.led.close()


class Controller:
    """Owns the listener and switches between idle, mic and playlist."""

    def __init__(self, cfg: dict) -> None:
        self.cfg = cfg
        dev = cfg["device"]
        self.started = time.time()
        self.bus = EventBus()
        self.registry = build_registry(threads=cfg["runtime"]["threads"])
        lo, hi = cfg["head"].get("knob_range", [0.4, 0.95])
        t0 = cfg["head"].get("t_known_by_model", {}).get(dev["model_id"], cfg["head"]["t_known"])
        self.hw = ConsoleHardware(self.bus, (t0 - lo) / (hi - lo))
        self.listener = Listener(cfg, self.registry, None, self.hw)
        self.listener.t_known = t0
        self.sync = SyncClient(
            queue=self.listener.queue, device_id=dev["id"], model_id=self.listener.model.model_id,
            backend_url=dev.get("backend_url"), local_prototypes=prototype_path(self.listener.model.model_id),
            current_version=lambda: self.listener.proto_version, on_prototypes=self._on_prototypes,
            interval_s=float(dev.get("sync_interval_s", 5)), on_uploaded=self._on_uploaded,
        ).start()
        self.listener.sync_status = lambda: self.sync.status
        self.mode = "idle"
        self.mode_detail = ""
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._source = None
        self._mode_lock = threading.Lock()

    def _on_prototypes(self, text: str, origin: str) -> bool:
        ok = self.listener.swap_prototypes(text, origin)
        if ok:
            self.bus.publish({"type": "learned", "time": time.strftime("%H:%M:%S"), "version": self.listener.proto_version,
                              "origin": origin, "classes": dict(self.listener.head.classes)})
            self.bus.publish({"type": "status", **self.status()})
        return ok

    def _on_uploaded(self, clip) -> None:
        self.bus.publish({"type": "uploaded", "time": time.strftime("%H:%M:%S"), "clip_id": clip.id,
                          "duration_s": clip.duration_s, "guess": clip.best_guess})

    # ------------------------------------------------------------ live mode
    def start(self, mode: str, path: str | None = None, speed: float = 1.0, loop: bool = True) -> dict:
        with self._mode_lock:
            self._stop_locked()
            sr = int(self.cfg["audio"]["sample_rate"])
            if mode == "mic":
                set_mic_gain(self.cfg["audio"])
                src = MicSource(sr, self.cfg["audio"].get("device"))
                detail = self.cfg["audio"].get("device") or "default microphone"
            elif mode == "playlist":
                folder = Path(path or ROOT / "data" / "playlist")
                if not folder.is_absolute():
                    folder = ROOT / folder
                src = PlaylistSource(folder, sr, speed=speed, loop=loop)
                detail = (f"{folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder} "
                          f"({len(src.files)} files, {speed}x{'' if loop else ', once'})")
            elif mode == "idle":
                return self.status()
            else:
                raise ValueError(f"unknown mode {mode}")
            self._source = src
            self._stop = threading.Event()
            self.mode, self.mode_detail = mode, detail
            self._thread = threading.Thread(target=self._run, args=(src, self._stop), daemon=True, name=f"listen-{mode}")
            self._thread.start()
            log.info("live mode: %s %s", mode, detail)
        st = self.status()
        self.bus.publish({"type": "status", **st})
        return st

    def _run(self, src, stop: threading.Event) -> None:
        try:
            self.listener.run(stop=stop, source=src)
        except Exception as e:  # mic unplugged, arecord died, ...
            log.exception("listener stopped")
            self.bus.publish({"type": "error", "message": f"listener stopped: {e}"})
        finally:
            if not stop.is_set():
                self.mode, self.mode_detail = "idle", ""
                self.bus.publish({"type": "status", **self.status()})

    def _stop_locked(self) -> None:
        self._stop.set()
        if self._source is not None:
            try:
                self._source.close()  # unblocks a mic read
            except Exception:
                pass
        if self._thread is not None:
            self._thread.join(timeout=8)
        self._thread = self._source = None
        self.mode, self.mode_detail = "idle", ""
        self.hw.show_state(State(StateKind.QUIET), {"detail": "listener stopped"})

    def stop(self) -> dict:
        with self._mode_lock:
            self._stop_locked()
        st = self.status()
        self.bus.publish({"type": "status", **st})
        return st

    def demo_reset(self) -> dict:
        """Stop listening and forget queued events and counters (the scripted demo runs repeatedly)."""
        self.stop()
        self.listener.reset_learning_state()
        st = self.status()
        self.bus.publish({"type": "status", **st})
        return st

    def set_keep_speech(self, on: bool) -> dict:
        """Privacy switch: True keeps speech (it is analysed and can be sent), False drops it again."""
        self.listener.keep_speech = bool(on)
        log.warning("privacy filter %s: speech is %s", "OFF" if on else "on", "kept" if on else "dropped")
        st = self.status()
        self.bus.publish({"type": "status", **st})
        return st

    def set_knob(self, value: float) -> dict:
        self.hw.knob = min(1.0, max(0.0, float(value)))
        lo, hi = self.listener.knob_lo, self.listener.knob_hi
        self.listener.t_known = round(lo + self.hw.knob * (hi - lo), 3)
        st = self.status()
        self.bus.publish({"type": "status", **st})
        return st

    # ------------------------------------------------------------ status
    def mic_info(self) -> str:
        # only the microphone in use, in a few words (not every sound card of the board)
        if shutil.which("arecord"):
            want = str(self.cfg["audio"].get("device", ""))
            card = want.split("CARD=")[1].split(",")[0] if "CARD=" in want else ""
            out = subprocess.run(["arecord", "-l"], capture_output=True, text=True, check=False).stdout
            for ln in out.splitlines():
                if ln.startswith("card") and (not card or f" {card} [" in ln):
                    name = ln.split("[", 1)[1].split("]", 1)[0] if "[" in ln else ln
                    return f"{name} (USB)"
            return "not connected"
        try:
            import sounddevice as sd

            return str(sd.query_devices(kind="input")["name"])
        except Exception:
            return "unknown"

    def status(self) -> dict:
        L = self.listener
        with L._lock:
            classes = dict(L.head.classes)
            version = L.head.version
        vm = psutil.virtual_memory()
        return {
            "device": self.cfg["device"]["id"], "location": self.cfg["device"]["location"],
            "mode": self.mode, "mode_detail": self.mode_detail,
            "model_id": L.model.model_id, "privacy_model_id": L.privacy.model.model_id,
            "t_known": L.t_known, "knob": self.hw.knob, "t_noise": L.t_noise, "margin": L.margin,
            "keep_speech": L.keep_speech,
            "proto_version": version, "proto_classes": classes,
            "queue_pending": L.queue.count(only_pending=True), "queue_total": L.queue.count(),
            "sync": self.sync.status, "mic": self.mic_info(),
            "uploaded": self.sync.uploaded, "server": self.sync.backend or "",
            "budget_used": L.queue.count_since(time.time() - 3600),
            "uptime_s": int(time.time() - self.started), "process_rss_mb": round(peak_rss_mb()),
            "mem_available_mb": round(vm.available / 1e6), "cpu_percent": psutil.cpu_percent(interval=None),
            "last": self.bus.last_state,
            "events": dict(L.stats), "budget_per_hour": L.ev_cfg.get("budget_per_hour"),
            "detections_total": dict(L.detections), "detections_hour": L.detection_counts(),
        }

    # ------------------------------------------------------------ analyze uploads
    def analyze(self, data: bytes, name: str, birdnet: bool = False) -> dict:
        try:
            x, sr = sf.read(io.BytesIO(data), dtype="float32", always_2d=True)
        except Exception as e:
            raise ValueError(f"could not decode {name}: {e}. The page converts audio to WAV before upload.") from e
        x = x.mean(axis=1)
        if len(x) == 0:
            raise ValueError(f"{name} has no samples")
        L = self.listener
        clip_n = int(L.clip_s * sr)
        n_seg = max(1, int(np.ceil(len(x) / clip_n)))
        segments = []
        for i in range(n_seg):
            seg = x[i * clip_n:(i + 1) * clip_n]
            if len(seg) < clip_n:
                seg = np.pad(seg, (0, clip_n - len(seg)))
            v = L.evaluate(seg, sr)
            d = v.decision
            sims = sorted(d.similarities.items(), key=lambda kv: -kv[1])[:6] if d else []
            segments.append({
                "start": round(i * L.clip_s, 2), "end": round(min(len(x) / sr, (i + 1) * L.clip_s), 2),
                "state": v.raw.kind.value, "color": v.raw.color, "label": v.raw.label,
                "best_label": d.best_label if d else None, "best": round(d.best, 3) if d else None,
                "margin": round(d.margin, 3) if d else None, "similarities": [[k, round(s, 3)] for k, s in sims],
                "speech": v.privacy.speech, "speech_score": round(v.privacy.score, 3),
                "energy_ok": v.energy_ok, "level_dbfs": round(rms_dbfs(seg), 1), "latency_ms": v.latency_ms,
                "windows": [{"start": round(i * L.clip_s + float(s), 2),
                             "top": [[lbl, round(p, 3)] for lbl, p in top[:3]]}
                            for s, top in zip(v.analysis.starts, v.analysis.top)],
            })
        out = {"name": name, "duration": round(len(x) / sr, 2), "sample_rate": sr, "segments": segments,
               "t_known": L.t_known, "model_id": L.model.model_id, "proto_version": L.proto_version,
               "spectrogram": self._spectrogram(x, sr)}
        if birdnet:
            out["birdnet"] = self._birdnet(x, sr)
        return out

    @staticmethod
    def _spectrogram(x: np.ndarray, sr: int, cols: int = 480) -> dict:
        s = mel_spectrogram(x, sr, n_mels=64)
        db = s.db
        if db.shape[1] > cols:
            idx = np.linspace(0, db.shape[1] - 1, cols).astype(int)
            db = db[:, idx]
        hi = float(db.max())
        img = np.clip((db - (hi - 80)) / 80 * 255, 0, 255).astype(np.uint8)
        return {"rows": img.shape[0], "cols": img.shape[1], "data": img[::-1].flatten().tolist(),
                "fmax": float(s.freqs[-1])}

    def _birdnet(self, x: np.ndarray, sr: int) -> dict:
        from core.pipeline import analyze

        try:
            m = self.registry.get("birdnet-2.4-int8")
        except ModelUnavailable as e:
            return {"error": str(e)}
        with self.listener.infer_lock:
            a = analyze(m, x, sr, energy_dbfs=self.cfg["gates"]["energy_dbfs"])
        return {"model_id": m.model_id, "window_seconds": m.window_seconds,
                "latency_ms": round(1000 * float(np.mean(a.latency_s)), 1),
                "windows": [{"start": round(float(s), 2), "top": [[lbl.split("_")[-1], round(p, 3)] for lbl, p in top[:3]]}
                            for s, top in zip(a.starts, a.top)]}

    # ------------------------------------------------------------ clips
    def clips(self) -> list[dict]:
        out = []
        for c in self.listener.queue.all():
            p = Path(c.wav_path)
            out.append({"id": c.id, "created_at": c.created_at, "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(c.created_at)),
                        "best_guess": c.best_guess, "best_score": c.best_score, "uploaded": c.uploaded,
                        "size_kb": round(p.stat().st_size / 1024) if p.exists() else 0, "model_id": c.model_id,
                        "duration_s": c.duration_s, "heard_count": c.heard_count, "novelty": c.novelty,
                        "quality": c.quality, "timeline": c.timeline})
        return out

    def clips_zip(self, ids: list[str] | None) -> bytes:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            meta = []
            for c in self.listener.queue.all():
                if ids and c.id not in ids:
                    continue
                p = Path(c.wav_path)
                if p.exists():
                    z.write(p, f"{c.id}.wav")
                meta.append({"id": c.id, "created_at": c.created_at, "device_id": c.device_id, "model_id": c.model_id,
                             "best_guess": c.best_guess, "best_score": c.best_score, "scores": c.scores,
                             "duration_s": c.duration_s, "heard_count": c.heard_count, "last_heard": c.last_heard,
                             "novelty": c.novelty, "quality_dbfs": c.quality, "timeline": c.timeline})
            z.writestr("clips.json", json.dumps(meta, indent=1))
        return buf.getvalue()


# ---------------------------------------------------------------- HTTP

def make_handler(ctl: Controller, token: str | None):
    class Handler(BaseHTTPRequestHandler):
        server_version = "BioSpectraConsole/1"

        def log_message(self, fmt, *args):  # keep the log for decisions
            pass

        # -- helpers
        def _query(self) -> dict:
            return {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}

        def _authed(self) -> bool:
            if not token:
                return True
            got = self.headers.get("X-Token") or self._query().get("token")
            return bool(got) and secrets.compare_digest(got, token)

        def _send(self, status: int, body: bytes, ctype: str, extra: dict | None = None) -> None:
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")  # the demo event screen reads status and events
            self.send_header("Access-Control-Allow-Headers", "X-Token, Content-Type")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def _json(self, obj, status: int = 200) -> None:
            self._send(status, json.dumps(obj).encode(), "application/json")

        def _err(self, status: int, msg: str) -> None:
            self._json({"error": msg}, status)

        def _body(self) -> bytes:
            n = int(self.headers.get("Content-Length", 0))
            if n > MAX_UPLOAD:
                raise ValueError(f"upload too large ({n / 1e6:.0f} MB, limit {MAX_UPLOAD / 1e6:.0f} MB)")
            return self.rfile.read(n)

        # -- routes
        def do_GET(self):  # noqa: N802
            path = urlparse(self.path).path
            if path in ("/", "/index.html"):
                return self._send(200, WEB.read_bytes(), "text/html; charset=utf-8")
            if not self._authed():
                return self._err(HTTPStatus.UNAUTHORIZED, "missing or wrong token")
            if path == "/api/status":
                return self._json(ctl.status())
            if path == "/api/clips":
                return self._json(ctl.clips())
            if path == "/api/clips.zip":
                ids = [i for i in self._query().get("ids", "").split(",") if i]
                name = f"biospectra_clips_{time.strftime('%Y%m%d_%H%M%S')}.zip"
                return self._send(200, ctl.clips_zip(ids or None), "application/zip",
                                  {"Content-Disposition": f'attachment; filename="{name}"'})
            if path.startswith("/api/clips/") and path.endswith(".wav"):
                c = ctl.listener.queue.get(path.rsplit("/", 1)[1][:-4])
                if not c or not Path(c.wav_path).exists():
                    return self._err(404, "no such clip")
                dl = self._query().get("download") == "1"
                extra = {"Content-Disposition": f'attachment; filename="{c.id}.wav"'} if dl else {}
                return self._send(200, Path(c.wav_path).read_bytes(), "audio/wav", extra)
            if path == "/api/events":
                return self._events()
            return self._err(404, "not found")

        def do_OPTIONS(self):  # noqa: N802  CORS preflight for the event screen
            self._send(204, b"", "text/plain", {"Access-Control-Allow-Methods": "GET, POST, OPTIONS"})

        def do_POST(self):  # noqa: N802
            path = urlparse(self.path).path
            if not self._authed():
                return self._err(HTTPStatus.UNAUTHORIZED, "missing or wrong token")
            try:
                if path == "/api/analyze":
                    q = self._query()
                    return self._json(ctl.analyze(self._body(), q.get("name", "upload.wav"), q.get("birdnet") == "1"))
                body = json.loads(self._body() or b"{}")
                if path == "/api/mode":
                    if body.get("mode") == "idle":
                        return self._json(ctl.stop())
                    return self._json(ctl.start(body.get("mode", "mic"), body.get("path"), float(body.get("speed", 1)),
                                                bool(body.get("loop", True))))
                if path == "/api/demo/reset":
                    return self._json(ctl.demo_reset())
                if path == "/api/knob":
                    return self._json(ctl.set_knob(body["value"]))
                if path == "/api/privacy":
                    return self._json(ctl.set_keep_speech(bool(body.get("keep_speech", False))))
                if path == "/api/clips/delete":
                    ids = body.get("ids") or [c.id for c in ctl.listener.queue.all()]
                    n = sum(ctl.listener.queue.delete(i) for i in ids)
                    ctl.bus.publish({"type": "status", **ctl.status()})
                    return self._json({"deleted": n})
            except (ValueError, KeyError, FileNotFoundError, RuntimeError, OSError) as e:
                return self._err(400, str(e))
            return self._err(404, "not found")

        def _events(self) -> None:
            q = ctl.bus.subscribe()
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            try:
                self.wfile.write(f"data: {json.dumps({'type': 'status', **ctl.status()})}\n\n".encode())
                self.wfile.flush()
                while True:
                    try:
                        ev = q.get(timeout=15)
                        self.wfile.write(f"data: {json.dumps(ev)}\n\n".encode())
                    except queue_mod.Empty:
                        self.wfile.write(b": keep-alive\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                ctl.bus.unsubscribe(q)

    return Handler


def load_token(disabled: bool) -> str | None:
    if disabled:
        return None
    p = data_path("data") / "console_token"
    if not p.exists():
        p.write_text(secrets.token_urlsafe(12), encoding="utf-8")
        p.chmod(0o600)
    return p.read_text(encoding="utf-8").strip()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=None, help="default: config device.web_port")
    ap.add_argument("--start", choices=["idle", "mic", "playlist"], default="idle", help="live mode at start")
    ap.add_argument("--no-token", action="store_true", help="disable the access token (trusted networks only)")
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s", datefmt="%H:%M:%S")
    cfg = load_config()
    port = a.port or int(cfg["device"].get("web_port", 8765))
    token = load_token(a.no_token)
    ctl = Controller(cfg)
    if a.start != "idle":
        ctl.start(a.start)
    srv = ThreadingHTTPServer((a.host, port), make_handler(ctl, token))
    srv.daemon_threads = True
    url = f"http://<device-ip>:{port}/" + (f"?token={token}" if token else "")
    log.info("console ready: %s", url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        ctl.stop()
        ctl.sync.stop()
        ctl.hw.close()


if __name__ == "__main__":
    main()
