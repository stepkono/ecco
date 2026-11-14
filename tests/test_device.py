"""Phase 1 acceptance tests for the listening post (need the demo data, see README).

* the demo playlist drives the light to the expected state for every clip
* unknown sounds land in the queue, speech never does
* a newer prototype file on the backend is picked up within a few seconds
* queued clips are uploaded when a backend is reachable
"""

from __future__ import annotations

import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

from core.config import ROOT, load_config
from core.heads import PrototypeHead
from core.models import build_registry
from core.queue import ClipQueue
from device.hardware import NullHardware
from device.runtime import Listener, prototype_path
from device.sources import PlaylistSource
from device.sync import SyncClient

PLAYLIST = ROOT / "data" / "playlist"
pytestmark = pytest.mark.skipif(
    not (PLAYLIST / "expected.json").exists() or not prototype_path("yamnet-tflite").exists(),
    reason="run tools.make_prototypes and tools.make_playlist first",
)


@pytest.fixture(scope="module")
def registry():
    return build_registry(threads=4)


@pytest.fixture()
def listener(registry, tmp_path, monkeypatch):
    cfg = json.loads(json.dumps(load_config()))  # deep copy
    cfg["device"]["model_id"] = cfg["device"]["privacy_model_id"] = "yamnet-tflite"
    # isolate the queue and event log from the real device data
    import device.runtime as rt

    real = rt.data_path
    monkeypatch.setattr(rt, "data_path", lambda key: (tmp_path / key) if key in ("queue", "data") else real(key))
    (tmp_path / "data").mkdir()
    src = PlaylistSource(PLAYLIST, int(cfg["audio"]["sample_rate"]), speed=0, loop=False)
    return Listener(cfg, registry, src, NullHardware())


def test_playlist_drives_light_and_queue(listener):
    expected = json.loads((PLAYLIST / "expected.json").read_text())
    events = listener.run()
    assert len(events) == len(expected)
    wrong = [(e.source, expected[e.source]["state"], e.raw_state, e.best_label, e.score) for e in events
             if e.raw_state != expected[e.source]["state"]
             or (expected[e.source]["label"] and e.label != expected[e.source]["label"])]
    assert not wrong, f"unexpected states: {wrong}"
    queued = {e.source for e in events if e.queued}
    assert queued == {s for s, x in expected.items() if x["state"] == "needs_help"}
    assert not any(e.queued for e in events if e.speech), "speech must never be queued"


class _Backend(BaseHTTPRequestHandler):
    proto: str = ""
    uploads: list = []

    def do_GET(self):  # noqa: N802
        if self.path.startswith("/prototypes/latest") and self.proto:
            body = self.proto.encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):  # noqa: N802
        n = int(self.headers.get("Content-Length", 0))
        _Backend.uploads.append((self.path, self.rfile.read(n)))
        self.send_response(201)
        self.end_headers()

    def log_message(self, *a):
        pass


def test_backend_prototypes_swap_in_and_clips_upload(listener, tmp_path):
    srv = HTTPServer(("127.0.0.1", 0), _Backend)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{srv.server_port}"
    m = listener.model
    newer = PrototypeHead(m.model_id, m.model_version, m.embedding_dim)
    newer.import_json(prototype_path(m.model_id).read_text())
    newer.add_example("crickets", listener.head.prototypes()["frog"])  # any change bumps the version
    _Backend.proto = newer.export_json()
    _Backend.uploads = []
    q = ClipQueue(tmp_path / "q2")
    q.enqueue(listener.source._audio(listener.source.files[0])[:48000], 48000, listener.head.prototypes()["frog"],
              device_id="post-test", model_id=m.model_id, best_guess="frog", best_score=0.5)
    sync = SyncClient(queue=q, device_id="post-test", model_id=m.model_id, backend_url=url,
                      local_prototypes=tmp_path / "local.json", current_version=lambda: listener.proto_version,
                      on_prototypes=listener.swap_prototypes, interval_s=0.5).start()
    t0 = time.time()
    while time.time() - t0 < 5 and listener.proto_version != newer.version:
        time.sleep(0.1)
    sync.stop()
    srv.shutdown()
    assert listener.proto_version == newer.version, "newer backend prototypes were not picked up"
    assert time.time() - t0 < 5
    assert "crickets" in listener.head.classes
    assert Path(tmp_path / "local.json").exists(), "backend prototypes should be cached locally"
    assert _Backend.uploads and _Backend.uploads[0][0] == "/devices/post-test/clips"
    assert q.count(only_pending=True) == 0
