"""BioSpectra Phase 0 model test bench.

    python -m bench.app            (opens http://127.0.0.1:7860)

Drop audio or video files, run YAMNet / BirdNET / Perch side by side, label a
window as a new class and watch the prototype similarities move.
"""

from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import os

os.environ.setdefault("GRADIO_ANALYTICS_ENABLED", "False")  # no telemetry from a field tool

import gradio as gr  # noqa: E402
import numpy as np
import pandas as pd

from core.audio import SUPPORTED_EXTENSIONS, check_ffmpeg
from core.config import ROOT, data_path
from core.models.base import ModelUnavailable
from core.state import state_for
from tools.mixer import append_manifest, mix_files

from . import plots
from .batch import evaluate
from .session import BenchSession

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("biospectra.bench")

S = BenchSession()
CFG = S.cfg
MODEL_IDS = S.registry.ids
DEFAULT_MODELS = [m for m in ("yamnet", "birdnet-2.4") if m in MODEL_IDS]
FILE_TYPES = sorted(SUPPORTED_EXTENSIONS)


# ------------------------------------------------------------------ helpers

def _name(path: str | None) -> str:
    return Path(path).name if path else ""


def _light_html(state, model_id: str, t_known: float, decision) -> str:
    detail = ""
    if decision is not None and decision.best_label:
        detail = f"best: {decision.best_label} {decision.best:.2f}, margin {decision.margin:.2f}"
    return f"""
<div style="display:flex;align-items:center;gap:22px;padding:8px 4px">
  <div role="img" aria-label="device light: {state.kind.value}"
       style="width:96px;height:96px;border-radius:50%;background:{state.color};
              box-shadow:0 0 34px {state.color};border:3px solid #222"></div>
  <div style="font-size:15px;line-height:1.5">
    <div style="font-size:20px;font-weight:600">{state.describe()}</div>
    <div>model <code>{model_id}</code> · T_known {t_known:.2f}</div>
    <div style="opacity:.75">{detail}</div>
  </div>
</div>"""


def _privacy_html(path: str) -> str:
    try:
        r = S.privacy(path)
    except Exception as e:  # never block the bench on the gate
        return f"<b>Privacy gate error:</b> {e}"
    if r is None:
        return f"<b>Privacy gate unavailable:</b> {S.privacy_error}"
    top = sorted(r.per_class.items(), key=lambda kv: -kv[1])[:3]
    color = "#D55E00" if r.speech else "#009E73"
    verdict = "SPEECH DETECTED: clip would be dropped" if r.speech else "No speech: clip may be queued"
    rows = ", ".join(f"{k} {v:.2f}" for k, v in top)
    g = S._privacy
    return (f"<div style='border-left:5px solid {color};padding:6px 10px'><b>{verdict}</b><br>"
            f"max speech score {r.score:.2f} · rule: {g.min_windows}+ windows ≥ {g.threshold:.2f} or one ≥ {g.hard_threshold:.2f} · {rows}</div>")


def _perf_rows(models: list[str], path: str) -> tuple[pd.DataFrame, dict]:
    rows, analyses = [], {}
    for mid in models:
        try:
            a = S.analysis(path, mid)
            m = S.registry.get(mid)
            lat = np.array(a.latency_s) * 1000
            analyses[mid] = a
            rows.append({
                "model": mid, "status": "ok", "sample_rate": m.sample_rate, "window_s": round(m.window_seconds, 3),
                "embedding_dim": m.embedding_dim, "classes": len(m.labels), "windows": len(a.starts),
                "ms_per_window": round(float(lat.mean()), 1), "ms_p95": round(float(np.percentile(lat, 95)), 1),
                "total_s": round(a.total_s, 2), "load_s": round(m.load_stats.load_seconds, 2),
                "rss_at_load_MB": round(m.load_stats.rss_delta_mb),
            })
        except ModelUnavailable as e:
            rows.append({"model": mid, "status": f"unavailable: {e}"})
    return pd.DataFrame(rows), analyses


def _top_rows(analyses: dict) -> pd.DataFrame:
    rows = []
    for mid, a in analyses.items():
        for i, (start, top) in enumerate(zip(a.starts, a.top)):
            row = {"model": mid, "window": i, "start_s": round(float(start), 2),
                   "level_dBFS": round(float(a.level_dbfs[i]), 1), "gate": "ok" if a.energy_ok[i] else "silent"}
            for r, (label, score) in enumerate(top, 1):
                row[f"#{r}"] = f"{label} ({score:.2f})"
            rows.append(row)
    return pd.DataFrame(rows)


def _store_summary(models: list[str], kind: str) -> str:
    lines = []
    for mid in models:
        if mid in S.heads:
            h = S.head(mid, kind)
            cls = ", ".join(f"{k} ×{v}" for k, v in h.classes.items()) or "empty"
            lines.append(f"**{mid}** ({kind}, v{h.version}): {cls}")
    return "\n\n".join(lines) or "_No prototypes yet._"


def refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model):
    """Before/after bars, decisions and the device light for the current file."""
    if not path or not models:
        return None, "", _light_html(state_for(False, False, None), device_model or "-", t_known, None), ""
    rows = S.before_after(path, models, kind, mode, t)
    fig = plots.before_after(rows, t_known)
    lines = []
    for mid in models:
        try:
            d, energy_ok = S.decision(path, mid, kind, mode, t, t_known, margin)
        except ModelUnavailable:
            continue
        if d.recognized:
            lines.append(f"**{mid}**: recognized **{d.label}** (sim {d.best:.2f}, margin {d.margin:.2f})")
        elif d.best_label:
            lines.append(f"**{mid}**: unknown. Best guess {d.best_label} (sim {d.best:.2f}, margin {d.margin:.2f})")
        else:
            lines.append(f"**{mid}**: unknown. No prototypes yet")
    dm = device_model if device_model in models else models[0]
    try:
        d, energy_ok = S.decision(path, dm, kind, mode, t, t_known, margin)
        pr = S.privacy(path)
        state = state_for(energy_ok, bool(pr and pr.speech), d, CFG["head"]["noise_label"])
        light = _light_html(state, dm, t_known, d)
    except ModelUnavailable as e:
        light = f"Light model unavailable: {e}"
    return fig, "\n\n".join(lines), light, _store_summary(models, kind)


# ------------------------------------------------------------------ callbacks

def on_upload(files, paths):
    paths = list(paths or [])
    for f in files or []:
        p = f if isinstance(f, str) else f.name
        if p not in paths:
            paths.append(p)
    choices = [(_name(p), p) for p in paths]
    return paths, gr.update(choices=choices, value=paths[-1] if paths else None)


def on_select(path):
    if not path:
        return None, None, gr.update()
    try:
        x, sr = S.audio(path)
    except Exception as e:
        raise gr.Error(f"Could not decode {_name(path)}: {e}")
    dur = len(x) / sr
    return path, plots.overview(x, sr, f"{_name(path)} · {dur:.1f} s · {sr} Hz"), gr.update(maximum=round(dur, 2), value=0)


def on_run(path, models, kind, mode, t, t_known, margin, device_model, progress=gr.Progress()):
    if not path:
        raise gr.Error("Drop a file and select it first.")
    if not models:
        raise gr.Error("Select at least one model.")
    progress(0.05, desc="privacy gate")
    privacy = _privacy_html(path)
    for i, mid in enumerate(models):
        progress(0.1 + 0.8 * i / len(models), desc=f"running {mid} (first run loads the model)")
        try:
            S.analysis(path, mid)
        except ModelUnavailable:
            pass
    perf, analyses = _perf_rows(models, path)
    top = _top_rows(analyses)
    timeline = plots.timeline(analyses, S.duration(path))
    fig, decisions, light, store = refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model)
    status = "  ·  ".join(f"{k}: {v}" for k, v in S.registry.status().items())
    return privacy, perf, top, timeline, fig, decisions, light, store, status


def on_label(path, models, label, mode, t, kind, t_known, margin, device_model):
    label = (label or "").strip()
    if not path or not models:
        raise gr.Error("Select a file and at least one model.")
    if not label:
        raise gr.Error("Type a label first.")
    msgs = S.add_example(path, models, label, mode, t)
    return (*refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model), "\n".join(msgs))


def on_noise(path, models, mode, t, kind, t_known, margin, device_model):
    return on_label(path, models, CFG["head"]["noise_label"], mode, t, kind, t_known, margin, device_model)


def on_undo(path, models, mode, t, kind, t_known, margin, device_model):
    msgs = S.undo(models or [])
    return (*refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model), "\n".join(msgs) or "nothing to undo")


def on_reset(path, models, mode, t, kind, t_known, margin, device_model):
    msgs = S.reset(models or [])
    return (*refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model), "\n".join(msgs) or "nothing to reset")


def on_export(models, kind):
    out = data_path("prototypes")
    files = []
    for mid in models or []:
        if mid in S.heads:
            safe = re.sub(r"[^a-zA-Z0-9.-]+", "_", mid)
            files.append(str(S.head(mid, kind).save(out / f"{safe}.{kind}.json")))
    if not files:
        raise gr.Error("No prototype store to export yet.")
    return files


def on_import(files, path, models, mode, t, kind, t_known, margin, device_model):
    msgs = [S.import_file(f if isinstance(f, str) else f.name, kind) for f in files or []]
    return (*refresh_prototypes(path, models, kind, mode, t, t_known, margin, device_model), "\n".join(msgs))


def on_batch(folder, models, kind, t_known, margin, splits, progress=gr.Progress()):
    if not models:
        raise gr.Error("Select at least one model.")
    try:
        r = evaluate(S.registry, models, folder, splits=int(splits), t_known=t_known, margin=margin, head_kind=kind,
                     knn_k=CFG["head"]["knn_k"], energy_dbfs=CFG["gates"]["energy_dbfs"],
                     progress=lambda p, m: progress(p, desc=m))
    except (FileNotFoundError, ValueError) as e:
        raise gr.Error(str(e))
    out = data_path("bench_out") / f"batch_{time.strftime('%Y%m%d_%H%M%S')}.csv"
    r.table.to_csv(out, index=False)
    notes = "\n".join(f"- {n}" for n in r.notes) or "All classes were usable."
    return r.table, plots.confusion(r.confusion), str(out), notes


def on_mix(call, noise, label, snr, offset, length, seed):
    if not call or not noise:
        raise gr.Error("Pick a clean call and a noise file.")
    label = (label or "call").strip().replace(" ", "_")
    wav, js = mix_files(call, noise, data_path("bench_out") / "mixes", label=label, snr_db=float(snr),
                        offset_s=float(offset), length_s=float(length), seed=int(seed))
    return str(wav), json.loads(js.read_text()), [str(wav), str(js)], str(js)


def on_send_to_bench(mixed, paths):
    if not mixed:
        raise gr.Error("Mix something first.")
    paths = list(paths or []) + [mixed[0]]
    return paths, gr.update(choices=[(_name(p), p) for p in paths], value=mixed[0])


def on_save_demo(mixed):
    if not mixed:
        raise gr.Error("Mix something first.")
    demo = data_path("demo_set")
    wav = Path(shutil.copy(mixed[0], demo))
    js = Path(shutil.copy(mixed[1], demo))
    m = append_manifest(demo, wav, js)
    return f"Saved {wav.name} and its ground truth to {demo} (manifest: {m.name})"


def on_board(models, threads, progress=gr.Progress()):
    rows = []
    for i, mid in enumerate(models or []):
        progress(i / max(1, len(models)), desc=f"measuring {mid} in a fresh process")
        cmd = [sys.executable, "-m", "core.measure", "--model", mid, "--threads", str(int(threads)), "--windows", "10"]
        proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=900, check=False)
        line = next((ln for ln in proc.stdout.splitlines() if ln.startswith("BIOSPECTRA_RESULT ")), None)
        rows.append(json.loads(line.split(" ", 1)[1]) if line else {"model_id": mid, "error": proc.stderr[-400:]})
    df = pd.DataFrame(rows)
    out = data_path("bench_out") / f"board_{time.strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(out, index=False)
    return df, str(out)


# ------------------------------------------------------------------ UI

def build_ui() -> gr.Blocks:
    with gr.Blocks(title="BioSpectra bench", analytics_enabled=False) as ui:
        gr.Markdown("# BioSpectra · model test bench\nDrop recordings, compare models, teach a class with one example.")
        paths = gr.State([])
        mixed = gr.State(None)
        with gr.Tabs():
            # ---------------------------------------------------------------- analyze
            with gr.Tab("Analyze"):
                with gr.Row():
                    with gr.Column(scale=1):
                        drop = gr.File(label="Drop audio or video (mp3, mp4, m4a, wav, ogg, flac)", file_count="multiple",
                                       file_types=FILE_TYPES)
                        pick = gr.Dropdown(label="Selected file", choices=[])
                        player = gr.Audio(label="Player", type="filepath", interactive=False)
                        models = gr.CheckboxGroup(MODEL_IDS, value=DEFAULT_MODELS, label="Models")
                        run = gr.Button("Run selected models", variant="primary")
                    with gr.Column(scale=2):
                        overview = gr.Plot(label="Waveform and spectrogram")
                        privacy = gr.HTML(label="Privacy gate")
                timeline = gr.Plot(label="Top-1 label per window")
                perf = gr.Dataframe(label="Performance per model", wrap=True)
                top = gr.Dataframe(label="Top 5 labels per window", wrap=True, max_height=320)
                status = gr.Markdown()

                gr.Markdown("## Prototype panel · one store per model")
                with gr.Row():
                    with gr.Column(scale=1):
                        mode = gr.Radio([("Whole clip", "whole"), ("Window at time", "window")], value="whole", label="Example")
                        tsel = gr.Slider(0, 30, value=0, step=0.05, label="Time (s) for window mode")
                        label = gr.Textbox(label="Label", placeholder="e.g. green_treefrog")
                        with gr.Row():
                            add = gr.Button("Label as …", variant="primary")
                            noise = gr.Button("Add as noise")
                        with gr.Row():
                            undo = gr.Button("Undo")
                            reset = gr.Button("Reset", variant="stop")
                        kind = gr.Radio([("Prototype (mean)", "prototype"), ("k-NN", "knn")], value=CFG["head"]["type"],
                                        label="Head")
                        with gr.Row():
                            export = gr.Button("Export JSON")
                            imp = gr.File(label="Import prototype JSON", file_count="multiple", file_types=[".json"])
                        exported = gr.File(label="Exported", file_count="multiple", interactive=False)
                        log_box = gr.Textbox(label="Log", lines=3, interactive=False)
                    with gr.Column(scale=2):
                        gr.Markdown("### Device light preview")
                        light = gr.HTML(_light_html(state_for(False, False, None), CFG["device"]["model_id"], CFG["head"]["t_known"], None))
                        with gr.Row():
                            t_known = gr.Slider(0.0, 1.0, value=CFG["head"]["t_known"], step=0.01,
                                                label="Trust knob = T_known (higher = more cautious)")
                            margin = gr.Slider(0.0, 0.5, value=CFG["head"]["margin"], step=0.01, label="Margin M")
                        device_model = gr.Dropdown(MODEL_IDS, value=CFG["device"]["model_id"], label="Model driving the light")
                        decisions = gr.Markdown()
                        ba = gr.Plot(label="Before and after the last change (current file)")
                        store = gr.Markdown()

            # ---------------------------------------------------------------- batch
            with gr.Tab("Batch evaluation"):
                gr.Markdown("Folder with one subfolder per class. The folder name is the label. "
                            "Each file is embedded once, then 1, 3 and 5 examples per class are drawn over random splits.")
                with gr.Row():
                    folder = gr.Textbox(label="Folder", value=str(ROOT / "data" / "testset"))
                    b_models = gr.CheckboxGroup(MODEL_IDS, value=DEFAULT_MODELS, label="Models")
                    splits = gr.Slider(1, 20, value=5, step=1, label="Random splits")
                b_run = gr.Button("Evaluate", variant="primary")
                b_table = gr.Dataframe(label="Results", wrap=True)
                b_notes = gr.Markdown()
                b_conf = gr.Plot(label="Confusion matrix (largest shot count, summed over splits)")
                b_csv = gr.File(label="CSV")

            # ---------------------------------------------------------------- mixer
            with gr.Tab("Mixer"):
                with gr.Row():
                    m_call = gr.File(label="Clean call", file_types=FILE_TYPES, type="filepath")
                    m_noise = gr.File(label="Noise", file_types=FILE_TYPES, type="filepath")
                with gr.Row():
                    m_label = gr.Textbox(label="Label of the call", value="green_treefrog")
                    m_snr = gr.Slider(-5, 20, value=0, step=0.5, label="SNR (dB)")
                    m_off = gr.Slider(0, 4.5, value=1.0, step=0.05, label="Offset (s)")
                    m_len = gr.Number(value=5.0, label="Length (s)")
                    m_seed = gr.Number(value=0, label="Seed", precision=0)
                m_go = gr.Button("Mix", variant="primary")
                with gr.Row():
                    m_audio = gr.Audio(label="Mixed", type="filepath", interactive=False)
                    m_truth = gr.JSON(label="Ground truth")
                m_json = gr.File(label="Ground-truth JSON", interactive=False)
                with gr.Row():
                    m_send = gr.Button("Send to bench")
                    m_save = gr.Button("Save to demo set")
                m_msg = gr.Markdown()

            # ---------------------------------------------------------------- board
            with gr.Tab("Board simulation"):
                gr.Markdown("Each model is measured in a **fresh process** with limited CPU threads, so the peak memory "
                            "belongs to that model alone. Arduino UNO Q: 4× Cortex-A53, 2 GB RAM shared with Debian. "
                            "A laptop is several times faster than the board, so treat latency as a lower bound.")
                with gr.Row():
                    bd_models = gr.CheckboxGroup(MODEL_IDS, value=MODEL_IDS, label="Models")
                    bd_threads = gr.Slider(1, 8, value=CFG["runtime"]["threads"], step=1, label="CPU threads")
                bd_go = gr.Button("Measure", variant="primary")
                bd_table = gr.Dataframe(label="Per-model measurements", wrap=True)
                bd_csv = gr.File(label="CSV")

        # ---------------------------------------------------------------- wiring
        proto_in = [pick, models, kind, mode, tsel, t_known, margin, device_model]
        proto_out = [ba, decisions, light, store]
        drop.upload(on_upload, [drop, paths], [paths, pick])
        pick.change(on_select, pick, [player, overview, tsel])
        run.click(on_run, proto_in, [privacy, perf, top, timeline, ba, decisions, light, store, status])
        for comp in (t_known, margin, kind, mode, tsel, device_model):
            comp.change(refresh_prototypes, proto_in, proto_out)
        act_in = [pick, models, mode, tsel, kind, t_known, margin, device_model]
        add.click(on_label, [pick, models, label, mode, tsel, kind, t_known, margin, device_model], proto_out + [log_box])
        noise.click(on_noise, act_in, proto_out + [log_box])
        undo.click(on_undo, act_in, proto_out + [log_box])
        reset.click(on_reset, act_in, proto_out + [log_box])
        export.click(on_export, [models, kind], exported)
        imp.upload(on_import, [imp, pick, models, mode, tsel, kind, t_known, margin, device_model], proto_out + [log_box])
        b_run.click(on_batch, [folder, b_models, kind, t_known, margin, splits], [b_table, b_conf, b_csv, b_notes])
        m_go.click(on_mix, [m_call, m_noise, m_label, m_snr, m_off, m_len, m_seed], [m_audio, m_truth, mixed, m_json])
        m_send.click(on_send_to_bench, [mixed, paths], [paths, pick])
        m_save.click(on_save_demo, mixed, m_msg)
        bd_go.click(on_board, [bd_models, bd_threads], [bd_table, bd_csv])
    return ui


def main() -> None:
    try:
        check_ffmpeg()
    except RuntimeError as e:
        print(f"\n[BioSpectra] {e}\n", file=sys.stderr)
        sys.exit(1)
    ui = build_ui()
    ui.queue().launch(server_name="127.0.0.1", server_port=7860, allowed_paths=[str(ROOT / "data"), str(ROOT / "public")])


if __name__ == "__main__":
    main()
