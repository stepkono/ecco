"""Developer console API: token, analyze, live mode, clips (needs the demo data)."""

from __future__ import annotations

import io
import json
import threading
import time
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import numpy as np
import pytest
import soundfile as sf

from core.config import ROOT, load_config
from device.runtime import prototype_path

PLAYLIST = ROOT / "data" / "playlist"
pytestmark = pytest.mark.skipif(not prototype_path("yamnet-tflite").exists() or not PLAYLIST.exists(),
                                reason="run tools.make_prototypes and tools.make_playlist first")


@pytest.fixture(scope="module")
def console(tmp_path_factory):
    import device.console as dc
    import device.runtime as rt

    tmp = tmp_path_factory.mktemp("console")
    real = rt.data_path
    rt.data_path = lambda key: (tmp / key) if key in ("queue", "data") else real(key)
    (tmp / "data").mkdir()
    cfg = json.loads(json.dumps(load_config()))
    cfg["device"]["backend_url"] = ""
    ctl = dc.Controller(cfg)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), dc.make_handler(ctl, "secret-token"))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}", ctl
    ctl.stop()
    srv.shutdown()
    rt.data_path = real


def call(base, path, data=None, token="secret-token", method=None):
    req = urllib.request.Request(base + path, data=data, method=method, headers={"X-Token": token} if token else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, r.read()


def test_token_required(console):
    base, _ = console
    with pytest.raises(urllib.error.HTTPError) as e:
        call(base, "/api/status", token=None)
    assert e.value.code == 401
    with pytest.raises(urllib.error.HTTPError):
        call(base, "/api/status", token="wrong")
    assert call(base, "/", token=None)[0] == 200  # the page itself loads, then asks for the token
    st = json.loads(call(base, "/api/status")[1])
    assert st["mode"] == "idle" and st["model_id"] == "yamnet-tflite"


def test_analyze_upload(console):
    base, ctl = console
    a, sr = sf.read(PLAYLIST / "01_frog.wav", dtype="float32")
    b, _ = sf.read(PLAYLIST / "03_crickets.wav", dtype="float32")
    buf = io.BytesIO()
    sf.write(buf, np.concatenate([a, b]), sr, format="WAV", subtype="PCM_16")
    before = ctl.listener.queue.count()
    r = json.loads(call(base, "/api/analyze?name=t.wav", buf.getvalue(), method="POST")[1])
    assert [s["state"] for s in r["segments"]] == ["recognized", "needs_help"]
    assert r["segments"][0]["label"] == "frog"
    assert ctl.listener.queue.count() == before, "analysis must not queue clips"


def test_live_playlist_and_clips(console):
    base, ctl = console
    call(base, "/api/mode", json.dumps({"mode": "playlist", "speed": 0}).encode(), method="POST")
    t0 = time.time()
    while ctl.listener.queue.count() < 2 and time.time() - t0 < 20:
        time.sleep(0.2)
    st = json.loads(call(base, "/api/mode", json.dumps({"mode": "idle"}).encode(), method="POST")[1])
    assert st["mode"] == "idle"
    clips = json.loads(call(base, "/api/clips")[1])
    assert len(clips) >= 2
    status, body = call(base, f"/api/clips/{clips[0]['id']}.wav")
    assert status == 200 and body[:4] == b"RIFF"
    status, z = call(base, "/api/clips.zip")
    assert z[:2] == b"PK"
    n = json.loads(call(base, "/api/clips/delete", b"{}", method="POST")[1])["deleted"]
    assert n == len(clips) and json.loads(call(base, "/api/clips")[1]) == []
