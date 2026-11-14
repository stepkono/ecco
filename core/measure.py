"""Measure one model in a fresh process: load time, latency per window, peak memory.

Peak memory can only be attributed to one model if nothing else is loaded, so
the bench runs this as a subprocess:

    python -m core.measure --model birdnet-2.4 --threads 4 --windows 10

Prints one JSON line. Board budget: Arduino UNO Q has 2 GB RAM for Linux,
the runtime and the model together.
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys
import time

BOARD_RAM_MB = 2048
COMFORT_FRACTION = 0.5  # leave half of the board's RAM for Debian, App Lab and the rest


def peak_rss_mb() -> float:
    r = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return r / 1e6 if sys.platform == "darwin" else r / 1e3  # bytes on macOS, KiB on Linux


def fit_verdict(peak_mb: float) -> str:
    if peak_mb <= BOARD_RAM_MB * COMFORT_FRACTION:
        return "fits comfortably"
    if peak_mb <= BOARD_RAM_MB * 0.8:
        return "tight: leaves little room for the OS"
    return "does not fit comfortably into 2 GB"


def measure(model_id: str, threads: int | None, n_windows: int) -> dict:
    # limit math libraries before they initialise
    if threads:
        for var in ("OMP_NUM_THREADS", "TF_NUM_INTRAOP_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
            os.environ[var] = str(threads)
        os.environ["TF_NUM_INTEROP_THREADS"] = "1"
    import numpy as np

    from core.models import build_registry

    base_mb = peak_rss_mb()
    reg = build_registry(threads=threads)
    t0 = time.perf_counter()
    m = reg.get(model_id)
    load_s = time.perf_counter() - t0
    rng = np.random.default_rng(0)
    w = (rng.standard_normal((n_windows + 1, m.window_samples)) * 0.05).astype(np.float32)
    m.embed(w[1:])
    emb = list(m.last_latency_s)
    m.embed_and_scores(w[1:])  # the device path: one inference gives embedding and scores
    lat = list(m.last_latency_s)
    peak = peak_rss_mb()
    return {
        "model_id": model_id,
        "threads": threads,
        "window_seconds": m.window_seconds,
        "sample_rate": m.sample_rate,
        "embedding_dim": m.embedding_dim,
        "classes": len(m.labels),
        "load_s": round(load_s, 2),
        "embed_ms_mean": round(1000 * float(np.mean(emb)), 1),
        "window_ms_mean": round(1000 * float(np.mean(lat)), 1),
        "window_ms_p95": round(1000 * float(np.percentile(lat, 95)), 1),
        "real_time_factor": round(m.window_seconds / float(np.mean(lat)), 1),
        "peak_rss_mb": round(peak, 0),
        "python_baseline_mb": round(base_mb, 0),
        "board_fit": fit_verdict(peak),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--threads", type=int, default=None)
    ap.add_argument("--windows", type=int, default=10)
    a = ap.parse_args()
    try:
        out = measure(a.model, a.threads, a.windows)
    except Exception as e:  # report instead of crashing the bench
        out = {"model_id": a.model, "error": f"{type(e).__name__}: {e}"}
    print("BIOSPECTRA_RESULT " + json.dumps(out), flush=True)


if __name__ == "__main__":
    main()
