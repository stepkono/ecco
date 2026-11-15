"""Phase 2 acceptance: device -> backend -> label -> new prototypes -> device recognizes the sound."""

from __future__ import annotations

import io
import json
import socket
import threading
import time

import numpy as np
import pytest
import soundfile as sf

from core.config import ROOT, load_config
from core.models import build_registry
from device.hardware import NullHardware
from device.runtime import Listener, prototype_path
from device.sources import FileSource, PlaylistSource
from device.sync import SyncClient

PLAYLIST = ROOT / "data" / "playlist"
pytestmark = pytest.mark.skipif(not prototype_path("yamnet-tflite").exists() or not PLAYLIST.exists(),
                                reason="run tools.make_prototypes and tools.make_playlist first")


def cfg_copy(**backend):
    cfg = json.loads(json.dumps(load_config()))
    cfg["backend"].update(backend)
    return cfg


@pytest.fixture()
def server(tmp_path):
    """A real backend on a free port (labels include crickets for this test)."""
    import uvicorn

    from backend.app import create_app

    app = create_app(cfg_copy(labels=["frog", "chirping_birds", "crow", "crickets"], demo_mode=True, gold_rate=0.0),
                     data_dir=tmp_path / "backend")
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    srv = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error"))
    threading.Thread(target=srv.run, daemon=True).start()
    while not srv.started:
        time.sleep(0.05)
    yield f"http://127.0.0.1:{port}", app
    srv.should_exit = True


def http(method, url, body=None):
    import urllib.request

    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, (json.loads(r.read() or b"null") if r.headers.get("content-type", "").startswith("application/json") else None)


def test_full_loop_device_backend_device(server, tmp_path, monkeypatch):
    url, _ = server
    import device.runtime as rt

    real = rt.data_path
    monkeypatch.setattr(rt, "data_path", lambda key: (tmp_path / key) if key in ("queue", "data") else real(key))
    (tmp_path / "data").mkdir()
    cfg = load_config()
    reg = build_registry(threads=4)
    lis = Listener(cfg, reg, PlaylistSource(PLAYLIST, 48000, speed=0, loop=False), NullHardware())
    lis.run()
    assert lis.queue.count() == 2  # crickets and insects
    sync = SyncClient(queue=lis.queue, device_id="post-test", model_id=lis.model.model_id, backend_url=url,
                      local_prototypes=tmp_path / "proto.json", current_version=lambda: lis.proto_version,
                      on_prototypes=lis.swap_prototypes, interval_s=60)
    sync.tick()
    assert lis.queue.count(only_pending=True) == 0, "events must be uploaded"

    # 1. the queued events appear as puzzles
    _, player = http("POST", f"{url}/players", {"nickname": "tester"})
    pid = player["player_id"]
    _, puzzle = http("GET", f"{url}/puzzles/next?player_id={pid}")
    crickets = next(c for c in lis.queue.all() if c.best_guess == "frog")  # the crickets event
    assert puzzle["clip_id"] in {c.id for c in lis.queue.all()}

    # 2. a label in demo mode publishes a new prototype version (with a carved selection)
    v0 = lis.proto_version
    boxes = {"boxes": [{"t0": 2.0, "t1": 7.0, "f0": 1500, "f1": 12000}]}
    status, res = http("POST", f"{url}/clips/{crickets.id}/labels", {"player_id": pid, "label": "crickets", "mask": boxes})
    assert res["accepted"] and res["learned"] and res["prototype_version"] > v0

    # 3. the device picks it up and recognizes the sound on the next play
    sync.tick()
    assert lis.proto_version == res["prototype_version"] and "crickets" in lis.head.classes
    replay = Listener(cfg, reg, FileSource(PLAYLIST / "03_crickets.wav", 48000, speed=0), NullHardware())
    replay.head = lis.head
    [ev] = replay.run()
    assert ev.raw_state == "recognized" and ev.label == "crickets", (ev.raw_state, ev.best_label, ev.score)


def test_gold_reliability_consensus_and_other(tmp_path):
    from backend.service import Backend
    from backend.store import Store

    be = Backend(cfg_copy(demo_mode=False, consensus_n=2, gold_rate=1.0), Store(tmp_path))
    x, sr = sf.read(PLAYLIST / "01_frog.wav", dtype="float32")
    gold = be.add_gold(str(PLAYLIST / "01_frog.wav"), "frog")
    buf = io.BytesIO()
    sf.write(buf, x, sr, format="WAV")
    cid = be.receive_clip("post-x", {"clip_id": "c1", "duration_s": 5.0}, buf.getvalue())["clip_id"]
    a, b, c = (be.store.add_player(n) for n in ("a", "b", "c"))
    # gold: shown first (gold_rate 1.0), right answer raises reliability, wrong lowers it
    assert be.next_puzzle(a)["clip_id"] == gold
    assert be.submit_label(gold, a, "frog", None)["correct"] is True
    r = be.submit_label(gold, c, "crow", None)
    assert r["correct"] is False and r["reliability"] < 0.5
    assert be.store.gold_label(gold) == "frog" and be.head.version == 30  # never learned from gold
    # consensus: one vote is not enough, two agreeing reliable players are
    assert be.submit_label(cid, a, "chirping_birds", None)["accepted"] is False
    res = be.submit_label(cid, b, "chirping_birds", None)
    assert res["accepted"] and res["prototype_version"] == 31
    # "other" is accepted but not learned
    cid2 = be.receive_clip("post-x", {"clip_id": "c2"}, buf.getvalue())["clip_id"]
    be.submit_label(cid2, a, "other", None)
    res = be.submit_label(cid2, b, "other", None)
    assert res["accepted"] and res["learned"] is False and be.head.version == 31
    with pytest.raises(ValueError):
        be.submit_label(cid2, a, "unicorn", None)


def test_preview_and_spectrogram_grid(tmp_path):
    from backend.service import Backend
    from backend.store import Store

    be = Backend(cfg_copy(), Store(tmp_path))
    x, sr = sf.read(PLAYLIST / "03_crickets.wav", dtype="float32")
    buf = io.BytesIO()
    sf.write(buf, x, sr, format="WAV")
    cid = be.receive_clip("p", {"clip_id": "c"}, buf.getvalue())["clip_id"]
    s = be.spectrogram(cid)
    assert len(s["db"]) == s["rows"] and len(s["db"][0]) == s["cols"] and s["freqs"][0] == 0
    grid = np.zeros((s["rows"], s["cols"]))
    grid[s["rows"] // 4: s["rows"] // 2, :] = 1
    y, _ = sf.read(io.BytesIO(be.preview(cid, {"grid": grid.tolist()})), dtype="float32")
    assert len(y) == len(x) and 0 < np.abs(y).max() <= np.abs(x).max() + 1e-3
    with pytest.raises(ValueError):
        be.preview(cid, {"grid": [[1]]})


def test_device_update_is_confirmed_once(tmp_path):
    from backend.service import Backend
    from backend.store import Store

    be = Backend(cfg_copy(demo_mode=True), Store(tmp_path))
    be.latest_prototypes("yamnet-tflite", "post-1", 30)  # first contact: just registers the version
    x, sr = sf.read(PLAYLIST / "03_crickets.wav", dtype="float32")
    buf = io.BytesIO()
    sf.write(buf, x, sr, format="WAV")
    cid = be.receive_clip("post-1", {"clip_id": "c"}, buf.getvalue())["clip_id"]
    pid = be.store.add_player("p")
    v = be.submit_label(cid, pid, "crow", None)["prototype_version"]
    be.latest_prototypes("yamnet-tflite", "post-1", 30)  # still old: downloading
    be.latest_prototypes("yamnet-tflite", "post-1", v)  # installed
    be.latest_prototypes("yamnet-tflite", "post-1", v)  # no second event
    ups = [e for e in be.store.recent_events() if e["type"] == "device_updated"]
    assert [(e["device_id"], e["version"]) for e in ups] == [("post-1", v)]


def test_delete_recordings(tmp_path):
    """Waiting recordings can be listed and removed for good, one or all."""
    from fastapi.testclient import TestClient

    from backend.app import create_app

    client = TestClient(create_app(cfg_copy(gold_rate=0.0), data_dir=tmp_path / "backend"))
    buf = io.BytesIO()
    sf.write(buf, np.zeros(16000, dtype=np.float32), 16000, format="WAV")
    ids = []
    for i in range(3):
        r = client.post("/devices/post-01/clips", files={"audio": ("a.wav", buf.getvalue(), "audio/wav")},
                        data={"metadata": json.dumps({"clip_id": f"c{i}", "duration_s": 1.0})})
        assert r.status_code == 201
        ids.append(f"c{i}")
    assert [c["clip_id"] for c in client.get("/clips").json()] and len(client.get("/clips").json()) == 3
    assert client.delete("/clips/c0").json() == {"deleted": ["c0"]}
    assert client.get("/clips/c0").status_code == 404
    assert client.delete("/clips/c0").status_code == 404
    assert sorted(client.delete("/clips").json()["deleted"]) == ["c1", "c2"]
    assert client.get("/clips").json() == []


def test_reset_and_forget_learned_sounds(tmp_path):
    """Forgetting one class and resetting to the starting sounds publish new versions the devices follow."""
    from fastapi.testclient import TestClient

    from backend.app import create_app

    client = TestClient(create_app(cfg_copy(gold_rate=0.0), data_dir=tmp_path / "backend"))
    st = client.get("/stats").json()
    start, v0 = dict(st["starting_classes"]), st["prototype_version"]
    first = next(iter(start))
    r = client.post(f"/prototypes/forget/{first}").json()
    assert first not in r["classes"] and r["version"] == v0 + 1
    assert client.post("/prototypes/forget/no-such-sound").status_code == 404
    r = client.post("/prototypes/reset").json()
    assert r["classes"] == start and r["version"] == v0 + 2
    assert client.get("/stats").json()["prototype_version"] == v0 + 2


def test_learning_switch(tmp_path):
    """With learning paused, an accepted label is stored but the known sounds stay the same."""
    from fastapi.testclient import TestClient

    from backend.app import create_app

    client = TestClient(create_app(cfg_copy(gold_rate=0.0, demo_mode=True, labels=["frog", "crickets"]), data_dir=tmp_path / "backend"))
    buf = io.BytesIO()
    t = np.arange(16000 * 3) / 16000
    sf.write(buf, (0.3 * np.sin(2 * np.pi * 3000 * t) * (np.sin(2 * np.pi * 5 * t) > 0)).astype(np.float32), 16000, format="WAV")
    for cid in ("a", "b"):
        assert client.post("/devices/post-01/clips", files={"audio": ("a.wav", buf.getvalue(), "audio/wav")},
                           data={"metadata": json.dumps({"clip_id": cid, "duration_s": 3.0})}).status_code == 201
    pid = client.post("/players", json={"nickname": "t"}).json()["player_id"]
    v0 = client.get("/stats").json()["prototype_version"]
    assert client.post("/learning", json={"enabled": False}).json() == {"learning": False}
    r = client.post("/clips/a/labels", json={"player_id": pid, "label": "crickets"}).json()
    st = client.get("/stats").json()
    assert r.get("learning_paused") and st["prototype_version"] == v0 and "crickets" not in st["prototype_classes"]
    assert st["learning"] is False and client.get("/clips/a").json()["status"] == "solved"
    client.post("/learning", json={"enabled": True})
    client.post("/clips/b/labels", json={"player_id": pid, "label": "crickets"})
    st = client.get("/stats").json()
    assert st["prototype_version"] == v0 + 1 and "crickets" in st["prototype_classes"]
