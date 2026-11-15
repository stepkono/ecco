"""Background sync: upload uncertain clips, download newer prototypes. Offline first.

Backend contract (implemented in Phase 2):
* POST {backend}/devices/{device_id}/clips  multipart: `audio` (WAV) + `metadata` (JSON string)
* GET  {backend}/prototypes/latest?model_id=...  -> prototype JSON (200), or 204/404 when none

Without a backend URL, or while it is unreachable, the queue simply keeps growing.
A local prototype file is watched as well, so prototypes exported by the bench
(or copied onto the board) are picked up without a backend.
"""

from __future__ import annotations

import json
import logging
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Callable

from core.queue import ClipQueue

log = logging.getLogger("biospectra.device.sync")


def _multipart(fields: dict[str, str], files: dict[str, tuple[str, bytes, str]]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = bytearray()
    for name, value in fields.items():
        out += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
    for name, (filename, data, ctype) in files.items():
        out += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\n"
                f"Content-Type: {ctype}\r\n\r\n").encode() + data + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


class SyncClient:
    def __init__(self, *, queue: ClipQueue, device_id: str, model_id: str, backend_url: str | None,
                 local_prototypes: Path, current_version: Callable[[], int],
                 on_prototypes: Callable[[str, str], bool], interval_s: float = 5.0, timeout_s: float = 5.0) -> None:
        self.queue = queue
        self.device_id = device_id
        self.model_id = model_id
        self.backend = (backend_url or "").rstrip("/") or None
        self.local = local_prototypes
        self.current_version = current_version
        self.on_prototypes = on_prototypes
        self.interval = interval_s
        self.timeout = timeout_s
        self.status = "offline (no backend set)" if not self.backend else "connecting"
        self.uploaded = 0
        self._local_mtime = self.local.stat().st_mtime if self.local.exists() else 0.0
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="sync")

    def start(self) -> "SyncClient":
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()

    # ------------------------------------------------------------------ loop
    def _run(self) -> None:
        while not self._stop.is_set():
            self.tick()
            self._stop.wait(self.interval)

    def tick(self) -> None:
        self._check_local()
        if not self.backend:
            return
        try:
            self._upload()
            self._fetch()
            self.status = f"online · {self.uploaded} uploaded"
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            reason = getattr(e, "reason", e)
            self.status = f"offline ({reason}) · {self.queue.count(only_pending=True)} waiting"

    def _check_local(self) -> None:
        if not self.local.exists():
            return
        mtime = self.local.stat().st_mtime
        if mtime == self._local_mtime:
            return
        self._local_mtime = mtime
        text = self.local.read_text(encoding="utf-8")
        try:
            version = int(json.loads(text).get("version", 0))
        except (ValueError, AttributeError):
            log.warning("ignoring unreadable prototype file %s", self.local)
            return
        if version > self.current_version():
            self.on_prototypes(text, f"file {self.local.name}")

    def _upload(self) -> None:
        for clip in self.queue.pending(limit=20):
            meta = {
                "clip_id": clip.id, "device_id": clip.device_id, "model_id": clip.model_id,
                "created_at": clip.created_at, "sample_rate": clip.sample_rate,
                "device_guess": clip.best_guess, "device_score": clip.best_score, "scores": clip.scores,
                "embedding": [round(float(v), 6) for v in clip.embedding],
                "duration_s": clip.duration_s, "heard_count": clip.heard_count, "last_heard": clip.last_heard,
                "novelty": clip.novelty, "quality_dbfs": clip.quality, "timeline": clip.timeline,
            }
            body, ctype = _multipart({"metadata": json.dumps(meta)},
                                     {"audio": (f"{clip.id}.wav", Path(clip.wav_path).read_bytes(), "audio/wav")})
            url = f"{self.backend}/devices/{urllib.parse.quote(self.device_id)}/clips"
            req = urllib.request.Request(url, data=body, headers={"Content-Type": ctype}, method="POST")
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                if 200 <= r.status < 300:
                    self.queue.mark_uploaded(clip.id)
                    self.uploaded += 1

    def _fetch(self) -> None:
        # device_id + installed version let the backend confirm when a post has learned a new version
        url = f"{self.backend}/prototypes/latest?" + urllib.parse.urlencode(
            {"model_id": self.model_id, "device_id": self.device_id, "have": self.current_version()})
        try:
            with urllib.request.urlopen(url, timeout=self.timeout) as r:
                if r.status != 200:
                    return
                text = r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code in (204, 404):
                return
            raise
        version = int(json.loads(text).get("version", 0))
        # the server is the source of truth: take its version whenever it differs, also a lower one
        # (a device that once talked to another server, e.g. the demo one, would otherwise ignore it forever)
        if version != self.current_version():
            if self.on_prototypes(text, "backend"):
                # keep a local copy so a restart offline starts with the newest prototypes
                self.local.parent.mkdir(parents=True, exist_ok=True)
                self.local.write_text(text, encoding="utf-8")
                self._local_mtime = self.local.stat().st_mtime
