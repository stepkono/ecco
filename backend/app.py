"""Phase 2 backend: clips from listening posts, puzzles for players, prototypes back to the posts.

    python -m backend.app                # http://<laptop>:8000, labeling page at /

Endpoints (see docs/SYSTEM.md):
  POST /devices/{device_id}/clips      multipart: audio (WAV) + metadata (JSON)
  POST /players                        {"nickname"} -> {"player_id"}
  GET  /puzzles/next?player_id=        next open event (sometimes a hidden gold clip)
  GET  /clips/{id}                     metadata incl. timeline of the unclear segments
  GET  /clips/{id}/audio               WAV
  GET  /clips/{id}/spectrogram         dB grid with time and frequency axes
  POST /clips/{id}/preview             {"mask"} -> masked audio (WAV)
  POST /clips/{id}/labels              {"player_id", "label", "mask"?}
  GET  /prototypes/latest?model_id=    prototype JSON, 204 when there is none (devices add device_id, have)
  GET  /events/stream                  Server-Sent Events for the demo screen
  GET  /events                         recent events
  GET  /stats
  GET  /screen                         event screen for the demo
  POST /demo/reset                     demo mode only: forget events and labels, republish the seed prototypes
"""

from __future__ import annotations

import argparse
import json
import logging
import queue as queue_mod
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response, StreamingResponse
from pydantic import BaseModel

from core.config import ROOT, load_config

from .service import Backend
from .store import Store

log = logging.getLogger("biospectra.backend")
WEB = Path(__file__).parent / "web"


class PlayerIn(BaseModel):
    nickname: str = "player"


class MaskIn(BaseModel):
    mask: dict | None = None


class LabelIn(BaseModel):
    player_id: str
    label: str
    mask: dict | None = None


def create_app(cfg: dict | None = None, data_dir: str | Path | None = None) -> FastAPI:
    cfg = cfg or load_config()
    store = Store(data_dir or ROOT / cfg["paths"]["backend"])
    be = Backend(cfg, store)
    app = FastAPI(title="BioSpectra backend", version="0.2")
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.state.backend = be

    def not_found(e: KeyError):
        raise HTTPException(404, str(e).strip("'"))

    @app.get("/", response_class=HTMLResponse)
    def play_page():
        return (WEB / "play.html").read_text(encoding="utf-8")

    @app.post("/devices/{device_id}/clips", status_code=201)
    def upload_clip(device_id: str, audio: UploadFile = File(...), metadata: str = Form("{}")):
        try:
            meta = json.loads(metadata)
        except json.JSONDecodeError as e:
            raise HTTPException(400, f"metadata is not JSON: {e}")
        return be.receive_clip(device_id, meta, audio.file.read())

    @app.post("/players", status_code=201)
    def new_player(p: PlayerIn):
        return {"player_id": be.store.add_player(p.nickname), "nickname": p.nickname}

    @app.get("/puzzles/next")
    def next_puzzle(player_id: str):
        try:
            puzzle = be.next_puzzle(player_id)
        except KeyError as e:
            not_found(e)
        if puzzle is None:
            return Response(status_code=204)
        return puzzle

    @app.get("/clips/{cid}")
    def clip_info(cid: str):
        try:
            return be.clip_info(cid)
        except KeyError as e:
            not_found(e)

    @app.post("/demo/reset")
    def demo_reset():
        try:
            return be.demo_reset()
        except ValueError as e:
            raise HTTPException(403, str(e))

    @app.get("/screen", response_class=HTMLResponse)
    def event_screen():
        return (WEB / "screen.html").read_text(encoding="utf-8")

    @app.get("/clips/{cid}/audio")
    def clip_audio(cid: str):
        c = be.store.clip(cid)
        if c is None:
            raise HTTPException(404, "no such clip")
        return FileResponse(c["audio_path"], media_type="audio/wav")

    @app.get("/clips/{cid}/spectrogram")
    def clip_spectrogram(cid: str):
        try:
            return be.spectrogram(cid)
        except KeyError as e:
            not_found(e)

    @app.post("/clips/{cid}/preview")
    def clip_preview(cid: str, body: MaskIn):
        try:
            return Response(be.preview(cid, body.mask), media_type="audio/wav")
        except KeyError as e:
            not_found(e)
        except ValueError as e:
            raise HTTPException(400, str(e))

    @app.post("/clips/{cid}/labels")
    def clip_label(cid: str, body: LabelIn):
        try:
            return be.submit_label(cid, body.player_id, body.label, body.mask)
        except KeyError as e:
            not_found(e)
        except ValueError as e:
            raise HTTPException(400, str(e))

    @app.get("/prototypes/latest")
    def prototypes_latest(model_id: str, device_id: str | None = None, have: int | None = None):
        text = be.latest_prototypes(model_id, device_id, have)
        if text is None:
            return Response(status_code=204)
        return Response(text, media_type="application/json")

    @app.get("/events")
    def events(limit: int = 50):
        return be.store.recent_events(limit)

    @app.get("/events/stream")
    def events_stream():
        q = be.bus.subscribe()

        def gen():
            try:
                yield f"data: {json.dumps({'type': 'hello', **be.stats()})}\n\n"
                while True:
                    try:
                        yield f"data: {json.dumps(q.get(timeout=15))}\n\n"
                    except queue_mod.Empty:
                        yield ": keep-alive\n\n"
            finally:
                be.bus.unsubscribe(q)

        return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-store"})

    @app.get("/stats")
    def stats():
        return JSONResponse(be.stats())

    return app


def main() -> None:
    import uvicorn

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    cfg = load_config()
    ap.add_argument("--host", default=cfg["backend"].get("host", "0.0.0.0"))
    ap.add_argument("--port", type=int, default=int(cfg["backend"].get("port", 8000)))
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s", datefmt="%H:%M:%S")
    uvicorn.run(create_app(cfg), host=a.host, port=a.port, log_level="warning")


if __name__ == "__main__":
    main()
