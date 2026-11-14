"""Load config.yaml once and expose it as a plain dict.

Machine-specific values (for example the backend address on the board) go into
`config.local.yaml` next to it. That file is git-ignored and is merged on top:

    # config.local.yaml on the UNO Q
    device:
      backend_url: http://10.0.41.129:8000

An extra overlay can be named in the environment variable BIOSPECTRA_OVERLAY
(the demo uses demo/config.demo.yaml).
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent.parent


def _merge(base: dict, over: dict) -> dict:
    out = dict(base)
    for k, v in (over or {}).items():
        out[k] = _merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


@lru_cache(maxsize=1)
def load_config(path: str | None = None) -> dict[str, Any]:
    cfg_path = Path(path or os.environ.get("BIOSPECTRA_CONFIG", ROOT / "config.yaml"))
    with open(cfg_path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    local = cfg_path.with_name("config.local.yaml")
    overlays = [local] if local.exists() else []
    if os.environ.get("BIOSPECTRA_OVERLAY"):  # e.g. demo/config.demo.yaml for the scripted demo
        overlays.append(ROOT / os.environ["BIOSPECTRA_OVERLAY"])
    for ov in overlays:
        with open(ov, encoding="utf-8") as f:
            cfg = _merge(cfg, yaml.safe_load(f) or {})
    return cfg


def data_path(key: str) -> Path:
    """Resolve a path from the `paths` section relative to the repo root and create it."""
    p = ROOT / load_config()["paths"][key]
    p.mkdir(parents=True, exist_ok=True)
    return p
