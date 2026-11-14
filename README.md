# BioSpectra

**Untangle noisy bioacoustics in 3D. Every separation you make trains the TinyML model on the sensor.**

Edge sensors like the Arduino Nano 33 BLE Sense sit in forests and wetlands and record short audio clips. A rare frog, an invasive hornet and a distant chainsaw end up mixed with rain and wind. Small neural networks on the node fail at this signal-to-noise ratio. People are good at it, if you give them the right tools.

BioSpectra turns each 5-second clip into a 3D sound sculpture (time × frequency × loudness). Players carve it apart with spatial brushes, harmonic tuning forks, band knives and rhythm matching. Each finished separation is a ground-truth source-separation mask. Those masks train a tiny int8 model that is exported as an Arduino header and pushed back to the nodes.

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
