# Licenses and sources

## Models

| Model | Weights | License | Notes |
|---|---|---|---|
| YAMNet (`yamnet`, `yamnet-tflite`) | Kaggle Models `google/yamnet` (TF2 SavedModel and TFLite) | Apache 2.0 | Downloaded on first use by `kagglehub` into `~/.cache/kagglehub`. |
| BirdNET 2.4 (`birdnet-2.4`, `birdnet-2.4-int8`) | Zenodo record 15050749, fetched by the `birdnet` package | **CC BY-NC-SA 4.0, non-commercial** | The `birdnet` Python package itself is MIT. Cache: `~/Library/Application Support/birdnet` (macOS). |
| Perch 2.0 (`perch-2.0`) | Kaggle `google/bird-vocalization-classifier`, mirrored by the `birdnet` package (tuc.cloud) | Code: Apache 2.0 (google-research/perch). **Weights: not verified yet**, check the license section on the Kaggle model page before any public or commercial use. | ~380 MB download, FP32 only. |

## Audio

The web game clips in `public/audio` come from Wikimedia Commons. Authors and licenses are listed in `README.md` (section "Audio sources") and in `src/game/catalog.ts`.

Local test material in `data/` (git-ignored) was cut from the same Wikimedia Commons recordings:

| Recording | Author | License |
|---|---|---|
| Hyla cinerea call audio.ogg | Fredlyfish4 | CC BY-SA 3.0 |
| Marsh frog (Pelophylax ridibundus) call.ogg | Llivermore | CC BY-SA 4.0 |
| Litoria fallax jul08.ogg | Aviceda | CC BY-SA 3.0 |
| Cicada orni.ogg | DavidDelon | Public domain |
| Chainsaw 1.ogg, Chainsaw 3.ogg | ezwa | Public domain |
| Sound of rain.ogg | Effib | CC BY-SA 3.0 |

Speech test clips in `data/testset_speech` are synthesised locally with macOS `say` and are not distributed.

Planned sources (check every recording individually): Xeno-canto (per-recording CC licenses), ESC-50 (CC BY-NC, non-commercial).

## Python dependencies

Gradio (Apache 2.0), TensorFlow (Apache 2.0), LiteRT (Apache 2.0), NumPy/SciPy/pandas/matplotlib (BSD-style), soundfile (BSD), PyYAML (MIT), psutil (BSD).

## Soundscape recordings (local, `data/soundscapes/`, fetched by `tools/fetch_soundscapes.py`)

| Dataset | Source | License | Credit |
|---|---|---|---|
| Southwestern Amazon soundscapes (21 one-hour recordings, Peru) | [Zenodo 7079124](https://zenodo.org/records/7079124) | CC BY 4.0 | Hopping, Kahl, Klinck (2022) |
| Northeastern US soundscapes (285 one-hour recordings, Sapsucker Woods, NY) | [Zenodo 7018484](https://zenodo.org/records/7018484) | CC BY 4.0 | Kahl et al. (2022) |
| AnuraSet (1-minute recordings, Brazilian wetlands, frog activity labels) | [Zenodo 8342596](https://zenodo.org/records/8342596) | CC BY (per the Zenodo record. The paper states CC0) | Cañas et al. (2023), Scientific Data |

ESC-50 (`data/esc50/`): Piczak (2015), github.com/karolpiczak/ESC-50, CC BY-NC 3.0 (non-commercial).
