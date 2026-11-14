"""Few-shot batch evaluation on a folder with one subfolder per class.

For every model: embed each file once (mean of its window embeddings), then
simulate few-shot learning with 1, 3 and 5 examples per class over several
random splits. Also hold out one class completely and count how often its
clips are flagged as unknown.

By default, training and test clips never come from the same source recording
(see `recording_id`). Otherwise, chunks of one recording would make every model
look perfect.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd

from core.audio import SUPPORTED_EXTENSIONS, load_audio
from core.heads import decide, make_head
from core.models.base import ModelRegistry, ModelUnavailable
from core.pipeline import analyze


@dataclass
class BatchResult:
    table: pd.DataFrame
    confusion: dict[str, tuple[np.ndarray, list[str]]]
    notes: list[str]


def scan_folder(folder: str | Path) -> dict[str, list[Path]]:
    root = Path(folder).expanduser()
    if not root.is_dir():
        raise FileNotFoundError(f"{root} is not a folder")
    out = {}
    for sub in sorted(p for p in root.iterdir() if p.is_dir()):
        files = sorted(f for f in sub.iterdir() if f.suffix.lower() in SUPPORTED_EXTENSIONS)
        if files:
            out[sub.name] = files
    if len(out) < 2:
        raise ValueError(f"{root} needs at least two class subfolders with audio files")
    return out


def _embed_all(model, files: dict[str, list[Path]], energy_dbfs: float, progress: Callable[[float, str], None]):
    emb, lat = {}, []
    total = sum(len(v) for v in files.values())
    done = 0
    for label, paths in files.items():
        for p in paths:
            x, sr = load_audio(p)
            a = analyze(model, x, sr, energy_dbfs=energy_dbfs)
            emb[p] = a.clip_embedding()
            lat.extend(a.latency_s)
            done += 1
            progress(done / total, f"{model.model_id}: {done}/{total}")
    return emb, lat


def recording_id(p: Path) -> str:
    """Which source recording a clip was cut from, so splits never share a recording.

    * ESC-50: `{fold}-{freesound id}-{take}-{class}.wav` -> freesound id
    * tools.make_test_set: `{stem}_{start}s.wav` -> stem
    * anything else: the file itself
    """
    m = re.match(r"^\d+-(\w+)-[A-Z]+-\d+$", p.stem)
    if m:
        return "esc50:" + m.group(1)
    m = re.match(r"^(.*)_\d+(?:\.\d+)?s$", p.stem)
    if m:
        return m.group(1)
    return p.stem


def _split(paths: list[Path], n: int, rng: np.random.Generator, by_recording: bool) -> tuple[list[Path], list[Path]]:
    if not by_recording:
        idx = rng.permutation(len(paths))
        return [paths[i] for i in idx[:n]], [paths[i] for i in idx[n:]]
    groups: dict[str, list[Path]] = {}
    for p in paths:
        groups.setdefault(recording_id(p), []).append(p)
    for _ in range(10):  # retry until at least one recording is left for testing
        keys = list(groups)
        rng.shuffle(keys)
        train: list[Path] = []
        used = 0
        while used < len(keys) and len(train) < n:
            g = list(groups[keys[used]])
            rng.shuffle(g)
            train += g[: n - len(train)]
            used += 1
        test = [p for k in keys[used:] for p in groups[k]]
        if test:
            return train, test
    return train, test


def _fit(kind: str, model, train: list[tuple[str, np.ndarray]], k: int):
    head = make_head(kind, model.model_id, model.model_version, model.embedding_dim, k)
    for label, e in train:
        head.add_example(label, e)
    return head


def evaluate(registry: ModelRegistry, model_ids: list[str], folder: str | Path, *, shots=(1, 3, 5), splits: int = 5,
             t_known: float = 0.75, margin: float = 0.05, head_kind: str = "prototype", knn_k: int = 3,
             energy_dbfs: float = -55.0, seed: int = 0, by_recording: bool = True,
             progress: Callable[[float, str], None] = lambda p, m: None) -> BatchResult:
    files = scan_folder(folder)
    classes = list(files)
    rows, conf, notes = [], {}, []
    for mid in model_ids:
        try:
            model = registry.get(mid)
        except ModelUnavailable as e:
            notes.append(f"{mid}: unavailable ({e})")
            continue
        t0 = time.perf_counter()
        emb, lat = _embed_all(model, files, energy_dbfs, progress)
        embed_s = time.perf_counter() - t0
        rng = np.random.default_rng(seed)
        for n in shots:
            usable = [c for c in classes if len(files[c]) > n and (not by_recording or len({recording_id(p) for p in files[c]}) >= 2)]
            if len(usable) < 2:
                notes.append(f"{mid}: {n}-shot skipped, fewer than 2 classes have enough files"
                             + (" from at least 2 recordings" if by_recording else ""))
                continue
            if len(usable) < len(classes):
                notes.append(f"{mid}: {n}-shot uses {len(usable)}/{len(classes)} classes "
                             + ("(others have too few files or only one recording)" if by_recording else "(others too small)"))
            accs, unk_rates, false_unk = [], [], []
            cm = np.zeros((len(usable), len(usable)), dtype=int)
            for _ in range(splits):
                train, test = [], []
                for c in usable:
                    tr, te = _split(files[c], n, rng, by_recording)
                    train += [(c, emb[p]) for p in tr]
                    test += [(c, emb[p]) for p in te]
                head = _fit(head_kind, model, train, knn_k)
                correct = 0
                for c, e in test:
                    sims = head.similarities(e)
                    pred = max(sims, key=sims.get)
                    correct += pred == c
                    cm[usable.index(c), usable.index(pred)] += 1
                accs.append(correct / len(test))
                # open set: hold out one class completely
                held = usable[int(rng.integers(len(usable)))]
                head2 = _fit(head_kind, model, [t for t in train if t[0] != held], knn_k)
                held_files = [emb[p] for p in files[held]]
                unk_rates.append(np.mean([decide(head2.similarities(e), t_known, margin).label is None for e in held_files]))
                known_test = [e for c, e in test if c != held]
                false_unk.append(np.mean([decide(head2.similarities(e), t_known, margin).label is None for e in known_test]) if known_test else np.nan)
            conf[f"{mid} ({n}-shot)"] = (cm, usable)
            rows.append({
                "model": mid,
                "shots": n,
                "split": "by recording" if by_recording else "by file",
                "classes": len(usable),
                "accuracy": round(float(np.mean(accs)), 3),
                "accuracy_std": round(float(np.std(accs)), 3),
                "held_out_flagged_unknown": round(float(np.mean(unk_rates)), 3),
                "known_flagged_unknown": round(float(np.nanmean(false_unk)), 3),
                "ms_per_window": round(1000 * float(np.mean(lat)), 1),
                "embed_all_s": round(embed_s, 1),
                "files": sum(len(v) for v in files.values()),
            })
    # keep only the largest shot count per model in the confusion view
    best = {}
    for key, val in conf.items():
        mid = key.split(" (")[0]
        best[mid] = (key, val)
    return BatchResult(pd.DataFrame(rows), {k: v for k, v in best.values()}, notes)
