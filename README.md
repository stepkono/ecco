# BioSpectra

**Untangle noisy bioacoustics in 3D. Every separation you make trains the TinyML model on the sensor.**

Edge sensors like the Arduino Nano 33 BLE Sense sit in forests and wetlands and record short audio clips. A rare frog, an invasive hornet and a distant chainsaw end up mixed with rain and wind. Small neural networks on the node fail at this signal-to-noise ratio. People are good at it, if you give them the right tools.

BioSpectra turns each 5-second clip into a 3D sound sculpture (time × frequency × loudness). Players carve it apart with spatial brushes, harmonic tuning forks, band knives and rhythm matching. Each finished separation is a ground-truth source-separation mask. Those masks train a tiny int8 model that is exported as an Arduino header and pushed back to the nodes.

The repository has two parts:

* **Web game prototype** (TypeScript, Vite, Three.js) in `src/`, described first below.
* **Python pipeline** for the Arduino UNO Q listening post in `core/`, `device/`, `bench/` and `tools/`. Phases 0 and 1 and the developer console are done. See [Python pipeline](#python-pipeline-uno-q-listening-post).

**How the whole system works, and how to run it: [docs/SYSTEM.md](docs/SYSTEM.md).**

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Production build: `npm run build` (static files in `dist/`, hostable from any path).

## Demo flow (3 minutes)

1. **W-03 Treefrog in drizzle.** Brush (`B`) the pale ridges at the back. Play the mixture (`Space`), then your layer (`L`). Watch the SI-SDR bar climb toward the ceiling tick.
2. **O-11 Hornet patrol.** Switch to *Top* view and enable *Whiten*. Pick the fork (`F`) and click the lowest amber line of the hornet near 110 Hz at about 2 s. One click tracks the wing-beat through its Doppler bend and claims the whole harmonic comb. The species unlocks.
3. **S-01 Storm chorus.** Press *Rain split (HPSS)*, then *Find strands (NMF)*, and listen to the strands. Use Echo (`E`): drag a box around one frog call and it finds the call rhythm and copies the mask to every repeat.
4. **Contribute**, then open **Edge AI Lab**. Add simulated community clips, train, and look at the per-node evaluation table. *Push to current node* shows what the int8 model hears (blue badge). *Adopt* an AI layer, fix its mistakes, contribute again, retrain. That correction loop is the Foldit mechanic.
5. **Download Arduino header** for a dependency-free C inference routine with the int8 weights.

## The approach

### 1. Representation: STFT, mel-warped for the eye

The edge node records 16 kHz mono (the Nano 33 BLE Sense PDM rate). Each clip goes through a short-time Fourier transform with a 512-point Hann window and a 128-sample hop (32 ms window, 8 ms hop). That gives 626 frames × 257 frequency bins.

* **Height** is loudness in dB, mapped to the dynamic range of the clip and gently gamma-shaped so calls rise above the rain bed.
* **Depth** is frequency on a mel scale, so low animal calls get room on screen. The mask itself stays on the linear STFT grid.
* **Whiten** subtracts a per-frequency noise floor (20th percentile over time). Faint calls then stand out from stationary noise.
* **Unfold** lifts each separated layer into its own sheet, so a finished separation literally comes apart in 3D.

### 2. Separation = time-frequency masking, which the player designs

Every layer is a soft mask *M(t, f) ∈ [0, 1]*. The separated audio is the inverse STFT of *M · X* (weighted overlap-add, reconstruction error below −140 dB). Masks of all layers are normalised so they never claim more than 100 % of a cell. Energy is conserved and the residual is what nobody claimed.

The tools are classic DSP operators presented as sculpting tools:

| Tool | What it does | DSP behind it |
|---|---|---|
| **Brush** | Soft spatial brush on the surface | Gaussian-falloff mask painting, ray-marched picking on the height field |
| **Grip** | Brush only sticks to real energy | Soft gate on dB above the per-bin noise floor |
| **Tuning fork** | Click one harmonic, get the whole comb | Pitch tracking by harmonic comb contrast (peaks vs. inter-harmonic valleys), then a harmonic comb mask along the track |
| **Band knife** | Claim a time × frequency box | Gated rectangular mask |
| **Echo** | Box one call, find every repeat | Normalised cross-correlation of the call template along time, non-maximum suppression, rhythm period estimate |
| **Rain split** | Pull rain streaks out | Harmonic/percussive separation by median filtering (Fitzgerald 2010) |
| **Strands** | Machine-proposed building blocks | KL-divergence NMF (10 components, Lee & Seung updates) in a Web Worker, each strand as a Wiener-style soft mask |

### 3. Scoring against hidden ground truth

Levels are built like source-separation datasets: real recordings are mixed at known gains, so the clean stems are known. Each target is scored with **SI-SDR** (scale-invariant signal-to-distortion ratio) for three cases:

* **mix**: the raw mixture, the baseline
* **you**: the player's separation
* **ceiling**: the *ideal ratio mask*, the best any STFT magnitude mask can achieve on this clip

Stars measure how much of the gap between mix and ceiling the player closed (40 %, 60 %, 80 %). One star unlocks the species in the ecosystem.

### 4. How far does classic Fourier masking get us?

Measured on the five levels in this repo (SI-SDR in dB):

| Node | Target | Raw mix | Ideal STFT mask (ceiling) | Gain available |
|---|---|---:|---:|---:|
| W-03 | Treefrog | 0.1 | 12.8 | +12.7 |
| O-11 | Hornet | −3.1 | 6.8 | +9.9 |
| O-11 | Cicada | −8.0 | 14.9 | +22.9 |
| F-07 | Marsh frog | 2.4 | 13.6 | +11.2 |
| F-07 | Chainsaw | −6.9 | 5.3 | +12.2 |
| S-01 | Treefrog | −6.3 | 11.9 | +18.2 |
| S-01 | Hornet | −8.7 | 1.4 | +10.1 |
| S-01 | Chainsaw | −11.9 | 1.2 | +13.1 |
| R-22 | Sedge frog | 3.9 | 14.6 | +10.7 |

So the answer to "how far can the Fourier approach get us" is: **very far, if someone chooses the right mask**. Masking in the STFT domain has 10 to 23 dB of headroom on every clip here. Bioacoustic sources are sparse in time-frequency. A frog call, a wing-beat comb and rain streaks rarely occupy the same cell. The hard part is not the transform. The hard part is *deciding which cells belong to whom* at low SNR, and that is exactly where human pattern recognition beats a small network. It is also exactly the label the network needs.

Where it breaks down: in **S-01 Storm chorus** the hornet, the chainsaw and the wind all pile into the same 100 to 1000 Hz band. Even the ideal mask only reaches about 1 dB there, because a magnitude mask cannot split two sources inside one cell. Next steps for that regime are phase-aware complex masks, a finer frequency resolution in the low band, or learned filterbanks (Conv-TasNet style), trained on the same human-made labels.

### 5. From human masks to the sensor (TinyML loop)

* **Features:** 32 log-mel bands (50 Hz to 8 kHz), per-clip median-normalised per band, 5-frame context (±16 ms) = 160 inputs. These are cheap to compute on a Cortex-M4 with CMSIS-DSP.
* **Model:** 160 → 64 ReLU → 128 sigmoid (4 classes × 32 mel masks). 18,624 parameters.
* **Training:** binary cross-entropy against the player masks projected onto the mel bands, Adam, in a Web Worker in the browser. Human contributions count double.
* **Quantisation:** post-training int8 with per-tensor scales, int32 accumulators, calibration on the training set. 18.8 KB, about 18k MACs per 8 ms frame. The Nano 33 BLE Sense has 1 MB flash and 256 KB RAM.
* **Export:** `biospectra_model.h` with the int8 weights and a plain C `bs_infer()` that mirrors the integer arithmetic of the in-browser simulation.
* **Evaluation:** the int8 model is scored on every node with the same SI-SDR metric. Each retraining round adds a column, so you can see the sensor improve.

With 40 simulated community clips and 12 epochs, round 1 already gains +6 to +16 dB on frogs and cicadas. The hornet is still weak, and the lab makes that visible. That is the signal to send players to the hornet nodes.

**Simulated community clips** are random re-mixes of the stems labelled with deliberately imperfect "human-like" masks (soft-thresholded ideal masks with missed regions). They stand in for a crowd of players during a demo and are clearly separated from real human contributions in the UI and in the exported dataset.

### 6. Data you can take away

* **Export dataset (.json):** features and masks (uint8), STFT and mel parameters, class list, origin of every clip (human or simulated).
* **Upload clip:** load any field recording. It is resampled to 16 kHz mono like the node. There is no ground truth, so your separation *is* the label.

## Audio sources

All recordings come from Wikimedia Commons and were cut to short 16 kHz mono clips. The hornet and wind are procedurally synthesised in the browser: the hornet as a ~110 Hz wing-beat harmonic series with jitter, 1/r attenuation and Doppler shift during a fly-by, and the wind as gusty low-passed noise with mic rumble.

| Clip | Species / sound | Author | License |
|---|---|---|---|
| `frog_hyla_cinerea.wav` | Green treefrog (*Hyla cinerea*) | Fredlyfish4 | CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:Hyla_cinerea_call_audio.ogg) |
| `frog_pelophylax.wav` | Marsh frog (*Pelophylax ridibundus*) | Llivermore | CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Marsh_frog_(Pelophylax_ridibundus)_call.ogg) |
| `frog_litoria_fallax.wav` | Eastern sedge frog (*Litoria fallax*) | Aviceda | CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:Litoria_fallax_jul08.ogg) |
| `cicada_orni.wav` | Grey cicada (*Cicada orni*) | DavidDelon | Public domain · [source](https://commons.wikimedia.org/wiki/File:Cicada_orni.ogg) |
| `chainsaw_a.wav` | Chainsaw | ezwa | Public domain · [source](https://commons.wikimedia.org/wiki/File:Chainsaw_3.ogg) |
| `chainsaw_b.wav` | Chainsaw | ezwa | Public domain · [source](https://commons.wikimedia.org/wiki/File:Chainsaw_1.ogg) |
| `rain_drops.wav` | Heavy rain | Gravity Sound | CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Rain_drops_(Gravity_Sound).wav) |
| `rain_light.wav` | Light rain | Effib | CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:Sound_of_rain.ogg) |

The derived clips in `public/audio` keep the license of their source.

## Project layout

```
src/dsp/       FFT, STFT/ISTFT, HPSS, NMF, mel filterbank, SI-SDR, hornet & wind synthesis
src/game/      species catalog, levels and mixing, session (layers, scoring), sculpting tools
src/view/      Three.js height-field renderer, ray-marched picking, overlays
src/ml/        TinyML model (train, int8 quantise, C export), dataset builder, worker client
src/ui/        Edge AI Lab, ecosystem, intro
src/worker.ts  NMF, community simulation and training off the main thread
```

## Keyboard

`B` brush · `F` fork · `K` knife · `E` echo · `V` view · `Shift` erase / steady comb · `[` `]` brush size · `Space` play mix · `L` play layer · `R` play residual · `1`–`9` select layer · `Ctrl/Cmd+Z` undo · right-drag orbit · wheel zoom

---

## Python pipeline (UNO Q listening post)

The listening post runs on an Arduino UNO Q (Debian, ARM64, 2 GB RAM). It listens, embeds sound with a frozen audio model and decides with a few-shot head: **quiet**, **recognized** or **needs help**. Uncertain clips go to players. Their labels update class prototypes, which the device downloads. No retraining.

Everything runs on a laptop first. Later only the audio input and the light output change.

### Setup

Python 3.11 and ffmpeg are required.

```bash
uv venv --python 3.11 .venv
```

```bash
uv pip install --python .venv -r requirements.txt
```

Models download on first use: YAMNet from Kaggle (no account needed), BirdNET 2.4 from Zenodo (77 MB, int8 46 MB), Perch 2.0 (~380 MB). No secrets are needed so far. If a later phase needs keys, they go into `.env`, which is git-ignored.

### Commands

| What | Command |
|---|---|
| Phase 0 bench (Gradio, http://127.0.0.1:7860, moves to the next free port if busy) | `.venv/bin/python -m bench.app` (or `--port 7870`) |
| Measure one model in a fresh process | `.venv/bin/python -m core.measure --model birdnet-2.4 --threads 4` |
| Mix a call into noise with ground truth | `.venv/bin/python -m tools.mixer --call call.wav --noise rain.ogg --label green_treefrog --snr 0` |
| Cut long recordings into a test set | `.venv/bin/python -m tools.make_test_set --src data/raw --out data/testset` |
| Unit tests | `.venv/bin/python -m pytest -q tests` |

### Layout

```
core/            shared pipeline (bench now, device and backend later)
  audio.py       ffmpeg decode, resample, windows, STFT/mel spectrograms, apply_mask
  gates.py       energy gate, privacy gate (YAMNet speech classes)
  heads.py       PrototypeHead, KNNHead, decision rule, prototype JSON
  state.py       QUIET / RECOGNIZED / NEEDS_HELP with hold time
  queue.py       SQLite + WAV queue of uncertain clips
  pipeline.py    one model over one clip
  measure.py     isolated latency and peak-memory measurement
  models/        AudioModel interface, registry, adapters (yamnet, birdnet, perch)
bench/           Phase 0 Gradio bench
tools/           mixer, test-set builder
config.yaml      model id, thresholds, paths
```

**One interface for all models.** Every adapter implements `load`, `embed`, `classify` (plus `embed_and_scores` for one inference per window) and reads sample rate, window length and embedding size from the model or its package at load time. These values are logged when a model loads. Adding a model means one adapter file and one registry line in `core/models/__init__.py`. A model that fails to load is marked unavailable with the reason, and the others keep working.

### Phase 0 report

Measured on a MacBook (Apple Silicon, 16 GB), 4 CPU threads, each model alone in a fresh process (`core.measure`). One inference per window gives both the embedding and the class scores.

| Model id | Input | Embedding | Classes | Load | ms per window | Real-time factor | Peak RAM | 2 GB board |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `yamnet-tflite` | 16 kHz, 0.975 s | 1024 (int8) | 521 | 0.6 s | 0.9 | 1,100× | 88 MB | fits comfortably |
| `yamnet` | 16 kHz, 0.975 s | 1024 | 521 | 6.8 s | 3.5 | 277× | 617 MB | fits comfortably |
| `birdnet-2.4` | 48 kHz, 3 s | 1024 | 6,522 | 0.3 s | 21.8 | 138× | 162 MB | fits comfortably |
| `birdnet-2.4-int8` | 48 kHz, 3 s | 1024 | 6,522 | 0.1 s | 20.8 | 144× | 145 MB | fits comfortably |
| `perch-2.0` | 32 kHz, 5 s | 1536 | 14,795 | 5.6 s | 400 | 12.5× | 1,263 to 1,440 MB | tight |

Peak RAM includes the Python interpreter (~32 MB) and, for `yamnet` and `perch-2.0`, TensorFlow. The UNO Q's Cortex-A53 cores are several times slower than a laptop, so read latencies as lower bounds. Even at 10× slower, BirdNET stays well inside real time. Load time excludes the one-time download. Peak RAM varies by about 10 % between runs.

**What each model heard** on the treefrog clip: BirdNET named *Green Treefrog* at 0.997 (0.995 in int8). Perch named *Hyla cinerea* as its top class. YAMNet said *Frog*. The int8 YAMNet TFLite is much weaker on classes (it called a chainsaw "Animal / Cat"), but its embeddings still separate classes well (see below).

**One label is enough.** In the bench, labelling one recording of the green treefrog (mp3) as a new class made a second, different recording (mp4) land at cosine similarity 0.89 (YAMNet) and 0.91 (BirdNET). Both models switched from *unknown* to *recognized*.

**Few-shot smoke test** (`data/testset`, 59 clips in 6 classes, 5 random splits):

| Model | 1-shot accuracy | 3-shot | Held-out class flagged unknown | Known clips wrongly flagged unknown (3-shot) |
|---|---:|---:|---:|---:|
| `yamnet` | 0.96 | 0.99 | 0.80 to 1.00 | 0.07 |
| `yamnet-tflite` | 0.97 | 0.97 | 0.58 to 0.98 | 0.06 |
| `birdnet-2.4` | 1.00 | 1.00 | 1.00 | 0.01 |
| `birdnet-2.4-int8` | 1.00 | 1.00 | 1.00 | 0.02 |
| `perch-2.0` | 1.00 | 1.00 | 1.00 | 0.25 |

These numbers are optimistic. Each class comes from one or two recordings, cut into overlapping 5 s chunks, so training and test clips share a lot. Treat it as a pipeline check, not a model ranking. A fair comparison needs different recordings per class (Xeno-canto).

**Fair comparison on ESC-50** (18 nature-relevant classes, 720 clips of 5 s: frog, crickets, insects, chirping birds, crow, rooster, rain, wind, thunderstorm, water drops, sea waves, crackling fire, chainsaw, hand saw, engine, airplane, footsteps, dog). Training and test clips never come from the same source recording. 5 random splits, prototype head:

| Model | 1-shot | 3-shot | 5-shot | Runs on the board |
|---|---:|---:|---:|---|
| `perch-2.0` | 0.66 | 0.81 | **0.88** | no (TensorFlow, ~1.4 GB) |
| `yamnet-tflite` | **0.68** | **0.82** | 0.86 | yes, 9 ms per window |
| `yamnet` | 0.63 | 0.80 | 0.83 | no (TensorFlow) |
| `birdnet-2.4` | 0.42 | 0.63 | 0.70 | yes, 303 ms per window |
| `birdnet-2.4-int8` | 0.42 | 0.63 | 0.71 | yes, 278 ms per window |

Chance level is 0.06. BirdNET's embeddings are tuned to bird species. They separate rain, engines and saws much worse than the general-purpose YAMNet. The small int8 YAMNet is the best model the board can run, and it is 30× cheaper than BirdNET there.

Perch's high "known flagged unknown" rate shows that its cosine similarities sit lower than BirdNET's. **`T_known` must be calibrated per model.** On ESC-50 with `T_known` 0.75, known clips were wrongly called unknown 26 % (yamnet-tflite, 5-shot), 67 % (BirdNET) and 92 % (Perch) of the time. The trust knob on the device covers this, but each model needs its own default.

**Privacy gate calibration.** On synthetic speech (macOS `say`, also mixed into rain) YAMNet's speech score reaches about 1.0 in 4 to 5 of 5 windows. Animals and noise only spike in single windows: one treefrog window scored *Speech 0.50*. The rule is therefore: drop the clip if **2 or more windows ≥ 0.5** or **any window ≥ 0.8**. Result: 3/3 speech clips dropped, 0 of 43 frog, cicada and rain clips dropped, 2 of 16 chainsaw clips dropped (YAMNet scores up to 0.96 there, which suggests real voices in that recording). More real speech recordings are needed before trusting this in the field.

**Recommendation for Phase 1** (revised after ESC-50): `yamnet-tflite` as the device model. It had the best few-shot accuracy of the models that fit the board, needs 9 ms and 95 MB on the UNO Q, needs no TensorFlow and also serves as the speech filter, so one model does both jobs. `birdnet-2.4-int8` stays an option for fine-grained bird species. Perch is the most accurate, but at ~1.4 GB with TensorFlow it does not fit the 2 GB board. BirdNET weights are **non-commercial**, which is fine for the hackathon.

### Assumptions and open points

* `yamnet` (TF) in the privacy gate pulls TensorFlow (~550 MB) into the process. On the device, use `yamnet-tflite` instead (change `gates.privacy.model_id`). Its speech scores were not calibrated separately yet.
* BirdNET thread control and the single-inference path use two private details of the `birdnet` 1.4.0 backend. Both fall back to the public behaviour if the package changes.
* The `Rain drops (Gravity Sound)` recording contains musical tones below 1.5 kHz (YAMNet: "Music 0.98"). It was removed from the test set. The web game still uses it as a rain stem and should switch to a cleaner rain recording.
* Questions from the brief that are still open: the three local target species and noise types, laptop OS and GPU for the demo, and whether game and backend share one laptop.

### Running on the Arduino UNO Q

Tested on a UNO Q **ABX00162** (2 GB RAM, of which ~1.7 GB visible, ~1.27 GB free at idle), Debian 13.1, Python 3.13.5, 4 cores.

**Access without the network.** With the board on USB-C, it shows up as an ADB device (`arduino-cli board list` lists it as `arduino:zephyr:unoq`). `adb shell` gives a shell as user `arduino` without a password. Any `adb` works, for example the one bundled with scrcpy. SSH only works when the Mac and the board are on the same network and the network allows device-to-device traffic. Many event Wi-Fis do not. A phone hotspot for both devices is the quickest fix.

**Setup** (on the board, no sudo):

```bash
git clone https://github.com/stepkono/spetrum.git && bash spetrum/tools/board_setup.sh --measure
```

The script installs `uv` from its GitHub release (Debian on the board has no `python3-venv`), creates `.venv` and installs `requirements-device.txt` (LiteRT only, no TensorFlow). `sudo apt install ffmpeg` is only needed for mp3/mp4 decoding.

**Measured on the board** (4 threads, fresh process each):

| Model | ms per window | Real-time factor | Peak RAM | Load (cached) |
|---|---:|---:|---:|---:|
| `yamnet-tflite` | 8.9 (0.975 s window) | 109× | 95 MB | 2.4 s |
| `birdnet-2.4-int8` | 278 (3 s window) | 10.8× | 146 MB | 0.9 s |
| `birdnet-2.4` | 303 (3 s window) | 9.9× | 152 MB | |

Both device models together need ~250 MB and less than 0.3 s per 3 s of audio. The board is about 13× slower than an Apple Silicon laptop for BirdNET. Perch 2.0 needs TensorFlow and ~1.4 GB, so it is not installed on the board.

**Lights.** The RGB LED 1 (`/sys/class/leds/unoq:user-red1`, `-green1`, `-blue1`) is writable by the `arduino` user (group `gpiod`). Quiet, recognized and needs help can be shown from Python without the microcontroller.

**Microphone.** The board has no microphone and only one USB-C port, which also powers it. Use a **USB-C hub with Power Delivery**: the hub's cable into the board, a 5 V / 3 A USB-C power supply into the hub's PD port, the USB microphone or USB camera (it has a mic) into a USB-A port of the hub. Never use an unpowered hub. Plug the microphone in before starting the program. Check with `arecord -l`. While the hub occupies the port, ADB over USB is not available, so the board must be reachable over Wi-Fi.

**Borrowed board? Clean up before returning it.** Development access uses an SSH key added over ADB (tagged `biospectra-dev`), because the board's password belongs to whoever set it up. One command removes the key, the code, the Python environment, model caches, recordings and the Wi-Fi priority change:

```bash
ssh arduino@10.0.41.141 'bash -s' < tools/board_cleanup.sh
```

A full reflash with Arduino's flashing tool is still the cleanest hand-over.

### Phase 1: the listening post (`device/`)

```bash
python -m device.main --source mic                                   # live (UNO Q: camera mic via arecord)
python -m device.main --source playlist --path data/playlist --speed 4
python -m device.main --source file --path clip.wav
```

On the board, `bash tools/device_ctl.sh start|stop|status|log` runs it in the background. The light page is at `http://<device>:8765`: the light, the trust knob, prototype version, queue size and recent decisions. On the UNO Q, RGB LED 1 shows the state too (off = quiet, green = recognized, amber = needs help).

**One decision per 5 s clip:** energy gate, then privacy gate (speech is dropped and never queued), then embedding and prototype head. A recognized animal turns the light green. Recognized noise (`noise:rain`, `noise:wind` ...) stays quiet. Anything else is "needs help", and the clip goes into the SQLite queue (at most one per 10 s of audio). With `yamnet-tflite` as both device model and speech filter, one inference per window serves both.

**Trust knob:** 0..1 maps to `T_known` 0.40 to 0.95. Defaults come from `python -m tools.calibrate_threshold` (ESC-50, 5 examples per class, new classes held out):

| Model | Suggested `T_known` | Known sounds recognized | New sounds sent to players |
|---|---:|---:|---:|
| `yamnet-tflite` | 0.80 | 65 % | 88 % |
| `birdnet-2.4-int8` | 0.40 | 38 % | 85 % |

Noise uses a lower bar (`t_noise` 0.65): a missed gust costs nothing, a false alarm costs player time.

**Sync** (offline first): every 5 s, queued clips are uploaded to `POST /devices/{id}/clips` and newer prototypes are fetched from `GET /prototypes/latest?model_id=`. They swap in without a restart and are cached locally. Without a backend (`device.backend_url` empty), the queue keeps growing. A newer local file `data/prototypes/<model>.prototype.json` is picked up too, so prototypes exported from the bench reach the device without a backend.

**Demo data:** `python -m tools.make_prototypes` builds starting prototypes from ESC-50 (frog, chirping birds, crow, plus rain/wind/engine as noise). `python -m tools.make_playlist` builds 8 clips from other recordings with the expected light per clip.

**Acceptance results** (`pytest tests/test_device.py` on the Mac, the same playlist on the UNO Q):

| Clip | Light on the UNO Q |
|---|---|
| frog | recognized (0.88) |
| rain | quiet (`noise:rain` 0.85) |
| crickets (unknown) | needs help, queued |
| speech | quiet, dropped, not queued |
| chirping birds | recognized (0.92) |
| silence | quiet |
| insects (unknown) | needs help, queued |
| wind | quiet (`noise:wind` 0.76) |

8/8 as expected. About 100 ms per 5 s clip and 165 MB RAM on the board. A test backend's newer prototypes swapped in within 5 s, and queued clips uploaded. Live on the camera mic, the venue's chatter is dropped as speech. The mic gain is lowered to 60 % at start, because 100 % clipped.

### Developer console (`device/console.py`)

One web page to control the listening post:

```bash
ssh arduino@10.0.41.141 'bash ~/spetrum/tools/device_ctl.sh start'   # console, idle
ssh arduino@10.0.41.141 'bash ~/spetrum/tools/device_ctl.sh url'     # address with access token
```

* **Live:** start the mic listener or the demo playlist, stop it, move the trust knob, watch the light and every decision stream in.
* **Analyze files on the board:** drop wav, mp3, m4a, mp4, ogg or flac files. The browser converts them to 48 kHz WAV (the board has no ffmpeg) and the board's models analyze every 5 s segment exactly like live audio: gates, YAMNet top labels per window, prototype similarities and the resulting light. Optional BirdNET labels. Nothing is queued and the light does not change.
* **Clips on the board:** play, download one clip or all as a zip (with `clips.json` metadata), delete.

The API needs the token from `data/console_token` on the board, because the board sits on a shared network and queued clips are recordings. Standard library only (http.server and Server-Sent Events). Locally: `python -m device.console --port 8766 --no-token`.
