"""Fast tests for the model-independent parts of core/ (no downloads needed)."""

from __future__ import annotations

import json

import numpy as np
import pytest

from core.audio import apply_mask, make_windows, rms_dbfs, stft_spectrogram
from core.heads import KNNHead, PrototypeHead, PrototypeMismatch, decide, l2norm
from core.queue import ClipQueue
from core.state import QUIET, State, StateKind, StateMachine, state_for
from tools.mixer import _active_rms, mix

rng = np.random.default_rng(0)


def vec(seed: int, d: int = 16) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(d).astype(np.float32)


def test_windows_pad_last_and_cover_signal():
    x = np.ones(25, np.float32)
    w = make_windows(x, sr=10, window_seconds=1.0)
    assert w.data.shape == (3, 10)
    assert w.data[2, :5].sum() == 5 and w.data[2, 5:].sum() == 0
    assert list(w.starts) == [0.0, 1.0, 2.0]


def test_apply_mask_identity_and_zero():
    x = (rng.standard_normal(16000) * 0.1).astype(np.float32)
    s = stft_spectrogram(x, 16000)
    assert np.abs(apply_mask(x, 16000, np.ones_like(s.db)) - x).max() < 1e-5
    assert np.abs(apply_mask(x, 16000, np.zeros_like(s.db))).max() < 1e-6
    with pytest.raises(ValueError):
        apply_mask(x, 16000, np.ones((3, 3)))


def test_decide_threshold_and_margin():
    assert decide({"a": 0.9, "b": 0.5}, 0.75, 0.05).label == "a"
    assert decide({"a": 0.7, "b": 0.5}, 0.75, 0.05).label is None  # below T_known
    d = decide({"a": 0.9, "b": 0.88}, 0.75, 0.05)
    assert d.label is None and d.best_label == "a"  # margin too small
    assert decide({}, 0.75, 0.05).label is None


def test_prototype_incremental_mean_undo_and_new_class():
    h = PrototypeHead("m", "1", 16)
    a1, a2 = vec(1), vec(2)
    h.add_example("frog", a1)
    h.add_example("frog", a2)
    expect = l2norm((l2norm(a1) + l2norm(a2)) / 2)
    assert np.allclose(h.prototypes()["frog"], expect, atol=1e-6)
    h.add_example("rain", vec(3))  # one example creates a class
    assert h.classes == {"frog": 2, "rain": 1}
    assert h.remove_last() and "rain" not in h.classes
    assert h.version == 4
    sims = h.similarities(a1)
    assert sims["frog"] > 0.5


def test_prototype_json_roundtrip_and_mismatch():
    h = PrototypeHead("birdnet-2.4", "2.4", 16)
    h.add_example("frog", vec(1))
    h.add_example("frog", vec(2))
    text = h.export_json()
    d = json.loads(text)
    assert d["model_id"] == "birdnet-2.4" and d["embedding_dim"] == 16 and d["version"] == 2 and "created_at" in d
    h2 = PrototypeHead("birdnet-2.4", "2.4", 16)
    h2.import_json(text)
    assert np.allclose(h2.prototypes()["frog"], h.prototypes()["frog"], atol=1e-5)
    h2.add_example("frog", vec(5))  # the imported count keeps the incremental mean correct
    assert h2.classes["frog"] == 3
    with pytest.raises(PrototypeMismatch):
        PrototypeHead("perch-2.0", "2.0", 16).import_json(text)
    with pytest.raises(PrototypeMismatch):
        PrototypeHead("birdnet-2.4", "2.4", 32).import_json(text)


def test_knn_majority():
    h = KNNHead("m", "1", 16, k=3)
    base = vec(10)
    for i in range(3):
        h.add_example("frog", base + 0.05 * vec(20 + i))
    h.add_example("rain", vec(99))
    sims = h.similarities(base)
    assert max(sims, key=sims.get) == "frog"


def test_state_mapping_and_noise_is_quiet():
    rec = decide({"frog": 0.9}, 0.75, 0.05)
    assert state_for(True, False, rec).kind == StateKind.RECOGNIZED
    assert state_for(True, True, rec) == QUIET  # speech never shows as anything
    assert state_for(False, False, rec) == QUIET  # silence
    assert state_for(True, False, decide({"noise": 0.95}, 0.75, 0.05)) == QUIET  # fixed false alarm
    assert state_for(True, False, decide({"frog": 0.5}, 0.75, 0.05)).kind == StateKind.NEEDS_HELP


def test_state_machine_hold():
    sm = StateMachine(hold_seconds=2.0)
    green = State(StateKind.RECOGNIZED, "frog", 0.9)
    assert sm.update(green, now=0.0) == green
    assert sm.update(QUIET, now=1.0) == green  # held
    assert sm.update(QUIET, now=2.5) == QUIET
    amber = State(StateKind.NEEDS_HELP, "x", 0.4)
    assert sm.update(amber, now=2.6) == amber  # non-quiet changes are immediate


def test_mixer_hits_requested_snr():
    sr = 16000
    t = np.arange(sr * 2) / sr
    call = (0.3 * np.sin(2 * np.pi * 800 * t)).astype(np.float32)
    noise = (rng.standard_normal(sr * 6) * 0.2).astype(np.float32)
    y, out_sr, info = mix(call, sr, noise, sr, snr_db=6.0, offset_s=1.0, length_s=5.0)
    assert out_sr == sr and len(y) == 5 * sr
    bed = (y - np.pad(call, (sr, 5 * sr - sr - len(call)))) if not info["peak_normalised"] else None
    if bed is not None:
        snr = 20 * np.log10(_active_rms(call, sr) / _active_rms(bed, sr))
        assert abs(snr - 6.0) < 0.5
    assert rms_dbfs(y) > -60


def test_queue_survives_reopen(tmp_path):
    q = ClipQueue(tmp_path)
    cid = q.enqueue(np.zeros(800, np.float32), 16000, vec(1), device_id="d", model_id="m", best_guess="frog",
                    best_score=0.5, scores={"frog": 0.5})
    q2 = ClipQueue(tmp_path)
    [c] = q2.pending()
    assert c.id == cid and np.allclose(c.embedding, vec(1)) and c.scores == {"frog": 0.5}
    q2.mark_uploaded(cid)
    assert q2.count(only_pending=True) == 0 and q2.count() == 1
