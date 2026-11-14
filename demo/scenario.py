"""Scripted end-to-end scenario (plan, Phase 4). Plays the player's part automatically.

    python -m demo.scenario --runs 3                                    # laptop device (demo/run_demo.sh)
    python -m demo.scenario --device http://10.0.41.141:8765 --token T  # the UNO Q

Per run:
  0. reset: the backend forgets events and labels and republishes the seed prototypes,
     the device forgets its queue. Wait until the device runs the seed version.
  1. the device plays data/demo/before once: unknown sound A and a rain clip need help, both are sent
  2. the "player" labels A as the new species and the rain clip as noise, boxing the unclear segments
  3. wait until the device has installed the new prototypes
  4. the device plays data/demo/after once: A and A2 must be recognized, the rain clip must be quiet
Acceptance: every run passes, and the loop (A needs help -> A recognized) takes under 30 s.
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import time
import urllib.parse
import urllib.request
from pathlib import Path

from core.config import ROOT


class Api:
    def __init__(self, base: str, token: str = "") -> None:
        self.base, self.token = base.rstrip("/"), token

    def call(self, method: str, path: str, body=None, timeout: float = 60):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json", "X-Token": self.token})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw and r.headers.get("content-type", "").startswith("application/json") else None)

    get = lambda self, p: self.call("GET", p)[1]  # noqa: E731
    post = lambda self, p, b=None: self.call("POST", p, b if b is not None else {})[1]  # noqa: E731


class DeviceEvents(threading.Thread):
    """Collects the device's decisions (Server-Sent Events of the developer console)."""

    def __init__(self, dev: Api) -> None:
        super().__init__(daemon=True)
        self.dev, self.decisions, self.lock = dev, [], threading.Lock()

    def run(self) -> None:
        url = f"{self.dev.base}/api/events?token={urllib.parse.quote(self.dev.token)}"
        with urllib.request.urlopen(url, timeout=3600) as r:
            for line in r:
                if line.startswith(b"data: "):
                    e = json.loads(line[6:])
                    if e.get("type") == "decision" and e.get("raw_state"):
                        with self.lock:
                            self.decisions.append((time.monotonic(), e["source"], e["raw_state"], e.get("label")))

    def since(self, t: float) -> list:
        with self.lock:
            return [d for d in self.decisions if d[0] >= t]


def wait(cond, timeout: float, what: str, step: float = 0.2):
    t = time.monotonic()
    while time.monotonic() - t < timeout:
        v = cond()
        if v:
            return v
        time.sleep(step)
    raise TimeoutError(f"timed out after {timeout:.0f} s waiting for {what}")


def play_once(dev: Api, folder: str, speed: float, n_files: int, events: DeviceEvents) -> list:
    t = time.monotonic()
    dev.post("/api/mode", {"mode": "playlist", "path": folder, "speed": speed, "loop": False})
    wait(lambda: len(events.since(t)) >= n_files, 30 + n_files * 5 / max(speed, 0.2), f"{folder} to play")
    wait(lambda: dev.get("/api/status")["mode"] == "idle", 15, "the playlist to end")
    return events.since(t)


def run_once(be: Api, dev: Api, events: DeviceEvents, manifest: dict, speed: float) -> dict:
    species, noise = manifest["species"], manifest["noise_label"]
    v = be.post("/demo/reset")["version"]
    dev.post("/api/demo/reset")
    wait(lambda: dev.get("/api/status")["proto_version"] >= v, 30, f"the device to reset to prototypes v{v}")
    ev_start = len(be.get("/events?limit=500"))

    # 1. unknown sound and rain play: both need help and are sent
    before = play_once(dev, "data/demo/before", speed, len(manifest["playlists"]["before"]), events)
    t_help = next(t for t, src, st, _ in before if "unknown_A" in src and st == "needs_help")
    wait(lambda: sum(e["type"] == "clip_received" for e in be.get("/events?limit=500")[ev_start - 1:]) >= 2,
         20, "both events to reach the backend")

    # 2. a player boxes the unclear parts and labels them
    pid = be.post("/players", {"nickname": "scenario"})["player_id"]
    labelled = {}
    while True:
        status, puzzle = be.call("GET", f"/puzzles/next?player_id={pid}")
        if status == 204 or puzzle is None:
            break
        info = be.get(f"/clips/{puzzle['clip_id']}")
        srcs = " ".join(s.get("source", "") for s in info["timeline"])
        label = species if "unknown_A" in srcs else noise if "rain" in srcs else "other"
        boxes = [{"t0": s["start"], "t1": s["end"], "f0": 0, "f1": 24000} for s in info["timeline"]]
        res = be.post(f"/clips/{puzzle['clip_id']}/labels", {"player_id": pid, "label": label,
                                                             "mask": {"boxes": boxes} if boxes else None})
        labelled[label] = res.get("prototype_version")
    if species not in labelled or noise not in labelled:
        raise AssertionError(f"expected puzzles for {species} and {noise}, labelled {labelled}")
    t_label = time.monotonic()

    # 3. the device installs the new prototypes
    latest = be.get("/stats")["prototype_version"]
    wait(lambda: dev.get("/api/status")["proto_version"] >= latest, 30, f"the device to install v{latest}")
    t_installed = time.monotonic()

    # 4. replay: A and A2 recognized, rain quiet
    after = play_once(dev, "data/demo/after", speed, len(manifest["playlists"]["after"]), events)
    results, ok = [], True
    for item in manifest["playlists"]["after"]:
        got = next(((st, lbl) for _, src, st, lbl in after if src == item["file"]), (None, None))
        good = got[0] == item["expect"] and (item["label"] is None or got[1] == item["label"])
        ok &= good
        results.append(f"{item['file']}: {got[0]} {got[1] or ''} ({'ok' if good else 'expected ' + item['expect']})")
    t_rec = next((t for t, src, st, lbl in after if "unknown_A" in src and st == "recognized"), None)
    loop_s = (t_rec - t_help) if t_rec else float("nan")
    return {"ok": ok and loop_s < 30, "loop_s": round(loop_s, 1), "label_to_installed_s": round(t_installed - t_label, 1),
            "version": latest, "results": results}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--backend", default="http://localhost:8000")
    ap.add_argument("--device", default="http://localhost:8766")
    ap.add_argument("--token", default="")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--speed", type=float, default=1.0, help="playback speed of the demo playlists")
    a = ap.parse_args()
    manifest = json.loads((ROOT / "data" / "demo" / "manifest.json").read_text())
    be, dev = Api(a.backend), Api(a.device, a.token)
    events = DeviceEvents(dev)
    events.start()
    time.sleep(0.5)
    failures = 0
    for i in range(1, a.runs + 1):
        try:
            r = run_once(be, dev, events, manifest, a.speed)
        except (AssertionError, TimeoutError, StopIteration) as e:
            r = {"ok": False, "error": str(e) or type(e).__name__}
        failures += not r["ok"]
        print(f"run {i}: {'PASS' if r['ok'] else 'FAIL'} " + json.dumps({k: v for k, v in r.items() if k != 'ok'}))
    print(f"{a.runs - failures}/{a.runs} runs passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
