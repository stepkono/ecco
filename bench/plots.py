"""Matplotlib figures for the bench (Agg backend, safe in Gradio worker threads)."""

from __future__ import annotations

import hashlib

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from core.audio import mel_spectrogram  # noqa: E402
from core.pipeline import ClipAnalysis  # noqa: E402

# Okabe-Ito: colour-blind safe
PALETTE = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442", "#000000"]
BEFORE, AFTER = "#9aa4ae", "#0072B2"


def _color(label: str) -> str:
    h = int(hashlib.md5(label.encode()).hexdigest(), 16)
    return PALETTE[h % len(PALETTE)]


def _short(label: str, n: int = 28) -> str:
    label = label.split("_")[-1] if "_" in label else label  # BirdNET: "Scientific_Common" -> common name
    return label if len(label) <= n else label[: n - 1] + "…"


def overview(x: np.ndarray, sr: int, title: str = ""):
    fig, (a, b) = plt.subplots(2, 1, figsize=(10, 4.2), sharex=True, gridspec_kw={"height_ratios": [1, 2.2]})
    t = np.arange(len(x)) / sr
    step = max(1, len(x) // 6000)
    a.plot(t[::step], x[::step], lw=0.6, color="#2b3a42")
    a.set_ylabel("amplitude")
    a.set_ylim(-1.05, 1.05)
    a.set_title(title, fontsize=10, loc="left")
    s = mel_spectrogram(x, sr, n_mels=96)
    vmax = float(s.db.max())
    b.pcolormesh(s.times, np.arange(len(s.freqs)), s.db, shading="auto", cmap="magma", vmin=vmax - 80, vmax=vmax)
    ticks = [i for i, f in enumerate(s.freqs) if i % 16 == 0]
    b.set_yticks(ticks, [f"{s.freqs[i] / 1000:.1f}k" if s.freqs[i] >= 1000 else f"{s.freqs[i]:.0f}" for i in ticks])
    b.set_ylabel("Hz (mel)")
    b.set_xlabel("time (s)")
    fig.tight_layout()
    return fig


def timeline(analyses: dict[str, ClipAnalysis], duration: float):
    if not analyses:
        return None
    n = len(analyses)
    fig, axes = plt.subplots(n, 1, figsize=(10, 1.5 * n + 0.6), sharex=True, squeeze=False)
    for ax, (mid, a) in zip(axes[:, 0], analyses.items()):
        for start, top, ok in zip(a.starts, a.top, a.energy_ok):
            label, score = top[0]
            ax.bar(start, score, width=a.window_seconds * 0.96, align="edge", color=_color(label),
                   alpha=1.0 if ok else 0.35, edgecolor="white")
            if a.window_seconds >= 1.5 or len(a.starts) <= 12:
                ax.text(start + 0.03, min(score, 0.9) + 0.03, _short(label, 18), fontsize=7, rotation=0)
        ax.set_ylim(0, 1.15)
        ax.set_xlim(0, max(duration, a.starts[-1] + a.window_seconds))
        ax.set_ylabel(mid, fontsize=8, rotation=0, ha="right", va="center")
        ax.set_yticks([0, 0.5, 1])
    axes[-1, 0].set_xlabel("time (s): bar = top-1 label and score per window (faded = below energy gate)")
    fig.tight_layout()
    return fig


def before_after(rows: dict[str, tuple[dict[str, float], dict[str, float]]], t_known: float):
    """rows: model_id -> (similarities before, similarities after)."""
    rows = {k: v for k, v in rows.items() if v[0] or v[1]}
    if not rows:
        fig, ax = plt.subplots(figsize=(10, 1.2))
        ax.text(0.5, 0.5, "No prototypes yet. Label a window or the whole clip.", ha="center", va="center")
        ax.axis("off")
        return fig
    n = len(rows)
    height = sum(max(1, len(set(b) | set(a))) for b, a in rows.values()) * 0.42 + 0.8 * n
    fig, axes = plt.subplots(n, 1, figsize=(10, max(2.0, height)), squeeze=False)
    for ax, (mid, (before, after)) in zip(axes[:, 0], rows.items()):
        classes = sorted(set(before) | set(after), key=lambda c: -after.get(c, before.get(c, 0)))
        y = np.arange(len(classes))
        ax.barh(y + 0.2, [before.get(c, np.nan) for c in classes], 0.38, color=BEFORE, label="before")
        ax.barh(y - 0.2, [after.get(c, np.nan) for c in classes], 0.38, color=AFTER, label="after")
        for yi, c in zip(y, classes):
            if c in after:
                ax.text(max(after[c], 0) + 0.01, yi - 0.2, f"{after[c]:.2f}", va="center", fontsize=8)
        ax.axvline(t_known, color="#D55E00", ls="--", lw=1)
        ax.set_yticks(y, [_short(c, 24) for c in classes])
        ax.invert_yaxis()
        ax.set_xlim(min(0, *(list(before.values()) + list(after.values()) + [0])), 1.08)
        ax.set_title(f"{mid}: cosine similarity to each class (dashed = T_known)", fontsize=9, loc="left")
        ax.legend(loc="lower right", fontsize=7)
    fig.tight_layout()
    return fig


def confusion(matrices: dict[str, tuple[np.ndarray, list[str]]]):
    if not matrices:
        return None
    n = len(matrices)
    fig, axes = plt.subplots(1, n, figsize=(4.6 * n, 4.2), squeeze=False)
    for ax, (mid, (m, labels)) in zip(axes[0], matrices.items()):
        norm = m / np.maximum(m.sum(1, keepdims=True), 1)
        ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
        for i in range(len(labels)):
            for j in range(len(labels)):
                if m[i, j]:
                    ax.text(j, i, int(m[i, j]), ha="center", va="center", fontsize=8,
                            color="white" if norm[i, j] > 0.5 else "black")
        ax.set_xticks(range(len(labels)), [_short(lb, 12) for lb in labels], rotation=45, ha="right", fontsize=8)
        ax.set_yticks(range(len(labels)), [_short(lb, 12) for lb in labels], fontsize=8)
        ax.set_title(mid, fontsize=10)
        ax.set_xlabel("predicted")
        ax.set_ylabel("true")
    fig.tight_layout()
    return fig
